import { LayoutDashboard, MessageSquare, Package, Tags } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type SidebarNavItem = {
  label: string
  to: string
  icon: LucideIcon
}

/**
 * Sidebar nav item copy, order, route, and icon (Must 12, Must 13). Order
 * and copy are preserved from the pre-responsive sidebar; only the icons and
 * active-link behavior are new.
 */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', to: '/products', icon: Package },
  { label: 'Categorias', to: '/categories', icon: Tags },
  { label: 'Feedbacks', to: '/feedbacks', icon: MessageSquare },
]
