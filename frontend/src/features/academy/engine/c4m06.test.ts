import { describe, expect, it } from 'vitest'
import { m06PrimerEquipo as mission } from '../content/courses/gestion-equipos-qa/m06-primer-equipo'
import { INITIAL_TEAM, TASKS, assign, confirmAssignments, prepareOneOnOne, toggleTopic, type PersonId, type TeamState } from '../apps/kobalto-team/teamLogic'
import { evaluate, replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-team'] as TeamState | undefined) ?? INITIAL_TEAM
const send = (s: RunState, r: { state: TeamState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

function reparto(s: RunState, map: Record<string, PersonId>) {
  for (const [task, person] of Object.entries(map)) s = send(s, assign(app(s), task, person))
  return send(s, confirmAssignments(app(s)))
}
function oneOnOne(s: RunState, topics: string[]) {
  for (const id of topics) s = send(s, toggleTopic(app(s), id))
  return send(s, prepareOneOnOne(app(s)))
}
const BEST = Object.fromEntries(TASKS.map((t) => [t.id, t.best])) as Record<string, PersonId>

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_lead' })
  s = waitUntil(s, 30)
  s = choose(s, 'kickoff', 'expectations')
  s = reparto(s, BEST)
  s = oneOnOne(s, ['elephant', 'growth', 'feedback', 'needs'])
  s = waitUntil(s, 90)
  s = choose(s, 'pablo_overload', 'act')
  s = waitUntil(s, 150)
  s = choose(s, 'one2one_sergio', 'prepared')
  s = waitUntil(s, 240)
  s = choose(s, 'hector_risk', 'back')
  s = waitUntil(s, 360)
  s = choose(s, 'marta_meeting', 'options')
  s = waitUntil(s, 420)
  s = choose(s, 'lucia_doubt', 'support')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 6 · tu primer equipo (QA Lead)', () => {
  it('liderar con criterio evita todas las consecuencias y da el mejor veredicto', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['hector.trust']).toBe(true)
      expect(s.flags['team.grow']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('el 1:1 bueno con Sergio exige haberlo preparado y darle la automatización', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = oneOnOne(s, ['elephant', 'growth', 'feedback', 'needs'])
    s = waitUntil(s, 150)
    const scene = mission.scenes.find((x) => x.id === 'one2one_sergio')!
    const visible = scene.choices!.filter((c) => !c.requires || evaluateIn(s, c.requires)).map((c) => c.id)
    expect(visible).toEqual(['listen', 'boss'])
  })

  it('pedir a Héctor que firme, ponerse del lado de Marta y hacerlo todo tú traen las consecuencias (eco de la misión 0)', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'kickoff', 'control')
    s = reparto(s, { t1: 'yo', t2: 'pablo', t3: 'hector', t4: 'sergio', t5: 'nerea' })
    s = waitUntil(s, 90)
    s = choose(s, 'pablo_overload', 'everyone')
    s = waitUntil(s, 150)
    s = choose(s, 'one2one_sergio', 'boss')
    s = waitUntil(s, 240)
    s = choose(s, 'hector_risk', 'sign')
    s = waitUntil(s, 360)
    s = choose(s, 'marta_meeting', 'side_marta')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'doer')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-ANTIFRAUDE', 'C-SILENCIO', 'C-SERGIO', 'C-REPARTO', 'C-PABLO', 'C-LUCIA']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('«si QA dice que no, no sale» no lleva el riesgo a quien decide', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 240)
    s = choose(s, 'hector_risk', 'back')
    s = waitUntil(s, 360)
    s = choose(s, 'marta_meeting', 'gate')
    expect(s.flags['release.options']).toBeFalsy()
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})

function evaluateIn(s: RunState, c: Parameters<typeof evaluate>[2]) {
  return evaluate(mission, s, c)
}
