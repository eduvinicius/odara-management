import { useEffect, useState } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { getSession } from '../lib/auth'

type AuthStatus = 'loading' | 'auth' | 'unauth'

export function ProtectedRoute() {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    getSession().then(session => {
      setStatus(session ? 'auth' : 'unauth')
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--cream-200)' }}>
        <span style={{ color: 'var(--ink-500)', fontFamily: 'var(--font-jost)' }}>Carregando…</span>
      </div>
    )
  }

  return status === 'auth' ? <Outlet /> : <Navigate to="/login" replace />
}
