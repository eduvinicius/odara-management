import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ImageOff, PackagePlus, Pencil, Plus, RefreshCw } from 'lucide-react'
import { DataTable } from '../../components/shared/DataTable'
import type { DataTableColumn } from '../../components/shared/DataTable'
import { Spinner } from '../../components/ui/Spinner'
import { useProducts } from '../../lib/queries/products'
import type { Product } from '../../lib/queries/products'
import { useCategories } from '../../lib/queries/categories'
import { money } from '../../lib/utils'

function renderThumbnail(product: Product): ReactNode {
  if (product.image_url) {
    return (
      <img
        src={product.image_url}
        alt=""
        className="h-12 w-12 rounded-md object-cover"
        style={{ background: 'var(--surface-sunken)' }}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 items-center justify-center rounded-md"
      style={{ background: 'var(--surface-sunken)', color: 'var(--ink-300)' }}
    >
      <ImageOff className="h-5 w-5" />
    </div>
  )
}

function renderStatusBadge(
  isOn: boolean,
  onLabel: string,
  offLabel: string,
  onBackground: string,
  onColor: string,
): ReactNode {
  return (
    <span
      className="inline-flex items-center rounded-pill px-3 py-1 text-xs font-medium tracking-wide uppercase"
      style={{
        background: isOn ? onBackground : 'var(--cream-100)',
        color: isOn ? onColor : 'var(--ink-700)',
      }}
    >
      {isOn ? onLabel : offLabel}
    </span>
  )
}

function renderEditAction(product: Product): ReactNode {
  return (
    <Link
      to={`/products/${product.id}/edit`}
      className="inline-flex items-center gap-1 text-sm font-medium"
      style={{ color: 'var(--text-gold)' }}
    >
      <Pencil aria-hidden="true" className="h-4 w-4" />
      Editar
    </Link>
  )
}

function buildColumns(categoryLabelById: Map<string, string>): Array<DataTableColumn<Product>> {
  return [
    {
      key: 'thumbnail',
      header: 'Imagem',
      render: renderThumbnail,
      hideOnMobile: true,
    },
    {
      key: 'name',
      header: 'Nome',
      render: (product) => (
        <span className="font-medium" style={{ color: 'var(--ink-900)' }}>
          {product.name}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (product) => categoryLabelById.get(product.category_id) ?? product.category_id,
    },
    {
      key: 'price',
      header: 'Preço',
      render: (product) => money(product.price),
    },
    {
      key: 'active',
      header: 'Status',
      render: (product) =>
        renderStatusBadge(product.active, 'Ativo', 'Inativo', 'var(--emerald-500)', 'var(--text-on-dark)'),
    },
    {
      key: 'featured',
      header: 'Destaque',
      render: (product) =>
        renderStatusBadge(product.featured, 'Destaque', 'Não destacado', 'var(--gradient-gold)', 'var(--text-on-gold)'),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: renderEditAction,
    },
  ]
}

function renderAddProductButton(): ReactNode {
  return (
    <Link
      to="/products/new"
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
      Novo produto
    </Link>
  )
}

export function ProductListPage() {
  const { data, isLoading, isError, refetch } = useProducts()
  const categoriesQuery = useCategories()

  const categoryLabelById = new Map<string, string>()
  for (const category of categoriesQuery.data ?? []) {
    categoryLabelById.set(category.id, category.label)
  }

  function handleRetry() {
    refetch()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          style={{
            fontFamily: 'var(--font-cormorant)',
            color: 'var(--ink-900)',
            fontSize: '1.75rem',
          }}
        >
          Produtos
        </h1>

        {renderAddProductButton()}
      </div>

      <div className="mt-6">
        {isLoading && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md py-16"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <Spinner className="h-6 w-6" />
            <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
              Carregando produtos…
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
              Não foi possível carregar os produtos. Tente novamente.
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

        {!isLoading && !isError && data.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <PackagePlus aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhum produto cadastrado ainda.
            </p>
            {renderAddProductButton()}
          </div>
        )}

        {!isLoading && !isError && data.length > 0 && (
          <DataTable
            columns={buildColumns(categoryLabelById)}
            rows={data}
            getRowId={(product) => product.id}
            caption="Lista de produtos"
          />
        )}
      </div>
    </div>
  )
}
