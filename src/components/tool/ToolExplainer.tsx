import Link from "next/link";

interface Props {
  slug: string;
  excerpt: string;
}

export default function ToolExplainer({ slug, excerpt }: Props) {
  return (
    <aside className="rounded-2xl border border-border bg-paper-soft p-5 space-y-3">
      <h2 className="text-base font-semibold text-ink">How this works</h2>
      <p className="text-sm text-ink-muted leading-relaxed">{excerpt}</p>
      <Link
        href={`/learn/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
      >
        Read the full explainer
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </aside>
  );
}
