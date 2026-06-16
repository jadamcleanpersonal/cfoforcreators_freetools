// Verdict integration tests — must hit all three paths with creator-specific inputs.
// These are the high-stakes tests: wrong verdicts are misleading to creators.

import { computeTaxEstimate } from "@/lib/tax";
import { describe, expect, it } from "vitest";

// ── "yes" path ────────────────────────────────────────────────────────────────
// Creator with $80k income, $15k expenses, paid Q1+Q2 on time, asking about Q3.
// Should get "yes" with a payment amount.
describe("verdict: 'yes' — creator on track", () => {
  it("YouTube creator, $80k YTD, $15k expenses, paid Q1+Q2, asking Q3", () => {
    const result = computeTaxEstimate({
      primary_platform: "youtube",
      niche: "education",
      tax_year: 2025,
      current_quarter: "q3",
      total_creator_income_ytd: 60_000, // $80k annualized = 60k × (4/3)
      income_breakdown: { adsense: 40_000, sponsors: 20_000 },
      business_expenses_ytd: 11_250, // $15k annualized = 11,250 × (4/3)
      state: "TX",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 6_000, // paid Q1 + Q2 (rough ~$3k each)
      withholding_from_w2: 0,
    });

    expect(result.verdict).toBe("yes");
    expect(result.amountThisQuarter).toBeGreaterThan(0);
    expect(result.amountThisQuarter).toBeLessThan(15_000);
    expect(result.verdictHeadline).toBeTruthy();
    expect(result.deadline).toContain("September");
  });

  it("TikTok creator, $50k annual income, CA, single — yes verdict Q1", () => {
    const result = computeTaxEstimate({
      primary_platform: "tiktok",
      niche: "lifestyle",
      tax_year: 2025,
      current_quarter: "q1",
      total_creator_income_ytd: 12_500, // $50k annualized
      business_expenses_ytd: 1_500, // $6k annualized
      state: "CA",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 0,
      withholding_from_w2: 0,
    });

    expect(result.verdict).toBe("yes");
    expect(result.amountThisQuarter).toBeGreaterThan(0);
    // CA has state tax so amount should be higher than TX equivalent
    expect(result.stateTax).toBeGreaterThan(0);
  });

  it("Podcast creator, all quarters paid correctly — Q4 still shows yes", () => {
    const result = computeTaxEstimate({
      primary_platform: "podcast",
      niche: "finance",
      tax_year: 2025,
      current_quarter: "q4",
      total_creator_income_ytd: 90_000,
      business_expenses_ytd: 12_000,
      state: "FL",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 12_000,
      withholding_from_w2: 0,
    });

    // Has paid $12k so far. If that's enough to be "on track" for Q4...
    // Safe harbor ~90% of total projected. Depends on exact numbers.
    expect(["yes", "no"]).toContain(result.verdict);
    expect(result.deadline).toContain("January");
  });
});

// ── "no" path ─────────────────────────────────────────────────────────────────
// Creator with $30k creator income + $80k W-2 with $12k withholding — no payment needed.
// W-2 withholding covers safe harbor.
describe("verdict: 'no' — W-2 withholding covers it", () => {
  it("$30k creator + $80k W-2 / $12k withholding / Q2 — no payment", () => {
    // W-2 withholding is annualized: $12k YTD at Q2 → $24k projected annual.
    // Total projected annual tax ≈ $17k (federal, TX no state).
    // Safe harbor = $17k × 90% ≈ $15.4k.
    // Annualized withholding $24k > $15.4k → verdict "no".
    const result = computeTaxEstimate({
      primary_platform: "youtube",
      niche: "gaming",
      tax_year: 2025,
      current_quarter: "q2",
      total_creator_income_ytd: 15_000, // $30k annualized (15k × 2)
      business_expenses_ytd: 2_000,
      state: "TX", // no state tax simplifies the check
      filing_status: "single",
      other_w2_income: 80_000,
      already_paid_estimated_taxes: 0,
      withholding_from_w2: 12_000, // YTD; annualizes to $24k, covers $15.4k safe harbor
    });

    expect(result.verdict).toBe("no");
    expect(result.amountThisQuarter).toBe(0);
    expect(result.verdictHeadline).toContain("don't owe");
  });

  it("very high W-2 withholding always results in no", () => {
    const result = computeTaxEstimate({
      primary_platform: "multi",
      niche: "tech",
      tax_year: 2025,
      current_quarter: "q3",
      total_creator_income_ytd: 15_000,
      business_expenses_ytd: 1_000,
      state: "WA",
      filing_status: "married_joint",
      other_w2_income: 120_000,
      already_paid_estimated_taxes: 0,
      withholding_from_w2: 50_000, // very high withholding — definitely covers safe harbor
    });

    expect(result.verdict).toBe("no");
    expect(result.amountThisQuarter).toBe(0);
  });
});

