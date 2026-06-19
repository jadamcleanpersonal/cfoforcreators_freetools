# Sprint 4a — Sponsor Rate Calculator (overnight build kickoff)

This is the prompt to paste into Claude Code for the unsupervised overnight build of the sponsor rate calculator. Sprint 3 (S-corp calculator) is merged to main — sprint 4a branches off main.

Sprint 4a (this doc) and Sprint 4b (brand contract scanner — `docs/sprint4b_kickoff.md`) can run in parallel as two separate Claude Code instances on two separate branches. They touch entirely different files except for `_registry.ts` and `sitemap.ts` — see Merge Conflict Resolution below.

---

## Context

You're building the **Sponsor Rate Calculator** — the third user-facing free tool. The buildout plan in `docs/cfoforcreators_buildout_plan.md` §10 week 5 specifies this work.

**Why this tool matters:**

Sponsor rate research is the highest-volume creator search query in our space. "How much should I charge for a YouTube sponsorship" + variants get searched constantly. Karat published a 2024 pricing guide that almost everyone in the space cites. Influencer Marketing Hub publishes annual data. Neither has a tool that produces a verdict on YOUR rate.

We do. The "rate validator" framing — user enters what they're considering charging, we tell them yes/no/wait — is the differentiator. Most rate calcs only tell creators to charge more. We tell them when they're overcharging too. That's brand-defining.

**Cold-start strategy (important):** We won't have community-submitted rate data on launch day. v1 ships with published-source data (Karat 2024 guide + Influencer Marketing Hub) baked into `src/data/sponsor_rate_benchmarks.ts`, with prominent source citations in every result. Community submissions (`sponsor_rate_submissions` table) accumulate quietly until we have enough data to blend. This is explicitly NOT a "wait until we have data" launch — Karat's published medians are good enough to validate rates today.

**Source of truth:** `docs/cfoforcreators_buildout_plan.md` §10 week 5 for the original spec. `CLAUDE.md` for architecture invariants.

## Branching

- Base branch: `main`
- New branch: `feat/sprint4a-sponsor-rate`
- PR target: `main`
- Conventional Commits format: `feat(sponsor): ...`, `feat(tools): ...`, etc.

## Parallel sprint coordination

Sprint 4b (contract scanner) runs on its own branch (`feat/sprint4b-contract-scanner`) off the same parent. The two will conflict on these files only:

- `src/tools/_registry.ts` — both add a new tool slug
- `src/app/sitemap.ts` — both add new route entries
- `src/components/tool/ToolCrossPromo.tsx` — if either adds the other to relatedTools

**Resolution rule:** First PR to merge wins. Second PR rebases and resolves by hand, adding its tool to the union. Jada will handle the rebase manually — your job is just to follow the file structure cleanly so the diff is obvious.

## Pruned tool roadmap reminder

1. Sprint 2: Tax estimator ✅
2. Sprint 3: S-corp calculator ✅
3. **Sprint 4a: Sponsor rate calculator** ← this sprint
4. Sprint 4b: Brand contract scanner (parallel)
5. LLC chooser → MDX only, do NOT build
6. Retirement chooser → MDX only, do NOT build

## Architecture invariants (from CLAUDE.md)

- ONE file in `src/tools/sponsor-rate.ts`, ONE route file. NO touching `ToolPage.tsx`.
- Pure math in `src/lib/sponsor/*`. NEVER inline in components.
- Same `zod` schema validates client and server.
- Result URLs (`/sponsor-rate/result/[id]`) stable forever.
- Money values are integers.
- State references through `src/data/states.ts` (probably not needed for this tool, but the rule stands).
- Mobile-first. Tap targets ≥ 44px. Lighthouse mobile ≥ 95.
- **Verdict required** — see verdict logic below.

## Required inputs (9 fields)

