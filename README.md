# CFOforcreators.com

Marketing site + free calculator suite for content creators. Captures email signups for a future paid AI CFO product.

**Status:** pre-build. The full implementation plan lives in `docs/cfoforcreators_buildout_plan.md`.

## Working on this repo

If you're a developer (or Claude Code) picking this up, start here:

1. Read `CLAUDE.md` at the root — voice rules, architecture invariants, overnight autonomy guardrails.
2. Read `docs/cfoforcreators_buildout_plan.md` — the source of truth for every architectural decision.
3. Read `docs/decisions.md` — brand colors, founder name, etc. (Project-specific values you fill in.)
4. The kickoff prompt for the overnight build is in `docs/claude_code_kickoff.md` — Part D is what you paste into Claude Code.

## Setup (once secrets are in place)

```bash
pnpm install
cp .env.example .env.local   # then fill in real values
pnpm dev
```

## What's in `docs/`

- `cfoforcreators_buildout_plan.md` — the full 76-page implementation plan
- `claude_code_kickoff.md` — overnight autonomous build kickoff guide
- `ai_cfo_system_prompt.md` — the AI CFO voice / system prompt (used by the follow-up chat on every tool)
- `ai_cfo_reference_completions.md` — 61 reference Q+A pairs in plain creator voice
- `ai_cfo_seed_dataset.jsonl` — same 61, structured for Langfuse upload
- `ai_cfo_training_questions.md` — 270+ creator-voiced training prompts
- `landing_page_copy.md` — copy for the marketing landing page
- `founder_deepdive_intake_form.md` — Tally form spec for the first-100 deep-dive offer
- `content_scorp_explainer.md` / `content_llc_explainer.md` / `content_retirement_explainer.md` — plain-language decision content
- `competitive_landscape.md` — what's already out there + where we differentiate
- `creator_finance_research.md` — original research backing the product strategy
- `decisions.md` — project-specific values (brand, founder, etc.)
