-- Feedbacks.id had no default value, so any insert that omitted it (which is
-- every insert from the admin app — createFeedback never sends "id",
-- expecting the DB to generate it per the feedback-management spec) failed
-- with: null value in column "id" of relation "Feedbacks" violates not-null
-- constraint.
--
-- This mirrors the identical bug already fixed for Products in
-- 20260715000000_add_products_id_default.sql. Existing rows already store
-- UUIDs as text (matching the Feedback.id: string type in
-- src/lib/queries/feedbacks.ts), so the default generates a UUID and casts
-- it to text to match the column's existing type, rather than changing the
-- column type itself.

alter table "Feedbacks"
  alter column id set default gen_random_uuid()::text;
