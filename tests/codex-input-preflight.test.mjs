import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, mkdir, rm, access } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [name,bytes] of [
 ['PDF',Buffer.from('%PDF-1.4\nencoded content')],
 ['Office',Buffer.from([0x50,0x4b,3,4,0,0])],
 ['invalid UTF-8',Buffer.from([0xff,0xfe,0x41,0])],
 ['empty text',Buffer.from(' \r\n\t')],
 ['directory',null],
]) test('collector rejects '+name+' before launching any reviewer',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'zero-defect-preflight-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const input=path.join(dir,'input.md');
 if(bytes===null) await mkdir(input);else await writeFile(input,bytes);
 const marker=path.join(dir,'reviewer-was-launched');
 const fake=path.join(dir,'codex.mjs');
 await writeFile(fake,`#!/usr/bin/env node\nimport {writeFileSync} from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)},'called');\nprocess.exit(1);\n`,{mode:0o755});
 const assignment={paths:[input],audience:'test',purpose:'test input preflight',desiredAction:'review',approvedCommitments:'none',confidentiality:'synthetic',research:'denied'};
 const result=await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,[path.join(root,'scripts/run-codex-review.mjs'),'--stdin'],{cwd:root,env:{...process.env,CODEX_BIN:fake},stdio:['pipe','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
  child.once('error',reject);child.once('close',code=>resolve({code,stdout,stderr}));
  child.stdin.end(JSON.stringify(assignment));
 });
 assert.equal(result.code,2);
 assert.equal(result.stdout,'');
 assert.match(result.stderr,/Unsupported|UTF-8|regular file|substantive text/u);
 await assert.rejects(access(marker),/ENOENT/u);
});
