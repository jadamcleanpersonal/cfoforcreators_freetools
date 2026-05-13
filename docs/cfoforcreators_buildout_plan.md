# CFOforcreators.com — Implementation Plan

**Audience:** developer or Claude Code agent picking up the build
**Scope:** marketing site + free calculator suite + waitlist + email nurture (NOT the paid AI CFO product)
**Timeline:** 6 weeks to fully shipped, then ongoing
**Status of this doc:** locked architectural decisions. Don't re-litigate. Build.

---

## Table of contents

1. Tech stack final picks
2. Project structure
3. Database schema (Supabase)
4. Tool template architecture (the 7-section template)
5. API / serverless function design
6. Email service integration (Beehiiv)
7. Dynamic OG image setup
8. SEO foundation (sitemap, structured data, programmatic SEO)
9. Mobile-first design system
10. Build sequence (week-by-week)
11. Testing approach
12. Deployment + CI/CD
13. Analytics events
14. Cost estimates
15. Claude Code workflow (CLAUDE.md, slash commands, parallel agents)
16. Open decisions deferred to later

---

## 1. Tech stack — final picks

| Layer | Pick | Version pin | Why this not the alternative |
|---|---|---|---|
| Framework | Next.js | `15.x` (App Router, RSC) | Best-in-class SEO, native streaming, server components for tool result pages, edge runtime for OG. SvelteKit/Astro lose on the dynamic AI chat we'll add in v2. |
| Hosting | Vercel | n/a | Native Next.js, zero-config edge functions, built-in `@vercel/og`, instant preview deploys per PR. Cloudflare Pages is cheaper but `@vercel/og` is the killer feature for this use case. |
| Styling | Tailwind CSS | `4.x` | Mobile-first by default, tiny output, AI agents write it well. Tailwind 4 ships native CSS variables which we want for the dynamic OG images. |
| Component lib | shadcn/ui | latest | Copy-paste, no runtime dep, fully editable. Radix primitives underneath = accessibility-by-default. |
| Forms | `react-hook-form` + `zod` | `^7.54` / `^3.23` | Same `zod` schema validates client AND server (single source of truth). |
| Database | Supabase (Postgres) | `2.x` JS client | Auth ready when we add it, RLS for security, free tier covers us through ~50k MAU. **Use the JS client, not Prisma — RLS works better.** |
| Email | Beehiiv | API v2 | Creator-economy native, generous free tier (2,500 subs), built-in newsletter editor, native referral mechanics (we'll want them later). Resend is better for transactional but we'll use Beehiiv for both at launch — see §6 for nuance. |
| Transactional email | Resend | `^4.x` | For the founder deep-dive auto-confirmation + admin notifications. Beehiiv is for marketing sequences. |
| Form host | Tally | external | Founder deep-dive intake form. Tally has webhook → we POST into Supabase + Beehiiv on completion. No engineer needed to edit the form copy. |
| Analytics | PostHog | `posthog-js ^1.x` | Self-serve funnels, session replay (huge for catching mobile UX bugs), feature flags for A/B tests. Free up to 1M events/mo. |
| AI (contract scanner) | Anthropic API via Vercel AI SDK | `@anthropic-ai/sdk ^0.30`, `ai ^4.x` | Already the AI vendor for the paid product. Vercel AI SDK gives us streaming + good DX. |
| State management | None (URL search params + RSC) | n/a | Calculator inputs serialize to URL — instant shareable result links + zero hydration cost. |
| Testing | Vitest + Playwright | `^2.x` / `^1.x` | Vitest for calculator math (the only thing that MUST be right). Playwright for one critical-path E2E per tool. |
| Lint/format | Biome | `^1.9` | Faster than ESLint+Prettier, single config, good Next.js support. |
| Package manager | pnpm | `^9.x` | Fast, deterministic, great with monorepo if we ever need it. |
| Node | `22.x` LTS | exact pin in `.nvmrc` | Vercel default. |

**Push-back on the assumed stack:**

- **Use Resend for transactional, Beehiiv for marketing.** Beehiiv's transactional API is rate-limited and not designed for "send this single confirmation email immediately." Resend is $0/mo for our volume and built for it.
- **Skip Prisma.** Supabase RLS + the official JS client is simpler and avoids the schema-drift problems Prisma + Supabase have together.
- **Add Biome.** Saves ~3s on every CI run and zero config hell.

---

## 2. Project structure

```
cfoforcreators/
├── .github/
│   └── workflows/
│       └── ci.yml                          # lint, typecheck, test, build
├── .vscode/
│   └── settings.json                       # biome formatter on save
├── public/
│   ├── favicon.ico
│   ├── og-fallback.png                     # used when dynamic OG fails
│   └── fonts/
│       └── Inter.woff2                     # self-hosted for OG image rendering
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # root layout, fonts, analytics
│   │   ├── page.tsx                        # landing page
│   │   ├── globals.css                     # tailwind directives + CSS vars
│   │   ├── sitemap.ts                      # dynamic sitemap (tools + content + pSEO)
│   │   ├── robots.ts
│   │   ├── manifest.ts                     # PWA manifest (cheap install affordance)
│   │   │
│   │   ├── (tools)/                        # route group, shared tool layout
│   │   │   ├── layout.tsx                  # tool chrome (sticky email CTA, nav)
│   │   │   ├── tax-estimator/
│   │   │   │   ├── page.tsx                # the tool itself
│   │   │   │   ├── opengraph-image.tsx     # static fallback OG
│   │   │   │   └── result/
│   │   │   │       └── [id]/
│   │   │   │           ├── page.tsx        # shareable result page
│   │   │   │           └── opengraph-image.tsx  # dynamic per-result OG
│   │   │   ├── scorp-calculator/...        # same shape
│   │   │   ├── llc-chooser/...
│   │   │   ├── retirement-chooser/...
│   │   │   ├── sponsor-rate/...
│   │   │   └── contract-scanner/...
│   │   │
│   │   ├── (content)/                      # explainer / SEO content
│   │   │   ├── layout.tsx                  # article chrome (TOC, share, related)
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx                # /learn — content index
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx            # /learn/should-you-switch-to-scorp
│   │   │   └── states/                     # programmatic SEO scaffold
│   │   │       └── [state]/
│   │   │           └── [topic]/
│   │   │               └── page.tsx        # /states/california/scorp-rules
│   │   │
│   │   ├── api/
│   │   │   ├── waitlist/
│   │   │   │   └── route.ts                # POST email → Supabase + Beehiiv
│   │   │   ├── deepdive/
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts            # Tally webhook → Supabase + Resend + Beehiiv tag
│   │   │   ├── sponsor-rate/
│   │   │   │   └── submissions/
│   │   │   │       └── route.ts            # POST creator-submitted rates
│   │   │   ├── tools/
│   │   │   │   ├── tax-estimator/
│   │   │   │   │   ├── route.ts            # POST inputs → save result, return id
│   │   │   │   │   └── follow-up/
│   │   │   │   │       └── route.ts        # NEW — Anthropic streaming, follow-up chat (3 msgs cap)
│   │   │   │   └── ... (one per tool, each with /follow-up/ subroute)
│   │   │   ├── contract-scan/
│   │   │   │   └── route.ts                # streams Anthropic response
│   │   │   └── og/
│   │   │       └── [tool]/
│   │   │           └── route.tsx           # dynamic OG generator (fallback path)
│   │   │
│   │   └── admin/
│   │       └── page.tsx                    # password-gated stats dashboard (basic)
│   │
│   ├── components/
│   │   ├── ui/                             # shadcn primitives (button, input, card, etc.)
│   │   ├── tool/                           # the 7-section template (see §4)
│   │   │   ├── ToolPage.tsx                # orchestrator
│   │   │   ├── ToolHero.tsx
│   │   │   ├── ToolForm.tsx                # wraps react-hook-form + zod
│   │   │   ├── ToolResult.tsx              # screenshot-friendly result card; verdict prominent above number
│   │   │   ├── ToolExplainer.tsx           # excerpt from MDX content
│   │   │   ├── ToolFollowupChat.tsx        # NEW — Anthropic-powered follow-up chat (3 msgs free)
│   │   │   ├── ToolEmailGate.tsx           # depth-gated personalization
│   │   │   ├── ToolShareBlock.tsx          # twitter/copy/native share
│   │   │   └── ToolCrossPromo.tsx          # other tools + waitlist CTA
│   │   ├── waitlist/
│   │   │   ├── WaitlistForm.tsx
│   │   │   ├── SpotsCounter.tsx            # the "73 of 100 remaining"
│   │   │   └── StickyEmailBar.tsx          # mobile sticky bottom bar
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── ProblemBlock.tsx
│   │   │   ├── WhatItDoes.tsx
│   │   │   ├── OfferStack.tsx
│   │   │   ├── FounderNote.tsx
│   │   │   └── FAQ.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Markdown.tsx                # styled MDX renderer
│   │
│   ├── tools/                              # per-tool config + math, ONE FILE PER TOOL
│   │   ├── _types.ts                       # ToolDefinition interface (see §4)
│   │   ├── tax-estimator.ts
│   │   ├── scorp-calculator.ts
│   │   ├── llc-chooser.ts
│   │   ├── retirement-chooser.ts
│   │   ├── sponsor-rate.ts
│   │   └── contract-scanner.ts             # exception: AI-driven, different shape
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                   # browser client
│   │   │   ├── server.ts                   # server client (RSC)
│   │   │   └── admin.ts                    # service role (API routes only)
│   │   ├── beehiiv.ts                      # Beehiiv API wrapper
│   │   ├── resend.ts                       # transactional email wrapper
│   │   ├── posthog.ts                      # event helpers + funnel constants
│   │   ├── tax/
│   │   │   ├── federal.ts                  # federal brackets, SE tax math
│   │   │   ├── states.ts                   # state-by-state tax data
│   │   │   └── quarters.ts                 # quarterly deadline logic
│   │   ├── seo/
│   │   │   ├── structured-data.ts          # JSON-LD generators
│   │   │   └── metadata.ts                 # per-page metadata helpers
│   │   ├── og/
│   │   │   └── templates.tsx               # shared OG image components
│   │   ├── prompts/
│   │   │   └── ai-cfo.ts                   # NEW — AI CFO system prompt (drop in from ai_cfo_system_prompt.md)
│   │   ├── ratelimit.ts                    # NEW — IP-based rate limiter (used by follow-up chat + contract scanner)
│   │   └── utils.ts                        # cn(), formatCurrency(), etc.
│   │
│   ├── content/                            # MDX explainer content
│   │   ├── learn/
│   │   │   ├── should-you-switch-to-scorp.mdx
│   │   │   ├── how-quarterly-taxes-actually-work.mdx
│   │   │   ├── llc-for-creators.mdx
│   │   │   ├── retirement-accounts-for-creators.mdx
│   │   │   └── _registry.ts                # title, slug, excerpt, related tool, og image
│   │   └── states/
│   │       └── _data.ts                    # state-specific data for pSEO
│   │
│   └── data/
│       ├── states.ts                       # 50-state dropdown source of truth
│       └── niche_salary_benchmarks.ts      # NEW — niche × hours × audience size lookup for "reasonable salary"
│
├── tests/
│   ├── unit/
│   │   ├── tax-estimator.test.ts
│   │   ├── scorp-calculator.test.ts
│   │   └── ...
│   └── e2e/
│       ├── waitlist-signup.spec.ts
│       ├── tax-estimator-flow.spec.ts
│       └── share-result.spec.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 00001_init.sql
│   │   ├── 00002_waitlist.sql
│   │   ├── 00003_tool_results.sql
│   │   └── 00004_sponsor_rates.sql
│   └── seed.sql
│
├── scripts/
│   ├── generate-state-pages.ts             # build pSEO content from data/states
│   ├── sync-spots-counter.ts               # cron-style helper
│   └── export-emails-to-beehiiv.ts         # one-off backfill
│
├── CLAUDE.md                               # see §15
├── .claude/
│   ├── commands/
│   │   ├── new-tool.md                     # /new-tool slash command
│   │   ├── new-content.md
│   │   └── add-state-data.md
│   └── settings.json
├── biome.json
├── tailwind.config.ts                      # see §9
├── next.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── .env.example
└── README.md
```

**Why route groups (`(tools)`, `(content)`):** they share a layout (sticky email bar, breadcrumbs) without polluting the URL. `/tax-estimator` not `/tools/tax-estimator` — cleaner for SEO and shareability.

**Why `src/tools/*.ts` lives separately from `src/components/tool/`:** the math and config (per-tool) is decoupled from the rendering (shared). Adding a new tool = one new file in `src/tools/` + one route file. See §4.

---

## 3. Database schema (Supabase)

Five tables. Keep it boring. No premature normalization.

### `waitlist`
```sql
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  source text,                    -- 'landing' | 'tax-estimator' | 'scorp' | 'contract-scanner' | etc.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  user_agent text,
  ip_country text,                -- from Vercel geo header, not stored as PII
  beehiiv_subscriber_id text,     -- returned from Beehiiv API
  beehiiv_synced_at timestamptz,
  created_at timestamptz default now()
);
create index waitlist_created_at_idx on waitlist(created_at desc);
create index waitlist_source_idx on waitlist(source);
```

### `deepdive_intakes`
```sql
create table deepdive_intakes (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid references waitlist(id),
  email text not null,
  first_name text,
  -- intake form fields (mirrors founder_deepdive_intake_form.md)
  platform text,
  niche text,
  follower_tier text,
  experience_tier text,
  income_tier text not null,                   -- the qualifying field
  income_sources text[],
  state text,
  legal_setup text,
  has_accountant text,
  pays_quarterly text,
  question_1 text,
  question_2 text,
  question_3 text,
  other_context text,
  delivery_preference text,
  case_study_permission text,
  status text default 'new',                   -- new | recording | sent | replied | closed
  loom_url text,
  founder_notes text,
  sent_at timestamptz,
  created_at timestamptz default now()
);
create index deepdive_status_idx on deepdive_intakes(status);
create index deepdive_created_at_idx on deepdive_intakes(created_at desc);

-- the spots-remaining counter is just:
--   select 100 - count(*) from deepdive_intakes
--     where income_tier != 'under_1k';   -- the disqualified ones don't burn a spot
```

### `tool_results`
Stores each calculation so it has a shareable URL. The result page renders from this row server-side.

```sql
create table tool_results (
  id text primary key,                          -- nanoid(10), shareable URL slug
  tool_slug text not null,                      -- 'tax-estimator', 'scorp-calculator', etc.
  inputs jsonb not null,                        -- raw form inputs
  outputs jsonb not null,                       -- computed result snapshot
  email text,                                   -- captured if user opted in for personalization
  share_count int default 0,                    -- incremented on share-event
  view_count int default 0,
  created_at timestamptz default now()
);
create index tool_results_tool_idx on tool_results(tool_slug, created_at desc);
```

We snapshot the output so result URLs stay stable forever — even if we update the calculator math later. Shared tweets keep working.

### `sponsor_rate_submissions`
Cold-start data collection for the sponsor rate calculator.

```sql
create table sponsor_rate_submissions (
  id uuid primary key default gen_random_uuid(),
  email text,
  niche text not null,
  platform text not null,                       -- youtube_long, shorts, tiktok, twitch, etc.
  view_count_tier text not null,                -- 0-10k, 10-50k, 50-200k, 200k-1m, 1m+
  deliverable_type text not null,               -- dedicated, integration, mention, etc.
  rate_usd_low int,
  rate_usd_high int,
  notes text,
  approved_for_display boolean default false,   -- moderator flag
  created_at timestamptz default now()
);
create index sponsor_submissions_lookup_idx
  on sponsor_rate_submissions(niche, platform, view_count_tier)
  where approved_for_display = true;
```

### `events` (lightweight server-side mirror)
PostHog handles primary analytics. We keep a thin server-side mirror for things we want to query in SQL (e.g., the spots counter, conversion ratios for the admin page).

```sql
create table events (
  id bigserial primary key,
  event text not null,
  properties jsonb,
  email text,
  session_id text,
  created_at timestamptz default now()
);
create index events_event_created_idx on events(event, created_at desc);
```

### Row Level Security
- `waitlist`, `deepdive_intakes`, `tool_results`, `sponsor_rate_submissions`: RLS enabled, NO public select policy. All reads/writes go through API routes using the service role key.
- `tool_results` has one exception: a public RLS policy `select using (true)` because shared result URLs need anonymous read.

```sql
alter table tool_results enable row level security;
create policy tool_results_public_read on tool_results for select using (true);
```

---

## 4. Tool template architecture

The single most important architectural decision in this plan. Get this right and adding tool #7 takes one afternoon. Get it wrong and every tool becomes a fork.

### The contract: `ToolDefinition`

Every tool exports one default object that describes everything about it:

```ts
// src/tools/_types.ts
import { z } from "zod";
import type { ReactNode } from "react";

export interface ToolDefinition<
  Inputs extends z.ZodTypeAny,
  Outputs
> {
  // routing & metadata
  slug: string;                              // "tax-estimator"
  title: string;                             // "Quarterly Tax Estimator"
  oneLiner: string;                          // hero subhead
  metaTitle: string;                         // SEO title
  metaDescription: string;
  priority: number;                          // for cross-promo ordering

  // form schema (drives both form rendering and server validation)
  inputs: Inputs;
  inputFields: FieldConfig[];                // labels, helptext, field type

  // pure calculator function (testable in isolation)
  compute: (input: z.infer<Inputs>) => Outputs;

  // result rendering
  renderResult: (output: Outputs, input: z.infer<Inputs>) => ResultDisplay;

  // explainer content (excerpt from companion MDX)
  explainerSlug: string;                     // links to /learn/[slug]
  explainerExcerpt: string;                  // shown inline under the result

  // share copy
  buildShareText: (output: Outputs) => string;  // pre-filled tweet text

  // OG image config
  ogTemplate: "result-headline" | "result-comparison" | "result-recommendation";

  // related tools (cross-promo)
  relatedTools: string[];                    // slugs
}

export interface FieldConfig {
  name: string;
  label: string;
  helpText?: string;                         // plain-language explainer for finance term
  type: "currency" | "number" | "select" | "state" | "radio" | "textarea";
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: unknown;
}

export interface ResultDisplay {
  // REQUIRED VERDICT — every tool must take a position. This is the brand-defining moment.
  // Forces "honest don't do this" outputs to be code-enforced, not just hoped for.
  // Renders prominently ABOVE the headline number.
  verdict: "yes" | "no" | "wait";
  verdictHeadline: string;                   // "Don't switch to S-corp yet" / "Form the LLC" / "Wait until you cross $80k profit"
  verdictReason: string;                     // 1 plain-language sentence. e.g., "At your $48k profit, $1,800/year of payroll + filing fees would eat all the savings."

  // Calculation display (always shown below the verdict)
  headline: string;                          // "$12,400 to send the IRS by April 15"
  headlineNumber?: string;                   // "$12,400" — used by OG image
  subline?: string;                          // "Based on $80k profit, single filer, CA"
  breakdown?: { label: string; value: string; }[];
  recommendation?: string;                   // optional plain-language nudge
  caveat?: string;                           // ONE caveat, not five
}
```

### Example tool definition

```ts
// src/tools/tax-estimator.ts
import { z } from "zod";
import type { ToolDefinition } from "./_types";
import { computeQuarterlyTax } from "@/lib/tax/federal";
import { US_STATES } from "@/data/states";

const inputs = z.object({
  ytd_income: z.number().min(0).max(10_000_000),
  ytd_expenses: z.number().min(0).max(10_000_000),
  state: z.enum(US_STATES.map(s => s.code) as [string, ...string[]]),
  filing_status: z.enum(["single", "married_joint", "head_of_household"]),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
});

type Outputs = ReturnType<typeof computeQuarterlyTax>;

export default {
  slug: "tax-estimator",
  title: "Quarterly Tax Estimator for Creators",
  oneLiner: "How much to send the IRS this quarter — based on your real numbers.",
  metaTitle: "Quarterly Tax Estimator for YouTubers, Streamers & Creators",
  metaDescription: "Free tool. Plug in your creator income and expenses. Get the exact amount to send the IRS this quarter, including state tax. No signup needed.",
  priority: 1,
  inputs,
  inputFields: [
    { name: "ytd_income", label: "Money you've earned this year", helpText: "Add up everything from AdSense, sponsors, Patreon, Twitch, affiliate, merch — gross, before any fees.", type: "currency", placeholder: "$45,000" },
    { name: "ytd_expenses", label: "Business expenses this year", helpText: "Camera, software, subscriptions, contractor pay, home-office portion of rent — anything you spent that's a write-off.", type: "currency", placeholder: "$8,000" },
    { name: "state", label: "What state do you live in?", type: "state" },
    { name: "filing_status", label: "How will you file?", type: "radio", options: [
      { value: "single", label: "Single" },
      { value: "married_joint", label: "Married, filing together" },
      { value: "head_of_household", label: "Head of household" },
    ]},
    { name: "quarter", label: "Which quarter is this?", type: "radio", options: [
      { value: "Q1", label: "Q1 (due April 15)" },
      { value: "Q2", label: "Q2 (due June 15)" },
      { value: "Q3", label: "Q3 (due Sept 15)" },
      { value: "Q4", label: "Q4 (due Jan 15)" },
    ]},
  ],
  compute: computeQuarterlyTax,
  renderResult: (out, input) => ({
    verdict: out.amountThisQuarter > 0 ? "yes" : "wait",
    verdictHeadline: out.amountThisQuarter > 0
      ? `Send $${out.amountThisQuarter.toLocaleString()} to the IRS by ${out.dueDate}`
      : `You're underearning the threshold — no quarterly payment needed yet`,
    verdictReason: out.amountThisQuarter > 0
      ? `You owe quarterly because your projected tax for the year is over $1,000. Skip this and you'll owe a penalty in April.`
      : `At your current income/expense ratio you won't owe enough this year to need quarterly payments. Re-run this if you have a big revenue month.`,
    headline: `$${out.amountThisQuarter.toLocaleString()} to send the IRS`,
    headlineNumber: `$${out.amountThisQuarter.toLocaleString()}`,
    subline: `Due ${out.dueDate}. State tax: $${out.stateTax.toLocaleString()}.`,
    breakdown: [
      { label: "Federal income tax (your share this quarter)", value: `$${out.fedIncome.toLocaleString()}` },
      { label: "Self-employment tax (the extra 15.3%)", value: `$${out.seTax.toLocaleString()}` },
      { label: `State tax (${out.stateName})`, value: `$${out.stateTax.toLocaleString()}` },
    ],
    recommendation: out.recommendation,   // e.g., "Set up auto-transfer to a 'taxes' savings account every time AdSense hits."
    caveat: "This assumes your income holds up like the rest of the year. If it dips, you owe less; if it spikes, more.",
  }),
  explainerSlug: "how-quarterly-taxes-actually-work",
  explainerExcerpt: "Self-employment tax is the part most creators get blindsided by — it's an extra 15.3% on top of regular income tax...",
  buildShareText: (out) => `just figured out i owe $${out.amountThisQuarter.toLocaleString()} in quarterly taxes. wish i'd known about this tool 6 months ago →`,
  ogTemplate: "result-headline",
  relatedTools: ["scorp-calculator", "retirement-chooser"],
} satisfies ToolDefinition<typeof inputs, Outputs>;
```

### The page that consumes it

Every tool page is a 4-line file:

```tsx
// src/app/(tools)/tax-estimator/page.tsx
import ToolPage from "@/components/tool/ToolPage";
import tool from "@/tools/tax-estimator";

