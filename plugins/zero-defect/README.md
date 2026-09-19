# Zero Defect

Zero Defect is a Claude Cowork plugin for adversarial review of English-language business deliverables. Eight focused reviewers inspect promises, evidence, numbers, contradictions, decision gaps, language precision, AI-writing slop (including Claude-associated rhetorical patterns), and MECE responsibility coverage before another person relies on the work.

It is designed for proposals, emails, candidate summaries, product plans, reports, requirements, spreadsheets, presentations, and similar knowledge work. It diagnoses defects and gives short repair directions. It does not rewrite the deliverable unless you separately ask Claude to revise it.

## Install the ZIP for a Claude Team organization

Cowork and Skills must be enabled for the organization. An Owner or Primary Owner can install the plugin:

Download `zero-defect-1.6.1.zip` from the [1.6.1 release](https://github.com/mattlgroff/zero-defect/releases/tag/v1.6.1), then:

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

The complete workflow requires a Claude host that can invoke all eight plugin agents. A missing or failed reviewer makes the review incomplete.

## MECE responsibility lens

MECE runs within the normal Zero Defect review as its eighth lens. No separate skill or command is needed. It checks proposed accountability for overlapping owners, responsibilities without owners, and unclear handoffs. Shared work is allowed when accountability and boundaries are clear.

The lens reads every target and determines applicability. Documents without substantive responsibility or decision-authority assignments receive no MECE findings or matrix. Applicable documents receive the observed responsibility-to-role matrix, including clear rows, even when no defects are found. Coverage is tested against stated scope; missing scope is disclosed rather than treated as proof of completeness.

MECE findings merge with the other lenses under the existing `ZD-###` identifiers and severity rules. The matrix uses O for accountable owner, S for contributor, ? for unclear authority, and . for no stated assignment. Status cells call out CLEAR, OVERLAP, GAP, or UNCLEAR. Proposed repairs remain separate from observed assignments.

See the [worked Markdown report](skills/zero-defect/references/mece-report.md#worked-markdown-report) for the matrix and its integration with findings.

MECE has been included since 1.5.0 (Codex 0.2.0 under the old separate numbering).

## Interactive review form

The review also renders as an interactive form: an Artifact on Claude Code, Claude Cowork, and claude.ai, or a ChatGPT Site on ChatGPT, ChatGPT Work, and Codex. Each finding card shows the anchored passage, two or three concrete repair options drawn as legal redlines against the original, the consequence of each, one option marked Recommended and preselected, a Skip option, and a comment box. Filter chips switch between All, Must fix, and Should fix. A live `Prompt to copy-paste back` block at the bottom collects your choices; press Copy and paste it into the chat.

Choosing an option does not change the deliverable. Claude returns the accepted repairs as an edit list by identifier and applies them only when you ask for revision. A host that cannot show an HTML page gets the Markdown report alone.

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

Zero Defect includes no MCP server, hook, executable, package dependency, or local server. It writes no files except the optional review form HTML in the session scratchpad on hosts whose artifact tool publishes from a file. The deliverable is never modified by the review.

The eight reviewers read the deliverable directly with read-only tools. They open the exact paths named in the review assignment, confirm passages with a literal search, and report line anchors. They do not write, edit, or delete anything, and they do not browse beyond the assigned paths.

Public web research is disabled unless the review context clearly permits it or you approve it. Confidential names, candidate details, deal terms, private customer information, unreleased figures, credentials, and signed links must never be sent to web tools.

## License

The project is licensed under Apache License 2.0 except for the adapted anti-slop taxonomy in `anti-slop-reviewer.md`, which is licensed under CC BY-SA 4.0. The distributable plugin includes the license and attribution notice.
