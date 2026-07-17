import type { BadgeTone } from '../queries/products'
import type { ProductFormValues } from './productForm'

/**
 * Scalar (non-image) `Products` columns shared by `CreateProductInput` and
 * `UpdateProductInput`. Factored out of `ProductNewPage`/`ProductEditPage`
 * (Task 23) so both create and edit map `ProductFormValues` into
 * ready-to-persist values with a single, consistent set of emptiness
 * conventions instead of two independent copies that could drift apart.
 */
export type ProductFormScalarFields = {
  name: string
  category_id: string
  price: number
  original_price: number | null
  badge_tone: BadgeTone | null
  badge_label: string | null
  featured: boolean
  active: boolean
  description: string | null
}

/**
 * Parses the form's string/UI-only shape into the scalar fields both the
 * create and update mutations need. Mirrors `lib/forms/productForm.ts`'s
 * emptiness conventions: numeric fields treat `''` as unset,
 * `badge_tone`/`badge_label` treat an empty string as "no badge", and
 * `description` treats an empty string as "no description" — consistent
 * with how those fields' validators already allow blank values.
 */
export function toProductScalarFields(values: ProductFormValues): ProductFormScalarFields {
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
  }
}
