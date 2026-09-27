# Interactive review form

After the compact report, offer the same findings as an interactive page: the deliverable itself, with every finding shown in place as a tracked change, and a to-do list of findings beside it. The reader picks a repair or keeps the original for each finding, and hands the decisions back by pasting one prompt into the chat. The form presents the adjudicated report. It never adds a finding the report lacks and never changes a verdict.

## No model writes HTML

The page is a fixed, tested template: [review-form.html](review-form.html). The orchestrator writes only a JSON data file that follows [review-form.schema.json](review-form.schema.json). A script validates the data, reads the deliverable files, and fills the template:

```sh
node <skill directory>/scripts/fill-review-form.mjs <data.json> <form.html>
```

Write the data file and the form in the session's scratch or working folder, never inside the deliverable's folder. The script exits with code 2 and lists every problem when the data is invalid; fix the data and run it again. Never write, edit, or patch the form's HTML yourself. If the host cannot run `node`, say the form was skipped and return the Markdown report alone.

## Publish

Every supported host publishes the finished file by path:

| Host | How to publish |
|---|---|
| Claude Code | The `Artifact` tool with the form's `file_path`. |
| Claude Cowork | `mcp__cowork__create_artifact` with `html_path`, then `mcp__cowork__verify_artifact`. Later rounds use `mcp__cowork__update_artifact`. |
| claude.ai | An HTML artifact published from the file when the host offers file publishing; otherwise skip the form. |
| ChatGPT, ChatGPT Work, and Codex with the Sites connector | A ChatGPT Site whose `index.html` is the form, saved with `sites_save_site_version` from an archive path. |
| Codex CLI without Sites | Give the user the form's path to open in a browser. |

If the host has no way to show a page, or the user says to skip it, return the Markdown report alone and say the form was skipped. Never block the report on the form.

## What the page does

- Shows the deliverable in the view that fits its type. Markdown (`.md`) is rendered: headings, paragraphs, lists, quotes, tables, code, bold, italics, and images. HTML (`.html`) is rendered as the page itself, with its own styles, after scripts, frames, forms, links, and external resources are removed; a Rendered / Source toggle switches to the line-by-line source. Any other text file shows as plain text.
- Shows local images the deliverable refers to: the fill script embeds them. Images on the web cannot load inside a published page and show as a labelled placeholder with their address. Binary deliverables such as PDF, Word, and PowerPoint are refused; review a Markdown, HTML, or text rendition instead.
- Places each finding by its anchor (`path:line`) and its exact `original` text. In rendered HTML the page finds the passage's visible text, using the anchor line to pick the right occurrence when it repeats. A finding whose text cannot be found stays in the list and appears under "Findings without a place in the document".
- Review view underlines each open finding in its severity color and shows the selected finding as a redline. All changes shows every suggested change as a redline; Original and Final show the text before and after every suggestion. A decided finding reads as plain text: the accepted wording, or the original if the reader kept it.
- A Review sidebar lists findings as cards sorted by severity (reviewer did not finish, Must fix, Style rule, Should fix). Each card shows the problem, the suggested change, and what it might lose, with Accept, Keep original, and See options. Options open inside the card, each with its own Use this button; a note for the agent is optional. Selecting a card and selecting its text in the document go together, and neither covers the other. Decided findings stay in place as one line with Undo.
- An accepted change that still contains `[NEED: ...]` is marked as needing information, counted separately, and flagged in the handoff.
- The sidebar footer always shows Copy decisions for the agent, how many findings remain undecided, and Undo for the last decision. Bulk acceptance is limited to Style rule and Should fix findings and asks for confirmation; Must fix findings are always decided one by one.
- Keyboard: J and K move between open findings, A accepts, X keeps the original. On a phone the sidebar is a bottom sheet.

## Drafting repair options

For every Must fix and Should fix finding, draft two or three candidate repairs from the lens's repair direction. A Style gate finding may carry one mechanical fix, such as replacing an em dash with a period.

