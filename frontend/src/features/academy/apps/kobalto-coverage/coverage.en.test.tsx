import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m03Cobertura } from '../../content/courses/qa-profesional/m03-cobertura'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { CODE, INITIAL_COVERAGE, codeLines, initialCoverage, parseNumber, runSuite, updateCase } from './coverageLogic'
import { KobaltoCoverageApp } from './KobaltoCoverageApp'

describe('kobalto-coverage · English', () => {
  it('renders English pseudocode with identical structure and line numbers', () => {
    const en = codeLines([], 'en')
    expect(en.map(({ n, stmt, decision, indent }) => ({ n, stmt, decision, indent }))).toEqual(CODE.map(({ n, stmt, decision, indent }) => ({ n, stmt, decision, indent })))
    expect(en[3].text).toBe('IF client.isBusiness THEN')
    expect(codeLines(['B-RET', 'B-REV'], 'en').find((l) => l.n === 11)!.text).toBe('IF base ≥ 3000 THEN')
    expect(codeLines([])).toEqual(CODE)
  })

  it('runs the suite with English messages and the same evaluation as Spanish', () => {
    const state = updateCase(INITIAL_COVERAGE, { ...INITIAL_COVERAGE.cases[2], assert: true, expectedTotal: '4240', expectedReview: 'si' }).state
    const es = runSuite(state, 0)
    const en = runSuite(state, 0, [], 'en')
    expect(en.event.flags).toEqual(es.event.flags)
    expect(en.event.bugs).toEqual(es.event.bugs)
    expect(en.state.lastRun!.results.map((r) => r.status)).toEqual(es.state.lastRun!.results.map((r) => r.status))
    expect(en.event.summary).toMatch(/^Suite run: 3 cases, 1 red\. Statement coverage 100% /)
    expect(en.state.lastRun!.results[2].message).toContain('expected €4,240.00')
    expect(parseNumber('5,700.00', 'en')).toBe(5700)
    expect(parseNumber('5.000', 'en')).toBe(5)
    expect(parseNumber('5.000')).toBe(5000)
    expect(initialCoverage('en').cases[0].name).toBe('Business, 1-year issuer, €5,000')
  })

  it('renders English labels when the mission is in English', () => {
    const mission = { ...m03Cobertura, lang: 'en' as const }
    const state = replay(mission, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoCoverageApp>[0]
    render(<KobaltoCoverageApp {...props} />)
    expect(screen.getByText('Code under test')).toBeTruthy()
    expect(screen.getByText('FUNCTION invoiceTotal(base, client, issuer):')).toBeTruthy()
    expect(screen.getByLabelText('Client for case 1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Run the suite/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'run_suite', summary: expect.stringMatching(/^Suite run/) }) }))
  })
})
