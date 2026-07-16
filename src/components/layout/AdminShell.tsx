import type { CSSProperties } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, MessageSquare, Package, Tags } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { signOut } from '../../lib/auth'

type NavItem = {
  label: string
  to: string
  icon: LucideIcon
}

/** Nav item copy, order, route, and icon (Must 12, Must 13). Order and copy match the pre-existing sidebar; only the icons and active-link behavior are new. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', to: '/products', icon: Package },
  { label: 'Categorias', to: '/categories', icon: Tags },
  { label: 'Feedbacks', to: '/feedbacks', icon: MessageSquare },
]

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

export function AdminShell() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--cream-200)' }}>
      <aside
        className="w-56 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-card)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <span
            className="font-semibold text-lg"
            style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-cormorant)' }}
          >
            Odara Management
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClassName} style={navLinkStyle}>
              <item.icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors"
            style={{ color: 'var(--ink-500)' }}
          >
            <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
