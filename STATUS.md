# Sprint 2 — Tax Estimator Status

**Branch:** `feat/sprint2-tax-estimator`
**Date:** 2026-06-16
**Build:** PASSING — `next build` clean, 136/136 unit tests pass

---

## What shipped

### Math modules (`src/lib/tax/`)
- `federal.ts` — 2024/2025 federal income tax brackets, SE tax (SS cap + additional Medicare), QBI deduction with phase-out, standard deductions. 2026 uses 2025 numbers pending IRS Rev. Proc. (see note below).
- `state.ts` — `computeStateTax(federalAgi, stateCode, filingStatus)` covering all 50 states: 9 no-income-tax, 15 flat-rate, 26 bracket states.
- `safe_harbor.ts` — 90%-of-current-year method.
- `quarterly.ts` — deadlines (Q1=Apr 15, Q2=Jun 15, Q3=Sep 15, Q4=Jan 15), quarterly payment math, yes/no/wait verdict, underpayment penalty estimate.
- `index.ts` — orchestrator: annualizes YTD inputs, calls all modules, returns `TaxEstimatorOutput`.

### ToolDefinition (`src/tools/tax-estimator.ts`)
- 12 input fields including all creator-specific fields (platform, niche, quarter, income, expenses, state, filing status, W-2, prior payments, withholding)
- Zod schemas for client + server validation (single source of truth)
- `renderResult()` → full `ResultDisplay` with verdict, breakdown table, recommendation, caveat

### Routes
- `GET /tax-estimator` — creator fills 12 fields, gets verdict above the fold
- `GET /tax-estimator/result/[id]` — shareable SSR result page
- `GET /tax-estimator/result/[id]/opengraph-image` — dynamic OG image
- `POST /api/tools/tax-estimator` — validate → compute → persist → track
- `POST /api/tools/tax-estimator/follow-up` — edge streaming chat (3 messages free, 10/hr rate limit)

### Tests (136 total, all green)
- `federal.test.ts` — 46 tests
- `state.test.ts` — 30 tests
- `safe_harbor.test.ts` — 8 tests
- `quarterly.test.ts` — 21 tests
- `tax-estimator-verdict.test.ts` — 14 tests (all three verdict paths with creator inputs)

### Content
- `src/content/learn/how-quarterly-taxes-actually-work.mdx` — 1,800 words, all 7 sections

---

## Architecture note: server/client boundary

Next.js 15 App Router cannot serialize Zod class instances across the server/client boundary. Solution:
- `page.tsx` = Server Component (reads plain strings for metadata, renders `TaxEstimatorClient` with no props)
- `TaxEstimatorClient.tsx` = "use client" component that imports the tool directly (Zod schema stays client-side)
- All future tools need this same pattern.

---

## What's left / known gaps

### Needs human review before launch
1. **2026 federal tax brackets:** using 2025 numbers pending IRS Rev. Proc. 2026 (typically Nov 2025). Update `src/lib/tax/federal.ts` when published.
2. **Supabase migrations:** 00001 + 00002 still need to be run in the Supabase SQL editor (carry-over from Sprint 1).

### Deferred — not blocking
- `/learn/[slug]` rendering route: content file exists, route doesn't. Links in `ToolExplainer` will 404 until a content route is built.
- E2E Playwright test (`tests/e2e/tax-estimator-flow.spec.ts`): not written — add before launch.
- Income breakdown sub-fields not displayed in result (captured in schema, stored in snapshot).

---

## PR target

Open against `feat/sprint1-foundation` (stacked — Sprint 1 still unmerged to main).

## Next

Sprint 3: S-corp calculator (`/scorp-calculator`)
