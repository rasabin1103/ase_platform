import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { I18nProvider } from '../i18n'
import { AuthProvider } from '../auth/AuthProvider'

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
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}

