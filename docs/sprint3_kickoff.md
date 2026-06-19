# Sprint 3 — S-Corp Calculator (overnight build kickoff)

This is the prompt to paste into Claude Code for the unsupervised overnight build of the S-corp calculator. Sprint 1 + Sprint 2 are now merged to main — sprint 3 branches off main directly (no stacking needed).

---

## Context

You're building the **S-Corp Calculator** — the second user-facing free tool on cfoforcreators.com, and the **most differentiated tool in the entire suite**. The buildout plan in `docs/cfoforcreators_buildout_plan.md` §10 week 3 specifies this work.

**Why this tool matters more than any other:**

Existing competitors (Gusto, Keeper, Bizee, Collective.com) ask 3 questions: income, expenses, state. They produce a "yes you'd save $X" output for everyone above $50k. That's not real advice — it's lead-gen for their payroll service.

We ask **11 creator-specific questions** and produce a verdict that actually says "no, don't do this" or "wait until your income stabilizes" when that's the honest answer. The five-year IRS lockout on S-corp election makes the wrong-direction decision genuinely expensive. Telling someone "wait" instead of "switch now" is brand-defining — nobody else does this.

This is the tool that anchors Reddit posts on r/PartneredYoutube and r/CreatorEconomy. The output is shareable ("s-corp saved me $5,800/year, here's the proof") AND the "no" verdict makes us look honest in a sea of lead-gen calculators.

**Source of truth:** `docs/cfoforcreators_buildout_plan.md` §10 week 3 has the original spec. `docs/content_scorp_explainer.md` has the plain-language voice we need. `CLAUDE.md` at root has architecture invariants. Read all three before starting.

## Branching

- Base branch: `main` (sprint 1 + sprint 2 are now merged to main)
- New branch: `feat/sprint3-scorp-calculator`
- PR target: `main`
- Conventional Commits format: `feat(scorp): ...`, `feat(tools): ...`, `test(scorp): ...`, `docs: ...`

## Pruned tool roadmap reminder

Per the strategic review:

1. Sprint 2: Tax estimator ✅ (already built)
2. **Sprint 3: S-corp calculator** ← this sprint
3. Sprint 4 (parallel): Sponsor rate calculator + Brand contract scanner
4. LLC chooser → MDX content only
5. Retirement chooser → MDX explainer only

If you build any of the deprecated tools, stop and write to STATUS.md.

## Architecture invariants (from CLAUDE.md — non-negotiable)

- Adding a tool = ONE file in `src/tools/<slug>.ts` + ONE route file. NO touching `ToolPage.tsx`.
- Calculator math lives in `src/lib/tax/scorp.ts` as pure functions. NEVER inline math in components.
- Same `zod` schema validates client and server.
- Result URLs (`/scorp-calculator/result/[id]`) must remain stable forever.
- All money values are integers in the schema. Format at display.
- All US state references go through `src/data/states.ts` (which sprint 2 already extended with bracket data — reuse it).
- Mobile-first: tap targets ≥ 44px, `text-base` inputs, Lighthouse mobile ≥95.
- **Verdict is REQUIRED and renders above the headline number.** This tool's verdict is the most important verdict in the entire suite — get the language right.
- **Every tool must include creator-specific inputs.** This tool has 11 of them by design.

## Required inputs (11 fields — all creator-specific)

This is the input table that makes this tool unlike anything else on the market.

