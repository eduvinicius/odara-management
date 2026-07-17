import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationProps } from './pagination.types'

/**
 * Generic prev/next pagination control for admin list views.
 *
 * The page size is a caller-supplied prop rather than a hardcoded value, so
 * any list (20-per-page products, or any other size) can reuse this
 * component. Wraps at narrow widths so it stays usable at 375px.
 */
export function Pagination({ page, pageSize, totalItems, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const canGoPrevious = page > 1
  const canGoNext = page < totalPages
  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalItems)

  function handlePrevious() {
    if (canGoPrevious) onPageChange(page - 1)
  }

  function handleNext() {
    if (canGoNext) onPageChange(page + 1)
  }

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-between gap-3 py-2">
      <p className="text-sm" style={{ color: 'var(--ink-500)' }}>
        {totalItems === 0 ? 'Nenhum resultado' : `Mostrando ${rangeStart}–${rangeEnd} de ${totalItems}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          aria-label="Página anterior"
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-pill px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            height: 'var(--control-h-sm)',
            border: '1px solid var(--border-soft)',
            color: 'var(--ink-700)',
            background: 'var(--surface-raised)',
            transition: 'opacity var(--dur-fast) var(--ease-out)',
          }}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Anterior
        </button>

        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
          Página {page} de {totalPages}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Próxima página"
          className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-pill px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            height: 'var(--control-h-sm)',
            border: '1px solid var(--border-soft)',
            color: 'var(--ink-700)',
            background: 'var(--surface-raised)',
            transition: 'opacity var(--dur-fast) var(--ease-out)',
          }}
        >
          Próxima
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
