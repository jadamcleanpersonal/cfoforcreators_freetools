"use client";

// Mobile sticky bottom email bar.
// Shown on tool pages — slides up from the bottom.
// Hidden once the user scrolls to the email gate or submits.

import { useState, useEffect } from "react";
import WaitlistForm from "./WaitlistForm";

interface Props {
  source?: string;
}

export default function StickyEmailBar({ source = "sticky-bar" }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show the bar after the user has scrolled past 40% of the page
    function onScroll() {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.4 && !dismissed) {
        setVisible(true);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-paper border-t border-border shadow-xl p-4 sm:hidden"
      role="complementary"
      aria-label="Join the waitlist"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-ink">Get every new tool free</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-ink-muted hover:text-ink text-xl leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
      <WaitlistForm source={source} ctaText="Join" className="w-full" />
    </div>
  );
}
