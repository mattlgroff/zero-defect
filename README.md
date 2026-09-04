# Zero Defect

Zero Defect is an adversarial review plugin for English-language business deliverables. Seven focused reviewers inspect promises, evidence, numbers, contradictions, decision gaps, language precision, and AI-writing slop before another person relies on the work.

It is designed for proposals, emails, candidate summaries, product plans, reports, requirements, spreadsheets, presentations, and similar knowledge work. It diagnoses defects and gives short repair directions. It does not rewrite the deliverable unless you separately request revision.

## Claude and Codex distributions

This repository contains two independently versioned packages:

| Host | Package root | Orchestration |
| --- | --- | --- |
| Claude Cowork and Claude Code | `plugins/zero-defect/` | The original skill invokes seven registered Claude plugin agents by name. |
| Codex | repository root | A thin adapter launches seven concurrent, ephemeral, read-only `codex exec` reviewers through a Codex-only collector. |

The reviewer prompts, review contract, severity rules, and report format exist only in the Claude package directory and are the canonical source for both hosts. The Codex adapter and collector contain only Codex-specific orchestration. Each reviewer gets the absolute canonical prompt paths, uses a read-only sandbox, and returns its result to the parent for the same adjudication process.

Codex requires Node.js 22 or newer and an installed, authenticated Codex CLI. The collector uses independent `codex exec` processes instead of native noninteractive subagents because current Codex releases can lose subagent tasks or results in headless execution. On sandboxed hosts, launching authenticated nested Codex processes may require approval; denying it makes the review incomplete.

The Claude package remains version `1.4.0`. Codex has its own manifest and version, so adding or releasing Codex support does not change the Claude ZIP or Claude marketplace package.

### Install in Codex from GitHub

```sh
codex plugin marketplace add mattlgroff/zero-defect --ref master
codex plugin add zero-defect@zero-defect-codex
```

Start a new Codex task, then invoke `$zero-defect:zero-defect` or ask naturally for a Zero Defect review.

### Test a local Codex checkout

```sh
codex plugin marketplace add /absolute/path/to/zero-defect
codex plugin add zero-defect@zero-defect-codex
```

## Install the ZIP for a Claude Team organization

Cowork and Skills must be enabled for the organization. An Owner or Primary Owner can install the plugin:

Download `zero-defect-1.4.0.zip` from the [latest GitHub release](https://github.com/mattlgroff/zero-defect/releases/latest), then:

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

The complete seven-reviewer workflow requires Cowork. If the host cannot invoke all seven plugin agents, the skill fails closed instead of silently substituting a single-model review.

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

The seven reviewers read the deliverable directly with read-only tools. They open the exact paths named in the review assignment and the canonical review instructions, confirm passages with a literal search, and report line anchors. They do not write, edit, or delete anything, and they do not browse unrelated files.

Public web research is disabled unless the review context clearly permits it or you approve it. Confidential names, candidate details, deal terms, private customer information, unreleased figures, credentials, and signed links must never be sent to web tools.

## License

The project is licensed under Apache License 2.0 except for the adapted anti-slop taxonomy in `anti-slop-reviewer.md`, which is licensed under CC BY-SA 4.0. The distributable plugin includes the license and attribution notice.
