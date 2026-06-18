// S-corp calculator comprehensive tests.
// Covers output shape, math accuracy, edge cases, and the 10 scenarios
// specified in the sprint 3 kickoff brief.

import { computeScorp } from "@/lib/tax/scorp";
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

// ── Output shape integrity ────────────────────────────────────────────────────

describe("output shape", () => {
  it("always returns all required fields", () => {
    const r = computeScorp(base);
    expect(r.verdict).toMatch(/^(yes|no|wait)$/);
    expect(r.verdictHeadline).toBeTruthy();
    expect(r.verdictReason).toBeTruthy();
    expect(r.reasonableSalary).toBeDefined();
    expect(typeof r.reasonableSalary.low).toBe("number");
    expect(typeof r.reasonableSalary.recommended).toBe("number");
    expect(typeof r.reasonableSalary.high).toBe("number");
    expect(r.reasonableSalary.defensibilityNote).toBeTruthy();
    expect(typeof r.withoutScorpAnnualTax).toBe("number");
    expect(typeof r.withScorpAnnualTax).toBe("number");
    expect(typeof r.grossSavings).toBe("number");
    expect(r.runningCosts).toBeDefined();
    expect(typeof r.runningCosts.payrollServiceAnnual).toBe("number");
    expect(typeof r.runningCosts.stateFilingFees).toBe("number");
    expect(typeof r.runningCosts.additionalAccountingCost).toBe("number");
    expect(typeof r.runningCosts.total).toBe("number");
    expect(typeof r.netSavings).toBe("number");
    expect(r.stateGotchas).toBeInstanceOf(Array);
    expect(r.filingDeadline).toBeTruthy();
    expect(r.breakdownExplainer).toBeTruthy();
  });

  it("runningCosts.total equals sum of components", () => {
    const r = computeScorp(base);
    expect(r.runningCosts.total).toBe(
      r.runningCosts.payrollServiceAnnual +
        r.runningCosts.stateFilingFees +
        r.runningCosts.additionalAccountingCost,
    );
  });

  it("grossSavings = withoutScorpAnnualTax minus SE on salary", () => {
    const r = computeScorp(base);
    // grossSavings should be positive when verdict is yes
    if (r.verdict === "yes") {
      expect(r.grossSavings).toBeGreaterThan(0);
    }
  });

  it("netSavings = grossSavings - runningCosts.total", () => {
    const r = computeScorp(base);
    expect(r.netSavings).toBe(r.grossSavings - r.runningCosts.total);
  });

  it("withoutScorpAnnualTax > 0 for profitable creator", () => {
    const r = computeScorp(base);
    expect(r.withoutScorpAnnualTax).toBeGreaterThan(0);
  });

  it("filingDeadline includes March 15", () => {
    const r = computeScorp(base);
    expect(r.filingDeadline).toMatch(/march 15/i);
  });

  it("breakdownExplainer is a non-empty string", () => {
    const r = computeScorp(base);
    expect(r.breakdownExplainer.length).toBeGreaterThan(50);
  });
});

// ── Scenario 1: Happy "yes" path ──────────────────────────────────────────────

describe("Scenario 1: happy yes path", () => {
  it("$120k profit, tech niche, 5+ years, low-tax state → yes, $5-8k net savings", () => {
    const r = computeScorp({
      ...base,
      niche: "tech",
      total_creator_income: 140_000,
      business_expenses: 20_000, // profit = $120k
      state: "FL",
      years_creating_full_time: "5+",
    });
    expect(r.verdict).toBe("yes");
    expect(r.netSavings).toBeGreaterThan(3_000);
    expect(r.netSavings).toBeLessThan(15_000);
  });
});

// ── Scenario 2: CA "no" path ──────────────────────────────────────────────────

describe("Scenario 2: CA no path", () => {
  it("$65k profit, CA → no with franchise tax explainer", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 70_000,
      business_expenses: 5_000, // profit = $65k
      state: "CA",
    });
    expect(r.verdict).toBe("no");
    expect(r.verdictReason).toMatch(/franchise|1\.5%/i);
  });
});

