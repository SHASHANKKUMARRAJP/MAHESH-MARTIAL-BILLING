import React, {
  createContext, useContext, useState, useCallback,
} from 'react'
import type { Toast } from '../types'
import { generateId } from '../lib/utils'

interface ToastContextValue {
  toasts: Toast[]
  showToast: (type: Toast['type'], message: string, duration?: number) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: Toast['type'], message: string, duration = 3500) => {
      const id = generateId()
      setToasts(prev => [...prev, { id, type, message, duration }])
      setTimeout(() => dismissToast(id), duration)
    },
    [dismissToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
