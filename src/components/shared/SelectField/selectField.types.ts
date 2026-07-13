/** A single selectable option for `SelectField`. */
export type SelectFieldOption = {
  value: string
  label: string
}

/** Public props for `SelectField`. */
export type SelectFieldProps = {
  /** `id` of the select; also used to derive the error message id. */
  id: string
  /** `name` attribute for the select. Defaults to `id` when omitted. */
  name?: string
  /** Visible label text, associated with the select via `htmlFor`/`id`. */
  label: string
  /** Current value (controlled). */
  value: string
  /** Called with the next value on every change. */
  onChange: (value: string) => void
  /** Called when the select loses focus. */
  onBlur?: () => void
  /** Options rendered in order, e.g. categories or badge tones. */
  options: SelectFieldOption[]
  /** Shown as a disabled first option when `value` is empty (e.g. "Selecione uma categoria"). */
  placeholder?: string
  /** Shows a visual required-field indicator next to the label and sets `aria-required`. @default false */
  required?: boolean
  disabled?: boolean
  /** Validation error message to display below the select. Omit or pass `undefined` when the field is valid. */
  error?: string
}
