-- `Feedbacks.created_at` had no default at the database level, so every row
-- inserted by the admin feedback create flow got `created_at = null`
-- (visible in the list as an invalid date, and unusable for the newest-first
-- sort the list relies on). Mirrors the same fix already applied to
-- `Products.created_at` (see 20260713000000_add_products_created_at.sql).
--
-- Backfill first so the `not null` constraint below doesn't fail on any
-- rows already inserted with a null `created_at`; those rows have no better
-- historical timestamp to backfill from, so they collectively get "now".

update "Feedbacks"
  set created_at = now()
  where created_at is null;

alter table "Feedbacks"
  alter column created_at set default now(),
  alter column created_at set not null;
