import { apiClient } from './client'

export type NotificationCategoryKey =
  | 'catalog'
  | 'jobs'
  | 'blog'
  | 'organization'
  | 'rewards'
  | 'announcements'
  | 'account'

export type NotificationItem = {
  id: number
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
  category: NotificationCategoryKey
}

export type NotificationListResponse = {
  items: NotificationItem[]
  limit: number
  offset: number
  total: number
  unread_count: number
}

export async function listMyNotifications(params?: {
  limit?: number
  offset?: number
  category?: NotificationCategoryKey
  unread_only?: boolean
}) {
  const { data } = await apiClient.get<NotificationListResponse>('/notifications', { params })
  return data
}

export async function getUnreadNotificationCount() {
  const { data } = await apiClient.get<{ unread_count: number }>('/notifications/unread-count')
  return data.unread_count
}

export async function markNotificationRead(notificationId: number) {
  const { data } = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`)
  return data
}

export async function markAllNotificationsRead() {
  await apiClient.post('/notifications/read-all')
}

export async function deleteNotification(notificationId: number) {
  await apiClient.delete(`/notifications/${notificationId}`)
}

export async function deleteReadNotifications() {
  const { data } = await apiClient.delete<{ deleted: number }>('/notifications/read')
  return data.deleted
}

export type DigestFrequency = 'off' | 'daily' | 'weekly'
export type MuteDuration = 'off' | '1h' | '8h' | '1d' | '7d' | 'forever'

export type CategoryPreference = {
  key: NotificationCategoryKey
  in_app: boolean
  email: boolean
  /** Account/security notices: always delivered, can't be switched off. */
  mandatory: boolean
}

export type NotificationPreferences = {
  muted_until: string | null
  is_muted: boolean
  digest_frequency: DigestFrequency
  categories: CategoryPreference[]
}

export type NotificationPreferencesUpdate = {
  digest_frequency?: DigestFrequency
  mute?: MuteDuration
  categories?: Partial<Record<NotificationCategoryKey, { in_app?: boolean; email?: boolean }>>
}

export async function getNotificationPreferences() {
  const { data } = await apiClient.get<NotificationPreferences>('/notifications/preferences')
  return data
}

export async function updateNotificationPreferences(payload: NotificationPreferencesUpdate) {
  const { data } = await apiClient.put<NotificationPreferences>('/notifications/preferences', payload)
  return data
}
