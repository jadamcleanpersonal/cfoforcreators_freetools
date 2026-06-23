// Dispatcher: routes a file upload to the correct extractor based on MIME type.
// Supports: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
// All other types throw UNSUPPORTED_TYPE.

export type ExtractErrorCode =
  | "UNSUPPORTED_TYPE"
  | "FILE_TOO_LARGE"
  | "PDF_NO_TEXT"
  | "PDF_PASSWORD_PROTECTED"
  | "DOCX_NO_TEXT"
  | "EXTRACT_FAILED";

export interface ExtractError {
  code: ExtractErrorCode;
  message: string;
}

export function isExtractError(err: unknown): err is ExtractError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "message" in err &&
    typeof (err as ExtractError).message === "string"
  );
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(mime: string): mime is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mime);
}

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  if (!isSupportedMimeType(mimeType)) {
    throw {
      code: "UNSUPPORTED_TYPE",
      message: "we only accept .pdf and .docx files.",
    } satisfies ExtractError;
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw {
      code: "FILE_TOO_LARGE",
      message: "file too large. max 10MB.",
    } satisfies ExtractError;
  }

  if (mimeType === "application/pdf") {
    const { extractPdf } = await import("./extract_pdf");
    return extractPdf(buffer);
  }

  // docx
  const { extractDocx } = await import("./extract_docx");
  return extractDocx(buffer);
}
