import { describe, expect, it } from 'vitest'
import { m04Estandar as mission } from '../content/courses/gestion-equipos-qa/m04-estandar'
import { COMMENTS, INITIAL_RFC, choose as pickOption, publishAdr, respond, sendRfc, type RfcState, type Section } from '../apps/kobalto-rfc/rfcLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-rfc'] as RfcState | undefined) ?? INITIAL_RFC
const send = (s: RunState, r: { state: RfcState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

function writeRfc(s: RunState, choices: Record<Section['id'], string>) {
  for (const [k, v] of Object.entries(choices)) s = send(s, pickOption(app(s), k as Section['id'], v))
  return send(s, sendRfc(app(s)))
}
function answer(s: RunState, responses: Record<string, string>) {
  for (const c of COMMENTS) s = send(s, respond(app(s), c.id, responses[c.id]))
  return send(s, publishAdr(app(s)))
}
const GOOD_RFC = { scope: 'minimum', choice: 'criteria', migration: 'incremental', governance: 'adr_guild' } as const
const ADAPT = { c_pagos: 'adapt', c_notif: 'adapt', c_ui: 'adapt' }

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_architect' })
  s = waitUntil(s, 30)
  s = choose(s, 'raul_meeting', 'rfc')
  s = writeRfc(s, GOOD_RFC)
  s = waitUntil(s, 90)
  s = choose(s, 'hector_worried', 'listen')
  s = answer(s, ADAPT)
  s = waitUntil(s, 330)
  s = choose(s, 'guild', 'together')
  s = waitUntil(s, 450)
  s = choose(s, 'raul_expect', 'realistic')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 4 · el estándar (QA Architect)', () => {
  it('influir con un RFC bien planteado evita todas las consecuencias y da el mejor veredicto', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['adoption.ok']).toBe(true)
      expect(s.flags['guild.ok']).toBe(true)
      expect(s.messages.some((m) => m.sceneId === 'adr_ok')).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('sin ADR publicado no se puede presentar en la guild como decisión compartida, ni dar fechas sin plan de migración', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 330)
    const before = s.flags['guild.ok']
    s = choose(s, 'guild', 'together')
    expect(s.flags['guild.ok']).toBe(before)
    s = waitUntil(s, 450)
    s = choose(s, 'raul_expect', 'realistic')
    expect(s.flags['expectations.ok']).toBeFalsy()
  })

  it('imponer, escudarse, migrar de golpe y prometer un mes traen las cinco consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'raul_meeting', 'impose')
    s = writeRfc(s, { scope: 'one_tool', choice: 'mine', migration: 'big_bang', governance: 'me' })
    expect(s.messages.some((m) => m.sceneId === 'rfc_imposed')).toBe(true)
    s = waitUntil(s, 90)
    s = choose(s, 'hector_worried', 'yes')
    s = answer(s, { c_pagos: 'rule', c_notif: 'rule', c_ui: 'ignore' })
    s = waitUntil(s, 330)
    s = choose(s, 'guild', 'mandate')
    s = waitUntil(s, 450)
    s = choose(s, 'raul_expect', 'month')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'authority')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-PAPEL', 'C-PAGOS', 'C-CUELLO', 'C-PROMESA', 'C-UI']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
