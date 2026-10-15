import { describe, expect, it } from 'vitest'
import { INITIAL_INSPECTION, convene, evaluatePlan, followUp, reviewTypesFor, roleLabelFor, type InspectionPlan } from './inspectionLogic'

const BAD: InspectionPlan = { type: 'walkthrough', roles: { player: 'reviewer', raul: 'reviewer' }, checklist: false }
const GOOD: InspectionPlan = { type: 'inspection', roles: { player: 'scribe', laura: 'moderator', carmen: 'reviewer', tomas: 'reviewer' }, checklist: true }

describe('review room · English', () => {
  it('uses ISTQB terms', () => {
    expect(reviewTypesFor('en').map((t) => t.label)).toEqual(['Informal review', 'Walkthrough', 'Technical review', 'Inspection'])
    expect(roleLabelFor('en').moderator).toMatch(/Moderator/)
    expect(roleLabelFor('en').scribe).toMatch(/Scribe/)
  })

  it('evaluation flags do not depend on the language', () => {
    for (const plan of [BAD, GOOD]) {
      expect(evaluatePlan(plan, 'en').flags).toEqual(evaluatePlan(plan).flags)
      expect(evaluatePlan(plan, 'en').notes.length).toBe(evaluatePlan(plan).notes.length)
    }
    const r = convene(INITIAL_INSPECTION, GOOD, 'en')
    expect(r.event.flags).toContain('review.roles.ok')
    expect(r.event.summary).toMatch(/^Review convened: Inspection\. Participants: Elena \(author\)/)
    expect(convene(INITIAL_INSPECTION, BAD, 'en').event.summary).toContain('Warnings:')
    expect(followUp(INITIAL_INSPECTION, true, 'en').event.summary).toContain('VAT')
  })
})