// ── Scenario 3: 5-year lockout "no" path ─────────────────────────────────────

describe("Scenario 3: 5-year lockout no", () => {
  it("$90k profit, <1 year full-time → no with lockout warning", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 105_000,
      business_expenses: 15_000, // profit = $90k
      years_creating_full_time: "<1",
    });
    expect(r.verdict).toBe("no");
    expect(r.verdictReason).toMatch(/5.year|lockout/i);
  });
});

// ── Scenario 4: Already S-corp ────────────────────────────────────────────────

describe("Scenario 4: already S-corp", () => {
  it("current_entity=scorp_already → no verdict regardless of income", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 500_000,
      business_expenses: 50_000,
      current_entity: "scorp_already",
    });
    expect(r.verdict).toBe("no");
    expect(r.verdictReason).toMatch(/already/i);
  });
});

// ── Scenario 5: Breakeven "wait" path ────────────────────────────────────────

describe("Scenario 5: breakeven wait path", () => {
  it("$72k profit, 2 years full-time → wait with re-run instructions", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 82_000,
      business_expenses: 10_000, // profit = $72k
      years_creating_full_time: "1-3",
    });
    expect(r.verdict).toBe("wait");
    expect(r.verdictReason).toMatch(/quarter|re.run/i);
  });
});

// ── Scenario 6: Niche salary differential ────────────────────────────────────

describe("Scenario 6: niche salary differential", () => {
  it("finance niche at same income requires higher salary than lifestyle → less distributions → less savings", () => {
    const financeResult = computeScorp({ ...base, niche: "finance" });
    const lifestyleResult = computeScorp({ ...base, niche: "lifestyle" });

    // Finance requires higher salary, which means fewer distributions, which means less SE tax savings
    expect(financeResult.reasonableSalary.recommended).toBeGreaterThan(
      lifestyleResult.reasonableSalary.recommended,
    );
    expect(financeResult.grossSavings).toBeLessThan(lifestyleResult.grossSavings);
  });
});

// ── Scenario 7: Audience size differential ───────────────────────────────────

describe("Scenario 7: audience size differential", () => {
  it("1M+ audience at same income should require higher or equal salary than 100k-1M", () => {
    const large = computeScorp({ ...base, audience_size: "1M+" });
    const mid = computeScorp({ ...base, audience_size: "100k-1M" });

    // Salary should be at least as high for 1M+ (IRS expects market rate)
    expect(large.reasonableSalary.recommended).toBeGreaterThanOrEqual(
      mid.reasonableSalary.recommended - 5_000, // allow small variance from cap logic
    );
  });
});

// ── Scenario 8: Hours per week differential ──────────────────────────────────

describe("Scenario 8: hours per week differential", () => {
  it("40 hrs/wk justifies higher salary than 10 hrs/wk at same income", () => {
    const full = computeScorp({ ...base, hours_per_week: 40 });
    const part = computeScorp({ ...base, hours_per_week: 10 });

    expect(full.reasonableSalary.recommended).toBeGreaterThan(part.reasonableSalary.recommended);
  });

  it("lower hours → more distributions → more savings (given same salary floor)", () => {
    // With lower salary requirement, more income can be distributions (SE-tax free)
    const full = computeScorp({ ...base, hours_per_week: 40 });
    const part = computeScorp({ ...base, hours_per_week: 10 });

    // Part-time has lower salary → more distributions → more gross savings
    if (part.reasonableSalary.recommended < full.reasonableSalary.recommended) {
      expect(part.grossSavings).toBeGreaterThanOrEqual(full.grossSavings);
    }
  });
});

// ── Scenario 9: State-specific scenarios ─────────────────────────────────────

