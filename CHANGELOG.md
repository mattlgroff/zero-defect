# Changelog

All notable changes to Zero Defect are documented here.

## [1.7.0] - 2026-09-26

### Added

- Supporting material: name the notes, fact sheet, pricing sheet, or prior agreement a deliverable was written from, and every lens checks the deliverable against it. The Claude skill passes those paths to each reviewer. The Codex collector takes an optional `supportingPaths` array (or `--supporting-path`), shows it to every reviewer and the adjudicator as evidence, and keeps it out of the style census.
- A precision section in the review contract: four checks before reporting, and boundary examples for necessary contrasts, ordinary follow-ups, email greetings and sign-offs, closing courtesies by document type, correct arithmetic, accurate gap reports, unsupported assurances, and first-party facts.
- A new review page: your document with every finding in place as a tracked change, and a to-do list on the right sorted by severity. Clicking an item jumps to it and opens its decision panel; each option shows its redline, what it gains, and what it `Might lose`. Decided findings go back to plain text with a check. Changes, Original, and Final views; Copy decisions for agent.
- The page is a fixed template (`review-form.html`) filled by `scripts/fill-review-form.mjs` from review data that follows `review-form.schema.json`. The model writes only the data; the script validates it, reads the deliverable, and builds the page. No model writes HTML. Every host publishes the page from a file path.

### Changed

- A claim that could not be checked is no longer a defect by itself. The author's own prices, terms, results, product capabilities, and metrics are not flagged only because no evidence was supplied. Unchecked external claims the audience would rely on are grouped into one Should fix finding. Must fix requires a demonstrated problem.
- When supporting material exists, any difference that changes a claim counts: wording drift is Should fix; a changed number or an unauthorized promise is Must fix.
- Ordinary conditional follow-ups are no longer commitment findings. Greetings, sign-offs, and signatures are never slop findings; a closing courtesy is fine in an email and Should fix in a formal document.
- Repairs target the smallest span that fixes the defect, so repairs for several findings on one line stay compatible.
- Codex reviewers and the adjudicator run on GPT-6 Astra by default. `ZERO_DEFECT_CODEX_MODEL` overrides it; an empty value uses the Codex default.

## [1.6.1] - 2026-09-19

### Changed

- The Codex distribution now carries the same version number as the Claude distribution. One release, one tag, one number. Codex 0.3.0 becomes 1.6.1; no runtime change.

## [1.6.0] / Codex 0.3.0 - 2026-09-19

### Added

- Interactive review form on every host: an Artifact on Claude Code, Claude Cowork, and claude.ai, a ChatGPT Site on ChatGPT, ChatGPT Work, and Codex, or a local HTML file in the Codex CLI. Each finding card shows the anchored passage, two or three concrete repair options rendered as legal redlines with their consequences, one Recommended option preselected, a Skip option, and a comment box. A live `Prompt to copy-paste back` block with a Copy button hands the decisions back as one pasted prompt.
- `review-form.md` reference specifying when to render, how repair options are drafted, the redline rendering, the reply format, and how decisions turn into an edit list.

### Changed

- The skill may now write one file: the review form HTML in the session scratchpad, for hosts whose artifact tool publishes from a file. The deliverable remains read-only. `Edit` and `NotebookEdit` stay disallowed.
- Dropped `$schema` from the Claude plugin manifest to silence the Claude for Teams sync warning.

## [1.5.0] / Codex 0.2.0 - 2026-09-11

### Added

- MECE as the eighth lens in the existing Zero Defect skill for Claude and Codex, with document-level applicability and no separate invocation.
- Responsibility-to-role matrices that distinguish accountable owners, contributors, unclear authority, overlaps, and ownership gaps against stated scope.
- Shared ZD finding identifiers and cross-lens deduplication for MECE defects, with observed assignments separated from proposed repairs.
- A dedicated Codex MECE response schema, matrix retention in failure diagnostics, and rejection of reports that omit applicable matrix rows or coverage limitations.
- A worked Markdown report and acceptance cases for role boundaries, shared work, governance, incomplete scope, and unrelated documents.

### Fixed

- Reject contradictory verdicts, incorrect style-census counts, malformed reviewer records, duplicate finding identifiers, and missing observed MECE rows while retaining failure evidence.
- Preserve canonical anti-slop style-gate and informational punctuation records in the Codex transport.
- Reject unsupported binary, empty, invalidly encoded, and non-file Codex inputs before dispatch.
- Contain early reviewer stdin failures instead of crashing the collector and losing other results.

## [1.4.0] - 2026-09-03

### Added

- Unique `ZD-###` identifiers for every published style-gate, Must fix, Should fix, and incomplete-reviewer issue.
- Follow-up guidance for accepting, rejecting, fixing, or discussing findings by identifier.
- Acceptance coverage for global sequencing, merged cross-lens findings, follow-up stability, and nonexistent identifiers.

### Changed

- The parent reviewer now assigns identifiers only after adjudication, grouping, ranking, and cross-lens deduplication.
- The marketplace and packaged plugin versions are now `1.4.0`.
- Installation documentation now names the `zero-defect-1.4.0.zip` release asset.

## [1.3.0] - 2026-09-02

### Added

- Anti-slop detection for mannered prose that replaces a clearer literal statement with metaphor, flourish, or conspicuously polished phrasing.
- Acceptance cases covering mannered prose, grouped findings, specific repair direction, and literal technical-language controls.

### Changed

- The marketplace and packaged plugin versions are now `1.3.0`.
- Installation documentation now names the `zero-defect-1.3.0.zip` release asset.

## [1.2.0] - 2026-08-28

### Added

- A contextual candidate scan for recurring Claude-associated words and phrases.
- Anti-slop detection for dramatic fragments, importance signaling, canned validation and pushback, structural metaphor clusters, and aphoristic endings.
- Detection for cataphoric teasers that manufacture suspense before revealing the point.
- Acceptance cases covering representative Claudisms, grouped findings, authorship neutrality, literal `load-bearing` language, ordinary enumeration, and direct corrections.

### Changed

- The marketplace and packaged plugin versions are now `1.2.0`.
- Installation documentation now names the future `zero-defect-1.2.0.zip` release asset.

## [1.0.0] - 2026-08-22

### Added

- Initial public release of the seven-lens Zero Defect review workflow for Claude Cowork and Claude Code.
- Reviewers for commitments, evidence, numbers, consistency, decision completeness, language precision, and AI-writing slop.
- Read-only review behavior, literal passage verification, contextual severity rules, and acceptance cases.

[1.5.0]: https://github.com/mattlgroff/zero-defect/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/mattlgroff/zero-defect/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/mattlgroff/zero-defect/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/mattlgroff/zero-defect/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/mattlgroff/zero-defect/releases/tag/v1.0.0
