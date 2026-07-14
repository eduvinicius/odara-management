import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useToast } from '../../components/shared/Toast'
import { Spinner } from '../../components/ui/Spinner'
import { toProductFormValues } from '../../lib/forms/productForm'
import type { ProductFormValues } from '../../lib/forms/productForm'
import { toProductScalarFields } from '../../lib/forms/productMutationInput'
import { useUpdateProduct } from '../../lib/mutations/products'
import type { UpdateProductInput } from '../../lib/mutations/products'
import { useProduct } from '../../lib/queries/products'
import { resolveProductListReturnPath } from '../../router/productListReturnPath'
import { ProductForm } from './ProductForm'

/** Shown when updating a product fails, regardless of the underlying cause. */
const UPDATE_ERROR_MESSAGE = 'Não foi possível salvar as alterações do produto. Tente novamente.'

/** Shown when the product itself saved successfully. */
const UPDATE_SUCCESS_MESSAGE = 'Produto atualizado com sucesso.'

/**
 * Shown when the product saved successfully but the best-effort cleanup of
 * now-orphaned old images in storage failed afterward — the edit was NOT
 * lost, so this is a softer, non-blocking notice rather than an error.
 */
const UPDATE_SUCCESS_CLEANUP_FAILED_MESSAGE =
  'Produto atualizado, mas houve uma falha ao limpar imagens antigas.'

/**
 * Parses the form's string/UI-only shape into the update mutation's typed
 * input. Scalar fields are parsed by the shared `toProductScalarFields`
 * helper (also used by `ProductNewPage`, Task 22); the rest of this function
 * resolves the image slots, which only edit mode needs:
 *
 * - `keptGalleryImageUrls`/`removedGalleryImageUrls` are split from
 *   `values.existingGalleryImages` by its `markedForRemoval` flag.
 * - `removeCoverImage` is derived rather than tracked directly, because
 *   `existingCoverImageUrl` is not wired to a `form.Field` in `ProductForm`
 *   (`CoverImageField` only ever clears a *newly selected* pending file via
 *   `coverImageFile`, reverting to the existing cover — it has no control to
 *   clear the existing cover itself yet). So today `values.coverImageFile`
 *   and `values.existingCoverImageUrl` are the only two states reachable
 *   through the UI: "unchanged" (`existingCoverImageUrl` still set) or
 *   "replaced" (`coverImageFile` set). The check below is written for the
 *   full three-state contract `useUpdateProduct` documents (unchanged /
 *   replaced / removed-with-no-replacement) so that if `CoverImageField`
 *   later grows a "remove existing cover" action that nulls out
 *   `existingCoverImageUrl`, this derivation already handles it correctly.
 */
function toUpdateProductInput(
  id: string,
  values: ProductFormValues,
  originalHadCoverImage: boolean,
): UpdateProductInput {
  const keptGalleryImageUrls = values.existingGalleryImages
    .filter((image) => !image.markedForRemoval)
    .map((image) => image.url)

  const removedGalleryImageUrls = values.existingGalleryImages
    .filter((image) => image.markedForRemoval)
    .map((image) => image.url)

  const removeCoverImage =
    values.coverImageFile === null && values.existingCoverImageUrl === null && originalHadCoverImage

  return {
    id,
    ...toProductScalarFields(values),
    coverImageFile: values.coverImageFile,
    removeCoverImage,
    existingCoverImageUrl: values.existingCoverImageUrl,
    newGalleryImageFiles: values.galleryImageFiles,
    keptGalleryImageUrls,
    removedGalleryImageUrls,
  }
}

function PageHeading() {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-cormorant)',
        color: 'var(--ink-900)',
        fontSize: '1.75rem',
      }}
    >
      Editar Produto
    </h1>
  )
}

type ProductLoadStatusProps = {
  message: string
  children?: ReactNode
}

/** Shared centered panel for the loading and error/not-found states of the product fetch, styled consistently with `ProductListPage`'s equivalent states. */
function ProductLoadStatus({ message, children }: ProductLoadStatusProps) {
  return (
    <div
      className="mt-6 flex flex-col items-center justify-center gap-3 rounded-md px-6 py-16 text-center"
      style={{ background: 'var(--surface-card)', boxShadow: 'var(--shadow-xs)' }}
    >
      {children}
      <p className="text-sm" style={{ color: 'var(--ink-700)' }}>
        {message}
      </p>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 rounded-pill px-5 text-sm font-medium"
        style={{
          height: 'var(--control-h-sm)',
          border: '1px solid var(--border-soft)',
          color: 'var(--ink-700)',
          background: 'var(--surface-raised)',
          transition: 'opacity var(--dur-fast) var(--ease-out)',
        }}
      >
        Voltar para produtos
      </Link>
    </div>
  )
}

/**
 * Product edit page (Task 23). Loads the product identified by the `:id`
 * route param via `useProduct`, waits for it to resolve before mounting
 * `ProductForm` (TanStack Form only reads `defaultValues` on mount), and
 * wires the form's `onSubmit` to `useUpdateProduct`.
 *
 * On success: shows a success toast and redirects back to the product list
 * (Must 42). If the DB write succeeded but the mutation's best-effort image
 * cleanup failed, a softer success toast is shown instead — the edit itself
 * is never presented as a failure just because leftover storage cleanup
 * didn't run. The redirect target is the list path the admin came from —
 * including its search, filter, and page selections — carried via router
 * `state` on the row's "Editar" link (Should 50); if that state is absent
 * (e.g. this page was opened directly via a bookmarked URL or a page
 * refresh), it falls back to the bare `/products` path.
 *
 * On failure: shows an error toast and stays on this page with the form's
 * entered values intact — no partial edit is ever applied, since
 * `useUpdateProduct` uploads images and only updates the database row after
 * every upload succeeds, aborting before any write if an upload fails
 * (Must 47).
 */
export function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const productQuery = useProduct(id ?? '')
  const updateMutation = useUpdateProduct()

  async function handleSubmit(values: ProductFormValues): Promise<void> {
    if (!id) return

    try {
      const result = await updateMutation.mutateAsync(
        toUpdateProductInput(id, values, productQuery.data?.image_url != null),
      )
      toast.success(
        result.imageCleanupFailed ? UPDATE_SUCCESS_CLEANUP_FAILED_MESSAGE : UPDATE_SUCCESS_MESSAGE,
      )
      navigate(resolveProductListReturnPath(location.state))
    } catch {
      toast.error(UPDATE_ERROR_MESSAGE)
    }
  }

  if (!id) {
    return (
      <div>
        <PageHeading />
        <ProductLoadStatus message="Produto não encontrado.">
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </ProductLoadStatus>
      </div>
    )
  }

  if (productQuery.isLoading) {
    return (
      <div>
        <PageHeading />
        <ProductLoadStatus message="Carregando produto…">
          <Spinner className="h-6 w-6" />
        </ProductLoadStatus>
      </div>
    )
  }

  if (productQuery.isError || productQuery.data === null) {
    return (
      <div>
        <PageHeading />
        <ProductLoadStatus
          message={
            productQuery.isError
              ? 'Não foi possível carregar o produto. Tente novamente.'
              : 'Produto não encontrado.'
          }
        >
          <AlertTriangle aria-hidden="true" className="h-8 w-8" style={{ color: 'var(--rose-400)' }} />
        </ProductLoadStatus>
      </div>
    )
  }

  return (
    <div>
      <PageHeading />
      <div className="mt-6">
        <ProductForm
          initialValues={toProductFormValues(productQuery.data)}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          submitLabel="Salvar alterações"
        />
      </div>
    </div>
  )
}
