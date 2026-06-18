-- ============================================================
-- Sprint 4b: Contract scanner retention policy
-- Adds delete_after column to tool_results for 7-day auto-deletion.
-- Contract scans are kept 7 days, then purged per the disclosed retention policy.
-- All other tool results have delete_after = NULL (kept indefinitely).
-- ============================================================

-- Add delete_after column (nullable — existing rows keep forever)
alter table tool_results
  add column if not exists delete_after timestamptz default null;

-- Index for efficient purge queries
create index if not exists tool_results_delete_after_idx
  on tool_results(delete_after)
  where delete_after is not null;

-- ============================================================
-- Purge function — deletes expired contract scan results.
-- Call this from a scheduled job (pg_cron or external cron).
-- ============================================================
create or replace function purge_expired_tool_results()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from tool_results
  where delete_after is not null
    and delete_after < now();

  get diagnostics deleted_count = row_count;

  -- Log the purge (insert into events table for monitoring)
  if deleted_count > 0 then
    insert into events (event, properties)
    values (
      'tool_results.purged',
      jsonb_build_object('deleted_count', deleted_count, 'purged_at', now())
    );
  end if;

  return deleted_count;
end;
$$;

-- ============================================================
-- pg_cron scheduled job (run once to register — requires pg_cron extension)
-- Uncomment and run manually in the Supabase SQL editor after applying this migration:
--
-- select cron.schedule(
--   'purge-expired-contract-scans',
--   '0 3 * * *',  -- 3am UTC daily
--   'select purge_expired_tool_results()'
-- );
-- ============================================================
