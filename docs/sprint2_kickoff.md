# Sprint 2 — Tax Estimator (overnight build kickoff)

This is the prompt to paste into Claude Code for the unsupervised overnight build of the tax estimator tool. Sprint 1 (foundation) is in PR #1 — sprint 2 stacks on top of that branch (see Branching below).

---

## Context

You're building the **Tax Estimator** — the first user-facing free tool on cfoforcreators.com. The buildout plan in `docs/cfoforcreators_buildout_plan.md` §10 week 2 specifies this work. Sprint 1 established the foundation (Next.js scaffold, landing page, waitlist, Tally webhook, ToolDefinition contract, 8-section tool template); sprint 2 ships the first actual tool that uses those patterns.

**Why this tool first:** universal creator pain. Every creator owes quarterly taxes. Search volume is high ("quarterly tax calculator", "1099 tax calculator"). Existing competitors (Keeper, QBSE, generic calcs) treat creators as generic freelancers. We treat them like creators. The waitlist-conversion moment after "you owe $9,400 by Jan 15" is the strongest of any tool in the suite.

**Source of truth:** `docs/cfoforcreators_buildout_plan.md` for architecture. `CLAUDE.md` at the root for voice/architecture invariants and overnight autonomy guardrails. Read both before starting.

## Pruned tool roadmap (important — different from buildout plan §10)

The original plan listed 6 tools. We pruned to 4 after a strategic review. Your scope:

1. **Sprint 2: Tax estimator** ← this sprint
2. Sprint 3: S-corp calculator (next overnight)
3. Sprint 4 (parallel): Sponsor rate calculator + Brand contract scanner
4. LLC chooser → demoted to MDX content with embedded mini-widget (do NOT build as a full tool)
5. Retirement chooser → MDX explainer only (do NOT build as a full tool)

If you find yourself building an LLC or retirement tool, stop and write to STATUS.md — you've drifted.

## Branching

- Base branch: `feat/sprint1-foundation` (NOT main — sprint 1 is unmerged)
- New branch: `feat/sprint2-tax-estimator`
- PR target: `feat/sprint1-foundation` (stack the PR, do not open against main)
- Conventional Commits format: `feat(tax): ...`, `feat(tools): ...`, `test(tax): ...`, `docs: ...`

## Architecture invariants (non-negotiable — these are from CLAUDE.md)

- Adding a tool = ONE file in `src/tools/<slug>.ts` + ONE route file. If you're touching `ToolPage.tsx` to add tax estimator, stop.
- Calculator math lives in `src/lib/tax/*` as pure modules. NEVER inline math in components.
- Same `zod` schema validates client and server. Define once, import twice.
- Result URLs (`/tax-estimator/result/[id]`) must remain stable forever. NEVER change the snapshot shape in a way that breaks old URLs.
- All money values are integers in the schema. Format at display time only.
- All US state references go through `src/data/states.ts`. NEVER inline state lists.
- Mobile-first: tap targets ≥ 44px, `text-base` on inputs, single column at default, Lighthouse mobile ≥ 95.

## Required inputs (12 fields)

`src/tools/tax-estimator.ts` must include these inputs in the form. Half of these aren't on Keeper/Bizee — that creator-specific lift is the differentiator.

| Field | Type | Notes |
|---|---|---|
| `primary_platform` | radio | YouTube / TikTok / Twitch / Instagram / Multi-platform / Podcast |
| `niche` | radio | Gaming / Beauty / Finance / Lifestyle / Education / Tech / Other |
| `tax_year` | number | Default to current calendar year. Allow current-1 for redoing past quarters. |
| `current_quarter` | radio | Q1 / Q2 / Q3 / Q4 — drives which deadline + which YTD math |
| `total_creator_income_ytd` | currency | Integer dollars. Income from ALL creator sources YTD. |
| `income_breakdown` | optional multi-currency | AdSense / sponsors / Patreon / affiliate / merch / courses. Optional, but surfaces stability signal for the follow-up chat. |
| `business_expenses_ytd` | currency | Annual write-offs YTD |
| `state` | state dropdown | All 50 + DC. Pulled from `src/data/states.ts`. |
| `filing_status` | radio | single / married_joint / married_separate / head_of_household |
| `other_w2_income` | currency | If they also have a day job (gross income, not net) |
| `already_paid_estimated_taxes` | currency | YTD prior quarter payments (Q1+Q2 if they're on Q3, etc.) |
| `withholding_from_w2` | currency | YTD W-2 withholding (counts toward safe harbor) |

All currency inputs are integer dollars in the zod schema. Format with `Intl.NumberFormat` at display time only.

## Verdict (force-fit into yes/no/wait — this is a deliberate decision)

The verdict union stays `"yes" | "no" | "wait"` per CLAUDE.md. The mapping for tax:

- `verdict: "yes"` → "Send $X by [deadline]. You're on track for safe harbor."
  - Use when: their calculated payment fully covers the prior quarters + this quarter, no underpayment, no surprises.
- `verdict: "no"` → "You don't need to send a quarterly payment this period. Your W-2 withholding + prior payments already cover safe harbor for the year."
  - Use when: `total_withholding + already_paid_estimated_taxes >= safe_harbor_threshold`. The honest "no" verdict is brand-defining — competitors don't tell people they DON'T owe.
- `verdict: "wait"` → "You're behind on prior quarters. Here's the catch-up payment + the underpayment penalty math."
  - Use when: they should have already paid for a prior quarter that's past its deadline. Plain language explanation of what to send now + acknowledgment that a small penalty is owed (don't promise to eliminate it).

