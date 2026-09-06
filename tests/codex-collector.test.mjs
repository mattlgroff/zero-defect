import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "run-codex-review.mjs");

function runWithInput(args, input, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("close", (code) => resolve({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
    child.stdin.end(input);
  });
}

test("collector resolves every canonical lens without copying it", async () => {
  const { stdout } = await execFileAsync(process.execPath, [script, "--check"], { cwd: root });
  const result = JSON.parse(stdout);
  assert.equal(result.status, "ok");
  assert.equal(result.lenses.length, 7);
  assert.equal(new Set(result.lenses).size, 7);
  assert.match(result.contract, /plugins[/\\]zero-defect[/\\].*review-contract\.md$/u);
});

test("collector rejects incomplete assignments before launching Codex", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [script, "--path", "README.md"], { cwd: root }),
    (error) => error.code === 2 && /missing required argument/u.test(error.stderr),
  );
});

test("stdin mode rejects malformed JSON without launching Codex", async () => {
  const result = await runWithInput(["--stdin"], "not-json");
  assert.equal(result.code, 2);
  assert.match(result.stderr, /valid JSON assignment/u);
});

async function simulate(t, scenario) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zero-defect-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const executable = path.join(directory, "codex.mjs");
  await writeFile(executable, `#!/usr/bin/env node
let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;
const mode = ${JSON.stringify(scenario)};
const evidence = prompt.startsWith("You are the evidence reviewer");
const adjudicator = prompt.startsWith("You are the final adjudicator");
if (evidence && mode === "exit") { process.stderr.write("fixture process failure"); process.exit(1); }
if (adjudicator && ["malformed", "incomplete", "prefix", "schema", "exit"].includes(mode)) process.exit(99);
if (!adjudicator && !process.argv.includes("--output-schema")) process.exit(98);
let text = JSON.stringify({status:"complete",findings:[],reason:""});
if (evidence && mode === "malformed") text = "Evidence text without marker";
if (evidence && mode === "incomplete") text = JSON.stringify({status:"incomplete",findings:[],reason:"Source could not be read"});
if (evidence && mode === "prefix") text = JSON.stringify({status:"complete",findings:[],reason:"Blocked source"});
if (evidence && mode === "schema") text = JSON.stringify({status:"complete",findings:"bad",reason:""});
if (adjudicator) text = mode === "adjudicator" ? "Malformed report retained" : "I found no issues. Looks good to me. Ready to ship.";
console.log(JSON.stringify({type:"item.completed",item:{type:"agent_message",text}}));
`);
  await chmod(executable, 0o755);
  const result = await runWithInput(["--stdin"], JSON.stringify({
    paths: [path.join(root, "README.md")],
    audience: "test", purpose: "test", desiredAction: "test",
    approvedCommitments: "none", confidentiality: "synthetic", research: "denied"
  }), { ...process.env, CODEX_BIN: executable });
  return { code: result.code, payload: JSON.parse(result.stdout) };
}

for (const scenario of ["malformed", "incomplete", "prefix", "schema", "exit"]) {
  test(`retains usable results and excludes failed evidence lens: ${scenario}`, async (t) => {
    const { code, payload } = await simulate(t, scenario);
    assert.equal(code, 3);
    assert.equal(payload.status, "incomplete");
    assert.equal(payload.completedLenses.length, 6);
    assert.ok(!payload.completedLenses.includes("evidence"));
    assert.ok(payload.failures.evidence);
    assert.equal(payload.results.numbers, "COMPLETE\nNo supported findings.");
    assert.equal(typeof payload.styleCensus, "string");
    assert.equal(payload.report, undefined);
    if (scenario !== "exit") assert.equal(typeof payload.rawResults.evidence, "string");
  });
}

test("retains all lens results and rejected report after adjudicator failure", async (t) => {
  const { code, payload } = await simulate(t, "adjudicator");
  assert.equal(code, 3);
  assert.equal(payload.completedLenses.length, 7);
  assert.equal(Object.keys(payload.results).length, 7);
  assert.equal(payload.rejectedReport, "Malformed report retained");
  assert.ok(payload.failures.adjudicator);
  assert.equal(payload.report, undefined);
});

test("complete review still returns its validated report", async (t) => {
  const { code, payload } = await simulate(t, "complete");
  assert.equal(code, 0);
  assert.equal(payload.status, "complete");
  assert.equal(payload.completedLenses.length, 7);
  assert.equal(payload.report, "I found no issues. Looks good to me. Ready to ship.");
});
