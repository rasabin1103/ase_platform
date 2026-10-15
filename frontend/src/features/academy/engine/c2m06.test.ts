import { describe, expect, it } from 'vitest'
import { m06Metricas as mission } from '../content/courses/qa-profesional/m06-metricas'
import { INITIAL_METRICS, edit, evaluateClosure, evaluateProgress, submitClosure, submitProgress, type MetricsState } from '../apps/kobalto-metrics/metricsLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-metrics'] as MetricsState | undefined) ?? INITIAL_METRICS
const send = (s: RunState, r: { state: MetricsState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

const GOOD: Partial<MetricsState> = {
  metrics: ['progress', 'reqcov', 'defects', 'residual'],
  readings: { L1: 'misleading', L2: 'misleading', L3: 'reliable', L4: 'reliable', L5: 'misleading' },
  mgmt: 'good',
  team: 'detail',
  actions: ['reprio', 'reopen', 'renegotiate', 'resources'],
}

describe('curso 2 · misión 6 · números que cuentan', () => {
  it('evalúa métricas, lecturas, informes, control y cierre', () => {
    const p = { ...INITIAL_METRICS, ...GOOD }
    expect(evaluateProgress(p)).toEqual({ metrics: true, readings: 5, mgmt: 'good', team: true, control: true })
    expect(evaluateProgress({ ...p, metrics: [...GOOD.metrics!, 'volume'], mgmt: 'makeup' })).toMatchObject({ metrics: false, mgmt: 'makeup' })
    expect(evaluateClosure({ ...p, closure: ['exit', 'open', 'archive', 'lessons'] }).ok).toBe(true)
    expect(evaluateClosure({ ...p, closure: ['exit', 'open', 'archive', 'lessons', 'delete'] }).ok).toBe(false)
  })

  it('el recorrido óptimo no deja problemas y termina con veredicto bueno', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, edit(app(s), GOOD, 'panel'))
    s = send(s, submitProgress(app(s)))
    for (const f of ['metrics.ok', 'misleading.ok', 'report.mgmt', 'report.team', 'report.audience', 'control.ok']) expect(s.flags[f], f).toBe(true)
    expect(s.flags['report.makeup']).toBeFalsy()
    s = step(mission, s, { type: 'wait', minutes: 180 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'status'), choiceId: 'honest' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'control'), choiceId: 'control' })
    s = send(s, edit(app(s), { closure: ['exit', 'open', 'archive', 'lessons'] }, 'cierre'))
    s = send(s, submitClosure(app(s)))
    expect(s.flags['closure.ok']).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('maquillando el estado y sin control aparecen los problemas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, edit(app(s), { ...GOOD, mgmt: 'makeup', metrics: ['volume', 'passrate'] }, 'panel'))
    s = send(s, submitProgress(app(s)))
    expect(s.flags['report.mgmt']).toBeFalsy()
    s = step(mission, s, { type: 'wait', minutes: 180 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'status'), choiceId: 'green' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'control'), choiceId: 'overtime' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['P-VOLUMEN', 'P-ESTADO', 'P-TARJETAS', 'P-CIERRE']))
  })
})
