// S-corp calculator — all math lives here.
// Pure functions, no React, no I/O.
//
// Key mechanism: S-corp splits income into salary (SE tax applies) +
// distributions (SE tax skipped). Savings = SE tax on distributions.
// Running costs (payroll service, state fees, extra accounting) reduce net savings.
//
// Every verdict has a plain-language reason. "no" and "wait" are the
// brand-defining moments — get those right.

import {
  type AudienceTier,
  type HoursPerWeekTier,
  type NicheType,
  findBenchmark,
  getHoursPerWeekTier,
} from "@/data/niche_salary_benchmarks";
import { computeSeTax } from "./federal";

// ── Year to use for SE tax rate lookup ────────────────────────────────────────
// S-corp savings are a long-term decision; 2025 SS wage base is the best available.
const TAX_YEAR = 2025;

// ── Input / output types ─────────────────────────────────────────────────────

export type ScorpPlatform = "youtube" | "tiktok" | "twitch" | "instagram" | "multi" | "podcast";

export type ScorpCurrentEntity =
  | "sole_prop"
  | "single_member_llc"
  | "scorp_already"
  | "other"
  | "not_sure";

export type ScorpYearsFullTime = "<1" | "1-3" | "3-5" | "5+";

export interface ScorpInputs {
  primary_platform: ScorpPlatform;
  niche: NicheType;
  audience_size: AudienceTier;
  hours_per_week: number;
  total_creator_income: number;
  income_breakdown?: {
    adsense?: number;
    sponsors?: number;
    patreon?: number;
    affiliate?: number;
    merch?: number;
    courses?: number;
  };
  business_expenses: number;
  state: string;
  current_entity: ScorpCurrentEntity;
  years_creating_full_time: ScorpYearsFullTime;
  manager_or_agency_cut: number;
}

export interface ReasonableSalaryResult {
  low: number;
  recommended: number;
  high: number;
  defensibilityNote: string;
}

export interface ScorpRunningCosts {
  payrollServiceAnnual: number;
  stateFilingFees: number;
  additionalAccountingCost: number;
  total: number;
}

export interface ScorpResult {
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string;
  verdictReason: string;
  reasonableSalary: ReasonableSalaryResult;
  withoutScorpAnnualTax: number;
  withScorpAnnualTax: number;
  grossSavings: number;
  runningCosts: ScorpRunningCosts;
  netSavings: number;
  stateGotchas: string[];
  filingDeadline: string;
  breakdownExplainer: string;
}

// ── State-specific S-corp costs ───────────────────────────────────────────────
// These are costs ABOVE the standard running costs that apply to S-corps in
// certain states. Surfaced as gotchas + factored into running costs.

type StateScorpExtra = {
  /** Fixed annual cost (e.g. CA $800 franchise tax) */
  fixedAnnual: number;
  /** Percentage of net profit as decimal (e.g. CA 1.5% = 0.015) */
  percentOfProfit: number;
  /** Percentage of distributions (profit - salary) as decimal */
  percentOfDistributions: number;
  /** Filing fee estimate (biennial reports, misc) */
  stateFilingFee: number;
  gotchaTemplate: (fixedCost: number, percentCost: number, netProfit: number) => string;
};

