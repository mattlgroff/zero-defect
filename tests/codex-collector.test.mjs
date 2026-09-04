import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts", "run-codex-review.mjs");

function runWithInput(args, input) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, stdio: ["pipe", "pipe", "pipe"] });
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