- Each option is a concrete replacement for the `original` passage, not advice. `original` is the smallest span that holds the defect, copied exactly from the deliverable, so options for several findings on one line stay compatible. An empty `text` deletes the passage.
- Options differ in a way the reader would actually weigh: scope, formality, strength of commitment, who owns an action. Name the trade-off in `axis`, such as `narrower promise` or `named owner`.
- `consequence` says in one sentence what the reader gains. `mightLose` names what the change could cost: a qualification, a supported fact, warmth or firmness, the author's voice, or a named owner. Write `nothing material` when that is true.
- Mark exactly one option `recommended`. The recommendation follows the finding's impact statement.
- Do not add a Skip or Keep option; the form adds Keep original.
- Options must not introduce a fact, number, name, or date absent from the deliverable or the supporting material. Where a fact is needed, the option carries a bracketed request such as `[NEED: retest window from the SOW]`.
- Options obey the style gate: no U+2014, no negative parallelism. The script rejects an option containing an em dash.
- Incomplete-reviewer findings have no options; the reader marks them reviewed.

Drafting options is not rewriting the deliverable. The deliverable is untouched until the user separately asks for revision.

## Data

```json
{
  "title": "proposal.md",
  "round": 1,
  "verdict": "Not ready (2 must fix)",
  "styleGate": "PASS",
  "audience": "Client sponsor",
  "purpose": "Approve the discovery phase",
  "supportingMaterial": "call-notes.md",
  "documents": [{ "path": "/absolute/path/to/proposal.md" }],
  "findings": [
    {
      "id": "ZD-001",
      "severity": "must",
      "lenses": ["commitments", "evidence"],
      "anchor": "proposal.md:5",
      "original": "on October 5",
      "defect": "Promises a start date the notes say is not agreed.",
      "impact": "The sponsor could plan around a date nobody approved.",
      "evidence": "call-notes.md:3",
      "options": [
        { "id": "A", "axis": "narrower promise", "label": "Tie the start to the review", "text": "once your security review clears", "consequence": "Matches the notes.", "mightLose": "A concrete date for planning.", "recommended": true },
        { "id": "B", "axis": "ask for the date", "label": "Leave a slot for the date", "text": "on [NEED: agreed start date]", "consequence": "Keeps a date in the sentence.", "mightLose": "nothing material" }
      ]
    }
  ],
  "meceMatrix": { "columns": ["ID", "Responsibility", "Lead", "Status", "Evidence"], "rows": [["R-01", "Own delivery", "O", "CLEAR", "roles.md:1"]], "note": "O = accountable owner; S = contributor; ? = unclear authority." }
}
```

- `documents` lists the deliverable files by path. The script reads them; never paste document text into the data.
- `severity` is `incomplete`, `must`, `style`, or `should`. Keep the report's identifiers.
- `anchor` and `original` come from the report. Omit `original` for a finding about something missing; it then appears as a note on its line.
- Omit `meceMatrix` when the report has no matrix.

## Handoff format

The Copy button produces this prompt:

```text
Apply only these human-confirmed Zero Defect decisions. [safety instructions]

Review: proposal.md, round 1
Approved replacements:
[{ "findingId": "ZD-001", "anchor": "proposal.md:5", "original": "on October 5", "replacement": "once your security review clears", "comment": "" }]

Keep original or waiver:
[]

Reviewed, no edit offered:
[]

Pending findings, make no edits for these:
["ZD-002"]
```

## Handling the pasted prompt

When the pasted decisions arrive:

1. Restate the accepted replacements as an edit list keyed by identifier, in report order. Identifiers keep their meaning from the report; never renumber.
2. A comment that asks for a different repair gets one revised option in chat, not a new form, unless several findings need rework.
3. Applying the edits is a revision, outside this skill's read-only scope. Do it only when the user asks for revision in that turn or a later one: confirm each `original` still appears exactly once at its anchor, apply only approved replacements, and stop on stale or overlapping text. Say so in one sentence when returning the edit list.
4. If the user wants a second review after revising, run a fresh review. It is a new snapshot and may assign new identifiers.
