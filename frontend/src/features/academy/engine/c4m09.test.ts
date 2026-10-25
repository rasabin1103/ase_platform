import { describe, expect, it } from 'vitest'
import { m09Recortes as mission } from '../content/courses/gestion-equipos-qa/m09-recortes'
import { INITIAL_CAPACITY, LEVERS, savePlan, toggleLever, type CapacityState } from '../apps/kobalto-capacity/capacityLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-capacity'] as CapacityState | undefined) ?? INITIAL_CAPACITY
const send = (s: RunState, r: { state: CapacityState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

const GOOD = LEVERS.filter((l) => l.kind === 'good').map((l) => l.id)
function plan(s: RunState, ids: string[]) {
  for (const id of ids) s = send(s, toggleLever(app(s), id))
  return send(s, savePlan(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_manager' })
  s = waitUntil(s, 30)
  s = choose(s, 'sergio_rumor', 'honest')
  s = waitUntil(s, 60)
  s = choose(s, 'raul_outsource', 'risk')
  s = plan(s, GOOD)
  s = waitUntil(s, 240)
  s = choose(s, 'marta_scope', 'agree')
  s = waitUntil(s, 360)
  s = choose(s, 'committee', 'present')
  s = waitUntil(s, 420)
  s = choose(s, 'all_hands', 'honest')
  s = waitUntil(s, 450)
  s = choose(s, 'hector_offer', 'retain')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 9 · recortes (QA Manager)', () => {
  it('recortar por riesgo, acordar con negocio, contarlo de frente y retener evita todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['plan.approved']).toBe(true)
      expect(s.flags['comm.ok']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('sin un plan aprobado no se puede dar al equipo el anuncio completo', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = plan(s, ['outsource_payments', 'vacancies', 'tools'])
    s = waitUntil(s, 360)
    s = choose(s, 'committee', 'present')
    expect(s.flags['plan.approved']).toBeFalsy()
    s = waitUntil(s, 420)
    s = choose(s, 'all_hands', 'honest')
    expect(s.flags['comm.ok']).toBeFalsy()
  })

  it('negar el rumor, externalizar lo crítico, esconder el alcance y no retener traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'sergio_rumor', 'deny')
    s = waitUntil(s, 60)
    s = choose(s, 'raul_outsource', 'yes')
    s = plan(s, ['outsource_payments', 'seniors', 'training'])
    s = waitUntil(s, 240)
    s = choose(s, 'marta_scope', 'hide')
    s = waitUntil(s, 360)
    s = choose(s, 'committee', 'equal')
    s = waitUntil(s, 420)
    s = choose(s, 'all_hands', 'spin')
    s = waitUntil(s, 450)
    s = choose(s, 'hector_offer', 'go')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'numbers')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-CRITICO', 'C-PERSONAS', 'C-FUGA', 'C-RUMOR', 'C-ALCANCE', 'C-MORAL']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
