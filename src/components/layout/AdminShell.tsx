import { Outlet, Link, useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/auth'

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
          <Link
            to="/"
            className="block px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--ink-700)' }}
          >
            Dashboard
          </Link>
          <Link
            to="/products"
            className="block px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--ink-700)' }}
          >
            Produtos
          </Link>
          <Link
            to="/categories"
            className="block px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--ink-700)' }}
          >
            Categorias
          </Link>
          <Link
            to="/feedbacks"
            className="block px-3 py-2 rounded-md text-sm transition-colors"
            style={{ color: 'var(--ink-700)' }}
          >
            Feedbacks
          </Link>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-2 w-full text-left rounded-md transition-colors"
            style={{ color: 'var(--ink-500)' }}
          >
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
