import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/shared/Toast'
import { createEmptyProductFormValues } from '../../lib/forms/productForm'
import type { ProductFormValues } from '../../lib/forms/productForm'
import { useCreateProduct } from '../../lib/mutations/products'
import type { CreateProductInput } from '../../lib/mutations/products'
import { ProductForm } from './ProductForm'

/** Shown when creating a product fails, regardless of the underlying cause. */
const CREATE_ERROR_MESSAGE = 'Não foi possível criar o produto. Tente novamente.'

/**
 * Parses the form's string/UI-only shape into the mutation's typed input.
 * Mirrors `lib/forms/productForm.ts`'s emptiness conventions: numeric fields
 * treat `''` as unset, `badge_tone`/`badge_label` treat an empty string as
 * "no badge", and `description` treats an empty string as "no description" —
 * consistent with how those fields' validators already allow blank values.
 */
function toCreateProductInput(values: ProductFormValues): CreateProductInput {
  return {
    name: values.name,
    category_id: values.category_id,
    price: Number(values.price),
    original_price: values.original_price === '' ? null : Number(values.original_price),
    badge_tone: values.badge_tone === '' ? null : values.badge_tone,
    badge_label: values.badge_label === '' ? null : values.badge_label,
    featured: values.featured,
    active: values.active,
    description: values.description === '' ? null : values.description,
    coverImageFile: values.coverImageFile,
    galleryImageFiles: values.galleryImageFiles,
  }
}

/**
 * Product creation page (Task 22). Renders `ProductForm` in create mode,
 * seeded from `createEmptyProductFormValues()`, and wires its `onSubmit` to
 * `useCreateProduct`.
 *
 * On success: shows a success toast and redirects to `/products` (Must 41),
 * where the newly created product appears at the top of the freshly
 * invalidated, newest-first list.
 *
 * On failure: shows an error toast and stays on this page with the form's
 * entered values intact, so the admin can fix the issue and retry — no
 * partial product is ever left behind, since `useCreateProduct` uploads
 * images before inserting and aborts the whole operation if any upload fails
 * (Must 47).
 */
export function ProductNewPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const createMutation = useCreateProduct()

  async function handleSubmit(values: ProductFormValues): Promise<void> {
    try {
      await createMutation.mutateAsync(toCreateProductInput(values))
      toast.success('Produto criado com sucesso.')
      navigate('/products')
    } catch {
      toast.error(CREATE_ERROR_MESSAGE)
    }
  }

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-cormorant)',
          color: 'var(--ink-900)',
          fontSize: '1.75rem',
        }}
      >
        Novo Produto
      </h1>
      <div className="mt-6">
        <ProductForm
          initialValues={createEmptyProductFormValues()}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          submitLabel="Criar produto"
        />
      </div>
    </div>
  )
}
