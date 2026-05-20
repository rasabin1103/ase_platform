import type { QueryClient } from '@tanstack/react-query'

export function invalidateAdminDashboard(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    queryClient.invalidateQueries({ queryKey: ['admin-analytics'] }),
  ])
}
