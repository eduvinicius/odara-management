import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { PRODUCT_COLUMNS, type BadgeTone, type Product } from '../queries/products'
import {
  deleteProductImages,
  uploadProductImage,
  uploadProductImages,
} from '../storage/productImages'

/** Boolean product columns that can be flipped independently of a full edit. */
export type ToggleableProductField = 'active' | 'featured'

export type ToggleProductFieldInput = {
  id: string
  field: ToggleableProductField
  value: boolean
}

async function toggleProductField({ id, field, value }: ToggleProductFieldInput): Promise<void> {
  const patch = field === 'active' ? { active: value } : { featured: value }

  const { error } = await supabase.from('Products').update(patch).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Flips a single boolean field (`active` or `featured`) on a product by
 * `id`, updating only that column instead of the full product row.
 *
 * Consumed by the product list's inline active/featured toggles so the
 * admin can change either status directly from the list without opening
 * the full edit form.
 */
export function useToggleProductField(): UseMutationResult<
  void,
  Error,
  ToggleProductFieldInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleProductField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Input for `useCreateProduct`. Deliberately typed with already-parsed,
 * ready-to-persist values (numbers for `price`/`original_price`, `null` for
 * unset optional fields) rather than the raw `ProductFormValues` shape.
 *
 * Design decision: parsing/mapping from `ProductFormValues` (string ->
 * number, `''` -> `null`, resolving `existingGalleryImages` etc.) is the
 * CALLER's responsibility (Task 22's product creation page), not this
 * mutation's. The form already computes and validates these values field by
 * field (see `lib/forms/productForm.ts` validators), so re-deriving them
 * here would duplicate that logic and let this mutation silently mask a
 * validation bug behind a second parsing pass. This mutation only concerns
 * itself with I/O: uploading images and persisting a row.
 */
export type CreateProductInput = {
  name: string
  category_id: string
  price: number
  /** `null` when the admin left "original price" empty (no promotional badge context). */
  original_price: number | null
  badge_tone: BadgeTone | null
  badge_label: string | null
  featured: boolean
  active: boolean
  /** `null` when the admin left the description empty. */
  description: string | null
  /** New cover image to upload, or `null` to create the product without a cover. */
  coverImageFile: File | null
  /** New gallery images to upload, or an empty array to create the product without a gallery. */
  galleryImageFiles: readonly File[]
}

