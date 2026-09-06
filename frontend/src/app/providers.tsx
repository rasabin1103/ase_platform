import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { I18nProvider } from '../i18n'
import { AuthProvider } from '../auth/AuthProvider'
import { reportError } from '../components/ui/errorNotifications'
import { CriticalErrorModal } from '../components/ui/CriticalErrorModal'
import { ToastViewport } from '../components/ui/ToastViewport'

// A query/mutation can opt out of this global surfacing by passing
// `meta: { suppressGlobalError: true }` in its useQuery/useMutation options
// — for the rare case where a component already renders its own inline
// error message and a toast on top of it would be redundant, or where a
// failure is an expected, silent part of the flow (e.g. a probe query).
function isSuppressed(meta: Record<string, unknown> | undefined): boolean {
  return meta?.suppressGlobalError === true
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      // Without a default, TanStack Query treats data as stale immediately
      // (staleTime: 0) and refetches on every mount/remount — noticeable as
      // extra network chatter when navigating back and forth between pages.
      // 30s is a safe default for read-mostly data; screens that need
      // fresher reads (admin dashboards, live run status, etc.) already set
      // their own shorter staleTime per-query and are unaffected.
      staleTime: 30_000,
    },
  },
  // Global safety net so every failed query/mutation surfaces *something*
  // to the user (per-component onError handlers, where they exist, still
  // run independently — this doesn't replace them, it just guarantees a
  // baseline for the many places that had no error UI at all). See
  // components/ui/errorNotifications.ts / ToastViewport / CriticalErrorModal.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (isSuppressed(query.meta)) return
      reportError(error)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (isSuppressed(mutation.meta)) return
      reportError(error)
    },
  }),
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
      <ToastViewport />
      <CriticalErrorModal />
    </QueryClientProvider>
  )
}

