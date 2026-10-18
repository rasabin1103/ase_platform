/**
 * Nota de un examen práctico (misión con `practicalExam`): retos del IDE
 * conseguidos y bugs reportados, menos los reports rechazados.
 */
import { reportedBugIds } from './engine'
import type { Mission, RunState } from './types'

export interface PracticalScore {
  score: number
  max: number
  passMark: number
  passed: boolean
  retos: { id: string; title: string; ok: boolean; points: number }[]
  bugs: { id: string; title: string; found: boolean; points: number }[]
  rejected: number
  penalty: number
}

export function practicalScore(mission: Mission, state: RunState): PracticalScore | null {
  const exam = mission.practicalExam
  if (!exam) return null
  const retos = (mission.codeLab?.retos ?? []).map((r) => {
    const ok = !!state.flags[`reto.${r.id}`]
    return { id: r.id, title: r.title, ok, points: ok ? exam.retoPoints : 0 }
  })
  const reported = reportedBugIds(state)
  const bugs = mission.bugs.map((b) => {
    const found = reported.includes(b.id)
    return { id: b.id, title: b.title, found, points: found ? exam.bugPoints : 0 }
  })
  const rejected = state.reports.filter((r) => r.status === 'rejected').length
  const penalty = rejected * exam.rejectedPenalty
  const raw = retos.reduce((n, r) => n + r.points, 0) + bugs.reduce((n, b) => n + b.points, 0)
  const max = retos.length * exam.retoPoints + bugs.length * exam.bugPoints
  const score = Math.max(0, raw - penalty)
  return { score, max, passMark: exam.passMark, passed: score >= exam.passMark, retos, bugs, rejected, penalty }
}

/** ¿Cuenta como terminada? (un examen práctico, solo si se aprueba). */
export function countsAsFinished(mission: Mission, state: RunState): boolean {
  if (!state.finished) return false
  const exam = practicalScore(mission, state)
  return !exam || exam.passed
}
