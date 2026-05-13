# Sprint 1 — Foundation Status

**Branch:** `feat/sprint1-foundation`
**Date:** 2026-05-13
**Build:** PASSING — `next build` clean, 17/17 unit tests pass, `tsc --noEmit` clean

---

## What was built tonight

### Infrastructure
- **Next.js 15.x** App Router + React 19 + TypeScript strict scaffolded from scratch (repo was non-empty so `create-next-app` was blocked; all files created manually)
- **Tailwind 4** with `@tailwindcss/postcss`, brand tokens in `@theme` directive (`globals.css`)
- **Biome 1.9** for lint + format (replaces ESLint + Prettier)
- **Vitest 2.x** + **Playwright 1.60** configured; unit tests passing
- **pnpm 11** package manager; `.nvmrc` pinned to Node 22

### Database
- `supabase/migrations/00001_init.sql` — `waitlist` + `deepdive_intakes` tables with RLS enabled
- `supabase/migrations/00002_tool_results.sql` — `tool_results` (public read RLS for shared URLs), `sponsor_rate_submissions`, `events`
- **Not yet applied to Supabase** — run `supabase db push` or paste in Supabase SQL editor

### Service wrappers
- `src/lib/supabase/{client,server,admin}.ts` — browser / RSC / service-role clients
- `src/lib/beehiiv.ts` — `subscribe()` + `tag()` for Beehiiv API v2
- `src/lib/resend.ts` — deep-dive confirmation + admin notification emails
- `src/lib/posthog.ts` — `Events` taxonomy + `trackServerEvent()` (server-side)
- `src/lib/utils.ts` — `cn()`, `formatCurrency()`, `formatNumber()`, `clamp()`
- `src/lib/prompts/ai-cfo.ts` — AI CFO system prompt

### Tool template architecture
- `src/tools/_types.ts` — **`ToolDefinition` + `ResultDisplay` contracts** including required `verdict` / `verdictHeadline` / `verdictReason` fields
- `src/tools/_registry.ts` — empty registry (tools added in Sprints 2-6)
- `src/components/tool/` — all 9 template shell components:
  - `ToolPage` (orchestrator), `ToolHero`, `ToolForm` (react-hook-form + zod, all field types)
  - `ToolResult` (verdict badge ABOVE headline number)
  - `ToolExplainer`, `ToolFollowupChat` (3 free messages, AI CFO voice), `ToolEmailGate`, `ToolShareBlock`, `ToolCrossPromo`

### Landing page (exact copy from `docs/landing_page_copy.md`)
- `src/app/page.tsx` — all 7 sections assembled
- `src/components/landing/` — Hero, ProblemBlock, WhatItDoes, OfferStack, FounderNote, FAQ
- `src/components/waitlist/WaitlistForm` — email capture, source tracking, PostHog events
- `src/components/waitlist/SpotsCounter` — RSC, ISR 60s, queries Supabase deepdive_intakes count
- `src/components/waitlist/StickyEmailBar` — mobile sticky bottom bar
- `src/components/shared/Header` + `Footer`
- `src/components/providers/PostHogProvider` — client-side PostHog init

### API routes
- `src/app/api/waitlist/route.ts` — POST email → Supabase upsert + Beehiiv subscribe + PostHog event
- `src/app/api/tools/[slug]/follow-up/route.ts` — streaming Anthropic follow-up chat, 3-message cap, edge runtime, rate limited 10/hr/IP

### Other
- `src/app/sitemap.ts` + `robots.ts` + `manifest.ts` — SEO + PWA basics
- `.github/workflows/ci.yml` — lint → typecheck → unit tests → build → Playwright E2E

---

## What's NOT done (out of scope tonight)