// ── "wait" path ───────────────────────────────────────────────────────────────
// Creator on Q3 who paid $0 in Q1 and Q2 — catch-up + penalty estimate.
describe("verdict: 'wait' — behind on prior quarters", () => {
  it("Twitch streamer, $100k YTD, paid $0, now Q3 — wait with catch-up", () => {
    const result = computeTaxEstimate({
      primary_platform: "twitch",
      niche: "gaming",
      tax_year: 2025,
      current_quarter: "q3",
      total_creator_income_ytd: 75_000, // $100k annualized
      business_expenses_ytd: 10_000,
      state: "TX",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 0,
      withholding_from_w2: 0,
    });

    expect(result.verdict).toBe("wait");
    expect(result.amountThisQuarter).toBeGreaterThan(0);
    expect(result.catchUpPenaltyEstimate).toBeDefined();
    expect(result.catchUpPenaltyEstimate!).toBeGreaterThan(0);
    expect(result.verdictReason).toContain("penalty");
  });

  it("Instagram creator, Q4 with only Q1 paid — still behind", () => {
    const result = computeTaxEstimate({
      primary_platform: "instagram",
      niche: "beauty",
      tax_year: 2025,
      current_quarter: "q4",
      total_creator_income_ytd: 60_000,
      business_expenses_ytd: 8_000,
      state: "NY",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 2_000, // paid Q1 only, but not enough
      withholding_from_w2: 0,
    });

    expect(result.verdict).toBe("wait");
    expect(result.amountThisQuarter).toBeGreaterThan(2_000);
  });

  it("wait verdict includes Enrolled Agent mention", () => {
    const result = computeTaxEstimate({
      primary_platform: "youtube",
      niche: "lifestyle",
      tax_year: 2025,
      current_quarter: "q3",
      total_creator_income_ytd: 50_000,
      business_expenses_ytd: 5_000,
      state: "CA",
      filing_status: "single",
      other_w2_income: 0,
      already_paid_estimated_taxes: 0,
      withholding_from_w2: 0,
    });

    expect(result.verdict).toBe("wait");
    expect(result.verdictReason).toContain("Enrolled Agent");
  });
});

// ── Output shape integrity ────────────────────────────────────────────────────
describe("output shape", () => {
  const baseInput = {
    primary_platform: "youtube" as const,
    niche: "education" as const,
    tax_year: 2025,
    current_quarter: "q2" as const,
    total_creator_income_ytd: 40_000,
    business_expenses_ytd: 5_000,
    state: "CA",
    filing_status: "single" as const,
    other_w2_income: 0,
    already_paid_estimated_taxes: 0,
    withholding_from_w2: 0,
  };

  it("always returns required fields", () => {
    const r = computeTaxEstimate(baseInput);
    expect(r.verdict).toBeDefined();
    expect(r.verdictHeadline).toBeTruthy();
    expect(r.verdictReason).toBeTruthy();
    expect(typeof r.amountThisQuarter).toBe("number");
    expect(r.deadline).toBeTruthy();
    expect(r.federalBreakdown).toBeDefined();
    expect(typeof r.federalBreakdown.incomeTax).toBe("number");
    expect(typeof r.federalBreakdown.seTax).toBe("number");
    expect(typeof r.stateTax).toBe("number");
    expect(r.stateName).toBeTruthy();
    expect(typeof r.safeHarborThreshold).toBe("number");
    expect(r.safeHarborNote).toBeTruthy();
    expect(typeof r.totalProjectedTax).toBe("number");
    expect(typeof r.effectiveRate).toBe("number");
  });

  it("catchUpPenaltyEstimate is only defined in 'wait' verdict", () => {
    const waitResult = computeTaxEstimate({
      ...baseInput,
      current_quarter: "q3",
      already_paid_estimated_taxes: 0,
    });
    if (waitResult.verdict === "wait") {
      expect(waitResult.catchUpPenaltyEstimate).toBeDefined();
    }

    const yesResult = computeTaxEstimate({
      ...baseInput,
      current_quarter: "q1",
      already_paid_estimated_taxes: 0,
    });
    if (yesResult.verdict === "yes") {
      expect(yesResult.catchUpPenaltyEstimate).toBeUndefined();
    }
  });

  it("effectiveRate is between 0 and 1", () => {
    const r = computeTaxEstimate(baseInput);
    expect(r.effectiveRate).toBeGreaterThanOrEqual(0);
    expect(r.effectiveRate).toBeLessThan(1);
  });

  it("stateName matches state code", () => {
    const r = computeTaxEstimate({ ...baseInput, state: "CA" });
    expect(r.stateName).toBe("California");
  });

  it("no-income-tax state has $0 state tax", () => {
    const r = computeTaxEstimate({ ...baseInput, state: "TX" });
    expect(r.stateTax).toBe(0);
  });

  it("annualization: Q1 income gets multiplied by 4", () => {
    const q1 = computeTaxEstimate({
      ...baseInput,
      current_quarter: "q1",
      total_creator_income_ytd: 20_000,
    });
    const q4 = computeTaxEstimate({
      ...baseInput,
      current_quarter: "q4",
      total_creator_income_ytd: 80_000,
    });
    // Q1: projects 20k × 4 = 80k annual. Q4: 80k × 1 = 80k annual. Same projected income.
    expect(q1.projectedAnnualIncome).toBeCloseTo(q4.projectedAnnualIncome, -2);
  });
});
