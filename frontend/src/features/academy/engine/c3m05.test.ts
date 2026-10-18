import { describe, expect, it } from 'vitest'
import { m05Auth as mission } from '../content/courses/karate-framework/m05-auth'
import { M05_FEATURE_PATH, M05_LOGIN_PATH, M05_SOLUTION_FEATURE, M05_SOLUTION_LOGIN } from '../content/courses/karate-framework/m05-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 17, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'standup'), choiceId: 'login' })
}

function run(s: RunState, files: Record<string, string>) {
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M05_FEATURE_PATH]: M05_SOLUTION_FEATURE, [M05_LOGIN_PATH]: M05_SOLUTION_LOGIN }

describe('curso 3 · misión 6 · tokens y reutilización', () => {
  it('el proyecto inicial funciona con el login copiado, sin retos', () => {
    const { s, lab } = run(start(), initial())
    expect(lab.result.failed).toBe(0)
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los retos y revela scope y revocación', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    s = run(s, SOLUTION).s
    for (const id of ['login', 'call', 'ignore', 'callonce', 'scope', 'revoke']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(s.triggeredBugs.sort()).toEqual(['KA-REVOKE', 'KA-SCOPE'])
  })

  it('con call en vez de callonce y más escenarios, la suite choca con el límite', () => {
    const extra = `
  Scenario: otra vez el detalle
    Given path 'accounts', accountId
    When method get
    Then status 200
`
    const files = { ...SOLUTION, [M05_FEATURE_PATH]: M05_SOLUTION_FEATURE.replace('callonce read', 'call read') + extra + extra.replace('otra vez', 'y otra') }
    const { s, lab } = run(start(), files)
    expect(lab.result.features[0].scenarios.some((sc) => sc.error?.message.includes('429'))).toBe(true)
    expect(s.flags['reto.callonce']).toBeUndefined()
  })

  it('credenciales incorrectas revelan el 500', () => {
    const neg = `
  Scenario: credenciales incorrectas
    Given path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: 'mala' }
    When method post
    Then status 401
`
    const { s } = run(start(), { ...SOLUTION, [M05_FEATURE_PATH]: M05_SOLUTION_FEATURE + neg })
    expect(s.triggeredBugs).toContain('KA-AUTH500')
  })
})
