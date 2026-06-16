const FEATURES = [
  {
    headline: "tells you what to save for taxes every time you get paid",
    body: "your real numbers, your state.",
  },
  {
    headline: "shows you what's coming in over the next 30, 60, 90 days",
    body: "across every platform.",
  },
  {
    headline: "tracks every brand deal",
    body: "who paid, who's late, who needs a nudge today.",
  },
  {
    headline: "sorts your write-offs automatically",
    body: "no more april reconstruction project.",
  },
  {
    headline: "answers the questions your accountant won't",
    body: "should you switch to s-corp? can you afford an editor? will a bank approve your mortgage?",
  },
  {
    headline: "writes the boring stuff for you",
    body: "invoices, follow-up emails, irs payments. you click send.",
  },
  {
    headline: "talks to you in plain english",
    body: "no jargon. no “talk to your accountant” deflection.",
  },
];

export default function WhatItDoes() {
  return (
    <section className="py-12 space-y-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">what gets handled</h2>

      <p className="text-base text-ink-muted leading-relaxed">
        once you connect your accounts (read-only, never moves money):
      </p>

      <ul className="space-y-4">
        {FEATURES.map((f) => (
          <li key={f.headline} className="flex items-start gap-3">
            <span
              className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-base text-ink leading-relaxed">
              <strong>{f.headline}.</strong> {f.body}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-base text-ink leading-relaxed border-l-2 border-brand pl-4">
        not a bank. not an accountant. just the money side of your channel, handled.
      </p>
    </section>
  );
}
