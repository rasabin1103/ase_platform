import { describe, expect, it } from 'vitest'
import { m07Conversacion as mission } from '../content/courses/gestion-equipos-qa/m07-conversacion'
import { INITIAL_PREP, chooseStep, savePrep, toggleExample, type PrepState, type Step } from '../apps/kobalto-oneonone/oneOnOneLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-oneonone'] as PrepState | undefined) ?? INITIAL_PREP
const send = (s: RunState, r: { state: PrepState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

function prepare(s: RunState, examples: string[], script: Record<Step['id'], string>) {
  for (const e of examples) s = send(s, toggleExample(app(s), e))
  for (const [k, v] of Object.entries(script)) s = send(s, chooseStep(app(s), k as Step['id'], v))
  return send(s, savePrep(app(s)))
}
const FACTS = ['sprint', 'plan', 'daily']
const GOOD = { opening: 'sbi', explore: 'ask', plan: 'smart', record: 'shared' } as const

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_lead' })
  s = waitUntil(s, 30)
  s = choose(s, 'nerea_complaint', 'private')
  s = prepare(s, FACTS, GOOD)
  s = waitUntil(s, 90)
  s = choose(s, 'hector_rumor', 'confidential')
  s = waitUntil(s, 180)
  s = choose(s, 'talk', 'prepared')
  s = choose(s, 'talk_cause', 'plan')
  s = waitUntil(s, 300)
  s = choose(s, 'andrea_pip', 'plan_first')
  s = waitUntil(s, 360)
  s = choose(s, 'mediation', 'agreement')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 7 · la conversación difícil (QA Lead)', () => {
  it('preparar, buscar la causa, documentar, mediar y callar evitan todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['documented']).toBe(true)
      expect(s.flags['confidential.ok']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('empezar con un juicio vago se recupera volviendo a los hechos preparados', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = prepare(s, FACTS, { ...GOOD, opening: 'soft' })
    expect(s.flags['prep.ready']).toBeFalsy()
    s = waitUntil(s, 180)
    s = choose(s, 'talk', 'improvise')
    s = choose(s, 'talk_defensive', 'reframe')
    expect(s.flags['feedback.ok']).toBe(true)
    s = choose(s, 'talk_cause', 'plan')
    expect(s.flags['cause.found']).toBe(true)
  })

  it('contárselo a Nerea rompe la confidencialidad aunque luego respondas bien a Héctor', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'nerea_complaint', 'agree')
    s = waitUntil(s, 90)
    s = choose(s, 'hector_rumor', 'confidential')
    expect(s.flags['confidential.ok']).toBeFalsy()
  })

  it('sin preparar, amenazar y pedir el plan formal traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'nerea_complaint', 'agree')
    s = waitUntil(s, 90)
    s = choose(s, 'hector_rumor', 'share')
    s = waitUntil(s, 180)
    s = choose(s, 'talk', 'threat')
    expect(s.messages.some((m) => m.sceneId === 'talk_cause')).toBe(false)
    s = waitUntil(s, 300)
    s = choose(s, 'andrea_pip', 'pip_now')
    s = waitUntil(s, 360)
    s = choose(s, 'mediation', 'judge')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'avoid')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-INJUSTO', 'C-CAUSA', 'C-VAGO', 'C-RUMOR', 'C-CONFLICTO', 'C-PAPEL']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
