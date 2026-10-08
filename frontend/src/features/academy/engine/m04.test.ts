import { describe, expect, it } from 'vitest'
import { m04Reportar as mission } from '../content/courses/testing-fundamentals/m04-reportar'
import { INITIAL_CARDS, exportCsv, purchase, toggleFreeze, type Env } from '../apps/kobalto-cards/cardLogic'
import { createRun, replay, step, summarize } from './engine'
import type { BugReportInput, RunState } from './types'

const android: Env = { device: 'android', lang: 'es', profile: 'personal' }

/** Partida con C1 activo y evidencia de la compra aprobada con la tarjeta congelada. */
function withAndroidEvidence(): RunState {
  let seed = 1
  while (!createRun(mission, seed).activeBugs.includes('C1')) seed++
  let s = replay(mission, seed, [{ type: 'start' }])
  const build = { active: s.activeBugs }
  const frozen = toggleFreeze(INITIAL_CARDS, android, build)
  s = step(mission, s, { type: 'app', event: { ...frozen.event, state: frozen.state } })
  const p = purchase(frozen.state, android, '20', build)
  expect(p.event.bugs).toEqual(['C1'])
  return step(mission, s, { type: 'app', event: { ...p.event, state: p.state } })
}

const report = (s: RunState, over: Partial<BugReportInput> = {}): BugReportInput => ({
  title: 'Congelar la tarjeta no bloquea las compras',
  steps: '1. Congelar la tarjeta\n2. Pagar 20 € en el comercio de pruebas',
  expected: 'Compra rechazada (wiki: Tarjetas · Congelar)',
  actual: 'Compra aprobada con la tarjeta congelada',
  severity: 'critical',
  priority: 'p1',
  evidence: [s.log.at(-1)!.id],
  ...over,
})

describe('misión 4 · reportar como un profesional', () => {
  it('cada partida activa 5 bugs', () => {
    const s = createRun(mission, 7)
    expect(s.activeBugs).toHaveLength(5)
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C3', 'C4', 'C5']))
  })

  it('sin la condición, Diego no lo reproduce; al completarlo se acepta', () => {
    let s = withAndroidEvidence()
    s = step(mission, s, { type: 'report', report: report(s) })
    const r = s.reports.at(-1)!
    expect(r).toMatchObject({ bugId: 'C1', status: 'needs_info' })
    expect(r.feedback[0]).toContain('dispositivo')
    expect(s.messages.some((m) => m.from === 'diego' && m.body.includes('dispositivo'))).toBe(true)
    s = step(mission, s, { type: 'amendReport', key: r.key, report: report(s, { title: 'En Android, congelar la tarjeta no bloquea las compras', evidence: r.evidence }) })
    expect(s.reports.at(-1)).toMatchObject({ status: 'accepted', amendments: 1 })
    expect(s.pendingFixes).toHaveLength(1)
    const q = summarize(mission, s).reportQuality
    expect(q).toEqual([expect.objectContaining({ amendments: 1, priority: 'p1', realPriority: 'p1' })])
  })

  it('con la condición se acepta a la primera, y la prioridad cuenta', () => {
    let s = withAndroidEvidence()
    s = step(mission, s, { type: 'report', report: report(s, { title: 'En Android (Pixel 8), congelar no bloquea las compras', priority: 'p4' }) })
    const r = s.reports.at(-1)!
    expect(r.status).toBe('accepted')
    expect(r.feedback.join(' ')).toContain('P1')
    s = step(mission, s, { type: 'report', report: report(s, { title: 'Otra vez en Android, congelar no bloquea' }) })
    expect(s.reports.at(-1)!.status).toBe('duplicate')
  })

  it('el «doble cobro» de Mercadona no es un bug', () => {
    let s = replay(mission, 7, [{ type: 'start' }])
    const e = exportCsv(INITIAL_CARDS, { device: 'ios', lang: 'es', profile: 'personal' }, '2026-09-01', '2026-09-14', { active: s.activeBugs })
    expect(e.event.bugs).toEqual([])
    s = step(mission, s, { type: 'app', event: e.event })
    s = step(mission, s, {
      type: 'report',
      report: { title: 'Cobro duplicado en Mercadona el 02/09', steps: '1. Exportar\n2. Ver Mercadona', expected: 'Un cargo', actual: 'Dos cargos', severity: 'critical', evidence: [s.log.at(-1)!.id] },
    })
    expect(s.reports.at(-1)!.status).toBe('rejected')
  })
})
