import { describe, expect, it } from 'vitest'
import { m03Cobertura as mission } from '../content/courses/qa-profesional/m03-cobertura'
import {
  BRANCHES,
  INITIAL_COVERAGE,
  STATEMENTS,
  addCase,
  coverageOf,
  runCase,
  runSuite,
  updateCase,
  type CoverageState,
  type TestCase,
} from '../apps/kobalto-coverage/coverageLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, BugReportInput, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-coverage'] as CoverageState | undefined) ?? INITIAL_COVERAGE
const send = (s: RunState, r: { state: CoverageState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const run = (s: RunState) => send(s, runSuite(app(s), s.clock, s.fixedBugs))
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const edit = (s: RunState, id: number, patch: Partial<TestCase>) => send(s, updateCase(app(s), { ...app(s).cases.find((c) => c.id === id)!, ...patch }))

function report(evidence: number[], title: string, severity: BugReportInput['severity']): BugReportInput {
  return {
    title,
    steps: '1. Ejecutar la suite de totalFactura\n2. Ver el caso que falla',
    expected: 'El resultado de la especificación',
    actual: 'El cálculo devuelve otro valor',
    severity,
    evidence,
  }
}

describe('curso 2 · misión 3 · dentro del código', () => {
  it('la suite de Tomás da 100 % de sentencias, 83 % de ramas y todo en verde', () => {
    const results = INITIAL_COVERAGE.cases.map((c) => runCase(c))
    const cov = coverageOf(results)
    expect(cov.stmt.length).toBe(STATEMENTS.length)
    expect(cov.branches.length).toBe(BRANCHES.length - 1)
    expect(cov.branches).not.toContain('D3F')
    expect(results.every((r) => r.status === 'pass' || r.status === 'pass_no_assert')).toBe(true)
    expect(results.find((r) => r.id === 3)!.status).toBe('pass_no_assert')
  })

  it('un resultado esperado copiado del código pasa, pero se marca como oráculo copiado', () => {
    const r = runCase({ ...INITIAL_COVERAGE.cases[2], assert: true, expectedTotal: '4780', expectedReview: 'si' })
    expect(r.status).toBe('pass')
    expect(r.copiedOracle).toBe(true)
  })

  it('el recorrido óptimo encuentra y reporta los dos bugs y llega al 100 % de ramas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 15 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'tomas_coverage'), choiceId: 'inspect' })
    s = run(s)
    expect(s.flags['cov.stmt100']).toBe(true)
    expect(s.flags['cov.branch100']).toBeUndefined()
    s = edit(s, 3, { assert: true, expectedTotal: '4240', expectedReview: 'si' })
    s = send(s, addCase(app(s)))
    s = edit(s, 4, { name: '3.000 € justos', base: '3000', client: 'particular', years: '0', expectedTotal: '3630', expectedReview: 'si' })
    s = run(s)
    expect(s.flags['cov.branch100']).toBe(true)
    expect(s.triggeredBugs).toEqual(expect.arrayContaining(['B-RET', 'B-REV']))
    const ev = s.log.at(-1)!.id
    s = step(mission, s, { type: 'report', report: report([ev], 'Retención del 1,5 % en vez del 15 % para emisores veteranos', 'high') })
    s = step(mission, s, { type: 'report', report: report([ev], 'Factura de 3.000 € no se marca para revisión', 'medium') })
    expect(s.reports.filter((r) => r.status === 'accepted').length).toBe(2)
    s = step(mission, s, { type: 'wait', minutes: 150 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'sofia_noassert'), choiceId: 'assert' })
    expect(s.fixedBugs).toEqual(expect.arrayContaining(['B-RET', 'B-REV']))
    s = run(s)
    expect(app(s).lastRun!.results.every((r) => r.status === 'pass')).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 390 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'pipeline'), choiceId: 'branches' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    const sum = summarize(mission, s)
    expect(sum.found).toBe(2)
    expect(sum.verdict.tone).toBe('good')
  })

  it('creerse el 100 % deja los bugs sin encontrar', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 15 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'tomas_coverage'), choiceId: 'pdf' })
    s = run(s)
    expect(s.triggeredBugs).toEqual([])
  })
})
