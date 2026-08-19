import { apiClient } from './client'

export async function confirmNewsletterUnsubscribe(token: string) {
  const { data } = await apiClient.post<{ ok: boolean }>('/newsletter/unsubscribe', { token })
  return data
}
