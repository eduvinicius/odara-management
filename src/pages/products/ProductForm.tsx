import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from '@tanstack/react-form'
import { FolderPlus } from 'lucide-react'
import { CoverImageField } from '../../components/shared/CoverImageField'
import { GalleryImageField } from '../../components/shared/GalleryImageField'
import { SelectField } from '../../components/shared/SelectField'
import type { SelectFieldOption } from '../../components/shared/SelectField'
import { TextField } from '../../components/shared/TextField'
import { TextareaField } from '../../components/shared/TextareaField'
import { ToggleSwitch } from '../../components/shared/ToggleSwitch'
import { Spinner } from '../../components/ui/Spinner'
import { useCategories } from '../../lib/queries/categories'
import type { BadgeTone } from '../../lib/queries/products'
import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  validateProductBadgeLabel,
  validateProductBadgeTone,
  validateProductCategory,
  validateProductDescription,
  validateProductName,
  validateProductOriginalPrice,
  validateProductPrice,
} from '../../lib/forms/productForm'
import type { ProductFormValues } from '../../lib/forms/productForm'

/** Options for the badge tone selector. Includes a selectable "no badge" entry so a chosen tone can be cleared back to empty. */
const BADGE_TONE_OPTIONS: SelectFieldOption[] = [
  { value: '', label: 'Sem selo' },
  { value: 'sale', label: 'Promoção (rosa)' },
  { value: 'new', label: 'Novidade (esmeralda)' },
  { value: 'gold', label: 'Dourado' },
  { value: 'neutral', label: 'Neutro' },
]

const BADGE_TONE_VALUES: readonly BadgeTone[] = ['sale', 'new', 'gold', 'neutral']

function isBadgeTone(value: string): value is BadgeTone {
  return (BADGE_TONE_VALUES as readonly string[]).includes(value)
}

/** Narrows a raw select value to `BadgeTone | ''`, the type `ProductFormValues.badge_tone` expects. */
function toBadgeToneValue(value: string): BadgeTone | '' {
  return isBadgeTone(value) ? value : ''
}

function buildCategoryOptions(categories: Array<{ id: string; label: string }>): SelectFieldOption[] {
  return categories.map((category) => ({ value: category.id, label: category.label }))
}

export type ProductFormProps = {
  /**
   * Starting values for the form. Create mode passes
   * `createEmptyProductFormValues()`; edit mode passes
   * `toProductFormValues(product)` once the product query has resolved.
   *
   * `useForm`'s `defaultValues` are only read on mount, so the parent must
   * not render `ProductForm` until `initialValues` reflects real data (edit
   * mode: wait for `useProduct` to finish loading; render a skeleton until
   * then, per the edit form rule).
   */
  initialValues: ProductFormValues
  /** Called with the current form values once the form passes validation and the admin submits. May be async — the submit button stays disabled until it resolves. */
  onSubmit: (values: ProductFormValues) => void | Promise<void>
  /** External pending state (e.g. the create/update mutation), combined with the form's own `isSubmitting` to disable the form while a save is in flight. @default false */
  isSubmitting?: boolean
  /** Label for the submit button. @default 'Salvar produto' */
  submitLabel?: string
}

/**
 * Shared create/edit layout for the product form (Task 21). Owns its own
 * TanStack Form instance (`useForm`) seeded from `initialValues` and reports
 * validated values upward via `onSubmit` — it never calls a Supabase
 * mutation directly; that is the responsibility of `ProductNewPage` (Task 22)
 * and `ProductEditPage` (Task 23).
 *
 * Gates the entire form (Must 38) once `useCategories()` finishes loading
 * and returns zero categories: every field and the submit button become
 * non-interactive, and a message directs the admin to `/categories` to
 * create one first (note: that route does not exist in this app yet — see
 * this task's report).
 */