const STATE_SCORP_EXTRAS: Partial<Record<string, StateScorpExtra>> = {
  CA: {
    fixedAnnual: 800,
    percentOfProfit: 0.015, // CA 1.5% S-corp net income tax
    percentOfDistributions: 0,
    stateFilingFee: 0, // included above
    gotchaTemplate: (fixed, pct, netProfit) => {
      const percentCost = Math.round(netProfit * 0.015);
      const total = fixed + percentCost;
      return `California charges S-corps $800/year in franchise tax plus 1.5% of net income ($${percentCost.toLocaleString()}). That's $${total.toLocaleString()} extra this year — before any savings. This often makes S-corp not worth it below $80k profit.`;
    },
  },
  NJ: {
    fixedAnnual: 375, // minimum annual tax for most creator income levels
    percentOfProfit: 0,
    percentOfDistributions: 0,
    stateFilingFee: 0,
    gotchaTemplate: () =>
      "New Jersey charges S-corps a minimum annual tax of $375 (up to $562.50 if gross receipts exceed $100k). Factor this into your breakeven calculation.",
  },
  NY: {
    fixedAnnual: 300, // estimated franchise tax + filing fees
    percentOfProfit: 0,
    percentOfDistributions: 0,
    stateFilingFee: 0,
    gotchaTemplate: () =>
      "New York charges S-corps franchise tax and filing fees (~$300/year estimated). NYC residents also owe General Corporation Tax (GCT) at 8.85% of net income — if you're in NYC, run the numbers carefully before switching.",
  },
  OR: {
    fixedAnnual: 150, // minimum excise tax
    percentOfProfit: 0,
    percentOfDistributions: 0,
    stateFilingFee: 0,
    gotchaTemplate: () =>
      "Oregon charges S-corps a $150 minimum excise tax. Oregon's Corporate Activity Tax (CAT) applies to revenue over $1M — unlikely to affect most creators.",
  },
  TN: {
    fixedAnnual: 100, // franchise tax minimum
    percentOfProfit: 0,
    percentOfDistributions: 0.065, // 6.5% excise tax on S-corp net income (roughly = distributions)
    stateFilingFee: 0,
    gotchaTemplate: (_, __, netProfit) => {
      const exciseEstimate = Math.round(netProfit * 0.065 * 0.5); // rough estimate on ~50% distributions
      return `Tennessee has no personal income tax, but S-corps owe a 6.5% excise tax on corporate net income (estimated ~$${exciseEstimate.toLocaleString()}/year based on your numbers) plus a franchise tax minimum of $100. This partially offsets the SE tax savings — make sure the math still works.`;
    },
  },
  NH: {
    fixedAnnual: 175,
    percentOfProfit: 0,
    percentOfDistributions: 0,
    stateFilingFee: 0,
    gotchaTemplate: () =>
      "New Hampshire has no personal income tax but does impose a Business Profits Tax (7.6%) and Business Enterprise Tax (0.55%) on S-corps with business income. Estimate ~$175 in minimum fees plus BPT on profits above $75k. Consult an accountant for your exact NH liability.",
  },
};

const DEFAULT_STATE_FILING_FEE = 100; // most states charge ~$100 in S-corp annual fees

// ── Reasonable salary calculation ────────────────────────────────────────────

/**
 * Compute the reasonable salary range given creator inputs.
 * Used to determine distributions (profit - salary) which skip SE tax.
 */
export function getReasonableSalary(inputs: ScorpInputs): ReasonableSalaryResult {
  const { niche, audience_size, hours_per_week, total_creator_income, manager_or_agency_cut } =
    inputs;

  const hoursTier: HoursPerWeekTier = getHoursPerWeekTier(hours_per_week);
  const benchmark = findBenchmark(niche, audience_size, hoursTier);

  // Midpoint from benchmark
  const midpoint = Math.round((benchmark.salaryLow + benchmark.salaryHigh) / 2);

  // Adjustments
  let recommended = midpoint;

  // Part-time adjustment: < 20 hours/week → lean toward low
  if (hours_per_week < 20) {
    recommended = Math.round(benchmark.salaryLow + (midpoint - benchmark.salaryLow) * 0.3);
  }

  // High-scrutiny adjustment: 1M+ audience + finance/tech → lean toward high
  if (audience_size === "1M+" && (niche === "finance" || niche === "tech")) {
    recommended = Math.round(midpoint + (benchmark.salaryHigh - midpoint) * 0.7);
  }

  // Adjusted gross income cap: salary should not exceed 50% of net creator income
  const adjustedIncome =
    total_creator_income * (1 - manager_or_agency_cut / 100) - inputs.business_expenses;
  const cap = Math.round(adjustedIncome * 0.5);
  recommended = Math.min(recommended, cap);

  // Floor: IRS won't accept below $40k for full-time creators
  const FLOOR = 40_000;
  recommended = Math.max(recommended, FLOOR);

  // Clamp low/high to the benchmark (don't go below the floor)
  const low = Math.max(benchmark.salaryLow, FLOOR);
  const high = Math.min(benchmark.salaryHigh, Math.round(adjustedIncome * 0.6));

  // Defensibility note
  let defensibilityNote = `Based on ${niche} niche, ${audience_size} audience, and ${hours_per_week} hrs/week (${hoursTier} tier). Source: ${benchmark.source}.`;

  if (hours_per_week < 20) {
    defensibilityNote +=
      " Part-time hours support a lower salary — you work fewer hours than a full-time equivalent.";
  }
  if (audience_size === "1M+" && (niche === "finance" || niche === "tech")) {
    defensibilityNote +=
      " Large audience in a high-scrutiny niche (finance/tech) — the IRS expects a salary closer to industry market rate.";
  }
  if (recommended <= FLOOR) {
    defensibilityNote +=
      " $40k is the practical IRS floor for full-time creators. Going lower invites audit risk.";
  }

  return { low, recommended, high: Math.max(high, recommended), defensibilityNote };
}

