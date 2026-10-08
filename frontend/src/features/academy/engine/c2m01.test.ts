import { describe, expect, it } from 'vitest'
import { m01Inspeccion as mission } from '../content/courses/qa-profesional/m01-inspeccion'
import { INITIAL_INSPECTION, convene, followUp, type InspectionPlan, type InspectionState } from '../apps/kobalto-inspection/inspectionLogic'
import { replay, step } from './engine'
import { reviewSummary } from './review'
import type { RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-inspection'] as InspectionState | undefined) ?? INITIAL_INSPECTION

function plan(s: RunState, p: InspectionPlan): RunState {
  const r = convene(app(s), p)
  return step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
}

const GOOD: InspectionPlan = {
  type: 'inspection',
  roles: { player: 'reviewer', laura: 'moderator', sofia: 'scribe', tomas: 'reviewer', carmen: 'reviewer', raul: 'none' },
  checklist: true,
}

describe('curso 2 · misión 1 · la inspección', () => {
  it('la herramienta de revisión está bloqueada hasta convocar', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    expect(s.flags['review.convened']).toBeUndefined()
    s = plan(s, GOOD)
    expect(s.flags['review.roles.ok']).toBe(true)
    expect(s.clock).toBeGreaterThanOrEqual(15)
  })

  it('una buena inspección con seguimiento evita todos los bugs', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = plan(s, GOOD)
    s = step(mission, s, { type: 'reviewMark', fragmentId: 'f2', issue: 'contradictory' })
    s = step(mission, s, { type: 'reviewMark', fragmentId: 'f12', issue: 'untestable' })
    s = step(mission, s, { type: 'reviewSubmit' })
    const sum = reviewSummary(mission, s)!
    expect(sum.found).toBe(sum.total)
    expect(sum.issues.find((i) => i.key === 'numeracion')?.foundBy).toBe('carmen')
    expect(sum.issues.find((i) => i.key === 'prorrateo')?.foundBy).toBe('sofia')
    const f = followUp(app(s), !!s.flags['clarify.iva'])
    s = step(mission, s, { type: 'app', event: { ...f.event, state: f.state } })
    s = step(mission, s, { type: 'wait', minutes: 420 - s.clock })
    expect(s.flags['dev.started']).toBe(true)
    expect(s.activeBugs).toEqual([])
  })

  it('un walkthrough con el jefe en la sala deja pasar defectos y sin seguimiento la corrección queda a medias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = plan(s, { type: 'walkthrough', roles: { player: 'moderator', tomas: 'reviewer', raul: 'reviewer' }, checklist: false })
    expect(s.flags['role.manager.in']).toBe(true)
    s = step(mission, s, { type: 'reviewSubmit' })
    const sum = reviewSummary(mission, s)!
    expect(sum.found).toBe(1) // solo el IVA, que ve Tomás aunque no se prepare
    s = step(mission, s, { type: 'wait', minutes: 420 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['E-NUM', 'E-BORRAR', 'E-FU']))
  })
})
