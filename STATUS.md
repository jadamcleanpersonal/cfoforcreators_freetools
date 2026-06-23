# Sprint 4c — Upload + Clause DB + Follow-up Defenses

**Branch:** `feat/sprint4c-upload-clause-db-defenses`
**Date:** 2026-06-19
**Build:** PASSING — `next build` clean, 405/405 unit + integration tests pass

## What was built

### Workstream A — Contract file upload (PDF + docx)
- `pdf-parse@2.4.5` + `mammoth@1.12.0` added
- `src/lib/contract/extract_pdf.ts`, `extract_docx.ts`, `extract.ts` — extraction libs
- `src/app/api/tools/contract-scanner/extract/route.ts` — POST endpoint (Node runtime)
- `src/components/contract/ContractFileUploader.tsx` — drag-drop + file picker
- `ContractScannerClient.tsx` — tab toggle (paste | upload) + opt-in checkbox
- Edge cases: image PDF, password-protected PDF, empty docx, >10MB, wrong MIME

### Workstream B — Anonymized clause pattern database
- `supabase/migrations/00005_clause_patterns.sql`
- `src/lib/contract/sanitize_pattern.ts` — regex PII stripper (returns null on failure)
- `src/lib/contract/extract_clause_pattern.ts` — Haiku extraction + sanitize + insert (fire-and-forget)
- `src/app/admin/clause-patterns/page.tsx` — password-gated admin view
- `content/legal/privacy-clause-patterns.mdx` + legal page at `/legal/privacy-clause-patterns`
- Opt-in checkbox (default unchecked), linked privacy addendum

### Workstream C — Follow-up chat defenses
- `supabase/migrations/00006_followup_sessions.sql`
- `src/lib/ai-cfo/followup_prompt.ts` — `buildFollowupSystemPrompt()` + `REFUSAL_RESPONSE`
- `[slug]/follow-up/route.ts` — 4 defenses: message cap, IP rate limit, email gate, off-topic refusal
- `ToolFollowupChat.tsx` — email gate form, 429/403 handling

## What needs to happen before merge

1. **Supabase migrations** — run 00005 and 00006 in SQL editor
2. **PR** — open manually (gh CLI not available):
   `https://github.com/jadamcleanpersonal/cfoforcreators_freetools/compare/main...feat/sprint4c-upload-clause-db-defenses`
3. **Pre-merge review:** upload a PDF, spot-check 5 clause patterns, test adversarial follow-up chat
4. **pnpm onlyBuiltDependencies** may need updating for pdf-parse + mammoth (run `pnpm approve-builds`)

## Deferred (not in scope)
- OCR for scanned PDFs
- `.doc` legacy Word support
- Clause pattern data surfaced in scanner results (v2)
- Tool-specific follow-up route cleanup (superseded by generic `[slug]` route)

---

# Sprint 4a — Sponsor Rate Calculator Status (historical)

**Branch:** `feat/sprint4a-sponsor-rate`
**Date:** 2026-06-18
**Build:** PASSING — `next build` clean, 280/280 unit tests pass, `pnpm lint` clean

---

## What shipped

### Math modules (`src/lib/sponsor/`)
- `benchmark_lookup.ts` — exact-match → adjacent-deliverable → adjacent-niche → floor fallback. Returns `matchType` + `dataConfidence` on every result.
- `multipliers.ts` — exclusivity (1.2x / 1.5x), usage rights (1.4x / 2.5x), engagement bonus (1.15x / 1.3x), viral views signal (1.1x). All stack multiplicatively.
- `verdict.ts` — `yes` / `no`(too-low) / `no`(too-high) / `wait`. `wait` fires on `dataConfidence: "low"`. No manufactured confidence.
- `index.ts` — orchestrator: lookup → adjust → verdict → result.