| Field | Type | Notes |
|---|---|---|
| `primary_platform` | radio | YouTube long-form / YouTube Shorts / TikTok / Instagram Reels / Instagram feed / Twitch / Podcast / X (Twitter) — platform drives the entire rate model |
| `niche` | radio | Gaming / Beauty / Finance / Lifestyle / Education / Tech / Food / Fitness / Other — niche drives multiplier vs platform median |
| `audience_size` | radio | <10k / 10–100k / 100k–1M / 1M+ — primary axis on rate cards |
| `avg_views_per_video` | currency-style int | The actual delivery metric sponsors care about — avg, not subscriber count |
| `engagement_rate_pct` | optional number (0-30) | Engagement % — if user knows it. Optional but signal-rich |
| `deliverable_type` | radio | dedicated_video / integration / mention / story_post / feed_post / podcast_read / multi_deliverable — drives the multiplier most aggressively |
| `your_asking_rate` | currency | THE INPUT THE VERDICT EVALUATES. What they're considering charging in USD. |
| `exclusivity_window_days` | number (default 0) | Brand exclusivity window in days. Common values: 0, 30, 90. Pushes rate UP. |
| `usage_rights` | radio | organic_only / brand_can_boost_paid / brand_owns_perpetual — perpetual rights are 2-3x organic-only |

All currency = integer dollars. Percent = integer 0-100.

## Verdict logic

The verdict union stays `"yes" | "no" | "wait"`. Mapping for sponsor rate:

```ts
// src/lib/sponsor/verdict.ts
function rateVerdict(inputs, marketRange): "yes" | "no" | "wait" {
  // marketRange is { low, mid, high } from the benchmark lookup, adjusted for the inputs

  // WAIT case first — data integrity
  if (marketRange.dataConfidence === "low") return "wait";
  // (low = no Karat data for this exact niche/platform/tier intersection, no community submissions yet)

  // YES cases — within market range
  if (inputs.your_asking_rate >= marketRange.low && inputs.your_asking_rate <= marketRange.high) {
    return "yes";
  }

  // NO cases — outside market range
  // Below range = leaving money on the table
  // Above range = will get pushback / pass from sponsors
  return "no";
}
```

Verdict reasons must be plain creator language. Examples:

- `verdict: "yes"` (asking $4,500 for an 800k YouTube tech integration, market range $3,500-5,500):
  - headline: "$4,500 is in market range. You can confidently quote this."
  - reason: "For an 800k tech-niche YouTube integration, Karat's 2024 data puts the median at $4,200. You're $300 above — totally defensible. Brands negotiating you down to $3,800 isn't unusual; below $3,500 walk away."

- `verdict: "no"` — asking too low (asking $1,200 for the same scenario):
  - headline: "$1,200 is way under market. You can ask 3x this."
  - reason: "The median rate for an 800k tech-niche YouTube integration is $4,200 (Karat 2024). You're undercharging by $3,000 per deal. If this is your first sponsor, ask for $3,500. Don't drop below $3,000 just because they're a 'small brand.' Sponsor brands have rate cards — they know."

- `verdict: "no"` — asking too high (asking $12,000 for the same scenario):
  - headline: "$12,000 is well above market — expect pushback."
  - reason: "The high end for an 800k tech-niche integration is $5,500. You're 2x over. Brands will pass without responding. If you're getting consistent yeses at $12k, you have leverage we can't see (huge engagement, b2b buyer audience) — keep going. Otherwise reset to $4,500–5,000."

- `verdict: "wait"` (gaming niche, 50k Shorts audience, $800 ask):
  - headline: "Not enough data to validate this rate confidently."
  - reason: "We don't have strong public data for 10-100k Shorts gaming integrations specifically. Triangulating from feed posts at that tier suggests $400-1,200 is plausible. Your $800 is in the middle of that — probably fine, but treat it as a starting position. Track your acceptance rate over the next 5 pitches and we'll adjust."

The `wait` verdict is critical — it's how we handle cold-start gracefully. Never default to YES with thin data.

## Benchmark data (`src/data/sponsor_rate_benchmarks.ts`)

The lookup table. Sourced from public 2024 data — cite source in EVERY row.

