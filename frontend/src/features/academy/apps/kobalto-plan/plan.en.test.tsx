import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m05Plan } from '../../content/courses/qa-profesional/m05-plan'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { INITIAL_PLAN, SECTIONS, askLaura, evaluateOrder, sectionsFor, submit, type PlanState } from './planLogic'
import { KobaltoPlanApp } from './KobaltoPlanApp'

describe('kobalto-plan · English', () => {
  it('returns English feedback with the same evaluation and flags', () => {
    expect(sectionsFor('en').map((s) => [s.id, s.correct, s.options.length])).toEqual(SECTIONS.map((s) => [s.id, s.correct, s.options.length]))
    const plan: PlanState = { ...INITIAL_PLAN, sections: { scope: 1, approach: 0 }, ratio: '20', threeE: '20', threeSD: '4', order: { C1: 2, C2: 1, C3: 3, C4: 4, C5: 5, C6: 6 } }
    expect(evaluateOrder(plan.order, 'en').ok).toBe(evaluateOrder(plan.order).ok)
    expect(evaluateOrder(plan.order, 'en').issues[0]).toMatch(/^"E-signature of the contract" depends on "Business account sign-up"/)
    const fbEn = askLaura(plan, 'en').state.feedback!
    expect(fbEn.length).toBe(askLaura(plan).state.feedback!.length)
    expect(fbEn[0]).toBe('Review these sections: Approach. Ask yourself whether they are concrete and measurable.')
    const es = submit(plan)
    const en = submit(plan, 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.state.submitted).toEqual(es.state.submitted)
    expect(en.event.summary).toMatch(/^Test plan sent to Raúl/)
  })

  it('renders English tabs and buttons when the mission is in English', () => {
    const mission = { ...m05Plan, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoPlanApp>[0]
    render(<KobaltoPlanApp {...props} />)
    expect(screen.getByText('Scope')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Prioritization' }))
    expect(screen.getByText('Freeze a team card')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Quadrants' }))
    expect(screen.getByLabelText('Quadrant for Unit tests')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Send the plan to Raúl · 15 min' }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit' }) }))
  })
})
