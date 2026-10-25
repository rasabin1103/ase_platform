import { describe, expect, it } from 'vitest'
import { m00LaFirma as mission } from '../content/courses/gestion-equipos-qa/m00-la-firma'
import { evaluate as evaluateCondition, replay, step, summarize } from './engine'
import type { Action, RunState } from './types'

const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)?.id
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = msgId(s, sceneId)
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const act = (s: RunState, a: Action) => step(mission, s, a)
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? act(s, { type: 'wait', minutes: minute - s.clock }) : s)
const ticket = (s: RunState, ticketId: string, actionId: string) => act(s, { type: 'ticketAction', ticketId, actionId })

/** Recorrido de una QA manual que cumple con su rol. */
function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = act(s, { type: 'readDoc', docId: 'ficha_rol' })
  s = waitUntil(s, 15)
  s = choose(s, 'daily', 'honest')
  s = ticket(s, 'KOB-415', 'evidence')
  s = waitUntil(s, 60)
  s = choose(s, 'diego_reject', 'evidence')
  s = ticket(s, 'KOB-412', 'critical')
  s = choose(s, 'sergio_ask', 'negotiate')
  s = waitUntil(s, 210)
  s = choose(s, 'marta_pressure', 'options')
  s = ticket(s, 'KOB-412', 'status')
  s = waitUntil(s, 360)
  s = choose(s, 'laura_checkin', 'help')
  s = waitUntil(s, 450)
  s = choose(s, 'gonogo', 'clear')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 0 · la firma (QA manual)', () => {
  it('cumplir con el rol evita todas las consecuencias y da el mejor veredicto', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['gonogo.clear']).toBe(true)
      expect(s.flags['trust.ok']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('el bug se puede defender más tarde: Diego lo acepta en cuanto llega la evidencia', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 60)
    s = choose(s, 'diego_reject', 'later')
    expect(s.flags['bug.accepted']).toBeFalsy()
    s = ticket(s, 'KOB-415', 'evidence')
    s = waitUntil(s, s.clock + 1)
    expect(s.flags['bug.accepted']).toBe(true)
  })

  it('firmar sin probar, «todo bien» y decir que sí a todo traen las consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 15)
    s = choose(s, 'daily', 'fine')
    s = waitUntil(s, 60)
    s = choose(s, 'diego_reject', 'close')
    s = waitUntil(s, 120)
    s = choose(s, 'sergio_ask', 'yes')
    s = waitUntil(s, 210)
    s = choose(s, 'marta_pressure', 'sign')
    s = waitUntil(s, 360)
    s = choose(s, 'laura_checkin', 'fine')
    s = waitUntil(s, 450)
    s = choose(s, 'gonogo', 'allgood')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'gate')
    expect(s.finished).toBe(true)
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-DEMO', 'C-BUG', 'C-CONFIANZA', 'C-SORPRESA', 'C-SOBRECARGA']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('bloquear el release no es del rol: se registra como decisión aparte de firmar', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 15)
    s = choose(s, 'daily', 'honest')
    s = waitUntil(s, 210)
    s = choose(s, 'marta_pressure', 'block')
    expect(s.flags['sign.blocked']).toBe(true)
    expect(s.flags['signed.untested']).toBeFalsy()
  })

  it('el estado que se escribe en el ticket refleja lo que de verdad se ha probado', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = ticket(s, 'KOB-412', 'status')
    const visible = (st: RunState) =>
      mission.tickets
        .find((t) => t.id === 'KOB-412')!
        .comments.filter((c) => c.author === 'yo' && (!c.visibleWhen || evaluate(st, c.visibleWhen)))
    expect(visible(s)).toHaveLength(1)
    expect(visible(s)[0].body).toContain('Sin probar todavía')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})

function evaluate(s: RunState, c: Parameters<typeof evaluateCondition>[2]) {
  return evaluateCondition(mission, s, c)
}