`verdictHeadline` and `verdictReason` should be plain creator voice — no jargon, lead with the answer, sometimes the right answer is "no, you don't owe right now."

**DO NOT include W-2 withholding adjustment advice** in the result or follow-up chat. We're omitting that for now — it's accountant territory and we're staying read-only / reactive. If a user asks the follow-up chat about withholding, the AI CFO defers to "an accountant or an Enrolled Agent."

## Math modules to build (`src/lib/tax/`)

All modules are pure functions, unit-tested in isolation with Vitest.

### `src/lib/tax/federal.ts`

- 2026 federal income tax brackets (look up actual current-year brackets from IRS — don't guess)
- Standard deduction by filing status (2026 numbers)
- Self-employment tax: 15.3% with social security wage base cap ($168,600 for 2024 — look up 2026 number)
- QBI deduction: 20% of qualified business income for sole props, with the income phase-out at the threshold
- Federal income tax owed = (taxable income × bracket math) - QBI savings
- Exports: `computeFederalTax(inputs) → { incomeTax, seTax, qbiDeduction, totalFederal }`

### `src/data/states.ts` (extend existing file from sprint 1, don't replace)

For each state: `code`, `name`, `taxType: "none" | "flat" | "bracket"`, `flatRate` OR `brackets[]`, `standardDeduction`, sourceCitation comment.

States with no income tax (set `taxType: "none"`): AK, FL, NV, NH (interest/div only — note in comment), SD, TN, TX, WA, WY.

Flat tax states: CO, IL, IN, KY, MA, MI, NC, PA, UT.

The rest are bracket states. CA, NY, NJ need careful brackets because their high-earner brackets matter for creator income.

NYC residents have a city tax on top — note this in NY's record with a comment that we don't compute city tax in v1.

### `src/lib/tax/state.ts`

`computeStateTax(income, state, filingStatus) → number`. Reads from `src/data/states.ts`. Same integer-dollar convention.

### `src/lib/tax/safe_harbor.ts`

IRS safe harbor rule for individuals:
- Pay 100% of last year's total tax liability (110% if AGI > $150k single or $300k joint) OR
- Pay 90% of current year's tax liability
- Whichever is LESS.

In v1, we don't ask for last year's tax (too much friction). So we use the 90% of current year safe harbor only, and disclose this in the result.

Exports: `computeSafeHarbor(annualTaxLiability) → { threshold, methodologyExplainer }`.

### `src/lib/tax/quarterly.ts`

Quarterly deadlines: Q1=Apr 15, Q2=Jun 15 (yes, that gap is intentional — IRS), Q3=Sep 15, Q4=Jan 15 of following year.

Annualizes income from YTD: `projected_annual_income = ytd_income × (4 / quarters_elapsed)` — but ONLY for the rough estimate. Real safe harbor math uses the actual cumulative annual income at year-end.

Exports: `computeQuarterlyPayment(inputs) → { amountThisQuarter, deadline, isCatchUp, penaltyEstimate? }`.

### `src/lib/tax/index.ts` — orchestrator

Single entry point that the API route calls. Combines federal + state + SE + safe harbor + quarterly into the final `ResultDisplay` shape. Returns the verdict.

## Files to create

```
src/tools/tax-estimator.ts                          # ToolDefinition export
src/app/(tools)/tax-estimator/page.tsx              # 4-line route file (copy pattern from sprint 1 stub)
src/app/(tools)/tax-estimator/result/[id]/page.tsx  # result page
src/app/(tools)/tax-estimator/result/[id]/opengraph-image.tsx   # dynamic OG using ResultHeadlineTemplate

src/app/api/tools/tax-estimator/route.ts            # POST → calc + save snapshot
src/app/api/tools/tax-estimator/follow-up/route.ts  # Edge streaming chat (Anthropic)

src/lib/tax/federal.ts
src/lib/tax/state.ts
src/lib/tax/safe_harbor.ts
src/lib/tax/quarterly.ts
src/lib/tax/index.ts

src/data/states.ts                                  # extend (don't replace)

supabase/migrations/00003_tool_results_seed.sql     # IF needed — table already exists from sprint 1

content/learn/how-quarterly-taxes-actually-work.mdx # companion content page

tests/unit/federal.test.ts                          # ≥30 scenarios
tests/unit/state.test.ts                            # ≥20 scenarios across no-tax/flat/bracket states
tests/unit/safe_harbor.test.ts                      # edge cases
tests/unit/quarterly.test.ts                        # all 4 quarters + catch-up case
tests/unit/tax-estimator-verdict.test.ts            # must hit yes / no / wait paths
tests/e2e/tax-estimator-flow.spec.ts                # Playwright: landing → form → result → share
```

## Test pattern (mandatory — wrong math = lawsuit risk)

Use the existing test harness from sprint 1. For each calculator function, build at least 30 scenarios sourced from a known-good calculator (NerdWallet, IRS withholding calculator). Document the source for each scenario in a comment.

```ts
// tests/unit/federal.test.ts
import { describe, expect, it } from "vitest";
import { computeFederalTax } from "@/lib/tax/federal";

describe("computeFederalTax", () => {
  it.each([
    // [grossIncome, expenses, filingStatus, expectedFederalIncomeTax, expectedSE, source]
    [80_000, 8_000, "single", /* known good */, /* known good */, "nerdwallet-2026"],
    [150_000, 20_000, "married_joint", /* */, /* */, "nerdwallet-2026"],
    [40_000, 5_000, "single", /* */, /* */, "irs-1040-worksheet"],
    [250_000, 30_000, "single", /* */, /* */, "irs-1040-worksheet"],
    [10_000, 2_000, "head_of_household", /* */, /* */, "nerdwallet-2026"],
    // ... ≥30 cases covering filing statuses, expense levels, edge cases (zero income, just over QBI threshold, etc.)
  ])("scenario %#", (income, expenses, status, expectedFed, expectedSE, source) => {
    const result = computeFederalTax({ income, expenses, status });
    expect(result.incomeTax).toBeCloseTo(expectedFed, -1); // within $10
    expect(result.seTax).toBeCloseTo(expectedSE, -1);
  });
});
```

Verdict tests MUST hit all three paths with creator-specific inputs:
- "yes" path: creator with $80k income, $15k expenses, paid Q1+Q2 on time, asking about Q3 — should get a payment number
- "no" path: creator with $30k creator income + $80k W-2 with $12k withholding, asking about Q2 — should get "you don't need to pay" because withholding covers safe harbor
- "wait" path: creator on Q3 who paid $0 in Q1 and Q2 — should get catch-up amount + penalty estimate

## ToolDefinition shape (copy structure from `src/tools/_types.ts` established in sprint 1)

```ts
// src/tools/tax-estimator.ts
import { z } from "zod";
import type { ToolDefinition } from "./_types";
import { computeTaxEstimate } from "@/lib/tax";

const inputSchema = z.object({
  primary_platform: z.enum(["youtube", "tiktok", "twitch", "instagram", "multi", "podcast"]),
  niche: z.enum(["gaming", "beauty", "finance", "lifestyle", "education", "tech", "other"]),
  tax_year: z.number().int().min(2024).max(2027),
  current_quarter: z.enum(["q1", "q2", "q3", "q4"]),
  total_creator_income_ytd: z.number().int().min(0),
  income_breakdown: z.object({
    adsense: z.number().int().min(0).optional(),
    sponsors: z.number().int().min(0).optional(),
    patreon: z.number().int().min(0).optional(),
    affiliate: z.number().int().min(0).optional(),
    merch: z.number().int().min(0).optional(),
    courses: z.number().int().min(0).optional(),
  }).optional(),
  business_expenses_ytd: z.number().int().min(0),
  state: z.string().length(2),
  filing_status: z.enum(["single", "married_joint", "married_separate", "head_of_household"]),
  other_w2_income: z.number().int().min(0).default(0),
  already_paid_estimated_taxes: z.number().int().min(0).default(0),
  withholding_from_w2: z.number().int().min(0).default(0),
});

const outputSchema = z.object({
  verdict: z.enum(["yes", "no", "wait"]),
  verdictHeadline: z.string(),
  verdictReason: z.string(),
  amountThisQuarter: z.number().int(),
  deadline: z.string(),
  federalBreakdown: z.object({ incomeTax: z.number().int(), seTax: z.number().int() }),
  stateBreakdown: z.number().int(),
  safeHarborMethodology: z.string(),
  catchUpPenaltyEstimate: z.number().int().optional(),
});

const tool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  slug: "tax-estimator",
  title: "Free quarterly tax calculator for creators",
  metaTitle: "Quarterly tax calculator for content creators — free, no signup",
  metaDescription: "Free tool. Plug in your creator income and expenses. Get the exact amount to send the IRS this quarter, including state tax. No signup needed.",
  inputSchema,
  outputSchema,
  compute: computeTaxEstimate,
  explainerSlug: "how-quarterly-taxes-actually-work",
  explainerExcerpt: "Quarterly taxes are not optional. Here's how they actually work — in plain English.",
  buildShareText: (out) => `just figured out i owe $${out.amountThisQuarter.toLocaleString()} in quarterly taxes. wish i'd known about this tool 6 months ago →`,
  relatedTools: ["scorp-calculator", "retirement-chooser"],  // even though retirement isn't built, link forward — the URL will 404 gracefully for now
  ogTemplate: "ResultHeadlineTemplate",
};

