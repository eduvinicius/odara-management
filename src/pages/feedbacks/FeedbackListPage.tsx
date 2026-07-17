import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  FilterX,
  ImageOff,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  SearchX,
} from 'lucide-react'
import { DataTable } from '../../components/shared/DataTable'
import type { DataTableColumn } from '../../components/shared/DataTable'
import { Pagination } from '../../components/shared/Pagination'
import { SelectField } from '../../components/shared/SelectField'
import type { SelectFieldOption } from '../../components/shared/SelectField'
import { Spinner } from '../../components/ui/Spinner'
import { FEEDBACKS_PAGE_SIZE, useFeedbacks } from '../../lib/queries/feedbacks'
import type { FeedbackListItem } from '../../lib/queries/feedbacks'
import { FeedbackDeleteDialog } from './FeedbackDeleteDialog'
import { FeedbackFeaturedToggle } from './FeedbackFeaturedToggle'
import { FeedbackRowActions } from './FeedbackRowActions'

/** URL search param keys used to persist the list's filter/page state. */
const FEATURED_PARAM = 'featured'
const PAGE_PARAM = 'page'

const FEATURED_FILTER_OPTIONS: SelectFieldOption[] = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Destacados' },
  { value: 'false', label: 'Não destacados' },
]

function parsePageParam(raw: string | null): number {
  const parsed = raw === null ? 1 : Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1
}

