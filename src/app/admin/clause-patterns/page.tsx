// Password-gated view for the clause pattern database.
// /admin/clause-patterns?pw=<ADMIN_PASSWORD>
// Lists patterns grouped by clause_type with filter support.
// Read-only — no editing in v1.

import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

interface ClausePattern {
  id: string;
  clause_type: string;
  niche: string;
  platform: string;
  audience_tier: string;
  deal_size_tier: string;
  clause_pattern_redacted: string;
  created_at: string;
}

async function getPatterns(clauseType?: string, niche?: string) {
  let query = supabaseAdmin
    .from("contract_clause_patterns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (clauseType) query = query.eq("clause_type", clauseType);
  if (niche) query = query.eq("niche", niche);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as ClausePattern[];
}

const CLAUSE_TYPES = [
  "exclusivity",
  "usage_rights",
  "payment_terms",
  "kill_fee",
  "content_approval",
  "ip_assignment",
  "indemnification",
  "term_length",
  "morality_clause",
  "other",
];

const NICHES = ["gaming", "beauty", "finance", "lifestyle", "education", "tech", "other"];

export default async function AdminClausePatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string; clause_type?: string; niche?: string }>;
}) {
  const { pw, clause_type, niche } = await searchParams;

  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    redirect("/");
  }

  const patterns = await getPatterns(clause_type, niche);

  // Group by clause_type
  const grouped = CLAUSE_TYPES.reduce<Record<string, ClausePattern[]>>((acc, type) => {
    acc[type] = patterns.filter((p) => p.clause_type === type);
    return acc;
  }, {});

  const totalCount = patterns.length;

  function filterUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (pw) p.set("pw", pw);
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v);
    }
    return `/admin/clause-patterns?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-ink">clause pattern database</h1>
        <p className="text-sm text-ink-muted">{totalCount} patterns collected from opted-in scans</p>
      </header>

      {/* Filters */}
      <section className="flex flex-wrap gap-2">
        <a
          href={filterUrl({ niche })}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${!clause_type ? "bg-brand text-white border-brand" : "border-border text-ink hover:bg-paper-soft"}`}
        >
          all types
        </a>
        {CLAUSE_TYPES.map((type) => (
          <a
            key={type}
            href={filterUrl({ clause_type: type, niche })}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${clause_type === type ? "bg-brand text-white border-brand" : "border-border text-ink hover:bg-paper-soft"}`}
          >
            {type.replace(/_/g, " ")}
          </a>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        <a
          href={filterUrl({ clause_type })}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${!niche ? "bg-ink text-white border-ink" : "border-border text-ink hover:bg-paper-soft"}`}
        >
          all niches
        </a>
        {NICHES.map((n) => (
          <a
            key={n}
            href={filterUrl({ clause_type, niche: n })}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${niche === n ? "bg-ink text-white border-ink" : "border-border text-ink hover:bg-paper-soft"}`}
          >
            {n}
          </a>
        ))}
      </section>

      {/* Grouped patterns */}
      {totalCount === 0 ? (
        <p className="text-sm text-ink-muted">no patterns yet. they appear after opted-in scans.</p>
      ) : (
        <div className="space-y-8">
          {CLAUSE_TYPES.map((type) => {
            const items = grouped[type];
            if (!items || items.length === 0) return null;
            return (
              <section key={type} className="space-y-3">
                <h2 className="text-base font-semibold text-ink capitalize">
                  {type.replace(/_/g, " ")}{" "}
                  <span className="text-ink-muted font-normal text-sm">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border bg-paper-soft p-4 space-y-2"
                    >
                      <p className="text-sm text-ink">{p.clause_pattern_redacted}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                        <span className="font-mono bg-ink/5 px-1.5 py-0.5 rounded">{p.niche}</span>
                        <span className="font-mono bg-ink/5 px-1.5 py-0.5 rounded">
                          {p.platform}
                        </span>
                        <span className="font-mono bg-ink/5 px-1.5 py-0.5 rounded">
                          {p.audience_tier}
                        </span>
                        <span className="font-mono bg-ink/5 px-1.5 py-0.5 rounded">
                          {p.deal_size_tier}
                        </span>
                        <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