// ── Verdict logic ─────────────────────────────────────────────────────────────
// The most important function in the suite. Wrong verdicts are misleading.
// When in doubt: default to "wait", NEVER default to "yes".

export function scorpVerdict(
  inputs: ScorpInputs,
  netProfit: number,
): { verdict: "yes" | "no" | "wait"; headline: string; reason: string } {
  const { state, years_creating_full_time, current_entity } = inputs;

  // ── Hard NO cases ────────────────────────────────────────────────────────

  if (current_entity === "scorp_already") {
    return {
      verdict: "no",
      headline: "You're already an S-corp.",
      reason:
        "You've already elected S-corp status. Nothing to switch — you're getting the SE tax savings. If you're wondering whether to revoke the election, that requires IRS consent and a 5-year wait before re-electing. Talk to a CPA before doing anything.",
    };
  }

  if (netProfit < 60_000) {
    return {
      verdict: "no",
      headline: "Don't switch to an S-corp yet.",
      reason: `Your profit of $${netProfit.toLocaleString()} is below the breakeven point (~$60k). S-corp running costs — payroll service, extra accounting, state fees — will eat most or all of the SE tax savings at this income level. Stay as a sole prop or single-member LLC for now. Re-run this when profit crosses $60k.`,
    };
  }

  if (state === "CA" && netProfit < 75_000) {
    const caFee = 800 + Math.round(netProfit * 0.015);
    return {
      verdict: "no",
      headline: "Don't switch to an S-corp yet.",
      reason: `California's $800 franchise tax plus 1.5% S-corp tax would cost ~$${caFee.toLocaleString()}/year. At your profit level, that eats most of the savings. Re-run this when your profit consistently clears $80k.`,
    };
  }

  if (years_creating_full_time === "<1") {
    return {
      verdict: "no",
      headline: "Don't switch to an S-corp yet.",
      reason:
        "S-corp election locks you in for 5 years. You've been full-time less than a year — your income hasn't proven it's stable yet. If it drops below the breakeven point, you're stuck running payroll on a business that's not saving you money. Wait until you have at least 1–2 years of consistent income before making this commitment.",
    };
  }

  // ── WAIT cases ────────────────────────────────────────────────────────────

  if (netProfit >= 60_000 && netProfit < 80_000) {
    return {
      verdict: "wait",
      headline: "Wait one more quarter.",
      reason: `Your profit of $${netProfit.toLocaleString()} is right at the breakeven zone. The savings are real (~$1,500–$3,000/year at this level) but small enough that one bad quarter could flip the math. Wait until profit is consistently above $80k, then switch. Re-run this next quarter.`,
    };
  }

  if (years_creating_full_time === "1-3" && netProfit < 90_000) {
    return {
      verdict: "wait",
      headline: "Wait one more quarter.",
      reason: `You've been full-time 1–3 years, which means you're still in the income-proving phase. S-corp locks you in for 5 years. At $${netProfit.toLocaleString()} profit, the savings (~$2,500–$4,000/year) are real but not so large that they justify the 5-year commitment yet. Wait until income is more stable — ideally 2+ consistent strong quarters — then switch.`,
    };
  }

  // ── YES ───────────────────────────────────────────────────────────────────

  return {
    verdict: "yes",
    headline: "Yes, switch. You'll save real money.",
    reason: `Your profit of $${netProfit.toLocaleString()} is above the breakeven, your income history supports the 5-year commitment, and the running costs won't eat the savings. File Form 2553 before the deadline to elect S-corp status.`,
  };
}

