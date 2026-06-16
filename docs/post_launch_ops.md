# Post-Launch Ops Playbook

Once the foundation + the four-tool suite is shipped, this is what you do every week to convert waitlist signups into paying members of the AI CFO product. This is the operating system for the first 6 months — until the paid product launches.

**Time budget for this playbook: ~8-10 hours/week.** If it's eating more, prune.

---

## The weekly rhythm

| Day | Activity | Time |
|---|---|---|
| Monday | Reddit posts (2-3 subreddits) + reply to last week's threads | 90 min |
| Tuesday | Founder deep-dive Loom recordings (batch 3-5 intakes) | 90 min |
| Wednesday | Write the Thursday newsletter | 60 min |
| Wednesday | Write the week's MDX content piece | 90 min |
| Thursday | Send newsletter, post to Twitter, schedule next week's Reddit | 30 min |
| Friday | Review PostHog funnel + Supabase numbers, adjust | 30 min |
| Saturday/Sunday | OFF (but check waitlist daily, ~5 min) | 35 min total |

That's ~8 hours of focused work plus ~30 min of daily ambient checking. Anything more than this is over-investment for pre-paid-launch traffic.

---

## Channel 1 — Reddit (the primary growth engine for v1)

Reddit is the single highest-leverage channel for creator products because the upvote system surfaces value automatically and the audience is exactly our target customer. The downside: every subreddit has anti-promotion rules that bite hard if violated.

### Primary subreddits (rank-ordered by fit)

1. **r/PartneredYoutube** (220k+ members) — YouTubers in Partner Program. Most engaged with the tax estimator + S-corp calc.
2. **r/CreatorEconomy** (90k+ members) — broad creator finance topics. S-corp + sponsor rate get traction here.
3. **r/youtubers** (170k+ members) — broader than Partnered. Tax estimator posts well.
4. **r/Twitch** (1M+ members) — for the tax estimator specifically (Twitch streamers face the same 1099 questions).
5. **r/podcasting** (200k+ members) — sponsor rate calc lands here.
6. **r/InstagramMarketing** (50k+ members) — sponsor rate calc.
7. **r/tiktokhelp** (100k+ members) — sponsor rate + tax estimator.
8. **r/freelance** (250k+ members) — tangential but tax estimator + S-corp calc apply broadly. Use sparingly — they're not creator-specific.

### The posting pattern (DO NOT VIOLATE)

The pattern that works long-term on Reddit is: **lead with value in the post body, link in a comment OR after they've upvoted, never above the fold without context.**

Bad post (looks promotional, gets removed):
> "Hey YouTubers, check out this free quarterly tax calculator I built for creators: cfoforcreators.com/tax-estimator"

Good post (leads with value, mod-friendly):
> "TIL the IRS quarterly deadline for Q3 is Sept 15, not Sept 30. I missed it last year and ate a $340 underpayment penalty. Built a calculator that figures out exactly what you owe each quarter accounting for sponsor income, AdSense, and Patreon all together — sharing in case anyone else is panicking like I was. [linked in comments — mods, this is a tool I built but it's free with no signup wall]"

Then in a top comment: "Direct link if useful: [URL]. No email gate before the result — you see the number, then decide if you want to save anything."

Mods on r/PartneredYoutube and r/CreatorEconomy are okay with self-promotion when the value is clear AND there's no email gate before the value reveal. This is why we built the tools with the email gate AFTER the result, not before. Don't break that pattern.

### Post hooks (use these as templates)

For the tax estimator:
- "TIL the IRS quarterly deadline for Q[X] is [date]. Built a calc that figures out what creators specifically owe."
- "How I figured out I owed $[amount] in quarterly taxes after a year of just guessing. Calc inside the comment."
- "$0 in withholding + $[X] in creator income = a tax problem most YouTubers don't see coming until April."

For the S-corp calc:
- "Spent 3 hours doing the S-corp math last week. Then built a calculator so I never have to do it again. Honest 'no' verdict for [State] creators under $80k."
- "S-corp election is a 5-YEAR commitment. Here's a calc that tells you when you actually shouldn't switch yet (not the same as Bizee/Collective's pitch)."
- "Niche-specific reasonable salary calculator for creators — finance niche needs to defend a higher number than lifestyle. Wish I'd known."

For the sponsor rate calc:
- "Tired of seeing creators undercharge for sponsorships. Built a calc that uses Karat 2024 data + tells you when you're charging too HIGH too (most calcs only ever say 'charge more')."
- "Validating my sponsor rate against Karat data after I almost said yes to $1,200 for an integration I should have charged $4,500 for."

