import { describe, expect, it } from 'vitest'
import { m01Match as mission } from '../content/courses/karate-framework/m01-match'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const FEATURE = 'src/test/java/openapi/accounts.feature'
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

function start(): RunState {
  let s = replay(mission, 3, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'refinement'), choiceId: 'contract' })
}

function run(s: RunState, feature: string) {
  const files = { ...mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>), [FEATURE]: feature }
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SUITE = (alias = '') => `Feature: contrato

  Background:
    * url baseUrl
    * def account = { id: '#regex ACC-\\\\d{4}', iban: '#regex ES\\\\d{22}', holder: '#string', type: '#string', currency: '#string', balance: '#number? _ >= 0', status: '#string', createdAt: '#string'${alias} }

  Scenario: contrato del detalle
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response == account

  Scenario: cuentas activas
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items contains { status: 'ACTIVE' }

  Scenario: contrato de la lista
    Given path 'accounts'
    When method get
    Then status 200
    And match each response.items == account
`

describe('curso 3 · misión 2 · match', () => {
  it('el proyecto inicial pasa pero no cumple ningún reto', () => {
    const { s, lab } = run(start(), mission.codeLab!.files[0].content)
    expect(lab.result.passed).toBe(1)
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la suite de contratos cumple los retos y revela los bugs de filtro y tipo', () => {
    const { s } = run(start(), SUITE())
    for (const id of ['esquema', 'reutiliza', 'formato', 'lista', 'tipos']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(s.triggeredBugs.sort()).toEqual(['KA-FILTRO', 'KA-TIPO'])
  })

  it('tras la 1.5: el alias opcional es compatible y holder renombrado es un bug', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 230 })
    expect(s.flags['api.v15']).toBe(true)
    // Sin alias en el esquema: falla, pero el fallo del alias no es un bug.
    const strict = run(s, SUITE())
    expect(strict.s.flags['reto.evolucion']).toBeUndefined()
    // Con alias opcional: el único fallo del detalle es el renombrado (bug).
    const adapted = run(s, SUITE(", alias: '##string'"))
    expect(adapted.s.flags['reto.evolucion']).toBe(true)
    expect(adapted.s.triggeredBugs).toContain('KA-CONTRATO')
    const evidence = adapted.s.log.filter((l) => l.bugs.length === 1 && l.bugs[0] === 'KA-CONTRATO').map((l) => l.id)
    expect(evidence.length).toBeGreaterThan(0)
    const after = step(mission, adapted.s, {
      type: 'report',
      report: {
        title: 'La 1.5 renombra holder a holderName en GET /accounts/{id}',
        steps: 'GET /v1/accounts/ACC-1001 en la 1.5\nmatch response == account',
        expected: 'Campo holder presente (contrato y changelog sin cambios incompatibles)',
        actual: 'holder falta (not present) y aparece holderName',
        severity: 'critical',
        evidence: evidence.slice(0, 1),
      },
    })
    expect(after.reports[0].status).toBe('accepted')
  })
})
