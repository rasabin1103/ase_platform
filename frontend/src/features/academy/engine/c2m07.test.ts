import { describe, expect, it } from 'vitest'
import { m07Configuracion as mission } from '../content/courses/qa-profesional/m07-configuracion'
import { INITIAL_CONFIG, edit, evaluate, regressionDays, submit, type ConfigState } from '../apps/kobalto-config/configLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-config'] as ConfigState | undefined) ?? INITIAL_CONFIG
const send = (s: RunState, r: { state: ConfigState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

const GOOD: Partial<ConfigState> = {
  cause: 'config',
  unversioned: 'config',
  build: 'deploy412',
  report: { title: 1, env: 1, result: 0 },
  trigger: 'migration',
  suites: ['emit', 'recurrent', 'corrective', 'pdf'],
}

describe('curso 2 · misión 7 · ¿qué versión es?', () => {
  it('evalúa configuración, build, informe e impacto', () => {
    const p = { ...INITIAL_CONFIG, ...GOOD }
    expect(evaluate(p)).toEqual({ cause: true, unversioned: true, build: true, report: 3, trigger: true, impact: true, full: false })
    expect(regressionDays(p.suites)).toBe(3)
    const all = { ...p, suites: ['emit', 'recurrent', 'corrective', 'pdf', 'cards', 'signup', 'csv', 'login'] }
    expect(evaluate(all)).toMatchObject({ impact: false, full: true })
    expect(regressionDays(all.suites)).toBe(5.5)
  })

  it('el recorrido óptimo no deja problemas y termina con veredicto bueno', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, edit(app(s), GOOD, 'trazado'))
    s = send(s, submit(app(s)))
    for (const f of ['config.found', 'config.unversioned', 'build.ok', 'report.ok', 'trigger.ok', 'impact.ok']) expect(s.flags[f], f).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 150 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'emp231'), choiceId: 'deploy' })
    s = step(mission, s, { type: 'wait', minutes: 300 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'billing'), choiceId: 'version' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'regression'), choiceId: 'impact' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('cerrando a ciegas y con regresión por miedo aparecen los problemas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 150 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'emp231'), choiceId: 'close' })
    s = step(mission, s, { type: 'wait', minutes: 300 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'billing'), choiceId: 'hand' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'regression'), choiceId: 'full' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['P-FIX', 'P-CONFIG', 'P-REGRESION', 'P-CAUSA']))
  })
})