### Benchmark data (`src/data/sponsor_rate_benchmarks.ts`)
- 120 rows across 8 platforms × 9 niches × 4 audience tiers × 7 deliverable types
- Sources cited on every row: Karat 2024 Pricing Guide, Influencer Marketing Hub 2024 Report, IAB/PwC Podcast Advertising Revenue Study 2024, ConvertKit Creator Earnings 2024
- `dataConfidence`: high (direct data), medium (interpolated within source), low (triangulated)

### Tool definition
- `src/tools/sponsor-rate.ts` — 9-field ToolDefinition, Zod schema validates client + server
- `src/tools/_registry.ts` — sponsor-rate added to `allTools[]`

### Routes
- `/sponsor-rate` — calculator form (9 fields, ~2 min to complete)
- `/sponsor-rate/result/[id]` — shareable result page
- `/sponsor-rate/result/[id]/opengraph-image` — OG image (verdict badge + market range 3-col)
- `/api/tools/sponsor-rate` — POST compute + Supabase snapshot
- `/api/tools/sponsor-rate/follow-up` — edge streaming AI CFO follow-up chat

### Community submission pipeline (v1: DB only, not blended into calc yet)
- `/sponsor-rate/contribute` — anonymous rate submission form
- `/api/sponsor-rate/submit` — saves to `sponsor_rate_submissions` table
- `/admin/sponsor-rates` — password-gated moderation view (`?pw=ADMIN_PASSWORD`)

### Tests
- `tests/unit/sponsor-benchmark-lookup.test.ts` — 13 tests: exact match, fallback behavior, data integrity
- `tests/unit/sponsor-multipliers.test.ts` — 16 tests: each multiplier independently + stacking
- `tests/unit/sponsor-verdict.test.ts` — 29 tests: all 4 verdict paths covered (yes / no-too-low / no-too-high / wait) + coverage gate
- `tests/e2e/sponsor-rate-flow.spec.ts` — 8 Playwright tests: mocked API, tests all verdict paths + contribute page

### Content
- `content/learn/how-to-price-a-brand-deal.mdx` — 2,400-word companion piece with `<ToolEmbed>` at top

---

## What's left before production

1. **Supabase migration** — `sponsor_rate_submissions` table not yet created. Need migration with columns: `id`, `created_at`, `platform`, `niche`, `audience_size`, `deliverable_type`, `rate_charged`, `brand_accepted`, `exclusivity_days`, `usage_rights`, `approved_for_display`. No migration file included in this PR — add manually before merging to prod.

2. **PR to open** — `gh` not installed in this environment. Open manually at:
   `https://github.com/jadamcleanpersonal/cfoforcreators_freetools/compare/main...feat/sprint4a-sponsor-rate`

3. **Merge conflict** — if sprint 4b (contract scanner) PR is open simultaneously, both modify `src/tools/_registry.ts`. Whichever merges first wins; second rebases and adds both tools to the union.

4. **/learn/[slug] route** — the companion MDX links to `/learn/how-to-price-a-brand-deal` but the dynamic route is not yet built (same situation as sprint 3's `/learn/should-you-switch-to-scorp`). Links will 404 until that route is built.

5. **Admin approval action** — `/admin/sponsor-rates` shows a form that POSTs to `/api/admin/sponsor-rate/approve` — that route does not exist yet (v2 work). The moderation view shows pending submissions but the approve button won't work until that endpoint is built.

---

## Verdict logic summary (for review)

| Verdict | Condition |
|---|---|
| `wait` | `dataConfidence === "low"` (no direct public data for this intersection) |
| `yes` | `your_asking_rate >= adjustedLow && <= adjustedHigh` |
| `no` (too low) | `your_asking_rate < adjustedLow` |
| `no` (too high) | `your_asking_rate > adjustedHigh` |

Multipliers are applied before the verdict check — so exclusivity/rights/engagement bonuses shift the entire range before the comparison.

---

## Counts
- New files: 22
- New tests: 58 unit + 8 E2E
- Total tests: 280 (all passing)
- Benchmark rows: 120
