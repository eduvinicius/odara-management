-- Products.id had no default value, so any insert that omitted it (which is
-- every insert from the admin app — createProduct never sends "id",
-- expecting the DB to generate it per the product-registration spec) failed
-- with: null value in column "id" of relation "Products" violates not-null
-- constraint.
--
-- Existing rows already store UUIDs as text (e.g.
-- "550e8400-e29b-41d4-a716-446655440001"), so the default generates a UUID
-- and casts it to text to match the column's existing type, rather than
-- changing the column type itself.

alter table "Products"
  alter column id set default gen_random_uuid()::text;
