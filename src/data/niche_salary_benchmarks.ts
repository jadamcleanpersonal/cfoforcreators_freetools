// Niche salary benchmarks for S-corp reasonable-salary calculation.
// ~50 rows covering the realistic niche × audience × hours combinations.
//
// Sources:
//   BLS Occupational Employment and Wage Statistics (May 2023):
//     - Producers and Directors (27-2012): median $87k
//     - Special Effects Artists (27-1014): median $100k
//     - Marketing Specialists (13-1161): median $68k
//     - Financial Analysts (13-2051): median $99k
//     - Personal Financial Advisors (13-2052): median $95k
//     - Software Developers (15-1252): median $130k
//     - Computer Systems Analysts (15-1211): median $93k
//     - Technical Writers (27-3042): median $79k
//     - Training/Development Specialists (13-1151): median $62k
//     - Instructional Designers (25-9031): median $73k
//   Goldman Sachs Creator Economy Report 2023
//   Influencer Marketing Hub State of Influencer Marketing 2024

export type NicheType =
  | "gaming"
  | "beauty"
  | "finance"
  | "lifestyle"
  | "education"
  | "tech"
  | "other";

export type AudienceTier = "<10k" | "10-100k" | "100k-1M" | "1M+";

export type HoursPerWeekTier = "<10" | "10-25" | "25-40" | "40+";

export type NicheSalaryBenchmark = {
  niche: NicheType;
  audienceTier: AudienceTier;
  hoursPerWeekTier: HoursPerWeekTier;
  /** Reasonable annual salary range in USD (integer dollars) */
  salaryLow: number;
  salaryHigh: number;
  /** Source citation for defensibility */
  source: string;
};

// ── Gaming ──────────────────────────────────────────────────────────────────
// IRS compares to: Producers and Directors (BLS 27-2012), Video Game Designers,
// Streaming personalities. Gaming is mid-tier in IRS scrutiny.
const GAMING_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "gaming",
    audienceTier: "<10k",
    hoursPerWeekTier: "10-25",
    salaryLow: 32_000,
    salaryHigh: 42_000,
    source: "BLS Media Producers median, part-time equivalent, small audience",
  },
  {
    niche: "gaming",
    audienceTier: "<10k",
    hoursPerWeekTier: "25-40",
    salaryLow: 38_000,
    salaryHigh: 50_000,
    source: "BLS Media Producers median, full-time equivalent, small audience",
  },
  {
    niche: "gaming",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 40_000,
    salaryHigh: 55_000,
    source: "BLS Producers and Directors, part-time creator equivalent",
  },
  {
    niche: "gaming",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 48_000,
    salaryHigh: 65_000,
    source: "BLS Producers and Directors median $87k, discount for indie creator",
  },
  {
    niche: "gaming",
    audienceTier: "10-100k",
    hoursPerWeekTier: "40+",
    salaryLow: 55_000,
    salaryHigh: 72_000,
    source: "BLS Producers and Directors median, full-time gaming creator",
  },
  {
    niche: "gaming",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 50_000,
    salaryHigh: 65_000,
    source: "BLS Producers and Directors, mid-tier gaming, part-time hours",
  },
  {
    niche: "gaming",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 58_000,
    salaryHigh: 75_000,
    source: "BLS Producers and Directors median, established gaming creator",
  },
  {
    niche: "gaming",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 65_000,
    salaryHigh: 85_000,
    source: "BLS Producers and Directors + creator premium, full-time large gaming channel",
  },
  {
    niche: "gaming",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 70_000,
    salaryHigh: 90_000,
    source: "BLS Producers and Directors, major gaming creator, IRS expects market rate",
  },
  {
    niche: "gaming",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 80_000,
    salaryHigh: 105_000,
    source: "BLS Producers and Directors + creator economy premium, 1M+ gaming",
  },
];

// ── Beauty / Fashion ─────────────────────────────────────────────────────────
// IRS compares to: Marketing Specialists, Models, Fashion Designers.
// Lower IRS scrutiny on salary than finance/tech.
const BEAUTY_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "beauty",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 33_000,
    salaryHigh: 48_000,
    source: "BLS Marketing Specialists median $68k, part-time beauty creator",
  },
  {
    niche: "beauty",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 40_000,
    salaryHigh: 58_000,
    source: "BLS Marketing Specialists median, full-time beauty/fashion creator",
  },
  {
    niche: "beauty",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 42_000,
    salaryHigh: 58_000,
    source: "BLS Marketing Specialists, mid-tier beauty creator",
  },
  {
    niche: "beauty",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 50_000,
    salaryHigh: 65_000,
    source: "BLS Marketing Specialists median + creator brand premium",
  },
  {
    niche: "beauty",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 58_000,
    salaryHigh: 75_000,
    source: "BLS Marketing Specialists + fashion/beauty industry rate, large channel",
  },
  {
    niche: "beauty",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 62_000,
    salaryHigh: 80_000,
    source: "BLS Marketing Specialists + Influencer Marketing Hub data, 1M+ beauty",
  },
  {
    niche: "beauty",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 72_000,
    salaryHigh: 92_000,
    source: "Goldman Sachs creator economy report + BLS, top-tier beauty creator",
  },
];