export const metadata = { title: tool.metaTitle, description: tool.metaDescription };
export default function Page() { return <ToolPage tool={tool} />; }
```

### Result page (shareable)

```tsx
// src/app/(tools)/tax-estimator/result/[id]/page.tsx
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ToolResultView from "@/components/tool/ToolResultView";
import tool from "@/tools/tax-estimator";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `My quarterly tax estimate — ${tool.title}`,
    openGraph: { images: [`/tax-estimator/result/${id}/opengraph-image`] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("*")
    .eq("id", id)
    .eq("tool_slug", tool.slug)
    .single();
  if (!data) notFound();
  return <ToolResultView tool={tool} result={data} />;
}
```

### The 8-section orchestrator

```tsx
// src/components/tool/ToolPage.tsx
"use client";
import type { ToolDefinition } from "@/tools/_types";
import { useState } from "react";
import ToolHero from "./ToolHero";
import ToolForm from "./ToolForm";
import ToolResult from "./ToolResult";
import ToolExplainer from "./ToolExplainer";
import ToolFollowupChat from "./ToolFollowupChat";  // NEW — Anthropic-powered chat block
import ToolEmailGate from "./ToolEmailGate";
import ToolShareBlock from "./ToolShareBlock";
import ToolCrossPromo from "./ToolCrossPromo";

