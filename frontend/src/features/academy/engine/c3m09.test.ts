import { describe, expect, it } from 'vitest'
import { m09Framework as mission } from '../content/courses/karate-framework/m09-framework'
import { M09_PATHS, M09_SOLUTION } from '../content/courses/karate-framework/m09-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 17, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'standup'), choiceId: 'structure' })
}

function run(s: RunState, files: Record<string, string>, job?: string) {
  const lab = runLab(mission, s, files, { job })
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), ...M09_SOLUTION }

describe('curso 3 · misión 10 · tu framework', () => {
  it('el proyecto inicial: 429 en el último feature, la PR de Iker da 401 y no hay bugs revelados', () => {
    const { s, lab } = run(start(), initial())
    const scs = lab.result.features.flatMap((f) => f.scenarios)
    expect(scs.filter((sc) => sc.file === M09_PATHS.transfers).every((sc) => /429/.test(sc.error?.message ?? ''))).toBe(true)
    expect(scs.filter((sc) => sc.file === M09_PATHS.cards && sc.status === 'failed').every((sc) => /status code was: 401/.test(sc.error?.message ?? ''))).toBe(true)
    expect(s.triggeredBugs).toEqual([])
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los seis retos y revela los bugs de tarjetas', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 300 })
    expect(s.flags['iker.pr'] && s.flags['ivan.convenciones'] && s.flags['sergio.final']).toBe(true)
    s = run(s, SOLUTION).s
    s = run(s, SOLUTION, 'nightly').s
    for (const id of ['callsingle', 'revision', 'esquemas', 'utilidades', 'convenciones', 'final']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect([...s.triggeredBugs].sort()).toEqual(['KA-CARDFILTER', 'KA-PAN'])
  })

  it('callSingle sin quitar los callonce de los features no basta', () => {
    const files = { ...initial(), [Object.keys(M09_SOLUTION).find((p) => p.endsWith('karate-config.js'))!]: M09_SOLUTION[Object.keys(M09_SOLUTION).find((p) => p.endsWith('karate-config.js'))!] }
    const { s } = run(start(), files)
    expect(s.flags['reto.callsingle']).toBeUndefined()
  })

  it('con los bugs arreglados, el nocturno con la solución queda en verde', () => {
    const s = { ...start(), fixedBugs: ['KA-PAN', 'KA-CARDFILTER'] }
    const { lab } = run(s, SOLUTION, 'nightly')
    expect(lab.pipeline).toMatchObject({ build: 'SUCCESS', failed: 0 })
    expect(lab.pipeline!.scenarios).toBeGreaterThanOrEqual(15)
  })
})
