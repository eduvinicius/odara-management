import type { BadgeTone } from '../../../lib/queries/products'

export type ProductPreviewCardProps = {
  /** Previewed product name. Shows the "Nome do produto" placeholder when empty (Must 28). */
  name: string
  /** Previewed category label, already resolved by the caller (e.g. from `category_id` via the loaded `Categories`). Shows the "Categoria" placeholder when `null` or empty (Must 29). */
  category: string | null
  /** Previewed current price, always rendered. */
  price: number
  /** Previewed original price. Rendered struck through only when non-`null` (Must 30), independent of whether it is numerically greater than `price`. */
  originalPrice: number | null
  /** Previewed cover image URL — an object URL for a newly selected file, or the product's existing cover in edit mode. `null` renders the soft placeholder treatment (Should 38). */
  imageUrl: string | null
  /** Badge tone. The badge only renders when this and `badgeLabel` are both non-empty (Must 31). */
  badgeTone: BadgeTone | null
  /** Badge label text. The badge only renders when this and `badgeTone` are both non-empty (Must 31). */
  badgeLabel: string | null
}
