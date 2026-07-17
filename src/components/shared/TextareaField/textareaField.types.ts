/** Public props for `TextareaField`. */
export type TextareaFieldProps = {
  /** `id` of the textarea; also used to derive the error/count message ids. */
  id: string
  /** `name` attribute for the textarea. Defaults to `id` when omitted. */
  name?: string
  /** Visible label text, associated with the textarea via `htmlFor`/`id`. */
  label: string
  /** Current value (controlled). Line breaks are preserved as typed. */
  value: string
  /** Called with the next value on every change. */
  onChange: (value: string) => void
  /** Called when the textarea loses focus. */
  onBlur?: () => void
  placeholder?: string
  /** Shows a visual required-field indicator next to the label and sets `aria-required`. @default false */
  required?: boolean
  disabled?: boolean
  /** Validation error message to display below the field. Omit or pass `undefined` when the field is valid. */
  error?: string
  /** When provided, sets the native `maxLength` attribute and renders a live "current/max" character count below the field. */
  maxLength?: number
  /** Visible number of text rows. @default 4 */
  rows?: number
}
