import { slugify } from '../utils'
import type { Category } from '../queries/categories'

/** Maximum characters accepted for `Categories.label` (Must 7). */
export const CATEGORY_LABEL_MAX_LENGTH = 50

/**
 * Field values backing the category create/edit form (TanStack Form
 * `useForm`), shared by both modes: `createEmptyCategoryFormValues` seeds
 * create mode, `toCategoryFormValues` seeds edit mode from a fetched
 * `Category` (Task 13).
 *
 * `label` is the only field the admin ever fills in — `id` and `ord` are
 * never part of this shape, since neither is ever a form input (Must 30,
 * Must 33).
 */
export type CategoryFormValues = {
  label: string
}

/**
 * Builds fresh default values for a new, empty category form (create mode).
 * Returns a new object on every call so separate form instances never share
 * mutable references.
 */
export function createEmptyCategoryFormValues(): CategoryFormValues {
  return { label: '' }
}

/**
 * Builds form values pre-filled from an existing category (edit mode). Used
 * once the categories query resolves, before `useForm` is initialized —
 * never render the edit form with empty defaults while the category is
 * still loading.
 */
export function toCategoryFormValues(category: Category): CategoryFormValues {
  return { label: category.label }
}

/**
 * Validates `label`: required after trimming, max
 * {@link CATEGORY_LABEL_MAX_LENGTH} characters, checked against the trimmed
 * value (Must 5, Must 6, Must 7).
 */
export function validateCategoryLabel(value: string): string | undefined {
  const trimmed = value.trim()

  if (trimmed === '') {
    return 'Informe o nome da categoria.'
  }

  if (trimmed.length > CATEGORY_LABEL_MAX_LENGTH) {
    return `O nome deve ter no máximo ${CATEGORY_LABEL_MAX_LENGTH} caracteres.`
  }

  return undefined
}

/**
 * Validates that the label's auto-generated slug does not collide with an
 * existing category `id` (Must 9). Create mode only — editing a label never
 * regenerates `id` (Must 12, Must 31), so this check does not apply there.
 *
 * Returns `undefined` (no collision error to report) when `value` is
 * already empty/invalid, since {@link validateCategoryLabel} covers that
 * case with its own message and a slug generated from an empty string is
 * meaningless to report as "in use".
 */
export function validateCategoryLabelSlugCollision(
  value: string,
  existingCategoryIds: readonly string[],
): string | undefined {
  const trimmed = value.trim()

  if (trimmed === '') {
    return undefined
  }

  const slug = slugify(trimmed)

  if (existingCategoryIds.includes(slug)) {
    return `Já existe uma categoria com o identificador "${slug}" gerado a partir desse nome. Escolha um nome diferente.`
  }

  return undefined
}

/**
 * Computes the `ord` value for a newly created category: one greater than
 * the current maximum among existing categories, or `1` when there are none
 * yet (Must 10).
 */
export function computeNextCategoryOrd(existingOrds: readonly number[]): number {
  if (existingOrds.length === 0) {
    return 1
  }

  return Math.max(...existingOrds) + 1
}

/** Ready-to-persist input for `useCreateCategory`, derived from validated form values. */
export type CreateCategorySubmissionInput = {
  id: string
  label: string
  ord: number
}

/**
 * Parses validated create-mode form values into `useCreateCategory`'s input
 * shape: trims the label (Must 6), derives `id` as its slug (Must 8), and
 * computes the next `ord` from the categories already loaded by the form
 * (Must 10).
 */
export function buildCreateCategoryInput(
  values: CategoryFormValues,
  existingCategories: ReadonlyArray<Pick<Category, 'ord'>>,
): CreateCategorySubmissionInput {
  const trimmedLabel = values.label.trim()

  return {
    id: slugify(trimmedLabel),
    label: trimmedLabel,
    ord: computeNextCategoryOrd(existingCategories.map((category) => category.ord)),
  }
}

/** Ready-to-persist input for `useUpdateCategory`, derived from validated form values. */
export type UpdateCategorySubmissionInput = {
  id: string
  label: string
}

/**
 * Parses validated edit-mode form values into `useUpdateCategory`'s input
 * shape: trims the label (Must 6) and pairs it with the category's
 * unchanged `id` (Must 12, Must 31).
 */
export function buildUpdateCategoryInput(
  id: string,
  values: CategoryFormValues,
): UpdateCategorySubmissionInput {
  return {
    id,
    label: values.label.trim(),
  }
}
