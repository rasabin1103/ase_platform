import { describe, expect, it } from 'vitest'
import { m08Herramientas as mission } from '../content/courses/qa-profesional/m08-herramientas'
import { INITIAL_TOOLS, edit, evaluate, submit, type ToolsState } from '../apps/kobalto-tools/toolsLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-tools'] as ToolsState | undefined) ?? INITIAL_TOOLS
const send = (s: RunState, r: { state: ToolsState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

const GOOD: Partial<ToolsState> = {
  needs: { N1: 'management', N2: 'static', N3: 'design', N4: 'execution', N5: 'nonfunctional', N6: 'devops', N7: 'collaboration' },
  risks: { forge: ['maintenance', 'unrealistic'], cloud: ['lockin', 'noci'], kestrel: ['learning'] },
  choice: 'kestrel',
  scope: 'pilot',
  criteria: ['ci', 'flaky', 'autonomy'],
}

describe('curso 2 · misión 8 · herramientas', () => {
  it('evalúa necesidades, riesgos, candidata y piloto', () => {
    const p = { ...INITIAL_TOOLS, ...GOOD }
    expect(evaluate(p)).toEqual({ needs: 7, risks: 3, choice: true, scope: true, criteria: true })
    expect(evaluate({ ...p, choice: 'forge', criteria: ['ci', 'hundred'] })).toMatchObject({ choice: false, criteria: false })
  })

  it('el recorrido óptimo no deja problemas y termina con veredicto bueno', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, edit(app(s), GOOD, 'propuesta'))
    s = send(s, submit(app(s)))
    for (const f of ['needs.ok', 'eval.ok', 'choice.ok', 'pilot.ok']) expect(s.flags[f], f).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 180 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'sergio_deal'), choiceId: 'pilot' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'committee'), choiceId: 'pilot' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('firmando por impulso y prometiendo el 100 % aparecen los problemas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 180 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'sergio_deal'), choiceId: 'sign' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'committee'), choiceId: 'promise' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['P-PRISA', 'P-EXPECTATIVAS', 'P-FRAGIL', 'P-PILOTO']))
  })
})
