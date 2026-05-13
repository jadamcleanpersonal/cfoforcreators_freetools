# CFOforcreators.com — Claude Code Overnight Kickoff Package

Everything you need to send Claude Code off to build CFOforcreators.com unsupervised.

**Read top to bottom once. Then work through Part A. Then paste Part D into Claude Code and go to bed.**

---

## Part A — The 1-hour pre-flight checklist (you do this)

Claude Code can't sign up for services or buy domains for you. These are the human-only steps. Do them first or the overnight run will stall halfway through.

### 1. Create the GitHub repo (5 min)

- Go to github.com → New Repository → name it `cfoforcreators` (private is fine).
- Don't add a README, license, or `.gitignore` yet — Claude Code will scaffold them.
- Locally: `mkdir cfoforcreators && cd cfoforcreators && git init && git remote add origin git@github.com:YOUR-USERNAME/cfoforcreators.git`

### 2. Sign up for the services (30–45 min total)

In rough priority order. Don't skip — the kickoff prompt assumes these accounts exist with API keys ready.

| Service | What you need | Notes |
|---|---|---|
| **Vercel** | Account + new project linked to your GitHub repo | Free tier is fine. Connect GitHub → import `cfoforcreators` repo. |
| **Supabase** | New project, save the URL + `anon` + `service_role` keys | Free tier covers it. Pick a region close to your users. |
| **Anthropic** | API key with credit ($20 buys you months of dev) | Console → API keys. Save as `ANTHROPIC_API_KEY`. |
| **Beehiiv** | Free account, save API key (Settings → Integrations) | Sign up for Launch tier (free up to 2,500 subs). |
| **Resend** | Account + verified sender domain (CFOforcreators.com) | Add the DNS records they give you. |
| **PostHog** | Account, save the project key | Free tier covers 1M events/mo. |
| **Tally** | Free account (no API key needed yet) | You'll build the founder deep-dive form here later — Claude Code won't touch it. |
| **Cloudflare** (or wherever your domain DNS is) | Add Vercel's DNS records | Vercel will tell you what records to add when you assign the domain. |

**Pro tip:** open all 7 signup tabs in parallel, knock them out together. Forty minutes if you stay focused.

### 3. Configure DNS so CFOforcreators.com points at Vercel (10 min)

In Vercel project settings → Domains → Add `cfoforcreators.com`. Vercel will show you A/CNAME records. Paste them into your DNS provider. Propagation is usually <1 hour.

### 4. Drop the design docs into the repo (5 min)

Create a `docs/` folder in your local repo and copy these files into it from the design package I gave you:

```
cfoforcreators/
├── docs/
│   ├── cfoforcreators_buildout_plan.md       ← THE source of truth
│   ├── ai_cfo_system_prompt.md               ← used by ToolFollowupChat
│   ├── ai_cfo_reference_completions.md       ← reference for AI behavior
│   ├── content_scorp_explainer.md            ← becomes /learn/should-you-switch-to-scorp.mdx
│   ├── content_llc_explainer.md              ← becomes /learn/llc-for-creators.mdx
│   ├── content_retirement_explainer.md       ← becomes /learn/retirement-accounts-for-creators.mdx
│   ├── landing_page_copy.md                  ← drives the landing page
│   ├── founder_deepdive_intake_form.md       ← spec for the Tally form
│   └── competitive_landscape.md              ← context for positioning
```

### 5. Create `CLAUDE.md` at the repo root (2 min)

Copy the contents of **Part B-1** below into `cfoforcreators/CLAUDE.md`.

### 6. Create the slash commands (3 min)

Make `cfoforcreators/.claude/commands/` and drop the four files from **Part B-2** below.

### 7. Create `.env.local` and `.env.example` (5 min)

Use **Part B-3** below. `.env.local` gets your real secrets. `.env.example` is the committable template.

**Verify `.env.local` is in `.gitignore` BEFORE you commit anything.** This is the single most important sentence in this document.

