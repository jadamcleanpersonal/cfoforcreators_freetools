const FAQS = [
  {
    q: "Is this a bank? Will you hold my money?",
    a: "No. The AI CFO is read-only — we connect to your existing accounts and see what's happening, but we never move money on your behalf. You stay fully in control.",
  },
  {
    q: "Are you a CPA?",
    a: "No. The AI CFO prepares the work; humans (your accountant, you) sign and execute. Think of us as the operating layer between you and the real professionals.",
  },
  {
    q: "What's it cost?",
    a: "We're pre-launch — the AI CFO will be a monthly subscription. Waitlist members lock in founding member pricing (50% off year one). Pricing details when we launch.",
  },
  {
    q: "When does it launch?",
    a: "Building it now. Targeting Coming soon for first beta access. Waitlist members go first.",
  },
  {
    q: "What if I'm just starting out?",
    a: "Even better. The free tools we ship along the way (S-corp calculator, sponsor rate benchmark, retirement account chooser, etc.) are useful at any income level. Join the waitlist and we'll send each new tool as it goes live.",
  },
  {
    q: "What countries do you support?",
    a: "US-only at launch. International coming after. (Sign up anyway — we'll let you know when your country's tax stuff is supported.)",
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