export default function ToolPage<I, O>({ tool }: { tool: ToolDefinition<any, any> }) {
  const [result, setResult] = useState<{ id: string; outputs: O; inputs: I } | null>(null);
  return (
    <article className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-12">
      <ToolHero tool={tool} />                      {/* 1 */}
      <ToolForm tool={tool} onResult={setResult} /> {/* 2 */}
      {result && (
        <>
          <ToolResult tool={tool} result={result} />        {/* 3 — verdict prominently above number */}
          <ToolExplainer slug={tool.explainerSlug}          {/* 4 */}
                         excerpt={tool.explainerExcerpt} />
          <ToolFollowupChat tool={tool} result={result} />  {/* 5 — NEW: ask follow-ups */}
          <ToolEmailGate tool={tool} resultId={result.id} /> {/* 6 */}
          <ToolShareBlock tool={tool} result={result} />    {/* 7 */}
          <ToolCrossPromo currentSlug={tool.slug}           {/* 8 */}
                          related={tool.relatedTools} />
        </>
      )}
    </article>
  );
}
```

### The follow-up chat block (section 5)

Every tool gets a small Anthropic-powered chat box right under the explainer. The user can ask 3 follow-up questions per session. The model receives the user's calculation context (inputs + outputs + verdict) plus the AI CFO system prompt — same voice as the eventual paid product. This is the single biggest differentiator vs Gusto/Keeper/Bizee — they ship pure forms; we ship forms + a real conversation.

```tsx
// src/components/tool/ToolFollowupChat.tsx
"use client";
import { useChat } from "ai/react";

