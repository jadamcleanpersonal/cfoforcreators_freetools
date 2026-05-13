import WaitlistForm from "@/components/waitlist/WaitlistForm";
import SpotsCounter from "@/components/waitlist/SpotsCounter";

const WAITLIST_PERKS = [
  { icon: "📩", text: "Weekly creator finance newsletter — 4-minute reads, plain language, no fluff" },
  {
    icon: "📅",
    text: "Tax deadline reminders specific to your state, so you never miss a quarterly payment again",
  },
  {
    icon: "💰",
    text: "Founding member pricing locked in for life when we launch (50% off the first year)",
  },
  { icon: "🚀", text: "Early access before public launch" },
  {
    icon: "🛠️",
    text: "Free use of every tool we ship while we build (S-corp calculator, sponsor rate database, retirement chooser, more on the way)",
  },
];

export default function OfferStack() {
  return (
    <section id="waitlist" className="py-12 space-y-10">
      {/* Everyone */}
      <div className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink">
          everyone who joins the waitlist:
        </h2>
        <ul className="space-y-4">
          {WAITLIST_PERKS.map((perk) => (
            <li key={perk.text} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0" aria-hidden="true">
                {perk.icon}
              </span>
              <span className="text-base text-ink-muted leading-relaxed">{perk.text}</span>
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
              And the first 100 members get one more thing:
            </h3>
            <p className="text-base text-ink font-semibold">
              A personal financial deep-dive from our founder.
            </p>
            <p className="text-base text-ink-muted leading-relaxed">
              Submit your numbers and your top 3 questions. Within 48 hours, you&apos;ll get a
              personalized 10-minute video reviewing your situation, with specific recommendations
              for your channel.
            </p>
            <p className="text-sm font-medium text-ink-muted">
              No charge. Limited to the first 100 spots.
            </p>
            <SpotsCounter className="text-base" />
          </div>
        </div>
      </div>

      <WaitlistForm source="landing-offer" ctaText="Claim your spot \u2192" />
    </section>
  );
}
