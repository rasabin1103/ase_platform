import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m06Metricas } from '../../content/courses/qa-profesional/m06-metricas'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { INITIAL_METRICS, READINGS, askLaura, readingsFor, submitClosure, submitProgress, type MetricsState } from './metricsLogic'
import { KobaltoMetricsApp } from './KobaltoMetricsApp'

describe('kobalto-metrics · English', () => {
  it('returns English text with the same evaluation and flags', () => {
    expect(readingsFor('en').map((r) => [r.id, r.kind])).toEqual(READINGS.map((r) => [r.id, r.kind]))
    const s: MetricsState = { ...INITIAL_METRICS, metrics: ['progress', 'reqcov', 'defects', 'residual'], readings: { L1: 'misleading' }, mgmt: 'makeup', team: 'detail', actions: ['reprio'] }
    const fb = askLaura(s, 'en').state.feedback!
    expect(fb.length).toBe(askLaura(s).state.feedback!.length)
    expect(fb[0]).toMatch(/^Some readings on the dashboard/)
    const es = submitProgress(s)
    const en = submitProgress(s, 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.state.progress).toEqual(es.state.progress)
    expect(en.event.summary).toMatch(/^Progress report sent to Raúl: metrics useful, readings 1\/5, management report dressed up/)
    const closing = { ...en.state, closure: ['exit', 'open', 'archive', 'lessons'] }
    expect(submitClosure(closing, 'en').event.flags).toEqual(submitClosure(closing).event.flags)
  })

  it('renders English tabs when the mission is in English', () => {
    const mission = { ...m06Metricas, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoMetricsApp>[0]
    render(<KobaltoMetricsApp {...props} />)
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy()
    expect(screen.getByText('Requirements with tests')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Readings' }))
    expect(screen.getByLabelText('Reading L1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Send the progress report/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit_progress' }) }))
  })
})
