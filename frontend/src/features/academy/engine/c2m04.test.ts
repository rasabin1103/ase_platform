import { describe, expect, it } from 'vitest'
import { m04Exploratoria as mission } from '../content/courses/qa-profesional/m04-exploratoria'
import {
  FOCUS_OPTIONS,
  INITIAL_EXPLORE,
  attack,
  closeSession,
  improveChecklist,
  runChecklist,
  startSession,
  type AreaId,
  type AttackId,
  type ExploreState,
} from '../apps/kobalto-explore/exploreLogic'
import { replay, step, summarize } from './engine'
import type { AppEvent, BugReportInput, RunState, Severity } from './types'

const app = (s: RunState) => (s.appState['kobalto-explore'] as ExploreState | undefined) ?? INITIAL_EXPLORE
const send = (s: RunState, r: { state: ExploreState; event: AppEvent }) => step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
const hit = (s: RunState, area: AreaId, atk: AttackId) => send(s, attack(app(s), area, atk, s.clock))
const msgId = (s: RunState, sceneId: string) => s.messages.find((m) => m.sceneId === sceneId)!.id

function report(s: RunState, bugId: string, title: string, severity: Severity): RunState {
  const ev = s.log.filter((l) => l.bugs.includes(bugId)).at(-1)!.id
  const r: BugReportInput = { title, steps: '1. Abrir el panel de Tarjetas de equipo\n2. Aplicar el ataque', expected: 'Comportamiento correcto', actual: 'Lo descrito en la nota', severity, evidence: [ev] }
  return step(mission, s, { type: 'report', report: r })
}

describe('curso 2 · misión 4 · intuición experta', () => {
  it('la checklist del equipo sale verde y no encuentra nada', () => {
    const r = runChecklist(INITIAL_EXPLORE, 0)
    expect(r.event.bugs).toEqual([])
  })

  it('fuera del charter los ataques cuestan más y se marcan', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    const before = s.clock
    s = hit(s, 'alta', 'double')
    expect(s.clock - before).toBe(15)
    expect(s.flags['explore.nocharter']).toBe(true)
  })

  it('el recorrido óptimo encuentra los 6 bugs, frena la salida y mejora la checklist', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    s = step(mission, s, { type: 'wait', minutes: 10 })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'approach'), choiceId: 'sessions' })
    s = send(s, startSession(app(s), { areas: ['congelar', 'invitar'], focus: FOCUS_OPTIONS[0], timebox: 60 }))
    expect(s.flags['charter.risk']).toBe(true)
    s = hit(s, 'congelar', 'session')
    s = hit(s, 'congelar', 'double')
    s = hit(s, 'invitar', 'duplicate')
    s = hit(s, 'invitar', 'empty')
    s = send(s, closeSession(app(s)))
    s = report(s, 'X-SESION', 'Congelar con la sesión caducada muestra éxito pero no congela', 'critical')
    s = report(s, 'X-INVITA', 'Invitar dos veces el mismo email crea dos empleados', 'medium')
    s = send(s, startSession(app(s), { areas: ['exportar', 'limites'], focus: FOCUS_OPTIONS[1], timebox: 60 }))
    s = hit(s, 'exportar', 'special')
    s = hit(s, 'limites', 'bounds')
    s = send(s, closeSession(app(s)))
    s = report(s, 'X-CSV', 'El CSV se descoloca con un punto y coma en el concepto', 'medium')
    s = report(s, 'X-NEG', 'Se acepta un límite negativo y la tarjeta queda sin límite', 'high')
    expect(s.clock).toBeLessThan(240)
    s = step(mission, s, { type: 'wait', minutes: 240 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'gonogo'), choiceId: 'nogo' })
    s = send(s, startSession(app(s), { areas: ['alta'], focus: FOCUS_OPTIONS[1], timebox: 30 }))
    s = hit(s, 'alta', 'double')
    s = hit(s, 'alta', 'special')
    s = send(s, closeSession(app(s)))
    s = report(s, 'X-DOBLE', 'Doble clic en Crear tarjeta crea dos tarjetas', 'high')
    s = report(s, 'X-TILDE', 'Nombres con ñ salen corruptos en la tarjeta virtual', 'medium')
    s = send(s, runChecklist(app(s), s.clock))
    s = send(s, improveChecklist(app(s), ['session', 'double', 'special', 'duplicate']))
    expect(s.flags['checklist.improved']).toBe(true)
    s = step(mission, s, { type: 'wait', minutes: 480 - s.clock })
    s = step(mission, s, { type: 'choose', messageId: msgId(s, 'closing'), choiceId: 'lesson' })
    const sum = summarize(mission, s)
    expect(sum.found).toBe(6)
    expect(sum.verdict.tone).toBe('good')
  })
})
