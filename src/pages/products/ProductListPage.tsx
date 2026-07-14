import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  FilterX,
  ImageOff,
  PackagePlus,
  Plus,
  RefreshCw,
  SearchX,
} from 'lucide-react'
import { DataTable } from '../../components/shared/DataTable'
import type { DataTableColumn } from '../../components/shared/DataTable'
import { Pagination } from '../../components/shared/Pagination'
import { SelectField } from '../../components/shared/SelectField'
import type { SelectFieldOption } from '../../components/shared/SelectField'
import { TextField } from '../../components/shared/TextField'
import { Spinner } from '../../components/ui/Spinner'
import { PRODUCTS_PAGE_SIZE, useProducts } from '../../lib/queries/products'
import type { Product } from '../../lib/queries/products'
import { useCategories } from '../../lib/queries/categories'
import { money } from '../../lib/utils'
import { PRODUCTS_LIST_PATH } from '../../router/productListReturnPath'
import type { ProductFormLocationState } from '../../router/productListReturnPath'
import { ProductDeleteDialog } from './ProductDeleteDialog'
import { ProductRowActions } from './ProductRowActions'
import { ProductStatusToggle } from './ProductStatusToggle'

/** URL search param keys used to persist the list's search/filter/page state. */
const SEARCH_PARAM = 'q'
const CATEGORY_PARAM = 'category'
const ACTIVE_PARAM = 'active'
const PAGE_PARAM = 'page'

/** How long to wait after the last keystroke before committing the name search to the URL. */
const SEARCH_DEBOUNCE_MS = 300

const ACTIVE_FILTER_OPTIONS: SelectFieldOption[] = [
  { value: '', label: 'Todos os status' },
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
]

function parsePageParam(raw: string | null): number {
  const parsed = raw === null ? 1 : Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

function parseActiveParam(raw: string | null): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function buildCategoryOptions(categories: Array<{ id: string; label: string }>): SelectFieldOption[] {
  return [
    { value: '', label: 'Todas as categorias' },
    ...categories.map((category) => ({ value: category.id, label: category.label })),
  ]
}

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

function buildColumns(
  categoryLabelById: Map<string, string>,
  onDeleteRequest: (product: Product) => void,
  listReturnPath: string,
): Array<DataTableColumn<Product>> {
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
      render: (product) => (
        <ProductStatusToggle
          product={product}
          field="active"
          label={`Status ativo de ${product.name}`}
        />
      ),
    },
    {
      key: 'featured',
      header: 'Destaque',
      render: (product) => (
        <ProductStatusToggle
          product={product}
          field="featured"
          label={`Destaque de ${product.name}`}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (product) => (
        <ProductRowActions
          product={product}
          onDeleteRequest={onDeleteRequest}
          listReturnPath={listReturnPath}
        />
      ),
    },
  ]
}

function renderAddProductButton(newProductLinkState: ProductFormLocationState): ReactNode {
  return (
    <Link
      to="/products/new"
      state={newProductLinkState}
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

type ClearFiltersButtonProps = {
  onClear: () => void
}

function ClearFiltersButton({ onClear }: ClearFiltersButtonProps) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex cursor-pointer items-center gap-2 rounded-pill px-5 text-sm font-medium"
      style={{
        height: 'var(--control-h-sm)',
        border: '1px solid var(--border-soft)',
        color: 'var(--ink-700)',
        background: 'var(--surface-raised)',
        transition: 'opacity var(--dur-fast) var(--ease-out)',
      }}
    >
      <FilterX aria-hidden="true" className="h-4 w-4" />
      Limpar filtros
    </button>
  )
}

