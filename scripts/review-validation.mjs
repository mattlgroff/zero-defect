const cleanReport = "I found no issues. Looks good to me. Ready to ship.";

export function validateFinding(finding) {
  const judgment = /^(MUST FIX|SHOULD FIX|STYLE GATE) \| [^\n]+:\d+[^\n]* \| [^\n]+ \| Defect: \S[^\n]* \| Impact: \S[^\n]* \| Repair: \S[^\n]*$/iu;
  const style = /^STYLE GATE \| (em dash U\+2014|negative parallelism) \| \d+ \| [^\n]+:\d+[^\n]* \| (?:[^\n]+ \| )?Repair: \S[^\n]*$/iu;
  const context = /^CONTEXT \| (?:Informational character counts: )?U\+2013: \d+; U\+2018: \d+; U\+2019: \d+; U\+201C: \d+; U\+201D: \d+\.?$/u;
  if (typeof finding !== "string" ||
      !(judgment.test(finding) || style.test(finding) || finding === "STYLE GATE | clean" || context.test(finding))) {
    throw new Error("reviewer returned a malformed canonical finding or style record");
  }
}

function matrixRows(matrix) {
  return matrix.split(/\r?\n/u).filter((line) => line.startsWith("|")).map((line) => {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = cells[0]?.replace(/[*`]/gu, "");
    return /^R-\d+$/u.test(id) && cells.length >= 5 ? id : undefined;
  }).filter(Boolean);
}

export function validateMece(assessment, findings) {
  if (!assessment || typeof assessment !== "object" || Array.isArray(assessment) ||
      Object.keys(assessment).sort().join(",") !== "applicable,coverage,matrix,scope" ||
      typeof assessment.applicable !== "boolean" ||
      !["verified", "unverified", "not-applicable"].includes(assessment.coverage) ||
      typeof assessment.scope !== "string" || typeof assessment.matrix !== "string") {
    throw new Error("MECE assessment did not match the required schema");
  }
  if (assessment.applicable) {
    if (assessment.coverage === "not-applicable" || !assessment.scope.trim() || matrixRows(assessment.matrix).length === 0) {
      throw new Error("applicable MECE assessment omitted its scope, coverage, or matrix rows");
    }
  } else if (assessment.coverage !== "not-applicable" || assessment.scope !== "" ||
             assessment.matrix !== "" || findings.length > 0) {
    throw new Error("not-applicable MECE assessment contained coverage, a matrix, or findings");
  }
}

export function validateFinalReport(report, mece, emDashCount) {
  if (mece.applicable) {
    const sections = report.split(/^MECE responsibility matrix\s*$/mu);
    const observed = sections[1]?.split(/^Proposed boundary changes[^\n]*$/mu)[0];
    if (sections.length !== 2 || !/^Scope: \S/mu.test(observed) ||
        !/^Coverage: (verified|unverified)\b/mu.test(observed)) {
      throw new Error("adjudicator omitted the applicable MECE matrix, scope, or coverage statement");
    }
    const reportedRows = new Set(matrixRows(observed));
    for (const id of new Set(matrixRows(mece.matrix))) {
      if (!reportedRows.has(id)) throw new Error(`adjudicator omitted observed MECE row ${id}`);
    }
    if (mece.coverage === "unverified" && !/^Coverage: unverified\b/mu.test(observed)) {
      throw new Error("adjudicator discarded the MECE coverage limitation");
    }
  } else if (/^MECE responsibility matrix$/mu.test(report)) {
    throw new Error("adjudicator added a matrix for a non-applicable MECE assessment");
  }
  if (report === cleanReport) {
    if (emDashCount > 0) throw new Error("adjudicator returned clean despite the verified style violation");
    return;
  }
  const lines = report.split(/\r?\n/u);
  const verdict = lines[0];
  if (!/^Verdict: (Ready|Not ready(?: \((?:style gate(?:, \d+ must fix)?|\d+ must fix)\))?)$/u.test(verdict)) {
    throw new Error("adjudicator report has an invalid verdict");
  }
  const style = report.match(/^Style gate: (PASS|FAIL)$/mu)?.[1];
  if (!style || lines.filter((line) => line.startsWith("Style gate:")).length !== 1) {
    throw new Error("adjudicator report omitted a valid style gate");
  }
  const reportedCount = report.match(/Em dash U\+2014: (\d+)/u)?.[1];
  if (emDashCount > 0 || reportedCount !== undefined) {
    if (style !== "FAIL" || Number(reportedCount) !== emDashCount) {
      throw new Error("adjudicator contradicted the verified em dash census");
    }
  }
  const definitions = [...report.matchAll(/^- (ZD-\d+) \|/gmu)].map((match) => match[1]);
  definitions.forEach((id, index) => {
    if (id !== `ZD-${String(index + 1).padStart(3, "0")}`) {
      throw new Error("adjudicator finding identifiers were duplicated, missing, or out of order");
    }
  });
  let section;
  let mustFix = 0;
  let styleIssues = 0;
  for (const line of lines.slice(1)) {
    if (/^Style gate: /u.test(line)) section = "style";
    else if (["Must fix", "Should fix", "MECE responsibility matrix"].includes(line)) section = line;
    else if (line.startsWith("- ") && ["style", "Must fix", "Should fix"].includes(section)) {
      if (!/^- ZD-\d+ \|/u.test(line)) throw new Error("adjudicator issue omitted its finding identifier");
      if (section === "Must fix") mustFix += 1;
      if (section === "style") styleIssues += 1;
    }
  }
  if ((style === "FAIL") !== (styleIssues > 0)) throw new Error("adjudicator style gate disagreed with its issues");
  const blockers = [style === "FAIL" ? "style gate" : undefined, mustFix ? `${mustFix} must fix` : undefined].filter(Boolean);
  const expected = blockers.length ? `Verdict: Not ready (${blockers.join(", ")})` : "Verdict: Ready";
  if (verdict !== expected) throw new Error("adjudicator verdict contradicted its style gate or Must fix findings");
}
