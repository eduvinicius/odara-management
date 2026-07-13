import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactEventHandler } from 'react'
import { Spinner } from '../../ui/Spinner'
import type { ConfirmDialogProps } from './confirmDialog.types'

/**
 * Generic confirmation dialog for destructive or otherwise consequential
 * actions across the admin app (delete flows and beyond). Built on the
 * native `<dialog>` element so focus trapping, Esc-to-dismiss, and top-layer
 * stacking come from the browser rather than bespoke ARIA/JS. All copy
 * (title, message, button labels) is caller-supplied — this component
 * carries no action-specific wording.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Syncs the imperative <dialog> open/closed state with the `isOpen` prop.
  // `showModal()`/`close()` have no declarative equivalent, so this is one
  // of the legitimate cases for synchronizing with a non-React DOM widget.
  useEffect(() => {
    const dialogElement = dialogRef.current
    if (!dialogElement) return

    if (isOpen && !dialogElement.open) {
      dialogElement.showModal()
    } else if (!isOpen && dialogElement.open) {
      dialogElement.close()
    }
  }, [isOpen])

  const handleNativeCancel: ReactEventHandler<HTMLDialogElement> = (event) => {
    // Fires when the admin presses Esc. Prevented so the dialog stays fully
    // controlled by `isOpen`, and blocked entirely while a confirm is pending.
    event.preventDefault()
    if (!isConfirming) onCancel()
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    // A click lands on the <dialog> element itself only when it hits the
    // backdrop area, not the inner content panel.
    if (event.target === dialogRef.current && !isConfirming) onCancel()
  }

  function handleCancelClick() {
    onCancel()
  }

  function handleConfirmClick() {
    onConfirm()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleNativeCancel}
      onClick={handleBackdropClick}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-md border-0 p-0 backdrop:bg-transparent"
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex flex-col gap-4 p-6">
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold"
          style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-serif)' }}
        >
          {title}
        </h2>

        <div id="confirm-dialog-message" className="text-sm" style={{ color: 'var(--ink-700)' }}>
          {message}
        </div>

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            disabled={isConfirming}
            className="inline-flex cursor-pointer items-center justify-center rounded-pill px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              height: 'var(--control-h-sm)',
              border: '1px solid var(--border-soft)',
              color: 'var(--ink-700)',
              background: 'var(--surface-raised)',
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isConfirming}
            aria-busy={isConfirming}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              height: 'var(--control-h-sm)',
              border: '1px solid transparent',
              color: 'var(--text-on-dark)',
              background: 'var(--rose-400)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'opacity var(--dur-fast) var(--ease-out)',
            }}
          >
            {isConfirming && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
