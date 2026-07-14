import type { BadgeTone, Product } from '../queries/products'

/** Maximum characters accepted for `Products.name`. */
export const PRODUCT_NAME_MAX_LENGTH = 200

/** Maximum characters accepted for `Products.description`. */
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1000

/**
 * One existing gallery image tracked by the edit form. `markedForRemoval`
 * lets the admin flag an image for deletion without immediately mutating
 * the list, so the removal only takes effect when the form is saved.
 */
export type ProductFormGalleryImage = {
  url: string
  markedForRemoval: boolean
}

/**
 * Field values backing the product create/edit form (TanStack Form
 * `useForm`), shared by both modes: `createEmptyProductFormValues` seeds
 * create mode, `toProductFormValues` seeds edit mode from a fetched
 * `Product` (Task 23).
 *
 * Mirrors `Products` table columns using the same names as `Product`
 * wherever a direct mapping exists. Numeric columns (`price`,
 * `original_price`) are kept as strings because they are bound to
 * controlled text inputs (`TextField`), which always report `value` as a
 * string regardless of `type="number"`; they are parsed to numbers only at
 * validation/submission time.
 *
 * Image fields are UI-only slots consumed by the image upload UI (Task 20):
 * this module defines the slots and their shape only. Actual upload/removal
 * against Supabase Storage is performed by `lib/storage/productImages.ts`
 * and the create/update mutations (Tasks 11-12), not here.
 */
export type ProductFormValues = {
  name: string
  category_id: string
  price: string
  original_price: string
  badge_tone: BadgeTone | ''
  badge_label: string
  featured: boolean
  active: boolean
  description: string
  /**
   * Newly selected cover image file, to be uploaded and replace the cover
   * on save. `null` means "keep the existing cover" (edit mode) or "no
   * cover provided" (create mode).
   */
  coverImageFile: File | null
  /**
   * Current cover image URL, for preview purposes only. `null` in create
   * mode, or in edit mode when the product has no cover yet. Never edited
   * directly — replaced only by setting `coverImageFile`.
   */
  existingCoverImageUrl: string | null
  /**
   * Newly selected gallery image files to upload on save. Combined with the
   * kept (non-removed) entries of `existingGalleryImages`, the total must
   * not exceed 6 — enforced by the image upload UI (Task 20), not here.
   */
  galleryImageFiles: File[]
  /**
   * Existing gallery image URLs (edit mode only; always empty in create
   * mode). Entries with `markedForRemoval: true` are deleted from storage
   * and dropped from `images` on save.
   */
  existingGalleryImages: ProductFormGalleryImage[]
}

/**
 * Builds fresh default values for a new, empty product form (create mode).
 * Defaults `active` to `true` and `featured` to `false` per spec. Returns a
 * new object/array set on every call so separate form instances never share
 * mutable references.
 */
export function createEmptyProductFormValues(): ProductFormValues {
  return {
    name: '',
    category_id: '',
    price: '',
    original_price: '',
    badge_tone: '',
    badge_label: '',
    featured: false,
    active: true,
    description: '',
    coverImageFile: null,
    existingCoverImageUrl: null,
    galleryImageFiles: [],
    existingGalleryImages: [],
  }
}

/**
 * Builds form values pre-filled from an existing product (edit mode). Used
 * once the product query (Task 10) resolves, before `useForm` is
 * initialized — never render the edit form with empty defaults while the
 * product is still loading.
 */
export function toProductFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    category_id: product.category_id,
    price: String(product.price),
    original_price: product.original_price === null ? '' : String(product.original_price),
    badge_tone: product.badge_tone ?? '',
    badge_label: product.badge_label ?? '',
    featured: product.featured,
    active: product.active,
    description: product.description ?? '',
    coverImageFile: null,
    existingCoverImageUrl: product.image_url,
    galleryImageFiles: [],
    existingGalleryImages: (product.images ?? []).map((url) => ({
      url,
      markedForRemoval: false,
    })),
  }
}

/**
 * Validates `name`: required, non-empty, max {@link PRODUCT_NAME_MAX_LENGTH}
 * characters. Only trims for the emptiness check — the value itself is
 * never mutated, so internal/trailing whitespace the admin typed is left
 * intact.
 */
export function validateProductName(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Informe o nome do produto.'
  }

  if (value.length > PRODUCT_NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${PRODUCT_NAME_MAX_LENGTH} caracteres.`
  }

  return undefined
}

/** Validates `category_id`: required, must be a non-empty selection. */
export function validateProductCategory(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Selecione uma categoria.'
  }

  return undefined
}

/** Validates `price`: required, must parse to a number greater than 0. */
export function validateProductPrice(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Informe o preço.'
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed)) {
    return 'Informe um preço válido.'
  }

  if (parsed <= 0) {
    return 'O preço deve ser maior que zero.'
  }

  return undefined
}

/**
 * Validates `original_price`: optional; when provided, must parse to a
 * number greater than 0 and greater than the current `price` field value.
 *
 * Takes `priceValue` as a parameter (rather than closing over a snapshot)
 * so callers can always pass the form's live current price — see the
 * `onChangeListenTo: ['price']` wiring note in this module's usage guide.
 * If `priceValue` is not yet a valid number (e.g. still empty), only the
 * standalone checks on `value` apply.
 */
export function validateProductOriginalPrice(
  value: string,
  priceValue: string,
): string | undefined {
  if (value.trim() === '') {
    return undefined
  }

  const parsedOriginal = Number(value)

  if (Number.isNaN(parsedOriginal)) {
    return 'Informe um preço original válido.'
  }

  if (parsedOriginal <= 0) {
    return 'O preço original deve ser maior que zero.'
  }

  const parsedPrice = Number(priceValue)

  if (!Number.isNaN(parsedPrice) && parsedOriginal <= parsedPrice) {
    return 'O preço original deve ser maior que o preço atual.'
  }

  return undefined
}

/**
 * Validates `badge_label`: required whenever `badge_tone` is set. Both
 * empty is valid (no badge). Takes the paired field's live value as a
 * parameter — see the `onChangeListenTo: ['badge_tone']` wiring note.
 */
export function validateProductBadgeLabel(
  value: string,
  badgeToneValue: string,
): string | undefined {
  if (badgeToneValue.trim() !== '' && value.trim() === '') {
    return 'Informe o texto do selo, já que um estilo de selo foi selecionado.'
  }

  return undefined
}

/**
 * Validates `badge_tone`: required whenever `badge_label` is set. Both
 * empty is valid (no badge). Takes the paired field's live value as a
 * parameter — see the `onChangeListenTo: ['badge_label']` wiring note.
 */
export function validateProductBadgeTone(
  value: string,
  badgeLabelValue: string,
): string | undefined {
  if (badgeLabelValue.trim() !== '' && value.trim() === '') {
    return 'Selecione o estilo do selo, já que um texto de selo foi informado.'
  }

  return undefined
}

/**
 * Validates `description`: optional, max
 * {@link PRODUCT_DESCRIPTION_MAX_LENGTH} characters. Checks raw
 * (untrimmed) length so line breaks and internal whitespace the admin
 * typed are never stripped or collapsed by this validator.
 */
export function validateProductDescription(value: string): string | undefined {
  if (value.length > PRODUCT_DESCRIPTION_MAX_LENGTH) {
    return `A descrição deve ter no máximo ${PRODUCT_DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  return undefined
}
