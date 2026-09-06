import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

/** Rendered by Sentry.ErrorBoundary (see main.tsx) when a render crash
 * escapes every component-level error handler — the last line of defense
 * so a bug never shows the user a blank white screen. Sentry has already
 * captured the underlying error by the time this renders (when
 * VITE_SENTRY_DSN is configured); this is purely the user-facing recovery
 * screen.
 *
 * Deliberately has no dependency on the app's own providers (i18n, auth,
 * react-query) — anything above this in the tree may be exactly what just
 * crashed, so it reads the persisted language directly rather than through
 * useI18n(). */
export function AppCrashFallback() {
  const isEn = (() => {
    try {
      return localStorage.getItem('ase_language') === 'en'
    } catch {
      return false
    }
  })()

  const copy = isEn
    ? {
        title: 'Something went wrong',
        body: "We hit an unexpected error and couldn't continue. Reloading the page usually fixes it.",
        reload: 'Reload page',
        contact: 'If it keeps happening, contact us',
      }
    : {
        title: 'Algo ha salido mal',
        body: 'Hemos encontrado un error inesperado y no hemos podido continuar. Recargar la página suele solucionarlo.',
        reload: 'Recargar página',
        contact: 'Si sigue pasando, contáctanos',
      }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ase-bg px-6 py-16">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/60 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{ backgroundImage: 'radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.12),transparent_55%)' }}
        />
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ase-error/30 bg-ase-error/10 text-ase-error">
          <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-ase-text">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ase-text2">{copy.body}</p>
        <Button type="button" className="mt-6 w-full" onClick={() => window.location.reload()}>
          {copy.reload}
        </Button>
        <p className="mt-4 text-xs text-ase-muted">
          {copy.contact}{' '}
          <a href="mailto:contact@arcesabinengineering.com" className="text-ase-brand underline underline-offset-2">
            contact@arcesabinengineering.com
          </a>
        </p>
      </div>
    </div>
  )
}
