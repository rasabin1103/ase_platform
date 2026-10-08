import type { AppEvent } from '../../engine/types'

/**
 * Lógica de la app bajo prueba "Kobalto · Transferencias" (staging).
 *
 * Implementa A PROPÓSITO una versión con bugs sembrados y, en paralelo, la
 * regla correcta de la especificación. Cuando la versión con bugs se
 * comporta distinto de la especificación, el evento lleva el id del bug que
 * se ha manifestado. El jugador nunca ve esos ids: solo el comportamiento.
 *
 * Cada partida activa una variante por "hueco" (ver BUG_SLOTS) según la
 * semilla, para que rejugar no sea memorizar.
 *
 * Especificación real (la que Marta, la PO, explica si se le pregunta):
 * - IBAN español válido: formato ES + 22 dígitos y dígitos de control (mod 97);
 *   los espacios se ignoran.
 * - Importe: mínimo 0,01 €, máximo 5.000 € por operación, hasta 2 decimales,
 *   separador decimal coma o punto, sin separador de miles.
 * - Límite diario acumulado: 6.000 € (incluido).
 * - Concepto opcional, máximo 140 caracteres.
 * - Una misma operación no puede enviarse dos veces (idempotencia).
 */

export const SPEC = { min: 0.01, maxPerOperation: 5000, dailyLimit: 6000, conceptMax: 140 } as const

export const BUGS = {
  perOperationLimit: 'B1',
  maxRejected: 'B1b',
  negativeAmount: 'B2',
  zeroAmount: 'B2b',
  commaDecimal: 'B3',
  commaTruncated: 'B3b',
  ibanChecksum: 'B4',
  ibanSpaces: 'B4b',
  doubleSubmit: 'B5',
  dailyLimit: 'B6',
  dailyExactRejected: 'B6b',
  /** Regresión: la corrección del formato decimal rompe los decimales con punto. */
  dotDecimalRegression: 'R1',
} as const

/** Huecos de bugs: en cada partida se activa una opción de cada uno. */
export const BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'limit', options: ['B1', 'B1b'] },
  { slot: 'zero_negative', options: ['B2', 'B2b'] },
  { slot: 'decimal_format', options: ['B3', 'B3b'] },
  { slot: 'iban', options: ['B4', 'B4b'] },
  { slot: 'double', options: ['B5'] },
  { slot: 'daily', options: ['B6', 'B6b'] },
]

/** Variante "clásica" (usada si no se indica otra, p. ej. en tests). */
export const DEFAULT_ACTIVE = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6']

/** Estado del build de staging. */
export interface BuildState {
  /** Bugs sembrados en esta partida. */
  active?: string[]
  /** Bugs ya corregidos en staging. */
  fixed?: string[]
  /** Regresiones introducidas por fixes. */
  regressions?: string[]
}

export interface TransferForm {
  iban: string
  beneficiary: string
  amount: string
  concept: string
}

export interface Transfer {
  id: number
  iban: string
  beneficiary: string
  amount: number
  concept: string
}

export interface BankState {
  balance: number
  dailyTotal: number
  transfers: Transfer[]
  nextId: number
}

export const INITIAL_BANK: BankState = { balance: 7450, dailyTotal: 0, transfers: [], nextId: 1 }

export function normalizeIban(raw: string): string {
  return raw.replace(/\s+/g, '').toUpperCase()
}

/** Validación IBAN completa (formato + dígitos de control ISO 13616 / mod 97). */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw)
  if (!/^ES\d{22}$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55))
  let rest = 0
  for (const digit of numeric) rest = (rest * 10 + Number(digit)) % 97
  return rest === 1
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

function maskIban(iban: string): string {
  return iban.length > 8 ? `${iban.slice(0, 4)}…${iban.slice(-4)}` : iban
}

export interface SubmitResult {
  bank: BankState
  ok: boolean
  message: string
  transfer?: Transfer
  event: AppEvent
}

/**
 * Envía una transferencia con la implementación de staging.
 * `concurrent` = el usuario ha pulsado "Confirmar" de nuevo mientras la
 * petición anterior seguía procesándose.
 */
