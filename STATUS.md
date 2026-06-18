# Sprint 3 — S-corp Calculator Status

**Branch:** `feat/sprint3-scorp-calculator`
**Date:** 2026-06-16
**Build:** PASSING — `next build` clean, 222/222 unit tests pass

---

## What shipped

### Math layer
- `src/lib/tax/scorp.ts` — all S-corp math as pure functions
  - `computeScorp()` — main entry: verdict + SE tax comparison + running costs + net savings
  - `getReasonableSalary()` — niche × audience × hours lookup with defensibility notes
  - `scorpVerdict()` — yes/no/wait with plain-language creator reasons
  - State-specific cost calculations: CA ($800 + 1.5% net income), NJ ($375), NY ($300), OR ($150), TN (6.5% excise + $100 franchise), NH (BPT/BET estimated)
- `src/data/niche_salary_benchmarks.ts` — 49-row lookup table
  - 7 niches × audience tiers × hours tiers
  - Sources: BLS OES 2023 + Goldman Sachs creator economy report + Influencer Marketing Hub 2024

### Tool definition
- `src/tools/scorp-calculator.ts` — 11 creator-specific fields, Zod schema, renderResult()
- `src/tools/_registry.ts` — updated to include scorp-calculator

### Routes
- `src/app/(tools)/scorp-calculator/page.tsx` — 4-line server component
- `src/app/(tools)/scorp-calculator/result/[id]/page.tsx` — shareable result page
- `src/app/(tools)/scorp-calculator/result/[id]/opengraph-image.tsx` — three-column comparison OG image (without/with/net savings)
- `src/app/api/tools/scorp-calculator/route.ts` — POST: validate → compute → persist → return
- `src/app/api/tools/scorp-calculator/follow-up/route.ts` — edge streaming AI CFO follow-up (3 free messages, 10/hr/IP)
- `src/components/tool/ScorpCalculatorClient.tsx` — client boundary wrapper

### Content
- `content/learn/should-you-switch-to-scorp.mdx` — 2,400-word plain-language explainer
  - Converted from docs/content_scorp_explainer.md + expanded with 9 sections per spec
  - ToolEmbed at top, filing deadline section, step-by-step CTA

### Tests
- **222 tests total, all passing** (86 new for Sprint 3)
- `tests/unit/scorp-verdict.test.ts` — 19 tests covering all 3 verdict paths + edge cases
- `tests/unit/scorp-salary.test.ts` — 15 tests: niche/audience/hours differentials, floor/cap logic
- `tests/unit/scorp-state-gotchas.test.ts` — 23 tests: CA, NY, NJ, OR, TN, NH scenarios
- `tests/unit/scorp.test.ts` — 29 tests: all 10 sprint scenarios + output shape integrity
- `tests/e2e/scorp-flow.spec.ts` — Playwright flow: load → fill → submit → verdict

---

## Verdict logic

| Condition | Verdict |
|---|---|
| `current_entity === "scorp_already"` | no |
| `profit < $60k` | no |
| `state === "CA" && profit < $75k` | no |
| `years_full_time === "<1"` | no |
| `$60k ≤ profit < $80k` | wait |
| `years_full_time === "1-3" && profit < $90k` | wait |
| All other cases | yes |

Default when ambiguous: **wait**, never yes. Per CLAUDE.md invariant.

---

## Running costs in the math

- Payroll service: $900/year (Gusto/OnPay midpoint)
- Additional accounting: $1,000/year
- State filing fees: CA ($800 + 1.5%), NJ ($375), NY ($300), OR ($150), TN ($100 + excise), NH ($175), others ($100)

---

## Review notes

1. **TN excise tax** estimated at 6.5% of distributions. Actual TN excise is complex — CPA should confirm. Gotcha message makes this clear.
2. **NYC GCT** surfaced as warning for NY state, not calculated (we don't know if user is in NYC vs. upstate).
3. **Reasonable salary floor ($40k) vs. cap (50% of income)**: floor wins when they conflict. This only happens at very low incomes that would already get a "no" verdict.
4. **`/learn/[slug]` route** doesn't exist yet — ToolExplainer links will 404. Same state as the tax-estimator explainer. Not a Sprint 3 blocker.

---

## What's next (Sprint 4)

Per the pruned roadmap: sponsor rate calculator + brand contract scanner.

---

# Sprint 2 — Tax Estimator Status (archived)

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
