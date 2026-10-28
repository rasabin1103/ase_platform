import type { AcademyRunSummary } from './api'
import type { CourseDef } from './engine/types'

export type MissionStatus = 'new' | 'in_progress' | 'finished'

export type CourseProgress = {
  /** Misiones terminadas (de todas las del curso, también las que aún no están disponibles). */
  done: number
  /** Misiones empezadas o terminadas. */
  started: number
  total: number
  complete: boolean
  /** Dónde seguir: la última misión a medias o la primera disponible sin terminar. */
  next: { index: number; id: string; title: string; status: MissionStatus } | null
}

/** Estado de una misión según el progreso guardado en el servidor. */
export function remoteStatus(run: AcademyRunSummary | undefined): MissionStatus | null {
  if (!run) return null
  return run.finished ? 'finished' : run.actionsCount > 0 ? 'in_progress' : 'new'
}

/**
 * Resumen del progreso de un curso. `statusOf` da el estado de cada misión
 * (servidor o, sin sesión, este navegador); `lastTouchedId` es la última
 * misión guardada, que tiene prioridad para «continuar».
 * Módulo ligero (sin el motor): lo usa también el panel del usuario.
 */
export function courseProgress(course: CourseDef, statusOf: (missionId: string) => MissionStatus, lastTouchedId?: string): CourseProgress {
  const rows = course.missions.map((m, index) => ({ index, id: m.id, title: m.title, available: m.available, status: m.available ? statusOf(m.id) : ('new' as MissionStatus) }))
  const done = rows.filter((r) => r.status === 'finished').length
  const started = rows.filter((r) => r.status !== 'new').length
  const last = rows.find((r) => r.id === lastTouchedId && r.status === 'in_progress')
  const pick = last ?? rows.find((r) => r.status === 'in_progress') ?? rows.find((r) => r.available && r.status !== 'finished') ?? null
  return {
    done,
    started,
    total: rows.length,
    complete: rows.length > 0 && done === rows.length,
    next: pick ? { index: pick.index, id: pick.id, title: pick.title, status: pick.status } : null,
  }
}

/** La misión guardada más recientemente. */
export function lastTouched(runs: AcademyRunSummary[] | undefined): string | undefined {
  if (!runs?.length) return undefined
  return [...runs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0].missionId
}
