import { describe, expect, it } from 'vitest'
import { INITIAL_STRATEGY, METRICS, chooseSection, saveStrategy, toggleMetric, type Section, type StrategyState } from './strategyLogic'

const GOOD_M = METRICS.filter((m) => m.good).map((m) => m.id)
const GOOD = { model: 'hybrid', invest: 'phased', roadmap: 'pilot', people: 'transition' } as const
function strategy(metrics: string[], choices: Record<Section['id'], string>) {
  let s: StrategyState = INITIAL_STRATEGY
  for (const m of metrics) s = toggleMetric(s, m).state
  for (const [k, v] of Object.entries(choices)) s = chooseSection(s, k as Section['id'], v).state
  return s
}

describe('app Estrategia (curso 4 · misión 11)', () => {
  it('métricas de negocio y las cuatro secciones bien planteadas', () => {
    const r = saveStrategy(strategy(GOOD_M, GOOD))
    expect(r.event.cost).toBe(30)
    expect(r.event.flags).toEqual(['strat.saved', 'strat.metrics', 'strat.model', 'strat.invest', 'strat.roadmap', 'strat.people', 'strat.ok'])
  })

  it('como mucho cuatro métricas', () => {
    const s = strategy(GOOD_M, GOOD)
    expect(toggleMetric(s, 'coverage').event.action).toBe('noop')
  })

  it('una métrica interna o el modelo centralizado rompen la estrategia', () => {
    const f1 = saveStrategy(strategy(['copq', 'incidents', 'lead_time', 'coverage'], GOOD)).event.flags
    expect(f1).not.toContain('strat.metrics')
    expect(f1).not.toContain('strat.ok')
    const f2 = saveStrategy(strategy(GOOD_M, { ...GOOD, model: 'central' })).event.flags
    expect(f2).toContain('strat.metrics')
    expect(f2).not.toContain('strat.model')
    expect(f2).not.toContain('strat.ok')
  })

  it('no se guarda incompleta ni se cambia después', () => {
    expect(saveStrategy(strategy(GOOD_M, { model: 'hybrid' } as Record<Section['id'], string>)).event.action).toBe('noop')
    const s = saveStrategy(strategy(GOOD_M, GOOD)).state
    expect(chooseSection(s, 'model', 'central').event.action).toBe('noop')
  })
})
