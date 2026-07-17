-- The "Feedbacks" storage bucket had RLS enabled on storage.objects but only
-- a SELECT policy (per the comment in
-- 20260715000001_add_products_bucket_storage_policies.sql, which notes the
-- only existing policy before that migration was "a SELECT policy for the
-- unrelated 'Feedbacks' bucket") — no INSERT or DELETE policy scoped to it.
--
-- Every feedback image upload from the admin app (uploadFeedbackImage in
-- src/lib/storage/feedbackImages.ts) is therefore rejected with:
-- {"statusCode":"403","error":"Unauthorized","message":"new row violates
-- row-level security policy"}. Deletes (deleteFeedbackImage, used on
-- feedback delete/edit) return 200 but do not actually remove the file,
-- since the authenticated role has no INSERT/DELETE policy to act on —
-- mirroring the exact SELECT-only gap that was later found for the
-- Products bucket in 20260716004500_add_products_bucket_select_policy.sql.
--
-- Mirrors the existing "authenticated, no per-row ownership check" pattern
-- already used for the Products bucket — this is a single-admin-team tool,
-- not multi-tenant. Public read access (getPublicUrl, used to display
-- images in the admin UI and the catalog app) is unaffected by this — it
-- goes through the bucket's `public = true` flag, a separate code path
-- from this authenticated-role RLS check. The pre-existing SELECT policy
-- for this bucket already covers the authenticated-role read path needed
-- by Storage's bulk remove endpoint (see the Products bucket's SELECT-gap
-- migration for why remove() needs SELECT visibility first), so no SELECT
-- policy is added here.

create policy "Authenticated users can upload Feedbacks images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'Feedbacks');

create policy "Authenticated users can delete Feedbacks images"
on storage.objects for delete
to authenticated
using (bucket_id = 'Feedbacks');
