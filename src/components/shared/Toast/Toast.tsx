import { X } from 'lucide-react'
import { TOAST_VARIANT_STYLES } from './toast.data'
import type { ToastItem } from './toast.types'

type ToastProps = {
  toast: ToastItem
  onDismiss: (id: string) => void
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const { accent, Icon } = TOAST_VARIANT_STYLES[toast.variant]

  function handleDismiss() {
    onDismiss(toast.id)
  }

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-auto flex w-full items-start gap-3 border-l-4 px-4 py-3"
      style={{
        background: 'var(--surface-raised)',
        borderLeftColor: accent,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'toast-in var(--dur-med) var(--ease-out)',
      }}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />

      <p
        className="flex-1 text-sm"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-sans)' }}
      >
        {toast.message}
      </p>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Fechar notificação"
        className="shrink-0 cursor-pointer rounded-full p-1"
        style={{ color: 'var(--ink-500)', transition: 'opacity var(--dur-fast) var(--ease-out)' }}
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
