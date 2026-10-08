import { describe, expect, it } from 'vitest'
import { m00Equipo as mission } from '../content/courses/qa-profesional/m00-equipo'
import {
  ACTIVITIES,
  CASES,
  CONDITIONS,
  DEFECTS,
  INITIAL_PROCESS,
  TESTWARE,
  evaluateOrder,
  propose,
  sendTrace,
  setActivity,
  setLink,
  type ActivityId,
  type ProcessState,
  type RoleId,
} from '../apps/kobalto-process/processLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-process'] as ProcessState | undefined) ?? INITIAL_PROCESS
const send = (s: RunState, r: { state: ProcessState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

const ORDER: ActivityId[] = ['planning', 'monitoring', 'analysis', 'design', 'implementation', 'execution', 'completion']
const MGMT: ActivityId[] = ['planning', 'monitoring', 'completion']

function goodProcess(s: RunState): RunState {
  ORDER.forEach((id, i) => {
    const tw = TESTWARE.find((t) => t.activity === id)!.id
    const role: RoleId = MGMT.includes(id) ? 'management' : 'tester'
    s = send(s, setActivity(app(s), id, { position: i + 1, testware: tw, role }))
  })
  return send(s, propose(app(s)))
}

function goodTrace(s: RunState): RunState {
  for (const c of CONDITIONS) s = send(s, setLink(app(s), c.id, c.story))
  for (const t of CASES) s = send(s, setLink(app(s), t.id, t.condition))
  for (const d of DEFECTS) s = send(s, setLink(app(s), d.id, d.case))
  return send(s, sendTrace(app(s)))
}

describe('curso 2 · misión 0 · equipo nuevo', () => {
  it('el orden exige planificación primero, cierre al final y análisis → diseño → implementación → ejecución', () => {
    const plan = Object.fromEntries(ACTIVITIES.map((a) => [a.id, { position: ORDER.indexOf(a.id) + 1, testware: '', role: '' }])) as ProcessState['plan']
    expect(evaluateOrder(plan).ok).toBe(true)
    expect(evaluateOrder({ ...plan, design: { ...plan.design, position: 3 }, analysis: { ...plan.analysis, position: 4 } }).ok).toBe(false)
  })

  it('el recorrido óptimo evita todos los problemas y termina con veredicto bueno', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 15 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'daily'), choiceId: 'whole' })
    s = goodProcess(s)
    s = goodTrace(s)
    expect(s.flags['proc.all']).toBe(true)
    expect(s.flags['trace.ok']).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 150 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'tomas_closure'), choiceId: 'keep' })
    s = step(mission, s, { type: 'wait', minutes: 300 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'carmen_call'), choiceId: 'trace' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    expect(s.activeBugs).toEqual([])
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'committee'), choiceId: 'early' })
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    expect(summarize(mission, s).verdict.tone).toBe('good')
  })

  it('sin independencia, sin trazabilidad y quitando el cierre aparecen los problemas', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 15 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'daily'), choiceId: 'devs' })
    s = goodProcess(s)
    s = step(mission, s, { type: 'wait', minutes: 150 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'tomas_closure'), choiceId: 'drop' })
    s = step(mission, s, { type: 'wait', minutes: 360 - s.clock })
    expect(s.activeBugs).toEqual(expect.arrayContaining(['P-INDEP', 'P-TRAZA', 'P-CIERRE']))
    expect(s.activeBugs).not.toContain('P-ORDEN')
  })
})
