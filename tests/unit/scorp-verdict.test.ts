// S-corp verdict tests — must hit all three paths with creator-specific inputs.
// These are the high-stakes tests: wrong verdicts mislead creators into bad 5-year decisions.
// ALL three paths (yes / no / wait) MUST be covered.

import { computeScorp } from "@/lib/tax/scorp";
import { describe, expect, it } from "vitest";

// Minimal valid base input — tests override specific fields
const base = {
  primary_platform: "youtube" as const,
  niche: "education" as const,
  audience_size: "100k-1M" as const,
  hours_per_week: 30,
  total_creator_income: 120_000,
  business_expenses: 15_000,
  state: "TX",
  current_entity: "single_member_llc" as const,
  years_creating_full_time: "5+" as const,
  manager_or_agency_cut: 0,
};

// ── "no" verdict paths ────────────────────────────────────────────────────────

describe("verdict: 'no'", () => {
  it("returns 'no' when profit < $60k", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 55_000,
      business_expenses: 5_000,
      state: "TX",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictHeadline).toMatch(/don't switch/i);
    expect(result.verdictReason).toMatch(/60[,k]/i); // mentions 60k
  });

  it("returns 'no' when CA + profit < $75k", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 70_000,
      business_expenses: 5_000,
      state: "CA",
      years_creating_full_time: "3-5",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/franchise|1\.5%|california/i);
  });

  it("returns 'no' for CA at exactly $74,999 profit", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 80_000,
      business_expenses: 5_001, // profit = $74,999
      state: "CA",
    });
    expect(result.verdict).toBe("no");
  });

  it("returns 'no' when years_creating_full_time is '<1'", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 150_000,
      business_expenses: 20_000,
      years_creating_full_time: "<1",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/5.year|lockout|less than a year/i);
  });

  it("returns 'no' when current_entity is 'scorp_already'", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 200_000,
      business_expenses: 20_000,
      current_entity: "scorp_already",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/already an s.corp|already elected/i);
  });

  it("returns 'no' for zero income", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 0,
      business_expenses: 0,
    });
    expect(result.verdict).toBe("no");
  });

  it("returns 'no' for expenses exceeding income (negative profit)", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 50_000,
      business_expenses: 60_000,
    });
    expect(result.verdict).toBe("no");
  });
});

// ── "wait" verdict paths ──────────────────────────────────────────────────────

describe("verdict: 'wait'", () => {
  it("returns 'wait' for 1-3yr creator just under $90k threshold", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 95_000,
      business_expenses: 12_000, // profit = $83k
      state: "TX",
      years_creating_full_time: "1-3",
    });
    expect(result.verdict).toBe("wait");
    expect(result.verdictReason).toMatch(/1.3 year|income.proving|5.year/i);
  });

  it("returns 'wait' for breakeven zone ($60k–$80k profit, non-CA)", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 78_000,
      business_expenses: 8_000, // profit = $70k
      state: "TX",
      years_creating_full_time: "3-5",
    });
    expect(result.verdict).toBe("wait");
    expect(result.verdictReason).toMatch(/breakeven|borderline|right at/i);
  });

  it("returns 'wait' for profit exactly in $60k–$80k range", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 75_000,
      business_expenses: 10_000, // profit = $65k
      state: "FL",
      years_creating_full_time: "3-5",
    });
    expect(result.verdict).toBe("wait");
  });

  it("wait verdict contains next-quarter advice", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 80_000,
      business_expenses: 10_000, // profit = $70k
      state: "TX",
      years_creating_full_time: "3-5",
    });
    expect(result.verdict).toBe("wait");
    expect(result.verdictReason).toMatch(/quarter|re.run/i);
  });
});

// ── "yes" verdict paths ───────────────────────────────────────────────────────

describe("verdict: 'yes'", () => {
  it("returns 'yes' for stable mid-tier finance creator in low-tax state", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 150_000,
      business_expenses: 20_000, // profit = $130k
      state: "TX",
      niche: "finance",
      years_creating_full_time: "5+",
    });
    expect(result.verdict).toBe("yes");
    expect(result.netSavings).toBeGreaterThan(4_000);
  });

  it("returns 'yes' for $120k profit, tech niche, 5+ years, FL", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 140_000,
      business_expenses: 20_000, // profit = $120k
      state: "FL",
      niche: "tech",
      years_creating_full_time: "5+",
    });
    expect(result.verdict).toBe("yes");
    expect(result.grossSavings).toBeGreaterThan(result.runningCosts.total);
  });

  it("yes verdict mentions Form 2553 filing deadline", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 160_000,
      business_expenses: 25_000,
      state: "TX",
      years_creating_full_time: "5+",
    });
    expect(result.verdict).toBe("yes");
    expect(result.filingDeadline).toMatch(/march 15/i);
  });

  it("yes verdict has positive net savings", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 200_000,
      business_expenses: 30_000,
      state: "WA",
      years_creating_full_time: "5+",
    });
    expect(result.verdict).toBe("yes");
    expect(result.netSavings).toBeGreaterThan(0);
  });

  it("yes verdict headlines include approximate savings amount", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 180_000,
      business_expenses: 20_000,
      state: "TX",
      years_creating_full_time: "5+",
    });
    expect(result.verdict).toBe("yes");
    expect(result.verdictHeadline).toMatch(/save|\/year|yr/i);
  });
});

// ── All verdict paths covered (CI gate) ──────────────────────────────────────

describe("verdict coverage gate", () => {
  it("yes path reachable", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 150_000,
      business_expenses: 20_000,
      state: "TX",
      years_creating_full_time: "5+",
    });
    expect(r.verdict).toBe("yes");
  });

  it("no path reachable", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 40_000,
      business_expenses: 5_000,
      state: "TX",
    });
    expect(r.verdict).toBe("no");
  });

  it("wait path reachable", () => {
    const r = computeScorp({
      ...base,
      total_creator_income: 75_000,
      business_expenses: 8_000,
      state: "TX",
      years_creating_full_time: "3-5",
    });
    expect(r.verdict).toBe("wait");
  });
});