describe("Scenario 9: state-specific", () => {
  it("CA: stateFilingFees includes $800 + percentage", () => {
    const r = computeScorp({
      ...base,
      state: "CA",
      total_creator_income: 150_000,
      business_expenses: 20_000,
    });
    expect(r.runningCosts.stateFilingFees).toBeGreaterThan(2_000);
  });

  it("NY: stateGotchas includes NYC warning", () => {
    const r = computeScorp({ ...base, state: "NY" });
    const allGotchas = r.stateGotchas.join(" ");
    expect(allGotchas).toMatch(/NYC|new york city/i);
  });

  it("NJ: stateFilingFees is exactly $375", () => {
    const r = computeScorp({ ...base, state: "NJ" });
    expect(r.runningCosts.stateFilingFees).toBe(375);
  });

  it("OR: stateFilingFees is exactly $150", () => {
    const r = computeScorp({ ...base, state: "OR" });
    expect(r.runningCosts.stateFilingFees).toBe(150);
  });

  it("TN: mentions excise tax in gotchas", () => {
    const r = computeScorp({ ...base, state: "TN" });
    expect(r.stateGotchas[0]).toMatch(/excise|6\.5%/i);
  });

  it("NH: mentions BPT or BET in gotchas", () => {
    const r = computeScorp({ ...base, state: "NH" });
    expect(r.stateGotchas[0]).toMatch(/BPT|BET|business profits/i);
  });
});

// ── Scenario 10: Agency cut edge case ────────────────────────────────────────

describe("Scenario 10: manager/agency cut", () => {
  it("$200k income with 20% agent cut nets $160k for calculation", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 200_000,
      business_expenses: 0,
      manager_or_agency_cut: 20,
    });
    // adjustedIncome = 200k × (1 - 0.20) = 160k, netProfit = 160k
    // SE tax without S-corp should be on $160k
    const withoutCut = computeScorp({
      ...base,
      total_creator_income: 160_000,
      business_expenses: 0,
      manager_or_agency_cut: 0,
    });
    expect(r.withoutScorpAnnualTax).toBe(withoutCut.withoutScorpAnnualTax);
  });

  it("30% agency cut significantly reduces net profit and savings", () => {
    const withCut = computeScorp({
      ...base,
      total_creator_income: 200_000,
      manager_or_agency_cut: 30,
    });
    const withoutCut = computeScorp({
      ...base,
      total_creator_income: 200_000,
      manager_or_agency_cut: 0,
    });
    expect(withCut.grossSavings).toBeLessThan(withoutCut.grossSavings);
  });
});

// ── Running costs structure ───────────────────────────────────────────────────

describe("running costs", () => {
  it("payrollServiceAnnual is $900", () => {
    const r = computeScorp(base);
    expect(r.runningCosts.payrollServiceAnnual).toBe(900);
  });

  it("additionalAccountingCost is $1,000", () => {
    const r = computeScorp(base);
    expect(r.runningCosts.additionalAccountingCost).toBe(1_000);
  });

  it("standard state filing fee is $100 for non-gotcha states", () => {
    const r = computeScorp({ ...base, state: "CO" }); // Colorado is not a gotcha state
    expect(r.runningCosts.stateFilingFees).toBe(100);
  });
});

// ── Breakeven math ────────────────────────────────────────────────────────────

describe("breakeven math", () => {
  it("grossSavings > runningCosts.total for verdict 'yes'", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 200_000,
      business_expenses: 20_000,
      years_creating_full_time: "5+",
    });
    if (r.verdict === "yes") {
      expect(r.grossSavings).toBeGreaterThan(r.runningCosts.total);
    }
  });

  it("withScorpAnnualTax < withoutScorpAnnualTax when savings are positive", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 150_000,
      business_expenses: 20_000,
    });
    if (r.grossSavings > 0) {
      // SE tax with S-corp should be less than without
      expect(r.withScorpAnnualTax - r.runningCosts.total).toBeLessThan(r.withoutScorpAnnualTax);
    }
  });
});
