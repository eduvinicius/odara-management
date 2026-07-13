import { useId } from 'react'
import { Spinner } from '../../ui/Spinner'
import type { ToggleSwitchProps } from './toggleSwitch.types'

/**
 * Generic on/off toggle switch for both inline list actions (e.g. a
 * product's active/featured status in a table row) and form fields.
 *
 * Built as a `role="switch"` button rather than a checkbox so the exposed
 * accessibility semantics match the widget's actual behavior (an immediate
 * on/off action, not a form submission value). The accessible name always
 * comes from `label`; `hideLabel` only affects the visual presentation, so
 * screen reader users get the same experience in both use cases.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled = false,
  isPending = false,
}: ToggleSwitchProps) {
  const labelId = useId()
  const isDisabled = disabled || isPending

  function handleClick() {
    if (isDisabled) return
    onChange(!checked)
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        id={labelId}
        className={hideLabel ? 'sr-only' : 'text-sm'}
        style={hideLabel ? undefined : { color: 'var(--ink-700)' }}
      >
        {label}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-busy={isPending}
        disabled={isDisabled}
        onClick={handleClick}
        className="relative inline-flex shrink-0 cursor-pointer items-center rounded-pill disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          width: '44px',
          height: '24px',
          background: checked ? 'var(--emerald-500)' : 'var(--ink-300)',
          transition: `background var(--dur-fast) var(--ease-out)`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute rounded-circle bg-white shadow-sm"
          style={{
            width: '18px',
            height: '18px',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: `left var(--dur-fast) var(--ease-out)`,
          }}
        />

        {isPending && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
            <Spinner className="h-3 w-3" />
          </span>
        )}
      </button>
    </span>
  )
}
