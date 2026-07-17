import { Gift } from 'lucide-react'
import { money } from '../../../lib/utils'
import { BADGE_TONE_STYLES, PRODUCT_CATEGORY_PLACEHOLDER, PRODUCT_NAME_PLACEHOLDER } from './productPreviewCard.data'
import type { ProductPreviewCardProps } from './productPreviewCard.types'

/**
 * Presentational, admin-only preview of how a product will appear in the
 * catalog (Task 4). Purely a rendering of the props it receives — no data
 * fetching, no form awareness, and no clickable controls (no "Adicionar"
 * button, no favorite icon, no `onClick`) (Must 33), since this card only
 * ever appears inside the product form, never the live catalog.
 *
 * Styling matches the Design System's `ProductCard` reference (Should 40):
 * `radius-lg` card, `radius-md`/4:3 image area, badge tone colors, and
 * typography — without the interactive hover elevation, since this card is
 * never clickable. `ProductForm` (Tasks 5-6) wires live field state into
 * these props; this component has no other consumer-facing behavior.
 */
export function ProductPreviewCard({
  name,
  category,
  price,
  originalPrice,
  imageUrl,
  badgeTone,
  badgeLabel,
}: ProductPreviewCardProps) {
  const displayName = name.trim() === '' ? PRODUCT_NAME_PLACEHOLDER : name
  const displayCategory = category && category.trim() !== '' ? category : PRODUCT_CATEGORY_PLACEHOLDER
  const hasOriginalPrice = originalPrice !== null

  return (
    <article
      className="flex flex-col overflow-hidden"
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="relative m-2 flex aspect-4/3 items-center justify-center overflow-hidden"
        style={{
          borderRadius: 'var(--radius-md)',
          background: imageUrl
            ? `center/cover no-repeat url("${imageUrl}")`
            : 'linear-gradient(150deg, var(--cream-100), var(--cream-300))',
        }}
      >
        {!imageUrl && (
          <Gift aria-hidden="true" className="h-11 w-11" style={{ color: 'var(--gold-400)', opacity: 0.7 }} />
        )}

        {badgeTone && badgeLabel && badgeLabel.trim() !== '' && (
          <span
            className="absolute left-2.5 top-2.5 inline-flex items-center rounded-pill px-2.75 py-1.25 text-2xs font-semibold uppercase leading-none"
            style={{
              fontFamily: 'var(--font-sans)',
              letterSpacing: 'var(--tracking-caps)',
              ...BADGE_TONE_STYLES[badgeTone],
            }}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 px-4 pt-2 pb-4">
        <span
          className="text-2xs font-medium uppercase"
          style={{ fontFamily: 'var(--font-sans)', letterSpacing: 'var(--tracking-caps)', color: 'var(--text-gold)' }}
        >
          {displayCategory}
        </span>

        <h3
          className="m-0 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink-900)', lineHeight: 1.15 }}
        >
          {displayName}
        </h3>

        <div className="mt-0.5 flex items-baseline gap-2">
          <span
            className="font-semibold leading-none"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'var(--text-lg)',
              color: hasOriginalPrice ? 'var(--rose-400)' : 'var(--ink-900)',
            }}
          >
            {money(price)}
          </span>
          {hasOriginalPrice && (
            <span className="text-sm line-through" style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink-500)' }}>
              {money(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
