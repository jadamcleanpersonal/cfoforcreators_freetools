# Founder Deep-Dive — Intake Form Spec

The form a creator fills out after claiming one of the 100 founder deep-dive spots. Designed to take ≤5 minutes to complete and give the founder enough context to record a useful 8–12 minute Loom within 48 hours.

Built in Tally / Typeform / similar (no engineering needed for v0).

---

## Form structure

### Pre-filled (from waitlist signup)
- Name
- Email

If they're claiming the spot from the waitlist confirmation page, these come along automatically — don't re-ask.

---

### Section 1 — About your channel (90 seconds)

**Q1.** What's your main platform? *(required, single select)*
- YouTube (long-form)
- YouTube Shorts
- TikTok
- Twitch
- Instagram
- Patreon / Substack
- Podcast
- Other

**Q2.** What's your niche or topic? *(required, short text — single line)*
*Placeholder: "Personal finance, fitness, gaming, beauty, etc."*

**Q3.** How many subscribers / followers on your main platform? *(required, single select)*
- Under 10,000
- 10,000 – 50,000
- 50,000 – 200,000
- 200,000 – 1M
- 1M+

**Q4.** How long have you been doing this? *(required, single select)*
- Side hustle, day job is primary
- Less than a year full-time
- 1–3 years full-time
- 3–5 years full-time
- 5+ years full-time

---

### Section 2 — Your money picture (60 seconds — and the qualifying question lives here)

**Q5.** Roughly what are you bringing in per month from creator work right now? ⭐ QUALIFYING ⭐ *(required, single select)*
- Under $1,000 / month
- $1,000 – $3,000 / month
- $3,000 – $10,000 / month
- $10,000 – $30,000 / month
- $30,000 – $100,000 / month
- Over $100,000 / month

> **Branching logic:** if they pick "Under $1,000 / month," skip to the friendly redirect screen (see below). Don't submit them to the founder queue — these creators are too early and the deep-dive won't be useful for either side.

**Q6.** Where's your income actually coming from? Check all that apply. *(required, multi-select)*
- YouTube AdSense
- TikTok Creativity Program / TikTok Shop
- Brand deals / sponsorships
- Patreon / channel memberships
- Twitch subs / bits
- Affiliate marketing (Amazon, Impact, ShareASale, etc.)
- Merch
- Courses / digital products / ebooks
- Coaching / consulting / 1-on-1 services
- Other (specify) *(text field if selected)*

**Q7.** What state do you live in? *(required, single select — US states dropdown + "Outside the US")*

> **Branching logic:** if "Outside the US," show note: "Heads up — our v1 is built for US tax rules. We can still review your situation but the recommendations may need to be confirmed with a local accountant. Continue?"

---

### Section 3 — Current setup (60 seconds)

**Q8.** How are you set up legally right now? *(required, single select)*
- Just me (no LLC — sole proprietor)
- I have an LLC
- I have an LLC that elected S-corp
- I have a corporation
- Not sure
- Outside the US — different system

**Q9.** Do you currently work with an accountant? *(required, single select)*
- Yes, regularly throughout the year
- Yes, but only for tax season
- No, I do my own taxes
- No, and I know I should
- I have one but they don't really get creator income

**Q10.** Are you set up to pay quarterly estimated taxes? *(required, single select)*
- Yes, on schedule
- Sometimes, but inconsistently
- No, I just pay everything in April
- No idea what that means

---

### Section 4 — What you actually want (90 seconds — the most important section)

**Q11.** What are your top 3 financial questions right now? *(required, three text areas)*

> Placeholder text:
> - "Should I switch to S-corp this year?"
> - "What should I be charging for sponsors?"
> - "How much do I need to save for retirement at my income?"
> - "Why is my YouTube revenue different from what's hitting my bank?"
> - "Can I afford to hire an editor full-time?"

- Question 1: *[text area, max 250 chars]*
- Question 2: *[text area, max 250 chars]*
- Question 3: *[text area, max 250 chars]*

**Q12.** Anything else about your situation you want me to know? *(optional, text area)*
*Placeholder: "Big sponsor deal coming, recently moved states, considering quitting day job, etc."*

---

### Section 5 — Logistics (30 seconds)

**Q13.** How would you prefer to receive your deep-dive? *(required, single select)*
- 🎥 Video (Loom — recommended, you can rewatch anytime) — default selected
- 📝 Written response
- Either is fine

