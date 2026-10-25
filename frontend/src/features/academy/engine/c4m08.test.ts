import { describe, expect, it } from 'vitest'
import { m08Contratar as mission } from '../content/courses/gestion-equipos-qa/m08-contratar'
import { CANDIDATES, INITIAL_HIRING, REQUIREMENTS, chooseStep, decide, saveProfile, submitDecisions, toggleRequirement, type Decision, type HiringState, type Step } from '../apps/kobalto-hiring/hiringLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-hiring'] as HiringState | undefined) ?? INITIAL_HIRING
const send = (s: RunState, r: { state: HiringState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

const GOOD_REQ = REQUIREMENTS.filter((r) => r.good).map((r) => r.id)
const BEST = Object.fromEntries(CANDIDATES.map((c) => [c.id, c.best])) as Record<string, Decision>

function profile(s: RunState, reqs: string[], steps: Record<Step['id'], string>) {
  for (const r of reqs) s = send(s, toggleRequirement(app(s), r))
  for (const [k, v] of Object.entries(steps)) s = send(s, chooseStep(app(s), k as Step['id'], v))
  return send(s, saveProfile(app(s)))
}
function decideAll(s: RunState, d: Record<string, Decision>) {
  for (const [id, v] of Object.entries(d)) s = send(s, decide(app(s), id, v))
  return send(s, submitDecisions(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_manager' })
  s = profile(s, GOOD_REQ, { format: 'structured', process: 'fast' })
  s = waitUntil(s, 20)
  s = choose(s, 'andrea_marcos', 'same')
  s = waitUntil(s, 60)
  s = choose(s, 'sergio_coi', 'recuse')
  s = waitUntil(s, 180)
  s = choose(s, 'debate', 'evidence')
  s = decideAll(s, BEST)
  s = waitUntil(s, 300)
  s = choose(s, 'raul_marcos', 'data')
  s = waitUntil(s, 360)
  s = choose(s, 'andrea_offer', 'fast')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 8 · contratar (QA Manager)', () => {
  it('perfil, tarjeta, evidencias, «no» con datos y oferta rápida evitan todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['hiring.ok']).toBe(true)
      expect(s.flags['cto.handled']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('ceder ante el CTO deshace una buena decisión', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = profile(s, GOOD_REQ, { format: 'structured', process: 'fast' })
    s = decideAll(s, BEST)
    expect(s.flags['hiring.ok']).toBe(true)
    s = waitUntil(s, 300)
    s = choose(s, 'raul_marcos', 'cave')
    expect(s.flags['hiring.ok']).toBe(false)
  })

  it('sin entrevista estructurada no hay tarjeta a la que volver en el debate', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = profile(s, GOOD_REQ, { format: 'chat', process: 'fast' })
    s = waitUntil(s, 180)
    s = choose(s, 'debate', 'evidence')
    expect(s.flags['bias.checked']).toBeFalsy()
  })

  it('saltarse el proceso, decidir por impresiones y retrasar la oferta traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = profile(s, ['degree', 'years', 'tool', 'fit'], { format: 'chat', process: 'long' })
    s = waitUntil(s, 20)
    s = choose(s, 'andrea_marcos', 'skip')
    s = waitUntil(s, 60)
    s = choose(s, 'sergio_coi', 'fine')
    s = waitUntil(s, 180)
    s = choose(s, 'debate', 'agree')
    s = decideAll(s, { marcos: 'hire', ana: 'hire', javier: 'no', rocio: 'no', luis: 'hire' })
    s = waitUntil(s, 300)
    s = choose(s, 'raul_marcos', 'vague')
    s = waitUntil(s, 360)
    s = choose(s, 'andrea_offer', 'wait')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'gut')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-RUIDO', 'C-SESGO', 'C-ENCAJE', 'C-INTERES', 'C-CTO', 'C-LENTO']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
