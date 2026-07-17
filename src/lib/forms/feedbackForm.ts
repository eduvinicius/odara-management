/** Maximum characters accepted for `Feedbacks.name` (Must 21). */
export const FEEDBACK_NAME_MAX_LENGTH = 200

/** Maximum characters accepted for `Feedbacks.description` (Must 22). */
export const FEEDBACK_DESCRIPTION_MAX_LENGTH = 1000

/**
 * Minimal shape this module needs from an existing feedback row in order to
 * seed edit-mode form values. Deliberately a local structural type rather
 * than an import from `lib/queries/feedbacks.ts`: that query module is
 * being built in parallel (Task 4) and neither task depends on the other.
 * Once Task 4's `Feedback` type lands, it satisfies this type structurally
 * (same field names/types per the spec's Data Shape section), so
 * `toFeedbackFormValues` will accept a real `Feedback` with no changes
 * needed here.
 */
export type FeedbackFormSourceEntity = {
  product_id: string | null
  name: string
  description: string
  image_url: string | null
}

/**
 * Field values backing the feedback create/edit form (TanStack Form
 * `useForm`), shared by both modes: `createEmptyFeedbackFormValues` seeds
 * create mode, `toFeedbackFormValues` seeds edit mode from a fetched
 * feedback (Task 13).
 *
 * `name`, `description`, and `product_id` are the fields validated by this
 * module (Must 6, Must 7, Must 8, Must 21, Must 22). The image fields are
 * UI-only slots consumed by the image field component (Task 6): this
 * module defines the slots and their shape only. Actual validation,
 * upload, and removal against Supabase Storage is performed by
 * `lib/storage/feedbackImages.ts` (Task 1) and the create/update mutations
 * (Task 5), not here.
 */
export type FeedbackFormValues = {
  name: string
  description: string
  product_id: string
  /**
   * Newly selected image file, to be uploaded and replace the current image
   * on save. `null` means "keep the existing image" (edit mode) or "no
   * image provided" (create mode).
   */
  imageFile: File | null
  /**
   * Current image URL, for preview purposes only. `null` in create mode, or
   * in edit mode when the feedback has no image yet. Never edited
   * directly — replaced only by setting `imageFile`, or cleared by setting
   * `removeExistingImage`.
   */
  existingImageUrl: string | null
  /**
   * Set when the admin explicitly removes the existing image (Must 14)
   * without selecting a replacement. Signals the update mutation to clear
   * `image_url` and delete the file from storage on save. Always `false` in
   * create mode, since there is no existing image to remove.
   */
  removeExistingImage: boolean
}

/**
 * Builds fresh default values for a new, empty feedback form (create mode).
 * Returns a new object on every call so separate form instances never share
 * mutable references.
 */
export function createEmptyFeedbackFormValues(): FeedbackFormValues {
  return {
    name: '',
    description: '',
    product_id: '',
    imageFile: null,
    existingImageUrl: null,
    removeExistingImage: false,
  }
}

/**
 * Builds form values pre-filled from an existing feedback (edit mode). Used
 * once the feedback query (Task 4) resolves, before `useForm` is
 * initialized — never render the edit form with empty defaults while the
 * feedback is still loading.
 */
export function toFeedbackFormValues(feedback: FeedbackFormSourceEntity): FeedbackFormValues {
  return {
    name: feedback.name,
    description: feedback.description,
    product_id: feedback.product_id ?? '',
    imageFile: null,
    existingImageUrl: feedback.image_url,
    removeExistingImage: false,
  }
}

/**
 * Validates `name`: required, non-empty, max {@link FEEDBACK_NAME_MAX_LENGTH}
 * characters (Must 6, Must 21, Must Not 43). Only trims for the emptiness
 * check — the value itself is never mutated, so internal/trailing
 * whitespace the admin typed is left intact.
 */
export function validateFeedbackName(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Informe o nome do cliente.'
  }

  if (value.length > FEEDBACK_NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${FEEDBACK_NAME_MAX_LENGTH} caracteres.`
  }

  return undefined
}

/**
 * Validates `description`: required, non-empty, max
 * {@link FEEDBACK_DESCRIPTION_MAX_LENGTH} characters (Must 7, Must 22, Must
 * Not 44). Only trims for the emptiness check; the max-length check is
 * measured on the raw, untrimmed value per spec, so line breaks and
 * internal whitespace the admin typed are never stripped or collapsed by
 * this validator.
 */
export function validateFeedbackDescription(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Informe o depoimento do cliente.'
  }

  if (value.length > FEEDBACK_DESCRIPTION_MAX_LENGTH) {
    return `O depoimento deve ter no máximo ${FEEDBACK_DESCRIPTION_MAX_LENGTH} caracteres.`
  }

  return undefined
}

/**
 * Validates `product_id`: required, must be a non-empty selection (Must 8,
 * Must Not 45). The selectable products themselves — including both active
 * and inactive ones — are supplied by the product options query hook
 * (Task 3), not validated here.
 */
export function validateFeedbackProduct(value: string): string | undefined {
  if (value.trim() === '') {
    return 'Selecione um produto.'
  }

  return undefined
}
