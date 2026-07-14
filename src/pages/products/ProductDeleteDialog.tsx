import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
import { useToast } from '../../components/shared/Toast'
import { useDeleteProduct } from '../../lib/mutations/products'
import type { Product } from '../../lib/queries/products'

/** Shown when a product delete fails, regardless of the underlying cause. */
const DELETE_ERROR_MESSAGE = 'Não foi possível excluir o produto. Tente novamente.'

type ProductDeleteDialogProps = {
  /** The product pending deletion, or `null` when no delete is in progress (dialog closed). */
  product: Product | null
  /** Called once the dialog should close — after a successful delete, a failed delete, or a cancel. */
  onClose: () => void
}

/**
 * Confirmation dialog for the product list's per-row delete action.
 *
 * Owns its own `useDeleteProduct` mutation instance so exactly one delete can
 * be in flight at a time (the list only ever renders one `product`, tracked
 * by the parent list page). Since `useDeleteProduct` only invalidates the
 * `['products']` cache on success, a failed delete leaves the list — and the
 * row being deleted — untouched; the dialog closes either way so the admin
 * always sees the resulting toast.
 */
export function ProductDeleteDialog({ product, onClose }: ProductDeleteDialogProps) {
  const toast = useToast()
  const { mutate, isPending } = useDeleteProduct()

  function handleConfirm() {
    if (!product) return

    mutate(
      { id: product.id, image_url: product.image_url, images: product.images },
      {
        onSuccess: () => {
          onClose()
          toast.success(`"${product.name}" foi excluído com sucesso.`)
        },
        onError: () => {
          onClose()
          toast.error(DELETE_ERROR_MESSAGE)
        },
      },
    )
  }

  return (
    <ConfirmDialog
      isOpen={product !== null}
      title={`Excluir "${product?.name ?? ''}"?`}
      message="Esta ação é permanente e não pode ser desfeita: o produto e todas as suas imagens serão removidos definitivamente do catálogo e do armazenamento. Se você só deseja ocultar o produto sem excluí-lo, use o status ativo na lista em vez de excluir."
      confirmLabel="Excluir"
      isConfirming={isPending}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  )
}
