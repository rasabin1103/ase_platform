import { describe, expect, it } from 'vitest'
import { m02Gherkin as mission } from '../content/courses/qa-profesional/m02-gherkin'
import {
  INITIAL_GHERKIN,
  addScenario,
  agree,
  evaluateScenario,
  parseAmount,
  tddStep,
  updateScenario,
  type GherkinState,
  type Scenario,
  type TddAction,
} from '../apps/kobalto-gherkin/gherkinLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-gherkin'] as GherkinState | undefined) ?? INITIAL_GHERKIN
const send = (s: RunState, r: { state: GherkinState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

function start(choice: 'mapping' | 'happy' | 'later'): RunState {
  let s = replay(mission, 1, [{ type: 'start' }])
  s = step(mission, s, { type: 'wait', minutes: 10 })
  return step(mission, s, { type: 'choose', messageId: msgId(s, 'amigos'), choiceId: choice })
}

function write(s: RunState, steps: [Scenario['steps'][number]['kw'], string][], examples: Scenario['examples'] = []): RunState {
  s = send(s, addScenario(app(s)))
  const sc = app(s).scenarios[app(s).scenarios.length - 1]
  return send(s, updateScenario(app(s), { ...sc, steps: steps.map(([kw, stepId]) => ({ kw, stepId })), examples }))
}

const IMPORTES: Scenario['examples'] = [
  { importe: '0,99', resultado: 'rechaza' },
  { importe: '1,00', resultado: 'acepta' },
  { importe: '5.000,00', resultado: 'acepta' },
  { importe: '5000,01', resultado: 'rechaza' },
]

function tdd(s: RunState, seq: TddAction[]): RunState {
  for (const a of seq) s = send(s, tddStep(app(s), a))
  return s
}

describe('curso 2 · misión 2 · dado, cuando, entonces', () => {
  it('parsea importes en formato español', () => {
    expect(parseAmount('5.000,01')).toBe(5000.01)
    expect(parseAmount('0,99')).toBe(0.99)
    expect(parseAmount('5000')).toBe(5000)
    expect(Number.isNaN(parseAmount('abc'))).toBe(true)
  })

  it('detecta pasos de interfaz, varios Cuando y resultados no verificables', () => {
    const e = evaluateScenario({ id: 1, title: 'x', steps: [{ kw: 'given', stepId: 'g_ui' }, { kw: 'when', stepId: 'w_ui' }, { kw: 'when', stepId: 'w_cancel' }, { kw: 'then', stepId: 't_ok' }], examples: [] })
    expect(e.smells.length).toBe(3)
    expect(e.valid).toBe(false)
  })

  it('con mapeo, escenarios correctos y TDD completo no nace ningún bug', () => {
    let s = start('mapping')
    expect(s.flags['amigos.mapped']).toBe(true)
    s = write(s, [['given', 'g_pend'], ['when', 'w_pay'], ['then', 't_paid']])
    s = write(s, [['when', 'w_create'], ['then', 't_created']], IMPORTES)
    s = write(s, [['given', 'g_cad'], ['when', 'w_pay'], ['then', 't_rej_cad']])
    s = write(s, [['given', 'g_pag'], ['when', 'w_pay'], ['then', 't_rej_pag']])
    s = write(s, [['given', 'g_anu'], ['when', 'w_pay'], ['then', 't_rej_anu']])
    s = write(s, [['given', 'g_pag'], ['when', 'w_cancel'], ['then', 't_cancel_rej']])
    s = send(s, agree(app(s)))
    for (const f of ['gk.happy', 'gk.r1min', 'gk.r1max', 'gk.r2', 'gk.r3', 'gk.r4', 'gk.r5', 'gk.style']) expect(s.flags[f], f).toBe(true)
    if (!s.flags['sofia.asked']) s = step(mission, s, { type: 'wait', minutes: Math.max(1, 90 - s.clock) })
    s = tdd(s, ['test100', 'run', 'code', 'run', 'test5', 'run', 'code', 'run', 'refactor', 'run'])
    expect(s.flags['tdd.min']).toBe(true)
    expect(s.flags['tdd.cycle']).toBe(true)
    expect(s.clock).toBeLessThan(360)
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    expect(s.flags['dev.started']).toBe(true)
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'wait', minutes: 450 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'demo'), choiceId: 'honest' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('solo el caso feliz, con pasos de interfaz y código antes que el test deja nacer los bugs', () => {
    let s = start('happy')
    expect(s.flags['amigos.mapped']).toBeUndefined()
    s = write(s, [['given', 'g_ui'], ['when', 'w_ui'], ['then', 't_paid']])
    s = write(s, [['when', 'w_create'], ['then', 't_created']], [{ importe: '1', resultado: 'acepta' }, { importe: '5000', resultado: 'rechaza' }])
    s = send(s, agree(app(s)))
    expect(s.flags['gk.ui']).toBe(true)
    expect(s.flags['gk.wrong']).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: Math.max(1, 90 - s.clock) })
    s = tdd(s, ['codeAll', 'test100', 'run'])
    expect(s.flags['tdd.code_first']).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['G-MIN', 'G-MAX', 'G-CAD', 'G-DOBLE', 'G-ANUL', 'G-ANUL-PAG', 'G-COM', 'G-UI']))
  })
})
