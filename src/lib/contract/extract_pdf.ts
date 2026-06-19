// PDF text extraction — wrapper around pdf-parse 2.x.
// Returns extracted text or throws a typed ExtractError.
// Does NOT add OCR — if pdf-parse returns empty text, that's an image PDF.

import type { ExtractError } from "./extract";

export async function extractPdf(buffer: Buffer): Promise<string> {
  let PDFParse: new (opts: { data: Uint8Array }) => {
    getText: () => Promise<{ text: string }>;
  };

  try {
    const mod = await import("pdf-parse");
    PDFParse = mod.PDFParse as typeof PDFParse;
  } catch {
    throw { code: "EXTRACT_FAILED", message: "pdf parser unavailable" } satisfies ExtractError;
  }

  let result: { text: string };
  try {
    const data = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const parser = new PDFParse({ data });
    result = await parser.getText();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (
      msg.toLowerCase().includes("password") ||
      msg.toLowerCase().includes("encrypted") ||
      msg.toLowerCase().includes("decrypt")
    ) {
      throw {
        code: "PDF_PASSWORD_PROTECTED",
        message:
          "this PDF is password-protected. please unlock it and re-upload, or paste the text.",
      } satisfies ExtractError;
    }
    throw {
      code: "EXTRACT_FAILED",
      message: "couldn't read this PDF. try pasting the contract text instead.",
    } satisfies ExtractError;
  }

  const text = result.text?.trim() ?? "";

  if (text.length < 10) {
    throw {
      code: "PDF_NO_TEXT",
      message:
        "this looks like a scanned image, not a text PDF. paste the contract text instead, or try a different file.",
    } satisfies ExtractError;
  }

  return text;
}
