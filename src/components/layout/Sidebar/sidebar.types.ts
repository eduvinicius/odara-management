export type SidebarProps = {
  /** Whether the off-canvas panel is slid into view below the `nav` breakpoint. Has no visual effect at/above the breakpoint, where the sidebar is always shown, sticky, in normal flow. */
  isOpen: boolean
  /** Called to close the off-canvas panel: from the panel's own close button or any nav link click (Must 6, Must 10). */
  onClose: () => void
}
