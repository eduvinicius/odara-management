import { createContext, useContext } from 'react'
import type { ToastContextValue } from './toast.types'

export const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * Access the app-wide toast notification API.
 *
 * Must be called from a component rendered under `<ToastProvider>`.
 *
 * @example
 * const toast = useToast()
 * toast.success('Produto criado com sucesso.')
 * toast.error('Não foi possível salvar o produto.')
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (context === null) {
    throw new Error('useToast deve ser usado dentro de um <ToastProvider>.')
  }
  return context
}
