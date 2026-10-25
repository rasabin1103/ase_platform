import { describe, expect, it } from 'vitest'
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
  totalCost,
  type OptionId,
  type VendorState,
} from './vendorLogic'

const GOOD_CRITERIA = CRITERIA.filter((c) => c.good).map((c) => c.id)
const ALL_COSTS = COST_ITEMS.map((c) => c.id)

function prepare(opts: { criteria?: string[]; costs?: string[]; option?: OptionId; pilot?: string; conditions?: string[] } = {}) {
  let s: VendorState = INITIAL_VENDOR
  for (const c of opts.criteria ?? GOOD_CRITERIA) s = toggleCriterion(s, c).state
  s = saveCriteria(s).state
  for (const c of ALL_COSTS) if ((opts.costs ?? ALL_COSTS).includes(c) !== s.costItems.includes(c)) s = toggleCost(s, c).state
  s = saveTco(s).state
  s = chooseOption(s, opts.option ?? 'buy').state
  s = choosePilot(s, opts.pilot ?? 'pilot').state
  for (const c of opts.conditions ?? ['exit', 'pilot_first', 'review']) s = toggleCondition(s, c).state
  return s
}

describe('app Evaluación (curso 4 · misión 5)', () => {
  it('con solo licencias, construir y open source parecen gratis; con el coste total, comprar es lo más barato', () => {
    expect(totalCost('build', ['licences'])).toBe(0)
    expect(totalCost('buy', ['licences'])).toBeGreaterThan(0)
    const totals = (['buy', 'build', 'oss'] as const).map((o) => totalCost(o, ALL_COSTS))
    expect(totals[0]).toBeLessThan(totals[1])
    expect(totals[0]).toBeLessThan(totals[2])
  })

  it('los criterios buenos, sin ninguno malo, dan criteria.ok', () => {
    let s: VendorState = INITIAL_VENDOR
    for (const c of GOOD_CRITERIA) s = toggleCriterion(s, c).state
    expect(saveCriteria(s).event.flags).toEqual(['criteria.set', 'criteria.ok'])
    expect(saveCriteria(toggleCriterion(s, 'demo').state).event.flags).toEqual(['criteria.set'])
    expect(saveCriteria(INITIAL_VENDOR).event.action).toBe('noop')
  })

  it('la comparativa solo con licencias es parcial; con todas las partidas, completa', () => {
    expect(saveTco(INITIAL_VENDOR).event.flags).toEqual(['tco.saved', 'tco.partial'])
    let s = INITIAL_VENDOR
    for (const c of ALL_COSTS.slice(1)) s = toggleCost(s, c).state
    const r = saveTco(s)
    expect(r.event.cost).toBe(15)
    expect(r.event.flags).toEqual(['tco.saved', 'tco.ok'])
  })

  it('no se puede recomendar sin criterios ni comparativa guardados', () => {
    const s = chooseOption(choosePilot(INITIAL_VENDOR, 'pilot').state, 'buy').state
    expect(sendRecommendation(s).event.action).toBe('noop')
  })

  it('la recomendación buena: comprar, piloto con criterios, salida y revisión', () => {
    const r = sendRecommendation(prepare())
    expect(r.event.cost).toBe(20)
    expect(r.event.flags).toEqual(['rec.sent', 'rec.buy', 'pilot.ok', 'exit.ok', 'rec.good'])
    expect(toggleCondition(r.state, 'lock3').event.action).toBe('noop')
  })

  it('el contrato cerrado a tres años rompe la salida y la recomendación', () => {
    const flags = sendRecommendation(prepare({ conditions: ['exit', 'pilot_first', 'review', 'lock3'] })).event.flags
    expect(flags).toContain('pilot.ok')
    expect(flags).not.toContain('exit.ok')
    expect(flags).not.toContain('rec.good')
  })

  it('construir no ata a un proveedor, pero no es la recomendación buena', () => {
    const flags = sendRecommendation(prepare({ option: 'build' })).event.flags
    expect(flags).toEqual(['rec.sent', 'rec.build', 'pilot.ok', 'exit.ok'])
  })

  it('sin coste total o con un piloto abierto, la recomendación no se sostiene', () => {
    expect(sendRecommendation(prepare({ costs: ['licences'] })).event.flags).not.toContain('rec.good')
    const flags = sendRecommendation(prepare({ pilot: 'open' })).event.flags
    expect(flags).not.toContain('pilot.ok')
    expect(flags).not.toContain('rec.good')
  })
})
