export default function ProblemBlock() {
  return (
    <section className="py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-ink">sound familiar?</h2>

      <ul className="space-y-4">
        {[
          "five different platforms paying you on five different schedules",
          "youtube studio says one number, your bank says another, your accountant says a third",
          "you know you should be saving for taxes. you have no idea how much.",
          "the list of things you should be doing (llc, s-corp, retirement) keeps growing. nothing gets done.",
          "your accountant doesn't know what adsense is",
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span
              className="mt-1.5 w-2 h-2 rounded-full bg-warn flex-shrink-0"
              aria-hidden="true"
            />
            <span className="text-base text-ink-muted leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
