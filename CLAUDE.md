# CFOforcreators.com — Engineering Notes

You are building CFOforcreators.com — a marketing site + free calculator suite for content creators that captures email signups for a future paid AI CFO product.

**The source of truth for every architectural and strategic decision is `docs/cfoforcreators_buildout_plan.md`. Read it before making decisions. Don't re-litigate decisions already in the plan.**

## Voice / copy rules (read before writing ANY user-facing string)
- Plain language. No finance jargon without inline definition.
- Lead with the answer / number. Reasoning second.
- Honest about both sides — sometimes the right answer is "no, don't do this."
- Never say "consult a professional." Name the human role: "an accountant," "a lawyer," "an Enrolled Agent."
- Never name a sponsor rate without grounding it in data or an explicit named source.
- Never imply we can move money. Read-only frame.
- Match creator energy: lowercase, casual, brief. Don't be stiff.

Full voice spec: `docs/ai_cfo_system_prompt.md`.

## Architecture invariants (don't violate without explicit approval)
- Adding a tool = one file in `src/tools/<slug>.ts` + one route file. If you're touching `ToolPage.tsx` to add a tool, stop and reconsider.
- Calculator math lives in `src/lib/tax/*` or similar pure modules. NEVER inline math in components.
- Same `zod` schema validates client and server. NEVER duplicate validation.
- Result URLs (`/tool/result/[id]`) must remain stable forever. NEVER change the snapshot shape in a way that breaks old URLs.
- All money values are integers in the schema (`number`). Format at display time only.
- All US state references go through `src/data/states.ts`. NEVER inline state lists.
- **Every tool MUST produce a verdict ("yes" / "no" / "wait") in its `ResultDisplay`.** No exceptions. Verdict renders prominently above the headline number. If verdict logic isn't obvious, STOP and ask before defaulting to "yes."
- **Every tool's input form must include creator-specific fields** (platform, niche, audience size, hours/week) in addition to financial inputs. Don't ship a tool that asks the same questions a generic freelancer calculator would ask — that's the line we're trying to cross.
- **Every tool result page includes the follow-up chat block.** Not optional. The chat receives inputs + outputs + verdict as context and uses the AI CFO system prompt.

## Mobile-first rules
- Tap targets ≥ 44px (`min-h-tap min-w-tap`).
- All inputs use `text-base` (prevents iOS zoom on focus).
- Single column at default. `sm:` breakpoint is the first multi-column point.
- Lighthouse mobile ≥95, A11y ≥100 before merging anything.

## Overnight autonomy guardrails (CRITICAL — read before any unsupervised work)

**Branching:**
- Always work on a feature branch named `feat/<sprint>-<task>` (e.g., `feat/sprint1-foundation`).
- NEVER push to `main` directly.
- NEVER force-push.
- NEVER delete branches.

**Commits:**
- Commit after every meaningful unit of work, not at the end. One feature per commit.
- Conventional Commits format: `feat(scope): description`. Example: `feat(landing): add hero section with email capture`.
- Run `git status` before every commit. Verify no `.env*` files are staged.

**Stop conditions — if ANY of these happen, stop work and write a `STATUS.md` describing what you did, what's left, and what blocked you:**
- A single task takes more than 30 minutes or 5 retries.
- You hit a missing API key or service credential.
- Tests fail and you can't determine why within 10 minutes.
- You'd need to deviate from `docs/cfoforcreators_buildout_plan.md` to proceed.
- You'd need to install a package not already mentioned in the plan.
- You'd need to make a destructive change (delete files, drop tables, force-push).

**Out-of-scope work — DO NOT do any of the following without explicit human approval:**
- Deploy to production. Preview deploys via PR are fine.
- Touch `main` branch directly.
- Run anything that costs money against real services (test against mocks/stubs).
- Add dependencies not justified by the plan.
- Refactor code outside the current sprint's scope.
- Make architectural changes that contradict the plan.
- Commit secrets, even briefly.

**When in doubt:**
- Read `docs/cfoforcreators_buildout_plan.md`.
- Read existing tool implementations — they encode the patterns.
- If still in doubt, stop and write to `STATUS.md`. The human will resume in the morning.

## Commands
- `pnpm dev` — local dev
- `pnpm test` — vitest
- `pnpm test:e2e` — playwright
- `pnpm lint` — biome
- `pnpm build` — production build
- Slash commands: `/new-tool`, `/new-content`, `/add-state-data`, `/status` (in `.claude/commands/`)
