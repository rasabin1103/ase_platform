import { apiClient } from './client'

export type ContactSubmitPayload = {
  name: string
  email: string
  company?: string
  subject: string
  inquiry_type?: string
  message: string
}

export type ContactSubmitResponse = {
  message: string
}

export async function submitContactForm(payload: ContactSubmitPayload) {
  const { data } = await apiClient.post<ContactSubmitResponse>('/contact', payload)
  return data
}
