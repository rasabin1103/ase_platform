import { apiClient } from './client'
import type { JobContractType, JobSalaryType, JobScheduleType, JobWorkMode } from './jobPostingsAdmin.api'

export type JobPosting = {
  id: number
  uuid: string
  title: string
  description: string
  // Auto-translated (DeepL) mirrors — null only if the posting predates
  // translation support, or DeepL was unreachable on save. Pick with
  // utils/localizedCatalogText.ts rather than reading these directly.
  title_en: string | null
  description_en: string | null
  image_url: string | null
  link_url: string
  salary_type: JobSalaryType
  salary_amount: string
  salary_amount_max: string | null
  contract_type: JobContractType
  work_mode: JobWorkMode
  schedule_type: JobScheduleType
  category: string
  published_at: string | null
  // Only non-null once the current user has a CV on file — a keyword-overlap
  // percentage against this specific posting. null means "no CV uploaded",
  // not "0% match".
  compatibility: number | null
}

export type JobPostingListResponse = {
  items: JobPosting[]
  limit: number
  offset: number
  total: number
}

export type CvProfile = {
  has_cv: boolean
  filename: string | null
  uploaded_at: string | null
}

export type JobPostingCompatibility = {
  percentage: number
  matched_keywords: string[]
  missing_keywords: string[]
  total: number
}

export async function listJobPostings(params?: {
  limit?: number
  offset?: number
  search?: string
  category?: string
  contract_type?: JobContractType
  work_mode?: JobWorkMode
  schedule_type?: JobScheduleType
  sort?: 'compatibility'
}) {
  const { data } = await apiClient.get<JobPostingListResponse>('/job-postings', { params })
  return data
}

export async function listJobPostingCategories() {
  const { data } = await apiClient.get<string[]>('/job-postings/categories')
  return data
}

export async function getJobPosting(postingId: number) {
  const { data } = await apiClient.get<JobPosting>(`/job-postings/${postingId}`)
  return data
}

export async function trackJobPostingView(postingId: number) {
  await apiClient.post(`/job-postings/${postingId}/view`)
}

export async function trackJobPostingClick(postingId: number) {
  await apiClient.post(`/job-postings/${postingId}/click`)
}

export async function getMyCvProfile() {
  const { data } = await apiClient.get<CvProfile>('/job-postings/cv')
  return data
}

export async function uploadMyCv(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await apiClient.post<CvProfile>('/job-postings/cv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteMyCv() {
  await apiClient.delete('/job-postings/cv')
}

export async function getJobPostingCompatibility(postingId: number) {
  const { data } = await apiClient.get<JobPostingCompatibility>(`/job-postings/${postingId}/compatibility`)
  return data
}

export type SemanticCompatibility = {
  percentage: number
  summary: string
  strengths: string[]
  gaps: string[]
  // Auto-translated (DeepL) mirrors — Groq answers in the posting's
  // language, so these cover the UI being set to the other one. Pick with
  // utils/localizedCatalogText.ts (summary) / localizedCatalogList (arrays).
  summary_en: string | null
  strengths_en: string[] | null
  gaps_en: string[] | null
  interview_tips: string[] | null
  interview_tips_en: string[] | null
}

/** Read-only peek — returns the cached AI analysis for this posting if the
 * user already ran it before, or null otherwise. Never calls Groq; safe to
 * call automatically on page load so an already-computed result shows up
 * without the user re-clicking Analyze. */
export async function peekJobPostingSemanticCompatibility(postingId: number) {
  const { data } = await apiClient.get<SemanticCompatibility | null>(`/job-postings/${postingId}/compatibility/semantic`)
  return data
}

/** On-demand AI analysis (Groq) — only triggered when the user explicitly
 * clicks Analyze, since it's a real external API call. Computed at most
 * once per posting: the backend persists the result and returns the same
 * cached value if called again, so this never doubles up on Groq usage. */
export async function analyzeJobPostingSemanticCompatibility(postingId: number) {
  const { data } = await apiClient.post<SemanticCompatibility>(`/job-postings/${postingId}/compatibility/semantic`)
  return data
}

/** This month's AI-analysis allowance, set per plan by the admin. `limit` and
 * `remaining` are null when the plan is unlimited. */
export type AiAnalysisQuota = {
  limit: number | null
  used: number
  remaining: number | null
}

export async function getAiAnalysisQuota() {
  const { data } = await apiClient.get<AiAnalysisQuota>('/job-postings/ai-quota')
  return data
}
