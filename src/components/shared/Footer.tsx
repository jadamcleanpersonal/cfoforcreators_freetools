export default function Footer() {
  return (
    <footer className="border-t border-border mt-16 py-8">
      <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-muted">
        <p>&copy; 2026 cfo for creators</p>
        <div className="flex items-center gap-4">
          {/* Twitter/X — swap in real handle once set */}
          {/* <a href="https://twitter.com/TODO" target="_blank" rel="noopener noreferrer" className="hover:text-ink transition-colors">x/twitter</a> */}
          <a href="mailto:hello@thecfoforcreators.com" className="hover:text-ink transition-colors">
            hello@thecfoforcreators.com
          </a>
        </div>
      </div>
    </footer>
  );
}
