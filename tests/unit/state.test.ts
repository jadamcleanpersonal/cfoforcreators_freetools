// Unit tests for computeStateTax — ≥20 scenarios.
// Source: state department of revenue publications (2024/2025 rates).

import { computeStateTax } from "@/lib/tax/state";
import { describe, expect, it } from "vitest";

const AGI = 80_000; // federal AGI used as base for all tests

describe("computeStateTax — no-income-tax states", () => {
  it.each(["TX", "FL", "WA", "NV", "WY", "SD", "AK", "TN", "NH"])(
    "%s returns $0 state tax",
    (state) => {
      const r = computeStateTax(AGI, state, "single");
      expect(r.stateTax).toBe(0);
      expect(r.taxType).toBe("none");
    },
  );
});

describe("computeStateTax — flat-rate states", () => {
  it("CO: 4.4% flat on AGI", () => {
    // No state std deduction → taxable = AGI = $80k
    const r = computeStateTax(80_000, "CO", "single");
    expect(r.taxType).toBe("flat");
    expect(r.stateTax).toBeCloseTo(80_000 * 0.044, -1);
  });

  it("IL: 4.95% flat with $2,425 personal exemption", () => {
    const taxable = 80_000 - 2_425;
    const r = computeStateTax(80_000, "IL", "single");
    expect(r.stateTax).toBeCloseTo(taxable * 0.0495, -1);
  });

  it("PA: 3.07% flat, no standard deduction", () => {
    const r = computeStateTax(80_000, "PA", "single");
    expect(r.stateTax).toBeCloseTo(80_000 * 0.0307, -1);
  });

  it("NC: 4.5% flat with $12,750 single deduction", () => {
    const taxable = 80_000 - 12_750;
    const r = computeStateTax(80_000, "NC", "single");
    expect(r.stateTax).toBeCloseTo(taxable * 0.045, -1);
  });

  it("MA: 5.0% flat with $4,400 single deduction", () => {
    const taxable = 80_000 - 4_400;
    const r = computeStateTax(80_000, "MA", "single");
    expect(r.stateTax).toBeCloseTo(taxable * 0.05, -1);
  });

  it("AZ: 2.5% flat (lowest flat rate)", () => {
    const r = computeStateTax(80_000, "AZ", "single");
    expect(r.stateTax).toBeCloseTo(80_000 * 0.025, -1);
  });

  it("LA: 3.0% flat with $12,500 deduction", () => {
    const taxable = 80_000 - 12_500;
    const r = computeStateTax(80_000, "LA", "single");
    expect(r.stateTax).toBeCloseTo(taxable * 0.03, -1);
  });

  it("GA: 5.39% flat", () => {
    const r = computeStateTax(80_000, "GA", "single");
    expect(r.stateTax).toBeCloseTo(80_000 * 0.0539, -1);
  });

  it("IA: 3.8% flat", () => {
    const r = computeStateTax(80_000, "IA", "single");
    expect(r.stateTax).toBeCloseTo(80_000 * 0.038, -1);
  });
});

describe("computeStateTax — bracket states", () => {
  it("CA single: high income triggers top bracket", () => {
    // $200k AGI, CA std ded $5,202. Taxable = $194,798.
    // Should hit 9.3% bracket. Computed ≈ $14,659.
    const r = computeStateTax(200_000, "CA", "single");
    expect(r.taxType).toBe("bracket");
    expect(r.stateTax).toBeGreaterThan(12_000); // well into 9.3% bracket territory
    expect(r.stateTax).toBeLessThan(20_000);
  });

  it("CA married_joint uses wider brackets", () => {
    const single = computeStateTax(150_000, "CA", "single");
    const mfj = computeStateTax(150_000, "CA", "married_joint");
    // MFJ deduction is double, and MFJ brackets are wider → less tax
    expect(mfj.stateTax).toBeLessThan(single.stateTax);
  });

  it("NY: income tax on $80k AGI", () => {
    const r = computeStateTax(80_000, "NY", "single");
    expect(r.taxType).toBe("bracket");
    expect(r.stateTax).toBeGreaterThan(3_500); // NY taxes ~4-5.85% on this income
    expect(r.stateTax).toBeLessThan(6_000);
  });

  it("NJ: moderate income", () => {
    // $80k AGI, NJ std ded $1,000. Taxable $79k. Computed ≈ $2,907.
    const r = computeStateTax(80_000, "NJ", "single");
    expect(r.taxType).toBe("bracket");
    expect(r.stateTax).toBeGreaterThan(2_000);
    expect(r.stateTax).toBeLessThan(5_000);
  });

  it("VA: brackets top at 5.75%", () => {
    // $80k AGI, $8k std ded. Taxable = $72k. Most of it at 5.75%.
    const r = computeStateTax(80_000, "VA", "single");
    expect(r.stateTax).toBeGreaterThan(3_500);
    expect(r.stateTax).toBeLessThan(5_500);
  });

  it("OR: high top rate (9.9%) kicks in at $125k", () => {
    const below = computeStateTax(100_000, "OR", "single");
    const above = computeStateTax(200_000, "OR", "single");
    expect(above.stateTax).toBeGreaterThan(below.stateTax * 1.8);
  });

  it("MN: higher effective rate than most bracket states", () => {
    const r = computeStateTax(100_000, "MN", "single");
    expect(r.stateTax).toBeGreaterThan(5_000);
  });

  it("OH: zero bracket up to $26k", () => {
    // $25k AGI, $2,400 deduction → taxable $22,600 → $0 (below $26,050 zero bracket)
    const r = computeStateTax(25_000, "OH", "single");
    expect(r.stateTax).toBe(0);
  });

  it("HI: many brackets, reasonable result on $80k", () => {
    const r = computeStateTax(80_000, "HI", "single");
    expect(r.taxType).toBe("bracket");
    expect(r.stateTax).toBeGreaterThan(5_000); // HI has high effective rates
  });

  it("unknown state returns $0 with note", () => {
    const r = computeStateTax(80_000, "ZZ", "single");
    expect(r.stateTax).toBe(0);
  });

  it("$0 AGI always returns $0 tax", () => {
    for (const state of ["CA", "NY", "TX", "IL", "VA"]) {
      const r = computeStateTax(0, state, "single");
      expect(r.stateTax).toBe(0);
    }
  });

  it("married_joint always pays less or equal than single on same AGI for bracket states", () => {
    // MFJ brackets are wider and deductions are doubled
    for (const state of ["CA", "NY", "NJ", "OR", "MN"]) {
      const single = computeStateTax(150_000, state, "single");
      const mfj = computeStateTax(150_000, state, "married_joint");
      expect(mfj.stateTax).toBeLessThanOrEqual(single.stateTax + 100); // allow small rounding
    }
  });
});