// ── State gotcha messages ────────────────────────────────────────────────────

function getStateGotchas(state: string, netProfit: number, salary: number): string[] {
  const gotchas: string[] = [];
  const extra = STATE_SCORP_EXTRAS[state];

  if (!extra) {
    // No income tax states: SE tax savings are the whole game
    const noIncomeTaxStates = ["TX", "FL", "WA", "NV", "AK", "SD", "WY"];
    if (noIncomeTaxStates.includes(state)) {
      gotchas.push(
        `${state} has no state income tax — S-corp savings here come entirely from SE tax avoidance. That's actually clean math: the federal SE tax on distributions is $0, and there's no state layer to complicate it.`,
      );
    }
    return gotchas;
  }

  const percentCost = Math.round(netProfit * extra.percentOfProfit);
  const distributionsCost = Math.round((netProfit - salary) * extra.percentOfDistributions);
  const gotchaText = extra.gotchaTemplate(extra.fixedAnnual, percentCost, netProfit);
  gotchas.push(gotchaText);

  if (state === "NY") {
    gotchas.push(
      "NYC-specific: if you live in New York City, you also owe NYC General Corporation Tax (GCT). The NYC GCT is roughly 8.85% of net income — this can make S-corp less attractive for NYC residents at lower income levels. The calculator above does not include NYC GCT.",
    );
  }

  if (distributionsCost > 0) {
    gotchas.push(
      `Tennessee-specific: the 6.5% excise tax applies to corporate net income (roughly your distributions of ~$${(netProfit - salary).toLocaleString()}). Estimated impact: ~$${distributionsCost.toLocaleString()}/year.`,
    );
  }

  return gotchas;
}

// ── Running costs by state ────────────────────────────────────────────────────

function getStateFilingFees(state: string, netProfit: number): number {
  const extra = STATE_SCORP_EXTRAS[state];
  if (!extra) return DEFAULT_STATE_FILING_FEE;

  const percentCost = Math.round(netProfit * extra.percentOfProfit);
  return extra.fixedAnnual + percentCost + extra.stateFilingFee;
}

// ── Filing deadline ───────────────────────────────────────────────────────────
// Form 2553 must be filed by March 15 of the tax year you want the election to apply,
// or within 75 days of forming the entity. Late filing relief is available but not guaranteed.