```ts
export type SponsorRateBenchmark = {
  platform: "youtube_long" | "youtube_shorts" | "tiktok" | "instagram_reels" | "instagram_feed" | "twitch" | "podcast" | "x";
  niche: "gaming" | "beauty" | "finance" | "lifestyle" | "education" | "tech" | "food" | "fitness" | "other";
  audienceSize: "<10k" | "10-100k" | "100k-1M" | "1M+";
  deliverableType: "dedicated_video" | "integration" | "mention" | "story_post" | "feed_post" | "podcast_read" | "multi_deliverable";
  rateLow: number;
  rateMid: number;     // median
  rateHigh: number;
  source: string;      // "Karat 2024 Pricing Guide" | "Influencer Marketing Hub 2024 Report" | "ConvertKit Creator Earnings 2024"
  dataConfidence: "high" | "medium" | "low";  // high = direct data; medium = interpolated; low = no data, triangulated
};

export const SPONSOR_RATE_BENCHMARKS: SponsorRateBenchmark[] = [
  // YouTube long-form
  {
    platform: "youtube_long",
    niche: "tech",
    audienceSize: "100k-1M",
    deliverableType: "integration",
    rateLow: 3_500,
    rateMid: 4_200,
    rateHigh: 5_500,
    source: "Karat 2024 Pricing Guide",
    dataConfidence: "high",
  },
  // ... build out all the high-data combinations
  // Total target: 100-150 rows covering the most common intersections
];
```

Build out the table covering:
- All 8 platforms
- All 9 niches
- All 4 audience sizes
- All 7 deliverable types

That's 2,016 theoretical intersections but most aren't useful (nobody does Twitch podcast reads). Aim for 100–150 well-cited rows covering ~80% of real-world creator searches.

For intersections WITHOUT direct data, the lookup function falls back to nearest-neighbor interpolation (same niche/tier, adjacent deliverable) and returns `dataConfidence: "low"`, which triggers the WAIT verdict.

**Data sources for rows (cite each in the source field):**
- Karat 2024 Pricing Guide (their published medians by tier)
- Influencer Marketing Hub 2024 Benchmark Report
- ConvertKit Creator Earnings 2024
- ImpactPlus / Aspire data (where publicly available)

If you can't find a defensible source for a niche-platform intersection, do NOT make one up — omit it. The WAIT verdict handles missing data gracefully.

## Multipliers (applied to base rate from benchmark lookup)

```ts
// src/lib/sponsor/multipliers.ts
export function applyMultipliers(baseRange, inputs): { low: number; mid: number; high: number } {
  let multiplier = 1.0;

  // Exclusivity bumps rate UP
  if (inputs.exclusivity_window_days >= 90) multiplier *= 1.5;
  else if (inputs.exclusivity_window_days >= 30) multiplier *= 1.2;

  // Usage rights bumps rate UP
  if (inputs.usage_rights === "brand_owns_perpetual") multiplier *= 2.5;
  else if (inputs.usage_rights === "brand_can_boost_paid") multiplier *= 1.4;

  // Engagement bonus — only if user provided
  if (inputs.engagement_rate_pct && inputs.engagement_rate_pct > 8) multiplier *= 1.15;
  if (inputs.engagement_rate_pct && inputs.engagement_rate_pct > 15) multiplier *= 1.3;

  // High actual views vs audience size implies viral content — small bonus
  // (logic for this: if avg_views_per_video > 30% of audience_size midpoint, +10%)

  return {
    low: Math.round(baseRange.rateLow * multiplier),
    mid: Math.round(baseRange.rateMid * multiplier),
    high: Math.round(baseRange.rateHigh * multiplier),
  };
}
```

## Math modules

```
src/lib/sponsor/benchmark_lookup.ts   # finds the right row in SPONSOR_RATE_BENCHMARKS
src/lib/sponsor/multipliers.ts        # applies exclusivity + rights + engagement adjustments
src/lib/sponsor/verdict.ts            # the verdict logic above
src/lib/sponsor/index.ts              # orchestrator: lookup → adjust → verdict → result
src/data/sponsor_rate_benchmarks.ts   # the lookup table
```

`src/lib/sponsor/index.ts` exports `computeSponsorRate(inputs) → ResultDisplay`.

## Files to create

