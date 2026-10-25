import { describe, expect, it } from 'vitest'
import { m01CuelloBotella as mission } from '../content/courses/gestion-equipos-qa/m01-cuello-botella'
import { INITIAL_SPRINT, analyzeFlow, propose, testPlan, toggleAgreement, togglePlan, type SprintState } from '../apps/kobalto-sprint/sprintLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-sprint'] as SprintState | undefined) ?? INITIAL_SPRINT
const send = (s: RunState, r: { state: SprintState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const choose = (s: RunState, sceneId: string, choiceId: string) => {
  const id = s.messages.find((m) => m.sceneId === sceneId)?.id
  expect(id, `la escena ${sceneId} no ha llegado (reloj ${s.clock})`).toBeDefined()
  return step(mission, s, { type: 'choose', messageId: id!, choiceId })
}
const waitUntil = (s: RunState, minute: number) => (s.clock < minute ? step(mission, s, { type: 'wait', minutes: minute - s.clock }) : s)

function plan(s: RunState, ids: string[]) {
  for (const id of ids) s = send(s, togglePlan(app(s), id))
  return send(s, testPlan(app(s)))
}
function agreements(s: RunState, ids: string[]) {
  for (const id of ids) s = send(s, toggleAgreement(app(s), id))
  return send(s, propose(app(s)))
}

function goodDay(seed: number): RunState {
  let s = replay(mission, seed, [{ type: 'start' }])
  s = step(mission, s, { type: 'readDoc', docId: 'ficha_rol' })
  s = waitUntil(s, 15)
  s = choose(s, 'daily', 'team')
  s = send(s, analyzeFlow(app(s)))
  s = waitUntil(s, 90)
  s = choose(s, 'marta_color', 'risk')
  s = plan(s, ['KOB-431', 'KOB-433', 'KOB-435'])
  s = waitUntil(s, 240)
  s = choose(s, 'raul_hallway', 'data')
  s = agreements(s, ['ac_first', 'wip', 'small'])
  s = waitUntil(s, 420)
  s = choose(s, 'retro', 'data_proposal')
  s = waitUntil(s, 480)
  return choose(s, 'closing', 'lesson')
}

describe('curso 4 · misión 1 · el cuello de botella (QA manual)', () => {
  it('datos, cola por riesgo y acuerdos que atacan la causa: sin consecuencias y veredicto bueno', () => {
    for (const seed of [1, 2, 3]) {
      const s = goodDay(seed)
      expect(s.finished).toBe(true)
      expect(s.flags['retro.agreed']).toBe(true)
      expect(s.activeBugs).toEqual([])
      expect(summarize(mission, s).verdict.tone).toBe('good')
    }
  })

  it('las respuestas con datos solo aparecen si se analizó el flujo', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 240)
    const scene = mission.scenes.find((x) => x.id === 'raul_hallway')!
    const data = scene.choices!.find((c) => c.id === 'data')!
    expect(data.requires).toEqual({ kind: 'flag', key: 'flow.analyzed' })
    expect(s.flags['flow.analyzed']).toBeFalsy()
  })

  it('horas extra, lo vistoso primero, pedir otro QA y defenderse traen todas las consecuencias', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = waitUntil(s, 15)
    s = choose(s, 'daily', 'overtime')
    s = waitUntil(s, 90)
    s = choose(s, 'marta_color', 'yes')
    s = plan(s, ['KOB-438', 'KOB-436', 'KOB-434'])
    s = waitUntil(s, 240)
    s = choose(s, 'raul_hallway', 'hire')
    s = agreements(s, ['hire', 'extend', 'weekend'])
    s = waitUntil(s, 420)
    s = choose(s, 'retro', 'defend')
    s = waitUntil(s, 480)
    s = choose(s, 'closing', 'more')
    expect(s.activeBugs).toEqual(expect.arrayContaining(['C-LIMITE', 'C-NORMATIVA', 'C-COLA', 'C-CULPA', 'C-RITMO', 'C-RELACION']))
    expect(summarize(mission, s).verdict.tone).toBe('bad')
  })

  it('con datos pero acuerdos que no atacan la causa, la cola vuelve', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = send(s, analyzeFlow(app(s)))
    s = agreements(s, ['ac_first', 'wip', 'hire'])
    s = waitUntil(s, 420)
    s = choose(s, 'retro', 'data_proposal')
    expect(s.flags['feedback.ok']).toBe(true)
    expect(s.flags['retro.agreed']).toBeFalsy()
  })

  it('cada concepto de las preguntas y lecciones existe en la misión', () => {
    const ids = new Set(mission.concepts.map((c) => c.id))
    for (const q of [...mission.quiz!.pre, ...mission.quiz!.post]) expect(ids.has(q.conceptId!), q.id).toBe(true)
    for (const l of mission.lessons!) expect(ids.has(l.conceptId!), l.id).toBe(true)
    for (const id of mission.debriefConcepts) expect(ids.has(id), id).toBe(true)
  })
})
