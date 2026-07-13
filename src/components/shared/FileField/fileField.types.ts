/** Public props for `FileField`. */
export type FileFieldProps = {
  /** `id` of the file input; also used to derive the error/hint message ids. */
  id: string
  /** `name` attribute for the file input. Defaults to `id` when omitted. */
  name?: string
  /** Visible label text, associated with the file input via `htmlFor`/`id`. */
  label: string
  /** Native `accept` attribute, e.g. `"image/jpeg,image/png,image/webp"`. */
  accept?: string
  /** Allows selecting more than one file at once. @default false */
  multiple?: boolean
  /**
   * Called with the selected `FileList` (or `null` if the selection was
   * cleared) whenever the admin picks file(s). File inputs are uncontrolled
   * by the browser, so this component does not accept a `value` prop.
   */
  onChange: (files: FileList | null) => void
  onBlur?: () => void
  /** Shows a visual required-field indicator next to the label and sets `aria-required`. @default false */
  required?: boolean
  disabled?: boolean
  /** Validation error message to display below the control. Omit or pass `undefined` when there is no error. */
  error?: string
  /**
   * Optional helper text shown below the control (e.g. accepted formats or
   * size limits). Purely presentational — this component performs no file
   * type/size validation itself.
   */
  hint?: string
}
