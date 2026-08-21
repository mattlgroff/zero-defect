---
name: zero-defect
description: >
  Performs a seven-lens adversarial review of completed English-language business deliverables for unintended promises, unsupported claims, numerical errors, contradictions, decision gaps, imprecise language, and AI-writing slop. Use when the user invokes /zero-defect or asks for a Zero Defect review, adversarial business review, final quality gate, promise check, evidence check, fact check, contradiction check, or AI-slop review. Do not use for ordinary drafting or revision unless the user explicitly requests this review.
allowed-tools: Read, Grep, Glob, Bash, Agent
disallowed-tools: Write, Edit, NotebookEdit
---

# Zero Defect review

Run the complete review with all seven named plugin reviewers. If the host cannot invoke all seven, stop and say the review requires a host that supports plugin subagents. Do not replace them with a single-model review.

Read [review-contract.md](references/review-contract.md) before dispatch.

Reviewers read the deliverable themselves. Never retype, summarize, or hand-render file content into an assignment. A transcription artifact becomes a reported defect that does not exist in the document.

## Workflow

1. Identify the deliverable and resolve it to exact paths. Report the paths you resolved before dispatch so the user can correct the target. When the deliverable exists only in the conversation, pass the text inline and say so in the assignment.
2. Confirm every path is text a reviewer can read. For a binary format such as `.docx` or `.pdf`, convert it to a text rendition once, give reviewers both the rendition path and the original path, and state that punctuation and line anchors refer to the rendition.
3. Infer audience and purpose when the conversation makes them clear. Otherwise ask one combined question: `Who will read this, and what decision or action should it drive?`
4. If the deliverable contains commitments whose approval is unclear, ask one additional question identifying which commitments are intentional and authorized. Ask no other questions unless the review target itself is ambiguous.
5. Decide whether external research is allowed. Infer permission only when the material and every claim to be checked are clearly public. Otherwise ask whether public web research is allowed and what must not leave the conversation. No permission means no web use.
6. Run the style gate scan yourself before dispatch. These counts are the report's ground truth, never a lens estimate:

   ```sh
   LC_ALL=C grep -on -- $'\xe2\x80\x94' FILE                        # U+2014 em dash
   LC_ALL=C grep -on -e $'\xe2\x80\x93' FILE                        # U+2013 en dash, informational
   grep -inE 'not (just |only |merely |simply )?[^.;!?]{1,60} but( also)? ' FILE
   grep -inE 'less about .+ and more about |more than .+, it is |rather than ' FILE
   ```

7. Write one short assignment per lens: the exact paths, audience, purpose, desired action, approved commitments, confidentiality boundary, research permission, the style gate census, and the lens instruction. Do not paste file contents into the assignment.
8. Invoke these plugin agents concurrently:
   - `zero-defect:commitments-reviewer`
   - `zero-defect:evidence-reviewer`
   - `zero-defect:numbers-reviewer`
   - `zero-defect:consistency-reviewer`
   - `zero-defect:decision-completeness-reviewer`
   - `zero-defect:language-precision-reviewer`
   - `zero-defect:anti-slop-reviewer`
9. Start all seven before waiting for any result. Never give one reviewer another reviewer's conclusions. Do not run a sequential substitute when concurrent dispatch is unavailable.
10. Validate every result. A completed lens must start with `COMPLETE` and must not report unreadable material, tool truncation, or a blocked capability. Treat a malformed or partial response as a failed lens. A lens that read its assigned files in full has complete coverage, whatever share of the document it found defects in.
11. Adjudicate every allegation. Confirm the cited passage exists at the cited anchor with `grep` before you publish it. Drop any finding whose passage you cannot match in the file, and say how many you dropped. Check that the stated impact follows and the severity matches the contract.
12. Merge duplicates across lenses into one finding and record every lens that raised it. Rank by corroboration count within a severity band.
13. Return the compact report. Diagnose and give repair directions. Do not rewrite the deliverable unless the user separately requests revision.

If any reviewer fails, returns malformed output, or cannot read required material, do not claim a complete review. Return `Verdict: Not ready` and identify the incomplete lens under Must fix.

## Output

Use exactly this structure:

```markdown
Verdict: Ready | Not ready (style gate) | Not ready (N must fix) | Not ready (style gate, N must fix)

Style gate: PASS | FAIL

- Em dash U+2014: 6 at doc.html:12, doc.html:40, doc.html:118 and 3 more. Replace with a period, comma, colon, or parentheses.
- Negative parallelism: 1 at doc.html:91 `not a report, but a decision`. State the outcome directly.

Must fix

- [numbers, consistency, evidence] `doc.html:214` Defect. Impact. Repair. Evidence when applicable.

Should fix

- [language-precision] `doc.html:77` Defect. Impact. Repair.
```

Omit an empty severity section. Omit the style gate bullets when it passes. Report every supported finding once. Group repeated instances of one defect with a count and representative anchors. Use terse bullets, no preamble, no praise, and no invented certainty.

The bracketed lens list is the corroboration record. Preserve it.

`Verdict: Ready` requires a passing style gate and zero Must fix findings. Should fix findings alone do not block.

When all seven lenses return, the style gate passes, and no supported finding remains, return exactly:

```text
I found no issues. Looks good to me. Ready to ship.
```