export function ProductListPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Carried as router `state` on the "Novo produto" and "Editar" links so
  // `ProductNewPage`/`ProductEditPage` can restore the admin's current
  // search, filter, and page selections after a successful create or edit
  // (Should 50), without `/products/new`/`/products/:id/edit` needing their
  // own querystring.
  const listReturnPath = `${PRODUCTS_LIST_PATH}${location.search}`
  const newProductLinkState: ProductFormLocationState = { from: listReturnPath }

  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const committedSearch = searchParams.get(SEARCH_PARAM) ?? ''
  const categoryId = searchParams.get(CATEGORY_PARAM) ?? ''
  const active = parseActiveParam(searchParams.get(ACTIVE_PARAM))

  // The text input needs to reflect every keystroke immediately, but the URL
  // (and therefore the query) should only update after the admin pauses
  // typing. `searchInput` is the immediate value; `committedSearch` (read
  // from the URL above) is the debounced value the query actually uses.
  const [searchInput, setSearchInput] = useState(committedSearch)
  const [syncedSearch, setSyncedSearch] = useState(committedSearch)
  if (committedSearch !== syncedSearch) {
    // The URL changed for a reason other than our own debounce commit (a
    // "Limpar filtros" click or browser back/forward) — resync the visible
    // input to match it. Adjusting state during render, per React's
    // guidance for syncing state to a changed external value.
    setSyncedSearch(committedSearch)
    setSearchInput(committedSearch)
  }

  const debounceRef = useRef<number | undefined>(undefined)

  // Tracks which product's delete confirmation is open, if any. Kept as a
  // single nullable value (rather than a set of open ids) so only one delete
  // confirmation can ever be open across the whole list at a time.
  const [productPendingDelete, setProductPendingDelete] = useState<Product | null>(null)

  const { data, totalCount, totalPages, isLoading, isError, refetch } = useProducts({
    page,
    search: committedSearch,
    categoryId: categoryId || undefined,
    active,
  })

  // True once the query has resolved and confirms the URL's `page` is past
  // the last page that actually has rows (e.g. the admin deleted the last
  // product on the last page, or landed here via a stale link/back-forward
  // navigation). `totalCount > 0` distinguishes this from a genuine "zero
  // products" result, which must keep rendering the true-empty/no-results
  // state rather than being redirected. Gated on `!isLoading && !isError` so
  // we never clamp against stale or incomplete data.
  const isPageOutOfRange = !isLoading && !isError && totalCount > 0 && page > totalPages

  // Redirecting to the last valid page is a sync of the URL to server data
  // that only resolves after the fetch completes, so — unlike the search
  // input's render-time resync above (which corrects local state to an
  // already-known URL value) — this belongs in an effect. `isPageOutOfRange`
  // flips back to `false` as soon as the URL page is clamped, so this can't
  // loop.
  useEffect(() => {
    if (!isPageOutOfRange) return
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set(PAGE_PARAM, String(totalPages))
        return next
      },
      { replace: true },
    )
  }, [isPageOutOfRange, totalPages, setSearchParams])

  const categoriesQuery = useCategories()
  const categoriesFailed = categoriesQuery.isError

  const categoryLabelById = new Map<string, string>()
  for (const category of categoriesQuery.data ?? []) {
    categoryLabelById.set(category.id, category.label)
  }
  const categoryOptions = buildCategoryOptions(categoriesQuery.data ?? [])

  const hasActiveFilters = committedSearch.trim() !== '' || categoryId !== '' || active !== undefined

  function commitSearch(value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value.trim() === '') {
        next.delete(SEARCH_PARAM)
      } else {
        next.set(SEARCH_PARAM, value)
      }
      next.delete(PAGE_PARAM)
      return next
    })
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      commitSearch(value)
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleCategoryChange(value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === '') {
        next.delete(CATEGORY_PARAM)
      } else {
        next.set(CATEGORY_PARAM, value)
      }
      next.delete(PAGE_PARAM)
      return next
    })
  }

  function handleActiveChange(value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === '') {
        next.delete(ACTIVE_PARAM)
      } else {
        next.set(ACTIVE_PARAM, value)
      }
      next.delete(PAGE_PARAM)
      return next
    })
  }

  function handlePageChange(nextPage: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set(PAGE_PARAM, String(nextPage))
      return next
    })
  }

  function handleClearFilters() {
    if (debounceRef.current !== undefined) {
      window.clearTimeout(debounceRef.current)
    }
    setSearchParams(new URLSearchParams())
  }

  function handleRetry() {
    refetch()
  }

  function handleCategoriesRetry() {
    categoriesQuery.refetch()
  }

  function handleDeleteRequest(product: Product) {
    setProductPendingDelete(product)
  }

  function handleCloseDeleteDialog() {
    setProductPendingDelete(null)
  }

  // Treat an out-of-range page the same as still loading: a corrected page
  // has already been requested (see the effect above) and its data is on
  // the way, so showing the true-empty state here would be misleading.
  const showLoadingState = isLoading || isPageOutOfRange
  const isTrueEmpty = !showLoadingState && !isError && data.length === 0 && !hasActiveFilters
  const isNoResults = !showLoadingState && !isError && data.length === 0 && hasActiveFilters
  const hasRows = !showLoadingState && !isError && data.length > 0

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

        {renderAddProductButton(newProductLinkState)}
      </div>

      <div
        className="mt-6 flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div className="sm:min-w-[220px] sm:flex-1">
          <TextField
            id="product-search"
            label="Buscar por nome"
            value={searchInput}
            onChange={handleSearchInputChange}
            placeholder="Digite o nome do produto…"
          />
        </div>

        <div className="sm:min-w-[200px]">
          <SelectField
            id="product-category-filter"
            label="Categoria"
            value={categoryId}
            onChange={handleCategoryChange}
            options={categoryOptions}
          />
          {categoriesFailed && (
            <div className="mt-1 flex items-center gap-2">
              <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--rose-400)' }} />
              <p className="text-xs" style={{ color: 'var(--rose-400)' }} role="alert">
                Não foi possível carregar as categorias.
              </p>
              <button
                type="button"
                onClick={handleCategoriesRetry}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium underline"
                style={{ color: 'var(--ink-700)' }}
              >
                <RefreshCw aria-hidden="true" className="h-3 w-3" />
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        <div className="sm:min-w-[180px]">
          <SelectField
            id="product-active-filter"
            label="Status"
            value={active === undefined ? '' : String(active)}
            onChange={handleActiveChange}
            options={ACTIVE_FILTER_OPTIONS}
          />
        </div>

        {hasActiveFilters && (
          <div className="sm:pb-0">
            <ClearFiltersButton onClear={handleClearFilters} />
          </div>
        )}
      </div>

      <div className="mt-6">
        {showLoadingState && (
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

        {!showLoadingState && isError && (
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

        {isTrueEmpty && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <PackagePlus aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhum produto cadastrado ainda.
            </p>
            {renderAddProductButton(newProductLinkState)}
          </div>
        )}

        {isNoResults && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <SearchX aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhum produto corresponde à busca ou aos filtros aplicados.
            </p>
            <ClearFiltersButton onClear={handleClearFilters} />
          </div>
        )}

        {hasRows && (
          <>
            <DataTable
              columns={buildColumns(categoryLabelById, handleDeleteRequest, listReturnPath)}
              rows={data}
              getRowId={(product) => product.id}
              caption="Lista de produtos"
            />

            <div className="mt-4">
              <Pagination
                page={page}
                pageSize={PRODUCTS_PAGE_SIZE}
                totalItems={totalCount}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      <ProductDeleteDialog product={productPendingDelete} onClose={handleCloseDeleteDialog} />
    </div>
  )
}
