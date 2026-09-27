import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "run-codex-review.mjs");

function run(assignment, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, "--stdin"], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("close", (code) => resolve({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
    child.stdin.end(JSON.stringify(assignment));
  });
}

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zero-defect-supporting-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const document = path.join(directory, "proposal.md");
  const facts = path.join(directory, "facts.md");
  const log = path.join(directory, "calls.jsonl");
  await writeFile(document, "Work starts October 5.");
  // An em dash in the supporting file must not count toward the deliverable's style gate.
  await writeFile(facts, `Start date${String.fromCodePoint(0x2014)}not agreed.`);
  const executable = path.join(directory, "codex.mjs");
  await writeFile(executable, `#!/usr/bin/env node
import { appendFileSync } from "node:fs";
let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;
appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args: process.argv.slice(2), prompt }) + "\\n");
const adjudicator = prompt.startsWith("You are the final adjudicator");
let text = JSON.stringify({ status: "complete", findings: [], reason: "" });
if (prompt.startsWith("You are the mece reviewer")) text = JSON.stringify({ status: "complete", findings: [], reason: "", mece: { applicable: false, coverage: "not-applicable", scope: "", matrix: "" } });
if (adjudicator) text = "I found no issues. Looks good to me. Ready to ship.";
console.log(JSON.stringify({ type: "item.completed", item: { type: "agent_message", text } }));
`);
  await chmod(executable, 0o755);
  const base = { paths: [document], audience: "test", purpose: "test", desiredAction: "test", approvedCommitments: "none", confidentiality: "synthetic", research: "denied" };
  return { document, facts, log, executable, base };
}

async function calls(log) {
  const { readFile } = await import("node:fs/promises");
  return (await readFile(log, "utf8")).trim().split("\n").map((line) => JSON.parse(line));
}

test("supporting material reaches every reviewer and the adjudicator but not the style census", async (t) => {
  const f = await fixture(t);
  const result = await run({ ...f.base, supportingPaths: [f.facts] }, { ...process.env, CODEX_BIN: f.executable });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "complete");
  const recorded = await calls(f.log);
  assert.equal(recorded.length, 9);
  for (const call of recorded) {
    assert.ok(call.prompt.includes(`- Supporting material: ${f.facts} (evidence the deliverable was written from`));
    assert.ok(call.prompt.includes("- Authoritative style-gate census: U+2014 em dash: 0;"));
  }
});

test("without supporting material, reviewers are told to judge claims only against the deliverable", async (t) => {
  const f = await fixture(t);
  const result = await run(f.base, { ...process.env, CODEX_BIN: f.executable });
  assert.equal(result.code, 0, result.stderr);
  for (const call of await calls(f.log)) assert.ok(call.prompt.includes("- Supporting material: none supplied (judge claims only against the deliverable itself)"));
});

test("reviewers run on GPT-6 Astra by default and the model can be overridden or left to Codex", async (t) => {
  const f = await fixture(t);
  await run(f.base, { ...process.env, CODEX_BIN: f.executable, ZERO_DEFECT_CODEX_MODEL: undefined });
  for (const call of await calls(f.log)) assert.deepEqual(call.args.slice(1, 3), ["-m", "gpt-6-astra"]);
  await rm(f.log);
  await run(f.base, { ...process.env, CODEX_BIN: f.executable, ZERO_DEFECT_CODEX_MODEL: "" });
  for (const call of await calls(f.log)) assert.ok(!call.args.includes("-m"));
});

test("rejects a supporting file that is not readable text before launching Codex", async (t) => {
  const f = await fixture(t);
  const binary = path.join(path.dirname(f.document), "facts.pdf");
  await writeFile(binary, "%PDF-1.7 binary");
  const result = await run({ ...f.base, supportingPaths: [binary] }, { ...process.env, CODEX_BIN: f.executable });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /supporting file .*facts\.pdf/u);
});

test("rejects a supportingPaths value that is not an array", async (t) => {
  const f = await fixture(t);
  const result = await run({ ...f.base, supportingPaths: f.facts }, { ...process.env, CODEX_BIN: f.executable });
  assert.equal(result.code, 2);
  assert.match(result.stderr, /supportingPaths must be an array/u);
});
