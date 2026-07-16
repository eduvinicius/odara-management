import type { BadgeTone } from '../../../lib/queries/products'

/**
 * Badge tone → background/text color mapping (Must 32), matching the tones
 * defined for the Design System's `Badge` component (`sale`/`new`/`gold`/
 * `neutral`).
 */
export const BADGE_TONE_STYLES: Record<BadgeTone, { background: string; color: string }> = {
  sale: { background: 'var(--badge-sale-bg)', color: 'var(--white)' },
  new: { background: 'var(--badge-new-bg)', color: 'var(--white)' },
  gold: { background: 'var(--gradient-gold)', color: 'var(--text-on-gold)' },
  neutral: { background: 'var(--cream-100)', color: 'var(--ink-700)' },
}

/** Shown in place of an empty product name (Must 28). */
export const PRODUCT_NAME_PLACEHOLDER = 'Nome do produto'

/** Shown in place of an unresolved/empty category (Must 29). */
export const PRODUCT_CATEGORY_PLACEHOLDER = 'Categoria'
