import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './toastContext'
import { ToastViewport } from './ToastViewport'
import { TOAST_DURATION_MS } from './toast.data'
import type { ToastContextValue, ToastItem, ToastVariant } from './toast.types'

type ToastProviderProps = {
  children: ReactNode
}

/**
 * App-wide provider for success/error toast notifications.
 * Mount once near the root of the app; any descendant can call `useToast()`.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))

    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, variant, message }])

      const timer = setTimeout(() => dismiss(id), TOAST_DURATION_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => show('success', message),
      error: (message: string) => show('error', message),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
