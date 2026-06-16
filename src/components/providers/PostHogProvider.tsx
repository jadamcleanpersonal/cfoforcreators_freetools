"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

    if (!key) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: false, // manual page views via next/navigation
      capture_pageleave: true,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          ph.debug();
        }
      },
    });

    // Expose on window for fire-and-forget event helpers in child components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog = posthog;
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
