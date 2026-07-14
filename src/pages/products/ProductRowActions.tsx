import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import type { Product } from '../../lib/queries/products'
import type { ProductFormLocationState } from '../../router/productListReturnPath'

type ProductRowActionsProps = {
  /** The product row these actions apply to. */
  product: Product
  /** Called when the admin clicks delete, requesting the confirmation dialog for this product. */
  onDeleteRequest: (product: Product) => void
  /**
   * The current product list path, including its querystring (search,
   * category, active, and page params). Carried as router `state` on the
   * "Editar" link so `ProductEditPage` can restore these selections after a
   * successful edit (Should 50).
   */
  listReturnPath: string
}

/**
 * Edit and delete actions for a single product list row. Delete never
 * removes anything itself — it only asks the parent list page to open the
 * shared confirmation dialog for this product (Must 12), keeping exactly one
 * delete confirmation open across the whole list at a time.
 */
export function ProductRowActions({ product, onDeleteRequest, listReturnPath }: ProductRowActionsProps) {
  function handleDeleteClick() {
    onDeleteRequest(product)
  }

  const editLinkState: ProductFormLocationState = { from: listReturnPath }

  return (
    <div className="flex items-center gap-4">
      <Link
        to={`/products/${product.id}/edit`}
        state={editLinkState}
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
