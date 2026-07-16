import { Link } from 'react-router-dom'
import { AlertTriangle, FolderPlus, Plus, RefreshCw } from 'lucide-react'
import { DataTable } from '../../components/shared/DataTable'
import type { DataTableColumn } from '../../components/shared/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { useCategoriesWithProductCounts } from '../../lib/queries/categories'
import type { CategoryWithProductCount } from '../../lib/queries/categories'

/**
 * Badge showing a category's assigned product count. Zero-product
 * categories get a visually distinct, muted style (Should 29) so the admin
 * can spot at a glance which categories are safe to delete.
 */
function ProductCountBadge({ productCount }: { productCount: number }) {
  const hasProducts = productCount > 0

  return (
    <span
      className="inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium"
      style={{
        background: hasProducts ? 'var(--surface-sunken)' : 'transparent',
        border: hasProducts ? 'none' : '1px dashed var(--border-soft)',
        color: hasProducts ? 'var(--ink-700)' : 'var(--ink-300)',
      }}
    >
      {productCount} {productCount === 1 ? 'produto' : 'produtos'}
    </span>
  )
}

function buildColumns(): Array<DataTableColumn<CategoryWithProductCount>> {
  return [
    {
      key: 'label',
      header: 'Nome',
      render: (category) => (
        <span className="font-medium" style={{ color: 'var(--ink-900)' }}>
          {category.label}
        </span>
      ),
    },
    {
      key: 'id',
      header: 'Identificador',
      render: (category) => <span style={{ color: 'var(--ink-500)' }}>{category.id}</span>,
    },
    {
      key: 'productCount',
      header: 'Produtos',
      render: (category) => <ProductCountBadge productCount={category.productCount} />,
    },
  ]
}

function AddCategoryButton() {
  return (
    <Link
      to="/categories/new"
      className="inline-flex shrink-0 items-center gap-2 rounded-pill px-5 text-sm font-medium"
      style={{
        height: 'var(--control-h-md)',
        background: 'var(--gradient-gold)',
        color: 'var(--text-on-gold)',
        boxShadow: 'var(--shadow-gold)',
        transition: 'filter var(--dur-fast) var(--ease-out)',
      }}
    >
      <Plus aria-hidden="true" className="h-4 w-4" />
      Nova categoria
    </Link>
  )
}

/**
 * Category list page (Task 8). Renders a simple, unpaginated list of every
 * category sorted by `ord` ascending (Must 2), showing each one's label,
 * id/slug, and assigned product count (Must 3), with a prominent entry
 * point for creating a new category (Must 4).
 *
 * Shows a loading spinner while the query resolves, an error message with a
 * retry action when it fails (Must 26), and an empty-state message with a
 * create-category call-to-action when there are zero categories (Must 25).
 * All states, including the populated list, remain usable at 375px width
 * (Must 27) via `DataTable`'s stacked mobile layout.
 *
 * Row-level edit/delete actions and delete-eligibility gating are wired in
 * Task 9.
 */
export function CategoryListPage() {
  const { data, isLoading, isError, refetch } = useCategoriesWithProductCounts()

  const categories = data ?? []
  const isEmpty = !isLoading && !isError && categories.length === 0
  const hasRows = !isLoading && !isError && categories.length > 0

  function handleRetry() {
    refetch()
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            color: 'var(--ink-900)',
            fontSize: '1.75rem',
          }}
        >
          Categorias
        </h1>

        <AddCategoryButton />
      </div>

      <div className="mt-6">
        {isLoading && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md py-16"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <Spinner className="h-6 w-6" />
            <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
              Carregando categorias…
            </p>
          </div>
        )}

        {!isLoading && isError && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Não foi possível carregar as categorias. Tente novamente.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex cursor-pointer items-center gap-2 rounded-pill px-5 text-sm font-medium"
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

        {isEmpty && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <FolderPlus aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhuma categoria cadastrada ainda.
            </p>
            <AddCategoryButton />
          </div>
        )}

        {hasRows && (
          <DataTable
            columns={buildColumns()}
            rows={categories}
            getRowId={(category) => category.id}
            caption="Lista de categorias"
          />
        )}
      </div>
    </div>
  )
}
