import { describe, expect, it } from 'vitest'
import { m05Comprar as mission } from '../content/courses/gestion-equipos-qa/m05-comprar'
import {
  COST_ITEMS,
  CRITERIA,
  INITIAL_VENDOR,
  chooseOption,
  choosePilot,
  saveCriteria,
  saveTco,
  sendRecommendation,
  toggleCondition,
  toggleCost,
  toggleCriterion,
  type CostItem,
  type OptionId,
  type VendorState,
} from '../apps/kobalto-vendor/vendorLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-vendor'] as VendorState | undefined) ?? INITIAL_VENDOR
const send = (s: RunState, r: { state: VendorState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

const GOOD_CRITERIA = CRITERIA.filter((c) => c.good).map((c) => c.id)
const ALL_COSTS = COST_ITEMS.map((c) => c.id)

function criteria(s: RunState, ids: string[]) {
  for (const id of ids) s = send(s, toggleCriterion(app(s), id))
  return send(s, saveCriteria(app(s)))
}
function costs(s: RunState, items: CostItem[]) {
  for (const c of ALL_COSTS) if (items.includes(c) !== app(s).costItems.includes(c)) s = send(s, toggleCost(app(s), c))
  return send(s, saveTco(app(s)))
}
function recommend(s: RunState, option: OptionId, pilot: string, conditions: string[]) {
  s = send(s, chooseOption(app(s), option))
  s = send(s, choosePilot(app(s), pilot))
  for (const c of conditions) s = send(s, toggleCondition(app(s), c))
  return send(s, sendRecommendation(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'eval_guide' })
  s = criteria(s, GOOD_CRITERIA)
  s = waitUntil(s, 20)
  s = choose(s, 'vendor_call', 'pilot')
  s = waitUntil(s, 90)
  s = choose(s, 'ivan_build', 'fair')
  s = costs(s, ALL_COSTS)
  s = waitUntil(s, 240)
  s = choose(s, 'carmen_data', 'anon')
  s = recommend(s, 'buy', 'pilot', ['exit', 'pilot_first', 'review'])
  s = waitUntil(s, 420)
  s = choose(s, 'committee', 'present')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 5 · construir o comprar (QA Architect)', () => {
  it('criterios, coste total, piloto, salida y datos protegidos evitan todas las consecuencias', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['rec.good']).toBe(true)
      expect(s.flags['committee.ok']).toBe(true)
      expect(s.messages.some((m) => m.sceneId === 'rec_good')).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('una comparativa solo de licencias recibe el aviso de Laura y se puede rehacer', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = costs(s, ['licences'])
    s = waitUntil(s, s.clock + 5)
    expect(s.messages.some((m) => m.sceneId === 'tco_partial')).toBe(true)
    s = costs(s, ALL_COSTS)
    expect(s.flags['tco.ok']).toBe(true)
  })

  it('presentar al comité una recomendación que no se sostiene no convence', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = criteria(s, [...GOOD_CRITERIA, 'demo'])
    s = costs(s, ['licences'])
    s = recommend(s, 'build', 'pilot', ['exit', 'pilot_first', 'review'])
    s = waitUntil(s, 420)
    s = choose(s, 'committee', 'present')
    expect(s.flags['committee.ok']).toBeFalsy()
  })

  it('firmar con prisa, ignorar a Plataforma y a Riesgos y mirar solo licencias traen las seis consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 20)
    s = choose(s, 'vendor_call', 'sign')
    s = criteria(s, ['demo', 'discount', 'tco'])
    s = waitUntil(s, 90)
    s = choose(s, 'ivan_build', 'no')
    s = costs(s, ['licences'])
    s = waitUntil(s, 240)
    s = choose(s, 'carmen_data', 'test')
    s = recommend(s, 'buy', 'demo', ['lock3'])
    s = waitUntil(s, 420)
    s = choose(s, 'committee', 'licences')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'cheapest')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-SORPRESA', 'C-ATADOS', 'C-DATOS', 'C-DEMO', 'C-SOMBRA', 'C-COMITE']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
