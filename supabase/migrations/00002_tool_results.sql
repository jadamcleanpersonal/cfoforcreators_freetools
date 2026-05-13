-- ============================================================
-- tool_results
-- Stores each calculation for a stable shareable URL.
-- Result pages render server-side from this snapshot.
-- NEVER change the column shape in a way that breaks old URLs.
-- ============================================================
create table if not exists tool_results (
  id text primary key,              -- nanoid(10), used as URL slug
  tool_slug text not null,          -- 'tax-estimator', 'scorp-calculator', etc.
  inputs jsonb not null,            -- raw form inputs (snapshot)
  outputs jsonb not null,           -- computed result (snapshot)
  email text,                       -- captured if user opted in for personalization
  share_count int default 0,
  view_count int default 0,
  created_at timestamptz default now()
);

create index if not exists tool_results_tool_idx on tool_results(tool_slug, created_at desc);

-- RLS: public read (shared result URLs need anonymous access)
alter table tool_results enable row level security;
create policy tool_results_public_read on tool_results for select using (true);

-- ============================================================
-- sponsor_rate_submissions  (cold-start data collection)
-- ============================================================
create table if not exists sponsor_rate_submissions (
  id uuid primary key default gen_random_uuid(),
  email text,
  niche text not null,
  platform text not null,            -- youtube_long | shorts | tiktok | twitch | etc.
  view_count_tier text not null,     -- 0-10k | 10-50k | 50-200k | 200k-1m | 1m+
  deliverable_type text not null,    -- dedicated | integration | mention | etc.
  rate_usd_low int,
  rate_usd_high int,
  notes text,
  approved_for_display boolean default false,
  created_at timestamptz default now()
);

create index if not exists sponsor_submissions_lookup_idx
  on sponsor_rate_submissions(niche, platform, view_count_tier)
  where approved_for_display = true;

alter table sponsor_rate_submissions enable row level security;

-- ============================================================
-- events  (lightweight server-side analytics mirror)
-- ============================================================
create table if not exists events (
  id bigserial primary key,
  event text not null,
  properties jsonb,
  email text,
  session_id text,
  created_at timestamptz default now()
);

create index if not exists events_event_created_idx on events(event, created_at desc);

alter table events enable row level security;
