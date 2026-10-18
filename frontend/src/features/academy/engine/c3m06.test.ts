import { describe, expect, it } from 'vitest'
import { m06Errores as mission } from '../content/courses/karate-framework/m06-errores'
import { M06_ERRORS_PATH, M06_SOLUTION_ERRORS, M06_SOLUTION_TRANSFERS, M06_TRANSFERS_PATH } from '../content/courses/karate-framework/m06-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 17, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'standup'), choiceId: 'retry' })
}

function run(s: RunState, files: Record<string, string>) {
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M06_TRANSFERS_PATH]: M06_SOLUTION_TRANSFERS, [M06_ERRORS_PATH]: M06_SOLUTION_ERRORS }

describe('curso 3 · misión 7 · cuando todo falla', () => {
  it('el proyecto inicial falla por el cambio de contrato (202), sin revelar bugs', () => {
    const { s, lab } = run(start(), initial())
    const scs = lab.result.features.flatMap((f) => f.scenarios)
    expect(scs.find((sc) => sc.name.startsWith('crear y confirmar'))?.error?.message).toMatch(/status code was: 202, expected: 200/)
    expect(s.triggeredBugs).toEqual([])
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los seis retos y revela los tres bugs', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    expect(s.flags['carmen.fault'] && s.flags['alba.externa']).toBe(true)
    s = run(s, SOLUTION).s
    for (const id of ['esquema', 'negativos', 'asincrona', 'basura', 'caida', 'externa']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect([...s.triggeredBugs].sort()).toEqual(['KA-ASYNC', 'KA-ERRFMT', 'KA-PARSE'])
  })

  it('sin configure retry, la espera se queda corta y no cuenta como reto ni como bug', () => {
    const files = { ...SOLUTION, [M06_TRANSFERS_PATH]: M06_SOLUTION_TRANSFERS.replace('    * configure retry = { count: 10, interval: 1000 }\n', '') }
    const { s, lab } = run(start(), files)
    const tr = lab.result.features.find((f) => f.file === M06_TRANSFERS_PATH)!.scenarios
    expect(tr.every((sc) => /too many retry attempts: 3/.test(sc.error?.message ?? ''))).toBe(true)
    expect(s.flags['reto.asincrona']).toBeUndefined()
    expect(s.triggeredBugs).not.toContain('KA-ASYNC')
  })

  it('con los bugs arreglados la suite queda en verde', () => {
    let s = start()
    s = { ...s, fixedBugs: ['KA-ASYNC', 'KA-ERRFMT', 'KA-PARSE'] }
    const { lab } = run(s, SOLUTION)
    expect(lab.result.failed).toBe(0)
  })
})
