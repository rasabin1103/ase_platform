import { describe, expect, it } from 'vitest'
import { PAY_BUGS as B, actOn, createTestPayment, INITIAL_PAYMENTS, seedPayment, specOutcome, type Payment, type PayState, type Plan } from './paymentLogic'

const seed = (state: PayState, over: { plan?: Plan; amount?: string; days?: string } = {}): Payment => {
  const p = seedPayment(99, { plan: over.plan ?? 'standard', amount: over.amount ?? '100', days: over.days ?? '5', state })
  if ('error' in p) throw new Error(p.error)
  return p
}
const none: string[] = []

describe('consola de cobros · máquina de estados', () => {
  it('sin bugs, el ciclo completo funciona y las inválidas dan 409', () => {
    let p = seed('pending')
    for (const [a, s] of [['authorize', 'authorized'], ['settle', 'settled']] as const) {
      const r = actOn(p, a, '', { active: none })
      expect(r.ok).toBe(true)
      expect(r.payment.state).toBe(s)
      p = r.payment
    }
    const r = actOn(p, 'refund', '30', { active: none })
    expect(r.payment.state).toBe('partially_refunded')
    expect(r.fee).toBe(0.75)
    expect(actOn(seed('cancelled'), 'refund', '20', { active: none }).ok).toBe(false)
    expect(actOn(seed('refunded'), 'refund', '20', { active: none }).event.bugs).toEqual([])
  })

  it('S1 devuelve un anulado; S1b un autorizado', () => {
    expect(actOn(seed('cancelled'), 'refund', '20', { active: [B.refundCancelled] }).event.bugs).toEqual([B.refundCancelled])
    expect(actOn(seed('authorized'), 'refund', '20', { active: [B.refundAuthorized] }).event.bugs).toEqual([B.refundAuthorized])
  })

  it('S2 anula un liquidado; S2b liquida un anulado', () => {
    expect(actOn(seed('settled'), 'cancel', '', { active: [B.cancelSettled] }).event.bugs).toEqual([B.cancelSettled])
    expect(actOn(seed('cancelled'), 'settle', '', { active: [B.settleCancelled] }).event.bugs).toEqual([B.settleCancelled])
  })

  it('S3 permite devolver más de lo cobrado en dos devoluciones', () => {
    const first = actOn(seed('settled'), 'refund', '60', { active: [B.cumulativeOverRefund] })
    expect(first.event.bugs).toEqual([])
    const second = actOn(first.payment, 'refund', '50', { active: [B.cumulativeOverRefund] })
    expect(second.ok).toBe(true)
    expect(second.payment.refunded).toBe(110)
    expect(second.event.bugs).toEqual([B.cumulativeOverRefund])
  })

  it('S4 devuelve en disputa; S4b rechaza abrir disputa tras devolución parcial', () => {
    expect(actOn(seed('disputed'), 'refund', '20', { active: [B.refundDisputed] }).event.bugs).toEqual([B.refundDisputed])
    const r = actOn(seed('partially_refunded'), 'dispute', '', { active: [B.disputePartialRejected] })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toEqual([B.disputePartialRejected])
  })

  it('S5 deja «Devuelto parcialmente» al devolver el total; S5b autoriza un rechazado', () => {
    const r = actOn(seed('settled'), 'refund', '100', { active: [B.exactRefundStaysPartial] })
    expect(r.payment.state).toBe('partially_refunded')
    expect(r.event.bugs).toEqual([B.exactRefundStaysPartial])
    expect(actOn(seed('declined'), 'authorize', '', { active: [B.authorizeDeclined] }).event.bugs).toEqual([B.authorizeDeclined])
  })

  it('la disputa ganada vuelve al estado anterior y la perdida devuelve lo pendiente', () => {
    const partial = seed('partially_refunded')
    const disputed = actOn(partial, 'dispute', '', { active: none }).payment
    expect(actOn(disputed, 'win', '', { active: none }).payment.state).toBe('partially_refunded')
    const lost = actOn(disputed, 'lose', '', { active: none }).payment
    expect(lost.state).toBe('refunded')
    expect(lost.refunded).toBe(100)
  })

  it('S-R1: tras corregir S3, devolver exactamente lo pendiente se rechaza', () => {
    const r = actOn(seed('partially_refunded'), 'refund', '70', { active: [B.cumulativeOverRefund], fixed: [B.cumulativeOverRefund], regressions: [B.exactRemainingRejected] })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toEqual([B.exactRemainingRejected])
  })
})

describe('consola de cobros · tabla de decisión de la comisión', () => {
  const fee = (plan: Plan, amount: string, days: string, active: string[]) => actOn(seed('settled', { plan, days }), 'refund', amount, { active })
  it('el oráculo aplica las cinco reglas', () => {
    const p = (plan: Plan, days: string) => seed('settled', { plan, days })
    expect(specOutcome(p('pro', '40'), 'refund', '40').fee).toBe(0)
    expect(specOutcome(p('standard', '30'), 'refund', '100').fee).toBe(0)
    expect(specOutcome(p('standard', '31'), 'refund', '100').fee).toBe(1.5)
    expect(specOutcome(p('standard', '30'), 'refund', '40').fee).toBe(0.75)
    expect(specOutcome(p('standard', '31'), 'refund', '40').fee).toBe(1.5)
  })
  it('F1 cobra a los Pro en parciales; F1b no cobra el total fuera de plazo; F2 trata el día 30 como fuera', () => {
    expect(fee('pro', '40', '10', [B.proPaysPartialFee]).event.bugs).toEqual([B.proPaysPartialFee])
    expect(fee('pro', '100', '10', [B.proPaysPartialFee]).event.bugs).toEqual([])
    expect(fee('standard', '100', '45', [B.lateTotalFree]).event.bugs).toEqual([B.lateTotalFree])
    expect(fee('standard', '100', '30', [B.day30Late]).event.bugs).toEqual([B.day30Late])
    expect(fee('standard', '100', '29', [B.day30Late]).event.bugs).toEqual([])
  })
})

describe('generador de datos de prueba', () => {
  it('crea cobros en el estado pedido y valida los datos', () => {
    const r = createTestPayment(INITIAL_PAYMENTS, { plan: 'pro', amount: '100', days: '5', state: 'disputed' })
    expect(r.ok).toBe(true)
    expect(r.state.payments[0]).toMatchObject({ ref: 'KP-1005', state: 'disputed', prevState: 'settled' })
    expect(createTestPayment(INITIAL_PAYMENTS, { plan: 'pro', amount: '0', days: '5', state: 'settled' }).ok).toBe(false)
  })
})
