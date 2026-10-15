import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m07Configuracion } from '../../content/courses/qa-profesional/m07-configuracion'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { INITIAL_CONFIG, REPORT_FIELDS, askLaura, itemsFor, reportFieldsFor, submit, type ConfigState } from './configLogic'
import { KobaltoConfigApp } from './KobaltoConfigApp'

describe('kobalto-config · English', () => {
  it('returns English text with the same evaluation and flags', () => {
    expect(reportFieldsFor('en').map((f) => [f.id, f.correct, f.options.length])).toEqual(REPORT_FIELDS.map((f) => [f.id, f.correct, f.options.length]))
    expect(reportFieldsFor('en')[2].options[0]).toContain('base €33.33 × 21% = €7.00 VAT')
    expect(itemsFor('en').find((i) => i.id === 'config')!.values.staging).toBe('round: down')
    const s: ConfigState = { ...INITIAL_CONFIG, cause: 'config', unversioned: 'config', build: 'deploy412', report: { title: 1, env: 1, result: 0 }, trigger: 'migration', suites: ['emit', 'recurrent', 'corrective', 'pdf'] }
    expect(askLaura(s, 'en').state.feedback).toEqual(['Configuration traced, reproducible report and well-scoped impact. Send it.'])
    const es = submit(s)
    const en = submit(s, 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.state.submitted).toEqual(es.state.submitted)
    expect(en.event.summary).toBe('Analysis sent: cause in the configuration, build to test correct, report 3/3, 3-day regression scoped to the impact.')
  })

  it('renders English tabs when the mission is in English', () => {
    const mission = { ...m07Configuracion, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoConfigApp>[0]
    render(<KobaltoConfigApp {...props} />)
    expect(screen.getByText('round: down')).toBeTruthy()
    expect(screen.getByText('Production')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Maintenance' }))
    expect(screen.getByText(/Selected regression: 0 days/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send the analysis/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit' }) }))
  })
})
