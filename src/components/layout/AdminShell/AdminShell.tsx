import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

/**
 * Top-level layout for every protected route. Owns the sidebar's
 * open/closed state (Task 2) — a local `isOpen` flag, never a viewport
 * measurement (Must 17) — which starts `false` so the off-canvas sidebar is
 * always closed on first render at mobile widths (Must 18).
 *
 * Nothing sets `isOpen` to `true` yet: the hamburger button that opens it,
 * the scrim, and the sidebar's own close button all arrive in Task 3.
 */
export function AdminShell() {
  const [isOpen] = useState(false)

  return (
    <div className="flex h-screen" style={{ background: 'var(--cream-200)' }}>
      <Sidebar isOpen={isOpen} />

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
