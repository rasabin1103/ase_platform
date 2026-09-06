import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './styles/fonts.css'
import './index.css'
import { AppProviders } from './app/providers'
import { router } from './app/router'
import { AppCrashFallback } from './components/ui/AppCrashFallback'
import { CookieNotice } from './components/layout/CookieNotice'
import { initSentry } from './monitoring'
import { registerServiceWorker } from './pwa'

initSentry()
registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Last line of defense against a render crash escaping every
        component-level error handler — without this, a bug anywhere in the
        tree shows the user a blank white page instead of a recovery
        screen. Sentry.ErrorBoundary still reports to Sentry when
        VITE_SENTRY_DSN is configured (see monitoring.ts); it's a no-op
        wrapper with no fallback UI otherwise. */}
    <Sentry.ErrorBoundary fallback={<AppCrashFallback />}>
      <AppProviders>
        <RouterProvider router={router} />
        <CookieNotice />
      </AppProviders>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
