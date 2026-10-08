import { describe, expect, it } from 'vitest'
import { INITIAL_INCIDENT, affected, breakdown, disableFlag, globalRate, query, reproduce, rollback } from './incidentLogic'

describe('observabilidad del incidente', () => {
  it('la tasa global sube y el desglose señala las instantáneas', () => {
    expect(globalRate('I1', false)).toBeGreaterThan(1)
    expect(globalRate('I1', true)).toBeLessThan(0.5)
    const rows = breakdown('endpoint', {}, 'I1', false)
    const instant = rows.find((r) => r.id === 'instant')!
    expect(instant.rate).toBeGreaterThan(4)
    expect(rows.filter((r) => r.id !== 'instant').every((r) => r.rate < 1)).toBe(true)
  })

  it('desglosando se llega a la condición exacta (I1: Android 5.1 y más de 1.000 €)', () => {
    const os = breakdown('os', { endpoint: 'instant' }, 'I1', false)
    expect(os.find((r) => r.id === 'android')!.rate).toBeGreaterThan(os.find((r) => r.id === 'ios')!.rate)
    const amount = breakdown('amount', { endpoint: 'instant', os: 'android', version: '5.1.0' }, 'I1', false)
    expect(amount.find((r) => r.id === 'high')!.rate).toBeGreaterThan(90)
    expect(amount.find((r) => r.id === 'low')!.rate).toBeLessThan(1)
  })

  it('I1b depende de la antigüedad de la cuenta, no del sistema', () => {
    const acc = breakdown('account', { endpoint: 'instant' }, 'I1b', false)
    expect(acc.find((r) => r.id === 'old')!.rate).toBeGreaterThan(80)
    expect(acc.find((r) => r.id === 'new')!.rate).toBeLessThan(1)
  })

  it('solo el flag correcto mitiga; el rollback también, pero tarda', () => {
    const wrong = disableFlag(INITIAL_INCIDENT, 'split_payments', 20, ['I1'])
    expect(wrong.event.flags).toContain('flag.wrong')
    expect(wrong.state.mitigatedAt).toBeUndefined()
    const right = disableFlag(INITIAL_INCIDENT, 'instant_fees_v2', 30, ['I1'])
    expect(right.event.flags).toEqual(expect.arrayContaining(['mitigated', 'mitigated.flag', 'mitigated.fast']))
    expect(right.state.mitigatedAt).toBe(35)
    expect(affected(right.state, 200, ['I1'])).toBe(35 * 6)
    const rb = rollback(INITIAL_INCIDENT, 30)
    expect(rb.event.cost).toBe(40)
    expect(rb.event.flags).not.toContain('mitigated.fast')
  })

  it('la reproducción exacta en staging revela el bug', () => {
    const ok = reproduce(INITIAL_INCIDENT, { endpoint: 'instant', os: 'android', version: '5.1.0', amount: 'low', account: 'new' }, ['I1'])
    expect(ok.event.bugs).toEqual([])
    const ko = reproduce(INITIAL_INCIDENT, { endpoint: 'instant', os: 'android', version: '5.1.0', amount: 'high', account: 'new' }, ['I1'])
    expect(ko.event.bugs).toEqual(['I1'])
    expect(reproduce(INITIAL_INCIDENT, { endpoint: 'instant', os: 'ios', version: '5.0.3', amount: 'low', account: 'old' }, ['I1b']).event.bugs).toEqual(['I1b'])
    expect(query(INITIAL_INCIDENT, 'endpoint', {}, ['I1']).event.cost).toBe(3)
  })
})