// ── Finance / Business ───────────────────────────────────────────────────────
// IRS compares to: Financial Analysts, Personal Financial Advisors, B2B Marketing.
// HIGH IRS scrutiny — finance creators must defend HIGHER salaries.
// Cannot claim a $30k salary when producing finance content with 500k subscribers.
const FINANCE_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "finance",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 55_000,
    salaryHigh: 70_000,
    source: "BLS Financial Analysts median $99k, part-time finance content creator",
  },
  {
    niche: "finance",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 65_000,
    salaryHigh: 85_000,
    source: "BLS Financial Analysts median, full-time finance creator",
  },
  {
    niche: "finance",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 65_000,
    salaryHigh: 85_000,
    source: "BLS Financial Analysts / Personal Financial Advisors median",
  },
  {
    niche: "finance",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 75_000,
    salaryHigh: 95_000,
    source: "BLS Financial Analysts $99k median, established finance creator",
  },
  {
    niche: "finance",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 85_000,
    salaryHigh: 110_000,
    source: "BLS Personal Financial Advisors $95k median + creator premium, full-time",
  },
  {
    niche: "finance",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 85_000,
    salaryHigh: 115_000,
    source: "BLS Financial Analysts top quartile, major finance creator",
  },
  {
    niche: "finance",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 95_000,
    salaryHigh: 130_000,
    source: "BLS Financial Advisors + Goldman Sachs creator data, 1M+ finance channel",
  },
];

// ── Lifestyle / Travel ───────────────────────────────────────────────────────
// IRS compares to: Marketing Specialists, Social Media Managers, Media Producers.
// Lower scrutiny on salary amount; lifestyle is broad.
const LIFESTYLE_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "lifestyle",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 32_000,
    salaryHigh: 45_000,
    source: "BLS Marketing Specialists + Social Media Manager median, part-time",
  },
  {
    niche: "lifestyle",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 38_000,
    salaryHigh: 52_000,
    source: "BLS Marketing Specialists median $68k, lifestyle content creator",
  },
  {
    niche: "lifestyle",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 40_000,
    salaryHigh: 55_000,
    source: "BLS Media Producers / Marketing Specialists, mid-tier lifestyle",
  },
  {
    niche: "lifestyle",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 45_000,
    salaryHigh: 62_000,
    source: "BLS Marketing Specialists median, established lifestyle creator",
  },
  {
    niche: "lifestyle",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 52_000,
    salaryHigh: 70_000,
    source: "BLS Producers and Directors, full-time large lifestyle channel",
  },
  {
    niche: "lifestyle",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 55_000,
    salaryHigh: 72_000,
    source: "Influencer Marketing Hub data + BLS, 1M+ lifestyle creator",
  },
  {
    niche: "lifestyle",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 65_000,
    salaryHigh: 85_000,
    source: "Goldman Sachs creator economy report, top-tier lifestyle creator",
  },
];

// ── Education / How-to ───────────────────────────────────────────────────────
// IRS compares to: Training Specialists, Instructional Designers, Professors.
// Mid-tier scrutiny; education niches expected to have reasonable educator salaries.
const EDUCATION_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "education",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 42_000,
    salaryHigh: 55_000,
    source: "BLS Training/Development Specialists median $62k, part-time educator",
  },
  {
    niche: "education",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 50_000,
    salaryHigh: 65_000,
    source: "BLS Instructional Designers median $73k, full-time education creator",
  },
  {
    niche: "education",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 52_000,
    salaryHigh: 68_000,
    source: "BLS Instructional Designers median, mid-tier education channel",
  },
  {
    niche: "education",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 60_000,
    salaryHigh: 75_000,
    source: "BLS Instructional Designers $73k median, established education creator",
  },
  {
    niche: "education",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 65_000,
    salaryHigh: 82_000,
    source: "BLS Instructional Designers + professor equivalent, full-time",
  },
  {
    niche: "education",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 68_000,
    salaryHigh: 88_000,
    source: "BLS Training Specialists + Instructional Designers top quartile",
  },
  {
    niche: "education",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 75_000,
    salaryHigh: 98_000,
    source: "Goldman Sachs creator data + BLS, major education platform creator",
  },
];