export default function ToolFollowupChat({ tool, result }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/tools/${tool.slug}/follow-up`,
    body: {
      // server hydrates the system prompt with this context
      toolSlug: tool.slug,
      inputs: result.inputs,
      outputs: result.outputs,
      verdict: result.outputs.verdict,
    },
    onFinish: () => trackEvent("tool_followup_message_sent", { slug: tool.slug }),
  });

  const remaining = 3 - messages.filter(m => m.role === "user").length;

  return (
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Got a follow-up?</h2>
        <p className="text-sm text-muted-foreground">
          Ask me anything about your result. {remaining > 0 ? `${remaining} questions left.` : "Join the waitlist for unlimited."}
        </p>
      </header>

      {messages.map(m => (
        <div key={m.id} className={m.role === "user" ? "ml-auto bg-primary/10 ..." : "bg-muted ..."}>
          {m.content}
        </div>
      ))}

      {remaining > 0 ? (
        <form onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="e.g., what if my income drops next quarter?"
            className="w-full min-h-tap text-base ..." // mobile rules apply
          />
          <button disabled={isLoading} className="min-h-tap mt-2 ...">Send</button>
        </form>
      ) : (
        <a href="#waitlist" className="block text-center btn-primary">Join the waitlist for unlimited</a>
      )}
    </section>
  );
}
```

```ts
// src/app/api/tools/[slug]/follow-up/route.ts
import Anthropic from "@anthropic-ai/sdk";
import { AnthropicStream, StreamingTextResponse } from "ai";
import { rateLimit } from "@/lib/ratelimit";
import { AI_CFO_SYSTEM_PROMPT } from "@/lib/prompts/ai-cfo";
import { getToolBySlug } from "@/tools/_registry";

export const runtime = "edge";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const ok = await rateLimit(`followup:${ip}`, 10, "1h");  // 10/hr per IP
  if (!ok) return new Response("Slow down", { status: 429 });

  const { messages, toolSlug, inputs, outputs, verdict } = await req.json();
  const tool = getToolBySlug(toolSlug);
  if (!tool) return new Response("Unknown tool", { status: 400 });

  // 3-message hard cap per session (counted by client, double-checked here)
  const userMessageCount = messages.filter((m: any) => m.role === "user").length;
  if (userMessageCount > 3) {
    return new Response("Free limit reached. Join the waitlist for unlimited.", { status: 402 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 800,                             // tight — mobile, plain language
    system: `${AI_CFO_SYSTEM_PROMPT}

The user just used the ${tool.title}. Their inputs:
${JSON.stringify(inputs, null, 2)}

Their result:
${JSON.stringify(outputs, null, 2)}

Their verdict: ${verdict}

Answer their follow-up questions in the AI CFO voice (plain language, lead with the answer, one short caveat, name humans for escalations). Stay scoped to their calculation context — don't volunteer unrelated topics. If they ask something this tool can't answer, point to the relevant other tool on CFOforcreators.com.`,
    messages,
  });

  return new StreamingTextResponse(AnthropicStream(stream));
}
```

**Why this design:**
- **Reuses the AI CFO system prompt** — voice consistency across free tools and the eventual paid product.
- **Inputs + outputs hydrated server-side** — model can give specific advice without the user re-typing context.
- **3-message limit per session** — caps cost (~$0.01-0.05 per session), creates clear upgrade hook ("unlimited with the waitlist").
- **Edge runtime + streaming** — feels instant, scales cheaply.
- **Rate limited per IP** — 10/hr per IP prevents abuse; cost stays predictable.

**Cost estimate:** at 1k monthly tool result views and ~30% of users sending at least one follow-up message averaging 2 messages each, that's ~600 messages/month × ~$0.015/message ≈ **$9/mo**. At 10k monthly views, ~$90/mo. Well within budget.

### Why this design wins

- **Adding a tool = writing one file.** The math, the form schema, the OG copy — all colocated.
- **Calculators are pure functions.** `compute()` is testable without React. Vitest hits it directly.
- **Same `zod` schema validates client + server.** No drift.
- **OG images are data-driven.** The OG route reads the same `tool.renderResult()` output.
- **Result URLs are first-class.** The shareable URL pattern exists from day 1, not bolted on later.

### The contract scanner exception

The contract scanner doesn't fit this template (no compute function — it's an Anthropic stream). It uses a different page component (`ContractScannerPage.tsx`) but lives in the same route group and reuses `ToolHero`, `ToolEmailGate`, `ToolShareBlock`, `ToolCrossPromo`. Don't try to force it into the template.

---

## 5. API / serverless function design

### Server-side vs client-side decision matrix

| Behavior | Where it runs | Why |
|---|---|---|
| Calculator math (`compute()`) | **Client** by default, **server** for the result-page snapshot | Instant feedback, no roundtrip. Server runs the same function once on submit to write the canonical snapshot. |
| Form submission → save result + return shareable id | **Server** (`/api/tools/[tool]/route.ts`) | Need to write to DB, return a stable id. |
| Waitlist signup | **Server** (`/api/waitlist/route.ts`) | Need server keys for Beehiiv + Supabase service role. |
| Tally webhook (deep-dive intake) | **Server** (`/api/deepdive/webhook/route.ts`) | Webhook verification + DB write + Resend email + Beehiiv tag. |
| Contract scanner (Anthropic streaming) | **Server** (Edge runtime, `/api/contract-scan/route.ts`) | Anthropic key must stay server-side; streaming response. |
| Spots counter render | **Server** (RSC, ISR `revalidate: 60`) | Single SQL count, cached for 60s. Don't hit DB per visitor. |
| Sponsor rate lookup | **Server** (RSC) | DB query, cached per input combination. |
| Dynamic OG image | **Edge runtime** (`opengraph-image.tsx`) | `@vercel/og` only runs on edge, fast image gen. |
| PostHog event tracking | **Client** (with server-side mirror for critical events) | Client-side captures full UX context. |

### Standard API route shape

```ts
// src/app/api/tools/tax-estimator/route.ts
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackServerEvent } from "@/lib/posthog";
import tool from "@/tools/tax-estimator";

export const runtime = "nodejs";       // not edge — supabase-js + crypto
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = tool.inputs.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }

  const outputs = tool.compute(parsed.data);
  const id = nanoid(10);

  await supabaseAdmin.from("tool_results").insert({
    id, tool_slug: tool.slug, inputs: parsed.data, outputs,
  });

  await trackServerEvent("tool.result_computed", {
    tool: tool.slug, result_id: id,
  });

  return NextResponse.json({ id, outputs });
}
```

Every tool API route is structurally identical — the only differences are the import line and the `tool` constant. Worth a `/new-tool` slash command (see §15).

### Rate limiting

Use Vercel KV + a simple sliding window. 30 calculations/minute per IP is plenty.

```ts
// src/lib/rate-limit.ts — wraps each public POST route
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
export const calcLimiter = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
});
```

The contract scanner gets stricter limits (5/hour per IP) because Anthropic costs money.

---

## 6. Email service integration

### Two services, clear lanes

| Concern | Service | Why |
|---|---|---|
| Marketing newsletter (weekly) | Beehiiv | Best newsletter editor, native referral, free up to 2,500 |
| Tax-deadline reminder sequences | Beehiiv (Automations) | Date-triggered audience automations |
| Welcome sequence after waitlist | Beehiiv (Automations) | Tag-triggered audience automations |
| Founder deep-dive auto-confirmation (transactional) | **Resend** | Beehiiv transactional API not great; Resend is simple + cheap |
| Founder admin notification (new intake) | Resend | Same |
| Tool-result delivery emails | Resend | Per-event transactional |

### Beehiiv subscriber tagging strategy

Every signup carries tags that drive automation routing. Tags are flat — Beehiiv doesn't do nested.

| Tag | Set when |
|---|---|
| `source:landing` | Joined from main landing page hero |
| `source:tool:tax-estimator` | Joined from the tax estimator email gate |
| `source:tool:scorp-calculator` | etc. |
| `state:CA`, `state:TX`, ... | Set when state is known (from tool inputs) |
| `tier:t1` ... `tier:t5` | Set from deep-dive intake income tier |
| `deepdive:requested` | Submitted intake form |
| `deepdive:disqualified` | Income < $1k, redirect path |
| `cohort:founding-100` | One of the 100 deep-dive spots |

### Beehiiv API wrapper

```ts
// src/lib/beehiiv.ts
const BASE = "https://api.beehiiv.com/v2";
const PUB = process.env.BEEHIIV_PUBLICATION_ID!;
const KEY = process.env.BEEHIIV_API_KEY!;

export async function subscribe(input: {
  email: string;
  firstName?: string;
  source: string;        // becomes utm_source on Beehiiv side
  tags: string[];
}) {
  const res = await fetch(`${BASE}/publications/${PUB}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: input.source,
      custom_fields: input.firstName ? [{ name: "first_name", value: input.firstName }] : [],
    }),
  });
  if (!res.ok) throw new Error(`beehiiv_subscribe_failed: ${res.status}`);
  const { data } = await res.json();
  // tag in second call (Beehiiv doesn't accept tags in initial POST)
  await tag(data.id, input.tags);
  return data.id as string;
}