### 8. First commit (1 min)

```bash
git add .
git commit -m "scaffold: docs, CLAUDE.md, slash commands, env template"
git push -u origin main
```

You should now see the repo on GitHub with the docs folder, CLAUDE.md, commands, and `.env.example` (NOT `.env.local`). Verify nothing sensitive leaked.

### 9. Open Claude Code in the repo

```bash
cd cfoforcreators
claude
```

You're ready. Skip to Part D — the kickoff prompt.

---

## Part B-1 — `CLAUDE.md` content (drop at repo root)

```markdown
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
- **Every tool's input form must include creator-specific fields** (platform, niche, audience size, hours/week) in addition to financial inputs.
- **Every tool result page includes the follow-up chat block.** Not optional.

## Mobile-first rules
- Tap targets ≥ 44px (`min-h-tap min-w-tap`).
- All inputs use `text-base` (prevents iOS zoom on focus).
- Single column at default. `sm:` breakpoint is the first multi-column point.
- Lighthouse mobile ≥95, A11y ≥100 before merging anything.

## Overnight autonomy guardrails (CRITICAL — read before any unsupervised work)

**Branching:**
- Always work on a feature branch named `feat/<sprint>-<task>` (e.g., `feat/sprint1-landing-page`).
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
```

---

## Part B-2 — Slash command files (drop in `.claude/commands/`)

### `.claude/commands/new-tool.md`

```markdown
You are creating a new calculator tool for CFOforcreators.com.

Args: $ARGUMENTS (the tool slug, e.g., "expense-categorizer")

Steps:
1. Read `src/tools/tax-estimator.ts` to understand the ToolDefinition contract (or `src/tools/_types.ts` if no tool exists yet).
2. Create `src/tools/$ARGUMENTS.ts` following the same pattern. Required: every field on `ToolDefinition` including `verdict` logic in `renderResult`. If domain math is unclear, stub `compute()` and add a TODO with a question — do not invent.
3. Create `src/app/(tools)/$ARGUMENTS/page.tsx` (4 lines, copy from tax-estimator).
4. Create `src/app/(tools)/$ARGUMENTS/result/[id]/page.tsx` and `opengraph-image.tsx`.
5. Create `src/app/api/tools/$ARGUMENTS/route.ts` (POST inputs → save result).
6. Create `src/app/api/tools/$ARGUMENTS/follow-up/route.ts` (Anthropic streaming, copy from existing tool's follow-up route).
7. Add slug to `src/tools/_registry.ts` and `src/app/sitemap.ts`.
8. Create stub MDX in `src/content/learn/<explainerSlug>.mdx`.
9. Add unit test scaffold in `tests/unit/$ARGUMENTS.test.ts` with at least 3 known-good cases AND at least 1 case that produces verdict="no" (the brand-defining test).
10. Show the user a checklist of what's left (verify math, write 30+ test cases, add to cross-promo).

Voice rules apply to all generated copy — read CLAUDE.md voice section first. Honest "don't do it" verdict required where applicable.
```

### `.claude/commands/new-content.md`

```markdown
Create a new MDX explainer in `src/content/learn/$ARGUMENTS.mdx`.

Steps:
1. Read voice rules in CLAUDE.md.
2. Read `docs/content_scorp_explainer.md` as the gold-standard example of structure + voice.
3. Structure: 30-second answer → what you get → what you give up → who this is for / not for → what changes in your day-to-day → common mistakes → next steps → what we (AI CFO) can / can't do.
4. Add metadata to `src/content/learn/_registry.ts`.
5. Link to relevant tool(s).
6. Plain language only — translate every finance term on first use.
```

### `.claude/commands/add-state-data.md`