```
src/tools/sponsor-rate.ts                                  # ToolDefinition export
src/app/(tools)/sponsor-rate/page.tsx                      # 4-line route file
src/app/(tools)/sponsor-rate/result/[id]/page.tsx
src/app/(tools)/sponsor-rate/result/[id]/opengraph-image.tsx

src/app/api/tools/sponsor-rate/route.ts                    # POST → calc + save snapshot
src/app/api/tools/sponsor-rate/follow-up/route.ts          # Edge streaming chat

src/lib/sponsor/benchmark_lookup.ts
src/lib/sponsor/multipliers.ts
src/lib/sponsor/verdict.ts
src/lib/sponsor/index.ts

src/data/sponsor_rate_benchmarks.ts                        # 100-150 rows

content/learn/how-to-price-a-brand-deal.mdx                # companion content

tests/unit/sponsor-benchmark-lookup.test.ts                # data integrity tests
tests/unit/sponsor-multipliers.test.ts                     # exclusivity, rights, engagement
tests/unit/sponsor-verdict.test.ts                         # must hit yes/no(too low)/no(too high)/wait paths
tests/e2e/sponsor-rate-flow.spec.ts                        # Playwright E2E
```

## Cold-start data ingestion (rate submission form)

Per buildout plan, a separate component captures community submissions to feed future iterations:

```
src/components/sponsor/RateSubmissionForm.tsx              # standalone form, separate from calc
src/app/api/sponsor-rate/submit/route.ts                   # POST to sponsor_rate_submissions table
src/app/admin/sponsor-rates/page.tsx                       # password-gated moderation view
```

The submission form is NOT embedded in the calculator result — keep it separate. We don't want users feeling like they have to "give to get." It lives at `/sponsor-rate/contribute` with its own landing.

Moderation: admin views submissions, approves with checkbox. Approved submissions flip `approved_for_display = true` in the DB. Future versions of the calculator blend approved submissions with Karat data using a weighted average.

For v1, the calculator only reads from the static benchmarks file. Don't wire DB reads into the calculator yet — that's v2.

## Test pattern (mandatory)

```ts
// tests/unit/sponsor-verdict.test.ts
import { describe, expect, it } from "vitest";
import { computeSponsorRate } from "@/lib/sponsor";

describe("sponsor rate verdict", () => {
  it("returns 'yes' when asking rate is in market range", () => {
    const result = computeSponsorRate({
      primary_platform: "youtube_long",
      niche: "tech",
      audience_size: "100k-1M",
      deliverable_type: "integration",
      your_asking_rate: 4_500,
      avg_views_per_video: 200_000,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("yes");
  });

  it("returns 'no' (too low) when underpricing significantly", () => {
    const result = computeSponsorRate({
      primary_platform: "youtube_long",
      niche: "tech",
      audience_size: "100k-1M",
      deliverable_type: "integration",
      your_asking_rate: 1_200,
      avg_views_per_video: 200_000,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictHeadline).toMatch(/way under|undercharging|leaving money/i);
  });

  it("returns 'no' (too high) when overpricing significantly", () => {
    const result = computeSponsorRate({
      primary_platform: "youtube_long",
      niche: "tech",
      audience_size: "100k-1M",
      deliverable_type: "integration",
      your_asking_rate: 12_000,
      avg_views_per_video: 200_000,
      exclusivity_window_days: 0,
      usage_rights: "organic_only",
    });
    expect(result.verdict).toBe("no");
    expect(result.verdictHeadline).toMatch(/above market|expect pushback/i);
  });

  it("returns 'wait' for thin-data niche/platform intersection", () => {
    const result = computeSponsorRate({
      primary_platform: "twitch",
      niche: "food",
      audience_size: "<10k",
      deliverable_type: "mention",
      // ... an intersection with no benchmark data
    });
    expect(result.verdict).toBe("wait");
  });
});
```

ALL four paths (yes / no-too-low / no-too-high / wait) MUST be covered.

## ToolDefinition shape

Use the same pattern as sprint 2 and 3. Key items:

