import SpotsCounter from "@/components/waitlist/SpotsCounter";
import WaitlistForm from "@/components/waitlist/WaitlistForm";

export default function Hero() {
  return (
    <section className="py-16 sm:py-24 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
          you make the money. you&apos;re scared to look at your bank account.
        </h1>
        <p className="text-xl text-ink-muted leading-relaxed max-w-2xl">
          figure out what you owe in taxes, what to charge for sponsorships, and what you can
          actually write off. without becoming your own accountant.
        </p>
        <p className="text-base text-ink-muted">
          join the waitlist. first 100 get a personal video walkthrough.
        </p>
      </div>

      <WaitlistForm source="landing-hero" ctaText="join the waitlist →" />

      {/* Spots counter — visual centerpiece */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🎯
        </span>
        <SpotsCounter />
      </div>
    </section>
  );
}
