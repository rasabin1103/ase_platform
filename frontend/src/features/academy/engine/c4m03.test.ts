import { describe, expect, it } from 'vitest'
import { m03Junior as mission } from '../content/courses/gestion-equipos-qa/m03-junior'
import { INITIAL_PR, setComment, submitReview, type CommentKind, type PrState } from '../apps/kobalto-pr/prLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-pr'] as PrState | undefined) ?? INITIAL_PR
const send = (s: RunState, r: { state: PrState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

function review(s: RunState, map: Record<string, CommentKind>) {
  for (const [h, k] of Object.entries(map)) s = send(s, setComment(app(s), h, k))
  return send(s, submitReview(app(s)))
}
const GOOD: Record<string, CommentKind> = { h1: 'helpful', h2: 'helpful', h3: 'helpful', h4: 'nit', h5: 'none', h6: 'praise' }

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_engineer' })
  s = waitUntil(s, 30)
  s = choose(s, 'welcome', 'plan')
  s = waitUntil(s, 120)
  s = review(s, GOOD)
  s = waitUntil(s, 275)
  s = choose(s, 'lucia_mistake', 'blameless')
  s = waitUntil(s, 360)
  s = choose(s, 'postmortem', 'system')
  s = waitUntil(s, 420)
  s = choose(s, 'laura_asks', 'facts')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 3 · el junior (QA Engineer)', () => {
  it('mentorizar bien evita todas las consecuencias y da el mejor veredicto', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['trust.lucia']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('cargar con la culpa por Lucía impide corregir el sistema en el postmortem', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 275)
    s = choose(s, 'lucia_mistake', 'cover')
    s = waitUntil(s, 360)
    const ids = mission.scenes.find((x) => x.id === 'postmortem')!.choices!.map((c) => c.id)
    expect(ids).toContain('system')
    s = choose(s, 'postmortem', 'mine')
    expect(s.flags['guardrail.ok']).toBeFalsy()
  })

  it('revisión seca, culpar, juzgar y no darle plan traen las consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'welcome', 'wiki')
    s = waitUntil(s, 120)
    s = review(s, { h1: 'none', h2: 'harsh', h3: 'rewrite', h4: 'helpful', h5: 'harsh', h6: 'none' })
    s = waitUntil(s, 275)
    s = choose(s, 'lucia_mistake', 'blame')
    s = waitUntil(s, 360)
    s = choose(s, 'postmortem', 'person')
    s = waitUntil(s, 420)
    s = choose(s, 'laura_asks', 'judge')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'faster')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-EXTRACTO', 'C-REPITE', 'C-ESCONDE', 'C-LENTA', 'C-A-CIEGAS']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
