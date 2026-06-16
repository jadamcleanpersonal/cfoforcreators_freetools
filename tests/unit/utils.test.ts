import { clamp, formatCurrency, formatNumber, safeJsonParse } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("formatCurrency", () => {
  it("formats whole numbers as USD", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
    expect(formatCurrency(12400)).toBe("$12,400");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats with decimals when specified", () => {
    expect(formatCurrency(1000, 2)).toBe("$1,000.00");
  });
});

describe("formatNumber", () => {
  it("formats numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(0)).toBe("0");
  });
});

describe("clamp", () => {
  it("returns value within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON", () => {
    expect(safeJsonParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("returns null on invalid JSON", () => {
    expect(safeJsonParse("not json")).toBeNull();
  });
});