**Q14.** Permission to use anonymized highlights from your situation as a case study? *(optional, single select — doesn't affect your deep-dive either way)*
- ✅ Yes, anonymized only
- ✅ Yes, you can mention my name + channel
- ❌ No, please keep this private

---

### Submit screen

> ## You're in. We'll be back within 48 hours.
>
> [Founder name] is going to record your personalized deep-dive within the next 2 business days. It'll come from [founder email] — keep an eye on your inbox.
>
> While you wait, here are the things we've already published you might want to dig into:
>
> - 🧮 [S-corp savings calculator]
> - 📊 [Sponsor rate benchmark]
> - 📚 [Retirement account chooser]
> - 📰 [Read the most recent newsletter]
>
> See you soon.

---

## Branching: The "you're too early" redirect

If Q5 = "Under $1,000 / month," show this instead of the standard submit:

> ## You're earlier in your creator journey than the deep-dive is built for — but you're exactly the right person for the free tools.
>
> The founder deep-dives are designed for creators making at least a few thousand a month, where decisions like S-corp election, retirement contributions, and sponsor pricing are real choices on the table. At earlier stages, the answers are simpler — you don't need a 10-minute video to know to set aside 30% for taxes and avoid mixing personal and business money.
>
> Here's what's most useful for you right now (all free, none of them gated):
>
> - 🧮 [S-corp savings calculator] — bookmark this for when you're at $60k+ profit
> - 🧮 [LLC chooser] — most useful when you're at $1–5k/month consistent
> - 🧮 [Retirement account chooser] — works at any income
> - 📅 [Tax deadline reminders] — never miss a quarterly payment
>
> You're still on the waitlist, and you'll get the same founding member pricing at launch. When you cross $3k/month consistent, come back and we'll set you up for a deep-dive.
>
> [ Take me to the tools → ]

This is honest, doesn't make them feel rejected, keeps them in the broader waitlist, and protects the founder's time for the creators where the deep-dive will actually be useful.

---

## How the founder gets notified

When a qualified intake comes in:

1. **Auto-email to the founder** with the full form contents formatted neatly:

   > **New deep-dive request from [name]**
   >
   > **Channel:** [platform] / [niche] / [followers]
   > **Income tier:** [Q5 answer]
   > **Income mix:** [Q6 answers]
   > **State:** [Q7]
   > **Current setup:** [Q8] / Accountant: [Q9] / Quarterly: [Q10]
   >
   > **Their 3 questions:**
   > 1. [Q11.1]
   > 2. [Q11.2]
   > 3. [Q11.3]
   >
   > **Other context:** [Q12]
   >
   > **Delivery preference:** [Q13]
   > **Case study permission:** [Q14]
   >
   > **Reply deadline:** [today + 2 business days]
   >
   > **[ Open in tracker → ]**

2. **Auto-confirmation to the creator** (immediately after submit):

   > Subject: Your deep-dive is in the queue, [first name]
   >
   > Got your intake. [Founder name] will record your personalized deep-dive within the next 48 hours and send it to this email address.
   >
   > In the meantime, you'll start getting the weekly creator finance newsletter and your state-specific tax deadline reminders. First newsletter goes out [day].
   >
   > Talk soon,
   > [Founder name]

3. **Tracker:** every intake also lands in a Notion / Airtable / Google Sheet with these columns:

   | Submitted | Name | Email | Channel | Income tier | State | Status | Loom URL | Date sent | Notes |

   Status options: `new` → `recording` → `sent` → `replied` → `closed`

   This is the founder's queue. Aim to keep `new` count under 10 (so nothing waits more than 5 days).

4. **Optional: Slack ping** to the founder's #deep-dive channel for new submissions, if your team uses Slack. Title format: `🎯 [Name] · [Income tier] · "[Q11.1]"` so the founder can see at a glance whether it's worth pulling forward.

---

## Spots counter — how it works

The "73 of 100 spots remaining" counter on the landing page is backed by:

- Total cap: 100 (configurable in admin / env var)
- Used: count of completed intakes (NOT just waitlist signups — they have to fill out the intake form to count)
- Remaining = 100 − used, displayed publicly

When `remaining = 0`:
- The founder deep-dive section on the landing page changes to: "All 100 founder deep-dive spots have been claimed. Join the waitlist for everything else (newsletter, tax reminders, founding pricing, early access)."
- The intake form URL returns a "spots filled" message and routes them back to standard waitlist signup.

Configure the cap to be slightly conservative (e.g., 80 if the founder genuinely only has bandwidth for 80) so you have headroom if you decide to reward referrals or VIPs with extra spots.

---

## Founder workflow (the human side)

Suggested cadence to keep this sustainable:

- **Block 2 hours, twice a week** (e.g., Tuesday + Friday mornings) on the calendar exclusively for deep-dives.
- In each block: review 4–6 new intakes, record 4–6 Looms, send within the same session.
- **Per Loom:** ~15 min review their numbers + research state specifics → ~10 min recording → ~5 min send + log.
- **Cap at 8 Looms/week max.** Better to space out and stay sharp than burn out.
- **After each Loom:** spend 2 min adding 3 bullet points to a shared "what I learned" doc. Three months in you'll have ~100 high-quality customer research notes.

---

## What's NOT in the form (intentionally)

A few things we deliberately don't ask:

- **Specific dollar amounts.** Income tier ranges are enough for the founder to calibrate the deep-dive. Asking for exact dollars feels invasive at this stage and lowers completion rates.
- **Bank account info / connection requests.** This is pre-product. We're not connecting Plaid for the deep-dive — the creator just shares context in their answers.
- **Long open-ended text fields.** "Tell us about your business" prompts get skipped. Specific questions get answered.
- **Phone number.** Email is enough. Phone collection drops conversion 20%+ and gives nothing useful at this stage.
- **NDA / legal terms.** The deep-dive is informal advice, not professional consulting. Don't make it feel like a legal engagement.

---

## What this form will tell you (besides the deep-dive itself)

After 30–50 submissions, the data set itself becomes valuable:

- **Income distribution of your warm audience** — are most signups at $3k or $30k? Big strategy implications.
- **Most common questions** — Q11 answers will cluster. The top 5 questions become your highest-priority free tools and content topics.
- **State distribution** — guides which state-specific content to prioritize.
- **Niche distribution** — guides who to target with paid acquisition later.
- **Setup distribution** — helps size the "should I form an LLC / S-corp" market within your audience.

Suggested: every Friday, the founder spends 15 minutes scanning the week's intakes for patterns. Those patterns directly inform what to build next.