```markdown
Add or update state-specific tax / business data.

Args: $ARGUMENTS (state code, e.g., "CA")

Steps:
1. Read `src/data/states.ts` and `src/lib/tax/states.ts` to see existing schema.
2. Verify the data against the state revenue department's official site (cite the URL in a comment next to the row).
3. Update both files in lockstep.
4. Run `pnpm test` to ensure no test scenarios break.
5. If anything looks ambiguous (e.g., conflicting sources), stop and add a TODO — don't guess on tax data.
```

### `.claude/commands/status.md`

```markdown
Write a `STATUS.md` at the repo root summarizing the current state of work.

Required sections:
- **What I built tonight** — list of features completed with PR/branch links.
- **What's working** — what you tested and verified.
- **What's NOT working** — failing tests, broken builds, half-done features.
- **What blocked me** — missing credentials, ambiguous spec, etc. Be specific.
- **Files I created** — full list of new files.
- **Files I modified** — full list with one-line summary of the change.
- **Next steps** — what should happen first when work resumes.
- **Cost estimate** — approximate Claude Code tokens / dollars used (if known).

Tone: honest, brief. The human will read this first thing in the morning. They need clarity, not optimism.
```

---

## Part B-3 — Environment variable templates

### `.env.example` (commit this — placeholder values only)

```bash
# Vercel auto-injects these in production
NEXT_PUBLIC_SITE_URL=https://cfoforcreators.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic (server-side only — used by follow-up chat + contract scanner)
ANTHROPIC_API_KEY=sk-ant-...

# Email
BEEHIIV_API_KEY=bh_...
BEEHIIV_PUBLICATION_ID=pub_...
RESEND_API_KEY=re_...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Admin (the password-gated stats dashboard)
ADMIN_PASSWORD=change-me-locally

# Founder deep-dive Tally webhook secret (set in Tally + here)
TALLY_WEBHOOK_SECRET=change-me-locally
```

### `.env.local` (do NOT commit — local only)

Copy `.env.example` to `.env.local` and fill in the real values from your service accounts. Verify `.env.local` is in `.gitignore` (the Next.js default `.gitignore` covers `.env*.local` automatically — verify before first commit).

### `.gitignore` (verify it includes these lines)

```
# Environment
.env*.local
.env.production

# OS / IDE
.DS_Store
.idea/
.vscode/

# Build output
.next/
out/
node_modules/

# Test
coverage/
playwright-report/

# Logs
*.log
npm-debug.log*
```

---

## Part C — Decisions you still need to make BEFORE the overnight run

These can't be Claude-Code-decided. Make a quick call on each, write the answer in `docs/decisions.md`, and reference them in the kickoff prompt.

| Decision | Quick options | What CC does with it |
|---|---|---|
| **Brand colors** | Pick a hex pair (primary + accent) or "use Tailwind defaults — refine later" | Tailwind config |
| **Logo** | Upload a SVG to `public/logo.svg`, OR text-only wordmark "CFO for creators" | Header + landing |
| **Founder name + title** | "[Your name], Founder" | Founder note section + email signature |
| **Founder email** | The address you'll use for replies | Resend sender + Beehiiv from-name |
| **Twitter handle** | @yourhandle | Footer + share buttons |
| **Launch target date** | "Q4 2026" or specific date | Landing page FAQ |
| **Founding pricing offer** | "50% off year one" / "first 6 months free" / etc. | Landing page + email sequence |
| **Founder deep-dive Loom workflow** | You'll record manually after each intake (vs auto-scheduled) | Tally webhook just notifies you |

**Don't try to perfect these — Claude Code can use placeholders and you swap them in the morning.** Just have an answer.

---

## Part D — The kickoff prompt (paste this into Claude Code)

When you're ready to start the overnight run, open Claude Code in the repo and paste this prompt verbatim:

---

