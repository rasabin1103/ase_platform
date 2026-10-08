import { describe, expect, it } from 'vitest'
import { m05Plan as mission } from '../content/courses/qa-profesional/m05-plan'
import { INITIAL_PLAN, SECTIONS, evaluateOrder, submit, edit, type PlanState } from '../apps/kobalto-plan/planLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-plan'] as PlanState | undefined) ?? INITIAL_PLAN
const send = (s: RunState, r: { state: PlanState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

const GOOD: Partial<PlanState> = {
  sections: Object.fromEntries(SECTIONS.map((x) => [x.id, x.correct])),
  risks: { R1: 'project', R2: 'product', R3: 'project', R4: 'product', R5: 'project', R6: 'product' },
  ratio: '20',
  threeE: '20',
  threeSD: '4',
  order: { C3: 1, C1: 2, C2: 3, C5: 4, C4: 5, C6: 6 },
  quadrants: { unit: 'Q1', integ: 'Q1', bdd: 'Q2', proto: 'Q2', explore: 'Q3', uat: 'Q3', perf: 'Q4', sec: 'Q4' },
}

describe('curso 2 · misión 5 · el plan', () => {
  it('la priorización respeta dependencias y riesgo', () => {
    expect(evaluateOrder({ C3: 1, C1: 2, C2: 3, C5: 4, C4: 5, C6: 6 }).ok).toBe(true)
    expect(evaluateOrder({ C1: 1, C3: 2, C5: 3, C2: 4, C6: 5, C4: 6 }).ok).toBe(true)
    expect(evaluateOrder({ C2: 1, C1: 2, C3: 3, C5: 4, C4: 5, C6: 6 }).ok).toBe(false)
    expect(evaluateOrder({ C4: 1, C3: 2, C1: 3, C2: 4, C5: 5, C6: 6 }).ok).toBe(false)
  })

  it('el recorrido óptimo no deja problemas y termina con veredicto bueno', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, edit(app(s), GOOD, 'plan'))
    s = send(s, submit(app(s)))
    for (const f of ['plan.scope', 'plan.approach', 'plan.entry', 'plan.exit', 'plan.risks', 'est.ok', 'prio.ok', 'quad.ok']) expect(s.flags[f], f).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 120 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'delphi'), choiceId: 'explain' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'committee'), choiceId: 'negotiate' })
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('sin plan y aceptando la mitad del tiempo aparecen los problemas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 360 })
    const c = s.messages.find((m) => m.sceneId === 'committee')!
    s = step(mission, s, { type: 'choose', messageId: c.id, choiceId: 'accept' })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['P-ESTIM', 'P-SALIDA', 'P-RIESGO']))
  })
})
