import { describe, expect, it } from 'vitest'
import { AGREEMENTS, DAY_CAPACITY, INITIAL_SPRINT, QUEUE, RISK_TOP, analyzeFlow, flowFacts, propose, testPlan, toggleAgreement, togglePlan } from './sprintLogic'

describe('app Sprint (curso 4 · misión 1)', () => {
  it('los datos del flujo muestran la acumulación al final del sprint', () => {
    expect(flowFacts()).toEqual({ lateEntries: 6, total: 8, acReviewed: 3, bigStories: 4, queue: 6, daysWithoutArrivals: 5 })
  })

  it('analizar el flujo cuesta 20 minutos una sola vez', () => {
    const r = analyzeFlow(INITIAL_SPRINT)
    expect(r.event.flags).toEqual(['flow.analyzed'])
    expect(r.event.cost).toBe(20)
    expect(analyzeFlow(r.state).event.cost).toBe(0)
  })

  it('el plan del día admite como mucho la capacidad del día y solo historias de la cola', () => {
    let s = INITIAL_SPRINT
    for (const id of QUEUE) s = togglePlan(s, id).state
    expect(s.plan).toHaveLength(DAY_CAPACITY)
    expect(togglePlan(s, 'KOB-432').state.plan).toEqual(s.plan)
  })

  it('probar las tres de más riesgo activa test.risk, test.limits y test.notif', () => {
    let s = INITIAL_SPRINT
    for (const id of RISK_TOP) s = togglePlan(s, id).state
    const r = testPlan(s)
    expect(r.event.cost).toBe(180)
    expect(r.event.flags).toEqual(expect.arrayContaining(['test.done', 'test.risk', 'test.limits', 'test.notif']))
  })

  it('probar lo vistoso deja fuera el riesgo', () => {
    let s = INITIAL_SPRINT
    for (const id of ['KOB-438', 'KOB-436', 'KOB-431']) s = togglePlan(s, id).state
    const flags = testPlan(s).event.flags
    expect(flags).toContain('test.color')
    expect(flags).not.toContain('test.risk')
    expect(flags).not.toContain('test.limits')
  })

  it('tres acuerdos buenos dan retro.good; uno malo da retro.bad', () => {
    let s = INITIAL_SPRINT
    for (const a of AGREEMENTS.filter((x) => x.good).slice(0, 3)) s = toggleAgreement(s, a.id).state
    expect(propose(s).event.flags).toEqual(['retro.proposal', 'retro.good'])
    let b = INITIAL_SPRINT
    for (const id of ['ac_first', 'wip', 'hire']) b = toggleAgreement(b, id).state
    expect(propose(b).event.flags).toEqual(['retro.proposal', 'retro.bad'])
  })

  it('cuatro de los ocho acuerdos atacan la causa', () => {
    expect(AGREEMENTS.filter((a) => a.good)).toHaveLength(4)
  })
})
