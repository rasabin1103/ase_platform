import { describe, expect, it } from 'vitest'
import type { Plan } from '../types/plan.types'
import { derivePlanNames, fillPlanNames, fillPlanNamesDeep } from './planNames'

const plan = (id: number, name: string, price: string | null, extra: Partial<Plan> = {}) =>
  ({ id, name, price, display_order: id, is_active: true, is_recommended: false, ...extra }) as unknown as Plan

const PLANS = [
  plan(3, 'Expert', '14.99'),
  plan(1, 'Associate', '0.00'),
  plan(2, 'Professional', '9.99', { is_recommended: true }),
  plan(5, 'Enterprise', null),
  plan(4, 'Architect', '19.99'),
]

describe('planNames', () => {
  it('ordena y clasifica los planes de la base de datos', () => {
    const n = derivePlanNames(PLANS, 'es')!
    expect(n.all).toEqual(['Associate', 'Professional', 'Expert', 'Architect', 'Enterprise'])
    expect(n.free).toBe('Associate')
    expect(n.top).toBe('Enterprise')
    expect(n.popular).toBe('Professional')
    expect(n.others).toEqual(['Professional', 'Expert', 'Architect', 'Enterprise'])
  })

  it('rellena los marcadores con los nombres reales', () => {
    const n = derivePlanNames(PLANS, 'es')
    expect(fillPlanNames('Empieza con {{plan:free}} y pasa a {{plan:others}}.', n, 'es')).toBe(
      'Empieza con Associate y pasa a Professional, Expert, Architect o Enterprise.',
    )
    expect(fillPlanNames('Plan {{plan:top}} · {{plan:3}}', n, 'es')).toBe('Plan Enterprise · Expert')
  })

  it('usa una expresión genérica mientras no hay planes', () => {
    expect(fillPlanNames('Empieza con {{plan:free}}', null, 'es')).toBe('Empieza con el plan gratuito')
    expect(fillPlanNames('Start with {{plan:free}}', null, 'en')).toBe('Start with the free plan')
  })

  it('rellena objetos de textos sin tocar funciones ni otros valores', () => {
    const fn = (x: number) => x
    const out = fillPlanNamesDeep({ a: ['{{plan:1}}'], b: { c: 'x {{plan:top}}' }, f: fn, n: 3 }, (t) =>
      fillPlanNames(t, derivePlanNames(PLANS, 'en'), 'en'),
    )
    expect(out).toEqual({ a: ['Associate'], b: { c: 'x Enterprise' }, f: fn, n: 3 })
  })
})