async function createProduct(input: CreateProductInput): Promise<Product> {
  // Uploads happen before the insert and are never wrapped in a try/catch
  // that swallows failures: if `uploadProductImage`/`uploadProductImages`
  // rejects, this function rejects too and the `insert` below never runs,
  // so no partial product row is ever created (Must 47).
  const imageUrl = input.coverImageFile ? await uploadProductImage(input.coverImageFile) : null

  const images =
    input.galleryImageFiles.length > 0
      ? await uploadProductImages(input.galleryImageFiles)
      : null

  const { data, error } = await supabase
    .from('Products')
    .insert({
      name: input.name,
      category_id: input.category_id,
      price: input.price,
      original_price: input.original_price,
      image_url: imageUrl,
      images,
      featured: input.featured,
      badge_tone: input.badge_tone,
      badge_label: input.badge_label,
      active: input.active,
      description: input.description,
    })
    .select(PRODUCT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Uploads any provided cover/gallery images, then creates a new `Products`
 * row with the resulting public URLs. Aborts without inserting a row if any
 * image upload fails (Must 47) — see `createProduct` above.
 *
 * On success, invalidates the `['products']` query cache so the product
 * list reflects the new product immediately.
 *
 * Consumed by the product creation page (Task 22), which is responsible for
 * parsing/validating `ProductFormValues` into a `CreateProductInput` and for
 * showing a toast on success/error — this hook only exposes pending/error
 * state, it does not notify the admin itself.
 */
export function useCreateProduct(): UseMutationResult<Product, Error, CreateProductInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Input for `useUpdateProduct`. Like `CreateProductInput`, this is typed
 * with already-parsed, ready-to-persist values — parsing `ProductFormValues`
 * (string -> number, resolving `existingGalleryImages` into kept/removed
 * lists, etc.) is the CALLER's responsibility (Task 23's product edit page),
 * not this mutation's, for the same reasons documented on
 * `CreateProductInput`.
 *
 * Cover image slots (mutually exclusive in intent, but `coverImageFile`
 * always wins when both are set):
 * - `coverImageFile` set -> upload it and replace the cover.
 * - `coverImageFile` null and `removeCoverImage` true -> clear the cover.
 * - `coverImageFile` null and `removeCoverImage` false -> keep
 *   `existingCoverImageUrl` unchanged.
 *
 * Gallery image slots: the final `images` array is
 * `keptGalleryImageUrls` + newly uploaded `newGalleryImageFiles`, in that
 * order. `removedGalleryImageUrls` is only used to know what to delete from
 * storage after the DB update succeeds — it must not overlap with
 * `keptGalleryImageUrls`.
 */
export type UpdateProductInput = {
  id: string
  name: string
  category_id: string
  price: number
  /** `null` when the admin left "original price" empty (no promotional badge context). */
  original_price: number | null
  badge_tone: BadgeTone | null
  badge_label: string | null
  featured: boolean
  active: boolean
  /** `null` when the admin left the description empty. */
  description: string | null
  /** New cover image to upload, replacing the existing one. `null` = keep existing (unless `removeCoverImage` is set). */
  coverImageFile: File | null
  /** `true` when the admin explicitly cleared the cover with no replacement. Ignored when `coverImageFile` is set. */
  removeCoverImage: boolean
  /** The product's cover image URL before this update, if any. Used to know what to delete from storage after a successful save. */
  existingCoverImageUrl: string | null
  /** New gallery files to upload and append to the kept existing gallery images. */
  newGalleryImageFiles: readonly File[]
  /** Existing gallery URLs the admin did NOT mark for removal — kept as-is in the final `images` array. */
  keptGalleryImageUrls: readonly string[]
  /** Existing gallery URLs the admin marked for removal — deleted from storage after the DB update succeeds. */
  removedGalleryImageUrls: readonly string[]
}

/**
 * Result of `updateProduct`/`useUpdateProduct`. The DB write is what the
 * admin's edit actually consists of, so its success is the only thing this
 * mutation ever rejects over. The post-write storage cleanup (deleting
 * now-orphaned cover/gallery files) is best-effort: if it fails, the update
 * still resolves successfully with `imageCleanupFailed: true` so the caller
 * can show a softer, distinct message instead of a hard failure toast — the
 * admin's edit was NOT lost.
 */
export type UpdateProductResult = {
  product: Product
  /** `true` when the DB update succeeded but deleting the now-orphaned old images from storage afterward failed. The update itself did NOT fail. */
  imageCleanupFailed: boolean
}

async function updateProduct(input: UpdateProductInput): Promise<UpdateProductResult> {
  // Uploads happen before the update and are never wrapped in a try/catch
  // that swallows failures: if `uploadProductImage`/`uploadProductImages`
  // rejects, this function rejects too and neither the DB update below nor
  // any storage deletion of the still-valid existing images ever runs
  // (Must 47) — the old cover/gallery files remain intact until a new save
  // fully succeeds.
  const newCoverImageUrl = input.coverImageFile
    ? await uploadProductImage(input.coverImageFile)
    : null

  const newGalleryImageUrls =
    input.newGalleryImageFiles.length > 0
      ? await uploadProductImages(input.newGalleryImageFiles)
      : []

  const finalImageUrl =
    newCoverImageUrl ?? (input.removeCoverImage ? null : input.existingCoverImageUrl)

  const finalGalleryImages = [...input.keptGalleryImageUrls, ...newGalleryImageUrls]

  const { data, error } = await supabase
    .from('Products')
    .update({
      name: input.name,
      category_id: input.category_id,
      price: input.price,
      original_price: input.original_price,
      image_url: finalImageUrl,
      images: finalGalleryImages.length > 0 ? finalGalleryImages : null,
      featured: input.featured,
      badge_tone: input.badge_tone,
      badge_label: input.badge_label,
      active: input.active,
      description: input.description,
    })
    .eq('id', input.id)
    .select(PRODUCT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Only reached after the DB update has committed, so a failed update
  // never leaves the row pointing at files that were already deleted
  // (Must 47's counterpart on the delete side).
  const imagesToDelete: string[] = [...input.removedGalleryImageUrls]
  const coverImageWasReplacedOrRemoved = newCoverImageUrl !== null || input.removeCoverImage

  if (input.existingCoverImageUrl !== null && coverImageWasReplacedOrRemoved) {
    imagesToDelete.push(input.existingCoverImageUrl)
  }

  // Storage cleanup is best-effort and intentionally isolated from the DB
  // write above: the update has already committed by this point, so a
  // cleanup failure here must NOT reject this function. If it did, the
  // caller's `catch` would show a hard "failed" error toast for an edit that
  // actually succeeded, and `onSuccess` would never invalidate the
  // `['products']` cache — leaving the admin looking at stale data and
  // possibly retrying an update that already went through.
  let imageCleanupFailed = false

  if (imagesToDelete.length > 0) {
    try {
      await deleteProductImages(imagesToDelete)
    } catch (cleanupError) {
      console.error('Failed to delete orphaned product images after update:', cleanupError)
      imageCleanupFailed = true
    }
  }

  return { product: data, imageCleanupFailed }
}

/**
 * Uploads any newly provided cover/gallery images, updates the `Products`
 * row identified by `id` with the resulting `image_url`/`images`, and then
 * removes any replaced cover image and any gallery images the admin marked
 * for removal from storage.
 *
 * Order of operations (Must 47): uploads happen first and abort the whole
 * operation on failure with nothing changed; the DB row is updated next;
 * only after that update succeeds are the now-orphaned old images deleted
 * from storage — see `updateProduct` above.
 *
 * On success, invalidates both the `['products']` list cache and the
 * specific `['products', id]` entry so the list and any cached single-
 * product view reflect the change immediately.
 *
 * Resolves with `imageCleanupFailed: true` (instead of rejecting) when the DB
 * update itself succeeded but the subsequent best-effort storage cleanup
 * failed, so a cleanup failure never masks a successful edit as a hard
 * failure — see the cleanup step in `updateProduct` above.
 *
 * Consumed by the product edit page (Task 23), which is responsible for
 * parsing/validating `ProductFormValues` into an `UpdateProductInput`
 * (including splitting `existingGalleryImages` into kept vs removed URLs)
 * and for showing a toast on success/error — this hook only exposes
 * pending/error state, it does not notify the admin itself.
 */
export function useUpdateProduct(): UseMutationResult<
  UpdateProductResult,
  Error,
  UpdateProductInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', result.product.id] })
    },
  })
}

