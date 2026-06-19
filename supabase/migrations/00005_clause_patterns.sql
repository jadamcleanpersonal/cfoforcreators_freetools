-- ============================================================
-- Sprint 4c: Anonymized clause pattern database
-- Collects redacted clause structures from opted-in scans.
-- No PII is stored here — full contract text + identifying info
-- is in tool_results (7-day TTL). Only structural patterns stay.
-- ============================================================

create table contract_clause_patterns (
  id uuid primary key default gen_random_uuid(),
  clause_type text not null check (clause_type in (
    'exclusivity', 'usage_rights', 'payment_terms', 'kill_fee',
    'content_approval', 'ip_assignment', 'indemnification',
    'term_length', 'morality_clause', 'other'
  )),
  niche text not null,
  platform text not null,
  audience_tier text not null check (audience_tier in ('<10k', '10-100k', '100k-1M', '1M+')),
  deal_size_tier text not null check (deal_size_tier in ('under_1k', '1k-5k', '5k-25k', '25k+')),
  clause_pattern_redacted text not null,
  source_scan_id text references tool_results(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_clause_type on contract_clause_patterns(clause_type);
create index idx_niche_platform on contract_clause_patterns(niche, platform);

-- RLS: only admins can read. Insertion happens server-side via service role.
alter table contract_clause_patterns enable row level security;

-- No public read policy — only service role can access
