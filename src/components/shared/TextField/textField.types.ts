/** HTML input types supported by `TextField`. */
export type TextFieldType = 'text' | 'number'

/** Public props for `TextField`. */
export type TextFieldProps = {
  /** `id` of the input; also used to derive the error message id. */
  id: string
  /** `name` attribute for the input. Defaults to `id` when omitted. */
  name?: string
  /** Visible label text, associated with the input via `htmlFor`/`id`. */
  label: string
  /** HTML input type. @default 'text' */
  type?: TextFieldType
  /** Current value (controlled). Native inputs always report value as a string, including `type="number"`. */
  value: string
  /** Called with the next value on every change. */
  onChange: (value: string) => void
  /** Called when the input loses focus. */
  onBlur?: () => void
  placeholder?: string
  /** Shows a visual required-field indicator next to the label and sets `aria-required`. @default false */
  required?: boolean
  disabled?: boolean
  /** Validation error message to display below the input. Omit or pass `undefined` when the field is valid. */
  error?: string
  /** Native `min` attribute, relevant for `type="number"`. */
  min?: number
  /** Native `max` attribute, relevant for `type="number"`. */
  max?: number
  /** Native `step` attribute, relevant for `type="number"`. */
  step?: number
  /** Native `maxLength` attribute. */
  maxLength?: number
  autoComplete?: string
}
