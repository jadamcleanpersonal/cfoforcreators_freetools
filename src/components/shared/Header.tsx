import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-ink hover:text-brand transition-colors">
          cfo for creators
        </Link>

        <nav className="flex items-center gap-4" aria-label="Main navigation">
          <Link
            href="/#waitlist"
            className="min-h-tap inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors"
          >
            join the waitlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
