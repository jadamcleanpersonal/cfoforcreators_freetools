import WaitlistForm from "@/components/waitlist/WaitlistForm";
import SpotsCounter from "@/components/waitlist/SpotsCounter";

const WAITLIST_PERKS = [
  "weekly creator finance newsletter. 4-minute reads, no fluff.",
  "tax deadline reminders for your state. never miss a quarterly again.",
  "founding member pricing for life when we launch (50% off year one).",
  "early access before public launch.",
  "every free tool we ship (quarterly tax calculator, s-corp calculator, sponsor rate finder, brand contract scanner).",
];

export default function OfferStack() {
  return (
    <section id="waitlist" className="py-12 space-y-10">
      {/* Everyone */}
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink">what you get when you sign up</h2>
        <ul className="space-y-4">
          {WAITLIST_PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-2 h-2 rounded-full bg-brand flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-base text-ink-muted leading-relaxed">{perk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* First 100 */}
      <div className="rounded-2xl border border-brand/30 bg-brand/5 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">🎯</span>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-ink">
              first 100 get a personal video walkthrough from the founder.
            </h3>
            <p className="text-base text-ink-muted leading-relaxed">
              send us your numbers and your top 3 questions. you&apos;ll get a 10-minute video
              answering them within 48 hours.
            </p>
            <p className="text-sm font-medium text-ink-muted">free. only 100 spots.</p>
            <SpotsCounter className="text-base" />
          </div>
        </div>
      </div>

      <WaitlistForm source="landing-offer" ctaText="claim your spot →" />
    </section>
  );
}
