import { describe, expect, it } from 'vitest'
import { INITIAL_CAPACITY, LEVERS, evaluatePlan, savePlan, toggleLever, type CapacityState } from './capacityLogic'

const GOOD = LEVERS.filter((l) => l.kind === 'good').map((l) => l.id)
function plan(ids: string[]) {
  let s: CapacityState = INITIAL_CAPACITY
  for (const id of ids) s = toggleLever(s, id).state
  return s
}

describe('app Capacidad (curso 4 · misión 9)', () => {
  it('las palancas razonables llegan al objetivo sin tocar lo crítico ni a las personas', () => {
    const r = savePlan(plan(GOOD))
    expect(r.event.cost).toBe(20)
    expect(r.event.flags).toEqual(['plan.saved', 'plan.target', 'plan.critical', 'plan.keypeople', 'plan.morale', 'plan.scope', 'plan.ok'])
    expect(evaluatePlan(GOOD).saving).toBe(470)
  })

  it('sin reducir alcance no se llega al objetivo con las palancas buenas', () => {
    expect(evaluatePlan(GOOD.filter((id) => id !== 'scope_low')).target).toBe(false)
  })

  it('externalizar pagos o prescindir de los senior llega al objetivo, pero rompe el plan', () => {
    const f1 = savePlan(plan(['outsource_payments', 'vacancies', 'tools'])).event.flags
    expect(f1).toContain('plan.target')
    expect(f1).not.toContain('plan.critical')
    expect(f1).not.toContain('plan.ok')
    const f2 = savePlan(plan(['seniors', 'vacancies'])).event.flags
    expect(f2).not.toContain('plan.keypeople')
  })

  it('quitar la formación daña la moral aunque cuadre', () => {
    const flags = savePlan(plan([...GOOD, 'training'])).event.flags
    expect(flags).not.toContain('plan.morale')
    expect(flags).not.toContain('plan.ok')
  })

  it('no se puede cambiar el plan después de enviarlo', () => {
    const s = savePlan(plan(GOOD)).state
    expect(toggleLever(s, 'perf').event.action).toBe('noop')
    expect(savePlan(INITIAL_CAPACITY).event.action).toBe('noop')
  })
})
