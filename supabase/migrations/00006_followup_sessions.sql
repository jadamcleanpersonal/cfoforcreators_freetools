-- ============================================================
-- Sprint 4c: Follow-up chat session tracking
-- Enforces hard caps, IP rate limiting, and email gating
-- for the AI CFO follow-up chat on all four tools.
-- ============================================================

create table followup_sessions (
  id uuid primary key default gen_random_uuid(),
  result_id text not null references tool_results(id),
  email text not null,
  ip text not null,
  message_count int default 0,
  created_at timestamptz default now()
);

create index idx_followup_email on followup_sessions(email);
create index idx_followup_ip on followup_sessions(ip);
create index idx_followup_result on followup_sessions(result_id);

-- RLS: only service role writes/reads (no public access)
alter table followup_sessions enable row level security;
