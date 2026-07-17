import { AlertCircle, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ToastVariant } from './toast.types'

/** How long a toast stays on screen before auto-dismissing, in milliseconds. */
export const TOAST_DURATION_MS = 5000

type ToastVariantStyle = {
  accent: string
  Icon: LucideIcon
}

/** Visual treatment (accent color + icon) per toast variant. */
export const TOAST_VARIANT_STYLES: Record<ToastVariant, ToastVariantStyle> = {
  success: { accent: 'var(--emerald-500)', Icon: CheckCircle2 },
  error: { accent: 'var(--rose-400)', Icon: AlertCircle },
}
