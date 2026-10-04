import { apiClient } from './client'

export type JobPostingStatus = 'draft' | 'published'
export type JobContractType = 'permanent' | 'temporary' | 'freelance' | 'internship'
export type JobWorkMode = 'remote' | 'hybrid' | 'onsite'
export type JobScheduleType = 'full_time' | 'part_time'
export type JobSalaryType = 'gross_yearly' | 'hourly'

export type JobPostingAdmin = {
  id: number
  uuid: string
  title: string
  description: string
  title_en: string | null
  description_en: string | null
  has_stored_image: boolean
  link_url: string
  salary_type: JobSalaryType
  salary_amount: string
  salary_amount_max: string | null
  contract_type: JobContractType
  work_mode: JobWorkMode
  schedule_type: JobScheduleType
  category: string
  status: JobPostingStatus
  published_at: string | null
  created_at: string
  updated_at: string
  viewsTotal: number
  clicksTotal: number
}

export type JobPostingAdminListResponse = {
  items: JobPostingAdmin[]
  limit: number
  offset: number
  total: number
}

export type JobPostingAdminPayload = {
  title: string
  description: string
  // Auto-translated (DeepL) on save when omitted/null — pass a non-null
  // value to set an explicit English override instead.
  title_en?: string | null
  description_en?: string | null
  link_url: string
  salary_type: JobSalaryType
  salary_amount: number
  salary_amount_max?: number | null
  contract_type: JobContractType
  work_mode: JobWorkMode
  schedule_type: JobScheduleType
  category: string
  status: JobPostingStatus
}

export type JobPostingAdminUpdatePayload = Partial<JobPostingAdminPayload>

export async function listAdminJobPostings(params?: { limit?: number; offset?: number; search?: string; status?: JobPostingStatus }) {
  const { data } = await apiClient.get<JobPostingAdminListResponse>('/admin/job-postings', { params })
  return data
}

export async function getAdminJobPosting(postingId: number) {
  const { data } = await apiClient.get<JobPostingAdmin>(`/admin/job-postings/${postingId}`)
  return data
}

export async function createAdminJobPosting(payload: JobPostingAdminPayload) {
  const { data } = await apiClient.post<JobPostingAdmin>('/admin/job-postings', payload)
  return data
}

export async function updateAdminJobPosting(postingId: number, payload: JobPostingAdminUpdatePayload) {
  const { data } = await apiClient.patch<JobPostingAdmin>(`/admin/job-postings/${postingId}`, payload)
  return data
}

export async function deleteAdminJobPosting(postingId: number) {
  await apiClient.delete(`/admin/job-postings/${postingId}`)
}

export async function uploadJobPostingImage(postingId: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  await apiClient.post(`/admin/job-postings/${postingId}/image`, form)
}

export async function clearJobPostingImage(postingId: number) {
  await apiClient.delete(`/admin/job-postings/${postingId}/image`)
}
