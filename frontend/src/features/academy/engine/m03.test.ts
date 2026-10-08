import { describe, expect, it } from 'vitest'
import { m03EstadosPago as mission } from '../content/courses/testing-fundamentals/m03-estados-pago'
import { m03Design as design } from '../content/courses/testing-fundamentals/m03-design'
import { actOn, seedPayment, type Payment } from '../apps/kobalto-payments/paymentLogic'
import { createRun, evaluate, replay, step, summarize } from './engine'
import type { Action } from './types'

const ALL_A = ['S1', 'S2', 'S3', 'S4', 'S5', 'F1', 'F2']
const ALL_B = ['S1b', 'S2b', 'S3', 'S4b', 'S5b', 'F1b', 'F2']
const add = (area: string, input: string, expectAccept: boolean): Action => ({ type: 'designAdd', area, input, expectAccept })

describe('misión 3 · estados de un pago', () => {
  it('cada partida activa 7 bugs (una variante por hueco)', () => {
    const s = createRun(mission, 5)
    expect(s.activeBugs).toHaveLength(7)
    expect(s.activeBugs).toEqual(expect.arrayContaining(['S3', 'F2']))
    expect(summarize(mission, s).total).toBe(7)
  })

  it('todos los bugs están definidos en la misión', () => {
    const ids = mission.bugs.map((b) => b.id)
    for (const b of [...ALL_A, ...ALL_B, 'S-R1']) expect(ids).toContain(b)
  })

  it('el diseño entiende estados y acciones en lenguaje natural', () => {
    expect(design.classify('valid', 'autorizado;liquidar')).toEqual(['authorized:settle'])
    expect(design.classify('valid', 'Devuelto parcialmente ; abrir disputa')).toEqual(['partially_refunded:dispute'])
    expect(design.classify('invalid', 'anulado;devolver')).toEqual(['cancelled:refund'])
    expect(design.classify('invalid', 'en disputa;devolver')).toEqual(['disputed:refund'])
    expect(design.classify('invalid', 'pendiente;ganada')).toEqual(['other'])
    expect(design.classify('invalid', 'liquidado;devolver')).toEqual([])
    expect(design.classify('fee', 'estándar;total;30')).toEqual(['r2', 'd30'])
    expect(design.classify('cumulative', '60;41')).toEqual(['over'])
    expect(design.expected('valid', 'disputa;ganada')).toBe(true)
    expect(design.expected('invalid', 'rechazado;autorizar')).toBe(false)
    expect(design.expected('cumulative', '60;40')).toBe(true)
    expect(design.expected('cumulative', '60;41')).toBe(false)
    expect(design.expected('fee', 'pro;parcial;10')).toBe(true)
    expect(design.expected('fee', 'estándar;parcial;10')).toBe(false)
  })

  it('el diseño sabe qué bug revela cada caso', () => {
    expect(design.reveals?.('invalid', 'anulado;devolver', ALL_A)).toBe('S1')
    expect(design.reveals?.('invalid', 'autorizado;devolver', ALL_B)).toBe('S1b')
    expect(design.reveals?.('invalid', 'liquidado;anular', ALL_A)).toBe('S2')
    expect(design.reveals?.('invalid', 'anulado;liquidar', ALL_B)).toBe('S2b')
    expect(design.reveals?.('invalid', 'disputa;devolver', ALL_A)).toBe('S4')
    expect(design.reveals?.('valid', 'parcial;disputa', ALL_B)).toBe('S4b')
    expect(design.reveals?.('invalid', 'rechazado;autorizar', ALL_B)).toBe('S5b')
    expect(design.reveals?.('amount', '100', ALL_A)).toBe('S5')
    expect(design.reveals?.('cumulative', '60;41', ALL_A)).toBe('S3')
    expect(design.reveals?.('cumulative', '30;40', ALL_A)).toBeUndefined()
    expect(design.reveals?.('fee', 'pro;parcial;10', ALL_A)).toBe('F1')
    expect(design.reveals?.('fee', 'estándar;total;45', ALL_B)).toBe('F1b')
    expect(design.reveals?.('fee', 'estándar;parcial;30', ALL_A)).toBe('F2')
    expect(design.reveals?.('valid', 'autorizado;liquidar', ALL_A)).toBeUndefined()
    expect(design.prefill?.('cumulative', '60;41')).toMatchObject({ state: 'settled', refund: '60', refund2: '41' })
  })

  it('la condición de cobertura habilita la respuesta a Riesgos', () => {
    const cases: Action[] = [
      add('valid', 'pendiente;autorizar', true), add('valid', 'pendiente;rechazar', true), add('valid', 'pendiente;anular', true),
      add('valid', 'autorizado;liquidar', true), add('valid', 'autorizado;anular', true), add('valid', 'liquidado;devolver', true),
      add('valid', 'parcial;devolver', true), add('valid', 'liquidado;disputa', true),
      add('invalid', 'anulado;devolver', false), add('invalid', 'autorizado;devolver', false), add('invalid', 'disputa;devolver', false),
      add('invalid', 'liquidado;anular', false), add('invalid', 'anulado;liquidar', false), add('invalid', 'rechazado;autorizar', false),
      add('amount', '0', false), add('amount', '40', true), add('amount', '100', true), add('amount', '100,01', false),
      add('cumulative', '60;40', true), add('cumulative', '60;41', false),
    ]
    const s = replay(mission, 5, [{ type: 'start' }, ...cases])
    expect(evaluate(mission, s, { kind: 'designCoverageGte', value: 0.6 })).toBe(true)
    expect(evaluate(mission, replay(mission, 5, [{ type: 'start' }]), { kind: 'designCoverageGte', value: 0.6 })).toBe(false)
  })

  it('un report con evidencia de la transición inválida se acepta', () => {
    let s = replay(mission, 5, [{ type: 'start' }])
    const bug = s.activeBugs.find((b) => b === 'S1' || b === 'S1b')!
    const from = bug === 'S1' ? 'cancelled' : 'authorized'
    const p = seedPayment(9, { plan: 'standard', amount: '100', days: '5', state: from }) as Payment
    const ev = actOn(p, 'refund', '20', { active: s.activeBugs }).event
    expect(ev.bugs).toEqual([bug])
    s = step(mission, s, { type: 'app', event: ev })
    s = step(mission, s, {
      type: 'report',
      report: {
        title: `Se puede devolver un cobro en estado ${from === 'cancelled' ? 'Anulado' : 'Autorizado'}`,
        steps: `1. Crear cobro de 100 € en ${from}\n2. Devolver 20 €`,
        expected: '409 Transición no permitida y el cobro no cambia (ciclo de vida, wiki)',
        actual: '201: devolución hecha, el cobro pasa a Devuelto parcialmente',
        severity: 'critical',
        evidence: [s.log.at(-1)!.id],
      },
    })
    expect(s.reports.at(-1)).toMatchObject({ bugId: bug, status: 'accepted' })
  })
})
