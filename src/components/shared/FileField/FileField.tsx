import type { ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import type { FileFieldProps } from './fileField.types'

/**
 * Base file-picker primitive for admin forms (product cover and gallery
 * image uploads). Provides the label, a styled file-picker affordance, and
 * error/hint message wiring via `aria-describedby`.
 *
 * The native `<input type="file">` is kept fully functional and in the tab
 * order — it is stretched transparently over the decorative box rather than
 * visually hidden — so keyboard and screen reader users interact with the
 * real control. File inputs are inherently uncontrolled in the browser, so
 * this component reports raw `FileList` selections upward and performs no
 * type/size validation or multi-file gallery management itself; that
 * belongs to the feature composing this primitive.
 */
export function FileField({
  id,
  name,
  label,
  accept,
  multiple = false,
  onChange,
  onBlur,
  required = false,
  disabled = false,
  error,
  hint,
}: FileFieldProps) {
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const hasError = Boolean(error)
  const describedBy =
    [hasError ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files)
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="block text-sm" style={{ color: 'var(--ink-700)' }}>
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--rose-400)' }}>
            {' '}
            *
          </span>
        )}
        {required && <span className="sr-only"> (obrigatório)</span>}
      </label>

      <div
        className="relative flex w-full items-center gap-2 overflow-hidden rounded-sm border border-dashed px-3 text-sm"
        style={{
          borderColor: hasError ? 'var(--rose-400)' : 'var(--border-soft)',
          color: 'var(--ink-700)',
          background: 'var(--surface-raised)',
          height: 'var(--control-h-md)',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Upload aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span>{multiple ? 'Escolher imagens' : 'Escolher imagem'}</span>

        <input
          id={id}
          name={name ?? id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          aria-invalid={hasError || undefined}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>

      {hint && (
        <p id={hintId} className="text-xs" style={{ color: 'var(--ink-500)' }}>
          {hint}
        </p>
      )}
      {hasError && (
        <p id={errorId} role="alert" className="text-xs" style={{ color: 'var(--rose-400)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
