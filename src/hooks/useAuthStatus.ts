import { useEffect, useState } from 'react'
import { getSession } from '../lib/auth'
import type { AuthStatus } from '../router/types'

export function useAuthStatus(): AuthStatus {
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    getSession().then(session => {
      setStatus(session ? 'auth' : 'unauth')
    })
  }, [])

  return status
}
