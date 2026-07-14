import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import type { Product } from '../../lib/queries/products'

type ProductRowActionsProps = {
  /** The product row these actions apply to. */
  product: Product
  /** Called when the admin clicks delete, requesting the confirmation dialog for this product. */
  onDeleteRequest: (product: Product) => void
}

/**
 * Edit and delete actions for a single product list row. Delete never
 * removes anything itself — it only asks the parent list page to open the
 * shared confirmation dialog for this product (Must 12), keeping exactly one
 * delete confirmation open across the whole list at a time.
 */
export function ProductRowActions({ product, onDeleteRequest }: ProductRowActionsProps) {
  function handleDeleteClick() {
    onDeleteRequest(product)
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        to={`/products/${product.id}/edit`}
        className="inline-flex items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--text-gold)' }}
      >
        <Pencil aria-hidden="true" className="h-4 w-4" />
        Editar
      </Link>

      <button
        type="button"
        onClick={handleDeleteClick}
        aria-label={`Excluir ${product.name}`}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium"
        style={{ color: 'var(--rose-400)' }}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
        Excluir
      </button>
    </div>
  )
}
