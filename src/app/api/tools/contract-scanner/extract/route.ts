// POST /api/tools/contract-scanner/extract
// Accepts a multipart/form-data upload (single "file" field).
// Extracts text from PDF or DOCX and returns it as JSON.
// The caller (ContractScannerClient) then sends the extracted text
// to the existing /api/tools/contract-scanner SSE endpoint.

import { isExtractError, MAX_FILE_SIZE, extractTextFromFile } from "@/lib/contract/extract";

export const runtime = "nodejs"; // pdf-parse requires Node — not Edge-compatible

export async function POST(req: Request) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "invalid_form", message: "invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "no_file", message: "no file provided" }, { status: 400 });
  }

  // Size check at boundary (belt-and-suspenders — client checks too)
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "file_too_large", message: "file too large. max 10MB." },
      { status: 413 },
    );
  }

  const mimeType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const text = await extractTextFromFile(buffer, mimeType);
    return Response.json({ text });
  } catch (err) {
    if (isExtractError(err)) {
      const statusMap: Record<string, number> = {
        UNSUPPORTED_TYPE: 415,
        FILE_TOO_LARGE: 413,
        PDF_NO_TEXT: 422,
        PDF_PASSWORD_PROTECTED: 422,
        DOCX_NO_TEXT: 422,
        EXTRACT_FAILED: 500,
      };
      const status = statusMap[err.code] ?? 500;
      return Response.json({ error: err.code, message: err.message }, { status });
    }

    console.error("contract extract unexpected error:", err);
    return Response.json(
      { error: "extract_failed", message: "couldn't read this file. try pasting the text." },
      { status: 500 },
    );
  }
}
