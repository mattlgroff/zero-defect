import { readFile, stat } from "node:fs/promises";

// The style census must inspect the same readable text that the reviewers receive.
// Raw PDF streams and Office ZIP bytes are not a text rendition of the document.
export async function readReviewText(file) {
  const info = await stat(file);
  if (!info.isFile()) throw new Error(`Review input must be a regular file: ${file}`);
  const bytes = await readFile(file);
  if (bytes.subarray(0, 2).toString("ascii") === "PK" && [3, 5, 7].includes(bytes[2])) {
    throw new Error(`Unsupported binary/Office review input: ${file}. Supply an accessible UTF-8 text export that preserves the content to review.`);
  }
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error(`Review input is not valid UTF-8 text: ${file}. Supply an accessible UTF-8 text export.`); }
  if (/^\s*%PDF-/u.test(text) || text.includes("\0")) {
    throw new Error(`Unsupported binary/PDF review input: ${file}. Supply an accessible UTF-8 text export that preserves the content to review.`);
  }
  if (!text.trim()) throw new Error(`Review input contains no substantive text: ${file}`);
  return text;
}
