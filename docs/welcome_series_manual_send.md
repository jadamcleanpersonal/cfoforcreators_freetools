# Welcome Series — Manual Send Workflow

While the waitlist is under 25-50 signups, we manually send 3 welcome emails to each new subscriber. High-touch, builds personal connection. Auto-switch to Beehiiv Scale or Resend-driven automation once volume is past ~25/week.

**Trigger:** every "new waitlist signup" notification email that lands in `shanice.jada@gmail.com`.

## Gmail label workflow (one-time setup, 5 min)

1. Open Gmail → Settings (gear) → See all settings → **Labels** tab
2. Create 3 new labels:
   - `welcome-1-sent`
   - `welcome-2-sent`
   - `welcome-3-sent`
3. Settings → **Filters and Blocked Addresses** → **Create a new filter**
4. Filter 1: `from:noreply@thecfoforcreators.com subject:"new waitlist signup"` → click Create → apply label `waitlist-signup` + skip inbox = NO (you want to see them)
5. Optional Filter 2 for Email 2 reminders: nothing automated — you'll manually check your Sent folder weekly

## Per-signup workflow (~90 seconds per signup)

When a "new waitlist signup" notification lands in your Gmail:

1. Open it
2. Note the signup's email + first name from the notification body
3. Copy Email 1 from this doc, paste into a new Gmail Compose, replace `[name]` with their first name
4. Send to the signup's email address
5. Apply label `welcome-1-sent` to the ORIGINAL notification email (so you can track who's gotten what)
6. Done. Total: ~90 seconds.

For Email 2 (3 days later) and Email 3 (7 days later), once a week scan your Gmail Sent folder for `welcome-1-sent` labels from 3 and 7 days ago, send the next email, apply the next label.

---

## Email 1 — send within 30 min of signup notification

**Subject:**

```
you're on the list. here's a tool to try while you wait.
```

**Body:**

```
hey [name],

thanks for joining the waitlist. while i finish building the AI CFO, i shipped 4 free tools you can use right now:

- tax estimator: what you actually owe per quarter
- s-corp calculator: whether the math works (with honest "no" verdicts)
- sponsor rate calculator: market-validated rates with Karat 2024 data
- brand contract scanner: flags risky clauses before you sign

if you haven't run one yet, the tax estimator is the highest-leverage one to try first: https://thecfoforcreators.com/tax-estimator

reply to this email if you have a creator finance question — i read every reply.

— jada
```

---

## Email 2 — send 3 days after Email 1

**Subject:**

```
why my calculators sometimes say "no"
```

**Body:**

```
hey [name],

most creator finance tools online are designed to convert you into a customer. the math is biased toward "yes, you should do this".

mine are different. roughly half the people who run the s-corp calculator get a "no" or "wait" answer — because the math genuinely doesn't work for them at their income level.

this is on purpose. i'd rather tell you not to switch and be right than push you into a 5-year IRS lockout that costs more than it saves.

run the s-corp calc and see what you get: https://thecfoforcreators.com/scorp-calculator

if the answer surprises you, the result page has a chat — ask why.

— jada
```

---

## Email 3 — send 7 days after Email 1 (most important email)

**Subject:**

```
one question i'd love to hear back from you
```

**Body:**

```
hey [name],

i built cfoforcreators because creators kept telling me the same thing: "my accountant doesn't know what adsense is."

the AI CFO product i'm building eventually is meant to fix that — automatic monthly financial analysis that actually understands creator income.

before i ship it, i want to hear from you:

what's the one financial question you wish someone would just answer for you, with no hedging?

reply to this email. i read every one and they directly shape what i build.

— jada
```

**This is the email that returns gold.** Save every reply in a "voice of customer" doc. Real customer language for future landing page copy, future tool features, future newsletter topics. Don't skip this one even if signups slow.

---

## When to upgrade to automation

Switch from manual to automated welcome series when ANY of these is true:

1. You're getting 5+ signups per day (manual sends become a real time sink)
2. You've crossed 50 total signups (the first batch are sent, scale is real)
3. You miss sending Email 2 or 3 to anyone (the manual tracking has broken down)

At that point, two paths:

**Path A — Build in Resend** ($0): Enhance `src/lib/resend.ts` with a `sendWelcomeEmail1/2/3` set of functions. Wire Email 1 to fire automatically from `/api/waitlist/route.ts` immediately after signup. Add a cron job (Vercel cron or a Supabase Edge function) that runs daily, queries the `waitlist` table for signups 3 and 7 days old, sends Emails 2 and 3. ~3 hours of agent work for clean implementation.

**Path B — Upgrade Beehiiv to Scale** ($39/mo): Paste these 3 emails into Beehiiv's Automations UI, configure 0-day/3-day/7-day delays, toggle on. Cleanest UI, $39/mo ongoing.

Recommend Path A unless you specifically want Beehiiv's editor for A/B testing or branching later.

---

## Voice of Customer log

Every Email 3 reply that arrives, copy verbatim into `docs/voice_of_customer.md` (create the file when the first reply lands). Include date, signup email, the question they asked. This becomes the most valuable qualitative dataset you have.
