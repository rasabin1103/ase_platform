import { describe, expect, it } from 'vitest'
import { CASES, INITIAL_RELEASE, RELEASE_BUGS as B, TOTAL_MINUTES, rerunCi, runCase } from './releaseLogic'

describe('TestHub · regresión 5.1', () => {
  it('la regresión completa no cabe en la jornada', () => {
    expect(CASES).toHaveLength(22)
    expect(TOTAL_MINUTES).toBeGreaterThan(300)
  })

  it('cada caso cuesta su tiempo y revela el bug activo', () => {
    const r = runCase(INITIAL_RELEASE, 'TC-02', 0, { active: [B.androidBiometrics] })
    expect(r.failed).toBe(true)
    expect(r.event.bugs).toEqual([B.androidBiometrics])
    expect(r.event.cost).toBe(15)
    expect(r.state.results['TC-02'].result).toBe('fail')
    expect(runCase(INITIAL_RELEASE, 'TC-02', 0, { active: [B.sessionNoTimeout] }).failed).toBe(false)
    expect(runCase(INITIAL_RELEASE, 'TC-04', 0, { active: [B.sessionNoTimeout] }).event.bugs).toEqual([B.sessionNoTimeout])
  })

  it('tras el fix pasa, y la regresión aparece en la ordinaria', () => {
    const b = { active: [B.instantFeeDoubled], fixed: [B.instantFeeDoubled], regressions: [B.ordinaryFee] }
    expect(runCase(INITIAL_RELEASE, 'TC-05', 1, b).failed).toBe(false)
    expect(runCase(INITIAL_RELEASE, 'TC-08', 1, b).event.bugs).toEqual([B.ordinaryFee])
    expect(runCase(INITIAL_RELEASE, 'TC-08', 0, { active: [B.instantFeeDoubled] }).failed).toBe(false)
  })

  it('las zonas sin cambios también pueden fallar por dependencias', () => {
    expect(runCase(INITIAL_RELEASE, 'TC-15', 0, { active: [B.scheduled31] }).event.bugs).toEqual([B.scheduled31])
    expect(runCase(INITIAL_RELEASE, 'TC-17', 0, { active: [B.scheduled31] }).failed).toBe(false)
  })

  it('el test rojo de CI es inestable', () => {
    const r = rerunCi(INITIAL_RELEASE)
    expect(r.event.bugs).toEqual([])
    expect(r.state.ciReruns).toBe(1)
  })
})
