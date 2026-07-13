import type { ChangeEvent } from 'react'
import type { TextareaFieldProps } from './textareaField.types'

/**
 * Generic multi-line text field for admin forms (product description and
 * similar free-text content). The value is passed through unchanged, so
 * line breaks the admin types are preserved. When `maxLength` is supplied,
 * shows a live "current/max" character count in addition to the native
 * `maxLength` constraint.
 *
 * Carries no field-specific validation logic — the maximum length itself
 * and any other rule belongs to the form that owns this field.
 */
export function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  maxLength,
  rows = 4,
}: TextareaFieldProps) {
  const errorId = `${id}-error`
  const countId = `${id}-count`
  const hasError = Boolean(error)
  const describedBy =
    [hasError ? errorId : null, maxLength !== undefined ? countId : null].filter(Boolean).join(' ') ||
    undefined

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value)
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

      <textarea
        id={id}
        name={name ?? id}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={rows}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        aria-invalid={hasError || undefined}
        className="w-full resize-y rounded-sm border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          borderColor: hasError ? 'var(--rose-400)' : 'var(--border-soft)',
          color: 'var(--ink-900)',
          background: 'var(--surface-raised)',
        }}
      />

      <div className="flex items-center gap-2">
        {hasError && (
          <p id={errorId} role="alert" className="text-xs" style={{ color: 'var(--rose-400)' }}>
            {error}
          </p>
        )}
        {maxLength !== undefined && (
          <span id={countId} className="ml-auto text-xs" style={{ color: 'var(--ink-500)' }}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
