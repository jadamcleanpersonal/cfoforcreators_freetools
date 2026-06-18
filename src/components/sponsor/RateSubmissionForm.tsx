"use client";
// Community rate submission form — anonymous, separate from the calculator.
// Submissions go to sponsor_rate_submissions table for moderation.
// NOT embedded in the calculator result. Lives at /sponsor-rate/contribute.

import { useState } from "react";

interface SubmissionFormData {
  platform: string;
  niche: string;
  audience_size: string;
  deliverable_type: string;
  rate_charged: string;
  brand_accepted: string;
  exclusivity_days: string;
  usage_rights: string;
}

const PLATFORMS = [
  { value: "youtube_long", label: "YouTube (long-form)" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram_reels", label: "Instagram Reels" },
  { value: "instagram_feed", label: "Instagram (feed / story)" },
  { value: "twitch", label: "Twitch" },
  { value: "podcast", label: "Podcast" },
  { value: "x", label: "X (Twitter)" },
];

const NICHES = [
  { value: "gaming", label: "gaming" },
  { value: "beauty", label: "beauty / fashion" },
  { value: "finance", label: "finance / business" },
  { value: "lifestyle", label: "lifestyle / travel" },
  { value: "education", label: "education / how-to" },
  { value: "tech", label: "tech / programming" },
  { value: "food", label: "food / cooking" },
  { value: "fitness", label: "fitness / wellness" },
  { value: "other", label: "other" },
];

const AUDIENCE_SIZES = [
  { value: "<10k", label: "under 10k" },
  { value: "10-100k", label: "10k–100k" },
  { value: "100k-1M", label: "100k–1M" },
  { value: "1M+", label: "1M+" },
];

const DELIVERABLE_TYPES = [
  { value: "integration", label: "integration (sponsor segment in your video)" },
  { value: "dedicated_video", label: "dedicated video (whole video is the brand)" },
  { value: "mention", label: "mention (brief callout)" },
  { value: "story_post", label: "story post (ephemeral)" },
  { value: "feed_post", label: "feed post (permanent static)" },
  { value: "podcast_read", label: "host-read ad (mid-roll or pre-roll)" },
  { value: "multi_deliverable", label: "multi-platform package" },
];

export default function RateSubmissionForm() {
  const [form, setForm] = useState<SubmissionFormData>({
    platform: "",
    niche: "",
    audience_size: "",
    deliverable_type: "",
    rate_charged: "",
    brand_accepted: "",
    exclusivity_days: "0",
    usage_rights: "organic_only",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const rateNum = Number(form.rate_charged.replace(/,/g, ""));
    if (!form.platform || !form.niche || !form.audience_size || !form.deliverable_type) {
      setErrorMessage("fill in all required fields");
      setStatus("error");
      return;
    }
    if (Number.isNaN(rateNum) || rateNum <= 0) {
      setErrorMessage("enter a valid rate amount");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/sponsor-rate/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          niche: form.niche,
          audience_size: form.audience_size,
          deliverable_type: form.deliverable_type,
          rate_charged: rateNum,
          brand_accepted: form.brand_accepted === "yes",
          exclusivity_days: Number(form.exclusivity_days) || 0,
          usage_rights: form.usage_rights,
        }),
      });

      if (!res.ok) throw new Error("submission failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("something went wrong — try again");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-brand/30 bg-brand/5 p-6 space-y-2">
        <p className="font-semibold text-ink">submitted. thank you.</p>
        <p className="text-sm text-ink-muted">
          your rate is queued for review. once approved it will help calibrate the calculator for
          creators like you. it&apos;s 100% anonymous — no personal info stored.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Platform */}
      <div className="space-y-1.5">
        <label htmlFor="platform" className="block text-sm font-medium text-ink">
          platform <span className="text-danger">*</span>
        </label>
        <select
          id="platform"
          name="platform"
          value={form.platform}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        >
          <option value="">select platform</option>
          {PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Niche */}
      <div className="space-y-1.5">
        <label htmlFor="niche" className="block text-sm font-medium text-ink">
          niche <span className="text-danger">*</span>
        </label>
        <select
          id="niche"
          name="niche"
          value={form.niche}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        >
          <option value="">select niche</option>
          {NICHES.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      {/* Audience size */}
      <div className="space-y-1.5">
        <label htmlFor="audience_size" className="block text-sm font-medium text-ink">
          audience size <span className="text-danger">*</span>
        </label>
        <select
          id="audience_size"
          name="audience_size"
          value={form.audience_size}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        >
          <option value="">select size</option>
          {AUDIENCE_SIZES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Deliverable type */}
      <div className="space-y-1.5">
        <label htmlFor="deliverable_type" className="block text-sm font-medium text-ink">
          what you delivered <span className="text-danger">*</span>
        </label>
        <select
          id="deliverable_type"
          name="deliverable_type"
          value={form.deliverable_type}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        >
          <option value="">select deliverable</option>
          {DELIVERABLE_TYPES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rate charged */}
      <div className="space-y-1.5">
        <label htmlFor="rate_charged" className="block text-sm font-medium text-ink">
          rate you charged (USD) <span className="text-danger">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">$</span>
          <input
            id="rate_charged"
            name="rate_charged"
            type="text"
            inputMode="numeric"
            value={form.rate_charged}
            onChange={handleChange}
            placeholder="5000"
            required
            className="w-full rounded-lg border border-ink/20 bg-paper pl-7 pr-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
          />
        </div>
      </div>

      {/* Brand accepted */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-ink">did the brand accept this rate?</p>
        <div className="flex gap-4">
          {["yes", "no", "negotiated"].map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand_accepted"
                value={v}
                checked={form.brand_accepted === v}
                onChange={handleChange}
                className="accent-brand"
              />
              <span className="text-sm text-ink">{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Exclusivity */}
      <div className="space-y-1.5">
        <label htmlFor="exclusivity_days" className="block text-sm font-medium text-ink">
          exclusivity window (days, 0 = none)
        </label>
        <input
          id="exclusivity_days"
          name="exclusivity_days"
          type="number"
          min={0}
          value={form.exclusivity_days}
          onChange={handleChange}
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        />
      </div>

      {/* Usage rights */}
      <div className="space-y-1.5">
        <label htmlFor="usage_rights" className="block text-sm font-medium text-ink">
          usage rights granted
        </label>
        <select
          id="usage_rights"
          name="usage_rights"
          value={form.usage_rights}
          onChange={handleChange}
          className="w-full rounded-lg border border-ink/20 bg-paper px-3 py-2 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand min-h-tap"
        >
          <option value="organic_only">organic only</option>
          <option value="brand_can_boost_paid">paid amplification</option>
          <option value="brand_owns_perpetual">perpetual / whitelisting</option>
        </select>
      </div>

      {status === "error" && errorMessage && <p className="text-sm text-danger">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-xl bg-brand text-white font-semibold py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-50 min-h-tap"
      >
        {status === "submitting" ? "submitting..." : "submit anonymously"}
      </button>

      <p className="text-xs text-ink-muted text-center">
        100% anonymous. no personal info collected. used only to improve the calculator.
      </p>
    </form>
  );
}
