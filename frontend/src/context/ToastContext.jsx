import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let bgStyle = 'bg-slate-900 border border-slate-700 text-slate-100'
          let Icon = Info
          let iconColor = 'text-cyan-400'

          if (toast.type === 'success') {
            bgStyle = 'bg-emerald-950/90 border border-emerald-500/40 text-emerald-100'
            Icon = CheckCircle2
            iconColor = 'text-emerald-400'
          } else if (toast.type === 'error') {
            bgStyle = 'bg-rose-950/90 border border-rose-500/40 text-rose-100'
            Icon = XCircle
            iconColor = 'text-rose-400'
          } else if (toast.type === 'warning') {
            bgStyle = 'bg-amber-950/90 border border-amber-500/40 text-amber-100'
            Icon = AlertTriangle
            iconColor = 'text-amber-400'
          }

          return (
            <div
              key={toast.id}
              className={`toast-item ${bgStyle}`}
              role="alert"
            >
              <Icon size={18} className={`shrink-0 ${iconColor}`} />
              <div className="flex-1 font-medium text-xs leading-relaxed">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