function parseFeaturedParam(raw: string | null): boolean | undefined {
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

function formatFeedbackDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function renderThumbnail(feedback: FeedbackListItem): ReactNode {
  if (feedback.image_url) {
    return (
      <img
        src={feedback.image_url}
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
  onDeleteRequest: (feedback: FeedbackListItem) => void,
): Array<DataTableColumn<FeedbackListItem>> {
  return [
    {
      key: 'name',
      header: 'Nome',
      render: (feedback) => (
        <span className="font-medium" style={{ color: 'var(--ink-900)' }}>
          {feedback.name}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Produto',
      render: (feedback) => feedback.product?.name ?? 'Produto não encontrado',
    },
    {
      key: 'thumbnail',
      header: 'Imagem',
      render: renderThumbnail,
      hideOnMobile: true,
    },
    {
      key: 'featured',
      header: 'Destaque',
      render: (feedback) => <FeedbackFeaturedToggle feedback={feedback} />,
    },
    {
      key: 'created_at',
      header: 'Criado em',
      render: (feedback) => formatFeedbackDate(feedback.created_at),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (feedback) => (
        <FeedbackRowActions feedback={feedback} onDeleteRequest={onDeleteRequest} />
      ),
    },
  ]
}

function renderAddFeedbackButton(): ReactNode {
  return (
    <Link
      to="/feedbacks/new"
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
      Novo feedback
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

/**
 * Feedback list page (Task 10). Renders a paginated, newest-first list of
 * feedbacks (Must 1, Must 4) showing each row's customer name, linked
 * product, image thumbnail, featured status, and creation date (Must 2),
 * with a featured-status filter (Must 3) and 20-per-page pagination (Must
 * 38), all usable at 375px width via `DataTable`'s stacked mobile layout
 * (Must 34).
 *
 * Renders four mutually exclusive states: a loading spinner, a load error
 * with a retry action (Must 30, Must 31), a true-empty state distinct from
 * a no-results-from-filter state (Must 32, Must 33), and the populated
 * table/list. When the current page falls out of range after data changes
 * (e.g. deleting the last row on the last page shrinks `totalPages`), the
 * page param is automatically clamped back to the last valid page instead
 * of showing a false empty state (Should 41).
 *
 * Row-level featured toggling is delegated to `FeedbackFeaturedToggle`
 * (Task 8, self-contained per-row pending state), and delete confirmation
 * to the shared `FeedbackDeleteDialog` (Task 9), controlled here by a
 * single nullable "feedback pending delete" so only one confirmation can
 * ever be open at a time.
 */
export function FeedbackListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = parsePageParam(searchParams.get(PAGE_PARAM))
  const featured = parseFeaturedParam(searchParams.get(FEATURED_PARAM))

  // Tracks which feedback's delete confirmation is open, if any. Kept as a
  // single nullable value (rather than a set of open ids) so only one
  // delete confirmation can ever be open across the whole list at a time.
  const [feedbackPendingDelete, setFeedbackPendingDelete] = useState<FeedbackListItem | null>(null)

  const { data, totalCount, totalPages, isLoading, isError, refetch } = useFeedbacks({
    page,
    featured,
  })

  // True once the query has resolved and confirms the URL's `page` is past
  // the last page that actually has rows (e.g. the admin deleted the last
  // feedback on the last page, or landed here via a stale link/back-forward
  // navigation). `totalCount > 0` distinguishes this from a genuine "zero
  // feedbacks" result, which must keep rendering the true-empty/no-results
  // state rather than being redirected. Gated on `!isLoading && !isError` so
  // we never clamp against stale or incomplete data.
  const isPageOutOfRange = !isLoading && !isError && totalCount > 0 && page > totalPages

  // Redirecting to the last valid page is a sync of the URL to server data
  // that only resolves after the fetch completes, so — unlike a render-time
  // resync of already-known values — this belongs in an effect (Should 41).
  // `isPageOutOfRange` flips back to `false` as soon as the URL page is
  // clamped, so this can't loop.
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

  const hasActiveFilters = featured !== undefined

  function handleFeaturedChange(value: string) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      if (value === '') {
        next.delete(FEATURED_PARAM)
      } else {
        next.set(FEATURED_PARAM, value)
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
    setSearchParams(new URLSearchParams())
  }

  function handleRetry() {
    refetch()
  }

  function handleDeleteRequest(feedback: FeedbackListItem) {
    setFeedbackPendingDelete(feedback)
  }

  function handleCloseDeleteDialog() {
    setFeedbackPendingDelete(null)
  }

  // Treat an out-of-range page the same as still loading: a corrected page
  // has already been requested (see the effect above) and its data is on
  // the way, so showing the true-empty state here would be misleading.
  const showLoadingState = isLoading || isPageOutOfRange
  const isTrueEmpty = !showLoadingState && !isError && data.length === 0 && !hasActiveFilters
  const isNoResults = !showLoadingState && !isError && data.length === 0 && hasActiveFilters
  const hasRows = !showLoadingState && !isError && data.length > 0

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
          Feedbacks
        </h1>

        {renderAddFeedbackButton()}
      </div>

      <div
        className="mt-6 flex flex-col gap-4 rounded-md p-4 sm:flex-row sm:flex-wrap sm:items-end"
        style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div className="sm:min-w-[200px]">
          <SelectField
            id="feedback-featured-filter"
            label="Destaque"
            value={featured === undefined ? '' : String(featured)}
            onChange={handleFeaturedChange}
            options={FEATURED_FILTER_OPTIONS}
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
              Carregando feedbacks…
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
              Não foi possível carregar os feedbacks. Tente novamente.
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
            <MessageSquarePlus aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhum feedback cadastrado ainda.
            </p>
            {renderAddFeedbackButton()}
          </div>
        )}

        {isNoResults && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
            style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
          >
            <SearchX aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--ink-300)' }} />
            <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
              Nenhum feedback em destaque encontrado.
            </p>
            <ClearFiltersButton onClear={handleClearFilters} />
          </div>
        )}

        {hasRows && (
          <>
            <DataTable
              columns={buildColumns(handleDeleteRequest)}
              rows={data}
              getRowId={(feedback) => feedback.id}
              caption="Lista de feedbacks"
            />

            <div className="mt-4">
              <Pagination
                page={page}
                pageSize={FEEDBACKS_PAGE_SIZE}
                totalItems={totalCount}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      <FeedbackDeleteDialog feedback={feedbackPendingDelete} onClose={handleCloseDeleteDialog} />
    </div>
  )
}
