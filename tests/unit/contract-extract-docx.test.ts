// Unit tests for DOCX text extraction.
// Mocks mammoth — no actual docx files needed for unit tests.

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(),
  },
  extractRawText: vi.fn(),
}));

import { extractDocx } from "@/lib/contract/extract_docx";

async function getMammothMock() {
  const mod = await import("mammoth");
  return mod.extractRawText as ReturnType<typeof vi.fn>;
}

describe("extractDocx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns extracted text for a normal docx", async () => {
    const mock = await getMammothMock();
    mock.mockResolvedValueOnce({
      value:
        "Brand Deal Agreement\n\nThis agreement is between Creator and Brand Corp. Payment: $5,000 net 30.",
    });

    const text = await extractDocx(Buffer.from("fake docx bytes"));
    expect(text).toContain("Brand Deal Agreement");
    expect(text.length).toBeGreaterThan(10);
  });

  it("throws DOCX_NO_TEXT for an empty docx", async () => {
    const mock = await getMammothMock();
    mock.mockResolvedValueOnce({ value: "" });

    await expect(extractDocx(Buffer.from("fake docx bytes"))).rejects.toMatchObject({
      code: "DOCX_NO_TEXT",
    });
  });

  it("throws DOCX_NO_TEXT for whitespace-only docx", async () => {
    const mock = await getMammothMock();
    mock.mockResolvedValueOnce({ value: "   \n\t  " });

    await expect(extractDocx(Buffer.from("fake docx bytes"))).rejects.toMatchObject({
      code: "DOCX_NO_TEXT",
    });
  });

  it("throws EXTRACT_FAILED when mammoth throws", async () => {
    const mock = await getMammothMock();
    mock.mockRejectedValueOnce(new Error("corrupt docx file"));

    await expect(extractDocx(Buffer.from("fake docx bytes"))).rejects.toMatchObject({
      code: "EXTRACT_FAILED",
    });
  });

  it("error message for DOCX_NO_TEXT is user-friendly", async () => {
    const mock = await getMammothMock();
    mock.mockResolvedValueOnce({ value: "" });

    await expect(extractDocx(Buffer.from("fake docx bytes"))).rejects.toMatchObject({
      message: expect.stringContaining("no text content"),
    });
  });
});
