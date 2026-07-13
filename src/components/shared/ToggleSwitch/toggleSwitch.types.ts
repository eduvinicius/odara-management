/** Public props for `ToggleSwitch`. */
export type ToggleSwitchProps = {
  /** Current on/off state (controlled). */
  checked: boolean
  /** Called with the next checked value when the admin toggles the switch. */
  onChange: (checked: boolean) => void
  /** Accessible name for the switch. Always rendered in the DOM; visually hidden when `hideLabel` is true. */
  label: string
  /** Visually hides the label text while keeping it available to screen readers (e.g. inline table use). @default false */
  hideLabel?: boolean
  /** Disables the switch entirely, blocking interaction. @default false */
  disabled?: boolean
  /** Shows a pending state (spinner, blocked interaction) while an associated mutation is in flight. @default false */
  isPending?: boolean
}
