---
name: zero-defect
description: Performs a seven-lens adversarial review of completed English-language business deliverables for unintended promises, unsupported claims, numerical errors, contradictions, decision gaps, imprecise language, and AI-writing slop. Use for a requested Zero Defect review, adversarial business review, final quality gate, promise check, evidence check, fact check, contradiction check, or AI-slop review. Do not use for ordinary drafting or revision unless the user explicitly requests this review.
---

# Zero Defect review for Codex

Run seven fresh, independent, read-only Codex reviewer processes and adjudicate their findings. Never replace them with one combined review.

Resolve this skill's installed directory to an absolute path. Read the canonical Claude workflow at `../../plugins/zero-defect/skills/zero-defect/SKILL.md` and its linked review contract before doing review work. They are authoritative. Follow canonical workflow steps 1–5, 7, and 10–13, plus the entire canonical Output section. The Codex-specific dispatch below replaces canonical steps 6, 8, and 9; do not run those steps separately.

## Dispatch

Resolve `../../scripts/run-codex-review.mjs` from this skill directory to an absolute path. This Codex-only collector discovers and loads the canonical reviewer prompts directly, derives the canonical style-gate census, launches one fresh `codex exec` process per lens concurrently, and uses a separate read-only adjudicator. It avoids the native noninteractive subagent path because that path can emit empty waits or lose child results in current Codex releases.

Start the constant command `node <absolute-collector-path> --stdin` in an execution session with writable stdin. With `exec_command`, set `tty: true` and a short initial yield so it returns a live session ID; the collector switches the PTY to non-echoing raw mode before reading. Do not put assignment values in the command string. Serialize one compact JSON object with these required fields and write it as one newline-terminated input message:

- `paths`: array of absolute deliverable paths
- `audience`: audience string
- `purpose`: purpose string
- `desiredAction`: desired action string
- `approvedCommitments`: commitments or `none`
- `confidentiality`: confidentiality boundary string
- `research`: `allowed` or `denied`

Wait on that exact execution session until it exits. Never interpolate, quote, or evaluate assignment values as shell syntax. Never send the JSON before the execution tool has returned a live session ID. The collector itself uses direct process spawning rather than a shell. Do not start a second collector while the first is active.

The collector starts authenticated nested Codex processes. If the current sandbox blocks access to Codex authentication, request approval to launch this one trusted plugin command outside the outer sandbox. The seven nested reviewers still run with `--sandbox read-only`, ephemeral sessions, ignored user configuration and rules, and a restricted shell environment. If approval is denied or unavailable, fail closed.

Parse the collector's final JSON object. The collector rejects malformed lens and adjudicator results. When `status` is `complete`, return `report` without a preamble. When it is `incomplete`, apply the canonical failed-reviewer rule to the components in `failures`. Never rerun automatically.
