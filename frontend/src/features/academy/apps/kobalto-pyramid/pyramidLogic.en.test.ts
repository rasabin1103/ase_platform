import { describe, expect, it } from 'vitest'
import { CHECKS, INITIAL_PLAN, PYRAMID_BUGS as B, checksFor, implement, submitPlan, type Level } from './pyramidLogic'

describe('test planner · English', () => {
  it('checks keep ids, levels and bugs', () => {
    const en = checksFor('en')
    expect(en.map((c) => [c.id, c.ideal, c.detects?.bugs, c.detects?.levels])).toEqual(CHECKS.map((c) => [c.id, c.ideal, c.detects?.bugs, c.detects?.levels]))
    expect(checksFor()).toBe(CHECKS)
  })

  it('implement and submitPlan behave the same in English', () => {
    const active = [B.centLost, B.cancelOthers, B.contractEuros, B.slowWith20, B.dailyReminder]
    for (const [id, level] of [['C07', 'api'], ['C09', 'unit'], ['C15', 'e2e'], ['C01', 'unit']] as [string, Level][]) {
      const es = implement(INITIAL_PLAN, id, level, 0, { active })
      const en = implement(INITIAL_PLAN, id, level, 0, { active }, 'en')
      expect(en.event.bugs).toEqual(es.event.bugs)
      expect(en.event.cost).toBe(es.event.cost)
      expect(en.state).toEqual(es.state)
    }
    expect(implement(INITIAL_PLAN, 'C09', 'unit', 0, { active }, 'en').event.summary).toContain('mocks')
    const s = implement(INITIAL_PLAN, 'C01', 'e2e', 0, { active }).state
    expect(submitPlan(s, 'en').event.flags).toEqual(submitPlan(s).event.flags)
    expect(submitPlan(s, 'en').event.summary).toMatch(/^Plan submitted for review/)
  })
})