| Field | Type | Why creator-specific |
|---|---|---|
| `primary_platform` | radio | YouTube / TikTok / Twitch / Instagram / Multi-platform / Podcast — drives "reasonable salary" benchmark + language |
| `niche` | radio | Gaming / Beauty / Finance / Lifestyle / Education / Tech / Other — niche drives defensible salary range (Finance / B2B niches → higher salary expected by IRS, Lifestyle / Entertainment → lower) |
| `audience_size` | radio | <10k / 10–100k / 100k–1M / 1M+ — affects salary defensibility (1M+ creator can't claim a $30k salary) |
| `hours_per_week` | number | Justifies the salary number ("you work 25 hrs/wk on the channel" supports a part-time-equivalent salary) |
| `total_creator_income` | currency | Gross income from ALL creator sources, annual |
| `income_breakdown` | optional multi-currency | AdSense / sponsors / Patreon / affiliate / merch / courses — surfaces stability signal for follow-up chat |
| `business_expenses` | currency | Annual write-offs |
| `state` | state dropdown | CA, NY, NJ, OR, TN, NH have S-corp gotchas the calc must surface |
| `current_entity` | radio | sole_prop / single_member_llc / scorp_already / other / not_sure — gates the recommendation logic |
| `years_creating_full_time` | radio | <1 / 1–3 / 3–5 / 5+ — income stability proxy; 5-year S-corp lockout matters MORE for newer creators |
| `manager_or_agency_cut` | percent | 0–30% range. Reduces net income for the salary calculation. Common for creators with managers or MCNs. |

All currency = integer dollars in zod. Percent = integer 0-100 (representing whole-number percentage).

## Verdict logic (this is the tool's defining feature — get this right)

The verdict union stays `"yes" | "no" | "wait"` per CLAUDE.md. For S-corp, these map directly — no force-fit needed.

```ts
// src/lib/tax/scorp.ts
function scorpVerdict(inputs): "yes" | "no" | "wait" {
  const adjustedIncome = inputs.total_creator_income * (1 - inputs.manager_or_agency_cut / 100);
  const profit = adjustedIncome - inputs.business_expenses;

  // Hard NO cases (the brand-defining moments)
  if (profit < 60_000) return "no";                                       // breakeven below threshold
  if (inputs.state === "CA" && profit < 75_000) return "no";              // CA $800 franchise + 1.5% S-corp tax eats savings
  if (inputs.years_creating_full_time === "<1") return "no";              // 5-year lockout, income too unproven
  if (inputs.current_entity === "scorp_already") return "no";             // already there — don't switch back

  // WAIT cases
  if (profit >= 60_000 && profit < 80_000) return "wait";                 // right at breakeven, run it next quarter
  if (inputs.years_creating_full_time === "1-3" && profit < 90_000) return "wait";  // not enough history for lockout commitment

  // YES
  return "yes";
}
```

Verdict reasons must be plain creator language, not finance jargon. Examples (from the buildout plan — use these exact patterns):

- `verdict: "no"` (CA, $65k profit):
  - headline: "Don't switch to an S-corp yet."
  - reason: "California's $800 franchise tax plus 1.5% S-corp tax would eat about $1,775 of your savings, leaving roughly $400/year net. Not worth the payroll headache. Re-run this if you cross $80k profit."

- `verdict: "wait"` ($72k profit, 1-3yr full-time):
  - headline: "Wait one more quarter."
  - reason: "You're right at the breakeven. The savings are real (~$2,100/year) but you're new enough that locking yourself into S-corp for 5 years is risky. Wait one more strong quarter to confirm income is stable, then switch."

- `verdict: "yes"` ($110k profit, 4yr+, niche=tech):
  - headline: "Yes, switch. Save ~$5,800/year."
  - reason: "S-corp would save you about $5,800/year after running costs (payroll service + state fees + extra accounting). Your income is stable enough to commit to the 5-year window. File Form 2553 by March 15 to elect for this tax year."

If verdict logic isn't obvious for an edge case, default to `"wait"` with a "not enough info to recommend" reason — NEVER default to `"yes"` in ambiguous cases. The buildout plan is explicit about this in CLAUDE.md.

## Reasonable salary calculation (the second-most important math)

The IRS requires S-corp owners to pay themselves a "reasonable salary" before taking distributions (which are SE-tax-free, hence the savings). Getting this number right is the whole game.

Build `src/data/niche_salary_benchmarks.ts` as a lookup table. ~50 rows. Source citations in comments — BLS Occupational Employment Statistics + creator-industry reports (Goldman Sachs creator economy report, Influencer Marketing Hub data).

```ts
// src/data/niche_salary_benchmarks.ts

export type NicheSalaryBenchmark = {
  niche: "gaming" | "beauty" | "finance" | "lifestyle" | "education" | "tech" | "other";
  audienceTier: "<10k" | "10-100k" | "100k-1M" | "1M+";
  hoursPerWeekTier: "<10" | "10-25" | "25-40" | "40+";
  /** Reasonable annual salary range in USD */
  salaryLow: number;
  salaryHigh: number;
  source: string;
};

export const NICHE_SALARY_BENCHMARKS: NicheSalaryBenchmark[] = [
  // Finance / B2B niches command HIGHER defensible salaries
  // because IRS would compare to financial analyst / B2B marketing salaries
  {
    niche: "finance",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 75_000,
    salaryHigh: 95_000,
    source: "BLS OES Financial Analyst median + 20% creator premium",
  },
  // Entertainment / Lifestyle niches → lower defensible salary
  {
    niche: "lifestyle",
    audienceTier: "100k-1M",
    hoursPerWeekTier: "25-40",
    salaryLow: 45_000,
    salaryHigh: 65_000,
    source: "BLS OES Media Producers median",
  },
  // Build out all 7 niches × 4 audience tiers × 4 hours tiers = at most 112 combinations
  // You don't need ALL of them — focus on plausible combinations (a <10k audience at 40+ hours is weird)
  // Aim for ~50 rows covering the realistic combinations
  // ...
];
```

`src/lib/tax/scorp.ts` should export `reasonableSalary(inputs) → { low: number, recommended: number, high: number, defensibilityNote: string }`. The note explains what makes this salary defensible (or risky) given the inputs.

Salary recommendation logic:
- Start with the niche × audience × hours benchmark midpoint
- If `hours_per_week < 20`, weight toward `salaryLow` (part-time work)
- If audience is 1M+ AND niche is finance/tech, weight toward `salaryHigh` (IRS expects more)
- Cap recommended salary at `total_creator_income * 0.5` (rule of thumb: don't take more than half as salary, the rest can be distributions)
- Floor at $40k (IRS won't accept salaries below this for full-time creators)

## State-specific gotchas (this is where most S-corp calcs fail)

`src/lib/tax/scorp.ts` must surface these in the result:

- **California**: $800 minimum franchise tax + 1.5% S-corp tax on net income. This often kills the case below $75k profit. Calculate and DISPLAY both costs.
- **New York City**: GCT (general corporation tax) — 8.85% on net income for NYC residents. Add a flag if state=NY AND user notes they're in NYC.
- **New Jersey**: Minimum tax + corp business tax. Affects breakeven.
- **Oregon**: Minimum excise tax ($150) + corporate activity tax over $1M revenue.
- **Tennessee**: No income tax, but franchise tax and excise tax apply. Often still beneficial because no SE tax savings is offset by no income tax.
- **New Hampshire**: Business profits tax (BPT) and business enterprise tax (BET) — affects breakeven.

All other states: standard SE tax savings calculation applies.

For states with no income tax (TX, FL, WA, etc.), S-corp savings come from SE tax avoidance only — the income tax is the same either way. Make this explicit in the result.

## Math modules

```
src/lib/tax/scorp.ts                  # main entry — verdict, savings, salary, costs
src/data/niche_salary_benchmarks.ts   # ~50-row lookup table
```

Reuse from sprint 2:
- `src/lib/tax/federal.ts` — SE tax calculation, federal income tax brackets
- `src/lib/tax/state.ts` — state income tax (the S-corp doesn't change this directly, but state filing fees do)
- `src/data/states.ts` — already populated with 50 states

`src/lib/tax/scorp.ts` exports:

```ts
type ScorpInputs = z.infer<typeof inputSchema>;
type ScorpResult = {
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string;
  verdictReason: string;
  reasonableSalary: { low: number; recommended: number; high: number; defensibilityNote: string };
  withoutScorpAnnualTax: number;
  withScorpAnnualTax: number;
  grossSavings: number;
  runningCosts: {
    payrollServiceAnnual: number;       // $600-1200 estimate
    stateFilingFees: number;            // varies by state
    additionalAccountingCost: number;   // $500-1500 estimate
    total: number;
  };
  netSavings: number;
  stateGotchas: string[];               // human-readable notes about CA $800, NYC GCT, etc.
  filingDeadline: string;               // "March 15, 2026" for current-year election
  breakdownExplainer: string;           // plain-language paragraph for the result page
};

export function computeScorp(inputs: ScorpInputs): ScorpResult;
```

## Files to create

```
src/tools/scorp-calculator.ts                              # ToolDefinition export
src/app/(tools)/scorp-calculator/page.tsx                  # 4-line route file
src/app/(tools)/scorp-calculator/result/[id]/page.tsx
src/app/(tools)/scorp-calculator/result/[id]/opengraph-image.tsx

src/app/api/tools/scorp-calculator/route.ts                # POST → calc + save snapshot
src/app/api/tools/scorp-calculator/follow-up/route.ts      # Edge streaming chat

src/lib/tax/scorp.ts                                       # all S-corp math
src/data/niche_salary_benchmarks.ts                        # ~50 row lookup

src/components/og/ResultComparisonTemplate.tsx             # NEW OG template (without/with S-corp/savings)

content/learn/should-you-switch-to-scorp.mdx               # from docs/content_scorp_explainer.md

tests/unit/scorp.test.ts                                   # ≥40 scenarios
tests/unit/scorp-verdict.test.ts                           # must hit yes/no/wait with creator-specific contexts
tests/unit/scorp-salary.test.ts                            # reasonable salary ranges per niche
tests/unit/scorp-state-gotchas.test.ts                     # CA, NYC, NJ, OR, TN, NH
tests/e2e/scorp-flow.spec.ts                               # Playwright E2E
```

## Test pattern (mandatory)

S-corp math is more nuanced than tax-estimator math because the savings depend on salary-vs-distribution split. Build ≥40 scenarios covering:

1. The "happy yes" path: $120k profit, tech niche, 5+ years, low-tax state — should produce $5-8k net savings
2. The "CA no" path: $65k profit, California — should produce verdict: "no" with the $800 + 1.5% explainer
3. The "5-year lockout no" path: $90k profit, <1 year full-time — verdict: "no" with the income-stability explainer
4. The "already S-corp" no path: current_entity: "scorp_already" — verdict: "no", no further math
5. The "breakeven wait" path: $72k profit, 2 years full-time — verdict: "wait" with re-run instructions
6. The "niche salary differential": same income, finance niche vs lifestyle niche — finance should require a HIGHER reasonable salary, lower savings
7. The "audience size differential": same income, <10k vs 1M+ audience — 1M+ should defend a higher salary
8. The "hours_per_week differential": 10 hrs/wk vs 40 hrs/wk at same income — 40 hrs should justify higher salary
9. State-specific: every state with a gotcha (CA, NY, NJ, OR, TN, NH) needs a scenario
10. The agency_cut edge case: $200k income with 20% agent cut should net $160k for calculation

```ts
// tests/unit/scorp-verdict.test.ts (example)
import { describe, expect, it } from "vitest";
import { computeScorp } from "@/lib/tax/scorp";

describe("scorp verdict", () => {
  it("returns 'no' when CA + profit < 75k", () => {
    const result = computeScorp({
      total_creator_income: 70_000,
      business_expenses: 5_000,
      state: "CA",
      years_creating_full_time: "3-5",
      current_entity: "single_member_llc",
      // ... other required fields
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictReason).toMatch(/franchise tax|1\.5%/i);
  });

  it("returns 'wait' for 1-3 yr full-time creator just under threshold", () => {
    const result = computeScorp({
      total_creator_income: 85_000,
      business_expenses: 10_000,
      state: "TX",
      years_creating_full_time: "1-3",
      current_entity: "single_member_llc",
      // ...
    });
    expect(result.verdict).toBe("wait");
  });

  it("returns 'yes' for stable mid-tier finance creator in low-tax state", () => {
    const result = computeScorp({
      total_creator_income: 150_000,
      business_expenses: 20_000,
      state: "TX",
      years_creating_full_time: "5+",
      niche: "finance",
      current_entity: "single_member_llc",
      // ...
    });
    expect(result.verdict).toBe("yes");
    expect(result.netSavings).toBeGreaterThan(4000);
  });
});
```

ALL three verdict paths MUST be covered or the test suite fails. CI should fail-fast on missing verdict coverage.

## ToolDefinition shape

```ts
// src/tools/scorp-calculator.ts
import { z } from "zod";
import type { ToolDefinition } from "./_types";
import { computeScorp } from "@/lib/tax/scorp";

const inputSchema = z.object({
  primary_platform: z.enum(["youtube", "tiktok", "twitch", "instagram", "multi", "podcast"]),
  niche: z.enum(["gaming", "beauty", "finance", "lifestyle", "education", "tech", "other"]),
  audience_size: z.enum(["<10k", "10-100k", "100k-1M", "1M+"]),
  hours_per_week: z.number().int().min(1).max(80),
  total_creator_income: z.number().int().min(0),
  income_breakdown: z.object({
    adsense: z.number().int().min(0).optional(),
    sponsors: z.number().int().min(0).optional(),
    patreon: z.number().int().min(0).optional(),
    affiliate: z.number().int().min(0).optional(),
    merch: z.number().int().min(0).optional(),
    courses: z.number().int().min(0).optional(),
  }).optional(),
  business_expenses: z.number().int().min(0),
  state: z.string().length(2),
  current_entity: z.enum(["sole_prop", "single_member_llc", "scorp_already", "other", "not_sure"]),
  years_creating_full_time: z.enum(["<1", "1-3", "3-5", "5+"]),
  manager_or_agency_cut: z.number().int().min(0).max(30).default(0),
});

const outputSchema = z.object({
  verdict: z.enum(["yes", "no", "wait"]),
  verdictHeadline: z.string(),
  verdictReason: z.string(),
  reasonableSalary: z.object({
    low: z.number().int(),
    recommended: z.number().int(),
    high: z.number().int(),
    defensibilityNote: z.string(),
  }),
  withoutScorpAnnualTax: z.number().int(),
  withScorpAnnualTax: z.number().int(),
  grossSavings: z.number().int(),
  runningCosts: z.object({
    payrollServiceAnnual: z.number().int(),
    stateFilingFees: z.number().int(),
    additionalAccountingCost: z.number().int(),
    total: z.number().int(),
  }),
  netSavings: z.number().int(),
  stateGotchas: z.array(z.string()),
  filingDeadline: z.string(),
  breakdownExplainer: z.string(),
});

const tool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  slug: "scorp-calculator",
  title: "Should you switch to an S-corp? Free calculator for creators",
  metaTitle: "S-corp calculator for content creators — honest answer in under 3 minutes",
  metaDescription: "Free tool. 11 creator-specific questions. Get a real yes/no/wait answer on whether switching to an S-corp would actually save you money — including the cases where it wouldn't.",
  inputSchema,
  outputSchema,
  compute: computeScorp,
  explainerSlug: "should-you-switch-to-scorp",
  explainerExcerpt: "S-corp election can save you thousands. It can also lock you into 5 years of payroll headaches for $400 of savings. Here's how to tell which one applies to you.",
  buildShareText: (out) => {
    if (out.verdict === "yes") return `s-corp would save me $${out.netSavings.toLocaleString()}/year. running the math finally clicked →`;
    if (out.verdict === "no") return `turns out s-corp is NOT worth it for me yet. this calc actually told me to wait, which feels honest →`;
    return `right at the s-corp breakeven, going to wait a quarter and re-run →`;
  },
  relatedTools: ["tax-estimator", "retirement-chooser"],
  ogTemplate: "ResultComparisonTemplate",
};

export default tool;
```

## New OG template (`ResultComparisonTemplate`)

Three-column comparison layout for the OG image:

- Left column: "Without S-corp" — annual tax dollar amount
- Middle column: "With S-corp" — annual tax dollar amount
- Right column: "Net savings" — the delta (or "Don't switch" if verdict is "no")

Above the columns, the verdict headline ("Don't switch yet" / "Wait one more quarter" / "Yes, switch — save $5,800/year").

Use the same brand styling as `ResultHeadlineTemplate` from sprint 2 (font, colors, padding). Just a different content layout. Tests should snapshot-diff against a known-good rendering.

## Follow-up chat addition

The `/api/tools/scorp-calculator/follow-up/route.ts` Edge route loads the AI CFO system prompt + a structured summary of inputs + outputs + verdict, plus this tool-specific addition:

> User is asking follow-ups about their S-corp calculation. Their verdict was [verdict]. Their state is [state] — surface state-specific gotchas if asked. Their reasonable salary range is $[low]-$[high] — explain defensibility if asked. If they ask "should I form an LLC first" — answer YES, single-member LLC is the standard prerequisite for S-corp election. If they ask about Form 2553 — give the filing deadline and explain it's a tax election, not a separate company. If they ask "what if I'm wrong about my income next year" — explain the 5-year lockout candidly, including the path to revoke (which requires IRS consent and a 5-year wait to re-elect).

Rate limit: 3 follow-up questions per session, 10/hr per IP. Reuse `src/lib/ratelimit.ts` from sprint 1.

## Companion content

`content/learn/should-you-switch-to-scorp.mdx` — convert `docs/content_scorp_explainer.md` to MDX.

Target 2,000–3,500 words. Plain creator voice. Section headers:

1. The basics: what an S-corp actually IS (it's a tax election, not a company type)
2. The math in plain English: salary vs distributions
3. The savings: SE tax on distributions = zero
4. The costs: payroll service, extra accounting, state-specific fees
5. Reasonable salary: the IRS hot button
6. The 5-year lockout: why this isn't a "try it for a year" decision
7. State-specific landmines: CA, NYC, NJ, OR, TN, NH
8. The "no" case: when you SHOULDN'T do this
9. Filing deadline + what to do once you decide

Embed the calculator at the top with `<ToolEmbed slug="scorp-calculator" />`.

## Stop conditions (from CLAUDE.md)

Stop and write to `STATUS.md` if:
- A single task takes > 30 minutes or 5 retries
- You hit a missing API key
- Tests fail and you can't determine why within 10 minutes
- You'd need to deviate from this spec or the buildout plan
- You'd need to install a package not already in the lockfile
- You'd need to make a destructive change
- The niche salary benchmark sources don't have defensible data for a niche — write to STATUS.md and ask which sources to cite
- 2026 IRS rules for S-corp election (Form 2553 deadline, salary requirements) aren't documented somewhere you can verify

## Out-of-scope work (DO NOT do without explicit approval)

- Deploy to production
- Touch main directly
- Build the LLC chooser as a tool (it's MDX content only)
- Build the retirement chooser as a tool (MDX explainer only)
- Add the sponsor rate calc or contract scanner (sprint 4)
- Run against real Anthropic API in tests (mock at boundary)
- Promise specific dollar amounts the user "will save" without the running costs subtracted — always show net savings, never gross savings as the headline
- Recommend YES verdict in ambiguous cases — default to WAIT
- Commit secrets

## End-of-sprint deliverable

A creator hits `/scorp-calculator` on their phone:

1. Sees the hero + form (11 fields, ~3 minutes to complete)
2. Hits submit
3. Gets a verdict above the fold ("Don't switch yet" / "Wait one more quarter" / "Yes, switch — save $5,800/year")
4. Sees the comparison: without S-corp / with S-corp / net savings
5. Sees their reasonable salary range with the defensibility note
6. Sees any state-specific gotchas surfaced as plain-language warnings
7. Sees the running costs broken out (payroll service, state fees, accounting)
8. Reads the explainer
9. Can ask the AI CFO 3 follow-up questions
10. Can share a unique result URL with the comparison OG image
11. Sees cross-promo to tax estimator + retirement chooser (note: retirement chooser is MDX only — link gracefully degrades)

CI green, Lighthouse mobile ≥95, all tests pass (including all 3 verdict paths and all state gotchas). PR opened against `feat/sprint2-tax-estimator` with a clear description.

If you ship all of that, write a `STATUS.md` update describing what shipped and what's next, then stop.

---

## How to kick this off (Jada — your checklist)

1. `cd ~/Desktop/cfoforcreators_freetools`
2. `git checkout main && git pull` (make sure you have latest)
3. `git checkout -b feat/sprint3-scorp-calculator`
4. `git push -u origin feat/sprint3-scorp-calculator`
5. Open Claude Code in this directory
6. Paste THIS file's contents (everything above the line) as the first prompt
7. Run with `--dangerously-skip-permissions` for autonomous overnight work
8. Sleep. Check the PR in the morning.

Expected runtime: 5–7 hours of agent time, ~15–25 commits, one PR ready for review.

This sprint is more complex than sprint 2 because of the verdict edge cases and the niche salary lookup table. Budget more time for review of the verdict reasons — that's the brand voice work that matters most.
