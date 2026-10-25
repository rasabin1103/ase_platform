import { describe, expect, it } from 'vitest'
import { m10Incidente as mission } from '../content/courses/gestion-equipos-qa/m10-incidente'
import { ACTIONS, CAUSES, INITIAL_PM, savePostmortem, toggleAction, toggleCause, type PostmortemState } from '../apps/kobalto-postmortem/postmortemLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-postmortem'] as PostmortemState | undefined) ?? INITIAL_PM
const send = (s: RunState, r: { state: PostmortemState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

const GOOD_C = CAUSES.filter((c) => c.good).map((c) => c.id)
const GOOD_A = ACTIONS.filter((a) => a.good).map((a) => a.id)
function postmortem(s: RunState, causes: string[], actions: string[]) {
  for (const c of causes) s = send(s, toggleCause(app(s), c))
  for (const a of actions) s = send(s, toggleAction(app(s), a))
  return send(s, savePostmortem(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_head' })
  s = waitUntil(s, 10)
  s = choose(s, 'carmen_facts', 'facts')
  s = waitUntil(s, 60)
  s = choose(s, 'crisis', 'own')
  s = waitUntil(s, 120)
  s = choose(s, 'pablo_worried', 'support')
  s = postmortem(s, GOOD_C, GOOD_A)
  s = waitUntil(s, 300)
  s = choose(s, 'postmortem', 'blameless')
  s = waitUntil(s, 390)
  s = choose(s, 'irene_change', 'org')
  s = waitUntil(s, 450)
  s = choose(s, 'carmen_report', 'correct')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 10 · el gran incidente (Head of QA)', () => {
  it('transparencia, sin culpables, proteger a Pablo y cambiar la organización evitan todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['org.change']).toBe(true)
      expect(s.flags['pablo.supported']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('si señalas a Pablo en el comité, ya no puedes decirle que nadie le va a señalar', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 60)
    s = choose(s, 'crisis', 'scapegoat')
    s = waitUntil(s, 120)
    s = choose(s, 'pablo_worried', 'support')
    expect(s.flags['pablo.supported']).toBeFalsy()
  })

  it('minimizar, culpar y reforzar la puerta traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 10)
    s = choose(s, 'carmen_facts', 'minimize')
    s = waitUntil(s, 60)
    s = choose(s, 'crisis', 'defend')
    s = waitUntil(s, 120)
    s = choose(s, 'pablo_worried', 'blame')
    s = postmortem(s, ['pablo', 'dev'], ['double_signoff', 'sanction'])
    s = waitUntil(s, 300)
    s = choose(s, 'postmortem', 'names')
    s = waitUntil(s, 390)
    s = choose(s, 'irene_change', 'more_qa')
    s = waitUntil(s, 450)
    s = choose(s, 'carmen_report', 'keep')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'control')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-REGULADOR', 'C-REPITE', 'C-CHIVO', 'C-CULPA', 'C-INFORME', 'C-GUERRA']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
