import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import { TextField } from '../../components/shared/TextField'
import { Spinner } from '../../components/ui/Spinner'
import {
  CATEGORY_LABEL_MAX_LENGTH,
  validateCategoryLabel,
  validateCategoryLabelSlugCollision,
} from '../../lib/forms/categoryForm'
import type { CategoryFormValues } from '../../lib/forms/categoryForm'

/**
 * Page-level padding shared by every state of the category create/edit
 * route, matching the product form's page padding (Task 6 of the products
 * feature) so both entities feel consistent. Owned here — rather than by
 * `AdminShell`'s `main` — so the page title and the form always share one
 * padded container. `CategoryEditPage` reuses this constant for its
 * loading/error/not-found states, which render before `CategoryForm` ever
 * mounts.
 */
export const CATEGORY_FORM_PAGE_PADDING_CLASS =
  'flex flex-col pt-6 px-5 pb-15 nav:pt-11 nav:px-14 nav:pb-20'

export type CategoryFormProps = {
  /** Page heading rendered above the form (e.g. "Nova Categoria" or "Editar Categoria"). */
  title: string
  /**
   * Starting values for the form. Create mode passes
   * `createEmptyCategoryFormValues()`; edit mode passes
   * `toCategoryFormValues(category)` once the category query has resolved.
   *
   * `useForm`'s `defaultValues` are only read on mount, so the parent must
   * not render `CategoryForm` until `initialValues` reflects real data (edit
   * mode: wait for the category query to finish loading first).
   */
  initialValues: CategoryFormValues
  /** Called with the current form values once the form passes validation and the admin submits. May be async — the submit button stays disabled until it resolves. */
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
  /** External pending state (e.g. the create/update mutation), combined with the form's own `isSubmitting` to disable the form while a save is in flight. @default false */
  isSubmitting?: boolean
  /** Label for the submit button. @default 'Salvar categoria' */
  submitLabel?: string
  /**
   * Existing category ids to check the label's auto-generated slug against
   * for a collision (Must 9). Create mode only — omit in edit mode, since a
   * category's `id` never changes on edit (Must 12, Must 31), so no
   * collision check applies there.
   */
  existingCategoryIds?: readonly string[]
}

/**
 * Shared create/edit layout for the category form (Task 11). Owns its own
 * TanStack Form instance (`useForm`) seeded from `initialValues` and reports
 * validated values upward via `onSubmit` — it never calls a Supabase
 * mutation directly; that is the responsibility of `CategoryNewPage` (Task
 * 12) and `CategoryEditPage` (Task 13).
 *
 * Renders a single field — label — with no input for `id`/`ord` anywhere in
 * the form (Must 30, Must 33): both are computed automatically behind the
 * scenes by the pages that own this component. A single-column layout keeps
 * the form usable at 375px width (Must 27) without any responsive grid.
 */
export function CategoryForm({
  title,
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar categoria',
  existingCategoryIds,
}: CategoryFormProps) {
  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const isBusy = form.state.isSubmitting || isSubmitting

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    form.handleSubmit()
  }

  function validateLabelField(value: string): string | undefined {
    const requiredOrLengthError = validateCategoryLabel(value)
    if (requiredOrLengthError) {
      return requiredOrLengthError
    }

    if (!existingCategoryIds) {
      return undefined
    }

    return validateCategoryLabelSlugCollision(value, existingCategoryIds)
  }

  return (
    <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
      <h1
        className="mb-6"
        style={{
          fontFamily: 'var(--font-cormorant)',
          color: 'var(--ink-900)',
          fontSize: '1.75rem',
        }}
      >
        {title}
      </h1>

      <form onSubmit={handleFormSubmit} className="flex max-w-md flex-col gap-6" noValidate>
        <form.Field
          name="label"
          validators={{
            onChange: ({ value }) => validateLabelField(value),
          }}
        >
          {(field) => (
            <TextField
              id="category-label"
              label="Nome da categoria"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              required
              disabled={isBusy}
              maxLength={CATEGORY_LABEL_MAX_LENGTH}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

        <div>
          <button
            type="submit"
            disabled={isBusy || !form.state.canSubmit}
            aria-busy={isBusy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-pill px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            style={{
              height: 'var(--control-h-md)',
              background: 'var(--gradient-gold)',
              color: 'var(--text-on-gold)',
              boxShadow: 'var(--shadow-gold)',
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
          >
            {isBusy && <Spinner className="h-4 w-4" />}
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
