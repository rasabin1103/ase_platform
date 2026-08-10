import { apiClient } from './client'

export type NotificationItem = {
  id: number
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export type NotificationListResponse = {
  items: NotificationItem[]
  limit: number
  offset: number
  total: number
  unread_count: number
}

export async function listMyNotifications(params?: { limit?: number; offset?: number }) {
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
