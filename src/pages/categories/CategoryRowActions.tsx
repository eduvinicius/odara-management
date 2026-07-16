import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../components/shared/Toast'
import { useDeleteCategory } from '../../lib/mutations/categories'
import type { CategoryWithProductCount } from '../../lib/queries/categories'

/** Shown when a category delete fails, regardless of the underlying cause. */
const DELETE_ERROR_MESSAGE = 'Não foi possível excluir a categoria. Tente novamente.'

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
 * dialog stating the action is irreversible (Must 17, Must 18). Confirming
 * permanently deletes the category (Must 19), shows a success toast (Must
 * 20), and — since `useDeleteCategory` invalidates the `['categories']`
 * cache on success — leaves the admin on the list with the row removed
 * (Must 24) without any extra navigation. A failed delete shows an error
 * toast (Must 21) and leaves the category in place.
 */
export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const hasAssignedProducts = category.productCount > 0
  const toast = useToast()
  const { mutate, isPending } = useDeleteCategory()

  function handleDeleteClick() {
    if (hasAssignedProducts) return
    setIsConfirmOpen(true)
  }

  function handleCloseDialog() {
    if (isPending) return
    setIsConfirmOpen(false)
  }

  function handleConfirmDelete() {
    mutate(
      { id: category.id },
      {
        onSuccess: () => {
          setIsConfirmOpen(false)
          toast.success(`"${category.label}" foi excluída com sucesso.`)
        },
        onError: () => {
          setIsConfirmOpen(false)
          toast.error(DELETE_ERROR_MESSAGE)
        },
      },
    )
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
        isConfirming={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDialog}
      />
    </div>
  )
}