// ── Tech ─────────────────────────────────────────────────────────────────────
// IRS compares to: Software Developers, Technical Writers, Systems Analysts.
// HIGH scrutiny — tech creators in dev/programming niches face elevated salary bars.
const TECH_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "tech",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 62_000,
    salaryHigh: 80_000,
    source: "BLS Technical Writers median $79k + Computer Systems Analysts, part-time",
  },
  {
    niche: "tech",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 72_000,
    salaryHigh: 92_000,
    source: "BLS Software Developers median $130k, discount for content vs. dev work",
  },
  {
    niche: "tech",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 70_000,
    salaryHigh: 90_000,
    source: "BLS Computer Systems Analysts $93k median, mid-tier tech creator",
  },
  {
    niche: "tech",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 80_000,
    salaryHigh: 105_000,
    source: "BLS Software Developers / Technical Writers, established tech creator",
  },
  {
    niche: "tech",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "40+",
    salaryLow: 92_000,
    salaryHigh: 120_000,
    source: "BLS Software Developers median + creator premium, full-time tech channel",
  },
  {
    niche: "tech",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 90_000,
    salaryHigh: 120_000,
    source: "BLS Software Developers median $130k, IRS expects market rate at 1M+",
  },
  {
    niche: "tech",
    audienceTier: "1M+",
    hoursPerWeekTier: "40+",
    salaryLow: 100_000,
    salaryHigh: 135_000,
    source: "BLS Software Developers median + Goldman Sachs creator data, major tech channel",
  },
];

// ── Other ─────────────────────────────────────────────────────────────────────
// Catch-all: IRS compares to Media Producers / Marketing Specialists.
const OTHER_BENCHMARKS: NicheSalaryBenchmark[] = [
  {
    niche: "other",
    audienceTier: "10-100k",
    hoursPerWeekTier: "10-25",
    salaryLow: 35_000,
    salaryHigh: 48_000,
    source: "BLS Marketing Specialists median $68k, part-time general creator",
  },
  {
    niche: "other",
    audienceTier: "10-100k",
    hoursPerWeekTier: "25-40",
    salaryLow: 40_000,
    salaryHigh: 55_000,
    source: "BLS Marketing Specialists / Media Producers, full-time general creator",
  },
  {
    niche: "other",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "10-25",
    salaryLow: 40_000,
    salaryHigh: 55_000,
    source: "BLS Media Producers median, mid-tier other niche creator",
  },
  {
    niche: "other",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 45_000,
    salaryHigh: 60_000,
    source: "BLS Producers and Directors, established other-niche creator",
  },
  {
    niche: "other",
    audienceTier: "1M+",
    hoursPerWeekTier: "25-40",
    salaryLow: 55_000,
    salaryHigh: 72_000,
    source: "BLS Producers and Directors + Influencer Marketing Hub, 1M+ general creator",
  },
];

// ── Combined table ────────────────────────────────────────────────────────────
export const NICHE_SALARY_BENCHMARKS: NicheSalaryBenchmark[] = [
  ...GAMING_BENCHMARKS,
  ...BEAUTY_BENCHMARKS,
  ...FINANCE_BENCHMARKS,
  ...LIFESTYLE_BENCHMARKS,
  ...EDUCATION_BENCHMARKS,
  ...TECH_BENCHMARKS,
  ...OTHER_BENCHMARKS,
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getHoursPerWeekTier(hoursPerWeek: number): HoursPerWeekTier {
  if (hoursPerWeek <= 10) return "<10";
  if (hoursPerWeek <= 25) return "10-25";
  if (hoursPerWeek <= 40) return "25-40";
  return "40+";
}

/**
 * Find the best matching benchmark row.
 * Falls back progressively: exact → same niche different tier → other niche → hardcoded default.
 */
export function findBenchmark(
  niche: NicheType,
  audienceTier: AudienceTier,
  hoursTier: HoursPerWeekTier,
): NicheSalaryBenchmark {
  // 1. Exact match
  const exact = NICHE_SALARY_BENCHMARKS.find(
    (b) => b.niche === niche && b.audienceTier === audienceTier && b.hoursPerWeekTier === hoursTier,
  );
  if (exact) return exact;

  // 2. Same niche, any hours tier, same audience
  const sameNicheAudience = NICHE_SALARY_BENCHMARKS.filter(
    (b) => b.niche === niche && b.audienceTier === audienceTier,
  );
  if (sameNicheAudience.length > 0) {
    // Pick the closest hours tier (25-40 is the most common / safest default)
    const preferred =
      sameNicheAudience.find((b) => b.hoursPerWeekTier === "25-40") ?? sameNicheAudience[0];
    return preferred;
  }

  // 3. Same niche, any combination
  const sameNiche = NICHE_SALARY_BENCHMARKS.filter((b) => b.niche === niche);
  if (sameNiche.length > 0) {
    return (
      sameNiche.find((b) => b.audienceTier === "100k-1M" && b.hoursPerWeekTier === "25-40") ??
      sameNiche[0]
    );
  }

  // 4. "other" niche fallback
  const otherRow = NICHE_SALARY_BENCHMARKS.find(
    (b) => b.niche === "other" && b.hoursPerWeekTier === "25-40",
  );
  if (otherRow) return otherRow;

  // 5. Hardcoded last resort
  return {
    niche: "other",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 42_000,
    salaryHigh: 58_000,
    source: "Default fallback — no benchmark found for this combination",
  };
}
