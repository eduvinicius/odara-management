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

async function updateProduct(input: UpdateProductInput): Promise<Product> {
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

  if (imagesToDelete.length > 0) {
    await deleteProductImages(imagesToDelete)
  }

  return data
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
 * Consumed by the product edit page (Task 23), which is responsible for
 * parsing/validating `ProductFormValues` into an `UpdateProductInput`
 * (including splitting `existingGalleryImages` into kept vs removed URLs)
 * and for showing a toast on success/error — this hook only exposes
 * pending/error state, it does not notify the admin itself.
 */
export function useUpdateProduct(): UseMutationResult<Product, Error, UpdateProductInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', data.id] })
    },
  })
}