> Hey Claude Code — I'm sending you off for an overnight build run on CFOforcreators.com.
>
> **Read these files in order before doing anything:**
> 1. `CLAUDE.md` (repo root) — voice rules, architecture invariants, **the overnight autonomy guardrails section is non-negotiable**.
> 2. `docs/cfoforcreators_buildout_plan.md` — the full implementation plan. This is the source of truth.
> 3. `docs/landing_page_copy.md` — the copy for the landing page you're shipping tonight.
> 4. `docs/decisions.md` — brand colors, logo decision, founder name, etc.
>
> **Your scope tonight is Sprint 1 only:**
> - Foundation: Next.js 15 App Router + Tailwind 4 + shadcn/ui scaffolded.
> - Supabase client + admin clients wired up. The `waitlist` table created via SQL migration committed to the repo.
> - Beehiiv API wrapper (`src/lib/beehiiv.ts`).
> - Resend wrapper (`src/lib/resend.ts`).
> - The waitlist API route (`src/app/api/waitlist/route.ts`) — POST email → Supabase + Beehiiv.
> - The landing page (`src/app/page.tsx`) — implement using the exact copy from `docs/landing_page_copy.md`.
> - The spots-remaining counter component (read from Supabase `deepdive_intakes` count).
> - The 8-section tool template shells (`src/components/tool/`) — empty implementations of `ToolPage`, `ToolHero`, `ToolForm`, `ToolResult`, `ToolExplainer`, `ToolFollowupChat`, `ToolEmailGate`, `ToolShareBlock`, `ToolCrossPromo`. Don't ship a tool yet — just the template.
> - The `ToolDefinition` and `ResultDisplay` contracts in `src/tools/_types.ts` exactly as spec'd in section 4 of the plan, including the required `verdict` fields.
> - PostHog client + event helpers (`src/lib/posthog.ts`).
> - Biome + Vitest + Playwright configs.
> - GitHub Actions CI per the plan's section 12.
>
> **Out of scope tonight:**
> - Any actual calculator (tax estimator, S-corp, etc.) — those start tomorrow.
> - Any /learn/ MDX content — Sprint 2.
> - Programmatic SEO pages — Sprint 5+.
> - Production deploys — preview deploys via PR only.
>
> **Process:**
> - Work on a single feature branch: `feat/sprint1-foundation`.
> - Commit after every meaningful unit (one feature per commit, conventional commits format).
> - Push periodically so I can see progress in the morning.
> - Open ONE pull request from `feat/sprint1-foundation` to `main` with everything you built.
> - Do NOT merge the PR — leave it open for me to review.
>
> **When you're done OR you hit a stop condition (per CLAUDE.md):**
> - Run the `/status` slash command to write `STATUS.md` at the repo root.
> - Commit it. Push it. Stop.
>
> **Important:** if you can't proceed because of a missing credential, ambiguous spec, or any blocker — STOP. Don't guess. Write what you tried and what blocked you in `STATUS.md`. I'd rather you finish 80% of Sprint 1 with a clear blocker than guess at 100% and leave me a mess to untangle.
>
> Begin.

---

## Part E — What to expect when you wake up

A successful overnight run looks like this:

- A new branch `feat/sprint1-foundation` exists on GitHub.
- An open PR with ~30-60 commits and a clear PR description.
- A Vercel preview deploy URL in the PR description showing the landing page rendering on mobile.
- `STATUS.md` at the repo root explaining what's done and what's left.
- The Supabase `waitlist` table exists and accepts test submissions.
- Lighthouse mobile score posted in the PR description (target ≥95).
- All tests passing in CI.

A partial overnight run (also a success):

- Foundation done but landing page incomplete, with `STATUS.md` explaining exactly where it stopped.
- One specific blocker called out (e.g., "I couldn't verify the Beehiiv subscriber tag schema — need confirmation from you.")
- All committed work is reviewable.

A failed overnight run looks like:

- No commits pushed.
- No `STATUS.md`.
- Ambiguous half-built state with no documentation.

The CLAUDE.md guardrails are designed to make scenario 3 nearly impossible. If it happens, the run was off the rails for hours — likely a missing credential or an ambiguous spec the human didn't anticipate.

---

## Part F — Common failure modes (what to check first if something's off in the morning)

