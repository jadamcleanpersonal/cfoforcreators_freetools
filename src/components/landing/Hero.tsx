import WaitlistForm from "@/components/waitlist/WaitlistForm";
import SpotsCounter from "@/components/waitlist/SpotsCounter";

export default function Hero() {
  return (
    <section className="py-16 sm:py-24 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
          your channel pays you. your finances never quite add up.
        </h1>
        <p className="text-xl text-ink-muted leading-relaxed max-w-2xl">
          An AI CFO built for content creators. Get straight answers on taxes, sponsor rates,
          write-offs, and where your money&apos;s actually going &mdash; without becoming your own
          accountant.
        </p>
        <p className="text-base text-ink-muted">
          Coming soon. Join the waitlist to be first in line &mdash; and grab one of 100 personal
          financial deep-dives from our founder.
        </p>
      </div>

      <WaitlistForm source="landing-hero" ctaText="Join the waitlist \u2192" />

      {/* Spots counter — visual centerpiece */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">🎯</span>
          <SpotsCounter />
      </div>
    </section>
  );
}
