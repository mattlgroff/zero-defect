import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { readReviewText } from '../scripts/read-review-text.mjs';

async function directory(t) {
  const p=await mkdtemp(path.join(os.tmpdir(),'zero-defect-text-'));
  t.after(()=>rm(p,{recursive:true,force:true}));
  return p;
}
for(const [name,bytes] of [
 ['plain Markdown',Buffer.from('# Costs\nTotal: $105,000.\n')],
 ['CSV',Buffer.from('Role,Owner\nDelivery,Sam\n')],
 ['non-ASCII UTF-8',Buffer.from('Résumé: approved.\r\n')],
 ['style character',Buffer.from('Before'+String.fromCodePoint(0x2014)+'after')],
]) test('preserves '+name,async t=>{
 const p=path.join(await directory(t),'input.txt');await writeFile(p,bytes);
 assert.equal(await readReviewText(p),bytes.toString('utf8'));
});
for(const [name,bytes] of [
 ['PDF',Buffer.from('%PDF-1.4\nstream data')],
 ['PDF disguised as Markdown',Buffer.from('\ufeff%PDF-1.7\nstream data')],
 ['Office ZIP',Buffer.from([0x50,0x4b,3,4,0,0])],
 ['empty ZIP',Buffer.from([0x50,0x4b,5,6,0,0])],
 ['embedded NUL',Buffer.from('text\0binary')],
 ['invalid UTF-8',Buffer.from([0xff,0xfe,0x41,0x00])],
]) test('rejects '+name,async t=>{
 const p=path.join(await directory(t),'input.md');await writeFile(p,bytes);
 await assert.rejects(readReviewText(p),/Unsupported|not valid UTF-8/u);
});
test('rejects a directory before reading bytes',async t=>{
 await assert.rejects(readReviewText(await directory(t)),/regular file/u);
});
test('reports a missing source',async t=>{
 await assert.rejects(readReviewText(path.join(await directory(t),'missing.md')),/ENOENT/u);
});
test('accepts an explicitly supplied symlink to readable text',async t=>{
 const p=await directory(t);await writeFile(path.join(p,'real.md'),'Visible text');
 await symlink(path.join(p,'real.md'),path.join(p,'link.md'));
 assert.equal(await readReviewText(path.join(p,'link.md')),'Visible text');
});

for(const text of ['', '  \r\n\t']) test('rejects empty or whitespace-only input '+JSON.stringify(text),async t=>{
 const p=path.join(await directory(t),'empty.md');await writeFile(p,text);
 await assert.rejects(readReviewText(p),/no substantive text/u);
});