| Symptom | Most likely cause | First thing to check |
|---|---|---|
| Nothing committed | Missing API keys → CC stopped per guardrails | `STATUS.md` should explain |
| Build failing | Package version mismatch | Check `package.json` against the plan's pins |
| Tests passing but UI broken | Tests didn't cover real DOM | Run `pnpm dev` locally and click through |
| Vercel deploy failing | Env vars not set in Vercel UI | Vercel dashboard → Project → Settings → Env Vars |
| Supabase calls failing | Service role key in client code (bad) or RLS not configured | Check `STATUS.md` and the API route files |
| Beehiiv subscribers not appearing | API key missing from `.env.local` OR webhook not firing | Check the `/api/waitlist/route.ts` logs in Vercel |
| Email confirmations not sending | Resend domain not verified | Resend dashboard → Domains |
| Tons of TODO comments in the code | CC ran into ambiguity it didn't want to guess on | Good sign — read each TODO, answer it, kick off Sprint 2 |

---

## Part G — Cost expectations for the overnight run

Realistic Claude Code costs for Sprint 1 foundation work:

- Sonnet 4.5 with thoughtful prompting: **$15–40 in API costs** for an 8-hour overnight run.
- Most cost is reading the plan + writing files. Iteration on bugs adds up if it gets stuck.
- The CLAUDE.md guardrails (5-retry limit, stop conditions) cap the worst case.
- If the run goes >$60, something's off — wake up time was wasted; check `STATUS.md` and the recent commits.

---

## Part H — Day-after workflow

When you wake up:

1. **Read `STATUS.md` first.** Don't skim the code. Read what CC says it did and what blocked it.
2. **Look at the PR.** Is the description coherent? Are the commits atomic and well-named?
3. **Click the Vercel preview link from the PR.** Does the landing page render on your phone? Is the spots counter showing? Does email submit work?
4. **Run the test suite locally.** `pnpm install && pnpm test`. Greenlight or red flags.
5. **Skim the new files.** Don't read every line — sample 3-5 to verify the patterns from the plan are followed (especially `ToolDefinition`, the API route shape, and the components).
6. **Address blockers.** Reply to TODOs, supply missing config, etc.
7. **Kick off Sprint 2.** Same prompt structure as Part D, just point at "Sprint 2 — Tax Estimator" in the plan. Add any feedback from Sprint 1 to the prompt so CC doesn't repeat issues.

If everything looks good, merge the PR and let CC continue tomorrow night with Sprint 2.

---

## Final checklist before you hit send

- [ ] All 7 service accounts created with API keys saved in `.env.local`
- [ ] Domain DNS pointed at Vercel
- [ ] Repo created, cloned locally, first commit pushed
- [ ] `CLAUDE.md` at repo root
- [ ] `.claude/commands/` populated (4 files)
- [ ] `.env.example` committed; `.env.local` exists locally and is in `.gitignore`
- [ ] `docs/` folder populated with all 9 design files
- [ ] `docs/decisions.md` written with brand color, founder name, etc.
- [ ] Claude Code installed and authenticated (`claude --version`)
- [ ] You're in the repo directory (`cd cfoforcreators`)
- [ ] You've read the kickoff prompt in Part D once more

When all 10 boxes are checked, paste Part D into Claude Code, and go to bed.

---

## Risk rating: medium

This is real autonomous code generation against your repo. The guardrails make it safe, but not zero-risk. Expect:

- **70% chance** you wake up to a clean Sprint 1 PR you can merge after light review.
- **25% chance** you wake up to a mostly-done PR with a clear blocker called out — easy to unblock.
- **5% chance** something unexpected happens and you need to investigate. The branch isolation + commit cadence guardrails mean recovery is straightforward — worst case, delete the branch and re-run.

The expected value is strongly positive: even the failure mode is a fast-recoverable preview branch, not a corrupted main branch or leaked secrets. Ship it.
