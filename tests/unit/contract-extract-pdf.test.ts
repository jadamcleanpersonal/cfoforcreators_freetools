// Unit tests for PDF text extraction.
// Uses mocked pdf-parse — no actual PDF files needed for unit tests.

import { describe, expect, it, vi, beforeEach } from "vitest";

// Factory for a mock PDFParse class
function makeMockPDFParse(getText: () => Promise<{ text: string }>) {
  return vi.fn().mockImplementation(() => ({ getText }));
}

vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn(),
}));

import { extractPdf } from "@/lib/contract/extract_pdf";

async function getPDFParseMock() {
  const mod = await import("pdf-parse");
  return mod.PDFParse as ReturnType<typeof vi.fn>;
}

describe("extractPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns extracted text for a normal text PDF", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => ({
        text: "This Agreement is entered into by Creator and Brand Corp.\nExclusivity clause: Creator shall not promote competing products for 90 days.",
      }),
    }));

    const text = await extractPdf(Buffer.from("fake pdf bytes"));
    expect(text).toContain("Exclusivity clause");
    expect(text.length).toBeGreaterThan(10);
  });

  it("throws PDF_NO_TEXT for an image-only PDF (empty text)", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => ({ text: "" }),
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      code: "PDF_NO_TEXT",
    });
  });

  it("throws PDF_NO_TEXT for whitespace-only text", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => ({ text: "   \n\t  " }),
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      code: "PDF_NO_TEXT",
    });
  });

  it("throws PDF_PASSWORD_PROTECTED when pdf-parse throws a password error", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => {
        throw new Error("Password required to decrypt PDF");
      },
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      code: "PDF_PASSWORD_PROTECTED",
    });
  });

  it("throws PDF_PASSWORD_PROTECTED when error mentions 'encrypted'", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => {
        throw new Error("File is encrypted");
      },
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      code: "PDF_PASSWORD_PROTECTED",
    });
  });

  it("throws EXTRACT_FAILED for unknown pdf-parse errors", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => {
        throw new Error("Unexpected token in PDF stream");
      },
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      code: "EXTRACT_FAILED",
    });
  });

  it("error message for PDF_NO_TEXT mentions scanned image", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => ({ text: "" }),
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      message: expect.stringContaining("scanned image"),
    });
  });

  it("error message for PDF_PASSWORD_PROTECTED mentions unlock", async () => {
    const Mock = await getPDFParseMock();
    Mock.mockImplementation(() => ({
      getText: async () => {
        throw new Error("password required");
      },
    }));

    await expect(extractPdf(Buffer.from("fake pdf bytes"))).rejects.toMatchObject({
      message: expect.stringContaining("unlock"),
    });
  });
});
