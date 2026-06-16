export default function FounderNote() {
  return (
    <section className="py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">why we built this</h2>

      <blockquote className="space-y-4 border-l-2 border-brand pl-6">
        <p className="text-base text-ink leading-relaxed">
          i&apos;ve talked to many creators in the last year and the pattern is always the same. the
          channel works. the money shows up. and then the financial side falls apart.
        </p>
        <p className="text-base text-ink leading-relaxed">
          money disappears between adsense, sponsors, patreon, and stripe. taxes blindside you. your
          accountant doesn&apos;t speak creator.
        </p>
        <p className="text-base text-ink leading-relaxed">
          most existing tools are built for generic freelancers. none of them get creator income.
        </p>
        <p className="text-base text-ink leading-relaxed">
          so we&apos;re building the one i wish i&apos;d had.
        </p>
        <footer className="pt-2">
          <div className="flex items-center gap-4">
            {/* Founder photo placeholder — swap with real photo at public/founder.jpg */}
            <div
              className="w-12 h-12 rounded-full bg-ink-muted/20 flex items-center justify-center text-ink-muted text-sm font-medium flex-shrink-0"
              aria-hidden="true"
            >
              JM
            </div>
            <div>
              <p className="text-base font-semibold text-ink">Jada Mclean</p>
              <p className="text-sm text-ink-muted">founder, cfo for creators</p>
            </div>
          </div>
        </footer>
      </blockquote>
    </section>
  );
}
