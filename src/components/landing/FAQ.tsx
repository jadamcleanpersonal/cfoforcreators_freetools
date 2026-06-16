const FAQS = [
  {
    q: "is this a bank? will you hold my money?",
    a: "no. read-only. we see what's happening in your accounts. we never move money.",
  },
  {
    q: "are you a cpa?",
    a: "no. we prepare the work. you and your accountant sign and execute.",
  },
  {
    q: "what's it cost?",
    a: "monthly subscription when we launch. waitlist members get founding member pricing for life (50% off year one).",
  },
  {
    q: "when does it launch?",
    a: "building it now. waitlist members go first.",
  },
  {
    q: "what if i'm just starting out?",
    a: "even better. the free tools (quarterly tax, s-corp, sponsor rates, brand contracts) work at any income level. sign up and we'll send each one as it ships.",
  },
  {
    q: "what countries do you support?",
    a: "us-only at launch. international coming after. sign up anyway, we'll let you know when your country's covered.",
  },
];

export default function FAQ() {
  return (
    <section className="py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">quick answers</h2>

      <dl className="space-y-6">
        {FAQS.map((faq) => (
          <div key={faq.q} className="space-y-2">
            <dt className="text-base font-semibold text-ink">{faq.q}</dt>
            <dd className="text-base text-ink-muted leading-relaxed">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
