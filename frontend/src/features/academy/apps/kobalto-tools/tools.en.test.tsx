import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m08Herramientas } from '../../content/courses/qa-profesional/m08-herramientas'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { CANDIDATES, INITIAL_TOOLS, askLaura, candidatesFor, submit, type ToolsState } from './toolsLogic'
import { KobaltoToolsApp } from './KobaltoToolsApp'

describe('kobalto-tools · English', () => {
  it('returns English text with the same evaluation and flags', () => {
    expect(candidatesFor('en').map((c) => [c.id, c.name, c.risks, c.facts.length])).toEqual(CANDIDATES.map((c) => [c.id, c.name, c.risks, c.facts.length]))
    const s: ToolsState = { ...INITIAL_TOOLS, needs: { N1: 'management' }, risks: { kestrel: ['learning'] }, choice: 'kestrel', scope: 'pilot', criteria: ['ci', 'flaky', 'autonomy'] }
    const fb = askLaura(s, 'en').state.feedback!
    expect(fb.length).toBe(askLaura(s).state.feedback!.length)
    expect(fb[0]).toMatch(/^A need is in a category/)
    const es = submit(s)
    const en = submit(s, 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.state.submitted).toEqual(es.state.submitted)
    expect(en.event.summary).toBe('Proposal sent to Raúl: needs 1/7, risks 1/3 candidates, pilot with Kestrel and measurable criteria.')
  })

  it('renders English tabs when the mission is in English', () => {
    const mission = { ...m08Herramientas, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoToolsApp>[0]
    render(<KobaltoToolsApp {...props} />)
    expect(screen.getByLabelText('Category for N1')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Candidates' }))
    expect(screen.getByText('License: €18,000 per year, 3-year minimum contract.')).toBeTruthy()
    expect(screen.getAllByText('Vendor dependency (lock-in)').length).toBe(3)
    fireEvent.click(screen.getByRole('tab', { name: 'Pilot' }))
    expect(screen.getByText('Pilot success criteria')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send the proposal/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit' }) }))
  })
})
