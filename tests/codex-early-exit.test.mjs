import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('early reviewer exits cannot crash the collector input streams',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'zero-defect-early-exit-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=path.join(dir,'input.md');await writeFile(input,'The approved total is $105,000.');
 const fake=path.join(dir,'codex.mjs');await writeFile(fake,'#!/usr/bin/env node\nprocess.exit(1);\n',{mode:0o755});
 const assignment={paths:[input],audience:'test '.repeat(18000),purpose:'test early process exit',desiredAction:'review',approvedCommitments:'none',confidentiality:'synthetic',research:'denied'};
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,'scripts/run-codex-review.mjs'),'--stdin'],{cwd:root,env:{...process.env,CODEX_BIN:fake},stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
  child.once('error',reject);child.once('close',code=>resolve({code,stdout,stderr}));
  child.stdin.end(JSON.stringify(assignment));
 });
 assert.equal(result.code,3,result.stderr);
 const payload=JSON.parse(result.stdout);
 assert.equal(payload.status,'incomplete');assert.equal(payload.completedLenses.length,0);
 assert.equal(Object.keys(payload.failures).length,8);assert.equal(payload.report,undefined);
 assert.doesNotMatch(result.stderr,/Unhandled 'error' event/u);
});
