import { describe, expect, it } from 'vitest'
import { LOAN_BUGS as B, simulate, specQuote, type LoanForm } from './loanLogic'

const form = (over: Partial<LoanForm> = {}): LoanForm => ({ age: '35', income: '2500', amount: '6000', term: '48', ...over })
const none: string[] = []

describe('simulador de préstamos', () => {
  it('el oráculo calcula la cuota con redondeo half-up y el tramo correcto', () => {
    expect(specQuote(form()).quote?.installment).toBe(143.54)
    expect(specQuote(form({ amount: '10000', term: '60' })).quote?.installment).toBe(193.1)
    expect(specQuote(form({ amount: '9900', term: '60' })).quote?.rate).toBe(6.95)
  })

  it('sin bugs no se manifiesta nada', () => {
    const r = simulate(form(), { active: none })
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toEqual([])
  })

  it('L1 acepta 17 años; L1b rechaza 70', () => {
    expect(simulate(form({ age: '17' }), { active: [B.age17] }).event.bugs).toContain(B.age17)
    const r = simulate(form({ age: '70', term: '60' }), { active: [B.age70Rejected] })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toContain(B.age70Rejected)
  })

  it('L2 acepta importes no múltiplos de 100; L2b rechaza 30.000', () => {
    expect(simulate(form({ amount: '6050' }), { active: [B.notMultipleOf100] }).event.bugs).toContain(B.notMultipleOf100)
    expect(simulate(form({ amount: '30000', income: '5000' }), { active: [B.max30000Rejected] }).event.bugs).toContain(B.max30000Rejected)
  })

  it('L3 acepta 6 meses; L3b rechaza 84', () => {
    expect(simulate(form({ term: '6' }), { active: [B.term6] }).event.bugs).toContain(B.term6)
    expect(simulate(form({ term: '84' }), { active: [B.term84Rejected] }).event.bugs).toContain(B.term84Rejected)
  })

  it('L4 aplica el tipo alto a 10.000 €; L4b el bajo a 9.000 €', () => {
    expect(simulate(form({ amount: '10000' }), { active: [B.tierAbove10000] }).event.bugs).toContain(B.tierAbove10000)
    expect(simulate(form({ amount: '9500' }), { active: [B.tierFrom9000] }).event.bugs).toContain(B.tierFrom9000)
  })

  it('L5 aprueba con ratio del 38 %; L5b aprueba siempre', () => {
    // 15.000 € a 36 meses: cuota 455,99 € → con 1.200 € de ingresos, ratio 38 %.
    expect(simulate(form({ amount: '15000', term: '36', income: '1200' }), { active: [B.ratio40] }).event.bugs).toContain(B.ratio40)
    expect(simulate(form({ amount: '15000', term: '36', income: '1000' }), { active: [B.ratioIgnored] }).event.bugs).toContain(B.ratioIgnored)
    expect(simulate(form({ amount: '15000', term: '36', income: '1200' }), { active: none }).quote?.approved).toBe(false)
  })

  it('L6 ignora la edad al terminar de pagar', () => {
    const r = simulate(form({ age: '70', term: '84' }), { active: [B.ageTermIgnored] })
    expect(r.quote?.approved).toBe(true)
    expect(r.event.bugs).toContain(B.ageTermIgnored)
    expect(simulate(form({ age: '70', term: '60' }), { active: none }).quote?.approved).toBe(true)
  })

  it('L7 trunca la cuota (un céntimo menos)', () => {
    const r = simulate(form(), { active: [B.truncatedInstallment] })
    expect(r.quote?.installment).toBe(143.53)
    expect(r.event.bugs).toContain(B.truncatedInstallment)
  })

  it('L-R1: tras corregir el tramo, el total deja de cuadrar', () => {
    const r = simulate(form(), { active: none, regressions: [B.totalMismatch] })
    expect(r.quote?.total).not.toBe(Math.round(r.quote!.installment * 48 * 100) / 100)
    expect(r.event.bugs).toContain(B.totalMismatch)
  })
})
