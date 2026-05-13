# Project Decisions — fill these in before kicking off the overnight run

These are the placeholder-friendly decisions Claude Code can't make for you. Fill in what you know now; leave `TODO` for anything you want to swap in later.

## Brand identity

- **Brand name:** CFO for creators
- **Domain:** cfoforcreators.com
- **Primary color:** TODO (hex code, e.g., `#0A2540`. If unsure, write `use Tailwind defaults` and refine later.)
- **Accent color:** TODO (hex code)
- **Logo:** TODO (SVG path in `public/logo.svg`, OR text-only wordmark "CFO for creators")
- **Font preferences:** Inter (default) — change if you have strong opinion

## Founder identity

- **Founder name:** TODO (full name as it'll appear on the founder note + email signature)
- **Founder title:** Founder
- **Founder photo:** TODO (path in `public/founder.jpg` — square, ≥400x400. Skip and use placeholder if not ready.)
- **Founder bio (1–2 sentences):** TODO

## Contact

- **Founder reply email:** TODO (where waitlist replies go — e.g., `jada@cfoforcreators.com` once Resend domain is verified)
- **Twitter / X handle:** TODO (e.g., `@jadamclean`)
- **LinkedIn URL:** TODO (optional)

## Launch + offer

- **Launch target date for paid AI CFO:** TODO (e.g., "Q1 2027" or "Spring 2027" — used in the FAQ)
- **Founding member offer:** TODO (recommend: "50% off year one, locked in for life")
- **Founder deep-dive spots:** 100 (default — change only if you have a strong reason)

## Tally form

- **Tally form URL for founder deep-dive intake:** TODO (you'll build this in Tally and paste the URL here. Spec is in `docs/founder_deepdive_intake_form.md`.)

## Admin

- **Admin password (for the password-gated stats dashboard):** TODO (something simple but not guessable — set as `ADMIN_PASSWORD` in `.env.local` too)

---

## How to use placeholders during the overnight run

If a field is `TODO` when you kick off Claude Code, that's fine. CC will use sensible placeholders:
- Brand name → "CFO for creators"
- Colors → Tailwind slate + indigo defaults
- Founder name → "[Founder Name]"
- Founder photo → silhouette placeholder
- Twitter → omitted
- Launch date → "Coming soon"

Swap real values in tomorrow morning when you're awake. Search the codebase for `[Founder Name]` etc. to find the placeholder spots fast.