For the contract scanner:
- "Almost signed a brand deal with a perpetual rights clause until I ran it through a scanner. Sharing in case anyone else has a contract in flight."
- "Made an AI tool that flags risky clauses in brand contracts. Not legal advice — just translates the lawyer-speak so you know what to push back on."

### Reply patterns

When someone replies "this is great, do you have anything for [X topic we don't cover]?" — don't make up an answer or pretend. Honest reply: "Not yet. The four tools we have right now are tax estimator, S-corp calc, sponsor rate, contract scanner. The waitlist gets early access to the paid version which will cover [X]." Honest "we don't have that yet" is brand-on.

When someone disagrees with a verdict ("I'm in CA at $70k profit and switched to S-corp and saved money") — engage genuinely: "Interesting — what was your reasonable salary? The calc may be too conservative on CA's $800 + 1.5%. If you want to share your numbers I'd love to refine the model." This is gold for the calculator AND it shows you're not defensive.

### Posting cadence

- 2-3 posts per week across the 8 subreddits
- Don't post the same tool to the same subreddit within 30 days
- Don't post to multiple subreddits the same day (looks like spam)
- Pick the tool that matches the moment (Q3 tax deadline → tax estimator week, brand-deal season → contract scanner week)
- Track which posts convert via PostHog UTM tags (set `utm_source=reddit_partneredyoutube` etc.)

---

## Channel 2 — Twitter / X

