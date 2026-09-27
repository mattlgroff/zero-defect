#!/usr/bin/env node
// Fills the review form template with review data. Models write only the data (see
// references/review-form.schema.json); this script validates it, escapes it, and injects it
// into references/review-form.html unchanged otherwise. No model writes the form's HTML.
//
// The data names the deliverable files in "documents"; this script reads them and embeds their
// text, so the form can show every finding in place. Models never retype the document.
//
//   node fill-review-form.mjs <data.json> <output.html>
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const templatePath = path.join(here, "..", "references", "review-form.html");
export const placeholder = '{"__ZERO_DEFECT_DATA__":true}';

const EM_DASH = "\u2014";
const isString = (v) => typeof v === "string";
const nonEmpty = (v) => isString(v) && v.trim().length > 0;

function allowOnly(object, keys, where, errors) {
  for (const key of Object.keys(object)) if (!keys.includes(key)) errors.push(`${where}: unknown field "${key}"`);
}

/** Returns a list of problems; an empty list means the data is valid. Mirrors review-form.schema.json. */
export function validateFormData(data) {
  const errors = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) return ["data must be a JSON object"];
  allowOnly(data, ["title", "round", "verdict", "styleGate", "audience", "purpose", "supportingMaterial", "reviewers", "findings", "meceMatrix", "documents"], "data", errors);
  if (!Array.isArray(data.documents) || !data.documents.length || !data.documents.every((d) => d && typeof d === "object" && nonEmpty(d.path) && Object.keys(d).every((k) => k === "path"))) errors.push('documents must list the deliverable files as [{"path": "..."}]');
  if (!nonEmpty(data.title)) errors.push("title is required");
  if (data.round !== undefined && !(Number.isInteger(data.round) && data.round >= 1)) errors.push("round must be a whole number of at least 1");
  if (!isString(data.verdict) || !/^(Ready|Not ready.*)$/u.test(data.verdict)) errors.push('verdict must be "Ready" or start with "Not ready"');
  if (!["PASS", "FAIL"].includes(data.styleGate)) errors.push('styleGate must be "PASS" or "FAIL"');
  for (const key of ["audience", "purpose", "supportingMaterial", "reviewers"]) if (data[key] !== undefined && !isString(data[key])) errors.push(`${key} must be a string`);
  if (!Array.isArray(data.findings)) errors.push("findings must be an array");
  const ids = new Set();
  for (const [index, f] of (Array.isArray(data.findings) ? data.findings : []).entries()) {
    const where = `findings[${index}]`;
    if (!f || typeof f !== "object" || Array.isArray(f)) { errors.push(`${where} must be an object`); continue; }
    allowOnly(f, ["id", "severity", "lenses", "anchor", "original", "defect", "impact", "repair", "evidence", "options"], where, errors);
    if (!isString(f.id) || !/^ZD-\d{3,}$/u.test(f.id)) errors.push(`${where}.id must look like ZD-001`);
    else if (ids.has(f.id)) errors.push(`${where}.id ${f.id} is duplicated`);
    else ids.add(f.id);
    if (!["style", "must", "should", "incomplete"].includes(f.severity)) errors.push(`${where}.severity must be style, must, should, or incomplete`);
    if (!nonEmpty(f.defect)) errors.push(`${where}.defect is required`);
    if (f.lenses !== undefined && !(Array.isArray(f.lenses) && f.lenses.every(isString))) errors.push(`${where}.lenses must be a list of strings`);
    for (const key of ["anchor", "original", "impact", "repair", "evidence"]) if (f[key] !== undefined && !isString(f[key])) errors.push(`${where}.${key} must be a string`);
    if (f.options === undefined) continue;
    if (!Array.isArray(f.options) || f.options.length < 1 || f.options.length > 3) { errors.push(`${where}.options must hold one to three options`); continue; }
    if (f.severity === "incomplete") errors.push(`${where} is an incomplete-reviewer finding and takes no options`);
    if (!isString(f.original)) errors.push(`${where}.original is required when options are present`);
    const optionIds = new Set();
    let recommended = 0;
    for (const [o, option] of f.options.entries()) {
      const at = `${where}.options[${o}]`;
      if (!option || typeof option !== "object" || Array.isArray(option)) { errors.push(`${at} must be an object`); continue; }
      allowOnly(option, ["id", "axis", "label", "text", "consequence", "mightLose", "recommended"], at, errors);
      if (!["A", "B", "C"].includes(option.id)) errors.push(`${at}.id must be A, B, or C`);
      else if (optionIds.has(option.id)) errors.push(`${at}.id ${option.id} is duplicated`);
      else optionIds.add(option.id);
      if (!isString(option.text)) errors.push(`${at}.text is required (an empty string deletes the passage)`);
      if (!nonEmpty(option.consequence)) errors.push(`${at}.consequence is required`);
      if (!nonEmpty(option.mightLose)) errors.push(`${at}.mightLose is required; write "nothing material" when true`);
      for (const key of ["axis", "label"]) if (option[key] !== undefined && !isString(option[key])) errors.push(`${at}.${key} must be a string`);
      if (option.recommended !== undefined && typeof option.recommended !== "boolean") errors.push(`${at}.recommended must be true or false`);
      if (option.recommended) recommended += 1;
      for (const key of ["text", "label", "consequence", "mightLose"]) if (isString(option[key]) && option[key].includes(EM_DASH)) errors.push(`${at}.${key} contains an em dash, which the style gate forbids`);
    }
    if (recommended !== 1) errors.push(`${where} must mark exactly one option as recommended`);
  }
  if (data.meceMatrix !== undefined) {
    const m = data.meceMatrix;
    if (!m || typeof m !== "object" || Array.isArray(m)) errors.push("meceMatrix must be an object");
    else {
      allowOnly(m, ["columns", "rows", "note"], "meceMatrix", errors);
      if (!Array.isArray(m.columns) || !m.columns.length || !m.columns.every(isString)) errors.push("meceMatrix.columns must be a non-empty list of strings");
      if (!Array.isArray(m.rows) || !m.rows.every((r) => Array.isArray(r) && r.every(isString))) errors.push("meceMatrix.rows must be a list of string lists");
      if (m.note !== undefined && !isString(m.note)) errors.push("meceMatrix.note must be a string");
    }
  }
  return errors;
}

