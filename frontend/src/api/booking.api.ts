import { apiClient } from './client'

export type ConsultingSlot = {
  uuid: string
  starts_at: string
  duration_minutes: number
  status: 'open' | 'booked' | 'cancelled'
  notes: string | null
}

export type ConsultingSlotAdmin = ConsultingSlot & {
  booked_by_user_id: number | null
  booked_by_name: string | null
  booked_by_email: string | null
  booked_at: string | null
}

/** Open, upcoming slots any authenticated user can book — the in-house
 * replacement for an external scheduling tool. */
export async function listAvailableSlots(): Promise<ConsultingSlot[]> {
  const { data } = await apiClient.get<{ items: ConsultingSlot[] }>('/booking/slots')
  return data.items
}

export async function bookSlot(slotUuid: string, notes?: string): Promise<ConsultingSlot> {
  const { data } = await apiClient.post<ConsultingSlot>(`/booking/slots/${slotUuid}/book`, { notes: notes ?? null })
  return data
}

export async function listMyBookings(): Promise<ConsultingSlot[]> {
  const { data } = await apiClient.get<{ items: ConsultingSlot[] }>('/booking/my-bookings')
  return data.items
}

export async function cancelMyBooking(slotUuid: string): Promise<ConsultingSlot> {
  const { data } = await apiClient.post<ConsultingSlot>(`/booking/my-bookings/${slotUuid}/cancel`)
  return data
}

// --- Admin: manage availability -------------------------------------------

export async function adminListSlots(): Promise<ConsultingSlotAdmin[]> {
  const { data } = await apiClient.get<{ items: ConsultingSlotAdmin[] }>('/admin/booking/slots')
  return data.items
}

export async function adminCreateSlots(startsAtList: string[], durationMinutes: number): Promise<ConsultingSlotAdmin[]> {
  const { data } = await apiClient.post<{ items: ConsultingSlotAdmin[] }>('/admin/booking/slots', {
    starts_at_list: startsAtList,
    duration_minutes: durationMinutes,
  })
  return data.items
}

export async function adminDeleteSlot(slotUuid: string): Promise<void> {
  await apiClient.delete(`/admin/booking/slots/${slotUuid}`)
}
