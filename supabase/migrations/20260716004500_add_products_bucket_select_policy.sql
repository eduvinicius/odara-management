-- The INSERT/DELETE-only policies added for the "Products" bucket
-- (20260715000001_add_products_bucket_storage_policies.sql) were not
-- enough to make deleteProductImages actually remove files on product
-- delete/edit. Storage's bulk remove endpoint (used by
-- supabase.storage.from(bucket).remove(paths) in
-- src/lib/storage/productImages.ts) first has to see the target objects
-- under RLS before it can delete them — without a SELECT policy, the
-- authenticated role sees zero rows for this bucket, so the endpoint
-- returns 200 with nothing actually removed instead of erroring. Storage
-- server logs confirmed this: DELETE /object/Products calls returned 200
-- while the files remained in storage.objects afterward.
--
-- Public read access (getPublicUrl, used to display images in the admin
-- UI and the catalog app) is unaffected by this — it goes through the
-- bucket's `public = true` flag, a separate code path from this
-- authenticated-role RLS check.

create policy "Authenticated users can view Products images"
on storage.objects for select
to authenticated
using (bucket_id = 'Products');
