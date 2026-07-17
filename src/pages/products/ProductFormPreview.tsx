import { useObjectUrl } from '../../hooks/useObjectUrl'
import { ProductPreviewCard } from '../../components/shared/ProductPreviewCard'
import type { Category } from '../../lib/queries/categories'
import type { BadgeTone } from '../../lib/queries/products'

export type ProductFormPreviewProps = {
  name: string
  categoryId: string
  categories: Category[]
  price: string
  originalPrice: string
  badgeTone: BadgeTone | ''
  badgeLabel: string
  coverImageFile: File | null
  existingCoverImageUrl: string | null
}

/**
 * Bridges `ProductForm`'s live TanStack Form field state into
 * `ProductPreviewCard`'s presentational props (Task 5): resolves
 * `category_id` to its label via the `categories` the form already loads
 * (Must 25), parses the string-typed price fields to numbers, and resolves
 * the previewed image from a newly selected cover file — via `useObjectUrl`,
 * reusing the same hook `CoverImageField` uses (Must 26) — or, failing
 * that, the product's existing cover image URL in edit mode (Must 27).
 *
 * A dedicated component, rather than inline logic inside `ProductForm`'s
 * `form.Subscribe` render callback, so `useObjectUrl` runs from a real
 * component render — not a plain function invocation — keeping the Rules of
 * Hooks unambiguous.
 */
export function ProductFormPreview({
  name,
  categoryId,
  categories,
  price,
  originalPrice,
  badgeTone,
  badgeLabel,
  coverImageFile,
  existingCoverImageUrl,
}: ProductFormPreviewProps) {
  const newFileImageUrl = useObjectUrl(coverImageFile)
  const category = categories.find((item) => item.id === categoryId)?.label ?? null

  const parsedPrice = Number(price)
  const trimmedOriginalPrice = originalPrice.trim()
  const parsedOriginalPrice = trimmedOriginalPrice === '' ? null : Number(trimmedOriginalPrice)

  return (
    <ProductPreviewCard
      name={name}
      category={category}
      price={Number.isNaN(parsedPrice) ? 0 : parsedPrice}
      originalPrice={parsedOriginalPrice === null || Number.isNaN(parsedOriginalPrice) ? null : parsedOriginalPrice}
      imageUrl={newFileImageUrl ?? existingCoverImageUrl}
      badgeTone={badgeTone === '' ? null : badgeTone}
      badgeLabel={badgeLabel.trim() === '' ? null : badgeLabel}
    />
  )
}
