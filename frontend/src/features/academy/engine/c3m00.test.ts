import { describe, expect, it } from 'vitest'
import { m00HolaKarate as mission } from '../content/courses/karate-framework/m00-hola-karate'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step, summarize } from './engine'
import type { RunState } from './types'

const FEATURE = 'src/test/java/openapi/accounts.feature'
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

function start(): RunState {
  let s = replay(mission, 7, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 30 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'daily'), choiceId: 'smoke' })
}

function run(s: RunState, feature: string): { s: RunState; lab: ReturnType<typeof runLab> } {
  const files = { ...mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>), [FEATURE]: feature }
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const GOOD = `Feature: smoke

  Background:
    * url baseUrl

  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'

  Scenario: detalle de una cuenta
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
    And match response.currency == 'EUR'

  Scenario: cuenta inexistente
    Given path 'accounts', 'ACC-9999'
    When method get
    Then status 404
    And match response.code == 'ACCOUNT_NOT_FOUND'

  Scenario: cuenta bloqueada por Compliance
    Given path 'accounts', 'ACC-1003'
    When method get
    Then status 200
    And match response.status == 'BLOCKED'
`

describe('curso 3 · misión 1 · hola, Karate', () => {
  it('el proyecto inicial se ejecuta y avisa de que no comprueba nada', () => {
    const { s, lab } = run(start(), mission.codeLab!.files[0].content)
    expect(lab.result.passed).toBe(1)
    expect(s.flags['smell.no-assertions']).toBe(true)
    expect(s.messages.some((m) => m.sceneId === 'sergio_no_assert')).toBe(true)
    expect(s.flags['reto.smoke']).toBeUndefined()
  })

  it('una suite correcta cumple los retos, revela el bug de Compliance y se puede reportar', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 60 }) // llega Carmen
    expect(s.flags['carmen.asked']).toBe(true)
    let r = run(s, GOOD)
    s = r.s
    for (const id of ['smoke', 'cuenta', 'noexiste', 'background', 'bloqueada']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(r.lab.result.failed).toBe(1)
    expect(s.triggeredBugs).toEqual(['KA-BLOQ'])
    const evidence = s.log.filter((l) => l.bugs.includes('KA-BLOQ')).map((l) => l.id)
    expect(evidence).toHaveLength(1)
    s = step(mission, s, {
      type: 'report',
      report: {
        title: 'ACC-1003 bloqueada aparece como ACTIVE en GET /accounts/ACC-1003',
        steps: "GET /v1/accounts/ACC-1003\nmatch response.status == 'BLOCKED'",
        expected: 'status BLOCKED (bloqueada por Compliance)',
        actual: 'status ACTIVE',
        severity: 'critical',
        evidence,
      },
    })
    expect(s.reports[0].status).toBe('accepted')
    // Tras el fix, el mismo test pasa.
    s = step(mission, s, { type: 'wait', minutes: 70 })
    expect(s.fixedBugs).toContain('KA-BLOQ')
    r = run(s, GOOD)
    expect(r.lab.result.failed).toBe(0)
  })

  it('un test equivocado falla pero no revela ningún bug', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 60 })
    const { s: after } = run(s, GOOD.replace("== 'BLOCKED'", "== 'CLOSED'"))
    expect(after.triggeredBugs).toEqual([])
    expect(after.flags['reto.bloqueada']).toBeUndefined()
  })

  it('probar la cuenta en dólares revela el segundo bug', () => {
    const { s } = run(
      start(),
      `Feature: x
  Background:
    * url baseUrl
  Scenario: usd
    Given path 'accounts', 'ACC-1004'
    When method get
    Then status 200
    And match response.currency == 'USD'
`,
    )
    expect(s.triggeredBugs).toEqual(['KA-DIVISA'])
  })

  it('una URL completa en el escenario no cumple el reto del Background', () => {
    const { s } = run(start(), GOOD.replace("  Background:\n    * url baseUrl\n", '').replace(/(Scenario: [^\n]+\n)/g, "$1    * url 'https://api.kobalto.test/v1'\n"))
    expect(s.flags['reto.smoke']).toBe(true)
    expect(s.flags['reto.background']).toBeUndefined()
    expect(s.flags['smell.hardcoded-url']).toBe(true)
  })

  it('el día completo termina con un debrief coherente', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 60 })
    s = run(s, GOOD).s
    s = step(mission, s, { type: 'wait', minutes: 600 })
    expect(s.messages.some((m) => m.sceneId === 'closing')).toBe(true)
    const sum = summarize(mission, s)
    expect(sum.bugs.map((b) => b.id).sort()).toEqual(['KA-BLOQ', 'KA-DIVISA'])
  })
})