```ts
const tool: ToolDefinition<...> = {
  slug: "sponsor-rate",
  title: "What should you charge for a sponsorship? Free rate calculator",
  metaTitle: "Sponsor rate calculator for creators — based on Karat 2024 + industry data",
  metaDescription: "Free tool. 9 questions. Get a real yes/no/wait answer on whether the rate you're considering is in market range — including when you're undercharging or overcharging.",
  // ...
  explainerSlug: "how-to-price-a-brand-deal",
  buildShareText: (out) => {
    if (out.verdict === "yes") return `validated my $${out.your_asking_rate.toLocaleString()} sponsor rate against market data. in range →`;
    if (out.verdict === "no") return `turns out i was charging $${out.deltaFromMid > 0 ? "too much" : "way too little"} for sponsorships →`;
    return `couldn't fully validate my sponsor rate (thin data for my niche) — here's how i'm triangulating →`;
  },
  relatedTools: ["tax-estimator", "scorp-calculator"],
  ogTemplate: "ResultHeadlineTemplate",  // reuse from sprint 2
};
```

## Companion content

`content/learn/how-to-price-a-brand-deal.mdx`. Source: research already in repo. Target 2,000–3,000 words. Plain creator voice. Section headers:

1. The basics: how brands actually decide what to pay
2. The CPM myth (and why view-based rates are misleading)
3. Deliverable type matters more than audience size
4. Exclusivity and usage rights: where the real money is
5. The Karat data and how to read it
6. What to do when a brand lowballs you
7. What to do when a brand offers more than market (red flags vs leverage)

Embed the calculator at the top with `<ToolEmbed slug="sponsor-rate" />`.

## Stop conditions (from CLAUDE.md)

Stop and write to `STATUS.md` if:
- A single task takes > 30 minutes or 5 retries
- You can't find defensible public sources for benchmark data — write to STATUS.md, do NOT make numbers up
- Tests fail and you can't determine why within 10 minutes
- You'd need to deviate from this spec
- You'd need to install a package not in lockfile
- The cold-start data confidence model isn't producing reasonable `wait` verdicts — stop and document the failure cases

## Out-of-scope work (DO NOT do without explicit approval)

- Deploy to production
- Touch main directly
- Wire community submissions INTO the calculator for v1 (those land in the DB but don't affect rates yet)
- Promise specific dollar amounts based on community submissions (we don't have enough yet)
- Build the contract scanner (that's Sprint 4b, separate run)
- Add the LLC or retirement tools
- Commit secrets

## End-of-sprint deliverable

A creator hits `/sponsor-rate` on their phone:

1. Sees the hero + form (9 fields, ~2 minutes to complete)
2. Enters what they're considering charging
3. Hits submit
4. Gets a verdict above the fold (yes/no-too-low/no-too-high/wait)
5. Sees the market range (low/mid/high) with sources cited
6. Sees their adjustment multipliers explained (exclusivity, rights, engagement)
7. Reads the explainer
8. Can ask the AI CFO 3 follow-up questions
9. Can share a unique result URL
10. Sees cross-promo to tax estimator + S-corp calc

Separately, `/sponsor-rate/contribute` lets creators submit their own rates anonymously (goes to DB, queued for moderation, doesn't affect calculator yet).

CI green, Lighthouse mobile ≥95, all tests pass (all 4 verdict paths). PR opened against `main`.

Write a `STATUS.md` update on completion, then stop.

---

## How to kick this off (Jada — your checklist)

After sprint 3 is merged and you're ready to queue sprint 4a (this can run in parallel with sprint 4b):

1. `cd ~/Desktop/cfoforcreators_freetools`
2. `git checkout main && git pull`
3. `git checkout -b feat/sprint4a-sponsor-rate`
4. `git push -u origin feat/sprint4a-sponsor-rate`
5. Open a fresh Claude Code instance in this directory
6. Paste THIS file's contents as the first prompt
7. Run with `--dangerously-skip-permissions`
8. Check the PR when it's ready (~5-7 hr agent time).

Expected runtime: 5–7 hours of agent time. The benchmark data table is the long pole — sourcing defensible numbers for 100+ rows takes time.

If running in parallel with sprint 4b, expect a small merge conflict on `_registry.ts` and `sitemap.ts` when both PRs are open. Whichever you merge first wins; the second auto-rebases.