export function submitTransfer(
  bank: BankState,
  form: TransferForm,
  opts: { concurrent?: boolean } & BuildState = {},
): SubmitResult {
  const active = new Set(opts.active ?? DEFAULT_ACTIVE)
  const fixed = new Set(opts.fixed ?? [])
  const regressions = new Set(opts.regressions ?? [])
  /** El bug está sembrado en esta partida y todavía no se ha corregido. */
  const has = (bug: string) => active.has(bug) && !fixed.has(bug)

  const iban = normalizeIban(form.iban)
  const beneficiary = form.beneficiary.trim()
  const rawAmount = form.amount.trim()
  const concept = form.concept

  const payloadFor = (amount: string | number) => `{"iban":"${iban || '—'}","amount":${amount === '' ? 'null' : amount}}`
  const reject = (message: string, payload: string, bugs: string[] = []): SubmitResult => ({
    bank,
    ok: false,
    message,
    event: {
      app: 'kobalto',
      action: 'transfer',
      summary: `Error al enviar (importe tecleado: "${rawAmount}", IBAN ${maskIban(iban) || '—'}): ${message}`,
      technical: `POST /api/v1/transfers ${payload} → 422 {"error":"${message}"}`,
      status: 'error',
      bugs,
    },
  })

  // --- IBAN ---
  if (!/^ES\d{22}$/.test(iban)) return reject('IBAN no válido', payloadFor(rawAmount || ''))
  if (has(BUGS.ibanSpaces) && /\s/.test(form.iban.trim()))
    return reject('IBAN no válido', payloadFor(rawAmount || ''), isValidIban(iban) ? [BUGS.ibanSpaces] : [])
  if (!has(BUGS.ibanChecksum) && !isValidIban(iban)) return reject('IBAN no válido', payloadFor(rawAmount || ''))

  // --- Beneficiario e importe ---
  if (!beneficiary) return reject('Indica el nombre del beneficiario', payloadFor(rawAmount || ''))
  if (!rawAmount) return reject('Indica un importe', payloadFor(''))
  if (/[.,]\d{3,}$/.test(rawAmount)) return reject('El importe admite como máximo 2 decimales', payloadFor(`"${rawAmount}"`))

  const correctText = rawAmount.replace(',', '.')
  let parsedText = correctText
  if (regressions.has(BUGS.dotDecimalRegression)) parsedText = rawAmount.replace('.', '').replace(',', '.')
  else if (has(BUGS.commaDecimal)) parsedText = rawAmount.replace(',', '')
  else if (has(BUGS.commaTruncated) && rawAmount.includes(',')) parsedText = rawAmount.split(',')[0]
  const amount = parseFloat(parsedText)
  const correctAmount = parseFloat(correctText)
  if (Number.isNaN(amount)) return reject('Importe no válido', payloadFor(`"${rawAmount}"`))

  if (amount === 0 && !has(BUGS.zeroAmount)) return reject('El importe debe ser mayor que 0', payloadFor(amount))
  if (amount < 0 && !has(BUGS.negativeAmount)) return reject('El importe debe ser mayor que 0', payloadFor(amount))

  // --- Límite por operación ---
  if (has(BUGS.perOperationLimit)) {
    if (Math.floor(amount) > SPEC.maxPerOperation) return reject('Supera el límite por operación de 5.000 €', payloadFor(amount))
  } else if (has(BUGS.maxRejected)) {
    if (amount >= SPEC.maxPerOperation)
      return reject('Supera el límite por operación de 5.000 €', payloadFor(amount), amount === SPEC.maxPerOperation ? [BUGS.maxRejected] : [])
  } else if (amount > SPEC.maxPerOperation) {
    return reject('Supera el límite por operación de 5.000 €', payloadFor(amount))
  }

  // --- Límite diario ---
  const dayTotal = bank.dailyTotal + amount
  if (has(BUGS.dailyLimit)) {
    if (amount > SPEC.dailyLimit) return reject('Supera el límite diario de 6.000 €', payloadFor(amount))
  } else if (has(BUGS.dailyExactRejected)) {
    if (dayTotal >= SPEC.dailyLimit)
      return reject('Supera el límite diario de 6.000 €', payloadFor(amount), dayTotal === SPEC.dailyLimit ? [BUGS.dailyExactRejected] : [])
  } else if (dayTotal > SPEC.dailyLimit) {
    return reject('Supera el límite diario de 6.000 €', payloadFor(amount))
  }

  if (amount > bank.balance) return reject('Saldo insuficiente', payloadFor(amount))
  if (concept.length > SPEC.conceptMax)
    return reject(`El concepto admite como máximo ${SPEC.conceptMax} caracteres`, payloadFor(amount))
  if (opts.concurrent && !has(BUGS.doubleSubmit))
    return reject('Operación duplicada: ya hay una transferencia idéntica en curso', payloadFor(amount))

  // --- Aceptada: ¿qué bugs se han manifestado según la especificación? ---
  const bugs: string[] = []
  if (!isValidIban(iban)) bugs.push(BUGS.ibanChecksum)
  if (amount !== correctAmount) {
    if (regressions.has(BUGS.dotDecimalRegression) && rawAmount.includes('.')) bugs.push(BUGS.dotDecimalRegression)
    else if (has(BUGS.commaDecimal)) bugs.push(BUGS.commaDecimal)
    else if (has(BUGS.commaTruncated)) bugs.push(BUGS.commaTruncated)
  }
  if (amount < 0) bugs.push(BUGS.negativeAmount)
  if (amount === 0) bugs.push(BUGS.zeroAmount)
  if (amount > SPEC.maxPerOperation) bugs.push(BUGS.perOperationLimit)
  if (amount > 0 && dayTotal > SPEC.dailyLimit) bugs.push(BUGS.dailyLimit)
  if (opts.concurrent) bugs.push(BUGS.doubleSubmit)

  const transfer: Transfer = { id: bank.nextId, iban, beneficiary, amount, concept }
  const next: BankState = {
    balance: Math.round((bank.balance - amount) * 100) / 100,
    dailyTotal: Math.round(dayTotal * 100) / 100,
    transfers: [transfer, ...bank.transfers],
    nextId: bank.nextId + 1,
  }
  return {
    bank: next,
    ok: true,
    message: 'Transferencia enviada',
    transfer,
    event: {
      app: 'kobalto',
      action: 'transfer',
      summary: `Transferencia de ${formatEur(amount)} a ${beneficiary} (${maskIban(iban)}) · importe tecleado: "${rawAmount}" · saldo: ${formatEur(next.balance)}`,
      technical: `POST /api/v1/transfers ${payloadFor(amount)} → 201 {"id":"TRF-${String(transfer.id).padStart(5, '0')}","balance":${next.balance}}`,
      status: 'ok',
      bugs,
    },
  }
}
