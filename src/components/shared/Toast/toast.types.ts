/** The two supported notification variants. */
export type ToastVariant = 'success' | 'error'

/** A single active toast notification. */
export type ToastItem = {
  id: string
  variant: ToastVariant
  message: string
}

/** Public API exposed by `useToast()`. */
export type ToastContextValue = {
  success: (message: string) => void
  error: (message: string) => void
}
