import { describe, expect, it } from 'vitest'
import { m10Examen as mission } from '../content/courses/karate-framework/m10-examen'
import { M10_SOLUTION } from '../content/courses/karate-framework/m10-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import { countsAsFinished, practicalScore } from './practicalExam'
import type { BugReportInput, RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)
const SOLUTION = { ...initial(), ...M10_SOLUTION }

function run(s: RunState, files: Record<string, string>, job?: string) {
  const lab = runLab(mission, s, files, { job })
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return s
}

const REPORTS: Record<string, Omit<BugReportInput, 'evidence'>> = {
  'KA-FRECUENCIA': { title: 'Se acepta la frequency en minúsculas (monthly) con 201', steps: 'POST /standing-orders con frequency monthly', expected: '400 field frequency', actual: '201', severity: 'medium' },
  'KA-HOY': { title: 'startDate de hoy 2026-10-23 se rechaza con 400', steps: 'POST con startDate hoy', expected: '201', actual: '400', severity: 'high' },
  'KA-CANCELAR': { title: 'Tras cancelar (DELETE 204) la orden sigue ACTIVE', steps: 'DELETE y GET', expected: 'CANCELLED', actual: 'ACTIVE', severity: 'critical' },
  'KA-SCOPE-DEL': { title: 'Un token accounts:read (solo lectura) puede cancelar: DELETE da 204', steps: 'DELETE con token de solo lectura', expected: '403', actual: '204', severity: 'critical' },
}

function exam(): RunState {
  return replay(mission, 23, [{ type: 'start' }])
}

describe('curso 3 · examen práctico', () => {
  it('sin hacer nada: 0 puntos y no cuenta como terminado', () => {
    let s = exam()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'submit' })
    expect(s.finished).toBe(true)
    expect(practicalScore(mission, s)).toMatchObject({ score: 0, max: 100, passed: false })
    expect(countsAsFinished(mission, s)).toBe(false)
  })

  it('la solución consigue los 8 retos; con los 4 bugs reportados saca 100 y aprueba', () => {
    let s = run(exam(), SOLUTION)
    s = run(s, SOLUTION, 'nightly')
    for (const r of mission.codeLab!.retos) expect(s.flags[`reto.${r.id}`], r.id).toBe(true)
    expect([...s.triggeredBugs].sort()).toEqual(['KA-CANCELAR', 'KA-FRECUENCIA', 'KA-HOY', 'KA-SCOPE-DEL'])
    expect(practicalScore(mission, s)).toMatchObject({ score: 80, passed: true })
    for (const [bug, r] of Object.entries(REPORTS)) {
      const ev = s.log.filter((l) => l.bugs?.includes(bug)).map((l) => l.id)
      s = step(mission, s, { type: 'report', report: { ...r, evidence: ev.slice(0, 1) } })
    }
    expect(practicalScore(mission, s)!.bugs.every((b) => b.found)).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 240 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'submit' })
    expect(practicalScore(mission, s)).toMatchObject({ score: 100, passed: true })
    expect(countsAsFinished(mission, s)).toBe(true)
  })

  it('un report de algo que no es un bug resta puntos', () => {
    let s = run(exam(), SOLUTION)
    const ev = s.log.filter((l) => !l.bugs?.length).map((l) => l.id)
    s = step(mission, s, { type: 'report', report: { title: 'El id de la orden empieza por SO', steps: 'POST', expected: 'otro formato', actual: 'SO-7001', severity: 'low', evidence: ev.slice(0, 1) } })
    expect(s.reports.at(-1)!.status).toBe('rejected')
    expect(practicalScore(mission, s)!.penalty).toBe(5)
  })
})
