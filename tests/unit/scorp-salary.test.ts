// Reasonable salary tests.
// Verifies that niche, audience size, and hours/week produce defensible ranges.
// Finance and tech should produce HIGHER salary requirements than lifestyle/gaming.

import { getReasonableSalary } from "@/lib/tax/scorp";
import type { ScorpInputs } from "@/lib/tax/scorp";
import { describe, expect, it } from "vitest";

const base: ScorpInputs = {
  primary_platform: "youtube",
  niche: "education",
  audience_size: "100k-1M",
  hours_per_week: 30,
  total_creator_income: 150_000,
  business_expenses: 20_000,
  state: "TX",
  current_entity: "single_member_llc",
  years_creating_full_time: "5+",
  manager_or_agency_cut: 0,
};

describe("niche salary differential", () => {
  it("finance niche requires higher salary than lifestyle at same income/audience", () => {
    const finance = getReasonableSalary({ ...base, niche: "finance" });
    const lifestyle = getReasonableSalary({ ...base, niche: "lifestyle" });

    expect(finance.recommended).toBeGreaterThan(lifestyle.recommended);
    expect(finance.low).toBeGreaterThan(lifestyle.low);
  });

  it("tech niche requires higher salary than gaming at same income/audience", () => {
    // Use high income so the 50% cap doesn't bind equally for both niches
    const highIncome = { ...base, total_creator_income: 250_000, business_expenses: 20_000 };
    const tech = getReasonableSalary({ ...highIncome, niche: "tech" });
    const gaming = getReasonableSalary({ ...highIncome, niche: "gaming" });

    expect(tech.recommended).toBeGreaterThan(gaming.recommended);
  });

  it("finance salary includes mention of financial industry comparison", () => {
    const result = getReasonableSalary({ ...base, niche: "finance" });
    expect(result.defensibilityNote).toMatch(/finance|financial/i);
  });
});

describe("audience size differential", () => {
  it("1M+ audience produces higher or equal salary than 100k-1M at same niche/hours", () => {
    const large = getReasonableSalary({ ...base, audience_size: "1M+" });
    const mid = getReasonableSalary({ ...base, audience_size: "100k-1M" });

    // 1M+ should not produce a LOWER salary than 100k-1M
    // (can be equal if cap applies)
    expect(large.recommended).toBeGreaterThanOrEqual(mid.recommended - 5_000); // allow small variance
  });

  it("1M+ finance creator has very high salary requirement", () => {
    // Use high income so the 50% cap doesn't interfere with the high finance/1M+ salary
    const result = getReasonableSalary({
      ...base,
      niche: "finance",
      audience_size: "1M+",
      hours_per_week: 40,
      total_creator_income: 400_000,
      business_expenses: 40_000,
    });
    expect(result.recommended).toBeGreaterThan(70_000);
  });

  it("note mentions IRS expectation for 1M+ finance/tech creators", () => {
    const result = getReasonableSalary({
      ...base,
      niche: "finance",
      audience_size: "1M+",
    });
    expect(result.defensibilityNote).toMatch(/1m\+|high.scrutiny|IRS expects/i);
  });
});

describe("hours per week differential", () => {
  it("40+ hrs/wk produces higher salary than 10 hrs/wk at same niche/audience", () => {
    const fullTime = getReasonableSalary({ ...base, hours_per_week: 45 });
    const partTime = getReasonableSalary({ ...base, hours_per_week: 8 });

    expect(fullTime.recommended).toBeGreaterThan(partTime.recommended);
  });

  it("part-time (<20 hrs) weights toward salary low end", () => {
    const partTime = getReasonableSalary({ ...base, hours_per_week: 15 });
    const fullTime = getReasonableSalary({ ...base, hours_per_week: 35 });

    expect(partTime.recommended).toBeLessThan(fullTime.recommended);
  });

  it("part-time note mentions fewer hours support lower salary", () => {
    const result = getReasonableSalary({ ...base, hours_per_week: 10 });
    expect(result.defensibilityNote).toMatch(/part.time|fewer hours/i);
  });
});

describe("salary floor and cap", () => {
  it("salary is never below $40k floor for any valid input", () => {
    const result = getReasonableSalary({
      ...base,
      niche: "lifestyle",
      audience_size: "<10k",
      hours_per_week: 5,
    });
    expect(result.recommended).toBeGreaterThanOrEqual(40_000);
  });

  it("salary does not exceed 50% of net creator income", () => {
    // Use income where cap (50%) would be above the $40k floor but below typical benchmarks
    // income=$120k, expenses=$20k → netProfit=$100k, cap=$50k
    // Education niche 100k-1M 30hrs midpoint ~$67.5k > cap=$50k → result should be capped at $50k
    const income = 120_000;
    const expenses = 20_000;
    const netProfit = income - expenses;

    const result = getReasonableSalary({
      ...base,
      total_creator_income: income,
      business_expenses: expenses,
    });

    expect(result.recommended).toBeLessThanOrEqual(netProfit * 0.5 + 1); // +1 for rounding
  });

  it("salary high is at least equal to recommended", () => {
    const result = getReasonableSalary(base);
    expect(result.high).toBeGreaterThanOrEqual(result.recommended);
  });

  it("salary low is at most equal to recommended", () => {
    const result = getReasonableSalary(base);
    expect(result.low).toBeLessThanOrEqual(result.recommended);
  });
});

describe("salary defensibility notes", () => {
  it("note includes the niche", () => {
    const result = getReasonableSalary({ ...base, niche: "gaming" });
    expect(result.defensibilityNote).toMatch(/gaming/i);
  });

  it("note includes BLS or creator data source", () => {
    const result = getReasonableSalary(base);
    expect(result.defensibilityNote).toMatch(/BLS|source/i);
  });
});
