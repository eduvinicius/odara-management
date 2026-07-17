import type { FormEvent } from 'react'
import { useForm } from '@tanstack/react-form'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { FeedbackImageField } from '../../components/shared/FeedbackImageField'
import { SelectField } from '../../components/shared/SelectField'
import type { SelectFieldOption } from '../../components/shared/SelectField'
import { TextField } from '../../components/shared/TextField'
import { TextareaField } from '../../components/shared/TextareaField'
import { Spinner } from '../../components/ui/Spinner'
import { useProductOptions } from '../../lib/queries/productOptions'
import type { ProductOption } from '../../lib/queries/productOptions'
import {
  FEEDBACK_DESCRIPTION_MAX_LENGTH,
  FEEDBACK_NAME_MAX_LENGTH,
  validateFeedbackDescription,
  validateFeedbackName,
  validateFeedbackProduct,
} from '../../lib/forms/feedbackForm'
import type { FeedbackFormValues } from '../../lib/forms/feedbackForm'

/**
 * Page-level padding shared by every state of the feedback create/edit
 * route, matching the product and category forms' page padding so all three
 * entities feel consistent. Owned here — rather than by `AdminShell`'s
 * `main` — so the page title and the form always share one padded
 * container. `FeedbackEditPage` (Task 13) reuses this constant for its
 * loading/error/not-found states, which render before `FeedbackForm` ever
 * mounts.
 */
export const FEEDBACK_FORM_PAGE_PADDING_CLASS =
  'flex flex-col pt-6 px-5 pb-15 nav:pt-11 nav:px-14 nav:pb-20'

function buildProductSelectOptions(products: ProductOption[]): SelectFieldOption[] {
  return products.map((product) => ({ value: product.id, label: product.name }))
}

export type FeedbackFormProps = {
  /** Page heading rendered above the form (e.g. "Novo Depoimento" or "Editar Depoimento"). */
  title: string
  /**
   * Starting values for the form. Create mode passes
   * `createEmptyFeedbackFormValues()`; edit mode passes
   * `toFeedbackFormValues(feedback)` once the feedback query (Task 4) has
   * resolved.
   *
   * `useForm`'s `defaultValues` are only read on mount, so the parent must
   * not render `FeedbackForm` until `initialValues` reflects real data (edit
   * mode: wait for the feedback query to finish loading first; render a
   * skeleton until then, per the edit form rule).
   */
  initialValues: FeedbackFormValues
  /** Called with the current form values once the form passes validation and the admin submits. May be async — the submit button stays disabled until it resolves. */
  onSubmit: (values: FeedbackFormValues) => void | Promise<void>
  /** External pending state (e.g. the create/update mutation), combined with the form's own `isSubmitting` to disable the form while a save is in flight. @default false */
  isSubmitting?: boolean
  /** Label for the submit button. @default 'Salvar depoimento' */
  submitLabel?: string
}

/**
 * Shared create/edit layout for the feedback form (Task 11). Owns its own
 * TanStack Form instance (`useForm`) seeded from `initialValues` and reports
 * validated values upward via `onSubmit` — it never calls a Supabase
 * mutation or storage helper directly; that is the responsibility of
 * `FeedbackNewPage` (Task 12) and `FeedbackEditPage` (Task 13).
 *
 * Collects the four pieces of data the spec's Data Shape section requires
 * from this form (Must 6, Must 7, Must 8, Must 9): customer name,
 * description, product association, and an optional image. Editing an
 * existing feedback reuses the exact same fields (Must 10, Must 11, Must
 * 12), including replacing or removing its image (Must 13, Must 14) via
 * `FeedbackImageField`'s three mutually exclusive states.
 *
 * `name`, `description`, and `product_id` are validated on change via the
 * pure validators from `lib/forms/feedbackForm.ts` (Must 21, Must 22, Must
 * Not 43, Must Not 44, Must Not 45); the submit button stays disabled while
 * `!form.state.canSubmit`, so the admin can never trigger `onSubmit` with an
 * empty name, description, or product selection. Image format/size
 * validation (Must 23, Must 24) happens inside `FeedbackImageField` before a
 * file ever reaches form state.
 *
 * The product selector lists every product regardless of `active` status
 * (Must 37, Must Not 48) via `useProductOptions()`, never filtered. A failed
 * products fetch disables the whole form (name/description/product/image/
 * submit) and offers a retry action, since there is no way to validly
 * complete the required product field without the list — mirroring how
 * `ProductForm` disables itself when its categories fetch fails.
 *
 * A single-column layout, matching `CategoryForm`, keeps the form usable at
 * 375px width (Must 35) without any responsive grid.
 */
