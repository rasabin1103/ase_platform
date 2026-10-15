import { describe, expect, it } from 'vitest'
import { AREAS, CASES, INITIAL_RELEASE, RELEASE_BUGS as B, areasFor, casesFor, rerunCi, runCase } from './releaseLogic'

describe('TestHub · English', () => {
  it('cases keep ids, minutes and bugs; only the text changes', () => {
    const en = casesFor('en')
    expect(en.map((c) => [c.id, c.minutes, Object.keys(c.detects ?? {})])).toEqual(CASES.map((c) => [c.id, c.minutes, Object.keys(c.detects ?? {})]))
    expect(casesFor()).toBe(CASES)
    expect(areasFor()).toBe(AREAS)
    expect(en.every((c) => areasFor('en').includes(c.area))).toBe(true)
  })

  it('runCase in English gives the same result with English text', () => {
    const es = runCase(INITIAL_RELEASE, 'TC-02', 0, { active: [B.androidBiometrics] })
    const en = runCase(INITIAL_RELEASE, 'TC-02', 0, { active: [B.androidBiometrics] }, 'en')
    expect({ ...en.event, summary: '' }).toEqual({ ...es.event, summary: '' })
    expect(en.state.results['TC-02'].result).toBe(es.state.results['TC-02'].result)
    expect(en.event.summary).toContain('FAILS')
    expect(en.event.summary).toContain('Fingerprint login')
    expect(rerunCi(INITIAL_RELEASE, 'en').event.summary).toContain('flaky test')
  })
})
