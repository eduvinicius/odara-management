import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/shared/Toast'
import { createEmptyProductFormValues } from '../../lib/forms/productForm'
import type { ProductFormValues } from '../../lib/forms/productForm'
import { toProductScalarFields } from '../../lib/forms/productMutationInput'
import { useCreateProduct } from '../../lib/mutations/products'
import type { CreateProductInput } from '../../lib/mutations/products'
import { resolveProductListReturnPath } from '../../router/productListReturnPath'
import { ProductForm } from './ProductForm'

/** Shown when creating a product fails, regardless of the underlying cause. */
const CREATE_ERROR_MESSAGE = 'Não foi possível criar o produto. Tente novamente.'

/**
 * Parses the form's string/UI-only shape into the mutation's typed input.
 * Scalar fields (name, price, badge, etc.) are parsed by the shared
 * `toProductScalarFields` helper, also used by `ProductEditPage` (Task 23),
 * so create and edit never drift apart on emptiness conventions.
 */
function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  return {
    ...toProductScalarFields(values),
    coverImageFile: values.coverImageFile,
    galleryImageFiles: values.galleryImageFiles,
  }
}

/**
 * Product creation page (Task 22). Renders `ProductForm` in create mode,
 * seeded from `createEmptyProductFormValues()`, and wires its `onSubmit` to
 * `useCreateProduct`.
 *
 * On success: shows a success toast and redirects back to the product list
 * (Must 41), where the newly created product appears at the top of the
 * freshly invalidated, newest-first list. The redirect target is the list
 * path the admin came from — including its search, filter, and page
 * selections — carried via router `state` on the "Novo produto" link
 * (Should 50); if that state is absent (e.g. this page was opened directly
 * via a bookmarked URL or a page refresh), it falls back to the bare
 * `/products` path.
 *
 * On failure: shows an error toast and stays on this page with the form's
 * entered values intact, so the admin can fix the issue and retry — no
 * partial product is ever left behind, since `useCreateProduct` uploads
 * images before inserting and aborts the whole operation if any upload fails
 * (Must 47).
 */
export function ProductNewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const createMutation = useCreateProduct()

  async function handleSubmit(values: ProductFormValues): Promise<void> {
    try {
      await createMutation.mutateAsync(toCreateProductInput(values))
      toast.success('Produto criado com sucesso.')
      navigate(resolveProductListReturnPath(location.state))
    } catch {
      toast.error(CREATE_ERROR_MESSAGE)
    }
  }

  return (
    <ProductForm
      title="Novo Produto"
      initialValues={createEmptyProductFormValues()}
      onSubmit={handleSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Criar produto"
    />
  )
}
