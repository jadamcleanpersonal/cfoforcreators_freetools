# Launch Strategy — 14-Day Sprint to Public Launch

This is the playbook for the first 14 days of public traffic, written for the actual constraints we're operating under. It supersedes the "what to do right now" checklist at the bottom of `post_launch_ops.md`. After day 14, ops transition into the weekly rhythm in `post_launch_ops.md`.

**Source of truth:** `docs/cfoforcreators_buildout_plan.md` for product, `docs/ai_cfo_system_prompt.md` for voice, `CLAUDE.md` for invariants, this doc for launch, `post_launch_ops.md` for steady state.

---

## The real constraints

Three constraints that drive every decision below.

1. **Cold start.** No newsletter list. No existing audience over 1k anywhere. No podcast. Pure zero.
2. **Founder-led brand.** Jada's name attached, Jada's face on camera in Looms, Jada's voice in newsletter and Twitter posts. Personal brand IS the marketing.
3. **$0 marketing budget.** Pure organic for the first 60 days. No newsletter sponsorships, no paid social, no influencer outreach with budget attached.
4. **14 days from tools-live to public launch.** Move fast, polish later.

## What these constraints actually mean (no sugar-coating)

- **Expected waitlist trajectory:** 30–120 signups week 1, 150–400 by end of month 1, 400–800 by end of month 2. The original plan targeted 200 by month 2 — founder-led adds 20-40% to that trajectory because trust + face on camera + personal Looms get shared. Worth doing.
- **The "first 100 Looms" mechanic will take 4–8 weeks to fill.** That's fine — the scarcity counter ("23 of 100 spots remaining") still works.
- **One channel will work and three won't.** Don't try to run four channels lightly. Pick the spine, over-invest, treat the rest as side bets.
- **No paid sponsorships means no shortcut.** The fastest cold-start unlock is buying into Creator Wizard or a similar creator-economy newsletter. We're not doing that. So we accept the slower ramp and earn audience through tool quality + founder presence on Reddit and X.

## The bet: Reddit is the spine

For our exact constraints, Reddit is the highest-leverage channel:

- Subreddit audiences ARE creators (r/PartneredYoutube, r/CreatorEconomy, r/Twitch). No targeting required.
- Personal accounts work fine. Jada posting as Jada with a "I built this calc because..." angle reads as authentic, not promotional, when the post leads with value.
- The tools are the proof. The founder story is the trust.
- Upvote-driven distribution means good posts compound for weeks, not days.
- $0 cost.

The downside: heavy anti-promotion enforcement. Every post needs to lead with value, link only after context, and never feel like an ad. We follow the `post_launch_ops.md` Channel 1 rules strictly.

The rest of the channel mix:

- **Twitter/X — founder account, secondary.** Used mainly for reply-in-public, result-screenshot posts, and founder POV.
- **SEO — long-term seed only.** Ship the four MDX explainer pages. Don't expect traffic for 3–6 months.
- **Newsletter — retention not acquisition.** Beehiiv is for the people Reddit sends us. It doesn't get us new people.

That's the four-channel split: Reddit (acquisition primary), Twitter (acquisition secondary), SEO (acquisition delayed), Newsletter (retention).

---

## Founder voice rules

The voice spec in `docs/ai_cfo_system_prompt.md` applies everywhere user-facing. The launch sprint specifically leans into Jada's personal voice on Reddit, Twitter, newsletter, and Loom:

