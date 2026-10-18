import { describe, expect, it } from 'vitest'
import { m08Pipeline as mission } from '../content/courses/karate-framework/m08-pipeline'
import { M08_ACCOUNTS_PATH, M08_NIGHTLY_PATH, M08_SOLUTION_ACCOUNTS, M08_SOLUTION_NIGHTLY, M08_SOLUTION_TRANSFERS, M08_TRANSFERS_PATH } from '../content/courses/karate-framework/m08-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 17, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'standup'), choiceId: 'cause' })
}

function run(s: RunState, files: Record<string, string>, job?: string) {
  const lab = runLab(mission, s, files, { job })
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M08_ACCOUNTS_PATH]: M08_SOLUTION_ACCOUNTS, [M08_TRANSFERS_PATH]: M08_SOLUTION_TRANSFERS, [M08_NIGHTLY_PATH]: M08_SOLUTION_NIGHTLY }

describe('curso 3 · misión 9 · verde en el pipeline', () => {
  it('en local todo pasa; el nocturno inicial sale verde con escenarios en rojo', () => {
    let s = start()
    const local = run(s, initial())
    expect(local.lab.result.failed).toBe(0)
    s = local.s
    const ci = run(s, initial(), 'nightly')
    expect(ci.lab.pipeline).toMatchObject({ build: 'SUCCESS', threads: 4 })
    expect(ci.lab.pipeline!.failed).toBeGreaterThan(0)
    expect(ci.s.flags['ci.false-green']).toBe(true)
    expect(Object.keys(ci.s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los seis retos y destapa los dos bugs', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    for (let i = 0; i < 3; i++) s = run(s, SOLUTION, 'nightly').s
    s = run(s, SOLUTION, 'pr').s
    for (const id of ['assert', 'smoke', 'aislado', 'estable', 'reserva', 'informe']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect([...s.triggeredBugs].sort()).toEqual(['KA-RESERVA', 'KA-SEQ'])
  })

  it('el runner que no compila rompe el build sin ejecutar nada', () => {
    const { lab } = run(start(), { ...SOLUTION, [M08_NIGHTLY_PATH]: M08_SOLUTION_NIGHTLY.replace('import static org.junit.jupiter.api.Assertions.*;\n', '') }, 'nightly')
    expect(lab.pipeline).toMatchObject({ build: 'FAILURE', reason: 'COMPILATION ERROR', scenarios: 0 })
  })

  it('un smoke con transferencias se pasa del presupuesto', () => {
    const slow = { ...SOLUTION, [M08_TRANSFERS_PATH]: M08_SOLUTION_TRANSFERS.replace('  Scenario Outline:', '  @smoke\n  Scenario Outline:') }
    const { s, lab } = run(start(), slow, 'pr')
    expect(lab.pipeline!.wallMs).toBeGreaterThan(3000)
    expect(s.flags['reto.smoke']).toBeUndefined()
  })

  it('con el test del saldo original, el nocturno no es estable', () => {
    let s = start()
    const files = { ...initial(), [M08_NIGHTLY_PATH]: M08_SOLUTION_NIGHTLY }
    const builds: string[] = []
    for (let i = 0; i < 4; i++) {
      const r = run(s, files, 'nightly')
      s = r.s
      builds.push(r.lab.pipeline!.build)
    }
    expect(builds).toContain('FAILURE')
    expect(s.flags['reto.estable']).toBeUndefined()
  })
})
