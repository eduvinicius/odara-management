import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../Sidebar'
import { TopBar } from '../TopBar'

/**
 * Top-level layout for every protected route. Owns the sidebar's
 * open/closed state — a local `isOpen` flag, never a viewport measurement
 * (Must 17) — and renders:
 *
 * - `Sidebar`: sticky/in-flow at/above the `nav` breakpoint, off-canvas
 *   below it, starting closed on mobile (Must 18).
 * - A scrim, only rendered while `isOpen` is true, that closes the sidebar
 *   on click (Must 4, Must 5).
 * - `TopBar`: the mobile-only hamburger/title bar (Must 7-9, Must 11).
 *
 * The sidebar also auto-closes on every route change (Should 37), not only
 * on explicit nav link clicks (already handled by `Sidebar` itself calling
 * `onClose` from each link) — implemented here by comparing the current
 * location to the last-seen one during render and resetting `isOpen`
 * synchronously, the documented React pattern for "adjusting state when a
 * prop changes" without an Effect.
 */
export function AdminShell() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(location.pathname)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setIsOpen(false)
  }

  function handleOpenMenu() {
    setIsOpen(true)
  }

  function handleCloseMenu() {
    setIsOpen(false)
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--cream-200)' }}>
      <Sidebar isOpen={isOpen} onClose={handleCloseMenu} />

      {isOpen && (
        <button
          type="button"
          onClick={handleCloseMenu}
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 cursor-default nav:hidden"
          style={{ background: 'rgba(56, 41, 27, 0.45)' }}
        />
      )}

      <div className="flex flex-1 flex-col overflow-auto">
        <TopBar onOpenMenu={handleOpenMenu} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
