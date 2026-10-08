import { describe, expect, it } from 'vitest'
import { m06Piramide as mission } from '../content/courses/testing-fundamentals/m06-piramide'
import { CHECKS, INITIAL_PLAN, implement, submitPlan, type PlanState } from '../apps/kobalto-pyramid/pyramidLogic'
import { createRun, evaluate, replay, step } from './engine'
import type { RunState } from './types'

function app(s: RunState): PlanState {
  return (s.appState['kobalto-pyramid'] as PlanState | undefined) ?? INITIAL_PLAN
}

describe('misión 6 · la pirámide', () => {
  it('cada partida activa 5 bugs', () => {
    expect(createRun(mission, 2).activeBugs).toHaveLength(5)
  })

  it('el plan ideal cabe en la jornada, encuentra los bugs y habilita la mejor estrategia', () => {
    let s = replay(mission, 2, [{ type: 'start' }])
    for (const c of CHECKS) {
      const r = implement(app(s), c.id, c.ideal[0], s.build, { active: s.activeBugs })
      s = step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
    }
    expect(s.clock).toBeLessThan(420)
    expect(s.triggeredBugs.sort()).toEqual([...s.activeBugs].sort())
    const r = submitPlan(app(s))
    s = step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
    expect(s.flags['plan.good']).toBe(true)
    expect(evaluate(mission, s, { kind: 'flag', key: 'plan.good' })).toBe(true)
    expect(s.messages.some((m) => m.from === 'laura' && m.body.includes('buen plan'))).toBe(true)
  })
})