export default tool;
```

## Follow-up chat block

`ToolFollowupChat` component from sprint 1 already exists. Wire it on the result page with the standard pattern: pass `tool.slug` + the `result` object as context. The `/api/tools/tax-estimator/follow-up/route.ts` Edge route uses the `AI_CFO_SYSTEM_PROMPT` from sprint 1's `docs/ai_cfo_system_prompt.md` plus a structured summary of inputs + outputs + verdict.

Per `CLAUDE.md` voice rules, the system prompt addition for this tool's context should remind: "User is asking follow-ups about their tax calculation. Defer to 'an accountant or Enrolled Agent' for personalized advice. Don't give W-2 withholding adjustment recommendations. Lead with the number, then the reasoning. Plain language only."

Rate limit: 3 follow-up questions per session, 10/hr per IP. Reuse the rate limiter from sprint 1's `src/lib/ratelimit.ts`.

## Companion content (`content/learn/how-quarterly-taxes-actually-work.mdx`)

Source: research already in `docs/creator_finance_research.md` plus structured explainer logic from `docs/content_scorp_explainer.md` for tone reference. Target 1,500–2,500 words. Plain creator voice. Section headers:

1. The basics: what quarterly taxes are and why they exist
2. The four deadlines (with the awkward Q1→Q2 calendar gap explained)
3. How safe harbor works (and why it's your friend)
4. SE tax — the thing W-2 employees never see
5. State tax — wildly different state by state, here's how to find yours
6. The penalty for missing a payment (small, not catastrophic)
7. What to do RIGHT NOW if you're already behind

Embed the calculator at the top with `<ToolEmbed slug="tax-estimator" />`.

## Stop conditions (from CLAUDE.md)

Stop and write to `STATUS.md` if:
- A single task takes > 30 minutes or 5 retries
- You hit a missing API key or service credential
- Tests fail and you can't determine why within 10 minutes
- You'd need to deviate from `docs/cfoforcreators_buildout_plan.md` or these instructions
- You'd need to install a package not already in the lockfile
- You'd need to make a destructive change (delete files, drop tables, force-push)
- The 2026 IRS brackets / standard deductions / SE cap aren't documented somewhere you can verify — don't guess these numbers, write to STATUS.md and ask

## Out-of-scope work (DO NOT do without explicit human approval)

- Deploy to production (preview deploys via PR are fine and automatic)
- Touch `main` branch directly
- Run against real Anthropic API in tests (mock at the boundary)
- Add dependencies not justified by the plan
- Build the LLC chooser, retirement chooser, sponsor rate calc, or contract scanner (those are sprints 3+)
- Make architectural changes that contradict the foundation
- Commit secrets (even briefly)

## End-of-sprint deliverable

A creator hits `/tax-estimator` on their phone:
1. Sees the hero + form
2. Fills 12 fields in < 3 minutes
3. Hits submit
4. Gets a verdict above the fold ("yes — send $9,400 by Jan 15") with the headline number
5. Sees the federal / state / SE breakdown
6. Reads the explainer
7. Can ask the AI CFO 3 follow-up questions
8. Can share a unique result URL with a custom OG image
9. Sees cross-promo to S-corp calc + retirement chooser

CI green, Lighthouse mobile ≥95, all tests pass. PR opened against `feat/sprint1-foundation` (NOT main) with a clear description.

If you ship all of that, write a `STATUS.md` update describing what shipped and what's next, then stop.

---

## How to kick this off (Jada — your morning checklist)

Once sprint 1 is reviewed and you're ready to fire sprint 2:

1. `cd ~/Desktop/cfoforcreators_freetools`
2. `git checkout feat/sprint1-foundation && git pull` (make sure you have latest)
3. `git checkout -b feat/sprint2-tax-estimator`
4. `git push -u origin feat/sprint2-tax-estimator`
5. Open Claude Code in this directory
6. Paste THIS file's contents (everything above the line) as the first prompt
7. Run with `--dangerously-skip-permissions` for autonomous overnight work
8. Sleep. Check the PR in the morning.

Expected runtime: 4–6 hours of agent time, ~10–20 commits, one PR ready for review.
