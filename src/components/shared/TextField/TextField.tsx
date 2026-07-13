import type { ChangeEvent } from 'react'
import type { TextFieldProps } from './textField.types'

/**
 * Generic single-line text/number input field for admin forms (product
 * name, price, original price, and similar values). Renders a label
 * associated with the input via `htmlFor`/`id`, an optional required
 * indicator, and an error message wired to the input via
 * `aria-describedby`/`aria-invalid`.
 *
 * Carries no field-specific validation logic (max length, positivity,
 * pairing rules, etc.) — that belongs to the form that owns this field.
 * `required` only renders the visual/AT indicator (`aria-required`); the
 * native `required` attribute is intentionally not set, so the browser's
 * built-in validation bubble never fights with the form library's own
 * error display.
 */
export function TextField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  min,
  max,
  step,
  maxLength,
  autoComplete,
}: TextFieldProps) {
  const errorId = `${id}-error`
  const hasError = Boolean(error)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
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

      <input
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-required={required || undefined}
        aria-describedby={hasError ? errorId : undefined}
        aria-invalid={hasError || undefined}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="w-full rounded-sm border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          borderColor: hasError ? 'var(--rose-400)' : 'var(--border-soft)',
          color: 'var(--ink-900)',
          background: 'var(--surface-raised)',
          height: 'var(--control-h-md)',
        }}
      />

      {hasError && (
        <p id={errorId} role="alert" className="text-xs" style={{ color: 'var(--rose-400)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
