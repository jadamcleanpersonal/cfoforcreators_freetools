import RateSubmissionForm from "@/components/sponsor/RateSubmissionForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit your sponsor rate — cfo for creators",
  description:
    "anonymously share what you've actually charged for brand deals. helps calibrate the sponsor rate calculator for every creator.",
};

export default function SponsorRateContributePage() {
  return (
    <article className="mx-auto max-w-xl px-4 py-8 sm:py-12 space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-ink">contribute your real rate</h1>
        <p className="text-ink-muted">
          the calculator uses Karat 2024 data as its baseline. real community rates make it better
          for everyone. takes 90 seconds. 100% anonymous.
        </p>
      </header>

      <div className="rounded-xl border border-ink/10 bg-paper-soft p-5 space-y-2">
        <p className="text-sm font-medium text-ink">how it works</p>
        <ul className="text-sm text-ink-muted space-y-1 list-disc list-inside">
          <li>you submit what you actually charged and whether it was accepted</li>
          <li>we review submissions before they go live (usually within a week)</li>
          <li>once approved, your data is blended into the calculator anonymously</li>
          <li>no names, no channels, no identifiable info stored</li>
        </ul>
      </div>

      <RateSubmissionForm />

      <div className="text-center">
        <a href="/sponsor-rate" className="text-sm text-brand hover:underline">
          ← back to the calculator
        </a>
      </div>
    </article>
  );
}
