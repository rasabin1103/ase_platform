import { describe, expect, it } from 'vitest'
import { m03Payloads as mission } from '../content/courses/karate-framework/m03-payloads'
import { M03_FEATURE_PATH, M03_PAYLOAD_PATH, M03_SOLUTION_FEATURE, M03_SOLUTION_PAYLOAD } from '../content/courses/karate-framework/m03-lab'
import { runLab } from '../apps/karate-ide/ideLogic'
import { replay, step } from './engine'
import type { RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id
const initial = () => mission.codeLab!.files.reduce((a, f) => ({ ...a, [f.path]: f.content }), {} as Record<string, string>)

function start(): RunState {
  let s = replay(mission, 11, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 20 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'refinement'), choiceId: 'effect' })
}

function run(s: RunState, files: Record<string, string>) {
  const lab = runLab(mission, s, files)
  for (const event of lab.events) s = step(mission, s, { type: 'app', event })
  return { s, lab }
}

const SOLUTION = { ...initial(), [M03_FEATURE_PATH]: M03_SOLUTION_FEATURE, [M03_PAYLOAD_PATH]: M03_SOLUTION_PAYLOAD }

describe('curso 3 · misión 4 · POST y encadenar', () => {
  it('el proyecto inicial crea una transferencia, pero sin comprobar nada no cumple retos', () => {
    const { s, lab } = run(start(), initial())
    expect(lab.result.features[0].scenarios[0].requests[0]).toMatchObject({ method: 'POST', status: 201 })
    expect(s.flags['smell.no-assertions']).toBe(true)
    expect(Object.keys(s.flags).filter((f) => f.startsWith('reto.'))).toEqual([])
  })

  it('la solución cumple los retos y revela los tres bugs', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 240 })
    expect(s.flags['carmen.double'] && s.flags['alba.funds']).toBe(true)
    s = run(s, SOLUTION).s
    for (const id of ['crear', 'fichero', 'encadenar', 'confirmar', 'doble', 'fondos']) expect(s.flags[`reto.${id}`], id).toBe(true)
    expect(s.triggeredBugs.sort()).toEqual(['KA-DOBLE', 'KA-FONDOS', 'KA-IMPORTE'])
  })

  it('un id de transferencia escrito a mano no cuenta como encadenar', () => {
    const files = { ...SOLUTION, [M03_FEATURE_PATH]: M03_SOLUTION_FEATURE.replace("Given path 'transfers', transferId\n    When method get", "Given path 'transfers', 'TRF-4101'\n    When method get") }
    const { s } = run(start(), files)
    expect(s.flags['reto.encadenar']).toBeUndefined()
  })

  it('reportar el doble cobro con su escenario se acepta y el fix lo arregla', () => {
    let s = start()
    s = step(mission, s, { type: 'wait', minutes: 100 })
    s = run(s, SOLUTION).s
    const evidence = s.log.filter((l) => l.bugs.includes('KA-DOBLE')).map((l) => l.id)
    s = step(mission, s, {
      type: 'report',
      report: {
        title: 'Confirmar dos veces la misma transferencia la cobra dos veces',
        steps: 'POST /transfers\nPOST /transfers/{id}/confirm\nPOST /transfers/{id}/confirm otra vez',
        expected: '409 TRANSFER_ALREADY_COMPLETED y el saldo no cambia',
        actual: 'La segunda confirmación devuelve 200 y descuenta el saldo otra vez',
        severity: 'critical',
        evidence: evidence.slice(0, 1),
      },
    })
    expect(s.reports[0].status).toBe('accepted')
    s = step(mission, s, { type: 'wait', minutes: 70 })
    expect(s.fixedBugs).toContain('KA-DOBLE')
  })
})
