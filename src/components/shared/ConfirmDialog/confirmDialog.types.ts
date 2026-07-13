import type { ReactNode } from 'react'

/** Public props for `ConfirmDialog`. */
export type ConfirmDialogProps = {
  /** Whether the dialog is currently open. */
  isOpen: boolean
  /** Heading shown at the top of the dialog. */
  title: string
  /** Body content explaining the action and its consequences (caller-supplied wording). */
  message: ReactNode
  /** Label for the confirm button. @default 'Confirmar' */
  confirmLabel?: string
  /** Label for the cancel button. @default 'Cancelar' */
  cancelLabel?: string
  /** Shows a pending state on the confirm button and blocks dismissal while true. */
  isConfirming?: boolean
  /** Called when the admin confirms the action. */
  onConfirm: () => void
  /** Called when the admin cancels or dismisses the dialog (Cancel button, backdrop click, or Esc). */
  onCancel: () => void
}
