// Federal income + self-employment tax for self-employed creators.
// All dollar values are integers (cents truncated at display time).
//
// Data sources:
//   2024: IRS Rev. Proc. 2023-34
//   2025: IRS Rev. Proc. 2024-61
//   2026: Using 2025 numbers pending IRS 2026 Rev. Proc. (typically released Nov 2025).
//         TODO: Update with 2026 inflation-adjusted numbers when available.

export type FilingStatus = "single" | "married_joint" | "married_separate" | "head_of_household";

interface TaxBracket {
  upTo: number; // Infinity for top bracket
  rate: number; // decimal (0.22 = 22%)
}

// ---------------------------------------------------------------------------
// 2024 brackets (Rev. Proc. 2023-34)
// ---------------------------------------------------------------------------
const BRACKETS_2024: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { upTo: 11_600, rate: 0.10 },
    { upTo: 47_150, rate: 0.12 },
    { upTo: 100_525, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_725, rate: 0.32 },
    { upTo: 609_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { upTo: 23_200, rate: 0.10 },
    { upTo: 94_300, rate: 0.12 },
    { upTo: 201_050, rate: 0.22 },
    { upTo: 383_900, rate: 0.24 },
    { upTo: 487_450, rate: 0.32 },
    { upTo: 731_200, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { upTo: 11_600, rate: 0.10 },
    { upTo: 47_150, rate: 0.12 },
    { upTo: 100_525, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_725, rate: 0.32 },
    { upTo: 365_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { upTo: 16_550, rate: 0.10 },
    { upTo: 63_100, rate: 0.12 },
    { upTo: 100_500, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_700, rate: 0.32 },
    { upTo: 609_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

// ---------------------------------------------------------------------------
// 2025 brackets (Rev. Proc. 2024-61) — also used for 2026 until IRS publishes
// ---------------------------------------------------------------------------
const BRACKETS_2025: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { upTo: 23_850, rate: 0.10 },
    { upTo: 96_950, rate: 0.12 },
    { upTo: 206_700, rate: 0.22 },
    { upTo: 394_600, rate: 0.24 },
    { upTo: 501_050, rate: 0.32 },
    { upTo: 751_600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { upTo: 11_925, rate: 0.10 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 375_800, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { upTo: 17_000, rate: 0.10 },
    { upTo: 64_850, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_500, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 },
  ],
};

// Standard deductions by year
const STANDARD_DEDUCTIONS: Record<number, Record<FilingStatus, number>> = {
  2024: { single: 14_600, married_joint: 29_200, married_separate: 14_600, head_of_household: 21_900 },
  2025: { single: 15_000, married_joint: 30_000, married_separate: 15_000, head_of_household: 22_500 },
};

// QBI phase-out thresholds (taxable income before QBI deduction)
// Below lower → full 20% deduction. Above upper → $0 (sole prop, no W-2 wages/property).
const QBI_THRESHOLDS: Record<number, Record<FilingStatus, { lower: number; upper: number }>> = {
  2024: {
    single:            { lower: 191_950, upper: 241_950 },
    married_joint:     { lower: 383_900, upper: 483_900 },
    married_separate:  { lower: 191_950, upper: 241_950 },
    head_of_household: { lower: 191_950, upper: 241_950 },
  },
  2025: {
    single:            { lower: 197_300, upper: 247_300 },
    married_joint:     { lower: 394_600, upper: 494_600 },
    married_separate:  { lower: 197_300, upper: 247_300 },
    head_of_household: { lower: 197_300, upper: 247_300 },
  },
};

// Social Security wage bases
const SS_WAGE_BASE: Record<number, number> = {
  2024: 168_600,
  2025: 176_100,
};

function getBracketsForYear(year: number): Record<FilingStatus, TaxBracket[]> {
  if (year <= 2024) return BRACKETS_2024;
  return BRACKETS_2025; // 2025 and 2026 use same pending 2026 Rev. Proc.
}

function getStandardDeduction(year: number, status: FilingStatus): number {
  const table = year <= 2024 ? STANDARD_DEDUCTIONS[2024] : STANDARD_DEDUCTIONS[2025];
  return table[status];
}

function getQbiThresholds(year: number, status: FilingStatus) {
  const table = year <= 2024 ? QBI_THRESHOLDS[2024] : QBI_THRESHOLDS[2025];
  return table[status];
}

function getSsWageBase(year: number): number {
  return year <= 2024 ? SS_WAGE_BASE[2024] : SS_WAGE_BASE[2025];
}

// ---------------------------------------------------------------------------
// Core bracket computation — applies marginal rates to taxable income
// ---------------------------------------------------------------------------
export function applyBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= prev) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.upTo) - prev;
    tax += taxableInBracket * bracket.rate;
    prev = bracket.upTo;
    if (bracket.upTo === Infinity) break;
  }
  return Math.round(tax);
}

