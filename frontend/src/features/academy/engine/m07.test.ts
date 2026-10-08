import { describe, expect, it } from 'vitest'
import { m07Incidente as mission } from '../content/courses/testing-fundamentals/m07-incidente'
import { INITIAL_INCIDENT, disableFlag, reproduce, type IncidentState } from '../apps/kobalto-incident/incidentLogic'
import { createRun, evaluate, replay, step } from './engine'
import type { RunState } from './types'

const app = (s: RunState) => (s.appState['kobalto-incident'] as IncidentState | undefined) ?? INITIAL_INCIDENT

describe('misión 7 · incidente en producción', () => {
  it('cada partida tiene una causa', () => {
    const s = createRun(mission, 4)
    expect(s.activeBugs).toHaveLength(1)
  })

  it('mitigar rápido, reproducir y reportar habilita el postmortem sin culpables', () => {
    let seed = 1
    while (!createRun(mission, seed).activeBugs.includes('I1')) seed++
    let s = replay(mission, seed, [{ type: 'start' }])
    const m = disableFlag(app(s), 'instant_fees_v2', s.clock, s.activeBugs)
    s = step(mission, s, { type: 'app', event: { ...m.event, state: m.state } })
    expect(s.flags['mitigated.fast']).toBe(true)
    const r = reproduce(app(s), { endpoint: 'instant', os: 'android', version: '5.1.0', amount: 'high', account: 'new' }, s.activeBugs)
    s = step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
    const base = {
      steps: '1. Instantánea de 1.250 € desde la app 5.1\n2. Enviar',
      expected: 'Se envía con 0,25 € de comisión',
      actual: 'Error 500 NumberFormatException',
      severity: 'critical' as const,
      priority: 'p1' as const,
      evidence: [s.log.at(-1)!.id],
    }
    s = step(mission, s, { type: 'report', report: { ...base, title: 'Las instantáneas de importe alto fallan con error 500' } })
    expect(s.reports.at(-1)!.status).toBe('needs_info')
    s = step(mission, s, { type: 'amendReport', key: s.reports.at(-1)!.key, report: { ...base, title: 'En Android, las instantáneas de más de 1.000 € fallan con error 500' } })
    expect(s.reports.at(-1)!.status).toBe('accepted')
    expect(evaluate(mission, s, { kind: 'any', of: [{ kind: 'bugReported', bugId: 'I1' }, { kind: 'bugReported', bugId: 'I1b' }] })).toBe(true)
  })
})
