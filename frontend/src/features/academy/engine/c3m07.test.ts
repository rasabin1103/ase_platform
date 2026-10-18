import { describe, expect, it } from 'vitest'
import { m07Mocks as mission } from '../content/courses/karate-framework/m07-mocks'
import { M07_MOCK_PATH, M07_PAYMENTS_PATH, M07_SOLUTION_MOCK, M07_SOLUTION_PAYMENTS } from '../content/courses/karate-framework/m07-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 17, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'standup'), choiceId: 'mock' })
}

function run(s: RunState, files: Record<string, string>) {
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M07_PAYMENTS_PATH]: M07_SOLUTION_PAYMENTS, [M07_MOCK_PATH]: M07_SOLUTION_MOCK }

describe('curso 3 · misión 8 · el tercero que no responde', () => {
  it('el proyecto inicial: el mock responde 501 y el pago sale 502, sin revelar bugs', () => {
    const { s, lab } = run(start(), initial())
    const scs = lab.result.features.flatMap((f) => f.scenarios)
    expect(scs).toHaveLength(1)
    expect(scs[0].error?.message).toMatch(/status code was: 502, expected: 201/)
    expect(scs[0].mockCalls[0]).toMatchObject({ status: 501, scenario: '(catch-all)' })
    expect(s.triggeredBugs).toEqual([])
  })

  it('la solución cumple los seis retos y revela los tres bugs', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    expect(s.flags['carmen.timeout'] && s.flags['nico.centimos']).toBe(true)
    s = run(s, SOLUTION).s
    for (const id of ['mock', 'denegado', 'caida', 'tabla', 'lento', 'contrato']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect([...s.triggeredBugs].sort()).toEqual(['KA-MOTIVO', 'KA-TIMEOUT', 'KA-UNIDADES'])
  })

  it('un mock que no valida el contrato no encuentra el bug de los céntimos', () => {
    const lax = M07_SOLUTION_MOCK.split('\n  Scenario: pathMatches(\'/v2/authorizations\') && methodIs(\'post\') && !karate')[0] + '\n  Scenario: pathMatches(\'/v2/authorizations\') && request.merchant == \'DENEGADO\'' + M07_SOLUTION_MOCK.split("request.merchant == 'DENEGADO'")[1]
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    s = run(s, { ...SOLUTION, [M07_MOCK_PATH]: lax }).s
    expect(s.triggeredBugs).not.toContain('KA-UNIDADES')
    expect(s.flags['reto.contrato']).toBeUndefined()
  })

  it('con los bugs arreglados todo pasa', () => {
    const s = { ...start(), fixedBugs: ['KA-TIMEOUT', 'KA-UNIDADES', 'KA-MOTIVO'] }
    expect(run(s, SOLUTION).lab.result.failed).toBe(0)
  })
})