Lower-leverage than Reddit (algorithm doesn't favor links) but useful for screenshotted-result virality and for building Jada's founder presence.

### What works on X

- **Screenshot the verdict, not the URL.** "Just figured out I owe $9,400 by Jan 15 and my calc confirmed it's because of the AdSense spike in October" with a screenshot of the result page gets retweeted. A bare URL doesn't.
- **Founder POV posts.** "Building cfoforcreators.com because I watched too many creators get blindsided by IRS letters in April. Just shipped the S-corp calc — it'll tell you to NOT switch if the math doesn't work, which is unusual." This builds trust over time.
- **Reply-in-public to people asking creator finance questions.** Search "1099" + "creator", "S-corp" + "youtube", "quarterly taxes" + "twitch". Reply with the relevant tool URL + a one-sentence personalization. This earns more than posts.

### Cadence

- 3-4 founder-POV posts per week (build the founder brand)
- 5-10 reply-in-public per week (the conversion mechanism)
- 1 "ship update" post per week ("just added [feature]")
- 0-1 thread per week (longer-form opinion piece tied to a tool)

Don't run paid ads on X for v1. The audience is too broad and CPC is too high.

---

## Channel 3 — Beehiiv newsletter (Thursday cadence)

The newsletter is the conversion mechanism for warm waitlist signups. People who joined the waitlist via a tool result get added to Beehiiv automatically (sprint 1 sets this up). The newsletter keeps them engaged until the paid product launches.

### Voice

Match the brand voice (see CLAUDE.md): lowercase, plain language, honest about both sides, lead with the answer. The newsletter is just longer-form AI CFO voice.

### Structure (every Thursday — keep it consistent)

```
Subject: [hook tied to the deadline or topic this week]

(no greeting, just start)

This week's big thing:
[2-3 sentences on the most important creator-finance topic of the week. Tax deadline? Tax estimator. Q4 earnings season? S-corp calc. Brand deal season? Contract scanner.]

What I'm building:
[1 paragraph on what shipped this week + what's coming. Honest, no overpromising.]

A useful number:
[A real number from the data — "the median sponsor rate for a 100k YouTube tech integration is $4,200" or "47% of S-corp calc users in California got a NO verdict — here's why" — this is the most-clicked section over time]

Tool of the week:
[Link to one tool with a one-sentence reason creators should run it this week. Tie to the calendar — Sept = quarterly tax, March = S-corp election deadline, etc.]

Reply if:
[A question or invitation to reply. "What's the one financial question you wish someone would just answer for you?" — this is how Jada finds product themes AND turns subscribers into deep-dive intakes.]

—Jada
```

### Subject line patterns

- "[Tax estimator] $9,400 due in 11 days"
- "[S-corp] don't switch in California"
- "[Sponsor rate] you're charging too little"
- "[Brand contract] the perpetual rights clause is back"

Treat the subject line as the most important sentence — it's the only thing 70% of subscribers will see.

### Don't include

- "How are you?" / "Hope your week's going well"
- More than one CTA per email (always one tool, never two)
- Stock photos
- Long preamble before the value
- "P.S. share this with a friend" — never works, makes you look like you're selling

### Cadence

Thursday. Same time every week. Build the habit. Skip a week if you don't have something real to say — better to send 40 strong emails than 52 weak ones.

---

## Channel 4 — Founder Deep-Dive Loom workflow (the first 100 offer)

This is the highest-conversion mechanism on the site. The first 100 waitlist members get a personalized 5-10 minute Loom from Jada reviewing their actual numbers and answering their 3 specific questions from the Tally intake form.

### Why this works

- Creators who fill the Tally form are already deeply qualified (they shared income data, niche, state, current setup)
- A personalized Loom is unrelated-to-AI proof that someone real is paying attention to their numbers
- It's the experience the paid product will eventually deliver via the AI CFO — a working preview
- Word of mouth is high: "I got a personalized Loom from the founder breaking down my tax situation" gets shared
- Spots counter creates scarcity ("23/100 spots left") which drives more form fills

### The workflow

```
1. Tally form fill → webhook → DB write (deepdive_intakes table) → admin email to Jada + Beehiiv tag added
2. Daily check (~5 min): review new intakes in /admin (password gated, sprint 1 implementation)
3. Batch recording (Tuesday morning): record 3-5 Looms back-to-back
4. Send each Loom via the email with subject: "your cfoforcreators deep-dive (X/100)"
5. Mark sent in /admin → updates the spots counter
6. Follow up 7 days later if no response: "did this land? curious which part of it was most useful"
```

### Recording template (5-10 min, NEVER longer)

```
[0:00-0:30] Intro
"Hey [name], jada here. This is your cfoforcreators deep-dive.
You're spot [X] of 100. The fact that you filled out the form
means you actually want the help, so I'm going to skip the
preamble and just walk through your numbers."

[0:30-2:00] Their numbers, summarized back
"You're at [X] in creator income across [platforms], with
[Y] in expenses, in [state]. You're on [entity type]. The
big patterns I see are [1-2 patterns from their income breakdown]."

[2:00-5:00] Their 3 specific questions, answered
"Question 1 was [X]. Here's the honest answer..."
"Question 2 was [Y]. Here's what I'd actually do..."
"Question 3 was [Z]. [Real answer, including 'I don't know' if true]"

[5:00-7:00] One thing they didn't ask
"One thing I noticed you didn't ask about that you maybe should:
[the most impactful financial move for THEIR specific situation]"

[7:00-8:00] Wrap
"That's it. The waitlist is for the AI CFO product launching
[date] — that'll do this same kind of analysis monthly,
automatically. Reply if you have follow-up questions, I read
every one. If you want to bump higher in the queue when we launch,
share cfoforcreators.com with another creator and forward me
the share."
```

### Voice / vibe for the Loom

- Casual, not performative. You're a friend looking at their numbers.
- Don't read off the screen. Be in the camera most of the time.
- Pause to think on hard questions. Don't pretend to know what you don't know.
- Lead with the number, then the reasoning (same as the AI CFO voice).
- If the answer is "talk to a CPA," say it directly. Don't pretend a Loom is legal advice.

### What NOT to do in the Loom

- Pitch the paid product hard (the offer at the end is enough)
- Promise specific savings ("you'll save $X")
- Recommend specific people / firms by name
- Use jargon
- Go longer than 10 minutes (people don't watch past 7 — frontload the value)

### Case study permission

The Tally form asks if you can use their numbers in a case study (anonymized). For those who say yes, save a clip of the most insightful 30 seconds for use in:
- Newsletter (Tuesday case study section)
- Twitter (screenshot of the result page)
- A future "founder deep-dives" landing page section showing real outcomes

---

## Metrics dashboard

Check these in PostHog + Supabase. Set up a weekly review in your calendar.

### Weekly review (Friday, 30 min)

| Metric | Target | How to read it |
|---|---|---|
| New waitlist signups this week | 50+ by month 2, 200+ by month 6 | Supabase: `select count(*) from waitlist where created_at > now() - interval '7 days'` |
| Tool completions per tool | Track which tool drives the most waitlist conversions | PostHog: `tool_result_shown` event by `tool_slug` property |
| Email gate conversion rate | >25% (industry: 8-15%) | PostHog funnel: `tool_result_shown` → `email_submitted` |
| Reddit click-through rate | >3% on posts that linked | UTM tracking via PostHog |
| Newsletter open rate | >40% (industry: 25%) | Beehiiv dashboard |
| Newsletter click-through rate | >8% (industry: 2-4%) | Beehiiv dashboard |
| Tally form fills (deep-dive intakes) | Until 100, then transition to scheduled | Supabase: `select count(*) from deepdive_intakes` |
| Loom-to-reply rate | >50% | Manual tracking in /admin |

### Monthly review (1st Friday of the month, 90 min)

- Lighthouse audit on all tool pages (must stay ≥95 mobile)
- Review which subreddits had highest conversion
- Prune Beehiiv inactive subscribers (>60 days no opens)
- Review founder Loom case studies — are they consistent quality?
- Check the AI CFO follow-up chat logs — any concerning outputs? (Langfuse if wired up, otherwise spot-check via Supabase)

### Quarterly review (90 min)

- Update niche salary benchmarks if new BLS data dropped
- Update sponsor rate benchmarks if Karat or IMH released new data
- Update state tax brackets for the new tax year
- Re-run all the unit tests to make sure no data has gone stale

---

## Content cadence

1 MDX content piece per week. Ship Wednesday, link from the newsletter Thursday.

Topics in priority order (the first 12 weeks):

1. How quarterly taxes actually work (already in sprint 2)
2. Should you switch to an S-corp? (already in sprint 3)
3. How to price a brand deal (already in sprint 4a)
4. How to read a brand contract (already in sprint 4b)
5. Do you need an LLC as a creator? (the demoted LLC tool — content only)
6. Solo 401k vs SEP IRA vs Roth IRA for creators (the demoted retirement tool — content only)
7. The 5 IRS audits creators trigger most often
8. State-by-state guide to creator income tax (the first programmatic SEO piece — splits into 50 state-specific pages)
9. Brand exclusivity windows: what's standard, what to push back on
10. The Net 30 / Net 60 / late payment playbook for creators
11. Multi-platform creator income: how to track it for taxes
12. The end-of-year creator finance checklist

After week 12, switch to programmatic SEO mode: 50-state pages on tax brackets, niche-platform sponsor rate pages, etc. Buildout plan §10 has the structure.

### Content voice

Same as the AI CFO. Plain language. No jargon. Lead with the answer. Honest about both sides. Sometimes the answer is "you don't need to do this."

### Content distribution

- Send via Thursday newsletter (always)
- Post to Reddit in the relevant subreddit on Monday following ship
- Post a thread on Twitter Tuesday following ship
- Cross-link from the relevant tool's result page (`/learn/<slug>`)
- After 3 months: bundle into a free PDF for the waitlist ("the cfoforcreators creator finance handbook")

---

## Waitlist milestone playbook

### 0–100 signups

- The founder deep-dive Loom offer is OPEN — fill it
- Every signup gets a personal welcome reply from Jada (1 min/signup, builds the relationship)
- Reddit posts 3x/week minimum
- Newsletter weekly

### 100–500

- Founder deep-dive offer CLOSES — gates above 100 (form returns "spots full, join waitlist")
- Replace deep-dive with a "first 100 case studies" landing section that shows anonymized results
- Add a referral program: "share cfoforcreators.com with another creator, get bumped to the front of the paid product launch queue"
- Reddit posts 2x/week
- Newsletter weekly

### 500–2000

- Start the paid product beta waitlist as a SEPARATE list (people who would pay vs people who just want the free tools)
- Add lead scoring in Beehiiv: high-engagement subscribers tagged for early beta invites
- Newsletter weekly
- Start guest podcast appearances (the Creator Lab podcast, Creator Science, etc.)

### 2000+

- Move from "waitlist" framing to "launching soon" framing
- Pre-sell founding member access (50% off year one, locked in for life — pricing in `docs/decisions.md`)
- Send the soft launch email at 5,000 signups
- Hit "open the doors" at 10,000 OR Q1 2027, whichever comes first

---

## What to do RIGHT NOW (your day-1 ops checklist)

After sprint 4 (both tools) ships and you have all four free tools live:

- [ ] Set up the Beehiiv welcome sequence (3 emails over 7 days, the first one same day as signup)
- [ ] Write 12 weeks of newsletter subject line drafts in advance — it's the highest-leverage prep work
- [ ] Create the UTM tracking template doc so every Reddit/Twitter link is tagged
- [ ] Schedule weekly Loom recording block on Tuesdays
- [ ] Bookmark the PostHog dashboard
- [ ] Bookmark the Supabase /admin route for the spots counter view
- [ ] Set up a Tuesday calendar reminder: "record this week's Looms"
- [ ] Set up a Wednesday calendar reminder: "write Thursday newsletter"
- [ ] Set up a Friday calendar reminder: "weekly metrics review"
- [ ] Decide on a Twitter handle if you haven't (update Footer.tsx placeholder)

That's the operating system. Run it for 6 months. Then evaluate.
