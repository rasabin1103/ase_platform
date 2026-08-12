import * as Sentry from '@sentry/react'

/** Error monitoring — a no-op unless VITE_SENTRY_DSN is set, so local dev
 * and any deploy without a Sentry project keep working unchanged. Call this
 * once, before the app renders. */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.PROD ? 'production' : 'development'),
    // Fraction of page loads/navigations traced for performance monitoring —
    // kept low by default; errors are always captured regardless.
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}