export async function tag(subscriberId: string, tags: string[]) {
  return fetch(`${BASE}/publications/${PUB}/subscriptions/${subscriberId}/tags`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
  });
}
```

### Automated sequences (configured in Beehiiv UI, not code)

1. **Welcome sequence** — triggered by any new subscriber.
   - Day 0: Welcome + which tools to try first (dynamic by source tag if possible)
   - Day 2: Founder note (the one from landing page section 5)
   - Day 5: First newsletter sample issue
   - Day 9: "What's the #1 financial question on your mind?" — single CTA reply

2. **State-specific tax reminder sequence** — triggered by `state:*` tag.
   - Pre-Q1 (April 1): "Your CA estimated payment is due April 15. Use the calculator if you haven't."
   - Pre-Q2, Pre-Q3, Pre-Q4: same shape
   - Built once per state, cloned and parameterized

3. **Deep-dive disqualified sequence** — triggered by `deepdive:disqualified`.
   - Day 0: "You're early — here's the playbook for under-$1k creators"
   - Day 30: "Cross $3k yet? Come back for a deep-dive."

4. **Weekly newsletter** — manual, every Thursday, 4-min reads.

---

## 7. Dynamic OG image setup

Critical for Reddit/Twitter shareability. Each tool result needs a unique image showing the headline number.

### Three OG templates

All three rendered via `@vercel/og` (JSX → PNG at edge).

| Template | Used by | Layout |
|---|---|---|
| `result-headline` | Tax estimator, retirement | Big number centered, subline underneath, brand mark bottom-right |
| `result-comparison` | S-corp, LLC chooser | Two columns: "without" / "with", arrow between, savings number bottom |
| `result-recommendation` | LLC chooser, sponsor rate | Big "yes" / "no" / "wait" + one-line reason |

### Per-result OG generation

```tsx
// src/app/(tools)/tax-estimator/result/[id]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ResultHeadlineTemplate } from "@/lib/og/templates";

export const runtime = "edge";
export const alt = "Quarterly tax estimate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const { data } = await supabaseAdmin
    .from("tool_results")
    .select("outputs, inputs")
    .eq("id", params.id)
    .single();

  const headline = `$${data!.outputs.amountThisQuarter.toLocaleString()}`;
  const subline = `to send the IRS by ${data!.outputs.dueDate}`;

  return new ImageResponse(
    (<ResultHeadlineTemplate headline={headline}
                              subline={subline}
                              toolName="Quarterly Tax Estimator" />),
    { ...size, fonts: await loadFonts() }
  );
}

async function loadFonts() {
  const inter = await fetch(new URL("../../../../../public/fonts/Inter-Bold.woff2", import.meta.url)).then(r => r.arrayBuffer());
  return [{ name: "Inter", data: inter, style: "normal" as const, weight: 700 as const }];
}
```

### Shared OG template components

```tsx
// src/lib/og/templates.tsx
export function ResultHeadlineTemplate({ headline, subline, toolName }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%",
                  background: "#0F172A", color: "#fff", padding: 64, fontFamily: "Inter" }}>
      <div style={{ fontSize: 28, opacity: 0.7 }}>{toolName}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
                    justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 160, fontWeight: 700, lineHeight: 1 }}>{headline}</div>
        <div style={{ fontSize: 36, opacity: 0.85, marginTop: 24 }}>{subline}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, opacity: 0.6 }}>
        <span>cfoforcreators.com</span>
        <span>free tool</span>
      </div>
    </div>
  );
}
```

### Static fallback OG per tool

Each `(tools)/[tool]/opengraph-image.tsx` renders a static "Try the [tool name]" image — used when sharing the tool page itself (not a result).

---

## 8. SEO foundation

### Sitemap

```ts
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { allTools } from "@/tools/_registry";
import { allContent } from "@/content/learn/_registry";
import { US_STATES } from "@/data/states";
import { PSEO_TOPICS } from "@/content/states/_data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://cfoforcreators.com";
  return [
    { url: base, priority: 1.0, changeFrequency: "weekly" },
    ...allTools.map(t => ({ url: `${base}/${t.slug}`, priority: 0.9, changeFrequency: "monthly" as const })),
    ...allContent.map(c => ({ url: `${base}/learn/${c.slug}`, priority: 0.7, changeFrequency: "monthly" as const })),
    // pSEO: states × topics
    ...US_STATES.flatMap(s => PSEO_TOPICS.map(t =>
      ({ url: `${base}/states/${s.slug}/${t.slug}`, priority: 0.5, changeFrequency: "yearly" as const })
    )),
  ];
}
```

### Structured data per page type

- **Tool pages:** `SoftwareApplication` schema with `applicationCategory: "FinanceApplication"`, `offers: { price: 0 }`
- **Content pages:** `Article` schema with author, datePublished, dateModified
- **Landing:** `Organization` + `WebSite` with `SearchAction`
- **FAQ block:** `FAQPage` schema (every tool has 3-5 FAQs in its content)

```ts
// src/lib/seo/structured-data.ts — generators per type
export function toolSchema(tool: ToolDefinition<any, any>) { ... }
export function articleSchema(content: ContentMeta) { ... }
export function faqSchema(faqs: FAQ[]) { ... }
```

Inject as JSON-LD in the page `<head>` via `<Script type="application/ld+json">`.

### Programmatic SEO foundation

The `[state]/[topic]` route is the scaffold. v1 ships ~250 pages (50 states × 5 topics). The 30k-page goal expands the topic axis later (deduction categories, equipment types, niche-specific guides).

Each page is fully server-rendered from data, no MDX:

```tsx
// src/app/(content)/states/[state]/[topic]/page.tsx
export async function generateStaticParams() {
  return US_STATES.flatMap(s => PSEO_TOPICS.map(t => ({ state: s.slug, topic: t.slug })));
}

export default async function Page({ params }: Props) {
  const { state, topic } = await params;
  const stateData = STATES_DATA[state];
  const topicTemplate = TOPIC_TEMPLATES[topic];
  if (!stateData || !topicTemplate) notFound();
  const content = topicTemplate.render(stateData);    // returns JSX from data
  return <ProgrammaticPage state={stateData} topic={topicTemplate} content={content} />;
}
```

**Anti-thin-content rules:**
- Each pSEO page must have ≥800 words of unique-per-page content (state-specific numbers, links to state filing pages, embedded calculator).
- Each page links to relevant tools and 2-3 related content articles.
- Don't ship pages without real state-specific data.

---

## 9. Mobile-first design system

### Tailwind config

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    screens: {
      // mobile-first: no `sm` for default (mobile)
      sm: "640px",
      md: "768px",
      lg: "1024px",
      // we don't go above lg — tools max-width is 768px anyway
    },
    extend: {
      colors: {
        ink: { DEFAULT: "#0F172A", muted: "#475569" },
        paper: { DEFAULT: "#FFFFFF", soft: "#F8FAFC" },
        brand: { DEFAULT: "#16A34A", dark: "#15803D" },  // green = money, intentional
        warn: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      fontSize: {
        // larger base on mobile (creators read on phones in bed)
        base: ["17px", { lineHeight: "1.6" }],
        result: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "result-lg": ["72px", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
      },
      spacing: {
        // tap targets baseline
        tap: "44px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
} satisfies Config;
```

### Base components — non-negotiable rules

- Buttons: `min-h-tap min-w-tap` always.
- Inputs: `text-base` (prevents iOS Safari zoom on focus), `min-h-tap`.
- Forms: single column, vertical, full-width inputs.
- The result number: `text-result md:text-result-lg`.
- Bottom of every tool page on mobile: sticky email CTA (`StickyEmailBar`).

### Accessibility checklist (every tool must pass)

- [ ] All form inputs have associated `<label>` (not placeholder-only).
- [ ] Help text uses `aria-describedby`, not `title`.
- [ ] Color is never the only signal (recommendations have icons too).
- [ ] Result is announced (`aria-live="polite"` on result region).
- [ ] Tab order matches visual order; no tab traps.
- [ ] Lighthouse mobile score ≥95 / accessibility ≥100.
- [ ] Tested with VoiceOver iOS (founder records a 30s video of every new tool).

---

## 10. Build sequence — week by week

### Week 1 — Foundation + landing page

**Goal:** ship the landing page + waitlist capture. Nothing else.

- Day 1: Init repo (`pnpm create next-app`, Tailwind 4, Biome, `.nvmrc`, `CLAUDE.md`).
- Day 1: Vercel project + custom domain CFOforcreators.com (DNS, SSL).
- Day 2: Supabase project, run migrations 00001 + 00002 (waitlist).
- Day 2: Beehiiv account, publication, API key, get publication ID.
- Day 2: Resend account, verify domain (DKIM, SPF, DMARC).
- Day 3: Build `Header`, `Footer`, `Hero`, `ProblemBlock`, `WhatItDoes`, `OfferStack`, `FounderNote`, `FAQ`. All from `landing_page_copy.md` verbatim.
- Day 3: `WaitlistForm` + `/api/waitlist/route.ts` + `SpotsCounter` (RSC, ISR 60s, queries deepdive_intakes count).
- Day 4: PostHog wired (`PHProvider`, page views, the 6 funnel events from §13).
- Day 4: Tally form built, webhook to `/api/deepdive/webhook/route.ts`, intake → DB + Resend admin email + Beehiiv tag.
- Day 5: SEO basics — `sitemap.ts`, `robots.ts`, `metadata`, `Organization` JSON-LD, fallback OG.
- Day 5: Lighthouse audit, mobile test on real iPhone + Pixel, ship to production.

