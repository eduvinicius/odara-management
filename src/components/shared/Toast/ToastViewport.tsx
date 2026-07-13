import { createPortal } from 'react-dom'
import { Toast } from './Toast'
import type { ToastItem } from './toast.types'

type ToastViewportProps = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:w-96">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  )
}
