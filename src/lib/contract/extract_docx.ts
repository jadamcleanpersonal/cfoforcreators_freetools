// DOCX text extraction — wrapper around mammoth.
// Returns extracted text or throws a typed ExtractError.

import type { ExtractError } from "./extract";

export async function extractDocx(buffer: Buffer): Promise<string> {
  let mammoth: { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> };
  try {
    mammoth = await import("mammoth");
  } catch {
    throw { code: "EXTRACT_FAILED", message: "docx parser unavailable" } satisfies ExtractError;
  }

  let result: { value: string };
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch {
    throw {
      code: "EXTRACT_FAILED",
      message: "couldn't read this docx file. try pasting the contract text instead.",
    } satisfies ExtractError;
  }

  const text = result.value?.trim() ?? "";

  if (text.length < 10) {
    throw {
      code: "DOCX_NO_TEXT",
      message: "this docx file has no text content.",
    } satisfies ExtractError;
  }

  return text;
}
