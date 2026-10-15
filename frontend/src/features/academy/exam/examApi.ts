import { apiClient } from '../../../api/client'

/** Simulacro de examen de ASE Academy (backend: app/modules/academy/exam_*). */

export type ExamChapterQuota = { chapter: number; title: string; count: number }

export type ExamConfig = {
  title: string
  courseTitle: string
  total: number
  minutes: number
  extendedMinutes: number
  passMark: number
  distribution: ExamChapterQuota[]
  bankSize: number
  distinctExams: number
}

export type ExamCertificate = {
  code: string
  courseKey: string
  courseTitle: string
  holderName: string
  score: number
  total: number
  issuedAt: string
}

export type ExamAttemptSummary = {
  id: string
  startedAt: string
  submittedAt: string | null
  score: number | null
  total: number
  passed: boolean | null
  timedOut: boolean
  extendedTime: boolean
  inProgress: boolean
}

export type ExamOverview = {
  courseKey: string
  config: ExamConfig
  authenticated: boolean
  hasAccess: boolean
  missions: { total: number; finished: number; missing: string[] }
  attempts: ExamAttemptSummary[]
  inProgressId: string | null
  bestScore: number | null
  passed: boolean
  certificate: ExamCertificate | null
  certificateEligible: boolean
}

export type ExamQuestion = {
  id: string
  number: number
  chapter: number
  section: string
  sectionTitle: string
  k: number
  text: string
  code: string | null
  options: string[]
  selected: number | null
  correct: number | null
  isCorrect: boolean | null
  explanation: string | null
}

export type ExamScoreLine = { key: string; title: string; correct: number; total: number }

export type ExamResult = {
  score: number
  total: number
  percent: number
  passMark: number
  passed: boolean
  timedOut: boolean
  chapters: ExamScoreLine[]
  sections: ExamScoreLine[]
  certificate: ExamCertificate | null
  certificateEligible: boolean
  missingMissions: string[]
}

export type ExamAttempt = {
  id: string
  courseKey: string
  title: string
  status: 'in_progress' | 'submitted'
  startedAt: string
  deadlineAt: string
  submittedAt: string | null
  serverNow: string
  extendedTime: boolean
  total: number
  passMark: number
  questions: ExamQuestion[]
  result: ExamResult | null
}

export type ExamAnswers = Record<string, number | null>

const base = (courseKey: string) => `/academy/exams/${encodeURIComponent(courseKey)}`

/** Idioma de las preguntas, títulos y explicaciones (el intento es el mismo). */
export type ExamLang = 'es' | 'en'
const q = (lang: ExamLang) => ({ params: { lang } })

export async function getExamOverview(courseKey: string, lang: ExamLang = 'es'): Promise<ExamOverview> {
  const { data } = await apiClient.get<ExamOverview>(base(courseKey), q(lang))
  return data
}

export async function startExam(courseKey: string, extendedTime: boolean, lang: ExamLang = 'es'): Promise<ExamAttempt> {
  const { data } = await apiClient.post<ExamAttempt>(`${base(courseKey)}/attempts`, { extendedTime }, q(lang))
  return data
}

export async function getExamAttempt(courseKey: string, attemptId: string, lang: ExamLang = 'es'): Promise<ExamAttempt> {
  const { data } = await apiClient.get<ExamAttempt>(`${base(courseKey)}/attempts/${attemptId}`, q(lang))
  return data
}

export async function saveExamAnswers(courseKey: string, attemptId: string, answers: ExamAnswers, lang: ExamLang = 'es'): Promise<ExamAttempt> {
  const { data } = await apiClient.put<ExamAttempt>(`${base(courseKey)}/attempts/${attemptId}/answers`, { answers }, q(lang))
  return data
}

export async function submitExam(courseKey: string, attemptId: string, answers: ExamAnswers, lang: ExamLang = 'es'): Promise<ExamAttempt> {
  const { data } = await apiClient.post<ExamAttempt>(`${base(courseKey)}/attempts/${attemptId}/submit`, { answers }, q(lang))
  return data
}

export async function claimCertificate(courseKey: string, lang: ExamLang = 'es'): Promise<ExamCertificate> {
  const { data } = await apiClient.post<ExamCertificate>(`/academy/certificates/${encodeURIComponent(courseKey)}`, null, q(lang))
  return data
}

export async function verifyCertificate(code: string, lang: ExamLang = 'es'): Promise<ExamCertificate> {
  const { data } = await apiClient.get<ExamCertificate>(`/academy/certificates/verify/${encodeURIComponent(code)}`, q(lang))
  return data
}

/** URL pública del PDF del certificado (lo genera el servidor). */
export function certificatePdfUrl(code: string, lang: ExamLang = 'es'): string {
  return `${apiClient.defaults.baseURL ?? '/api/v1'}/academy/certificates/verify/${encodeURIComponent(code)}/pdf?lang=${lang}`
}