/**
 * Input for `useDeleteProduct`. Carries the product's `id` plus its current
 * `image_url`/`images`, so this mutation knows exactly which storage files
 * to clean up without needing a separate fetch (the caller — the product
 * list, which already has the full `Product` row loaded via `useProducts` —
 * can pass it directly).
 */
export type DeleteProductInput = Pick<Product, 'id' | 'image_url' | 'images'>

/**
 * Result of `deleteProduct`/`useDeleteProduct`. The DB row delete is what
 * Must 54 (permanent row removal) actually requires, so its success is the
 * only thing this mutation ever rejects over. The post-delete storage
 * cleanup (Must 55, removing the now-unreferenced cover/gallery files) is
 * best-effort: if it fails, the delete still resolves successfully with
 * `imageCleanupFailed: true` instead of rejecting, so the caller can show a
 * softer, distinct message instead of a hard failure toast — the product was
 * NOT left in place.
 */
export type DeleteProductResult = {
  /** `true` when the DB delete succeeded but removing its images from storage afterward failed. The delete itself did NOT fail. */
  imageCleanupFailed: boolean
}

async function deleteProduct(input: DeleteProductInput): Promise<DeleteProductResult> {
  // Order of operations: the DB row is deleted FIRST, storage cleanup
  // SECOND. This is the opposite order from `updateProduct` above, and is
  // deliberate:
  //
  // - Spec's Must 55 ("must not leave orphaned image files") is the
  //   strongest safety constraint on *delete* specifically, and Must 54
  //   requires the row removal itself to be permanent. Deleting the row
  //   first means: if the row delete fails, nothing has happened yet (safe,
  //   retryable) — no files were touched.
  // - Deleting storage first would risk the reverse: files gone, but the
  //   product row still exists and still references them if the DB delete
  //   then fails — a worse, more visible admin-facing failure (broken
  //   images on a product that's supposedly still active).
  const { error } = await supabase.from('Products').delete().eq('id', input.id)

  if (error) {
    throw new Error(error.message)
  }

  const imagesToDelete: string[] = []

  if (input.image_url !== null) {
    imagesToDelete.push(input.image_url)
  }

  if (input.images !== null) {
    imagesToDelete.push(...input.images)
  }

  // Storage cleanup is best-effort and intentionally isolated from the DB
  // delete above: the row is already gone by this point (Must 54 is
  // satisfied), so a cleanup failure here must NOT reject this function. If
  // it did, the caller's `catch` would show a hard "failed" error toast for
  // a delete that actually succeeded, `onSuccess` would never invalidate the
  // `['products']` cache, and the admin could re-attempt a delete on a
  // product that's already gone. The only downside of swallowing this error
  // is temporarily orphaned files in storage, which is a lesser failure than
  // misleading the admin about whether their delete worked.
  let imageCleanupFailed = false

  if (imagesToDelete.length > 0) {
    try {
      await deleteProductImages(imagesToDelete)
    } catch (cleanupError) {
      console.error('Failed to delete product images after row delete:', cleanupError)
      imageCleanupFailed = true
    }
  }

  return { imageCleanupFailed }
}

/**
 * Permanently deletes a product row from the `Products` table by `id`
 * (Must 14), then removes its cover image (Must 15) and every gallery image
 * (Must 16) from the "Products" storage bucket. See `deleteProduct` above
 * for the DB-row-first ordering rationale.
 *
 * On success, invalidates both the `['products']` list cache and the
 * specific `['products', id]` entry so the list stops showing the deleted
 * product immediately — this happens whenever the DB row delete succeeded,
 * even if the follow-up storage cleanup failed (see `deleteProduct` above:
 * that resolves with `imageCleanupFailed: true` rather than rejecting).
 *
 * Consumed by the product list's delete action (Task 18), which shows a
 * `<ConfirmDialog>` before calling this mutation and a toast on
 * success/error — this hook only exposes pending/error state, it does not
 * notify the admin itself.
 */
export function useDeleteProduct(): UseMutationResult<
  DeleteProductResult,
  Error,
  DeleteProductInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] })
    },
  })
}