**End-of-week deliverable:** anyone can land on cfoforcreators.com on their phone, read the offer, give us their email, get on Beehiiv, see the spots counter tick if they fill the Tally form.

### Week 2 — Tax estimator (the universal-pain tool)

- Day 1-2: Build `src/lib/tax/federal.ts` (federal brackets, SE tax, safe-harbor logic) + `states.ts` (50-state tax data — brackets or flat). Unit test `compute()` against ≥30 known scenarios.
- Day 2: Build the tool template (`ToolPage`, `ToolHero`, `ToolForm`, `ToolResult`, `ToolEmailGate`, `ToolShareBlock`, `ToolCrossPromo`).
- Day 3: Wire `src/tools/tax-estimator.ts` + the page route + the `/api/tools/tax-estimator/route.ts` API + `tool_results` migration (00003).
- Day 4: Result page (`/tax-estimator/result/[id]`) + dynamic OG image (`opengraph-image.tsx`) + first OG template (`ResultHeadlineTemplate`).
- Day 4: Companion content page `/learn/how-quarterly-taxes-actually-work.mdx` from research.
- Day 5: E2E test (Playwright): landing → tool → submit → result → share. Lighthouse mobile, ship.

**End-of-week deliverable:** a creator hits `/tax-estimator` on their phone, gets a real number, can share a unique result URL with a custom OG image.

### Week 3 — S-corp calculator (high-emotional-intent)

**This is the most-different-from-competitors tool we'll ship. Generic calculators (Gusto, Keeper, Bizee) ask 3 things: income, expenses, state. We ask creator-specific questions so the result feels like it understands creator businesses, not just "self-employed person #4,718."**

**Required input fields** (`src/tools/scorp-calculator.ts`):

| Field | Type | Why creator-specific |
|---|---|---|
| `primary_platform` | radio | YouTube / TikTok / Twitch / Instagram / Multi-platform / Podcast — drives "reasonable salary" benchmark and audience-suitable language |
| `niche` | radio | Gaming / Beauty / Finance / Lifestyle / Education / Tech / Other — niche affects defensible salary range (finance/B2B niches → higher salary expected by IRS) |
| `audience_size` | radio | <10k / 10–100k / 100k–1M / 1M+ — affects salary defensibility |
| `hours_per_week` | number | Defends the salary number ("you work 25 hrs/wk on the channel" supports a part-time-equivalent salary) |
| `total_creator_income` | currency | Income from ALL creator sources combined (gross) |
| `income_breakdown` | multi-currency | Optional breakdown: AdSense / sponsors / Patreon / affiliate / merch / courses — surfaces income stability signal |
| `business_expenses` | currency | Annual write-offs |
| `state` | state dropdown | CA, NY, NJ, OR, TN, NH have S-corp gotchas the calc must surface |
| `current_entity` | radio | Sole prop / Single-member LLC / S-corp already / Other / Not sure — gates the recommendation logic |
| `years_creating_full_time` | radio | <1 / 1–3 / 3–5 / 5+ — income stability proxy; 5-year S-corp lockout matters more for newer creators |
| `manager_or_agency_cut` | percent | If they have an agent/manager, that affects net income for the salary calculation |

**`src/lib/tax/scorp.ts` must produce a creator-aware verdict, not just a number.**

The verdict logic (drives `ResultDisplay.verdict` and `verdictHeadline`):

```ts
function scorpVerdict(inputs): "yes" | "no" | "wait" {
  const profit = inputs.total_creator_income - inputs.business_expenses - (inputs.manager_or_agency_cut * inputs.total_creator_income);

  // Hard NO cases
  if (profit < 60_000) return "no";
  if (inputs.state === "CA" && profit < 75_000) return "no";  // $800 franchise + 1.5% eats it
  if (inputs.years_creating_full_time === "<1") return "no";  // 5-year lockout, income too unproven
  if (inputs.current_entity === "scorp_already") return "no"; // already there

  // WAIT cases
  if (profit >= 60_000 && profit < 80_000) return "wait";
  if (inputs.years_creating_full_time === "1-3" && profit < 90_000) return "wait";

  // YES
  return "yes";
}

function reasonableSalary(inputs): number {
  // Niche-specific benchmark from src/data/niche_salary_benchmarks.ts
  // e.g., finance/B2B niches: $60-90k; entertainment/lifestyle: $40-70k
  // Adjusted by hours_per_week and audience_size
  // ...
}
```

The verdict reasons must be plain-language and creator-specific. Examples:
- `verdict: "no"` (CA, $65k profit): "California's $800 franchise tax + 1.5% S-corp tax would eat ~$1,775 of your savings, leaving roughly $400/year net — not worth the payroll headache. Re-run this if you cross $80k profit."
- `verdict: "wait"` ($72k profit, 1-3yr full-time): "You're right at the breakeven. The savings are real (~$2,100/year) but you're new enough that locking yourself into S-corp for 5 years is risky. Wait one more strong quarter to confirm income is stable, then switch."
- `verdict: "yes"` ($110k profit, 4yr+, niche=tech): "S-corp would save you ~$5,800/year after running costs. Your income is stable enough to commit. File the election by March 15."

**Build sequence:**
- Day 1: `src/data/niche_salary_benchmarks.ts` — niche × hours × audience size lookup table for "reasonable salary." Source citations in comments. (~50 rows.)
- Day 1-2: `src/lib/tax/scorp.ts` — verdict logic, breakeven, "reasonable salary" output, payroll cost model, state-specific gotchas (CA $800 franchise + 1.5%, NYC GCT, TN/NH no income tax, etc.). Unit tests for ALL verdict paths (must hit "yes," "no," "wait" with creator-specific contexts).
- Day 2: New OG template `ResultComparisonTemplate` (without S-corp / with S-corp / savings). Verdict shows above the savings number.
- Day 3: `src/tools/scorp-calculator.ts` + page + result + OG. The 11 input fields above. Result hydrates the follow-up chat block with full creator context.
- Day 4: `/learn/should-you-switch-to-scorp.mdx` from `content_scorp_explainer.md`.
- Day 5: E2E test (must verify each verdict path renders the right verdictHeadline), ship. Begin posting to r/PartneredYoutube + r/CreatorEconomy with the calculator and a direct value reveal (no email gate before result).

### Week 4 — LLC chooser + retirement chooser (parallel)

Two tools at once because the template makes it cheap. Two parallel Claude Code agents (see §15).

- Days 1-3, agent A: LLC chooser. New `ResultRecommendationTemplate` OG. State-specific LLC formation costs in `src/data/states.ts`.
- Days 1-3, agent B: Retirement chooser. Solo 401k vs SEP IRA vs Roth IRA logic. Projection chart (recharts).
- Day 4: Cross-link all 4 tools (cross-promo block). Update sitemap.
- Day 5: pSEO scaffold built — 50 state pages × 1 topic ("scorp-rules"). Real data per state (sourced from state revenue dept). Ship.

### Week 5 — Sponsor rate calculator + cold-start data

- Day 1: Build the rate-submission form (separate from the calculator).
- Day 2: Calculator UI — when user queries (niche × platform × view tier), pull median rate from `sponsor_rate_submissions` + cite Karat 2024 pricing guide as fallback. Always cite source explicitly per system prompt rule.
- Day 3: Moderator admin view (password-gated `/admin`) to approve submissions.
- Day 4: pSEO axis 2 — niche pages (`/sponsor-rates/[niche]`).
- Day 5: Push hard for submissions on Reddit + Twitter. Ship.

### Week 6 — Brand contract scanner

- Day 1: `/contract-scanner` page UI. Big textarea + "scan" button + side panel for flags.
- Day 2: `/api/contract-scan/route.ts` (Edge runtime, Vercel AI SDK, Anthropic Claude Sonnet 4.5). Streaming response. Strict system prompt: flag clauses, don't give legal opinions, name "a lawyer" not "a professional."
- Day 3: Rate limiting (5 scans/hour/IP), abuse prevention (max 50k chars input).
- Day 4: Result formatting — clear "risky / fine / unusual" categorization. Email gate for "save this scan."
- Day 5: Companion content `/learn/how-to-read-a-brand-contract.mdx`. Ship.

### After week 6 — operating mode

- **Weekly:** Thursday newsletter, 1 new MDX content piece, Reddit/Twitter posts of best creator results.
- **Monthly:** Lighthouse audit, PostHog funnel review, prune Beehiiv unengaged.
- **Continuous:** more pSEO pages (the long tail), ratings/reviews on tools, state-data updates.

---

## 11. Testing approach

### What to test

| Test type | Coverage target | Tool | Why |
|---|---|---|---|
| Unit — calculator math | 100% of `compute()` functions | Vitest | This is the only thing where wrong = lawsuit risk |
| Unit — tax data integrity | 100% of states have required fields | Vitest | One bad state breaks the world |
| Integration — API routes | Happy path + 400 + rate limit | Vitest + msw | Catch regressions in the contract |
| E2E — critical paths | 1 per tool: load → submit → result → share | Playwright | Mobile Safari quirks |
| Visual regression | OG images per tool template | Playwright screenshot diff | OG images break silently otherwise |
| Lighthouse | Mobile ≥95, A11y ≥100 | `@lhci/cli` in CI | Mobile-first is the strategy |

