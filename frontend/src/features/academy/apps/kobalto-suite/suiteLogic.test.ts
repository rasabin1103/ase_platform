import { describe, expect, it } from 'vitest'
import { BASELINE_GREEN, INITIAL_SUITE, TESTS, applyDecisions, decide, investigate, projectedGreen, publishReport, type Decision, type SuiteState } from './suiteLogic'

function investigateAll(s: SuiteState = INITIAL_SUITE) {
  for (const t of TESTS) s = investigate(s, t.id).state
  return s
}
function decideAll(s: SuiteState, map: Record<string, Decision>) {
  for (const [id, d] of Object.entries(map)) s = decide(s, id, d).state
  return s
}
const CORRECT = Object.fromEntries(TESTS.map((t) => [t.id, t.correct])) as Record<string, Decision>

describe('app Suite (curso 4 · misión 2)', () => {
  it('no se puede decidir sin investigar, y a partir de seis investigados se considera analizado', () => {
    expect(decide(INITIAL_SUITE, 'T1', 'fix').state.decisions.T1).toBeUndefined()
    let s = INITIAL_SUITE
    const flags: string[] = []
    for (const t of TESTS.slice(0, 6)) {
      const r = investigate(s, t.id)
      s = r.state
      flags.push(...(r.event.flags ?? []))
    }
    expect(flags).toContain('suite.analyzed')
  })

  it('las decisiones adecuadas dan suite.ok, reportan el bug y cuestan lo esperado', () => {
    const r = applyDecisions(decideAll(investigateAll(), CORRECT))
    expect(r.event.flags).toEqual(expect.arrayContaining(['suite.applied', 'suite.ok', 'suite.bug_reported', 'suite.quarantine_ok']))
    expect(r.event.cost).toBe(30 + 10 + 45 + 30 + 5 + 20 + 10 + 5)
    expect(projectedGreen(CORRECT)).toBe(100)
  })

  it('poner en cuarentena el test del límite concurrente esconde el bug', () => {
    const flags = applyDecisions(decideAll(investigateAll(), { ...CORRECT, T2: 'quarantine' })).event.flags
    expect(flags).toContain('suite.bug_hidden')
    expect(flags).not.toContain('suite.ok')
  })

  it('borrar un test que encuentra bugs se detecta; dejarlos como están no mejora el verde', () => {
    expect(applyDecisions(decideAll(investigateAll(), { ...CORRECT, T7: 'delete' })).event.flags).toContain('suite.valuable_deleted')
    expect(projectedGreen(Object.fromEntries(TESTS.map((t) => [t.id, 'leave'])))).toBe(BASELINE_GREEN)
  })

  it('el informe exige haber investigado los ocho tests', () => {
    expect(publishReport(INITIAL_SUITE).event.cost).toBe(0)
    expect(publishReport(investigateAll()).event.flags).toEqual(['report.published'])
  })
})
