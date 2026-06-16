// Single source of truth for all US state references.
// NEVER inline state lists elsewhere — always import from here.

export interface USState {
  code: string; // e.g. "CA"
  name: string; // e.g. "California"
  slug: string; // e.g. "california" (for URLs)
}

export const US_STATES: USState[] = [
  { code: "AL", name: "Alabama", slug: "alabama" },
  { code: "AK", name: "Alaska", slug: "alaska" },
  { code: "AZ", name: "Arizona", slug: "arizona" },
  { code: "AR", name: "Arkansas", slug: "arkansas" },
  { code: "CA", name: "California", slug: "california" },
  { code: "CO", name: "Colorado", slug: "colorado" },
  { code: "CT", name: "Connecticut", slug: "connecticut" },
  { code: "DE", name: "Delaware", slug: "delaware" },
  { code: "FL", name: "Florida", slug: "florida" },
  { code: "GA", name: "Georgia", slug: "georgia" },
  { code: "HI", name: "Hawaii", slug: "hawaii" },
  { code: "ID", name: "Idaho", slug: "idaho" },
  { code: "IL", name: "Illinois", slug: "illinois" },
  { code: "IN", name: "Indiana", slug: "indiana" },
  { code: "IA", name: "Iowa", slug: "iowa" },
  { code: "KS", name: "Kansas", slug: "kansas" },
  { code: "KY", name: "Kentucky", slug: "kentucky" },
  { code: "LA", name: "Louisiana", slug: "louisiana" },
  { code: "ME", name: "Maine", slug: "maine" },
  { code: "MD", name: "Maryland", slug: "maryland" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts" },
  { code: "MI", name: "Michigan", slug: "michigan" },
  { code: "MN", name: "Minnesota", slug: "minnesota" },
  { code: "MS", name: "Mississippi", slug: "mississippi" },
  { code: "MO", name: "Missouri", slug: "missouri" },
  { code: "MT", name: "Montana", slug: "montana" },
  { code: "NE", name: "Nebraska", slug: "nebraska" },
  { code: "NV", name: "Nevada", slug: "nevada" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey" },
  { code: "NM", name: "New Mexico", slug: "new-mexico" },
  { code: "NY", name: "New York", slug: "new-york" },
  { code: "NC", name: "North Carolina", slug: "north-carolina" },
  { code: "ND", name: "North Dakota", slug: "north-dakota" },
  { code: "OH", name: "Ohio", slug: "ohio" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma" },
  { code: "OR", name: "Oregon", slug: "oregon" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island" },
  { code: "SC", name: "South Carolina", slug: "south-carolina" },
  { code: "SD", name: "South Dakota", slug: "south-dakota" },
  { code: "TN", name: "Tennessee", slug: "tennessee" },
  { code: "TX", name: "Texas", slug: "texas" },
  { code: "UT", name: "Utah", slug: "utah" },
  { code: "VT", name: "Vermont", slug: "vermont" },
  { code: "VA", name: "Virginia", slug: "virginia" },
  { code: "WA", name: "Washington", slug: "washington" },
  { code: "WV", name: "West Virginia", slug: "west-virginia" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin" },
  { code: "WY", name: "Wyoming", slug: "wyoming" },
];

export const STATE_CODES = US_STATES.map((s) => s.code) as [string, ...string[]];

export function getStateName(code: string): string {
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}

export function getStateBySlug(slug: string): USState | undefined {
  return US_STATES.find((s) => s.slug === slug);
}

// ============================================================
// State income tax data — extended for Sprint 2 tax estimator
// Sources noted inline per state. Data as of 2025 tax year.
// For 2026: rates confirmed as of August 2025; verify any
// legislative changes before the 2026 filing season.
// ============================================================

export interface StateTaxBracket {
  upTo: number; // Infinity for top bracket
  rate: number; // decimal (0.05 = 5%)
}

export type StateTaxType = "none" | "flat" | "bracket";

export interface StateTaxData {
  taxType: StateTaxType;
  flatRate?: number; // for "flat" states, decimal
  // For "bracket" states. If married_joint omitted, single brackets used for all.
  brackets?: {
    single: StateTaxBracket[];
    married_joint?: StateTaxBracket[];
    head_of_household?: StateTaxBracket[];
  };
  // State-level deduction subtracted from federal AGI before applying rates.
  // Many states use their own deduction or personal exemption.
  // If undefined, uses 0 (conservative — slightly overstates state tax).
  standardDeduction?: { single: number; married_joint: number };
  note?: string; // shown in UI caveat
}

// State tax data keyed by 2-letter state code.
// Sources: respective state revenue department publications (2024/2025 rates).
export const STATE_TAX_DATA: Record<string, StateTaxData> = {
  // ── No income tax on wages ──────────────────────────────────────────────
  AK: { taxType: "none" },
  FL: { taxType: "none" },
  NV: { taxType: "none" },
  NH: {
    taxType: "none",
    note: "NH eliminated its income tax on wages. Investment income is not computed here.",
  },
  SD: { taxType: "none" },
  TN: { taxType: "none", note: "TN eliminated the Hall Tax on investment income in 2021." },
  TX: { taxType: "none" },
  WA: { taxType: "none" },
  WY: { taxType: "none" },

  // ── Flat-rate states ────────────────────────────────────────────────────
  // Source: each state's department of revenue, 2025 rates.
  AZ: { taxType: "flat", flatRate: 0.025, note: "AZ Prop 132 (2022) flat tax. Source: AZDOR." },
  CO: {
    taxType: "flat",
    flatRate: 0.044,
    note: "CO 4.40% flat rate. Source: Colorado DOR.",
  },
  GA: {
    taxType: "flat",
    flatRate: 0.0539,
    note: "GA flat tax 5.39% (2025, phasing down). Source: Georgia DOR.",
  },
  IA: {
    taxType: "flat",
    flatRate: 0.038,
    note: "IA flat tax 3.8% effective 2025. Source: Iowa DOR.",
  },
  ID: {
    taxType: "flat",
    flatRate: 0.05695,
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "ID 5.695% flat rate. Source: Idaho State Tax Commission.",
  },
  IL: {
    taxType: "flat",
    flatRate: 0.0495,
    standardDeduction: { single: 2_425, married_joint: 4_850 },
    note: "IL 4.95% flat rate. Personal exemption $2,425 single. Source: Illinois DOR.",
  },
  IN: {
    taxType: "flat",
    flatRate: 0.0305,
    standardDeduction: { single: 1_000, married_joint: 2_000 },
    note: "IN 3.05% flat rate. County taxes vary (not computed). Source: Indiana DOR.",
  },
  KY: {
    taxType: "flat",
    flatRate: 0.04,
    standardDeduction: { single: 3_160, married_joint: 3_160 },
    note: "KY 4.0% flat rate. Source: Kentucky DOR.",
  },
  LA: {
    taxType: "flat",
    flatRate: 0.03,
    standardDeduction: { single: 12_500, married_joint: 25_000 },
    note: "LA 3.0% flat rate effective 2025 (Act 2 2024 Special Session). Source: Louisiana DOR.",
  },
  MA: {
    taxType: "flat",
    flatRate: 0.05,
    standardDeduction: { single: 4_400, married_joint: 8_800 },
    note: "MA 5% flat rate (9% surcharge on high incomes not computed). Source: MA DOR.",
  },
  MI: {
    taxType: "flat",
    flatRate: 0.0425,
    standardDeduction: { single: 5_600, married_joint: 11_200 },
    note: "MI 4.25% flat rate. Personal exemption $5,600. Source: Michigan DOR.",
  },
  MS: {
    taxType: "flat",
    flatRate: 0.044,
    standardDeduction: { single: 2_300, married_joint: 4_600 },
    note: "MS 4.4% flat rate (2025, phasing to 0%). Source: Mississippi DOR.",
  },
  NC: {
    taxType: "flat",
    flatRate: 0.045,
    standardDeduction: { single: 12_750, married_joint: 25_500 },
    note: "NC 4.5% flat rate (2024+). Source: NC DOR.",
  },
  PA: {
    taxType: "flat",
    flatRate: 0.0307,
    note: "PA 3.07% flat rate. No standard deduction. Source: Pennsylvania DOR.",
  },
  UT: {
    taxType: "flat",
    flatRate: 0.0465,
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "UT 4.65% flat rate. Source: Utah Tax Commission.",
  },

  // ── Bracket states ───────────────────────────────────────────────────────
  AL: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 500, rate: 0.02 },
        { upTo: 3_000, rate: 0.04 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.05 },
      ],
    },
    standardDeduction: { single: 3_000, married_joint: 8_500 },
    note: "AL brackets. Source: Alabama DOR.",
  },
  AR: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 5_000, rate: 0.02 },
        { upTo: 10_000, rate: 0.04 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.044 },
      ],
    },
    standardDeduction: { single: 2_300, married_joint: 4_600 },
    note: "AR top rate 4.4% (2024 cut). Source: Arkansas DFA.",
  },
  CA: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 10_756, rate: 0.01 },
        { upTo: 25_499, rate: 0.02 },
        { upTo: 40_245, rate: 0.04 },
        { upTo: 55_866, rate: 0.06 },
        { upTo: 70_606, rate: 0.08 },
        { upTo: 360_659, rate: 0.093 },
        { upTo: 432_787, rate: 0.103 },
        { upTo: 721_314, rate: 0.113 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.123 },
      ],
      married_joint: [
        { upTo: 21_512, rate: 0.01 },
        { upTo: 50_998, rate: 0.02 },
        { upTo: 80_490, rate: 0.04 },
        { upTo: 111_732, rate: 0.06 },
        { upTo: 141_212, rate: 0.08 },
        { upTo: 721_318, rate: 0.093 },
        { upTo: 865_574, rate: 0.103 },
        { upTo: 1_442_628, rate: 0.113 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.123 },
      ],
    },
    standardDeduction: { single: 5_202, married_joint: 10_404 },
    note: "CA 2025 brackets. 1% Mental Health surcharge on $1M+ not computed. NYC-equiv city taxes not computed. Source: CA FTB.",
  },
  CT: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 10_000, rate: 0.02 },
        { upTo: 50_000, rate: 0.045 },
        { upTo: 100_000, rate: 0.055 },
        { upTo: 200_000, rate: 0.06 },
        { upTo: 250_000, rate: 0.065 },
        { upTo: 500_000, rate: 0.069 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
      ],
      married_joint: [
        { upTo: 20_000, rate: 0.02 },
        { upTo: 100_000, rate: 0.045 },
        { upTo: 200_000, rate: 0.055 },
        { upTo: 400_000, rate: 0.06 },
        { upTo: 500_000, rate: 0.065 },
        { upTo: 1_000_000, rate: 0.069 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0699 },
      ],
    },
    standardDeduction: { single: 15_000, married_joint: 24_000 },
    note: "CT 2024 brackets. Source: Connecticut DRS.",
  },
  DE: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 2_000, rate: 0 },
        { upTo: 5_000, rate: 0.022 },
        { upTo: 10_000, rate: 0.039 },
        { upTo: 20_000, rate: 0.048 },
        { upTo: 25_000, rate: 0.052 },
        { upTo: 60_000, rate: 0.0555 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.066 },
      ],
    },
    standardDeduction: { single: 3_250, married_joint: 6_500 },
    note: "DE 2024 brackets. Source: Delaware Division of Revenue.",
  },
  HI: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 2_400, rate: 0.014 },
        { upTo: 4_800, rate: 0.032 },
        { upTo: 9_600, rate: 0.055 },
        { upTo: 14_400, rate: 0.064 },
        { upTo: 19_200, rate: 0.068 },
        { upTo: 24_000, rate: 0.072 },
        { upTo: 36_000, rate: 0.076 },
        { upTo: 48_000, rate: 0.079 },
        { upTo: 150_000, rate: 0.0825 },
        { upTo: 175_000, rate: 0.09 },
        { upTo: 200_000, rate: 0.1 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.11 },
      ],
    },
    standardDeduction: { single: 2_200, married_joint: 4_400 },
    note: "HI 2024 brackets. Source: Hawaii DOTAX.",
  },
  KS: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 15_000, rate: 0.031 },
        { upTo: 30_000, rate: 0.0525 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.057 },
      ],
      married_joint: [
        { upTo: 30_000, rate: 0.031 },
        { upTo: 60_000, rate: 0.0525 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.057 },
      ],
    },
    standardDeduction: { single: 3_500, married_joint: 8_000 },
    note: "KS 2024 brackets. Source: Kansas DOR.",
  },
  ME: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 24_500, rate: 0.058 },
        { upTo: 58_050, rate: 0.0675 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0715 },
      ],
      married_joint: [
        { upTo: 49_050, rate: 0.058 },
        { upTo: 116_100, rate: 0.0675 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0715 },
      ],
    },
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "ME 2024 brackets. Source: Maine Revenue Services.",
  },
  MD: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 1_000, rate: 0.02 },
        { upTo: 2_000, rate: 0.03 },
        { upTo: 3_000, rate: 0.04 },
        { upTo: 100_000, rate: 0.0475 },
        { upTo: 125_000, rate: 0.05 },
        { upTo: 150_000, rate: 0.0525 },
        { upTo: 250_000, rate: 0.055 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
      ],
      married_joint: [
        { upTo: 1_000, rate: 0.02 },
        { upTo: 2_000, rate: 0.03 },
        { upTo: 3_000, rate: 0.04 },
        { upTo: 150_000, rate: 0.0475 },
        { upTo: 175_000, rate: 0.05 },
        { upTo: 225_000, rate: 0.0525 },
        { upTo: 300_000, rate: 0.055 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
      ],
    },
    standardDeduction: { single: 2_250, married_joint: 4_500 },
    note: "MD state brackets only — county/city taxes (avg ~3%) are not computed. Source: Maryland Comptroller.",
  },
  MN: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 30_070, rate: 0.0535 },
        { upTo: 98_760, rate: 0.068 },
        { upTo: 171_220, rate: 0.0785 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0985 },
      ],
      married_joint: [
        { upTo: 43_950, rate: 0.0535 },
        { upTo: 174_610, rate: 0.068 },
        { upTo: 304_970, rate: 0.0785 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0985 },
      ],
    },
    standardDeduction: { single: 14_575, married_joint: 29_150 },
    note: "MN 2024 brackets. Source: Minnesota DOR.",
  },
  MO: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 1_121, rate: 0 },
        { upTo: 2_242, rate: 0.015 },
        { upTo: 3_363, rate: 0.02 },
        { upTo: 4_484, rate: 0.025 },
        { upTo: 5_605, rate: 0.03 },
        { upTo: 6_726, rate: 0.035 },
        { upTo: 8_968, rate: 0.04 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.045 },
      ],
    },
    standardDeduction: { single: 15_000, married_joint: 30_000 },
    note: "MO 2024 brackets, top rate 4.5%. Standard deduction follows federal. Source: Missouri DOR.",
  },
  MT: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 20_500, rate: 0.047 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0675 },
      ],
    },
    standardDeduction: { single: 5_540, married_joint: 11_080 },
    note: "MT 2024 two-bracket system. Source: Montana DOR.",
  },
  NE: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 3_700, rate: 0.0246 },
        { upTo: 22_170, rate: 0.0351 },
        { upTo: 35_730, rate: 0.0501 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0584 },
      ],
      married_joint: [
        { upTo: 7_400, rate: 0.0246 },
        { upTo: 44_340, rate: 0.0351 },
        { upTo: 71_460, rate: 0.0501 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0584 },
      ],
    },
    standardDeduction: { single: 7_900, married_joint: 15_800 },
    note: "NE 2024 brackets (phasing down). Source: Nebraska DOR.",
  },
  NJ: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 20_000, rate: 0.014 },
        { upTo: 35_000, rate: 0.0175 },
        { upTo: 40_000, rate: 0.035 },
        { upTo: 75_000, rate: 0.05525 },
        { upTo: 500_000, rate: 0.0637 },
        { upTo: 1_000_000, rate: 0.0897 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.1075 },
      ],
      married_joint: [
        { upTo: 20_000, rate: 0.014 },
        { upTo: 50_000, rate: 0.0175 },
        { upTo: 70_000, rate: 0.0245 },
        { upTo: 80_000, rate: 0.035 },
        { upTo: 150_000, rate: 0.05525 },
        { upTo: 500_000, rate: 0.0637 },
        { upTo: 1_000_000, rate: 0.0897 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.1075 },
      ],
    },
    standardDeduction: { single: 1_000, married_joint: 2_000 },
    note: "NJ 2024 brackets. Source: New Jersey Division of Taxation.",
  },
  NM: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 5_500, rate: 0.017 },
        { upTo: 11_000, rate: 0.032 },
        { upTo: 16_000, rate: 0.047 },
        { upTo: 210_000, rate: 0.049 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.059 },
      ],
      married_joint: [
        { upTo: 8_000, rate: 0.017 },
        { upTo: 16_000, rate: 0.032 },
        { upTo: 24_000, rate: 0.047 },
        { upTo: 315_000, rate: 0.049 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.059 },
      ],
    },
    standardDeduction: { single: 12_500, married_joint: 25_000 },
    note: "NM 2024 brackets. Source: New Mexico Taxation and Revenue.",
  },
  ND: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 44_725, rate: 0.0195 },
        { upTo: 225_975, rate: 0.025 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.029 },
      ],
      married_joint: [
        { upTo: 74_750, rate: 0.0195 },
        { upTo: 275_100, rate: 0.025 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.029 },
      ],
    },
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "ND 2024 brackets. Source: North Dakota Office of State Tax Commissioner.",
  },
  NY: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 17_150, rate: 0.04 },
        { upTo: 23_600, rate: 0.045 },
        { upTo: 27_900, rate: 0.0525 },
        { upTo: 161_550, rate: 0.0585 },
        { upTo: 323_200, rate: 0.0625 },
        { upTo: 2_155_350, rate: 0.0685 },
        { upTo: 5_000_000, rate: 0.0965 },
        { upTo: 25_000_000, rate: 0.103 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.109 },
      ],
      married_joint: [
        { upTo: 27_900, rate: 0.04 },
        { upTo: 43_000, rate: 0.045 },
        { upTo: 161_550, rate: 0.0525 },
        { upTo: 323_200, rate: 0.0585 },
        { upTo: 2_155_350, rate: 0.0625 },
        { upTo: 5_000_000, rate: 0.0685 },
        { upTo: 25_000_000, rate: 0.0965 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.103 },
      ],
    },
    standardDeduction: { single: 8_000, married_joint: 16_050 },
    note: "NY state tax only. NYC residents pay additional city tax (3.078%–3.876%) not computed here. Source: NY DTF.",
  },
  OH: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 26_050, rate: 0 },
        { upTo: 100_000, rate: 0.02765 },
        { upTo: 115_300, rate: 0.03226 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.03688 },
      ],
    },
    standardDeduction: { single: 2_400, married_joint: 4_800 },
    note: "OH 2024 brackets. Local/city taxes not computed. Source: Ohio DOR.",
  },
  OK: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 1_000, rate: 0.0025 },
        { upTo: 2_500, rate: 0.0075 },
        { upTo: 3_750, rate: 0.0175 },
        { upTo: 4_900, rate: 0.0275 },
        { upTo: 7_200, rate: 0.0375 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0475 },
      ],
      married_joint: [
        { upTo: 2_000, rate: 0.0025 },
        { upTo: 5_000, rate: 0.0075 },
        { upTo: 7_500, rate: 0.0175 },
        { upTo: 9_800, rate: 0.0275 },
        { upTo: 12_200, rate: 0.0375 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0475 },
      ],
    },
    standardDeduction: { single: 6_350, married_joint: 12_700 },
    note: "OK 2024 brackets. Source: Oklahoma Tax Commission.",
  },
  OR: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 10_200, rate: 0.0475 },
        { upTo: 25_500, rate: 0.0675 },
        { upTo: 125_000, rate: 0.0875 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.099 },
      ],
      married_joint: [
        { upTo: 20_400, rate: 0.0475 },
        { upTo: 51_000, rate: 0.0675 },
        { upTo: 250_000, rate: 0.0875 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.099 },
      ],
    },
    standardDeduction: { single: 2_420, married_joint: 4_840 },
    note: "OR 2024 brackets. Source: Oregon DOR.",
  },
  RI: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 77_450, rate: 0.0375 },
        { upTo: 176_050, rate: 0.0475 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0599 },
      ],
      married_joint: [
        { upTo: 154_900, rate: 0.0375 },
        { upTo: 352_100, rate: 0.0475 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0599 },
      ],
    },
    standardDeduction: { single: 10_550, married_joint: 21_150 },
    note: "RI 2024 brackets. Source: Rhode Island Division of Taxation.",
  },
  SC: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 3_460, rate: 0 },
        { upTo: 17_330, rate: 0.03 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.064 },
      ],
    },
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "SC 2024 brackets (top rate reduced to 6.4%). Source: SC DOR.",
  },
  VA: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 3_000, rate: 0.02 },
        { upTo: 5_000, rate: 0.03 },
        { upTo: 17_000, rate: 0.05 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0575 },
      ],
    },
    standardDeduction: { single: 8_000, married_joint: 16_000 },
    note: "VA 2024 brackets. Source: Virginia Tax.",
  },
  VT: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 45_400, rate: 0.0335 },
        { upTo: 110_050, rate: 0.066 },
        { upTo: 229_550, rate: 0.076 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0875 },
      ],
      married_joint: [
        { upTo: 75_850, rate: 0.0335 },
        { upTo: 183_400, rate: 0.066 },
        { upTo: 279_450, rate: 0.076 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0875 },
      ],
    },
    standardDeduction: { single: 7_000, married_joint: 14_000 },
    note: "VT 2024 brackets. Source: Vermont Department of Taxes.",
  },
  WI: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 13_810, rate: 0.035 },
        { upTo: 27_630, rate: 0.044 },
        { upTo: 304_170, rate: 0.053 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0765 },
      ],
      married_joint: [
        { upTo: 18_420, rate: 0.035 },
        { upTo: 36_840, rate: 0.044 },
        { upTo: 405_560, rate: 0.053 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0765 },
      ],
    },
    standardDeduction: { single: 11_790, married_joint: 21_820 },
    note: "WI 2024 brackets. Source: Wisconsin DOR.",
  },
  WV: {
    taxType: "bracket",
    brackets: {
      single: [
        { upTo: 10_000, rate: 0.0236 },
        { upTo: 25_000, rate: 0.0315 },
        { upTo: 40_000, rate: 0.0354 },
        { upTo: 60_000, rate: 0.0472 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0512 },
      ],
      married_joint: [
        { upTo: 10_000, rate: 0.0236 },
        { upTo: 25_000, rate: 0.0315 },
        { upTo: 40_000, rate: 0.0354 },
        { upTo: 60_000, rate: 0.0472 },
        { upTo: Number.POSITIVE_INFINITY, rate: 0.0512 },
      ],
    },
    standardDeduction: { single: 14_600, married_joint: 29_200 },
    note: "WV 2024 brackets. Source: West Virginia State Tax Department.",
  },
};
