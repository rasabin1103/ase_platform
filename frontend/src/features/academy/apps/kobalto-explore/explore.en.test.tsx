import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m04Exploratoria } from '../../content/courses/qa-profesional/m04-exploratoria'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { AREAS, ATTACKS, FOCUS_OPTIONS, INITIAL_EXPLORE, areasFor, attack, attacksFor, focusLabel, runChecklist, startSession } from './exploreLogic'
import { KobaltoExploreApp } from './KobaltoExploreApp'

describe('kobalto-explore · English', () => {
  it('keeps ids and flags identical and returns English text', () => {
    expect(areasFor('en').map((a) => [a.id, a.isNew])).toEqual(AREAS.map((a) => [a.id, a.isNew]))
    expect(attacksFor('en').map((a) => a.id)).toEqual(ATTACKS.map((a) => a.id))
    const charter = { areas: ['congelar', 'invitar'] as const, focus: FOCUS_OPTIONS[0], timebox: 60 }
    const es = startSession(INITIAL_EXPLORE, { ...charter, areas: [...charter.areas] })
    const en = startSession(INITIAL_EXPLORE, { ...charter, areas: [...charter.areas] }, 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.state).toEqual(es.state)
    expect(en.event.summary).toContain('explore Freeze / unfreeze and Invite employee by email')
    expect(focusLabel(FOCUS_OPTIONS[0], 'en')).toMatch(/cards that pay when they shouldn't/)
    const aEs = attack(es.state, 'congelar', 'session', 600)
    const aEn = attack(en.state, 'congelar', 'session', 600, 'en')
    expect(aEn.event.bugs).toEqual(aEs.event.bugs)
    expect(aEn.event.cost).toBe(aEs.event.cost)
    expect(aEn.event.action).toBe(aEs.event.action)
    expect(aEn.state.observations[0].text).toContain('"Freeze" shows "Card frozen ✓"')
    expect(runChecklist(INITIAL_EXPLORE, 0, 'en').event.summary).toMatch(/^Team checklist \(3 items\)/)
  })

  it('renders English labels when the mission is in English', () => {
    const mission = { ...m04Exploratoria, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoExploreApp>[0]
    render(<KobaltoExploreApp {...props} />)
    expect(screen.getByText('Exploratory session charter')).toBeTruthy()
    expect(screen.getByText('Team checklist')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Attack Freeze / unfreeze with Expired session' }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'attack_congelar_session', bugs: ['X-SESION'] }) }))
  })
})
