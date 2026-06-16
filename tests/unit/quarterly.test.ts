// Unit tests for quarterly payment logic.
// Covers all 4 quarters, catch-up case, "no" verdict, and deadline accuracy.

import { describe, expect, it } from "vitest";
import { computeQuarterlyPayment, getDeadline, quartersElapsed } from "@/lib/tax/quarterly";

const BASE = {
  safeHarborThreshold: 12_000, // $3,000/quarter
  alreadyPaidEstimatedTaxes: 0,
  withholdingFromW2: 0,
  taxYear: 2025,
};

describe("getDeadline", () => {
  it("Q1 deadline is April 15", () => {
    const d = getDeadline(2025, "q1");
    expect(d.isoDate).toBe("2025-04-15");
    expect(d.label).toContain("April 15");
  });

  it("Q2 deadline is June 15", () => {
    const d = getDeadline(2025, "q2");
    expect(d.isoDate).toBe("2025-06-15");
  });

  it("Q3 deadline is September 15", () => {
    const d = getDeadline(2025, "q3");
    expect(d.isoDate).toBe("2025-09-15");
  });

  it("Q4 deadline is January 15 of FOLLOWING year", () => {
    const d = getDeadline(2025, "q4");
    expect(d.isoDate).toBe("2026-01-15");
    expect(d.label).toContain("2026");
  });
});

describe("quartersElapsed", () => {
  it("q1 = 1, q2 = 2, q3 = 3, q4 = 4", () => {
    expect(quartersElapsed("q1")).toBe(1);
    expect(quartersElapsed("q2")).toBe(2);
    expect(quartersElapsed("q3")).toBe(3);
    expect(quartersElapsed("q4")).toBe(4);
  });
});

describe("computeQuarterlyPayment — 'yes' verdict", () => {
  it("Q1 with no prior payments — owes $3,000", () => {
    const r = computeQuarterlyPayment({ ...BASE, currentQuarter: "q1" });
    expect(r.verdict).toBe("yes");
    expect(r.amountDueThisQuarter).toBeCloseTo(3_000, -1);
    expect(r.penaltyEstimate).toBe(0);
  });

  it("Q2 with Q1 already paid — owes $3,000 for Q2", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 3_000,
      currentQuarter: "q2",
    });
    expect(r.verdict).toBe("yes");
    expect(r.amountDueThisQuarter).toBeCloseTo(3_000, -1);
  });

  it("Q3 with Q1+Q2 paid — owes $3,000 for Q3", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 6_000,
      currentQuarter: "q3",
    });
    expect(r.verdict).toBe("yes");
    expect(r.amountDueThisQuarter).toBeCloseTo(3_000, -1);
  });

  it("Q4 with Q1-Q3 paid — owes $3,000 for Q4", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 9_000,
      currentQuarter: "q4",
    });
    expect(r.verdict).toBe("yes");
    expect(r.amountDueThisQuarter).toBeCloseTo(3_000, -1);
  });

  it("verdict headline includes the amount and deadline", () => {
    const r = computeQuarterlyPayment({ ...BASE, currentQuarter: "q1" });
    expect(r.verdictHeadline).toContain("3,000");
    expect(r.verdictHeadline).toContain("April");
  });
});

describe("computeQuarterlyPayment — 'no' verdict", () => {
  it("withholding covers full safe harbor — no payment needed", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      withholdingFromW2: 12_000, // covers full safe harbor
      currentQuarter: "q2",
    });
    expect(r.verdict).toBe("no");
    expect(r.amountDueThisQuarter).toBe(0);
  });

  it("combo of withholding + estimated taxes covers safe harbor", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      withholdingFromW2: 6_000,
      alreadyPaidEstimatedTaxes: 6_000,
      currentQuarter: "q3",
    });
    expect(r.verdict).toBe("no");
    expect(r.amountDueThisQuarter).toBe(0);
  });

  it("slightly over safe harbor still returns 'no'", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      withholdingFromW2: 13_000, // more than $12k safe harbor
      currentQuarter: "q2",
    });
    expect(r.verdict).toBe("no");
  });

  it("'no' verdict headline says no payment needed", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      withholdingFromW2: 15_000,
      currentQuarter: "q1",
    });
    expect(r.verdict).toBe("no");
    expect(r.verdictHeadline).toContain("don't owe");
  });
});

describe("computeQuarterlyPayment — 'wait' verdict (catch-up)", () => {
  it("Q3 with $0 paid — 'wait', owes catch-up for Q1+Q2+Q3", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 0,
      withholdingFromW2: 0,
      currentQuarter: "q3",
    });
    expect(r.verdict).toBe("wait");
    // Should have paid Q1+Q2+Q3 = $9,000. Paid $0. Behind by $9,000.
    expect(r.amountDueThisQuarter).toBeCloseTo(9_000, -1);
    expect(r.penaltyEstimate).toBeGreaterThan(0);
    expect(r.underpaidAmount).toBeGreaterThan(0);
  });

  it("Q4 with $0 paid — catch-up for all 4 quarters", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 0,
      currentQuarter: "q4",
    });
    expect(r.verdict).toBe("wait");
    expect(r.amountDueThisQuarter).toBeCloseTo(12_000, -1);
  });

  it("'wait' verdict reason mentions penalty", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 0,
      currentQuarter: "q3",
    });
    expect(r.verdict).toBe("wait");
    expect(r.verdictReason).toContain("penalty");
  });

  it("'wait' verdict reason mentions Enrolled Agent", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 0,
      currentQuarter: "q3",
    });
    expect(r.verdictReason).toContain("Enrolled Agent");
  });

  it("Q2 with $0 paid — wait (missed Q1)", () => {
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 0,
      currentQuarter: "q2",
    });
    expect(r.verdict).toBe("wait");
    // Should have paid Q1 ($3k) + Q2 ($3k) = $6,000 by now
    expect(r.amountDueThisQuarter).toBeCloseTo(6_000, -1);
  });
});

describe("computeQuarterlyPayment — edge cases", () => {
  it("$0 safe harbor threshold returns 'no' (no tax owed)", () => {
    const r = computeQuarterlyPayment({
      safeHarborThreshold: 0,
      alreadyPaidEstimatedTaxes: 0,
      withholdingFromW2: 0,
      currentQuarter: "q1",
      taxYear: 2025,
    });
    // If threshold is 0, total paid (0) >= threshold (0) → "no"
    expect(r.verdict).toBe("no");
  });

  it("partial prior payment reduces amount owed", () => {
    // Q3, paid $4k (should be $9k by now). Behind $5k.
    const r = computeQuarterlyPayment({
      ...BASE,
      alreadyPaidEstimatedTaxes: 4_000,
      currentQuarter: "q3",
    });
    expect(r.verdict).toBe("wait");
    expect(r.amountDueThisQuarter).toBeCloseTo(5_000, -1);
  });
});