export function FeedbackForm({
  title,
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar depoimento',
}: FeedbackFormProps) {
  const productOptionsQuery = useProductOptions()

  const products = productOptionsQuery.data ?? []
  const productOptionsFailed = productOptionsQuery.isError
  const productSelectOptions = buildProductSelectOptions(products)

  function handleProductOptionsRetry() {
    productOptionsQuery.refetch()
  }

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const isBusy = form.state.isSubmitting || isSubmitting
  const fieldsDisabled = productOptionsFailed || isBusy

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    form.handleSubmit()
  }

  return (
    <div className={FEEDBACK_FORM_PAGE_PADDING_CLASS}>
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

      {productOptionsFailed && (
        <div
          className="mb-6 flex flex-col items-start gap-3 rounded-md p-4 sm:flex-row sm:items-center"
          style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
        >
          <AlertTriangle aria-hidden="true" className="h-6 w-6 shrink-0" style={{ color: 'var(--rose-400)' }} />
          <p className="flex-1 text-sm" style={{ color: 'var(--ink-700)' }}>
            Não foi possível carregar os produtos. Tente novamente.
          </p>
          <button
            type="button"
            onClick={handleProductOptionsRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-pill px-5 text-sm font-medium"
            style={{
              height: 'var(--control-h-sm)',
              border: '1px solid var(--border-soft)',
              color: 'var(--ink-700)',
              background: 'var(--surface-raised)',
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="flex max-w-md flex-col gap-6" noValidate>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => validateFeedbackName(value),
          }}
        >
          {(field) => (
            <TextField
              id="feedback-name"
              label="Nome do cliente"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              required
              disabled={fieldsDisabled}
              maxLength={FEEDBACK_NAME_MAX_LENGTH}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) => validateFeedbackDescription(value),
          }}
        >
          {(field) => (
            <TextareaField
              id="feedback-description"
              label="Depoimento"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              required
              disabled={fieldsDisabled}
              maxLength={FEEDBACK_DESCRIPTION_MAX_LENGTH}
              rows={6}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

        <form.Field
          name="product_id"
          validators={{
            onChange: ({ value }) => validateFeedbackProduct(value),
          }}
        >
          {(field) => (
            <SelectField
              id="feedback-product"
              label="Produto associado"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              options={productSelectOptions}
              placeholder={
                productOptionsQuery.isLoading
                  ? 'Carregando produtos…'
                  : productOptionsFailed
                    ? 'Não foi possível carregar os produtos'
                    : 'Selecione um produto'
              }
              required
              disabled={fieldsDisabled || productOptionsQuery.isLoading}
              error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
            />
          )}
        </form.Field>

        <form.Field name="imageFile">
          {(fileField) => (
            <form.Field name="removeExistingImage">
              {(removedField) => (
                <FeedbackImageField
                  id="feedback-image"
                  file={fileField.state.value}
                  existingUrl={initialValues.existingImageUrl}
                  removed={removedField.state.value}
                  onChange={fileField.handleChange}
                  onRemovedChange={removedField.handleChange}
                  disabled={fieldsDisabled}
                />
              )}
            </form.Field>
          )}
        </form.Field>

        <div>
          <button
            type="submit"
            disabled={fieldsDisabled || !form.state.canSubmit}
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
