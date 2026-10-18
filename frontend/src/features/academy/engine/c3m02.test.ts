import { describe, expect, it } from 'vitest'
import { m02Config as mission } from '../content/courses/karate-framework/m02-config'
import { M02_CONFIG_PATH, M02_FEATURE_PATH, M02_SOLUTION_CONFIG, M02_SOLUTION_FEATURE } from '../content/courses/karate-framework/m02-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { KOBALTO_PRE_KEY } from '../karate/apis/kobaltoOpenApi'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 5, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'planning'), choiceId: 'config' })
}

function run(s: RunState, files: Record<string, string>, env: string) {
  const lab = runLab(mission, s, files, { env })
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M02_CONFIG_PATH]: M02_SOLUTION_CONFIG, [M02_FEATURE_PATH]: M02_SOLUTION_FEATURE }

describe('curso 3 · misión 3 · un test, tres entornos', () => {
  it('el proyecto inicial pasa en sandbox y falla en pre (otra URL no configurada → sigue en sandbox)', () => {
    const sb = run(start(), initial(), 'sandbox')
    expect(sb.lab.result.failed).toBe(0)
    const p = run(start(), initial(), 'pre')
    expect(p.s.flags['reto.entornos']).toBeUndefined()
  })

  it('la solución cumple todos los retos y revela los dos bugs de pre', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 }) // llegan Carmen y Alba
    expect(s.flags['carmen.key'] && s.flags['alba.corr']).toBe(true)
    s = run(s, SOLUTION, 'sandbox').s
    expect(s.flags['ide.green.sandbox']).toBe(true)
    const r = run(s, SOLUTION, 'pre')
    s = r.s
    for (const id of ['entornos', 'clave', 'secreto', 'datos', 'sinclave', 'correlacion']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(s.triggeredBugs.sort()).toEqual(['KA-CORR', 'KA-KEY'])
    expect(s.flags['smell.hardcoded-secret']).toBeUndefined()
  })

  it('pegar la clave en el código se detecta y no cumple el reto del secreto', () => {
    const files = { ...SOLUTION, [M02_CONFIG_PATH]: M02_SOLUTION_CONFIG.replace("karate.properties['kobalto.apiKey']", `'${KOBALTO_PRE_KEY}'`) }
    const { s } = run(start(), files, 'pre')
    expect(s.flags['smell.hardcoded-secret']).toBe(true)
    expect(s.flags['reto.secreto']).toBeUndefined()
    expect(s.messages.some((m) => m.sceneId === 'carmen_secret')).toBe(true)
  })

  it('con el id fijo en el feature, pre no queda en verde', () => {
    const files = { ...SOLUTION, [M02_FEATURE_PATH]: M02_SOLUTION_FEATURE.replace("Given path 'accounts', accountId\n    When method get\n    Then status 200\n    And match response == account", "Given path 'accounts', 'ACC-1001'\n    When method get\n    Then status 200\n    And match response == account") }
    const { s } = run(start(), files, 'pre')
    expect(s.flags['ide.green.pre']).toBeUndefined()
  })
})
