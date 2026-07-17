import { ToggleSwitch } from '../../components/shared/ToggleSwitch'
import { useToast } from '../../components/shared/Toast'
import { useToggleProductField } from '../../lib/mutations/products'
import type { ToggleableProductField } from '../../lib/mutations/products'
import type { Product } from '../../lib/queries/products'

/** Feedback shown when an inline active/featured toggle fails to save. */
const TOGGLE_ERROR_MESSAGES: Record<ToggleableProductField, string> = {
  active: 'Não foi possível atualizar o status do produto. Tente novamente.',
  featured: 'Não foi possível atualizar o destaque do produto. Tente novamente.',
}

type ProductStatusToggleProps = {
  /** The product row this toggle controls. */
  product: Product
  /** Which boolean column this toggle flips. */
  field: ToggleableProductField
  /** Accessible name for the switch (visually hidden inline in the table). */
  label: string
}

/**
 * Inline active/featured toggle for a single product list row.
 *
 * Owns its own `useToggleProductField` mutation instance so its pending
 * state is scoped to exactly this row and field — toggling one product's
 * status never shows another row (or the other field on the same row) as
 * pending. `checked` is driven directly by `product[field]` from the
 * `useProducts` query cache rather than local state: since this mutation
 * never optimistically updates the cache, a failed toggle simply leaves the
 * query data (and therefore the visible switch) unchanged, and a successful
 * one is reflected once the `['products']` invalidation refetches.
 */
export function ProductStatusToggle({ product, field, label }: ProductStatusToggleProps) {
  const toast = useToast()
  const { mutate, isPending } = useToggleProductField()

  function handleChange(value: boolean) {
    mutate(
      { id: product.id, field, value },
      {
        onError: () => {
          toast.error(TOGGLE_ERROR_MESSAGES[field])
        },
      },
    )
  }

  return (
    <ToggleSwitch
      checked={product[field]}
      onChange={handleChange}
      label={label}
      hideLabel
      isPending={isPending}
    />
  )
}
