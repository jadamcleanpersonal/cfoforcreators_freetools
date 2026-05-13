export default function ProblemBlock() {
  return (
    <section className="py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">
        you shouldn&apos;t have to learn accounting to keep your channel.
      </h2>

      <p className="text-base text-ink-muted leading-relaxed">
        If you&apos;re like most full-time creators, your finances probably look something like this:
      </p>

      <ul className="space-y-4">
        {[
          "AdSense, sponsors, Patreon, affiliate, and merch all paying you on different schedules",
          "YouTube Studio shows one number, your bank shows another, your accountant says a third",
          "A vague feeling you should be putting money aside for taxes, but no idea how much",
          "A growing list of things you've heard you \"should probably do\" — LLC, S-corp, retirement account — that never quite get done",
          "An accountant who doesn't know what AdSense is, or the difference between a brand deal and an affiliate payout",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-1 text-warn flex-shrink-0" aria-hidden="true">
              &mdash;
            </span>
            <span className="text-base text-ink-muted leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-base text-ink leading-relaxed">
        You didn&apos;t start a channel to do payroll for yourself. We&apos;re building the AI CFO
        that handles the financial operating system, so you can get back to making.
      </p>
    </section>
  );
}