// ---------------------------------------------------------------------------
// Self-employment tax (Schedule SE)
// ---------------------------------------------------------------------------
export function computeSeTax(netSEIncome: number, w2Income: number, year: number): number {
  if (netSEIncome <= 0) return 0;

  // 92.35% of net SE income is subject to SE tax (deducts employer half of FICA)
  const seNetEarnings = netSEIncome * 0.9235;
  const ssWageBase = getSsWageBase(year);

  // Social Security portion (12.4%) capped at wage base, less any W-2 SS already paid
  const ssAlreadyCovered = Math.min(w2Income, ssWageBase);
  const ssEligible = Math.max(0, Math.min(seNetEarnings, ssWageBase - ssAlreadyCovered));
  const ssTax = ssEligible * 0.124;

  // Medicare portion (2.9%) — no cap
  const medicareTax = seNetEarnings * 0.029;

  // Additional Medicare Tax (0.9%) on combined SE + W-2 above threshold
  // Threshold: $200k single / $250k MFJ (not filing-status-aware here for simplicity)
  // Note: v1 uses $200k threshold for all filing statuses as conservative estimate
  const additionalMedicareThreshold = 200_000;
  const totalEarningsForAdditionalMedicare = seNetEarnings + w2Income;
  const additionalMedicare = Math.max(
    0,
    (totalEarningsForAdditionalMedicare - additionalMedicareThreshold) * 0.009,
  );

  return Math.round(ssTax + medicareTax + additionalMedicare);
}

// ---------------------------------------------------------------------------
// QBI deduction (Section 199A) — sole proprietor, no W-2 wages or property
// ---------------------------------------------------------------------------
export function computeQbiDeduction(
  qbiIncome: number,      // net SE income
  tentativeTaxableIncome: number, // AGI - std deduction (before QBI)
  year: number,
  status: FilingStatus,
): number {
  if (qbiIncome <= 0) return 0;

  const { lower, upper } = getQbiThresholds(year, status);
  const tentative = qbiIncome * 0.20;

  if (tentativeTaxableIncome <= lower) {
    return Math.round(tentative);
  }
  if (tentativeTaxableIncome >= upper) {
    // Sole props with no W-2 wages and no qualified property: deduction = 0 above upper
    return 0;
  }

  // Linear phase-out between lower and upper
  const phaseFraction = (tentativeTaxableIncome - lower) / (upper - lower);
  return Math.round(tentative * (1 - phaseFraction));
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export interface FederalTaxInput {
  grossCreatorIncome: number; // annual integer dollars
  businessExpenses: number;   // annual integer dollars
  filingStatus: FilingStatus;
  w2Income: number;           // annual integer dollars (gross W-2)
  taxYear: number;
}

export interface FederalTaxResult {
  netSEIncome: number;        // grossCreatorIncome - businessExpenses
  seTax: number;
  halfSeTaxDeduction: number; // deducted from AGI
  agi: number;                // adjusted gross income
  standardDeduction: number;
  qbiDeduction: number;
  taxableIncome: number;
  incomeTax: number;
  totalFederal: number;       // incomeTax + seTax
}

export function computeFederalTax(input: FederalTaxInput): FederalTaxResult {
  const { grossCreatorIncome, businessExpenses, filingStatus, w2Income, taxYear } = input;

  const netSEIncome = Math.max(0, grossCreatorIncome - businessExpenses);

  // SE tax
  const seTax = computeSeTax(netSEIncome, w2Income, taxYear);
  const halfSeTaxDeduction = Math.round(seTax / 2);

  // AGI = net SE income + W-2 income - half SE tax deduction
  const agi = netSEIncome + w2Income - halfSeTaxDeduction;

  // Standard deduction
  const standardDeduction = getStandardDeduction(taxYear, filingStatus);

  // Tentative taxable income (before QBI) for phase-out threshold check
  const tentativeTaxableIncome = Math.max(0, agi - standardDeduction);

  // QBI deduction (20% of net SE income, subject to phase-out)
  const qbiDeduction = computeQbiDeduction(netSEIncome, tentativeTaxableIncome, taxYear, filingStatus);

  // Final taxable income
  const taxableIncome = Math.max(0, tentativeTaxableIncome - qbiDeduction);

  // Federal income tax via brackets
  const brackets = getBracketsForYear(taxYear);
  const incomeTax = applyBrackets(taxableIncome, brackets[filingStatus]);

  return {
    netSEIncome,
    seTax,
    halfSeTaxDeduction,
    agi,
    standardDeduction,
    qbiDeduction,
    taxableIncome,
    incomeTax,
    totalFederal: incomeTax + seTax,
  };
}
