import { describe, expect, it } from 'vitest'
import { m02SimuladorPrestamos as mission } from '../content/courses/testing-fundamentals/m02-simulador-prestamos'
import { m02Design as design } from '../content/courses/testing-fundamentals/m02-design'
import { simulate } from '../apps/kobalto-loans/loanLogic'
import { createRun, evaluate, replay, step, summarize } from './engine'
import type { Action } from './types'

const ALL_A = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']
const add = (area: string, input: string, expectAccept: boolean): Action => ({ type: 'designAdd', area, input, expectAccept })

describe('misión 2 · simulador de préstamos', () => {
  it('cada partida activa 7 bugs (una variante por hueco)', () => {
    const s = createRun(mission, 3)
    expect(s.activeBugs).toHaveLength(7)
    expect(s.activeBugs).toEqual(expect.arrayContaining(['L6', 'L7']))
    expect(summarize(mission, s).total).toBe(7)
  })

  it('el diseño sabe qué bug revela cada caso', () => {
    expect(design.reveals?.('age', '17', ALL_A)).toBe('L1')
    expect(design.reveals?.('age', '70', ['L1b'])).toBe('L1b')
    expect(design.reveals?.('tier', '10000', ALL_A)).toBe('L4')
    expect(design.reveals?.('ratio', '1250', ALL_A)).toBe('L5')
    expect(design.reveals?.('age_term', '70;84', ALL_A)).toBe('L6')
    expect(design.reveals?.('rounding', '6000;48', ['L7'])).toBe('L7')
    expect(design.expected('age_term', '68;84')).toBe(true)
    expect(design.expected('age_term', '70;84')).toBe(false)
    expect(design.expected('ratio', '1310')).toBe(true)
    expect(design.classify('amount', '6050')).toEqual(['valid', 'not_multiple'])
  })

  it('la condición de cobertura habilita la respuesta a Riesgos', () => {
    const cases: Action[] = [
      add('age', '17', false), add('age', '18', true), add('age', '35', true), add('age', '70', true), add('age', '71', false),
      add('amount', '999', false), add('amount', '1000', true), add('amount', '6000', true), add('amount', '30000', true), add('amount', '30100', false), add('amount', '6050', false),
      add('term', '11', false), add('term', '12', true), add('term', '48', true), add('term', '84', true), add('term', '85', false),
      add('income', '999', false), add('income', '1000', true), add('income', '2500', true),
      add('ratio', '2000', true), add('ratio', '1250', false), add('ratio', '1000', false),
      add('age_term', '60;84', true), add('age_term', '68;84', true),
    ]
    const s = replay(mission, 3, [{ type: 'start' }, ...cases])
    expect(evaluate(mission, s, { kind: 'designCoverageGte', value: 0.6 })).toBe(true)
    expect(evaluate(mission, replay(mission, 3, [{ type: 'start' }]), { kind: 'designCoverageGte', value: 0.6 })).toBe(false)
  })

  it('un evento con dos bugs se atribuye al común de la evidencia', () => {
    let s = replay(mission, 3, [{ type: 'start' }])
    const ev = simulate({ age: '30', income: '1250', amount: '15000', term: '36' }, { active: ['L5', 'L7'] }).event
    expect(ev.bugs).toEqual(['L5', 'L7'])
    s = step(mission, s, { type: 'app', event: ev })
    const report = {
      title: 'Se preaprueba una cuota del 36,5 % de los ingresos',
      steps: '1. 30 años, 1.250 €/mes, 15.000 €, 36 meses\n2. Simular',
      expected: 'No preaprobado: cuota > 35 % (política v2.1)',
      actual: 'Preaprobado',
      severity: 'critical' as const,
      evidence: [s.log.at(-1)!.id],
    }
    s = step(mission, s, { type: 'report', report })
    expect(s.reports.at(-1)).toMatchObject({ bugId: 'L5', status: 'accepted' })
    s = step(mission, s, { type: 'report', report: { ...report, title: 'La cuota se trunca: 143,53 en vez de 143,54', severity: 'medium' } })
    expect(s.reports.at(-1)).toMatchObject({ bugId: 'L7' })
  })
})