- **Supabase migrations not applied** — need to run against the live project
- **No actual calculator tools** — Sprints 2-6
- **No `/learn/` MDX content** — Sprint 2
- **No pSEO pages** — Sprint 5+
- **shadcn/ui primitives not installed** — tool form + components use raw HTML/Tailwind for now; install Button/Input/Card etc. via `pnpm dlx shadcn@latest add button input card label` when ready to polish
- **No OG image templates** — Sprint 2 (alongside tax estimator)
- **No admin dashboard** — Sprint 5
- **Tally webhook route** (`/api/deepdive/webhook`) — not built; Resend + Beehiiv tagging on deep-dive form submit needs this
- **Tool result pages** (`/[slug]/result/[id]`) — Sprint 2 (alongside first tool)
- **PostHog page view tracking** — PostHog provider inits but page view events are manual; wire `usePathname` in a PageViewTracker component before launch
- **Founder photo** — place at `public/founder.jpg` (placeholder silhouette in FounderNote.tsx now)

---

## ACTION REQUIRED before Sprint 2

### 1. Push the branch (5 minutes)
The branch is committed locally but the push failed — your GitHub PAT is missing the `workflow` scope (needed to push `.github/workflows/ci.yml`).

To fix:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Edit your token → check the **`workflow`** scope → Save
3. Then run: `git push -u origin feat/sprint1-foundation`
4. Open a PR from `feat/sprint1-foundation` → `main` (do NOT merge — leave for review)

### 2. Run Supabase migrations
Apply `supabase/migrations/00001_init.sql` and `00002_tool_results.sql` to your Supabase project before testing the waitlist form.

### 3. pnpm approve-builds
Run `pnpm approve-builds` interactively and approve: esbuild, @biomejs/biome, core-js, protobufjs, sharp. This writes to `pnpm-lock.yaml` and will fix CI.

---

## Blockers / notes for tomorrow

### pnpm build scripts security warning
pnpm 11 introduced a new security approval system for post-install scripts. On first install, `esbuild` and `@biomejs/biome` binaries didn't auto-run. Manual workaround applied:
```bash
node node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/install.js
node node_modules/.pnpm/@biomejs+biome@1.9.4/node_modules/@biomejs/biome/scripts/postinstall.js
```
**Action needed:** Run `pnpm approve-builds` interactively after pulling this branch to permanently approve these in `pnpm-lock.yaml`. This will fix CI on the first run.

### Supabase migrations
Run the SQL files in `supabase/migrations/` against your Supabase project:
- Option A: `supabase db push` (requires Supabase CLI + project linked)
- Option B: Copy/paste each file into Supabase SQL editor > Run

### Placeholders to swap
Search-replace before showing to anyone:
- `[Founder Name]` → real name (appears in `FounderNote.tsx`, `src/lib/resend.ts`)
- Twitter/X handle in `Footer.tsx` (currently commented out)
- `Coming soon` launch date in `FAQ.tsx` line: `"Targeting Coming soon for first beta..."`

### Vercel environment variables
Add all vars from `.env.local` to Vercel project settings (Production + Preview + Development groups). See `docs/cfoforcreators_buildout_plan.md` §12 for the full list.

---

## Commit log
```
043c2f2 feat(infra): scaffold Next.js 15 + Tailwind 4 + toolchain
8b76ef4 feat(db): Supabase migration files for all Sprint 1 tables
c62c25b feat(lib): Supabase clients, Beehiiv, Resend, PostHog, utils
2f6546a feat(tools): ToolDefinition + ResultDisplay contracts
6c90eee feat(components/tool): 8-section tool template shells
4898f72 feat(landing): landing page from copy doc + waitlist capture
f18248d feat(ci): GitHub Actions CI + Vitest unit tests + Playwright E2E stub
```

## Next sprint (Sprint 2 — Tax Estimator)
1. `src/lib/tax/federal.ts` — brackets, SE tax, safe-harbor math
2. `src/lib/tax/states.ts` — 50-state rates (flat/bracket)
3. `src/tools/tax-estimator.ts` — full ToolDefinition, ≥30 verified test cases
4. Tool page + result page (`/tax-estimator`, `/tax-estimator/result/[id]`)
5. Dynamic OG image (`ResultHeadlineTemplate`)
6. `/learn/how-quarterly-taxes-actually-work.mdx`
7. Playwright E2E: load → fill → submit → result → share
