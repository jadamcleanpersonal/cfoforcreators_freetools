export default function FounderNote() {
  return (
    <section className="py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">why we built this</h2>

      <blockquote className="space-y-4 border-l-2 border-brand pl-6">
        <p className="text-base text-ink leading-relaxed">
          I&apos;ve talked to hundreds of creators over the past year, and the pattern is the same
          every time: the channel works, the income shows up, and then the financial side falls
          apart. Money disappears between AdSense, sponsors, Patreon, and Stripe. Quarterly taxes
          blindside you. Your accountant doesn&apos;t speak creator. Half the things you
          &ldquo;should be doing&rdquo; &mdash; LLC, S-corp, retirement &mdash; sit on a list you
          never get to.
        </p>
        <p className="text-base text-ink leading-relaxed">
          Most of the existing tools are built for generic freelancers. None of them get creator
          income. None of them actually help you decide anything.
        </p>
        <p className="text-base text-ink leading-relaxed">
          So we&apos;re building the financial operator I wish I&apos;d had &mdash; for creators, by
          people who actually understand the work.
        </p>
        <p className="text-base text-ink leading-relaxed">
          Join the waitlist. Get a personalized deep-dive on the house. We&apos;ll be in touch.
        </p>
        <footer className="pt-2">
          <div className="flex items-center gap-4">
            {/* Founder photo placeholder — swap with real photo at public/founder.jpg */}
            <div
              className="w-12 h-12 rounded-full bg-ink-muted/20 flex items-center justify-center text-ink-muted text-sm font-medium flex-shrink-0"
              aria-hidden="true"
            >
              FN
            </div>
            <div>
              <p className="text-base font-semibold text-ink">[Founder Name]</p>
              <p className="text-sm text-ink-muted">Founder, CFO for Creators</p>
            </div>
          </div>
        </footer>
      </blockquote>
    </section>
  );
}
