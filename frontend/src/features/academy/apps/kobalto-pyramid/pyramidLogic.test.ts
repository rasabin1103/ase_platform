import { describe, expect, it } from 'vitest'
import { CHECKS, INITIAL_PLAN, PYRAMID_BUGS as B, implement, metrics, submitPlan, type Level, type PlanState } from './pyramidLogic'

const IDEAL: Record<string, Level> = Object.fromEntries(CHECKS.map((c) => [c.id, c.ideal[0]]))
const all = [B.centLost, B.cancelOthers, B.contractEuros, B.slowWith20, B.dailyReminder]

function plan(levels: Record<string, Level>, active = all): PlanState {
  let s = INITIAL_PLAN
  for (const [id, l] of Object.entries(levels)) s = implement(s, id, l, 0, { active }).state
  return s
}

describe('planificador de pruebas', () => {
  it('cada bug solo se ve en los niveles que pueden verlo', () => {
    expect(implement(INITIAL_PLAN, 'C07', 'api', 0, { active: all }).event.bugs).toEqual([B.cancelOthers])
    expect(implement(INITIAL_PLAN, 'C07', 'e2e', 0, { active: all }).event.bugs).toEqual([])
    expect(implement(INITIAL_PLAN, 'C09', 'unit', 0, { active: all }).event.summary).toContain('mocks')
    expect(implement(INITIAL_PLAN, 'C09', 'api', 0, { active: all }).event.bugs).toEqual([B.contractEuros])
    expect(implement(INITIAL_PLAN, 'C15', 'e2e', 0, { active: all }).event.bugs).toEqual([])
    expect(implement(INITIAL_PLAN, 'C15', 'perf', 0, { active: all }).event.bugs).toEqual([B.slowWith20])
    expect(implement(INITIAL_PLAN, 'C05', 'unit', 0, { active: all }).event.bugs).toEqual([B.dailyReminder])
    expect(implement(INITIAL_PLAN, 'C05', 'e2e', 0, { active: all }).event.bugs).toEqual([])
  })

  it('el coste depende del nivel y relanzar es más barato', () => {
    const r = implement(INITIAL_PLAN, 'C01', 'e2e', 0, { active: [] })
    expect(r.event.cost).toBe(30)
    expect(implement(r.state, 'C01', 'e2e', 0, { active: [] }).event.cost).toBe(8)
    expect(implement(INITIAL_PLAN, 'C01', 'unit', 0, { active: [] }).event.cost).toBe(8)
  })

  it('el plan ideal es una pirámide rápida y se aprueba', () => {
    const s = plan(IDEAL)
    const m = metrics(s)
    expect(m.counts).toEqual({ unit: 5, api: 5, e2e: 2, manual: 3, perf: 1 })
    expect(m.shape).toBe('pyramid')
    expect(m.ciMinutes).toBeLessThan(8)
    expect(m.flakyRate).toBeLessThan(5)
    expect(submitPlan(s).event.flags).toContain('plan.good')
  })

  it('todo por la interfaz es un cono de helado lento', () => {
    const s = plan(Object.fromEntries(CHECKS.map((c) => [c.id, 'e2e' as Level])))
    const m = metrics(s)
    expect(m.shape).toBe('ice_cream')
    expect(m.ciMinutes).toBeGreaterThan(15)
    const flags = submitPlan(s).event.flags!
    expect(flags).toEqual(expect.arrayContaining(['plan.shape.ice_cream', 'plan.no_perf', 'plan.automated_exploratory', 'plan.slow_ci']))
    expect(flags).not.toContain('plan.good')
  })
})
