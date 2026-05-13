const FEATURES = [
  {
    headline: "Tells you exactly what to set aside for taxes",
    body: "Every time a payment hits, based on your real numbers and your state.",
  },
  {
    headline: "Forecasts your cash flow",
    body: "30 / 60 / 90 days out across every platform you use.",
  },
  {
    headline: "Tracks every brand invoice",
    body: "Who paid, who's late, who needs a follow-up today.",
  },
  {
    headline: "Categorizes your business write-offs automatically",
    body: "So tax season isn't a 3-day reconstruction project.",
  },
  {
    headline: "Models the big decisions",
    body: "Should you switch to S-corp? When can you afford to hire an editor? Will the bank approve your mortgage as a YouTuber?",
  },
  {
    headline: "Drafts the work for you",
    body: "Invoices, follow-up emails, accountant briefs, IRS payment instructions. You click send.",
  },
  {
    headline: "Talks to you in plain English",
    body: "No jargon. No deflection.",
  },
];

export default function WhatItDoes() {
  return (
    <section className="py-12 space-y-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">the AI CFO, in plain english</h2>

      <p className="text-base text-ink-muted leading-relaxed">
        Once it&apos;s connected to your accounts (Plaid, YouTube, Patreon, Twitch &mdash;
        read-only):
      </p>

      <ul className="space-y-4">
        {FEATURES.map((f) => (
          <li key={f.headline} className="flex items-start gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
            <span className="text-base text-ink leading-relaxed">
              <strong>{f.headline}</strong> &mdash; {f.body}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-base text-ink-muted leading-relaxed border-l-2 border-brand pl-4">
        It&apos;s not a bank. It&apos;s not a CPA. It&apos;s not a budgeting app. It&apos;s the
        financial operator that sits between you and the real professionals &mdash; making sure they
        have what they need and making sure you know what&apos;s actually going on.
      </p>
    </section>
  );
}
