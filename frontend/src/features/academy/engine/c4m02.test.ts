import { describe, expect, it } from 'vitest'
import { m02Suite as mission } from '../content/courses/gestion-equipos-qa/m02-suite'
import { INITIAL_SUITE, TESTS, applyDecisions, decide, investigate, publishReport, type Decision, type SuiteState } from '../apps/kobalto-suite/suiteLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-suite'] as SuiteState | undefined) ?? INITIAL_SUITE
const send = (s: RunState, r: { state: SuiteState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)
const CORRECT = Object.fromEntries(TESTS.map((t) => [t.id, t.correct])) as Record<string, Decision>

function investigateAll(s: RunState) {
  for (const t of TESTS) s = send(s, investigate(app(s), t.id))
  return s
}
function applyAll(s: RunState, map: Record<string, Decision>) {
  for (const [id, d] of Object.entries(map)) s = send(s, decide(app(s), id, d))
  return send(s, applyDecisions(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_engineer' })
  s = waitUntil(s, 20)
  s = choose(s, 'diego_skip', 'quarantine')
  s = investigateAll(s)
  s = waitUntil(s, 100)
  s = choose(s, 'sergio_retries', 'no')
  s = send(s, publishReport(app(s)))
  s = waitUntil(s, 210)
  s = choose(s, 'planning', 'data')
  s = applyAll(s, CORRECT)
  s = waitUntil(s, 390)
  s = choose(s, 'ownership', 'owners')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 2 · la suite que nadie mira (QA Engineer)', () => {
  it('investigar, decidir según la causa y repartir la propiedad: sin consecuencias y veredicto bueno', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['race.caught']).toBe(true)
      expect(s.flags['pipeline.trusted']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('con reintentos generales el bug intermitente llega a producción aunque se reporte', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = investigateAll(s)
    s = waitUntil(s, 100)
    s = choose(s, 'sergio_retries', 'yes')
    s = applyAll(s, CORRECT)
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'green')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-CARRERA', 'C-ROJO']))
  })

  it('aceptar los skip, reescribirlo todo, quedarse con los tests y silenciar el bug traen todas las consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 20)
    s = choose(s, 'diego_skip', 'fine')
    s = investigateAll(s)
    s = waitUntil(s, 210)
    s = choose(s, 'planning', 'rewrite')
    s = applyAll(s, { ...CORRECT, T2: 'quarantine', T7: 'delete' })
    s = waitUntil(s, 390)
    s = choose(s, 'ownership', 'mine')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'green')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-CARRERA', 'C-ROJO', 'C-SKIP', 'C-INVISIBLE', 'C-DUENOS']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('la petición de tiempo con datos exige haber investigado al menos seis tests', () => {
    const data = mission.scenes.find((x) => x.id === 'planning')!.choices!.find((c) => c.id === 'data')!
    expect(data.requires).toEqual({ kind: 'flag', key: 'suite.analyzed' })
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