### What to skip (at this stage)

- Component snapshot tests — churn outweighs value.
- Beehiiv/Resend integration tests — mock at the boundary, integration-test manually.
- Cross-browser beyond Chromium + WebKit on Playwright.
- Load testing — Vercel + Supabase scale fine for our traffic profile.

### Calculator test pattern

```ts
// tests/unit/tax-estimator.test.ts
import { describe, expect, it } from "vitest";
import { computeQuarterlyTax } from "@/lib/tax/federal";

describe("computeQuarterlyTax", () => {
  it.each([
    // [income, expenses, state, status, quarter, expectedFedQ, expectedSE, expectedState]
    [80_000, 8_000, "CA", "single", "Q1", /* ... known-good values from a CPA review */],
    [150_000, 20_000, "TX", "married_joint", "Q3", /* ... */],
    [40_000, 5_000, "NY", "single", "Q1", /* ... */],
    // ≥30 cases covering edge cases: zero income, huge income, every filing status, no-income-tax states
  ])("scenario %#", (income, expenses, state, status, quarter, fed, se, st) => {
    const r = computeQuarterlyTax({
      ytd_income: income, ytd_expenses: expenses, state, filing_status: status, quarter
    });
    expect(r.fedIncome).toBeCloseTo(fed, -1);     // within $10
    expect(r.seTax).toBeCloseTo(se, -1);
    expect(r.stateTax).toBeCloseTo(st, -1);
  });
});
```

The test cases come from running the same scenarios through TurboTax / a CPA's worksheet first. **Don't ship a calculator without ≥30 verified cases.**

---

## 12. Deployment + CI/CD

### Branching strategy

- `main` — production (auto-deploys to cfoforcreators.com)
- Feature branches off `main` — every PR auto-deploys a preview URL via Vercel
- No `develop` branch — adds friction at this stage

### CI pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI
on: [pull_request, push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome check .
      - run: pnpm tsc --noEmit
      - run: pnpm vitest run --coverage
      - run: pnpm build
  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium webkit
      - run: pnpm playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }
```

### Environment variables

| Var | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | All envs | https://cfoforcreators.com (or preview URL) |
| `NEXT_PUBLIC_POSTHOG_KEY` | All envs | Public, safe to expose |
| `SUPABASE_URL` | All envs | Public via `NEXT_PUBLIC_*` mirror |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | NEVER expose |
| `BEEHIIV_PUBLICATION_ID` | Server only | |
| `BEEHIIV_API_KEY` | Server only | |
| `RESEND_API_KEY` | Server only | |
| `ANTHROPIC_API_KEY` | Server only | Contract scanner only |
| `TALLY_WEBHOOK_SECRET` | Server only | Verify webhook signatures |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Server only | Vercel KV for rate limiting |
| `ADMIN_PASSWORD` | Server only | Basic auth for `/admin` |
| `FOUNDER_EMAIL` | Server only | Where deep-dive notifications go |

Keep `.env.example` synced. Use Vercel's env var groups: `production`, `preview`, `development`.

### Deploy checks

Vercel runs the build. Add a deploy hook that runs Lighthouse against preview URLs and posts the score to the PR. Block merge if mobile score < 90 or A11y < 95.

---

## 13. Analytics events

Every event below is tracked in PostHog client-side AND mirrored to Supabase `events` table for SQL access. Funnel = ordered list of events.

### Event taxonomy

```ts
// src/lib/posthog.ts — single source of truth
export const Events = {
  // landing funnel
  PAGE_VIEW: "page.viewed",
  HERO_CTA_CLICK: "landing.hero_cta_clicked",
  WAITLIST_SUBMIT: "waitlist.submitted",
  WAITLIST_SUCCESS: "waitlist.success",
  WAITLIST_ERROR: "waitlist.error",

  // deep-dive funnel
  DEEPDIVE_CLICK: "deepdive.cta_clicked",       // user clicks "claim spot"
  DEEPDIVE_FORM_VIEW: "deepdive.form_viewed",   // Tally form loaded
  DEEPDIVE_SUBMIT: "deepdive.submitted",        // via Tally webhook → server-side
  DEEPDIVE_DISQUALIFIED: "deepdive.disqualified",

  // tool funnel (parameterized by tool slug)
  TOOL_VIEW: "tool.viewed",
  TOOL_FORM_START: "tool.form_started",         // first input change
  TOOL_FORM_SUBMIT: "tool.form_submitted",
  TOOL_RESULT_COMPUTED: "tool.result_computed",
  TOOL_EMAIL_GATE_VIEW: "tool.email_gate_viewed",
  TOOL_EMAIL_GATE_SUBMIT: "tool.email_gate_submitted",
  TOOL_SHARE_TWITTER: "tool.share.twitter",
  TOOL_SHARE_COPY: "tool.share.copy_link",
  TOOL_SHARE_NATIVE: "tool.share.native",
  TOOL_CROSS_PROMO_CLICK: "tool.cross_promo_clicked",

  // result page (inbound from share)
  SHARED_RESULT_VIEW: "shared_result.viewed",
  SHARED_RESULT_TRY_OWN: "shared_result.try_own_clicked",

  // contract scanner
  CONTRACT_SCAN_START: "contract.scan_started",
  CONTRACT_SCAN_COMPLETE: "contract.scan_completed",
  CONTRACT_SCAN_RATE_LIMITED: "contract.scan_rate_limited",
} as const;
```

### Funnels to set up in PostHog from day 1

1. **Waitlist:** `PAGE_VIEW` (landing) → `HERO_CTA_CLICK` → `WAITLIST_SUBMIT` → `WAITLIST_SUCCESS`
2. **Deep-dive:** `WAITLIST_SUCCESS` → `DEEPDIVE_CLICK` → `DEEPDIVE_FORM_VIEW` → `DEEPDIVE_SUBMIT`
3. **Tool conversion:** `TOOL_VIEW` → `TOOL_FORM_START` → `TOOL_FORM_SUBMIT` → `TOOL_RESULT_COMPUTED` → `TOOL_EMAIL_GATE_SUBMIT`
4. **Viral loop:** `SHARED_RESULT_VIEW` → `SHARED_RESULT_TRY_OWN` → `TOOL_RESULT_COMPUTED` → `TOOL_SHARE_*`
5. **Cross-tool:** `TOOL_RESULT_COMPUTED` (tool A) → `TOOL_CROSS_PROMO_CLICK` → `TOOL_VIEW` (tool B)

### Properties on every event

`{ session_id, source, utm_*, device, viewport, tool_slug? }` — sets up cohort analysis later.

---

## 14. Cost estimates

Assumptions: traffic mix is 70% mobile, 30% desktop. Most users hit 1 tool, ~10% hit 2+. Contract scanner usage is ~5% of total tool users.

| Service | 100 MAU | 1,000 MAU | 10,000 MAU |
|---|---|---|---|
| Vercel (Hobby → Pro) | $0 | $20 | $20 (+ ~$15 bandwidth) |
| Supabase (Free → Pro) | $0 | $0 | $25 |
| Vercel KV (rate limit) | $0 | $0 | $0–10 |
| Beehiiv (Launch tier free → Scale $39 at 1k) | $0 | $39 | $99 |
| Resend (3k free → $20 at 50k) | $0 | $0 | $20 |
| PostHog (1M events free → ~$0 at 10M) | $0 | $0 | $0–25 |
| Anthropic API (Sonnet 4.5, contract scanner) | ~$2 | ~$20 | ~$200 |
| Anthropic API (Sonnet 4.5, follow-up chat on every tool) | ~$1 | ~$10 | ~$100 |
| Tally (Free → Pro) | $0 | $0 | $29 (only for advanced features we may not need) |
| Domain | $12/yr | $12/yr | $12/yr |
| **Monthly total** | **~$3** | **~$90** | **~$490** |

Notes:
- Beehiiv charges by subscriber count, not MAU. If MAU = subscribers, the table holds. If only 30% of MAU subscribe, Beehiiv stays cheaper longer.
- **Follow-up chat cost assumption:** ~30% of result-page viewers send at least one message, ~2 messages per session, ~$0.015 per message. Capped to 3 messages per session and 10/hour per IP, so abuse is bounded.
- Contract scanner cost dominates at scale. If usage spikes, switch to Claude Haiku 4.5 for first-pass triage and only invoke Sonnet on long contracts.
- At 10k MAU, run a cost audit. Likely need to move pSEO pages to ISR with longer revalidate windows to control Vercel function invocations.

---

## 15. Claude Code workflow

### `CLAUDE.md` (root) — what to put in it

```markdown
# CFOforcreators.com — Engineering Notes

