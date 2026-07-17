import type { ChangeEvent } from 'react'
import type { SelectFieldProps } from './selectField.types'

/**
 * Generic dropdown/select field for admin forms (category selector, badge
 * tone selector, and similar closed-option choices). Renders a label
 * associated with the select via `htmlFor`/`id`, an optional required
 * indicator, and an error message wired via `aria-describedby`/
 * `aria-invalid`.
 *
 * Options and validation are entirely caller-supplied — this component
 * carries no field-specific option lists or validation logic.
 */
export function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  required = false,
  disabled = false,
  error,
}: SelectFieldProps) {
  const errorId = `${id}-error`
  const hasError = Boolean(error)

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
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

      <select
        id={id}
        name={name ?? id}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-required={required || undefined}
        aria-describedby={hasError ? errorId : undefined}
        aria-invalid={hasError || undefined}
        className="w-full rounded-sm border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          borderColor: hasError ? 'var(--rose-400)' : 'var(--border-soft)',
          color: 'var(--ink-900)',
          background: 'var(--surface-raised)',
          height: 'var(--control-h-md)',
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasError && (
        <p id={errorId} role="alert" className="text-xs" style={{ color: 'var(--rose-400)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