export function ProductForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Salvar produto',
}: ProductFormProps) {
  const categoriesQuery = useCategories()

  const categories = categoriesQuery.data ?? []
  const hasNoCategories =
    !categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0
  const categoryOptions = buildCategoryOptions(categories)

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const isBusy = form.state.isSubmitting || isSubmitting
  const fieldsDisabled = hasNoCategories || isBusy

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    event.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleFormSubmit} className="flex max-w-2xl flex-col gap-6" noValidate>
      {hasNoCategories && (
        <div
          className="flex flex-col items-start gap-3 rounded-md p-4 sm:flex-row sm:items-center"
          style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
        >
          <FolderPlus aria-hidden="true" className="h-6 w-6 shrink-0" style={{ color: 'var(--gold-400)' }} />
          <p className="flex-1 text-sm" style={{ color: 'var(--ink-700)' }}>
            Nenhuma categoria cadastrada ainda. Cadastre uma categoria antes de criar produtos.
          </p>
          <Link
            to="/categories"
            className="inline-flex shrink-0 items-center justify-center rounded-pill px-5 text-sm font-medium"
            style={{
              height: 'var(--control-h-sm)',
              background: 'var(--gradient-gold)',
              color: 'var(--text-on-gold)',
              boxShadow: 'var(--shadow-gold)',
            }}
          >
            Ir para categorias
          </Link>
        </div>
      )}

      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => validateProductName(value),
          onBlur: ({ value }) => validateProductName(value),
        }}
      >
        {(field) => (
          <TextField
            id="product-name"
            label="Nome do produto"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            required
            disabled={fieldsDisabled}
            maxLength={PRODUCT_NAME_MAX_LENGTH}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="category_id"
        validators={{
          onChange: ({ value }) => validateProductCategory(value),
          onBlur: ({ value }) => validateProductCategory(value),
        }}
      >
        {(field) => (
          <SelectField
            id="product-category"
            label="Categoria"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            options={categoryOptions}
            placeholder={categoriesQuery.isLoading ? 'Carregando categorias…' : 'Selecione uma categoria'}
            required
            disabled={fieldsDisabled || categoriesQuery.isLoading}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="price"
        validators={{
          onChange: ({ value }) => validateProductPrice(value),
          onBlur: ({ value }) => validateProductPrice(value),
        }}
      >
        {(field) => (
          <TextField
            id="product-price"
            label="Preço"
            type="number"
            step={0.01}
            min={0}
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            required
            disabled={fieldsDisabled}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="original_price"
        validators={{
          onChange: ({ value, fieldApi }) =>
            validateProductOriginalPrice(value, fieldApi.form.getFieldValue('price')),
          onChangeListenTo: ['price'],
          onBlur: ({ value, fieldApi }) =>
            validateProductOriginalPrice(value, fieldApi.form.getFieldValue('price')),
          onBlurListenTo: ['price'],
        }}
      >
        {(field) => (
          <TextField
            id="product-original-price"
            label="Preço original"
            type="number"
            step={0.01}
            min={0}
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            disabled={fieldsDisabled}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="badge_tone"
        validators={{
          onChange: ({ value, fieldApi }) =>
            validateProductBadgeTone(value, fieldApi.form.getFieldValue('badge_label')),
          onChangeListenTo: ['badge_label'],
          onBlur: ({ value, fieldApi }) =>
            validateProductBadgeTone(value, fieldApi.form.getFieldValue('badge_label')),
          onBlurListenTo: ['badge_label'],
        }}
      >
        {(field) => (
          <SelectField
            id="product-badge-tone"
            label="Estilo do selo"
            value={field.state.value}
            onChange={(value) => field.handleChange(toBadgeToneValue(value))}
            onBlur={field.handleBlur}
            options={BADGE_TONE_OPTIONS}
            disabled={fieldsDisabled}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field
        name="badge_label"
        validators={{
          onChange: ({ value, fieldApi }) =>
            validateProductBadgeLabel(value, fieldApi.form.getFieldValue('badge_tone')),
          onChangeListenTo: ['badge_tone'],
          onBlur: ({ value, fieldApi }) =>
            validateProductBadgeLabel(value, fieldApi.form.getFieldValue('badge_tone')),
          onBlurListenTo: ['badge_tone'],
        }}
      >
        {(field) => (
          <TextField
            id="product-badge-label"
            label="Texto do selo"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            disabled={fieldsDisabled}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field name="featured">
        {(field) => (
          <div className="flex flex-col gap-1">
            <span className="block text-sm" style={{ color: 'var(--ink-700)' }}>
              Produto em destaque
            </span>
            <ToggleSwitch
              checked={field.state.value}
              onChange={field.handleChange}
              label="Produto em destaque"
              hideLabel
              disabled={fieldsDisabled}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="active">
        {(field) => (
          <div className="flex flex-col gap-1">
            <span className="block text-sm" style={{ color: 'var(--ink-700)' }}>
              Produto ativo
              <span aria-hidden="true" style={{ color: 'var(--rose-400)' }}>
                {' '}
                *
              </span>
              <span className="sr-only"> (obrigatório)</span>
            </span>
            <ToggleSwitch
              checked={field.state.value}
              onChange={field.handleChange}
              label="Produto ativo"
              hideLabel
              disabled={fieldsDisabled}
            />
          </div>
        )}
      </form.Field>

      <form.Field
        name="description"
        validators={{
          onChange: ({ value }) => validateProductDescription(value),
          onBlur: ({ value }) => validateProductDescription(value),
        }}
      >
        {(field) => (
          <TextareaField
            id="product-description"
            label="Descrição"
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            disabled={fieldsDisabled}
            maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
            rows={6}
            error={field.state.meta.isTouched ? field.state.meta.errors[0] : undefined}
          />
        )}
      </form.Field>

      <form.Field name="coverImageFile">
        {(field) => (
          <CoverImageField
            id="product-cover-image"
            file={field.state.value}
            existingUrl={initialValues.existingCoverImageUrl}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            disabled={fieldsDisabled}
          />
        )}
      </form.Field>

      <form.Field name="galleryImageFiles">
        {(newFilesField) => (
          <form.Field name="existingGalleryImages">
            {(existingImagesField) => (
              <GalleryImageField
                id="product-gallery-images"
                newFiles={newFilesField.state.value}
                existingImages={existingImagesField.state.value}
                onNewFilesChange={newFilesField.handleChange}
                onExistingImagesChange={existingImagesField.handleChange}
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
  )
}
