import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '../../components/shared/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { buildUpdateCategoryInput, toCategoryFormValues } from '../../lib/forms/categoryForm'
import type { CategoryFormValues } from '../../lib/forms/categoryForm'
import { useUpdateCategory } from '../../lib/mutations/categories'
import { useCategoriesWithProductCounts } from '../../lib/queries/categories'
import { CATEGORY_FORM_PAGE_PADDING_CLASS, CategoryForm } from './CategoryForm'

/** Shown when updating a category fails, regardless of the underlying cause. */
const UPDATE_ERROR_MESSAGE = 'Não foi possível salvar as alterações da categoria. Tente novamente.'

function PageHeading() {
  return (
    <h1
      className="mb-6"
      style={{
        fontFamily: 'var(--font-cormorant)',
        color: 'var(--ink-900)',
        fontSize: '1.75rem',
      }}
    >
      Editar Categoria
    </h1>
  )
}

type CategoryLoadStatusProps = {
  message: string
  children?: ReactNode
}

/** Shared centered panel for the loading and error/not-found states of the category fetch, styled consistently with `CategoryListPage`'s equivalent states. */
function CategoryLoadStatus({ message, children }: CategoryLoadStatusProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
    >
      {children}
      <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
        {message}
      </p>
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 rounded-pill px-5 text-sm font-medium"
        style={{
          height: 'var(--control-h-sm)',
          border: '1px solid var(--border-soft)',
          color: 'var(--ink-700)',
          background: 'var(--surface-raised)',
          transition: 'opacity var(--dur-fast) var(--ease-out)',
        }}
      >
        Voltar para categorias
      </Link>
    </div>
  )
}

/**
 * Category edit page (Task 13). Loads every category via
 * `useCategoriesWithProductCounts` (Task 2) and finds the one matching the
 * `:id` route param, waiting for the query to resolve before mounting
 * `CategoryForm` — `useForm`'s `defaultValues` are only read on mount, so
 * this never renders the form against empty/stale defaults.
 *
 * Pre-fills the form with the category's current label (Must 11) via
 * `toCategoryFormValues`, and wires its `onSubmit` to `useUpdateCategory`
 * through `buildUpdateCategoryInput` (Task 7), which trims the label and
 * pairs it with the category's unchanged `id` (Must 12) — `id` and `ord` are
 * never passed to `CategoryForm`, so neither is ever presented as an
 * editable input here.
 *
 * On success: shows a success toast and redirects to the category list
 * (Must 23).
 *
 * On failure: shows an error toast (Must 21) and stays on this page with
 * the form's entered values intact — no partial edit is ever applied, since
 * `useUpdateCategory` either commits the full update or throws.
 */
export function CategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const categoriesQuery = useCategoriesWithProductCounts()
  const updateMutation = useUpdateCategory()

  const category = categoriesQuery.data?.find((candidate) => candidate.id === id) ?? null

  async function handleSubmit(values: CategoryFormValues): Promise<void> {
    if (!id) return

    try {
      await updateMutation.mutateAsync(buildUpdateCategoryInput(id, values))
      toast.success('Categoria atualizada com sucesso.')
      navigate('/categories')
    } catch {
      toast.error(UPDATE_ERROR_MESSAGE)
    }
  }

  if (!id) {
    return (
      <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <CategoryLoadStatus message="Categoria não encontrada.">
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </CategoryLoadStatus>
      </div>
    )
  }

  if (categoriesQuery.isLoading) {
    return (
      <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <CategoryLoadStatus message="Carregando categoria…">
          <Spinner className="h-6 w-6" />
        </CategoryLoadStatus>
      </div>
    )
  }

  if (categoriesQuery.isError || category === null) {
    return (
      <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <CategoryLoadStatus
          message={
            categoriesQuery.isError
              ? 'Não foi possível carregar a categoria. Tente novamente.'
              : 'Categoria não encontrada.'
          }
        >
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </CategoryLoadStatus>
      </div>
    )
  }

  return (
    <CategoryForm
      title="Editar Categoria"
      initialValues={toCategoryFormValues(category)}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
      submitLabel="Salvar alterações"
    />
  )
}