- Lowercase, plain language, lead with the number, honest about both sides.
- First-person on personal channels: "I missed a quarterly last year and ate a $340 penalty" reads better on Reddit than "we keep seeing creators miss this."
- Newsletter signs "— Jada." Not "— the team." Not unsigned.
- Twitter is the founder account (you'll need a handle — see launch-day checklist).
- Looms are face-on-camera. Personal. Not narrated.

Stuff to avoid even with a founder voice:
- Saying "consult a professional" — name the role (accountant, EA, lawyer).
- Implying we can move money. Read-only frame.
- Pretending to be a CPA, EA, or lawyer in the calculator outputs or Looms.

---

## Founder Loom deep-dive workflow (the "first 100" mechanic)

The original spec for this lives in `post_launch_ops.md` Channel 4. Re-stated here in summary because it's the highest-conversion mechanism on the site.

- 5–10 min personal Loom from Jada per intake. Face on camera.
- Tally form → DB write → admin email → batch recording Tuesday morning, 3–5 Looms back-to-back.
- Subject line: "your cfoforcreators deep-dive (X of 100)"
- Voice/vibe: casual, friend-looking-at-your-numbers. Lead with the number. Pause to think.

Full recording template + workflow + what NOT to do is in `post_launch_ops.md`. Don't duplicate here.

---

## The 14-day sprint schedule

### Day -7 to -3: Pre-launch prep (week before launch)

- **Day -7:** All 4 tools live on `thecfoforcreators.com`. Run yourself through every tool with 3 different scenarios. Bug-fix obvious copy/UX issues. Lighthouse audit each (≥95 mobile, A11y 100).
- **Day -6:** Write the Beehiiv welcome sequence (3 emails). See template below.
- **Day -5:** Final landing copy pass. Make sure the "first 100 video walkthrough from the founder" line is consistent across hero + offer stack + meta.
- **Day -4:** Warm Reddit account. Comment helpfully on 10–15 threads in your target subs without linking to anything. Build karma + recognition before launch.
- **Day -3:** Write your first 5 Reddit posts in advance using the brand-voice + first-person hooks from `post_launch_ops.md` Channel 1. UTM-tag every link. Save them in `docs/launch_reddit_posts.md` (drafts).

### Day -2 to 0: Final prep + launch

- **Day -2:** Test the Loom recording flow end-to-end on a fake intake. Make sure your camera setup, lighting, and audio land. Record one Loom for a test scenario to dial in pacing.
- **Day -1:** Sanity-check the spots counter shows "73 of 100" on prod. Confirm Beehiiv welcome series is firing on real signups (test with a throwaway email). Confirm the Tally form → Supabase → admin email pipeline works.
- **Day 0 — public launch:**
  - 9am ET: Post tax estimator to r/PartneredYoutube using the first-person hook ("how I figured out I owed $X in quarterly taxes after a year of just guessing")
  - 11am ET: Tweet from your founder account: "shipped the cfoforcreators tax estimator. 8 questions. tells you what you owe per quarter and what to set aside. no email gate before the result. built it because my accountant didn't know what adsense was. [link]"
  - 2pm ET: Reply to every comment on the Reddit post within an hour
  - 6pm ET: First-day check-in: how many signups? Which post drove them?

### Day 1–14: Sustained launch

| Day | Action | Channel |
|---|---|---|
| 1 | Reply to all Reddit threads from day 0 | Reddit |
| 2 | Post S-corp calc to r/CreatorEconomy | Reddit |
| 3 | Tweet founder POV: "what I learned building the s-corp calc" with screenshot of CA "no" verdict | Twitter |
| 4 | Reply-in-public on 5 Twitter threads about creator finance | Twitter |
| 5 | Post sponsor rate calc to r/podcasting | Reddit |
| 6 | Record + send the first batch of deep-dive Looms | Loom workflow |
| 7 | Send first Thursday newsletter to whatever waitlist exists | Newsletter |
| 8 | Post contract scanner to r/InstagramMarketing | Reddit |
| 9 | Tweet a screenshot of a contract scanner finding | Twitter |
| 10 | Post tax estimator to r/Twitch | Reddit |
| 11 | Reply-in-public on 5 more Twitter threads | Twitter |
| 12 | Post S-corp calc to r/youtubers | Reddit |
| 13 | Record + send the second batch of deep-dive Looms | Loom workflow |
| 14 | Day-14 retrospective: which posts converted? Which subs? Adjust week 3 plan | Metrics |

After day 14, switch to the steady-state weekly rhythm in `post_launch_ops.md`.

---

## Beehiiv welcome sequence (3 emails over 7 days)

### Email 1 — sent immediately on signup

```
Subject: you're on the list. here's a tool to try while you wait.

hey,

thanks for joining the waitlist. while i finish building the AI CFO,
i shipped 4 free tools you can use right now:

- tax estimator: what you actually owe per quarter
- s-corp calculator: whether the math works (with honest "no" verdicts)
- sponsor rate calculator: market-validated rates with Karat 2024 data
- brand contract scanner: flags risky clauses before you sign

if you haven't run one yet, the tax estimator is the highest-leverage
one to try first: https://thecfoforcreators.com/tax-estimator

reply to this email if you have a creator finance question — i read
every reply.

— jada
```

### Email 2 — sent 3 days after signup

```
Subject: why my calculators sometimes say "no"

most creator finance tools online are designed to convert you into
a customer. the math is biased toward "yes, you should do this".

mine are different. roughly half the people who run the s-corp
calculator get a "no" or "wait" answer — because the math genuinely
doesn't work for them at their income level.

this is on purpose. i'd rather tell you not to switch and be right
than push you into a 5-year IRS lockout that costs more than it saves.

run the s-corp calc and see what you get:
https://thecfoforcreators.com/scorp-calculator

if the answer surprises you, the result page has a chat — ask why.

— jada
```

### Email 3 — sent 7 days after signup

```
Subject: one question i'd love to hear back from you

i built cfoforcreators because creators kept telling me the same
thing: "my accountant doesn't know what adsense is."

the AI CFO product i'm building eventually is meant to fix that —
automatic monthly financial analysis that actually understands
creator income.

before i ship it, i want to hear from you:

what's the one financial question you wish someone would just
answer for you, with no hedging?

reply to this email. i read every one and they directly shape
what i build.

— jada
```

These three emails set the tone, drive tool engagement, and create the highest-value qualitative signal we can collect this early (the email 3 reply).

---

## What NOT to do in the launch sprint

These are the temptations that kill cold-start brands:

- **Don't post to multiple subreddits the same day.** Looks like spam. Mods notice.
- **Don't run a Product Hunt launch yet.** Audience is wrong (devs/founders, not creators). Save for a milestone.
- **Don't pitch the paid product hard in any email.** It doesn't exist yet. Talking about it constantly looks desperate.
- **Don't use generative-AI-sounding copy** anywhere customer-facing. Newsletter, Reddit, Loom scripts — all hand-written. The voice is the moat.
- **Don't cold-DM creators asking them to share** in the first 30 days. Builds nothing, burns goodwill.
- **Don't add channels.** Resist TikTok, Instagram, YouTube. Focus on Reddit. Win one channel before adding a second.
- **Don't add tools.** Sprint 4 (sponsor rate + contract scanner) is the cap for v1. Don't get distracted by LLC or retirement calculator side quests.
- **Don't iterate on tool copy in the first week.** Let real users hit the tools and tell you what's confusing. Premature polish before signal is wasted effort.
- **Don't measure success by signup count alone.** Measure (1) tool completions per visitor, (2) email gate conversion rate, (3) which subreddit converts highest, (4) which tool drives the most signups. Signup count without funnel data is a vanity metric.

---

## Realistic targets for the first 60 days

Reset expectations from the original ops plan:

| Metric | Original target | Cold-start + founder-led realistic | How to read it |
|---|---|---|---|
| Waitlist signups, end of month 1 | 100 | 80–250 | Founder POV posts + face-on-camera Looms compound faster than faceless |
| Waitlist signups, end of month 2 | 200 | 250–600 | If a single post goes Reddit-viral, this can jump |
| Tool completions / visitor | 60%+ | 40–60% | Email gate is the friction |
| Email gate conversion | 25%+ | 18–32% | First 30 days will be ugly — iterate on the post-result copy |
| Deep-dives sent (vs 100 capacity) | 100 in 6 weeks | 40–100 in 6 weeks | Face-on-camera = higher fill rate than faceless |
| Reddit posts that drive >10 signups each | 60% | 30–50% | Most posts will get 0–3 signups. Outliers carry the channel. |
| Newsletter open rate | 40%+ | 30–40% | Founder-signed gets +5pp over brand-signed on average |
| Newsletter click rate | 8%+ | 4–8% | One CTA per email helps |

If we hit the high end of all of these, we have a real business by month 3. If we hit the low end, we have signal and need to adjust the playbook.

---

## Day-15 decision tree

After 14 days, evaluate honestly. Pick the branch that matches reality:

**Branch A — Reddit is working (≥150 signups by day 14):**
- Double down. Increase to 4 posts/week.
- Start the second Twitter cadence (reply-in-public, 10/week).
- Write the next 4 weeks of newsletter subject lines in advance.
- Decide on programmatic SEO content (state-by-state pages) for month 2.

**Branch B — Reddit is mixed (60–150 signups by day 14):**
- Audit which sub + which tool combo drove the most signups.
- Cut the dead subs. Focus the next 30 days on the 2–3 highest-converting subs.
- Test guest podcast appearances (Creator Lab, Creator Science) — Jada-as-guest gets in for free and reaches creator audiences fast. Faster than paid sponsorships and free.

**Branch C — Reddit is dead (<60 signups by day 14):**
- Hard look at the tool experience. Is the value clear in the first 10 seconds on the result page?
- Get 5 creator friends to use the tools and tell you specifically what felt off.
- Consider a single founder-led YouTube short or TikTok showing a real result page walkthrough — face on camera, 60 seconds, brand-voice description. Cheap test before committing to a content channel.

We don't pre-commit to which branch we're in. We evaluate on day 14 with real data.

---

## Cross-references

- `docs/post_launch_ops.md` — steady-state weekly rhythm, channel deep-dives, full founder Loom workflow.
- `docs/cfoforcreators_buildout_plan.md` §10 — the underlying buildout assumption for paid product launch (Q1 2027).
- `docs/ai_cfo_system_prompt.md` — voice rules.
- `docs/landing_page_copy.md` — landing copy reference.
- `CLAUDE.md` — invariants. Verdict required on every tool. Mobile-first. Result URLs stable.

---

## Launch-day checklist

Print this. Tape it next to your monitor.

- [ ] All 4 tools live on prod and tested
- [ ] Landing copy reviewed — "first 100 video walkthrough from the founder" consistent everywhere
- [ ] Spots counter shows "73 of 100"
- [ ] Beehiiv welcome sequence active and tested
- [ ] Loom recording setup tested — camera framing, lighting, audio
- [ ] Reddit account warmed (15+ helpful non-promotional comments)
- [ ] First 5 Reddit posts drafted in `docs/launch_reddit_posts.md`
- [ ] UTM template doc created (or just memorize: `?utm_source=reddit_{sub}&utm_medium=organic&utm_campaign={tool}`)
- [ ] Twitter handle decided + Footer.tsx updated
- [ ] Day 0 9am ET first Reddit post scheduled

Go.
