import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import type { CategoryWithProductCount } from '../../lib/queries/categories'

type CategoryRowActionsProps = {
  /** The category row these actions apply to. */
  category: CategoryWithProductCount
}

/**
 * Builds the visible warning shown next to a disabled delete action, stating
 * how many products currently reference the category (Must 16).
 */
function buildAssignedProductsMessage(productCount: number): string {
  const productsClause =
    productCount === 1 ? '1 produto está associado' : `${productCount} produtos estão associados`

  return `${productsClause} a esta categoria. Reatribua ou remova-os antes de excluir.`
}

/**
 * Edit and delete actions for a single category list row (Task 9).
 *
 * The edit action opens the edit form for this category (Must 11). The
 * delete action is disabled — with a visible message stating how many
 * products reference the category — whenever one or more products are
 * currently assigned to it (Must 14, Must 15, Must 16), instead of only
 * surfacing the problem after a delete attempt.
 *
 * When zero products are assigned, activating delete opens a confirmation
 * dialog stating the action is irreversible (Must 17, Must 18). Actually
 * performing the delete against Supabase and showing success/error feedback
 * is wired in Task 10 — this dialog only opens/closes for now.
 */
export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const hasAssignedProducts = category.productCount > 0

  function handleDeleteClick() {
    if (hasAssignedProducts) return
    setIsConfirmOpen(true)
  }

  function handleCloseDialog() {
    setIsConfirmOpen(false)
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-4">
      <Link
        to={`/categories/${category.id}/edit`}
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--text-gold)' }}
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
        Editar
      </Link>

      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={hasAssignedProducts}
          aria-label={`Excluir ${category.label}`}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          style={{ color: hasAssignedProducts ? 'var(--ink-300)' : 'var(--rose-400)' }}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Excluir
        </button>

        {hasAssignedProducts && (
          <p className="text-xs" role="note" style={{ color: 'var(--ink-500)' }}>
            {buildAssignedProductsMessage(category.productCount)}
          </p>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={`Excluir "${category.label}"?`}
        message="Esta ação é permanente e não pode ser desfeita: a categoria será removida definitivamente."
        confirmLabel="Excluir"
        onConfirm={handleCloseDialog}
        onCancel={handleCloseDialog}
      />
    </div>
  )
}
