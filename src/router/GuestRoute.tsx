import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStatus } from '../hooks/useAuthStatus'

export function GuestRoute() {
  const status = useAuthStatus()

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--cream-200)' }}>
        <span style={{ color: 'var(--ink-500)', fontFamily: 'var(--font-jost)' }}>Carregando…</span>
      </div>
    )
  }

  return status === 'unauth' ? <Outlet /> : <Navigate to="/dashboard" replace />
}
