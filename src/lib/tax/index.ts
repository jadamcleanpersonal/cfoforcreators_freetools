// Tax estimator orchestrator.
// Combines federal + state + SE + safe harbor + quarterly into the final result shape.
// Called by the API route — pure function, no React, no I/O.

import { getStateName } from "@/data/states";
import { type FilingStatus, computeFederalTax } from "./federal";
import { type Quarter, computeQuarterlyPayment } from "./quarterly";
import { computeSafeHarbor } from "./safe_harbor";
import { computeStateTax } from "./state";

// ── Input schema (mirrors src/tools/tax-estimator.ts zod schema) ──────────
export interface TaxEstimatorInput {
  primary_platform: "youtube" | "tiktok" | "twitch" | "instagram" | "multi" | "podcast";
  niche: "gaming" | "beauty" | "finance" | "lifestyle" | "education" | "tech" | "other";
  tax_year: number;
  current_quarter: Quarter;
  total_creator_income_ytd: number;
  income_breakdown?: {
    adsense?: number;
    sponsors?: number;
    patreon?: number;
    affiliate?: number;
    merch?: number;
    courses?: number;
  };
  business_expenses_ytd: number;
  state: string;
  filing_status: FilingStatus;
  other_w2_income: number;
  already_paid_estimated_taxes: number;
  withholding_from_w2: number;
}

// ── Output schema (mirrors src/tools/tax-estimator.ts zod outputSchema) ───
export interface TaxEstimatorOutput {
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string;
  verdictReason: string;
  amountThisQuarter: number;
  deadline: string; // human-readable, e.g. "April 15, 2025"
  projectedAnnualIncome: number;
  projectedAnnualExpenses: number;
  federalBreakdown: {
    incomeTax: number;
    seTax: number;
    qbiDeduction: number;
    standardDeduction: number;
  };
  stateTax: number;
  stateName: string;
  safeHarborThreshold: number;
  safeHarborNote: string;
  catchUpPenaltyEstimate?: number;
  // For ResultDisplay
  totalProjectedTax: number;
  effectiveRate: number; // decimal (0.22 = 22%)
}

export function computeTaxEstimate(input: TaxEstimatorInput): TaxEstimatorOutput {
  const {
    tax_year,
    current_quarter,
    total_creator_income_ytd,
    business_expenses_ytd,
    state,
    filing_status,
    other_w2_income,
    already_paid_estimated_taxes,
    withholding_from_w2,
  } = input;

  // ── Step 1: Annualize YTD figures ────────────────────────────────────────
  // quarters_elapsed: q1=1, q2=2, q3=3, q4=4
  const qElapsed = { q1: 1, q2: 2, q3: 3, q4: 4 }[current_quarter];
  const annualizeFactor = 4 / qElapsed;

  const projectedAnnualIncome = Math.round(total_creator_income_ytd * annualizeFactor);
  const projectedAnnualExpenses = Math.round(business_expenses_ytd * annualizeFactor);

  // W-2 income: treat as already annualized (user enters annual gross, not YTD)
  // Note: the form labels this as annual, so no annualization needed.
  const annualW2 = other_w2_income;
  const annualW2Withholding = Math.round(withholding_from_w2 * annualizeFactor);

  // ── Step 2: Federal tax ──────────────────────────────────────────────────
  const federal = computeFederalTax({
    grossCreatorIncome: projectedAnnualIncome,
    businessExpenses: projectedAnnualExpenses,
    filingStatus: filing_status,
    w2Income: annualW2,
    taxYear: tax_year,
  });

  // ── Step 3: State tax ────────────────────────────────────────────────────
  const stateResult = computeStateTax(federal.agi, state, filing_status);

  // ── Step 4: Total projected annual tax ──────────────────────────────────
  const totalProjectedTax = federal.totalFederal + stateResult.stateTax;

  // ── Step 5: Safe harbor ──────────────────────────────────────────────────
  const { threshold: safeHarborThreshold, methodologyNote: safeHarborNote } =
    computeSafeHarbor(totalProjectedTax);

  // ── Step 6: Quarterly payment + verdict ──────────────────────────────────
  // W-2 withholding is credited ratably throughout the year.
  // Project full-year withholding so the "no" verdict works correctly:
  // if projected annual withholding covers safe harbor, no quarterly payment is needed.
  const quarterly = computeQuarterlyPayment({
    safeHarborThreshold,
    alreadyPaidEstimatedTaxes: already_paid_estimated_taxes,
    withholdingFromW2: annualW2Withholding,
    currentQuarter: current_quarter,
    taxYear: tax_year,
  });

  const effectiveRate =
    projectedAnnualIncome + annualW2 > 0
      ? totalProjectedTax / (projectedAnnualIncome + annualW2)
      : 0;

  return {
    verdict: quarterly.verdict,
    verdictHeadline: quarterly.verdictHeadline,
    verdictReason: quarterly.verdictReason,
    amountThisQuarter: quarterly.amountDueThisQuarter,
    deadline: quarterly.deadline.label,
    projectedAnnualIncome,
    projectedAnnualExpenses,
    federalBreakdown: {
      incomeTax: federal.incomeTax,
      seTax: federal.seTax,
      qbiDeduction: federal.qbiDeduction,
      standardDeduction: federal.standardDeduction,
    },
    stateTax: stateResult.stateTax,
    stateName: getStateName(state),
    safeHarborThreshold,
    safeHarborNote,
    catchUpPenaltyEstimate: quarterly.verdict === "wait" ? quarterly.penaltyEstimate : undefined,
    totalProjectedTax,
    effectiveRate: Math.round(effectiveRate * 1000) / 1000,
  };
}