## Voice / copy rules (read first, every time)
- Plain language. No finance jargon without inline definition.
- Lead with the answer / number. Reasoning second.
- Honest about both sides — sometimes the answer is "no, don't do this."
- Never say "consult a professional." Name the human role: "an accountant," "a lawyer," "an Enrolled Agent."
- Never name a sponsor rate without grounding it in data or an explicit named source.
- Never imply we can move money. Read-only frame.
- Match creator energy: lowercase, casual, brief. Don't be stiff.

Full voice spec: `ai_cfo_system_prompt.md` in the design docs folder.

## Architecture invariants (don't violate without explicit approval)
- Adding a tool = one file in `src/tools/<slug>.ts` + one route file. If you're touching `ToolPage.tsx` to add a tool, stop and reconsider.
- Calculator math lives in `src/lib/tax/*` or similar pure modules. NEVER inline math in components.
- Same `zod` schema validates client and server. NEVER duplicate validation.
- Result URLs (`/tool/result/[id]`) must remain stable forever. NEVER change the snapshot shape in a way that breaks old URLs.
- All money values are integers in the schema (`number`). Format at display time only.
- All US state references go through `src/data/states.ts`. NEVER inline state lists.
- **Every tool MUST produce a verdict ("yes" / "no" / "wait") in its `ResultDisplay`.** No exceptions. The verdict renders prominently above the headline number. This is what makes us different from generic calculators — we take a position. If a tool's verdict logic isn't obvious, ASK before defaulting to "yes."
- **Every tool's input form must include creator-specific fields** (platform, niche, audience size, hours/week) in addition to financial inputs. Don't ship a tool that asks the same questions a generic freelancer calculator would ask — that's the line we're trying to cross.
- **Every tool result page includes the follow-up chat block.** It is not optional. The chat receives the inputs + outputs + verdict as context and uses the AI CFO system prompt.

## Mobile-first rules
- Tap targets ≥ 44px (`min-h-tap min-w-tap`).
- All inputs `text-base` (prevents iOS zoom).
- Single column at default. `sm:` breakpoint is the first multi-column point.
- Test on a real iPhone before shipping. Lighthouse mobile ≥95, A11y ≥100.

## When in doubt
- Read `cfoforcreators_buildout_plan.md` (this is the source of truth).
- Read the existing tool implementations — they encode the patterns.
- Don't add a dependency without reading why nothing in the existing stack covers the need.

## Commands
- `pnpm dev` — local dev
- `pnpm test` — vitest
- `pnpm test:e2e` — playwright
- `pnpm lint` — biome
- `pnpm build` — production build
- Slash commands: `/new-tool`, `/new-content`, `/add-state-data` (in `.claude/commands/`)
```

### Suggested slash commands

**`.claude/commands/new-tool.md`**
```markdown
You are creating a new calculator tool for CFOforcreators.com.

Args: $ARGUMENTS (the tool slug, e.g., "expense-categorizer")

Steps:
1. Read `src/tools/tax-estimator.ts` to understand the ToolDefinition contract.
2. Read `src/tools/_types.ts` for the type definition.
3. Create `src/tools/$ARGUMENTS.ts` following the same pattern. Stub `compute()` if domain logic is unclear, ask the user before implementing math.
4. Create `src/app/(tools)/$ARGUMENTS/page.tsx` (4 lines, copy from tax-estimator).
5. Create `src/app/(tools)/$ARGUMENTS/result/[id]/page.tsx` and `opengraph-image.tsx`.
6. Create `src/app/api/tools/$ARGUMENTS/route.ts` (copy structure from tax-estimator).
7. Add slug to `src/tools/_registry.ts` and `src/app/sitemap.ts`.
8. Create stub MDX in `src/content/learn/<explainerSlug>.mdx`.
9. Add unit test scaffold in `tests/unit/$ARGUMENTS.test.ts` with at least 3 known-good cases.
10. Show the user a checklist of what's left (verify math, write 30+ test cases, add to cross-promo).

Voice rules apply to all generated copy — read CLAUDE.md voice section first.
```

**`.claude/commands/new-content.md`**
```markdown
Create a new MDX explainer in `src/content/learn/$ARGUMENTS.mdx`.

Steps:
1. Read voice rules in CLAUDE.md.
2. Read `content_scorp_explainer.md` from design docs as the gold-standard example.
3. Structure: 30-second answer → what you get → what you give up → who this is for / not for → next steps.
4. Add metadata to `src/content/learn/_registry.ts`.
5. Link to relevant tool(s).
```

**`.claude/commands/add-state-data.md`**
```markdown
Add or update state-specific tax / business data.

Args: $ARGUMENTS (state code, e.g., "CA")

Steps:
1. Read `src/data/states.ts` and `src/lib/tax/states.ts` to see existing schema.
2. Verify the data against the state revenue department's official site (cite URL in a comment).
3. Update both files in lockstep.
4. Run `pnpm test` to ensure no test scenarios break.
```

### Parallel agent execution patterns

This codebase is unusually parallelizable. The tool template architecture means most work can be split into independent agents.

**Concurrency-safe work splits:**
- **Per tool.** Two agents can build `llc-chooser` and `retirement-chooser` simultaneously — they touch only their own files. (The conflict point is `_registry.ts` and `sitemap.ts` — assign one agent the merge step.)
- **Per content piece.** MDX files are isolated.
- **Per pSEO state.** State data is per-row; multiple agents can fill `src/data/states.ts` rows in parallel via separate PRs.

**NOT parallelizable (one agent only):**
- Anything touching `src/components/tool/` (template surface).
- Anything touching the Tailwind config or design tokens.
- Database migrations (sequence-dependent).
- The `ToolDefinition` interface itself.

**Suggested parallel pattern for week 4:**
- Spawn 2 builder agents (`/new-tool llc-chooser`, `/new-tool retirement-chooser`).
- Spawn 1 content agent (`/new-content llc-for-creators`, `/new-content retirement-accounts-for-creators`).
- 1 reviewer agent merges PRs and runs the test/lint check.

---

## 16. Open decisions deferred to later

These don't block the build. Decide when relevant.

- **Standalone /chat surface (still v2).** Note: the per-tool follow-up chat (section 4 — `ToolFollowupChat`) ships in v1 on every calculator. A separate destination chat at `/chat` (no tool context, free-form Q&A, conversation persistence in Supabase) is still v2 — adds when we have ≥1k waitlist subscribers and want to measure standalone intent.
- **Referral mechanics.** Beehiiv has native referral. Turn on after the founding 100 are claimed (the urgency lever switches from "spots remaining" to "refer to skip the line").
- **A/B testing infrastructure.** PostHog feature flags. First test: counter present vs absent on landing.
- **Multi-author content.** Build when we have a second writer. Until then, single-author.
- **Comments / community on content pages.** Skip. Adds moderation overhead.
- **Payment integration for paid AI CFO.** Stripe. Not in scope for this 6-week plan.

---

## What "done" looks like at end of week 6

- 6 free calculators live, each with a unique result URL + dynamic OG image, each shareable on Reddit/Twitter without login walls.
- Landing page with live spots counter, waitlist capture, founder deep-dive flow.
- 6 companion content pages + ~250 pSEO pages (50 states × 5 topics).
- Beehiiv welcome sequence + state-specific tax reminder sequences live.
- PostHog dashboards for the 5 funnels.
- Lighthouse mobile ≥95 on every public route.
- 100% of calculator math covered by ≥30 unit tests each.
- Admin page showing waitlist count, deep-dive queue, top tool conversion rates.

If all of the above is true, the marketing site is doing its job and the team is free to focus on the paid AI CFO product build.

---

### Critical Files for Implementation

These are the highest-leverage files to nail first; everything else flows from them:

- `/Users/jadamclean/Library/Application Support/Claude/local-agent-mode-sessions/2bdc56d8-5a90-4409-bbf5-7fe47ff40786/60167bc2-7ae3-4abb-a667-5a02f23854ba/local_884f15a7-0682-4a21-9a15-9f1f84b436b3/outputs/cfoforcreators_buildout_plan.md` (the plan itself — needs to be saved from this response)
- `src/tools/_types.ts` (the `ToolDefinition` + `ResultDisplay` contract — `verdict` / `verdictHeadline` / `verdictReason` are required fields, no exceptions)
- `src/components/tool/ToolPage.tsx` (the 8-section orchestrator — every tool flows through it; section 5 is the follow-up chat block)
- `src/components/tool/ToolFollowupChat.tsx` (the Anthropic-powered chat block on every result; uses the AI CFO system prompt + per-result context)
- `src/lib/prompts/ai-cfo.ts` (the AI CFO system prompt — drop in the contents of `ai_cfo_system_prompt.md` from the design docs folder)
- `src/data/niche_salary_benchmarks.ts` (creator-niche × hours × audience-size lookup for "reasonable salary" — used by the S-corp calculator and any future tool that needs creator-specific benchmarks)
- `src/app/api/waitlist/route.ts` (the waitlist write path — Supabase + Beehiiv integration template for every other write endpoint)
- `src/lib/tax/federal.ts` (the first piece of real domain logic — sets the test pattern for all calculator math)
- `CLAUDE.md` (encodes voice + architectural invariants for every future agent run)
