# Zero Defect

Zero Defect is an adversarial review plugin for English-language business deliverables. Eight focused reviewers inspect promises, evidence, numbers, contradictions, decision gaps, language precision, AI-writing slop, and MECE responsibility coverage before another person relies on the work.

It is designed for proposals, emails, candidate summaries, product plans, reports, requirements, spreadsheets, presentations, and similar knowledge work. It diagnoses defects and gives short repair directions. It does not rewrite the deliverable unless you separately request revision.

## Claude and Codex distributions

This repository contains two independently versioned packages:

| Host | Package root | Orchestration |
| --- | --- | --- |
| Claude Cowork and Claude Code | `plugins/zero-defect/` | The original skill invokes eight registered Claude plugin agents by name. |
| Codex | repository root | A thin adapter launches eight concurrent, ephemeral, read-only `codex exec` reviewers through a Codex-only collector. |

The reviewer prompts, review contract, severity rules, and report format exist only in the Claude package directory and are the canonical source for both hosts. The Codex adapter and collector contain only Codex-specific orchestration. Each reviewer gets the absolute canonical prompt paths, uses a read-only sandbox, and returns its result to the parent for the same adjudication process.

Codex requires Node.js 22 or newer and an installed, authenticated Codex CLI. The collector uses independent `codex exec` processes instead of native noninteractive subagents because current Codex releases can lose subagent tasks or results in headless execution. On sandboxed hosts, launching authenticated nested Codex processes may require approval; denying it makes the review incomplete.

The current releases are **Claude 1.5.0** and **Codex 0.2.0**. Both include the MECE responsibility lens. The distributions remain independently versioned.

### Install in Codex from GitHub

```sh
codex plugin marketplace add mattlgroff/zero-defect --ref master
codex plugin add zero-defect@zero-defect-codex
```

Start a new Codex task, then invoke `$zero-defect:zero-defect` or ask naturally for a Zero Defect review.

### Codex input formats

The Codex collector accepts readable UTF-8 text such as Markdown, HTML, CSV, and TSV. Native PDF and Office files require an accessible text export that preserves the content needed for review. Empty files, binary formats, invalid encodings, and non-file paths are rejected before reviewer dispatch. Raw file bytes are not treated as a document's readable text.

### Test a local Codex checkout

```sh
codex plugin marketplace add /absolute/path/to/zero-defect
codex plugin add zero-defect@zero-defect-codex
```

## Install the ZIP for a Claude Team organization

Cowork and Skills must be enabled for the organization. An Owner or Primary Owner can install the plugin:

Download `zero-defect-1.5.0.zip` from the [Claude 1.5.0 release](https://github.com/mattlgroff/zero-defect/releases/tag/v1.5.0), then:

1. Open **Organization settings > Plugins**.
2. Select **Add plugins**, then **Upload a file**.
3. Upload the Zero Defect plugin ZIP. It must be under 50 MB.
4. Choose the marketplace and distribution settings for the team.

Uploading a newer ZIP with the same plugin name replaces the existing version.

## Optional GitHub marketplace installation

The repository also follows Claude's marketplace layout for Claude Code. Cowork organization installation uses the release ZIP because Claude's organization GitHub sync accepts only private or internal repositories.

For Claude Code:

```sh
claude plugin marketplace add mattlgroff/zero-defect
claude plugin install zero-defect@zero-defect
```

Restart Claude or start a fresh session after installation.

Feedback and forks are welcome. Contributions are welcome for consideration, though the project may not accept every proposed change.

## Use

In Cowork, invoke the skill directly:

```text
/zero-defect/zero-defect
```

You can also ask naturally:

```text
Give this proposal a Zero Defect review before I send it.
```

```text
Adversarially review this candidate summary for unsupported claims and accidental promises.
```

In Claude Code, plugin skills are namespaced:

```text
/zero-defect:zero-defect
```

The skill does not activate for ordinary drafting requests. It activates when you request a Zero Defect review or clearly request the same adversarial quality gate.

The Claude workflow requires a host that can invoke all eight plugin agents. Codex uses the collector described above. A missing or failed reviewer makes the review incomplete.

## MECE responsibility lens

MECE runs within the normal Zero Defect review as its eighth lens. No separate skill or command is needed. It checks proposed accountability for overlapping owners, responsibilities without owners, and unclear handoffs. Shared work is allowed when accountability and boundaries are clear.

The lens reads every target and determines applicability. Documents without substantive responsibility or decision-authority assignments receive no MECE findings or matrix. Applicable documents receive the observed responsibility-to-role matrix, including clear rows, even when no defects are found. Coverage is tested against stated scope; missing scope is disclosed rather than treated as proof of completeness.

MECE findings merge with the other lenses under the existing `ZD-###` identifiers and severity rules. The matrix uses O for accountable owner, S for contributor, ? for unclear authority, and . for no stated assignment. Status cells call out CLEAR, OVERLAP, GAP, or UNCLEAR. Proposed repairs remain separate from observed assignments.

See the [worked Markdown report](plugins/zero-defect/skills/zero-defect/references/mece-report.md#worked-markdown-report) for the matrix and its integration with findings.

MECE is included in Claude 1.5.0 and Codex 0.2.0.

## Responding to findings

Every issue in a Zero Defect report receives a unique identifier such as `ZD-001`. The identifier is assigned after duplicate findings from different lenses are merged, so one issue keeps one identifier even when several lenses found it.

Use the identifiers to give precise follow-up instructions:

```text
ZD-001 fix.
ZD-002 leave as is.
ZD-003 explain.
```

Identifiers remain attached to the same findings during follow-up on that report. A fresh review is a new snapshot and may assign new identifiers.

## Privacy and behavior

Neither distribution creates review artifacts or includes an MCP server, lifecycle hook, package dependency, or local server. The Claude package contains no executable. The Codex distribution adds only the Node.js collector described above; it writes no files and returns the adjudicated report over standard output.

The eight reviewers read the deliverable directly with read-only tools. They open the exact paths named in the review assignment and the canonical review instructions, confirm passages with a literal search, and report line anchors. They do not write, edit, or delete anything, and they do not browse unrelated files.

Public web research is disabled unless the review context clearly permits it or you approve it. Confidential names, candidate details, deal terms, private customer information, unreleased figures, credentials, and signed links must never be sent to web tools.

## License

The project is licensed under Apache License 2.0 except for the adapted anti-slop taxonomy in `anti-slop-reviewer.md`, which is licensed under CC BY-SA 4.0. The distributable plugin includes the license and attribution notice.

Codex constrains individual reviewers with a JSON output schema and validates completion status before generating canonical report markers. It preserves reviewer responses and failure diagnostics when a lens or the adjudicator fails. The parent can triage supported findings from the retained results, but the audit remains incomplete and cannot receive a Ready verdict. Failed components are not counted as completed reviewers.

## Verification

Run deterministic collector, report-validation, and input-boundary tests with `node --test tests/*.test.mjs`.

Run the opt-in live Codex suite with `node evals/codex/run.mjs`, or supply case IDs to select a subset. These tests launch authenticated model calls and consume usage. The runner creates a separate temporary evidence folder, captures all reviewer and adjudicator traces, checks source/input hashes and sandbox arguments, and stops on the first mechanical failure. Inspect the semantic checklist for every final report; structural assertions alone do not prove review quality.
