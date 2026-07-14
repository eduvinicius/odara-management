-- Add created_at to Products so the admin product list can reliably sort
-- newest-first (spec Must 3). Previously the app fell back to sorting by
-- `id` desc, which only coincidentally looked ordered for existing seed
-- data and does not reflect true chronological order for UUIDs generated
-- via gen_random_uuid().
--
-- `default now()` backfills all existing rows to the migration's execution
-- time. That is acceptable here: there is no better historical data to
-- backfill from, existing rows will all share this timestamp (so they will
-- simply keep whatever relative order the previous `id desc` fallback gave
-- them among each other), and every row created after this migration will
-- sort correctly going forward.

alter table "Products"
  add column created_at timestamptz not null default now();
