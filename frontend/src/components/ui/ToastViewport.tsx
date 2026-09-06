import { AlertTriangle, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { registerToastListener, type ErrorNotification } from './errorNotifications'

const AUTO_DISMISS_MS = 8000

/** Global toast stack for non-blocking failures (expected 4xx responses,
 * validation errors, etc.) — mounted once at the app root (see
 * app/providers.tsx) and fed by reportError()/errorNotifications.ts rather
 * than by props, so any query or mutation anywhere in the app can surface a
 * message here without this component needing to know about it. */
export function ToastViewport() {
  const [toasts, setToasts] = useState<ErrorNotification[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  useEffect(() => {
    const timerMap = timers.current
    registerToastListener((n) => {
      setToasts((prev) => [...prev, n])
      const timer = window.setTimeout(() => dismiss(n.id), AUTO_DISMISS_MS)
      timerMap.set(n.id, timer)
    })
    return () => {
      registerToastListener(null)
      timerMap.forEach((timer) => window.clearTimeout(timer))
      timerMap.clear()
    }
  }, [dismiss])

  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-live="assertive"
      role="region"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-ase-error/30 bg-ase-surface/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-md animate-fade-in-up"
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ase-error/30 bg-ase-error/10 text-ase-error">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ase-text">{toast.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-ase-text2">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-lg p-1 text-ase-muted transition hover:bg-white/[0.06] hover:text-ase-text"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
