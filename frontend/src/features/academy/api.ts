import { isAxiosError } from 'axios'
import { apiClient } from '../../api/client'
import type { Action } from './engine/types'

/** Vínculo comercial de un curso del simulador (ver backend app/modules/academy). */
export type AcademyCourseAccess = {
  courseKey: string
  linked: boolean
  catalogSlug: string | null
  catalogType: 'product' | 'course' | 'book' | 'resource' | null
  catalogStatus: string | null
  title: string | null
  /** Tráiler del ítem del catálogo, si tiene. */
  trailerUrl?: string | null
  price: string | number | null
  currency: string | null
  isFree: boolean
  authenticated: boolean
  hasAccess: boolean
}

export async function getAcademyCourseAccess(courseKey: string): Promise<AcademyCourseAccess> {
  const { data } = await apiClient.get<AcademyCourseAccess>(`/academy/courses/${encodeURIComponent(courseKey)}/access`)
  return data
}

/** Un curso de la serie (Ruta SQL…) con el acceso y el progreso del usuario. */
export type AcademySeriesCourse = {
  catalogSlug: string
  catalogType: 'product' | 'course' | 'book' | 'resource'
  catalogStatus: string
  /** null si el ítem de la serie no es un curso del simulador. */
  courseKey: string | null
  title: string
  titleEn: string | null
  seriesOrder: number | null
  price: string | number | null
  currency: string | null
  isFree: boolean
  hasAccess: boolean
  isCurrent: boolean
  missionsStarted: number
  missionsFinished: number
}

export type AcademySeries = { courseKey: string; seriesName: string | null; items: AcademySeriesCourse[] }

/** Todos los cursos de la serie, vistos o no (vacío si el curso no está en una serie). */
export async function getAcademyCourseSeries(courseKey: string): Promise<AcademySeries> {
  const { data } = await apiClient.get<AcademySeries>(`/academy/courses/${encodeURIComponent(courseKey)}/series`)
  return data
}

/** Ficha pública del ítem del catálogo que vende el curso. */
export function catalogItemPath(access: Pick<AcademyCourseAccess, 'catalogSlug' | 'catalogType'>): string | null {
  if (!access.catalogSlug) return null
  return `/catalog/item/${access.catalogType ?? 'course'}/${access.catalogSlug}`
}

// --- Progreso guardado (requiere sesión) ------------------------------------
export type AcademyRun = {
  courseKey: string
  missionId: string
  seed: number
  actions: Action[]
  finished: boolean
  finishedAt: string | null
  updatedAt: string
}

export type AcademyRunSummary = { missionId: string; finished: boolean; actionsCount: number; updatedAt: string }

/** Devuelve null si el usuario no tiene progreso guardado para esa misión. */
export async function getAcademyRun(courseKey: string, missionId: string): Promise<AcademyRun | null> {
  try {
    const { data } = await apiClient.get<AcademyRun>(`/academy/runs/${courseKey}/${missionId}`)
    return data
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null
    throw err
  }
}

export async function saveAcademyRun(
  courseKey: string,
  missionId: string,
  run: { seed: number; actions: Action[]; finished: boolean },
): Promise<void> {
  await apiClient.put(`/academy/runs/${courseKey}/${missionId}`, run)
}

export async function listAcademyRuns(courseKey: string): Promise<AcademyRunSummary[]> {
  const { data } = await apiClient.get<{ items: AcademyRunSummary[] }>(`/academy/runs/${courseKey}`)
  return data.items
}

// --- Revisión de bug reports con IA (opcional) -------------------------------
export type AiReview = { score: number; strengths: string[]; improvements: string[]; suggestedTitle: string }

/** null si la IA no está configurada en el servidor (503). */
export async function reviewBugReport(body: {
  story: string
  acceptanceCriteria: string[]
  title: string
  steps: string
  expected: string
  actual: string
  severity: string
  actualBug?: string
}): Promise<AiReview | null> {
  try {
    const { data } = await apiClient.post<AiReview>('/academy/report-review', body)
    return data
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 503) return null
    throw err
  }
}
