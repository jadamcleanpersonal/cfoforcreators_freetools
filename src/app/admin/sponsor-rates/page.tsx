// Password-gated moderation view for community rate submissions.
// /admin/sponsor-rates
// Simple: password check via env var, list of pending submissions with approve button.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

interface Submission {
  id: string;
  created_at: string;
  platform: string;
  niche: string;
  audience_size: string;
  deliverable_type: string;
  rate_charged: number;
  brand_accepted: boolean | null;
  exclusivity_days: number;
  usage_rights: string;
  approved_for_display: boolean;
}

async function getSubmissions() {
  const { data, error } = await supabaseAdmin
    .from("sponsor_rate_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return [];
  return (data ?? []) as Submission[];
}

export default async function AdminSponsorRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  const { pw } = await searchParams;

  // Simple password gate — not a full auth system
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    redirect("/");
  }

  const submissions = await getSubmissions();
  const pending = submissions.filter((s) => !s.approved_for_display);
  const approved = submissions.filter((s) => s.approved_for_display);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">sponsor rate submissions</h1>
        <p className="text-sm text-ink-muted">
          {pending.length} pending · {approved.length} approved
        </p>
      </header>

      {/* Pending */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">pending review ({pending.length})</h2>
        {pending.length === 0 && <p className="text-sm text-ink-muted">no pending submissions</p>}
        {pending.map((s) => (
          <div key={s.id} className="rounded-xl border border-ink/10 bg-paper-soft p-4 space-y-2">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="font-mono bg-ink/5 px-2 py-0.5 rounded">{s.platform}</span>
              <span className="font-mono bg-ink/5 px-2 py-0.5 rounded">{s.niche}</span>
              <span className="font-mono bg-ink/5 px-2 py-0.5 rounded">{s.audience_size}</span>
              <span className="font-mono bg-ink/5 px-2 py-0.5 rounded">{s.deliverable_type}</span>
            </div>
            <div className="text-sm text-ink">
              <span className="font-semibold">{fmt(s.rate_charged)}</span>
              {s.brand_accepted !== null && (
                <span className="text-ink-muted ml-2">
                  · brand {s.brand_accepted ? "accepted" : "declined"}
                </span>
              )}
              {s.exclusivity_days > 0 && (
                <span className="text-ink-muted ml-2">· {s.exclusivity_days}d exclusivity</span>
              )}
              <span className="text-ink-muted ml-2">· {s.usage_rights}</span>
            </div>
            <p className="text-xs text-ink-muted">{new Date(s.created_at).toLocaleDateString()}</p>
            <form action={`/api/admin/sponsor-rate/approve?id=${s.id}&pw=${pw}`} method="POST">
              <button
                type="submit"
                className="text-sm bg-brand text-white px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-colors"
              >
                approve
              </button>
            </form>
          </div>
        ))}
      </section>

      {/* Approved summary */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">approved ({approved.length})</h2>
        <p className="text-sm text-ink-muted">
          these are live in the DB but not yet blended into the calculator (v1 uses static data
          only). v2 will blend approved submissions.
        </p>
      </section>
    </div>
  );
}
