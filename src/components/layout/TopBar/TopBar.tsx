import { Menu } from 'lucide-react'
import type { TopBarProps } from './topBar.types'

/**
 * Sticky, translucent mobile topbar (Task 3), shown only below the `nav`
 * breakpoint (Must 7, Must 8) — the sidebar itself is visible at/above it,
 * so no topbar is needed there. Hosts the hamburger button that opens the
 * off-canvas sidebar and the centered "Odara Management" title (Must 11).
 */
export function TopBar({ onOpenMenu }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-center border-b nav:hidden"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'color-mix(in srgb, var(--surface-card) 85%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="absolute left-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-circle"
        style={{ color: 'var(--ink-700)' }}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      <span
        className="text-base font-semibold"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-cormorant)' }}
      >
        Odara Gerenciamento
      </span>
    </header>
  )
}
