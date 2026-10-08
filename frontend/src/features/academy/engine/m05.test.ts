import { describe, expect, it } from 'vitest'
import { m05Release as mission } from '../content/courses/testing-fundamentals/m05-release'
import { INITIAL_RELEASE, runCase } from '../apps/kobalto-release/releaseLogic'
import { createRun, evaluate, replay, step } from './engine'
import type { RunState } from './types'

function seedWith(bug: string): number {
  let seed = 1
  while (!createRun(mission, seed).activeBugs.includes(bug)) seed++
  return seed
}

function run(s: RunState, id: string): RunState {
  const r = runCase((s.appState['kobalto-release'] as typeof INITIAL_RELEASE) ?? INITIAL_RELEASE, id, s.build, {
    active: s.activeBugs,
    fixed: s.fixedBugs,
    regressions: s.activeRegressions,
  })
  return step(mission, s, { type: 'app', event: { ...r.event, state: r.state } })
}

const critical = { kind: 'bugTriggered', severity: 'critical' } as const
const verified = { kind: 'bugVerified', severity: 'critical' } as const

describe('misión 5 · viernes de release', () => {
  it('cada partida activa 5 bugs, siempre con un crítico en acceso y sesión', () => {
    for (const seed of [1, 2, 3, 4]) {
      const s = createRun(mission, seed)
      expect(s.activeBugs).toHaveLength(5)
      expect(s.activeBugs.some((b) => b === 'R2' || b === 'R2b')).toBe(true)
    }
  })

  it('cada caso consume sus minutos', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    const before = s.clock
    s = run(s, 'TC-11')
    expect(s.clock - before).toBe(25)
  })

  it('encontrar, reportar y verificar el crítico habilita el GO seguro', () => {
    const seed = seedWith('R2')
    let s = replay(mission, seed, [{ type: 'start' }])
    s = run(s, 'TC-02')
    expect(evaluate(mission, s, critical)).toBe(true)
    s = step(mission, s, {
      type: 'report',
      report: {
        title: 'En Android 15 el login con huella falla tras la librería 7',
        steps: '1. Abrir la app en Pixel 8 (Android 15)\n2. Entrar con la huella',
        expected: 'Accede a la posición global (TC-02)',
        actual: 'Error de autenticación (-1) y pide contraseña',
        severity: 'critical',
        priority: 'p1',
        evidence: [s.log.at(-1)!.id],
      },
    })
    const r = s.reports.at(-1)!
    expect(r.status).toBe('accepted')
    expect(evaluate(mission, s, verified)).toBe(false)
    s = step(mission, s, { type: 'wait', minutes: 95 })
    expect(s.reports.at(-1)!.status).toBe('resolved')
    s = run(s, 'TC-02')
    expect(s.log.at(-1)!.status).toBe('ok')
    s = step(mission, s, { type: 'verifyReport', key: r.key, verdict: 'close', evidence: [s.log.at(-1)!.id] })
    expect(s.reports.at(-1)!.status).toBe('verified')
    expect(evaluate(mission, s, verified)).toBe(true)
  })
})
