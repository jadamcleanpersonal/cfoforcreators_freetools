// Unit tests for computeSafeHarbor

import { describe, expect, it } from "vitest";
import { computeSafeHarbor } from "@/lib/tax/safe_harbor";

describe("computeSafeHarbor", () => {
  it("threshold is 90% of projected annual tax", () => {
    const r = computeSafeHarbor(20_000);
    expect(r.threshold).toBe(18_000); // 20,000 × 0.9
  });

  it("threshold rounds up (ceiling)", () => {
    // 10,001 × 0.9 = 9,000.9 → ceil → 9,001
    const r = computeSafeHarbor(10_001);
    expect(r.threshold).toBe(9_001);
  });

  it("returns $0 threshold for $0 annual tax", () => {
    const r = computeSafeHarbor(0);
    expect(r.threshold).toBe(0);
  });

  it("includes methodology note in result", () => {
    const r = computeSafeHarbor(15_000);
    expect(r.methodologyNote).toBeTruthy();
    expect(r.methodologyNote.length).toBeGreaterThan(20);
  });

  it("methodology note mentions 90%", () => {
    const r = computeSafeHarbor(50_000);
    expect(r.methodologyNote).toContain("90%");
  });

  it("handles large tax amounts correctly", () => {
    const r = computeSafeHarbor(500_000);
    expect(r.threshold).toBe(450_000);
  });

  it("threshold is always less than or equal to projected tax", () => {
    for (const tax of [1_000, 5_000, 20_000, 100_000]) {
      const r = computeSafeHarbor(tax);
      expect(r.threshold).toBeLessThanOrEqual(tax);
    }
  });

  it("threshold is always at least 89.9% of projected tax", () => {
    for (const tax of [1_000, 5_000, 20_000, 100_000]) {
      const r = computeSafeHarbor(tax);
      expect(r.threshold).toBeGreaterThanOrEqual(Math.floor(tax * 0.899));
    }
  });
});
