import { describe, expect, it } from 'vitest'
import { BUGS, INITIAL_BANK, isValidIban, submitTransfer, type TransferForm } from './transferLogic'

const VALID_IBAN = 'ES30 9101 0001 1202 0001 2345'
const form = (over: Partial<TransferForm> = {}): TransferForm => ({
  iban: VALID_IBAN,
  beneficiary: 'Ana López',
  amount: '100',
  concept: '',
  ...over,
})

describe('Kobalto transferLogic', () => {
  it('valida IBAN con dígitos de control', () => {
    expect(isValidIban(VALID_IBAN)).toBe(true)
    expect(isValidIban('ES31 9101 0001 1202 0001 2345')).toBe(false)
    expect(isValidIban('ES30')).toBe(false)
  })

  it('una transferencia correcta no manifiesta bugs', () => {
    const r = submitTransfer(INITIAL_BANK, form())
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toEqual([])
    expect(r.bank.balance).toBe(7350)
  })

  it('los controles que sí funcionan rechazan', () => {
    expect(submitTransfer(INITIAL_BANK, form({ amount: '0' })).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ amount: '5001' })).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ beneficiary: ' ' })).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ concept: 'x'.repeat(141) })).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ amount: '10.505' })).ok).toBe(false)
  })

  it('B1: acepta 5000,01–5000,99 (límite comparado por parte entera)', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '5000.50' }))
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toContain(BUGS.perOperationLimit)
    expect(submitTransfer(INITIAL_BANK, form({ amount: '5000' })).event.bugs).toEqual([])
  })

  it('B2: acepta importes negativos y aumenta el saldo', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '-50' }))
    expect(r.event.bugs).toContain(BUGS.negativeAmount)
    expect(r.bank.balance).toBe(7500)
  })

  it('B3: "10,50" se procesa como 1050 €', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '10,50' }))
    expect(r.transfer?.amount).toBe(1050)
    expect(r.event.bugs).toContain(BUGS.commaDecimal)
  })

  it('B4: acepta IBAN con dígitos de control incorrectos', () => {
    const r = submitTransfer(INITIAL_BANK, form({ iban: 'ES31 9101 0001 1202 0001 2345' }))
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toContain(BUGS.ibanChecksum)
  })

  it('B5: doble clic crea transferencia duplicada', () => {
    const r = submitTransfer(INITIAL_BANK, form(), { concurrent: true })
    expect(r.event.bugs).toContain(BUGS.doubleSubmit)
  })

  it('B6: no aplica el límite diario acumulado', () => {
    const first = submitTransfer(INITIAL_BANK, form({ amount: '4000' }))
    const second = submitTransfer(first.bank, form({ amount: '2500' }))
    expect(second.ok).toBe(true)
    expect(second.event.bugs).toContain(BUGS.dailyLimit)
  })

  it('con los fixes desplegados, los bugs corregidos dejan de manifestarse', () => {
    const fixed = ['B1', 'B2', 'B3', 'B4', 'B6']
    expect(submitTransfer(INITIAL_BANK, form({ amount: '-50' }), { fixed }).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ amount: '5000.50' }), { fixed }).ok).toBe(false)
    expect(submitTransfer(INITIAL_BANK, form({ iban: 'ES31 9101 0001 1202 0001 2345' }), { fixed }).ok).toBe(false)
    const comma = submitTransfer(INITIAL_BANK, form({ amount: '10,50' }), { fixed })
    expect(comma.transfer?.amount).toBe(10.5)
    expect(comma.event.bugs).toEqual([])
    const first = submitTransfer(INITIAL_BANK, form({ amount: '4000' }), { fixed })
    expect(submitTransfer(first.bank, form({ amount: '2500' }), { fixed }).ok).toBe(false)
  })

  it('R1: el fix de la coma rompe los decimales con punto', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '10.50' }), { fixed: ['B3'], regressions: ['R1'] })
    expect(r.transfer?.amount).toBe(1050)
    expect(r.event.bugs).toContain(BUGS.dotDecimalRegression)
    expect(submitTransfer(INITIAL_BANK, form({ amount: '10.50' })).event.bugs).toEqual([])
  })
})

describe('variantes de bugs', () => {
  const alt = ['B1b', 'B2b', 'B3b', 'B4b', 'B5', 'B6b']
  const NS = 'ES3091010001120200012345'
  it('B1b: rechaza el máximo exacto de 5.000 €', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '5000' , iban: NS }), { active: alt })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toContain('B1b')
    expect(submitTransfer(INITIAL_BANK, form({ amount: '5000.50' , iban: NS }), { active: alt }).event.bugs).toEqual([])
  })
  it('B2b: acepta transferencias de 0 € y rechaza negativos', () => {
    expect(submitTransfer(INITIAL_BANK, form({ amount: '0' , iban: NS }), { active: alt }).event.bugs).toContain('B2b')
    expect(submitTransfer(INITIAL_BANK, form({ amount: '-5' , iban: NS }), { active: alt }).ok).toBe(false)
  })
  it('B3b: trunca los decimales con coma', () => {
    const r = submitTransfer(INITIAL_BANK, form({ amount: '10,50' , iban: NS }), { active: alt })
    expect(r.transfer?.amount).toBe(10)
    expect(r.event.bugs).toContain('B3b')
    expect(submitTransfer(INITIAL_BANK, form({ amount: '10,00' , iban: NS }), { active: alt }).event.bugs).toEqual([])
  })
  it('B4b: rechaza un IBAN válido escrito con espacios', () => {
    const r = submitTransfer(INITIAL_BANK, form(), { active: alt })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toContain('B4b')
    expect(submitTransfer(INITIAL_BANK, form({ iban: 'ES3091010001120200012345' }), { active: alt }).ok).toBe(true)
    expect(submitTransfer(INITIAL_BANK, form({ iban: 'ES3191010001120200012345' }), { active: alt }).ok).toBe(false)
  })
  it('B6b: rechaza un acumulado exacto de 6.000 €', () => {
    const first = submitTransfer(INITIAL_BANK, form({ amount: '3000', iban: 'ES3091010001120200012345' }), { active: alt })
    const second = submitTransfer(first.bank, form({ amount: '3000', iban: 'ES3091010001120200012345' }), { active: alt })
    expect(second.ok).toBe(false)
    expect(second.event.bugs).toContain('B6b')
  })
  it('B5 corregido: el doble envío se bloquea', () => {
    const r = submitTransfer(INITIAL_BANK, form(), { concurrent: true, fixed: ['B5'] })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toEqual([])
  })
})
