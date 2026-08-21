# Zero Defect

Zero Defect is a Claude Cowork plugin for adversarial review of English-language business deliverables. Seven focused reviewers inspect promises, evidence, numbers, contradictions, decision gaps, language precision, and AI-writing slop before another person relies on the work.

It is designed for proposals, emails, candidate summaries, product plans, reports, requirements, spreadsheets, presentations, and similar knowledge work. It diagnoses defects and gives short repair directions. It does not rewrite the deliverable unless you separately ask Claude to revise it.

## Install the ZIP for a Claude Team organization

Cowork and Skills must be enabled for the organization. An Owner or Primary Owner can install the plugin:

1. Open **Organization settings > Plugins**.
2. Select **Add plugins**, then **Upload a file**.
3. Upload the Zero Defect plugin ZIP. It must be under 50 MB.
4. Choose the marketplace and distribution settings for the team.

Uploading a newer ZIP with the same plugin name replaces the existing version.

## Optional GitHub marketplace installation

The repository also follows Claude's marketplace layout. For organization syncing, connect the private `mattlgroff/zero-defect` repository from **Organization settings > Plugins > Add plugins > GitHub**. The Claude GitHub App must have access to the repository.

For Claude Code, your local Git credentials must have access to the private repository:

```sh
claude plugin marketplace add mattlgroff/zero-defect
claude plugin install zero-defect@zero-defect
```

Restart Claude or start a fresh session after installation.

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

## Privacy and behavior

Zero Defect creates no files and includes no MCP server, hook, executable, package dependency, local server, or filesystem output.

Public web research is disabled unless the review context clearly permits it or you approve it. Confidential names, candidate details, deal terms, private customer information, unreleased figures, credentials, and signed links must never be sent to web tools.

## License

The project is licensed under Apache License 2.0 except for the adapted anti-slop taxonomy in `anti-slop-reviewer.md`, which is licensed under CC BY-SA 4.0. The distributable plugin includes the license and attribution notice.
