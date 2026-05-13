-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- waitlist
-- ============================================================
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  source text,          -- 'landing' | 'tax-estimator' | 'scorp' | etc.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  user_agent text,
  ip_country text,      -- from Vercel geo header (not stored as PII)
  beehiiv_subscriber_id text,
  beehiiv_synced_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists waitlist_created_at_idx on waitlist(created_at desc);
create index if not exists waitlist_source_idx on waitlist(source);

-- RLS: all reads/writes go through API routes via service role key
alter table waitlist enable row level security;

-- ============================================================
-- deepdive_intakes
-- ============================================================
create table if not exists deepdive_intakes (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid references waitlist(id),
  email text not null,
  first_name text,
  -- intake form fields (mirrors founder_deepdive_intake_form.md)
  platform text,
  niche text,
  follower_tier text,
  experience_tier text,
  income_tier text not null,               -- the qualifying field
  income_sources text[],
  state text,
  legal_setup text,
  has_accountant text,
  pays_quarterly text,
  question_1 text,
  question_2 text,
  question_3 text,
  other_context text,
  delivery_preference text,
  case_study_permission text,
  status text default 'new',               -- new | recording | sent | replied | closed
  loom_url text,
  founder_notes text,
  sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists deepdive_status_idx on deepdive_intakes(status);
create index if not exists deepdive_created_at_idx on deepdive_intakes(created_at desc);

-- RLS
alter table deepdive_intakes enable row level security;

-- Spots counter query:
--   select 100 - count(*) from deepdive_intakes
--   where income_tier != 'under_1k';