function getFilingDeadline(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const marchDeadline = new Date(currentYear, 2, 15); // March 15 of current year

  if (now < marchDeadline) {
    return `March 15, ${currentYear} (to elect for the ${currentYear} tax year — deadline is approaching)`;
  }
  return `March 15, ${currentYear + 1} (to elect for the ${currentYear + 1} tax year — you've missed this year's deadline)`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function computeScorp(inputs: ScorpInputs): ScorpResult {
  const { total_creator_income, manager_or_agency_cut, business_expenses, state } = inputs;

  // ── Step 1: Net profit after agent cut ──────────────────────────────────
  const adjustedIncome = Math.round(total_creator_income * (1 - manager_or_agency_cut / 100));
  const netProfit = Math.max(0, adjustedIncome - business_expenses);

  // ── Step 2: Verdict ──────────────────────────────────────────────────────
  const salaryResult = getReasonableSalary({ ...inputs });
  const verdictResult = scorpVerdict(inputs, netProfit);

  // ── Step 3: SE tax comparison ────────────────────────────────────────────
  // Without S-corp: all net profit subject to SE tax
  const seTaxWithoutScorp = computeSeTax(netProfit, 0, TAX_YEAR);

  // With S-corp: only salary subject to SE tax; distributions skip it
  const salary = salaryResult.recommended;
  const distributions = Math.max(0, netProfit - salary);
  const seTaxWithScorp = computeSeTax(salary, 0, TAX_YEAR);

  const grossSavings = Math.max(0, seTaxWithoutScorp - seTaxWithScorp);

  // ── Step 4: Running costs ────────────────────────────────────────────────
  const payrollServiceAnnual = 900; // midpoint of $600–1200 (Gusto/OnPay estimate)
  const stateFilingFees = getStateFilingFees(state, netProfit);
  const additionalAccountingCost = 1_000; // midpoint of $500–1500 extra for S-corp filing

  const runningCostsTotal = payrollServiceAnnual + stateFilingFees + additionalAccountingCost;

  const runningCosts: ScorpRunningCosts = {
    payrollServiceAnnual,
    stateFilingFees,
    additionalAccountingCost,
    total: runningCostsTotal,
  };

  // ── Step 5: Net savings ──────────────────────────────────────────────────
  const netSavings = grossSavings - runningCostsTotal;

  // ── Step 6: Comparison tax numbers (for OG image + result display) ───────
  // "Without S-corp": the SE tax you pay as a sole prop / SMLLC
  const withoutScorpAnnualTax = seTaxWithoutScorp;
  // "With S-corp": SE tax on salary + all running costs
  const withScorpAnnualTax = seTaxWithScorp + runningCostsTotal;

  // ── Step 7: State gotchas ────────────────────────────────────────────────
  const stateGotchas = getStateGotchas(state, netProfit, salary);

  // ── Step 8: Build verdict headline (incorporate actual net savings) ──────
  let verdictHeadline = verdictResult.headline;
  if (verdictResult.verdict === "yes" && netSavings > 0) {
    verdictHeadline = `Yes, switch. Save ~$${netSavings.toLocaleString()}/year.`;
  } else if (verdictResult.verdict === "no" && inputs.current_entity !== "scorp_already") {
    verdictHeadline = "Don't switch to an S-corp yet.";
  } else if (verdictResult.verdict === "wait") {
    verdictHeadline = "Wait one more quarter.";
  }

  // ── Step 9: Breakdown explainer ──────────────────────────────────────────
  const fmtDollar = (n: number) => `$${Math.abs(n).toLocaleString()}`;

  let breakdownExplainer = `As a sole prop or single-member LLC, the IRS hits every dollar of your $${netProfit.toLocaleString()} profit with self-employment tax (${fmtDollar(seTaxWithoutScorp)}/year). `;

  if (verdictResult.verdict === "yes" || verdictResult.verdict === "wait") {
    breakdownExplainer += `If you switch to S-corp and pay yourself a $${salary.toLocaleString()} salary, only that salary faces SE tax (${fmtDollar(seTaxWithScorp)}). The remaining $${distributions.toLocaleString()} in distributions skips it entirely. `;
    breakdownExplainer += `Gross SE tax savings: ${fmtDollar(grossSavings)}. `;
    breakdownExplainer += `Running costs (payroll service, accounting, state fees): ${fmtDollar(runningCostsTotal)}. `;
    if (netSavings > 0) {
      breakdownExplainer += `Net savings: ~${fmtDollar(netSavings)}/year.`;
    } else {
      breakdownExplainer += `At this income level, running costs eat all the savings (net: ${netSavings < 0 ? "-" : ""}${fmtDollar(netSavings)}/year).`;
    }
  } else {
    breakdownExplainer += `The running costs of S-corp (payroll service, extra accounting, state fees: ~${fmtDollar(runningCostsTotal)}/year) would eat the savings at this income level.`;
  }

  return {
    verdict: verdictResult.verdict,
    verdictHeadline,
    verdictReason: verdictResult.reason,
    reasonableSalary: salaryResult,
    withoutScorpAnnualTax,
    withScorpAnnualTax,
    grossSavings,
    runningCosts,
    netSavings,
    stateGotchas,
    filingDeadline: getFilingDeadline(),
    breakdownExplainer,
  };
}
