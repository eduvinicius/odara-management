import type { CSSProperties } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, X } from 'lucide-react'
import { signOut } from '../../../lib/auth'
import { SIDEBAR_NAV_ITEMS } from './sidebar.data'
import type { SidebarProps } from './sidebar.types'

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
    isActive ? 'font-bold' : 'font-normal'
  }`
}

/** Cream-100 background + gold text for the active route's link (Must 15), determined by React Router's own active-match rather than a hardcoded value (Must 16). */
function navLinkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return isActive
    ? { background: 'var(--cream-100)', color: 'var(--text-gold)' }
    : { color: 'var(--ink-700)' }
}

/**
 * Admin shell sidebar. Renders as a sticky, in-flow, 248px rail at/above
 * the `nav` breakpoint (Must 1) and as a fixed, off-canvas panel below it
 * (Must 2) — driven entirely by the `isOpen` prop plus the `nav:`/base CSS
 * breakpoint (Must 17), never a viewport measurement. The open/close
 * transition animates with this codebase's `--dur-med`/`--ease-out` motion
 * tokens (Must 3).
 *
 * Task 3 adds the mobile-only close button in this panel's own header
 * (Must 10) and closes the panel whenever a nav link is clicked (Must 6) —
 * both call `onClose`, owned by `AdminShell`. The scrim and the hamburger
 * button that opens this panel live in `AdminShell`/`TopBar` instead, since
 * they sit outside the sidebar's own DOM.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] flex-col border-r transition-transform nav:sticky nav:inset-y-auto nav:left-auto nav:top-0 nav:z-auto nav:h-screen nav:shrink-0 nav:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
        transitionDuration: 'var(--dur-med)',
        transitionTimingFunction: 'var(--ease-out)',
      }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b p-6"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <span
          className="text-lg font-semibold"
          style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-cormorant)' }}
        >
          Odara Gerenciamento
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-circle nav:hidden"
          style={{ color: 'var(--ink-700)' }}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-4">
        {SIDEBAR_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onClose} className={navLinkClassName} style={navLinkStyle}>
            <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-4" style={{ borderColor: 'var(--border-soft)' }}>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm"
          style={{ color: 'var(--ink-500)' }}
        >
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
