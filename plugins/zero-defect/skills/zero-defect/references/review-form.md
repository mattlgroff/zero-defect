# Interactive review form

After the compact report, offer the same findings as a single-file HTML form so the reader can choose a repair for each finding, comment, and hand the decisions back in one paste. The form is a presentation of the adjudicated report. It never adds a finding the report lacks and never changes a verdict.

## When to render

Render the form when the host exposes an artifact capability:

- Cowork: `mcp__cowork__create_artifact`, then `mcp__cowork__verify_artifact`. Later rounds use `mcp__cowork__update_artifact`.
- Claude Code: write the HTML to the session scratchpad and publish it with the `Artifact` tool. The scratchpad file is the only file this skill may write. Never write inside the deliverable's folder.
- claude.ai chat: a native HTML artifact.

If no artifact capability exists, or the user says to skip it, return the Markdown report alone and say the form was skipped. Never block the report on the form.

## Drafting repair options

For every Must fix and Should fix finding, draft two or three candidate repairs from the lens's repair direction. Each option is a concrete replacement for the anchored passage, not advice.

- Options differ in a way the reader would actually weigh: scope, formality, strength of commitment, who owns an action. Label the axis in a short tag, such as `formal`, `broader scope`, `narrower promise`, `named owner`.
- Every option states its consequence in one sentence: what the reader gains and what it gives up.
- Mark exactly one option `Recommended` and preselect it. The recommendation follows the finding's impact statement.
- Always include `Skip. Leave as is.` as the last option.
- Options must not introduce a fact, number, name, or date absent from the deliverable or the supplied evidence. Where a fact is needed, the option carries a bracketed instruction such as `[NEED: retest window from the SOW]`.
- Options obey the style gate: no U+2014, no negative parallelism.
- Style gate items and incomplete-reviewer items get no options. Show them as read-only cards.

Drafting options is not rewriting the deliverable. The deliverable is untouched until the user separately asks for revision.

## Redline rendering

Each option shows the change as a legal redline against the original passage:

- Compute a word-level diff between the anchored passage and the option text.
- Removed words: `<del>` with a red strikethrough. Inserted words: `<ins>` with a green underline and light green background. Unchanged words: plain.
- Show the original passage once at the top of the card in monospace with the anchor (`path:line`).
- Keep the `Skip` option without a redline.

## Form structure

Single HTML file, vanilla JS, inline CSS, no external requests, no fonts loaded from the network, readable at phone width.

1. Header: deliverable title or filename, review round, the reviewer list sentence, and the style gate result.
2. Verdict badge, verbatim from the report.
3. Filter chips: `All (N)`, `Must fix (N)`, `Should fix (N)`, plus `Style gate (N)` when it failed.
4. One card per finding, in report order:
   - identifier, severity tag, lens list in brackets, anchor
   - original passage in monospace
   - `Defect.` and `Impact.` sentences from the report; `Why.` in a callout when the repair direction needs a reason
   - radio group of options: letter, axis tag, one-line label, `Recommended` mark, redline, consequence sentence
   - optional comment textarea
5. MECE matrix, when the report has one, rendered as a table below the cards.
6. Footer: a live `Reply to Claude` textarea regenerated on every input, and a `Copy` button using `navigator.clipboard.writeText` with a fallback that selects the text.

## Reply format

```text
zero-defect round N decisions:
ZD-003 A formal — comment text if any
ZD-004 skip
ZD-005 B broader scope — keep the retest reference
```

One line per finding with options. The letter is the choice; the axis tag repeats for readability. Findings without options are omitted from the reply.

## Handling the reply

When the pasted decisions arrive:

1. Restate the accepted repairs as an edit list keyed by identifier, each with the exact replacement text, in report order. Identifiers keep their meaning from the report; never renumber.
2. A comment that asks for a different repair gets one revised option in chat, not a new form round, unless several findings need rework.
3. Applying the edits to the deliverable is a revision, outside this skill's read-only scope. Do it only when the user asks for revision in that turn or a later one. Say so in one sentence when returning the edit list.
4. If the user wants a second review after revising, run a fresh review. It is a new snapshot and may assign new identifiers.
