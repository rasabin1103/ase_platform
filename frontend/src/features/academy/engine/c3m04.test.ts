import { describe, expect, it } from 'vitest'
import { m04Datos as mission } from '../content/courses/karate-framework/m04-datos'
import { M04_DATA_PATH, M04_FEATURE_PATH, M04_SOLUTION_DATA, M04_SOLUTION_FEATURE } from '../content/courses/karate-framework/m04-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 13, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'planning'), choiceId: 'bva' })
}

function run(s: RunState, files: Record<string, string>) {
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M04_FEATURE_PATH]: M04_SOLUTION_FEATURE, [M04_DATA_PATH]: M04_SOLUTION_DATA }

describe('curso 3 · misión 5 · dirigido por datos', () => {
  it('el proyecto inicial pasa pero no cumple retos', () => {
    const { s, lab } = run(start(), initial())
    expect(lab.result.passed).toBe(1)
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los retos y revela los tres bugs de borde', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 180 })
    s = run(s, SOLUTION).s
    for (const id of ['outline', 'limites', 'codigos', 'negativos', 'json', 'concepto']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(s.triggeredBugs.sort()).toEqual(['KA-CENT', 'KA-CONCEPTO', 'KA-LIMITE'])
  })

  it('copiar y pegar escenarios se detecta', () => {
    const one = (n: number) => `
  Scenario: importe ${n}
    * def amount = ${n}
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status 201
`
    const feature = `Feature: x\n  Background:\n    * url baseUrl\n${one(100)}${one(200)}${one(300)}`
    const { s } = run(start(), { ...initial(), [M04_FEATURE_PATH]: feature })
    expect(s.flags['smell.duplicated']).toBe(true)
    expect(s.messages.some((m) => m.sceneId === 'sergio_duplicated')).toBe(true)
  })

  it('una tabla con importes como texto no cumple los bordes', () => {
    const files = { ...SOLUTION, [M04_FEATURE_PATH]: M04_SOLUTION_FEATURE.replace('| amount! | status |', '| amount | status |') }
    const { s } = run(start(), files)
    expect(s.flags['reto.limites']).toBeUndefined()
  })
})
