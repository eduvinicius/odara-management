-- The INSERT/DELETE-only policies added for the "Feedbacks" bucket
-- (20260717000001_add_feedbacks_bucket_storage_policies.sql) were not
-- enough to make deleteFeedbackImage actually remove files on feedback
-- delete/edit. Storage's bulk remove endpoint (used by
-- supabase.storage.from(bucket).remove(paths) in
-- src/lib/storage/feedbackImages.ts) first has to see the target objects
-- under RLS before it can delete them — without a SELECT policy, the
-- authenticated role sees zero rows for this bucket, so the endpoint
-- returns 200 with nothing actually removed instead of erroring. Confirmed
-- live: DELETE /storage/v1/object/Feedbacks returned 200 with body `[]`
-- while the file remained in storage.objects afterward. Mirrors the
-- identical fix already applied to the "Products" bucket (see
-- 20260716004500_add_products_bucket_select_policy.sql).
--
-- Public read access (getPublicUrl, used to display images in the admin
-- UI and the catalog app) is unaffected by this — it goes through the
-- bucket's `public = true` flag, a separate code path from this
-- authenticated-role RLS check.

create policy "Authenticated users can view Feedbacks images"
on storage.objects for select
to authenticated
using (bucket_id = 'Feedbacks');
