import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '../../components/shared/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { buildCreateCategoryInput, createEmptyCategoryFormValues } from '../../lib/forms/categoryForm'
import type { CategoryFormValues } from '../../lib/forms/categoryForm'
import { CategoryIdConflictError, useCreateCategory } from '../../lib/mutations/categories'
import { useCategories } from '../../lib/queries/categories'
import { CATEGORY_FORM_PAGE_PADDING_CLASS, CategoryForm } from './CategoryForm'

/** Shown when creating a category fails for a reason other than a slug conflict. */
const CREATE_ERROR_MESSAGE = 'Não foi possível criar a categoria. Tente novamente.'

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
      Nova Categoria
    </h1>
  )
}

/**
 * Category creation page (Task 12). Waits for the existing categories list
 * to load before rendering `CategoryForm`, since both the slug-collision
 * check (Must 9) and the next-`ord` computation (Must 10) need the full,
 * current list — rendering the form against a partial/stale list could miss
 * a real collision or compute the wrong `ord`.
 *
 * Renders `CategoryForm` in create mode, seeded from
 * `createEmptyCategoryFormValues()`, and wires its `onSubmit` to
 * `useCreateCategory` via `buildCreateCategoryInput` (Task 7), which trims
 * the label, derives the slug `id`, and computes the next `ord`.
 *
 * On success: shows a success toast and redirects to the category list
 * (Must 22, Must 4's entry point completing its round trip here).
 *
 * On failure: shows an error toast — naming the slug conflict when a
 * `CategoryIdConflictError` is the cause (the database-level fallback for
 * Must 9, in case the loaded list went stale) — and stays on this page with
 * the form's entered values intact, so the admin can fix the issue and
 * retry. No partial category is ever left behind: `useCreateCategory`
 * either inserts the full row or throws, never a partial write.
 */
export function CategoryNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const categoriesQuery = useCategories()
  const createMutation = useCreateCategory()

  const categories = categoriesQuery.data ?? []

  async function handleSubmit(values: CategoryFormValues): Promise<void> {
    try {
      await createMutation.mutateAsync(buildCreateCategoryInput(values, categories))
      toast.success('Categoria criada com sucesso.')
      navigate('/categories')
    } catch (error) {
      toast.error(error instanceof CategoryIdConflictError ? error.message : CREATE_ERROR_MESSAGE)
    }
  }

  function handleCategoriesRetry() {
    categoriesQuery.refetch()
  }

  if (categoriesQuery.isLoading) {
    return (
      <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
          style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
        >
          <Spinner className="h-6 w-6" />
          <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
            Carregando categorias…
          </p>
        </div>
      </div>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <div className={CATEGORY_FORM_PAGE_PADDING_CLASS}>
        <PageHeading />
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
          style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
        >
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
          <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
            Não foi possível carregar as categorias existentes. Tente novamente.
          </p>
          <button
            type="button"
            onClick={handleCategoriesRetry}
            className="inline-flex cursor-pointer items-center gap-2 rounded-pill px-5 text-sm font-medium"
            style={{
              height: 'var(--control-h-sm)',
              border: '1px solid var(--border-soft)',
              color: 'var(--ink-700)',
              background: 'var(--surface-raised)',
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
          >
            Tentar novamente
          </button>
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
      </div>
    )
  }

  return (
    <CategoryForm
      title="Nova Categoria"
      initialValues={createEmptyCategoryFormValues()}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Criar categoria"
      existingCategoryIds={categories.map((category) => category.id)}
    />
  )
}
