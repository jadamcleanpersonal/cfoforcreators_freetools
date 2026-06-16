import type { Metadata } from "next";
import FAQ from "@/components/landing/FAQ";
import FounderNote from "@/components/landing/FounderNote";
import Hero from "@/components/landing/Hero";
import OfferStack from "@/components/landing/OfferStack";
import ProblemBlock from "@/components/landing/ProblemBlock";
import WhatItDoes from "@/components/landing/WhatItDoes";
import WaitlistForm from "@/components/waitlist/WaitlistForm";
import SpotsCounter from "@/components/waitlist/SpotsCounter";

export const metadata: Metadata = {
  title: "CFO for Creators — taxes, sponsor rates, write-offs handled",
  description:
    "Figure out what you owe in taxes, what to charge for sponsorships, and what you can actually write off. Without becoming your own accountant. Join the waitlist — first 100 get a personal video walkthrough.",
};

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* Section 1 — Hero */}
      <Hero />

      {/* Section 2 — Problem */}
      <ProblemBlock />

      {/* Section 3 — What it does */}
      <WhatItDoes />

      {/* Section 4 — Offer stack + spots counter */}
      <OfferStack />

      {/* Section 5 — Founder note */}
      <FounderNote />

      {/* Section 6 — FAQ */}
      <FAQ />

      {/* Section 7 — Final CTA */}
      <section className="py-12 space-y-6 border-t border-border">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-ink">stop guessing. start sleeping better.</h2>
          <SpotsCounter />
        </div>
        <WaitlistForm source="landing-footer" ctaText="join the waitlist →" />
      </section>
    </div>
  );
}