/** Returns the file's text, or throws for anything that is not UTF-8 text (PDF, Word, PowerPoint, images). */
export function readText(bytes, name) {
  const binary = () => new Error(`${name} is not a text file. The review page shows Markdown, HTML, and plain text; supply a text rendition of the deliverable instead.`);
  if (bytes.subarray(0, 2).toString("ascii") === "PK" || bytes.subarray(0, 5).toString("ascii") === "%PDF-" || bytes.includes(0)) throw binary();
  try { return new TextDecoder("utf-8", { fatal: true }).decode(bytes); } catch { throw binary(); }
}

/** Serializes data so it cannot end the script element or break the JavaScript parser. */
export function serializeForScript(data) {
  return JSON.stringify(data).replace(/</gu, "\\u003c").replace(/\u2028/gu, "\\u2028").replace(/\u2029/gu, "\\u2029");
}

export function fillTemplate(template, data) {
  const at = template.indexOf(placeholder);
  if (at < 0 || template.indexOf(placeholder, at + 1) >= 0) throw new Error("template must contain the data placeholder exactly once");
  return template.slice(0, at) + serializeForScript(data) + template.slice(at + placeholder.length);
}

async function main(argv) {
  const [input, output] = argv;
  if (!input || !output) {
    process.stderr.write("Usage: node fill-review-form.mjs <data.json> <output.html>\n");
    return 2;
  }
  if (path.resolve(output) === path.resolve(templatePath)) {
    process.stderr.write("Refusing to overwrite the template.\n");
    return 2;
  }
  let data;
  try { data = JSON.parse(await readFile(input, "utf8")); }
  catch (error) { process.stderr.write(`Could not read review data as JSON: ${error.message}\n`); return 2; }
  const errors = validateFormData(data);
  if (errors.length) {
    process.stderr.write(`Review data is invalid:\n- ${errors.join("\n- ")}\n`);
    return 2;
  }
  const base = path.dirname(path.resolve(input));
  const documents = [];
  for (const { path: file } of data.documents) {
    const full = path.resolve(base, file);
    let text;
    try { text = readText(await readFile(full), full); }
    catch (error) { process.stderr.write(`${error.message}\n`); return 2; }
    documents.push({ name: path.basename(full), text });
  }
  await writeFile(output, fillTemplate(await readFile(templatePath, "utf8"), { ...data, documents }));
  process.stdout.write(`${path.resolve(output)}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
