-- The "Products" storage bucket had RLS enabled on storage.objects but no
-- INSERT/DELETE policy scoped to it (the only existing policy was a SELECT
-- policy for the unrelated "Feedbacks" bucket). Every product image upload
-- from the admin app (uploadProductImage in
-- src/lib/storage/productImages.ts) was therefore rejected with:
-- {"statusCode":"403","error":"Unauthorized","message":"new row violates
-- row-level security policy"}.
--
-- Mirrors the existing "authenticated, no per-row ownership check" pattern
-- already used for the Products table itself — this is a single-admin-team
-- tool, not multi-tenant. SELECT access to bucket objects is already public
-- via the bucket's `public = true` setting, so no SELECT policy is added
-- here.

create policy "Authenticated users can upload Products images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'Products');

create policy "Authenticated users can delete Products images"
on storage.objects for delete
to authenticated
using (bucket_id = 'Products');
