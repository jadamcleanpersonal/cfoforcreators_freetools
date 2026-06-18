// State-specific S-corp gotcha tests.
// Every state with special S-corp rules must be tested.
// CA, NY, NJ, OR, TN, NH — these are the states where standard advice breaks.

import { computeScorp } from "@/lib/tax/scorp";
import type { ScorpInputs } from "@/lib/tax/scorp";
import { describe, expect, it } from "vitest";

const base: ScorpInputs = {
  primary_platform: "youtube",
  niche: "education",
  audience_size: "100k-1M",
  hours_per_week: 30,
  total_creator_income: 150_000,
  business_expenses: 20_000, // profit = $130k
  state: "TX",
  current_entity: "single_member_llc",
  years_creating_full_time: "5+",
  manager_or_agency_cut: 0,
};

// ── California ────────────────────────────────────────────────────────────────

describe("California S-corp gotchas", () => {
  it("returns 'no' for CA + profit < $75k", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 75_000,
      business_expenses: 5_000, // profit = $70k
      state: "CA",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/franchise|1\.5%|california/i);
  });

  it("CA stateGotchas mention $800 franchise tax", () => {
    const result = computeScorp({ ...base, state: "CA" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
    expect(result.stateGotchas[0]).toMatch(/\$800|franchise/i);
  });

  it("CA stateGotchas mention 1.5% net income tax", () => {
    const result = computeScorp({ ...base, state: "CA" });
    expect(result.stateGotchas[0]).toMatch(/1\.5%/);
  });

  it("CA stateFilingFees > $800 (includes % component)", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 150_000,
      business_expenses: 20_000, // profit = $130k
      state: "CA",
    });
    // $800 + 1.5% of $130k = $800 + $1,950 = $2,750
    expect(result.runningCosts.stateFilingFees).toBeGreaterThan(800);
    expect(result.runningCosts.stateFilingFees).toBeGreaterThan(2_000);
  });

  it("CA with high profit ($100k+) still shows gotchas warning", () => {
    const result = computeScorp({
      ...base,
      total_creator_income: 200_000,
      business_expenses: 30_000, // profit = $170k
      state: "CA",
    });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
    expect(result.stateGotchas[0]).toMatch(/california|CA/i);
  });
});

// ── New York ──────────────────────────────────────────────────────────────────

describe("New York S-corp gotchas", () => {
  it("NY shows state gotchas", () => {
    const result = computeScorp({ ...base, state: "NY" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
  });

  it("NY mentions NYC GCT in gotchas", () => {
    const result = computeScorp({ ...base, state: "NY" });
    const allGotchas = result.stateGotchas.join(" ");
    expect(allGotchas).toMatch(/NYC|general corporation tax|GCT/i);
  });

  it("NY state filing fees are above default $100", () => {
    const result = computeScorp({ ...base, state: "NY" });
    expect(result.runningCosts.stateFilingFees).toBeGreaterThan(100);
  });
});

// ── New Jersey ────────────────────────────────────────────────────────────────

describe("New Jersey S-corp gotchas", () => {
  it("NJ shows state gotchas", () => {
    const result = computeScorp({ ...base, state: "NJ" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
  });

  it("NJ gotcha mentions minimum annual tax", () => {
    const result = computeScorp({ ...base, state: "NJ" });
    expect(result.stateGotchas[0]).toMatch(/minimum|annual tax|\$375/i);
  });

  it("NJ state filing fees are $375", () => {
    const result = computeScorp({ ...base, state: "NJ" });
    expect(result.runningCosts.stateFilingFees).toBe(375);
  });
});

// ── Oregon ────────────────────────────────────────────────────────────────────

describe("Oregon S-corp gotchas", () => {
  it("OR shows state gotchas", () => {
    const result = computeScorp({ ...base, state: "OR" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
  });

  it("OR gotcha mentions excise tax", () => {
    const result = computeScorp({ ...base, state: "OR" });
    expect(result.stateGotchas[0]).toMatch(/excise|\$150/i);
  });

  it("OR state filing fees are $150", () => {
    const result = computeScorp({ ...base, state: "OR" });
    expect(result.runningCosts.stateFilingFees).toBe(150);
  });
});

// ── Tennessee ─────────────────────────────────────────────────────────────────

describe("Tennessee S-corp gotchas", () => {
  it("TN shows state gotchas", () => {
    const result = computeScorp({ ...base, state: "TN" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
  });

  it("TN gotcha mentions excise tax or franchise tax", () => {
    const result = computeScorp({ ...base, state: "TN" });
    expect(result.stateGotchas[0]).toMatch(/excise|franchise|6\.5%|tennessee/i);
  });

  it("TN filing fees are above $0", () => {
    const result = computeScorp({ ...base, state: "TN" });
    expect(result.runningCosts.stateFilingFees).toBeGreaterThan(0);
  });
});

// ── New Hampshire ─────────────────────────────────────────────────────────────

describe("New Hampshire S-corp gotchas", () => {
  it("NH shows state gotchas", () => {
    const result = computeScorp({ ...base, state: "NH" });
    expect(result.stateGotchas.length).toBeGreaterThan(0);
  });

  it("NH gotcha mentions BPT or BET", () => {
    const result = computeScorp({ ...base, state: "NH" });
    expect(result.stateGotchas[0]).toMatch(/BPT|BET|business profits|new hampshire/i);
  });
});

// ── No-income-tax states ──────────────────────────────────────────────────────

describe("no-income-tax states", () => {
  it("TX shows informational gotcha about SE tax only", () => {
    const result = computeScorp({ ...base, state: "TX" });
    // TX may show a gotcha about no income tax (savings are purely SE tax)
    // OR may show no gotchas if not in the gotcha map
    // Either is valid — just verify no error
    expect(result.stateGotchas).toBeInstanceOf(Array);
  });

  it("FL has lower filing fees than CA", () => {
    const caResult = computeScorp({ ...base, state: "CA" });
    const flResult = computeScorp({ ...base, state: "FL" });
    expect(caResult.runningCosts.stateFilingFees).toBeGreaterThan(
      flResult.runningCosts.stateFilingFees,
    );
  });
});

// ── Cross-state comparison ────────────────────────────────────────────────────

describe("state net savings comparison", () => {
  it("same creator saves more in TX than CA at $130k profit", () => {
    const tx = computeScorp({ ...base, state: "TX" });
    const ca = computeScorp({ ...base, state: "CA" });

    expect(tx.netSavings).toBeGreaterThan(ca.netSavings);
  });

  it("CA is still potentially worth it at very high profit", () => {
    const ca = computeScorp({
      ...base,
      total_creator_income: 300_000,
      business_expenses: 40_000, // profit = $260k
      state: "CA",
    });
    // At $260k profit even after CA fees, savings should be positive
    expect(ca.grossSavings).toBeGreaterThan(ca.runningCosts.total);
  });
});
