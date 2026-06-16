# Sprint 4b — Brand Contract Scanner (overnight build kickoff)

This is the prompt to paste into Claude Code for the unsupervised overnight build of the brand contract scanner. Sprint 3 (S-corp calculator) should be open as a PR — sprint 4b stacks on top.

Sprint 4b (this doc) and Sprint 4a (sponsor rate calculator — `docs/sprint4a_kickoff.md`) can run in parallel as two separate Claude Code instances on two separate branches. They touch entirely different files except for `_registry.ts` and `sitemap.ts` — see Merge Conflict Resolution below.

---

## Context

You're building the **Brand Contract Scanner** — the fourth and most legally-sensitive user-facing free tool. The buildout plan in `docs/cfoforcreators_buildout_plan.md` §10 week 6 specifies this work.

**Why this tool matters:**

Anyone with a brand deal has money. Search volume is lower than the rate calc ("brand deal contract review" isn't a high-volume keyword) but intent is the highest in the suite — creators reading brand contracts are mid-deal and willing to pay for help. The waitlist conversion potential is highest here even though traffic is lowest.

**Why this tool is the riskiest to ship:**

We are NOT lawyers. The system prompt and UX must obsessively avoid implying we provide legal advice. Bad outputs here aren't just embarrassing — they could expose us to liability. Hard rules baked into the prompt + UX gate everything.

This is also the ONLY tool in the suite that isn't pure calculator math. It's AI-driven via the Anthropic API, with streaming responses. Different architecture, same ToolDefinition contract surface (with an exception noted in CLAUDE.md).

**Source of truth:** `docs/cfoforcreators_buildout_plan.md` §10 week 6. `CLAUDE.md` for architecture invariants and voice rules. `docs/ai_cfo_system_prompt.md` for the parent voice.

## Branching

- Base branch: `feat/sprint3-scorp-calculator`
- New branch: `feat/sprint4b-contract-scanner`
- PR target: `feat/sprint3-scorp-calculator`
- Conventional Commits format: `feat(contract): ...`, `feat(tools): ...`, etc.

## Parallel sprint coordination

Sprint 4a (sponsor rate) runs on its own branch off the same parent. Conflicts only on:

- `src/tools/_registry.ts`
- `src/app/sitemap.ts`
- `src/components/tool/ToolCrossPromo.tsx` (if either adds the other to relatedTools)

Resolution: first to merge wins. Second rebases. Jada handles the manual rebase.

## Pruned tool roadmap reminder

1. Sprint 2: Tax estimator ✅
2. Sprint 3: S-corp calculator ✅
3. Sprint 4a: Sponsor rate calculator (parallel run)
4. **Sprint 4b: Brand contract scanner** ← this sprint
5. LLC chooser → MDX only, do NOT build
6. Retirement chooser → MDX only, do NOT build

## Architecture invariants

This tool is the exception in CLAUDE.md noted as "contract-scanner.ts # exception: AI-driven, different shape." Specifically:

- **No pure `compute()` function.** Replaced by `streamScan()` that calls Anthropic's API.
- **No standard math test suite.** Replaced by golden-output snapshot tests with sanitized fake contracts.
- **All other invariants still apply:** ToolDefinition contract, result URL stability, mobile-first, verdict required, follow-up chat included.

## Required inputs (3 fields)

This tool has way fewer inputs than the others — the contract text is the input.

| Field | Type | Notes |
|---|---|---|
| `contract_text` | textarea | Max 50,000 characters. We don't ship file upload in v1 — paste only. |
| `creator_context` | optional textarea | "What's this deal? Who's the brand? What's been discussed verbally?" — optional context for the scan to weigh clauses against |
| `niche` | optional radio | Same niche list as other tools — helps the model interpret deliverable-specific risk |

## Verdict logic

The verdict union stays `"yes" | "no" | "wait"`. Mapping for contract scanner:

- `verdict: "yes"` → "Looks fine. Sign it." (No major dealbreakers, minor clauses noted)
- `verdict: "no"` → "Don't sign as-is. Real dealbreakers below." (Perpetual rights without compensation, exclusivity too broad, indemnification overreach, IP grabs)
- `verdict: "wait"` → "Negotiate these clauses first." (Fixable issues — payment terms too long, exclusivity window too long, missing kill fee, etc.)

The verdict is the AI's structured output. The system prompt enforces this categorization explicitly.

Examples (these go in the verdict reason):

- `verdict: "yes"` (standard YouTube integration deal):
  - headline: "Looks fine. Standard terms."
  - reason: "Standard payment terms (Net 30), standard usage rights (organic only + 6 month brand boost rights), no exclusivity beyond the specific brand category. Couple of small things worth knowing about in the details below, but nothing that should block signing."

- `verdict: "no"` (perpetual rights grab):
  - headline: "Don't sign. They want perpetual rights without paying for them."
  - reason: "Clause 7 grants the brand 'perpetual worldwide license to all content.' That's a 2-3x rate premium they're not paying. Either negotiate to organic-only or charge them 2-3x for the rights. Two other dealbreakers also flagged below — exclusivity is too broad (entire 'beauty industry' for 18 months) and indemnification is one-sided."

- `verdict: "wait"` (fixable issues):
  - headline: "Negotiate these three clauses first."
  - reason: "Three things to push back on: (1) payment terms are Net 60 — push for Net 30. (2) Exclusivity window is 90 days for a single integration — fine if your rate accounts for it, ask for it to be removed if it doesn't. (3) No kill fee — ask for 50%. None of these are dealbreakers; all three are normal asks."

The AI generates these — your job is to enforce the structure via the system prompt.

## System prompt (the most important file in this sprint)

`src/lib/contract/system_prompt.ts` exports `CONTRACT_SCAN_SYSTEM_PROMPT`. This MUST include the following rules verbatim — they're the legal-risk guardrails:

```
You are reviewing a brand sponsorship contract for a content creator.

CRITICAL RULES — these are non-negotiable:

1. You are NOT a lawyer. You do NOT provide legal advice. You flag clauses and explain what they mean in plain English.
2. If the user has a serious concern about a clause, recommend they "talk to a lawyer" or "talk to an Enrolled Agent" depending on the issue. NEVER say "consult a professional" — name the role.
3. Do not promise any specific legal outcome. Use language like "this clause typically means..." or "creators often push back on this because..." NEVER "this clause is illegal" or "the brand cannot enforce this."
4. When in doubt about a clause, flag it as needing legal review rather than guessing.
5. Do not make up clauses that don't exist in the text. Only flag clauses you can quote from the provided contract.

CATEGORIZATION:

For each clause you identify, categorize it as one of:
- "risky" — meaningful financial or rights concern. Quote the clause text. Explain why it matters in 1-2 plain sentences. Suggest a negotiation move.
- "unusual" — non-standard but not necessarily bad. Quote it. Explain what it usually means. Note whether it's typical for this kind of deal.
- "fine" — standard clause worth noting so the creator knows what they're signing. Quote it. One-sentence plain explanation.

OUTPUT STRUCTURE:

After scanning the full contract, produce a structured response with:
1. `verdict`: one of "yes" | "no" | "wait" — see the verdict logic below
2. `verdictHeadline`: a short headline (one sentence)
3. `verdictReason`: 2-3 sentence plain-English explanation
4. `flaggedClauses`: array of { category: "risky" | "unusual" | "fine", quote: string, explanation: string, suggestedAction?: string }
5. `summary`: 2-3 sentence summary of the contract's overall posture

VERDICT LOGIC:

- "yes" = no risky clauses; only fine/unusual flags.
- "no" = at least one truly serious risky clause (perpetual rights without compensation, broad exclusivity beyond the deal scope, one-sided indemnification, IP transfer of original creative work, kill clauses that let the brand cancel without payment after work is done).
- "wait" = risky clauses exist BUT they're commonly negotiable (Net 60 payment, narrow exclusivity, missing kill fee, vague approval rights).

VOICE:

- Lowercase, plain language. Match the AI CFO voice (see `docs/ai_cfo_system_prompt.md` for full voice spec).
- Lead with the answer, then the reasoning.
- Honest about both sides. If a clause looks bad but is standard for the industry, say so.
- Match creator energy: casual, brief. Don't be stiff.
```

Hard rules baked into the prompt PLUS hard rules baked into the response schema (zod validation rejects responses without verdict + categorization).

## Architecture

This tool uses Anthropic's streaming API. Edge runtime. Response is streamed via Vercel AI SDK.

```
src/lib/contract/system_prompt.ts          # the prompt above
src/lib/contract/scan.ts                   # streamScan(contractText, context) → AsyncIterable<event>
src/lib/contract/parse_response.ts         # parses structured response from streaming output
src/lib/contract/types.ts                  # zod schemas for ScanResult, FlaggedClause
src/lib/contract/sanitize.ts               # strips obvious PII (email addresses, phone numbers) before sending to LLM
```

`src/lib/contract/scan.ts` exports `streamScan(input) → AsyncIterable<ScanEvent>` where ScanEvent is one of:
- `{ type: "verdict", verdict, headline, reason }` (emitted first)
- `{ type: "flag", category, quote, explanation, suggestedAction }` (emitted as each clause is identified)
- `{ type: "summary", text }` (emitted last)
- `{ type: "error", message }`

The result page renders the verdict above the fold immediately, then progressively reveals flagged clauses as the stream arrives. This is the AI streaming UX the buildout plan specifically called for.

## Files to create

```
src/tools/contract-scanner.ts                              # ToolDefinition (with isAiDriven: true flag)
src/app/(tools)/contract-scanner/page.tsx                  # 4-line route file
src/app/(tools)/contract-scanner/result/[id]/page.tsx      # renders saved scan from DB
src/app/(tools)/contract-scanner/result/[id]/opengraph-image.tsx

src/app/api/tools/contract-scanner/route.ts                # POST → stream scan → save snapshot
src/app/api/tools/contract-scanner/follow-up/route.ts      # Edge streaming chat (post-scan questions)

src/lib/contract/system_prompt.ts                          # the verbatim prompt above
src/lib/contract/scan.ts                                   # streaming wrapper around Anthropic
src/lib/contract/parse_response.ts                         # structured output parser
src/lib/contract/sanitize.ts                               # PII stripper
src/lib/contract/types.ts                                  # zod schemas

src/components/contract/ContractTextarea.tsx               # 50k char limit, paste affordance
src/components/contract/FlaggedClauseCard.tsx              # category-colored card for a flag
src/components/contract/StreamingResult.tsx                # progressive reveal as stream arrives

content/learn/how-to-read-a-brand-contract.mdx             # companion content

tests/unit/contract-parse-response.test.ts                 # parser handles valid + malformed AI outputs
tests/unit/contract-sanitize.test.ts                       # PII stripping
tests/integration/contract-system-prompt.test.ts           # snapshot tests with mocked Anthropic responses on 5 known contracts
tests/e2e/contract-scanner-flow.spec.ts                    # Playwright E2E (with mocked stream)
```

## Rate limiting (CRITICAL — cost protection)

```ts
// src/app/api/tools/contract-scanner/route.ts
const RATE_LIMITS = {
  perIp: { count: 5, window: "1h" },           // 5 scans per hour per IP
  perDay: { count: 50, window: "1d" },         // 50 scans per day across all IPs (cost ceiling)
  maxInputChars: 50_000,                       // hard cap on contract length
};
```

Reuse `src/lib/ratelimit.ts` from sprint 1 with an additional global daily ceiling. If the daily ceiling is hit, the API returns a friendly "high traffic right now, try again in a few hours" message — NOT a hard error.

## PII sanitization (`src/lib/contract/sanitize.ts`)

Before sending the contract to Anthropic, strip:
- Email addresses (`/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g`)
- Phone numbers (US formats — `/\b(\+?1[-.]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g`)
- Tax IDs / SSNs (`/\b\d{3}-?\d{2}-?\d{4}\b/g`)
- Bank account numbers (10+ consecutive digits, conservative regex)

Replace with `[REDACTED-EMAIL]`, `[REDACTED-PHONE]`, etc. Log the count of redactions (NOT the contents) for monitoring.

This is defense in depth — Anthropic's terms don't require it but we want to minimize what we send.

## Test pattern (different from other sprints)

Math tests don't apply. Instead:

### Parser tests (`tests/unit/contract-parse-response.test.ts`)

Hand-write 10+ examples of streaming Anthropic outputs (good, malformed, truncated). Verify the parser handles each.

### Sanitization tests (`tests/unit/contract-sanitize.test.ts`)

Test inputs with various PII patterns. Verify each is redacted. Verify the redaction count is logged.

### Integration tests (`tests/integration/contract-system-prompt.test.ts`)

Five fake contracts hand-written with known clause patterns:

1. "Standard YouTube integration" — should verdict YES, flag 2-3 fine clauses
2. "Perpetual rights grab" — should verdict NO, flag the rights clause as risky
3. "Broad exclusivity" — should verdict NO, flag the exclusivity clause as risky
4. "Negotiable issues" — Net 60 payment + narrow exclusivity + missing kill fee — verdict WAIT
5. "Multi-issue contract" — risky AND fixable issues — verdict NO (risky dominates)

Mock the Anthropic API to return canned responses for each. Verify the parser produces the expected structured output.

These tests RUN ON CI and gate merges. Don't mock everything — at least one integration test should run against the real API in a manual nightly job (not in CI) so we catch system prompt drift over Anthropic model updates.

## Companion content

`content/learn/how-to-read-a-brand-contract.mdx`. Target 2,500-3,500 words. Plain creator voice. Section headers:

1. Why every clause exists (the brand's lawyer wrote this)
2. The five clauses you should never sign without negotiating
3. Usage rights: the hidden 3x rate multiplier
4. Exclusivity: the right way to scope it
5. Payment terms: Net 30 vs Net 60 vs the gigwage trap
6. Kill fees: the safety net most creators forget
7. Indemnification: the clause that should be mutual
8. When to call a lawyer

Embed the scanner at the top with `<ToolEmbed slug="contract-scanner" />`.

## ToolDefinition shape (with AI-driven exception)

```ts
const tool: ToolDefinition<ContractInput, ContractOutput> & { isAiDriven: true } = {
  slug: "contract-scanner",
  title: "Brand contract scanner for creators — free, AI-powered",
  metaTitle: "Free brand contract review for content creators (AI-powered, no signup)",
  metaDescription: "Paste your brand sponsorship contract. Get a plain-English breakdown of risky clauses, what's standard, and what to negotiate. Free, no signup, no legal advice — just clarity.",
  isAiDriven: true,                            // signals to ToolPage that compute is replaced by streamScan
  // compute: undefined,                       // explicitly omitted — see ToolPage logic
  streamScan: scanContract,                    // the streaming function from src/lib/contract/scan.ts
  inputSchema,                                 // contract_text, creator_context, niche
  outputSchema,                                // verdict, headline, reason, flaggedClauses, summary
  explainerSlug: "how-to-read-a-brand-contract",
  buildShareText: (out) => {
    if (out.verdict === "no") return `caught some serious issues in my brand deal contract — almost signed without seeing them →`;
    if (out.verdict === "wait") return `there are 3 things to negotiate in this brand deal before i sign →`;
    return `ran my brand deal contract through this scanner. clean → signing it →`;
  },
  relatedTools: ["sponsor-rate", "tax-estimator"],
  ogTemplate: "ResultHeadlineTemplate",
};
```

The `isAiDriven` flag is a minor extension to the type union. Update `src/tools/_types.ts` accordingly — single line change.

## UI guardrails (non-negotiable)

The form page must include these legal-risk reducers visibly above the textarea:

```
This tool flags clauses and explains them in plain English. It does NOT provide legal advice.
For serious concerns about a contract, talk to a lawyer who knows entertainment + IP law.
We never store your contract text long-term — scans are kept for 7 days for your shareable result URL, then deleted.
```

The 7-day retention policy is real and must be implemented:
- `tool_results` table gets a `delete_after timestamptz` column (extend sprint 1 migration via 00004 migration)
- A scheduled function purges scans after 7 days
- The result page displays "this scan was kept for 7 days and will be deleted on [date]"

If you can't implement the retention policy cleanly, write to STATUS.md — do NOT ship without it.

## Follow-up chat addition

After a scan, the user can ask 3 follow-up questions. The follow-up chat receives the full scan output as context plus this tool-specific addition to the AI CFO system prompt:

> User just received a contract scan. Their verdict was [verdict]. They have [N] flagged clauses. Do NOT give legal advice. If they ask about a specific clause, refer back to the scan's flagging and explanation — don't generate new legal opinions. If they ask about negotiation tactics, give plain-language scripts they can use ("you could say back to the brand: 'we're happy to grant organic-only rights at this rate; perpetual rights are 2.5x'"). If they ask anything that requires a legal opinion, defer to "talk to a lawyer who knows entertainment + IP law."

Rate limit: 3 follow-up questions per scan session, 10/hr per IP.

## Stop conditions (from CLAUDE.md — more conservative for this tool)

Stop and write to `STATUS.md` if:
- Any test fails for the system prompt integration tests (legal-risk surface — never ship a degraded prompt)
- The PII sanitizer misses a pattern in your tests
- The streaming response doesn't reliably produce the structured output schema
- The 7-day retention policy can't be implemented cleanly
- You'd need to deviate from the verbatim system prompt rules above
- You'd need to give the model the ability to recommend specific legal actions

Be MORE conservative on this tool than the others. When in doubt, stop and ask.

## Out-of-scope work

- Deploy to production
- Touch main directly
- Add file upload (PDF parsing is v2 — paste-only for now)
- Have the model recommend specific lawyers, firms, or legal services
- Have the model produce ready-to-send legal letters
- Skip the rate limiting
- Skip the PII sanitization
- Skip the 7-day retention
- Build the sponsor rate calc (that's Sprint 4a)
- Commit secrets

## End-of-sprint deliverable

A creator hits `/contract-scanner` on their phone:

1. Sees the hero, the legal disclaimer above the textarea
2. Pastes their contract (up to 50k chars)
3. Optionally adds context
4. Hits Scan
5. Sees the verdict stream in within 2-3 seconds (yes/no/wait + headline)
6. Sees flagged clauses progressively appear (risky in red, unusual in yellow, fine in green)
7. Sees the summary at the end
8. Reads the explainer
9. Can ask the AI CFO 3 follow-up questions
10. Can share a unique result URL (which auto-deletes after 7 days, clearly disclosed)
11. Sees cross-promo to sponsor rate + tax estimator

CI green, Lighthouse mobile ≥95, all parser + sanitizer tests pass, integration tests pass on 5 known contracts. PR opened against `feat/sprint3-scorp-calculator`.

Write a `STATUS.md` update on completion with specific note about the 7-day retention implementation status. Then stop.

---

## How to kick this off (Jada — your checklist)

After sprint 3 is open as a PR. Can run in parallel with sprint 4a:

1. `cd ~/Desktop/cfoforcreators_freetools`
2. `git checkout feat/sprint3-scorp-calculator && git pull`
3. `git checkout -b feat/sprint4b-contract-scanner`
4. `git push -u origin feat/sprint4b-contract-scanner`
5. Open a fresh Claude Code instance (separate from any sprint 4a instance)
6. Paste THIS file's contents as the first prompt
7. Run with `--dangerously-skip-permissions`
8. Sleep. Check the PR in the morning.

Expected runtime: 5–8 hours of agent time. Longer because the system prompt iteration + the streaming response parser + the integration test suite all take careful work.

**Special review notes for tomorrow morning:**

Before merging this PR:
- Read the system prompt verbatim — confirm voice and legal-risk language
- Run the integration tests yourself and read the AI outputs — does any of them sound like legal advice?
- Test the PII sanitizer with your own real email/phone numbers in a sample contract
- Verify the 7-day retention is actually implemented (check the migration + scheduled function)
- Test a known-bad contract (perpetual rights grab) and confirm verdict is "no"
- Test a known-fine contract (standard YouTube integration) and confirm verdict is "yes"

Don't merge this PR on autopilot. The other tools can ship with light review. This one needs your eyes.
