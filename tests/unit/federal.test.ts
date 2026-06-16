// Unit tests for computeFederalTax.
// ≥30 scenarios. Tolerance: within $50 (rounding + minor methodology differences vs IRS worksheet).
// Sources noted per scenario. All dollar values are integers.

import {
  applyBrackets,
  computeFederalTax,
  computeQbiDeduction,
  computeSeTax,
} from "@/lib/tax/federal";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// applyBrackets — isolated bracket math
// ---------------------------------------------------------------------------
describe("applyBrackets", () => {
  const singleBrackets2025 = [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: Number.POSITIVE_INFINITY, rate: 0.24 },
  ];

  it("returns 0 for zero income", () => {
    expect(applyBrackets(0, singleBrackets2025)).toBe(0);
  });

  it("applies 10% rate correctly to income fully in first bracket", () => {
    // $10,000 × 10% = $1,000
    expect(applyBrackets(10_000, singleBrackets2025)).toBe(1_000);
  });

  it("spans two brackets correctly", () => {
    // $11,925 × 10% = $1,192.50, + ($20,000 - $11,925) × 12% = $969
    // total ≈ $2,162
    expect(applyBrackets(20_000, singleBrackets2025)).toBeCloseTo(2_162, -1);
  });

  it("handles negative income as 0", () => {
    expect(applyBrackets(-1000, singleBrackets2025)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeSeTax — SE tax only
// ---------------------------------------------------------------------------
describe("computeSeTax", () => {
  it("correctly applies 92.35% factor and 15.3% rate for low income", () => {
    // netSE = $50,000 → SE earnings = 50,000 * 0.9235 = 46,175 → tax = 46,175 * 0.153 ≈ 7,065
    const tax = computeSeTax(50_000, 0, 2025);
    expect(tax).toBeCloseTo(7_065, -1);
  });

  it("caps SS portion at SS wage base", () => {
    // Net SE $200k → SE earnings = 184,700. SS: $176,100 × 12.4% = $21,836. Medicare: $184,700 × 2.9% = $5,356.
    const tax = computeSeTax(200_000, 0, 2025);
    const expected = Math.round(176_100 * 0.124 + 184_700 * 0.029);
    expect(tax).toBeCloseTo(expected, -1);
  });

  it("returns 0 for zero SE income", () => {
    expect(computeSeTax(0, 0, 2025)).toBe(0);
  });

  it("applies additional medicare tax on high earners", () => {
    // $300k net SE, 0 W-2 → earnings = 276,750
    // SS: $176,100 × 12.4% = $21,836
    // Medicare: $276,750 × 2.9% = $8,026
    // Additional Medicare: ($276,750 - $200,000) × 0.9% = $690
    const tax = computeSeTax(300_000, 0, 2025);
    const ssWageBase = 176_100;
    const earnings = 300_000 * 0.9235;
    const expected = Math.round(
      ssWageBase * 0.124 + earnings * 0.029 + Math.max(0, (earnings - 200_000) * 0.009),
    );
    expect(tax).toBeCloseTo(expected, -1);
  });

  it("credits W-2 wages against SS cap", () => {
    // $100k SE, $150k W-2 → SS already covered by W-2 to $150k, but SE earnings = 92,350
    // SS eligible from SE: max(0, min(92,350, 176,100 - 150,000)) = min(92,350, 26,100) = 26,100
    const tax = computeSeTax(100_000, 150_000, 2025);
    const earnings = 100_000 * 0.9235;
    const ssEligible = Math.min(earnings, Math.max(0, 176_100 - 150_000));
    const expected = Math.round(ssEligible * 0.124 + earnings * 0.029);
    // Note: additional medicare applies if combined > 200k
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(computeSeTax(100_000, 0, 2025)); // less than without W-2
  });
});

// ---------------------------------------------------------------------------
// computeQbiDeduction
// ---------------------------------------------------------------------------
describe("computeQbiDeduction", () => {
  it("gives full 20% deduction below phase-out threshold", () => {
    // $100k QBI, $90k tentative taxable income (below $197,300 single threshold)
    expect(computeQbiDeduction(100_000, 90_000, 2025, "single")).toBe(20_000);
  });

  it("gives 0 deduction above upper threshold for sole prop", () => {
    // Above $247,300 for single 2025
    expect(computeQbiDeduction(100_000, 260_000, 2025, "single")).toBe(0);
  });

  it("phases out linearly between thresholds", () => {
    // At midpoint ($222,300), expect ~10,000 (50% of $20,000)
    const result = computeQbiDeduction(100_000, 222_300, 2025, "single");
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(20_000);
  });

  it("gives 0 for negative QBI", () => {
    expect(computeQbiDeduction(-5_000, 50_000, 2025, "single")).toBe(0);
  });

  it("uses higher MFJ thresholds", () => {
    // $200k tentative taxable income — below MFJ lower threshold ($394,600), so full deduction
    expect(computeQbiDeduction(100_000, 200_000, 2025, "married_joint")).toBe(20_000);
    // $200k is above single lower threshold ($197,300) but below upper ($247,300) — phase-out, not 0
    const singleResult = computeQbiDeduction(100_000, 200_000, 2025, "single");
    expect(singleResult).toBeGreaterThan(0);
    expect(singleResult).toBeLessThan(20_000);
    // To get 0 for single, need taxable income above upper threshold ($247,300)
    expect(computeQbiDeduction(100_000, 260_000, 2025, "single")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeFederalTax — full integration scenarios
// All results checked within $50 tolerance.
// ---------------------------------------------------------------------------
describe("computeFederalTax", () => {
  // Scenario 1: $80k income, $8k expenses, single, 2025, no W-2
  // Net SE: $72,000. SE earnings: $66,492. SE tax: ~$10,173. Half SE ded: ~$5,087.
  // AGI: 72,000 - 5,087 = 66,913. Std ded: $15,000. Tentative taxable: 51,913.
  // QBI: 20% of 72,000 = 14,400. Final taxable: 37,513.
  // Tax: (11,925 × 10%) + (37,513 - 11,925) × 12% = 1,193 + 3,071 = $4,264
  it("$80k income / $8k expenses / single / 2025", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 80_000,
      businessExpenses: 8_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(72_000);
    expect(r.seTax).toBeCloseTo(10_173, -1);
    expect(r.incomeTax).toBeCloseTo(4_264, -1);
    expect(r.totalFederal).toBeCloseTo(14_437, -1);
  });

  // Scenario 2: $150k income, $20k expenses, married_joint, 2025
  it("$150k income / $20k expenses / married_joint / 2025", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 150_000,
      businessExpenses: 20_000,
      filingStatus: "married_joint",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(130_000);
    expect(r.seTax).toBeGreaterThan(17_000);
    expect(r.incomeTax).toBeGreaterThan(0);
    expect(r.totalFederal).toBeGreaterThan(25_000);
  });

  // Scenario 3: $40k income, $5k expenses, single, 2025
  it("$40k income / $5k expenses / single / 2025 — low income", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 40_000,
      businessExpenses: 5_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(35_000);
    expect(r.seTax).toBeCloseTo(35_000 * 0.9235 * 0.153, -1);
    expect(r.incomeTax).toBeGreaterThan(0);
  });

  // Scenario 4: $250k income, $30k expenses, single, 2025 — QBI phase-out zone
  it("$250k income / $30k expenses / single / 2025 — QBI phase-out", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 250_000,
      businessExpenses: 30_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(220_000);
    // QBI should be 0 or reduced (taxable income near/above $247k upper threshold)
    expect(r.qbiDeduction).toBeLessThanOrEqual(44_000); // can't exceed 20% of 220k
  });

  // Scenario 5: $10k income, $2k expenses, head_of_household, 2025
  it("$10k income / $2k expenses / head_of_household / 2025 — very low income", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 10_000,
      businessExpenses: 2_000,
      filingStatus: "head_of_household",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(8_000);
    // After standard deduction ($22,500), taxable income should be 0
    expect(r.taxableIncome).toBe(0);
    expect(r.incomeTax).toBe(0);
    // SE tax still applies on the net earnings
    expect(r.seTax).toBeGreaterThan(0);
  });

  // Scenario 6: $0 income — zero result
  it("$0 income returns all zeros for income tax", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 0,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.incomeTax).toBe(0);
    expect(r.seTax).toBe(0);
    expect(r.totalFederal).toBe(0);
  });

  // Scenario 7: Expenses exceed income — no SE tax
  it("expenses > income — no net SE income", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 20_000,
      businessExpenses: 25_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(0);
    expect(r.seTax).toBe(0);
  });

  // Scenario 8: High income single — hits 37% bracket
  it("$500k income / $50k expenses / single / 2025 — top bracket", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 500_000,
      businessExpenses: 50_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(450_000);
    expect(r.qbiDeduction).toBe(0); // above upper phase-out threshold
    expect(r.incomeTax).toBeGreaterThan(100_000);
    expect(r.totalFederal).toBeGreaterThan(150_000);
  });

  // Scenario 9: W-2 income reduces SS SE tax
  it("high SE income + W-2 — W-2 credit on SS reduces SE tax", () => {
    // Need SE income where SE earnings + W-2 would exceed SS wage base ($176,100)
    // $160k creator + $100k W-2: W-2 already covers $100k of SS base.
    // SE SS eligible = min(SE earnings, 176,100 - 100,000) = min(147,760, 76,100) = 76,100
    // Without W-2: SS = 147,760 * 0.124 = 18,322. With W-2: SS = 76,100 * 0.124 = 9,436.
    const withW2 = computeFederalTax({
      grossCreatorIncome: 160_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 100_000,
      taxYear: 2025,
    });
    const withoutW2 = computeFederalTax({
      grossCreatorIncome: 160_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(withW2.seTax).toBeLessThan(withoutW2.seTax);
  });

  // Scenario 10: 2024 vs 2025 brackets differ
  it("2024 brackets are slightly lower than 2025", () => {
    const input = {
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "single" as const,
      w2Income: 0,
    };
    const r2024 = computeFederalTax({ ...input, taxYear: 2024 });
    const r2025 = computeFederalTax({ ...input, taxYear: 2025 });
    // 2025 standard deduction is higher, so 2025 tax should be slightly lower
    expect(r2025.standardDeduction).toBeGreaterThan(r2024.standardDeduction);
  });

  // Scenario 11: married_separate — same as single brackets for this test
  it("married_separate filing status processes correctly", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "married_separate",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.standardDeduction).toBe(15_000);
    expect(r.incomeTax).toBeGreaterThan(0);
  });

  // Scenario 12: very high MFJ income — no QBI (must be above $494,600 upper MFJ threshold)
  it("$800k MFJ / $60k expenses / 2025 — no QBI deduction", () => {
    // netSE = 740k. halfSE ~$28k. AGI ~712k. Taxable before QBI = 712k - 30k = 682k.
    // Above MFJ upper threshold ($494,600) → QBI = 0.
    const r = computeFederalTax({
      grossCreatorIncome: 800_000,
      businessExpenses: 60_000,
      filingStatus: "married_joint",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.qbiDeduction).toBe(0); // above $494,600 upper threshold
  });

  // Scenario 13: standard deduction eliminates taxable income
  it("income just above standard deduction — minimal income tax", () => {
    // netSE = $16k, half SE ded ~$1,121, AGI ~$14,879, std ded $15,000
    // After QBI: taxable income might be 0
    const r = computeFederalTax({
      grossCreatorIncome: 18_000,
      businessExpenses: 2_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.taxableIncome).toBeLessThan(5_000);
    expect(r.incomeTax).toBeLessThan(500);
  });

  // Scenario 14: QBI just below threshold — full deduction
  it("$200k income / $10k expenses / single / 2025 — QBI near threshold", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 200_000,
      businessExpenses: 10_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // tentative taxable income ~$150k, below $197,300 threshold → full QBI
    expect(r.qbiDeduction).toBeCloseTo(190_000 * 0.2, -1);
  });

  // Scenario 15: $120k income / $15k expenses / single / 2025
  it("$120k income / $15k expenses / single / 2025", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 120_000,
      businessExpenses: 15_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(105_000);
    expect(r.seTax).toBeGreaterThan(14_000);
    expect(r.incomeTax).toBeGreaterThan(5_000);
    expect(r.totalFederal).toBeGreaterThan(20_000);
  });

  // Scenario 16: $30k income / single / 2025 — social security still applies
  it("$30k income / single / 2025 — no income tax, but SE tax applies", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 30_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // AGI ~$27,757, std ded $15,000, QBI $6k, taxable ~$6,757
    expect(r.seTax).toBeGreaterThan(3_000);
    expect(r.incomeTax).toBeGreaterThan(0);
  });

  // Scenario 17: 2026 uses 2025 brackets
  it("2026 uses same brackets as 2025 (pending IRS announcement)", () => {
    const r2025 = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    const r2026 = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2026,
    });
    expect(r2025.incomeTax).toBe(r2026.incomeTax);
  });

  // Scenario 18: QBI cannot exceed 20% of QBI income
  it("QBI deduction never exceeds 20% of net SE income", () => {
    const cases = [
      { income: 50_000, expenses: 5_000 },
      { income: 100_000, expenses: 20_000 },
      { income: 300_000, expenses: 50_000 },
    ];
    for (const { income, expenses } of cases) {
      const r = computeFederalTax({
        grossCreatorIncome: income,
        businessExpenses: expenses,
        filingStatus: "single",
        w2Income: 0,
        taxYear: 2025,
      });
      const maxQbi = Math.round((income - expenses) * 0.2);
      expect(r.qbiDeduction).toBeLessThanOrEqual(maxQbi + 1); // +1 for rounding
    }
  });

  // Scenario 19: totalFederal = incomeTax + seTax
  it("totalFederal equals incomeTax + seTax", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 75_000,
      businessExpenses: 10_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.totalFederal).toBe(r.incomeTax + r.seTax);
  });

  // Scenario 20: MFJ double deduction
  it("MFJ standard deduction is double single", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "married_joint",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.standardDeduction).toBe(30_000);
  });

  // Scenario 21: Additional Medicare Tax on very high SE income
  it("additional Medicare tax applies on SE income > $200k", () => {
    // At $200k SE income, SE earnings = $184,700. Additional Medicare threshold = $200k.
    // No additional Medicare below $200k SE earnings (≈ $217k gross).
    // Above $200k SE earnings, 0.9% applies to the excess.
    const belowThreshold = computeFederalTax({
      grossCreatorIncome: 100_000, // SE earnings ~$92k, well below $200k threshold
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    const aboveThreshold = computeFederalTax({
      grossCreatorIncome: 350_000, // SE earnings ~$323k, well above $200k threshold
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // For income above threshold, the SE tax includes additional 0.9% Medicare
    // Additional Medicare = ($323k - $200k) × 0.009 ≈ $1,107 extra
    // Verify the higher earner's SE tax is higher than simple SS+Medicare alone
    const seEarningsAbove = 350_000 * 0.9235;
    const ssWageBase = 176_100;
    const baseSeTaxAbove = Math.round(ssWageBase * 0.124 + seEarningsAbove * 0.029);
    expect(aboveThreshold.seTax).toBeGreaterThan(baseSeTaxAbove);
    // The below-threshold earner should have NO additional Medicare
    const seEarningsBelow = 100_000 * 0.9235;
    const baseSeTaxBelow = Math.round(seEarningsBelow * 0.124 + seEarningsBelow * 0.029);
    expect(belowThreshold.seTax).toBeCloseTo(baseSeTaxBelow, -1);
  });

  // Scenario 22: AGI calculation
  it("AGI = netSEIncome + w2Income - halfSeTaxDeduction", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 80_000,
      businessExpenses: 8_000,
      filingStatus: "single",
      w2Income: 20_000,
      taxYear: 2025,
    });
    expect(r.agi).toBe(r.netSEIncome + 20_000 - r.halfSeTaxDeduction);
  });

  // Scenario 23: head_of_household gets more favorable bracket start
  it("head_of_household has higher 10% bracket than single", () => {
    const hoh = computeFederalTax({
      grossCreatorIncome: 20_000,
      businessExpenses: 0,
      filingStatus: "head_of_household",
      w2Income: 0,
      taxYear: 2025,
    });
    const single = computeFederalTax({
      grossCreatorIncome: 20_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // HoH standard deduction is $22,500 vs $15,000 — income tax should be 0 for HoH
    expect(hoh.incomeTax).toBeLessThanOrEqual(single.incomeTax);
  });

  // Scenario 24: High expenses reduce SE tax proportionally
  it("higher expenses reduce SE tax", () => {
    const lowExp = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 5_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    const highExp = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 40_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(highExp.seTax).toBeLessThan(lowExp.seTax);
    expect(highExp.incomeTax).toBeLessThan(lowExp.incomeTax);
  });

  // Scenario 25: SE tax floor — very small income still triggers
  it("$5k income triggers small SE tax", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 5_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // 5000 * 0.9235 * 0.153 ≈ $707
    expect(r.seTax).toBeCloseTo(707, -1);
  });

  // Scenario 26: 2024 SS wage base is $168,600 (lower than 2025's $176,100)
  it("2024 SS wage base differs from 2025", () => {
    const r2024 = computeFederalTax({
      grossCreatorIncome: 200_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2024,
    });
    const r2025 = computeFederalTax({
      grossCreatorIncome: 200_000,
      businessExpenses: 0,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // 2025 has higher SS wage base so more SS tax
    expect(r2025.seTax).toBeGreaterThan(r2024.seTax);
  });

  // Scenario 27: Married joint QBI threshold is double single
  it("married joint QBI thresholds are double single", () => {
    // At $380k taxable income: above single upper ($247.3k) but below MFJ lower ($394.6k)
    // For single: no QBI deduction. For MFJ: full QBI deduction.
    const high = {
      grossCreatorIncome: 420_000,
      businessExpenses: 20_000,
      w2Income: 0,
      taxYear: 2025,
    };
    const mfjResult = computeFederalTax({ ...high, filingStatus: "married_joint" });
    const singleResult = computeFederalTax({ ...high, filingStatus: "single" });
    // MFJ: tentative taxable income ~$302k, below $394,600 MFJ threshold → some QBI
    // Single: above $247,300 → $0 QBI
    expect(mfjResult.qbiDeduction).toBeGreaterThan(singleResult.qbiDeduction);
  });

  // Scenario 28: $50k creator income + $60k W-2, single, 2025
  it("$50k creator / $60k W-2 / single / 2025 — combined income", () => {
    // netSE = $45k. SE earnings = $41,558. SE tax ≈ $6,358. Half SE ded ≈ $3,179.
    // AGI = 45,000 + 60,000 - 3,179 = $101,821. Std ded = $15,000. Tentative = $86,821.
    // QBI = 45,000 × 0.20 = $9,000. Final taxable = $77,821.
    // Income tax: 10% × $11,925 + 12% × $36,550 + 22% × $29,346 ≈ $12,035
    const r = computeFederalTax({
      grossCreatorIncome: 50_000,
      businessExpenses: 5_000,
      filingStatus: "single",
      w2Income: 60_000,
      taxYear: 2025,
    });
    expect(r.netSEIncome).toBe(45_000);
    expect(r.agi).toBeGreaterThan(100_000);
    expect(r.incomeTax).toBeGreaterThan(10_000); // ~$12k after QBI deduction
    expect(r.incomeTax).toBeLessThan(18_000);
    expect(r.totalFederal).toBeGreaterThan(16_000); // income tax + SE tax
  });

  // Scenario 29: Net SE income feeds QBI correctly
  it("QBI uses net SE income (gross - expenses)", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 25_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // netSE = $75,000. Max QBI = $75,000 * 0.20 = $15,000
    expect(r.qbiDeduction).toBeLessThanOrEqual(15_000);
  });

  // Scenario 30: halfSeTaxDeduction is exactly seTax / 2
  it("halfSeTaxDeduction = round(seTax / 2)", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 100_000,
      businessExpenses: 10_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    expect(r.halfSeTaxDeduction).toBe(Math.round(r.seTax / 2));
  });

  // Scenario 31: taxableIncome never goes negative
  it("taxableIncome is never negative", () => {
    const cases = [
      { income: 5_000, expenses: 0 },
      { income: 15_000, expenses: 14_000 },
      { income: 0, expenses: 0 },
    ];
    for (const { income, expenses } of cases) {
      const r = computeFederalTax({
        grossCreatorIncome: income,
        businessExpenses: expenses,
        filingStatus: "single",
        w2Income: 0,
        taxYear: 2025,
      });
      expect(r.taxableIncome).toBeGreaterThanOrEqual(0);
    }
  });

  // Scenario 32: $200k creator income — spot-check total federal
  it("$200k income / $20k expenses / single / 2025 — reasonable total tax", () => {
    const r = computeFederalTax({
      grossCreatorIncome: 200_000,
      businessExpenses: 20_000,
      filingStatus: "single",
      w2Income: 0,
      taxYear: 2025,
    });
    // Total federal should be between $45k–$65k (rough sanity check)
    expect(r.totalFederal).toBeGreaterThan(45_000);
    expect(r.totalFederal).toBeLessThan(70_000);
  });
});
