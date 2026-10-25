import { describe, expect, it } from 'vitest'
import { m11Estrategia as mission } from '../content/courses/gestion-equipos-qa/m11-estrategia'
import { INITIAL_STRATEGY, METRICS, chooseSection, saveStrategy, toggleMetric, type Section, type StrategyState } from '../apps/kobalto-strategy/strategyLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-strategy'] as StrategyState | undefined) ?? INITIAL_STRATEGY
const send = (s: RunState, r: { state: StrategyState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

const GOOD_M = METRICS.filter((m) => m.good).map((m) => m.id)
const GOOD = { model: 'hybrid', invest: 'phased', roadmap: 'pilot', people: 'transition' } as const
function strategy(s: RunState, metrics: string[], choices: Record<Section['id'], string>) {
  for (const m of metrics) s = send(s, toggleMetric(app(s), m))
  for (const [k, v] of Object.entries(choices)) s = send(s, chooseSection(app(s), k as Section['id'], v))
  return send(s, saveStrategy(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_head' })
  s = waitUntil(s, 30)
  s = choose(s, 'managers', 'involve')
  s = waitUntil(s, 120)
  s = choose(s, 'raul_skeptic', 'data')
  s = strategy(s, GOOD_M, GOOD)
  s = waitUntil(s, 420)
  s = choose(s, 'rehearsal', 'story')
  s = waitUntil(s, 450)
  s = choose(s, 'irene_inaction', 'cost')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 11 · la estrategia (Head of QA)', () => {
  it('métricas de negocio, modelo híbrido, aliados y una petición clara evitan todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['committee.ok']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('el coste de no actuar no basta sin una buena presentación', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 420)
    s = choose(s, 'rehearsal', 'tech')
    s = waitUntil(s, 450)
    s = choose(s, 'irene_inaction', 'cost')
    expect(s.flags['committee.ok']).toBeFalsy()
  })

  it('imponer, ceder ante el CTO y hablar de cobertura traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 30)
    s = choose(s, 'managers', 'impose')
    s = waitUntil(s, 120)
    s = choose(s, 'raul_skeptic', 'yield')
    s = strategy(s, ['tests', 'coverage', 'bugs_found', 'ratio'], { model: 'central', invest: 'big', roadmap: 'big_bang', people: 'replace' })
    s = waitUntil(s, 420)
    s = choose(s, 'rehearsal', 'all')
    s = waitUntil(s, 450)
    s = choose(s, 'irene_inaction', 'fear')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'power')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-METRICAS', 'C-MODELO', 'C-PERSONAS', 'C-MANAGERS', 'C-CTO', 'C-COMITE']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
