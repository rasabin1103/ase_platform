import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'
import { formatEur } from '../kobalto/transferLogic'

/**
 * App bajo prueba de la misión 3: consola de operaciones de cobros con
 * tarjeta de Kobalto Pay (KOB-170). Máquina de estados de un cobro y tabla
 * de decisión de la comisión por devolución.
 *
 * La consola muestra todas las acciones: es la API la que debe rechazar
 * las transiciones no permitidas (409) sin cambiar el cobro.
 */

export type PayState = 'pending' | 'authorized' | 'declined' | 'cancelled' | 'settled' | 'partially_refunded' | 'refunded' | 'disputed'
export type PayAction = 'authorize' | 'decline' | 'cancel' | 'settle' | 'refund' | 'dispute' | 'win' | 'lose'
export type Plan = 'standard' | 'pro'

export const STATE_LABEL: Record<PayState, string> = {
  pending: 'Pendiente',
  authorized: 'Autorizado',
  declined: 'Rechazado',
  cancelled: 'Anulado',
  settled: 'Liquidado',
  partially_refunded: 'Devuelto parcialmente',
  refunded: 'Devuelto',
  disputed: 'En disputa',
}

export const ACTION_LABEL: Record<PayAction, string> = {
  authorize: 'Autorizar',
  decline: 'Rechazar',
  cancel: 'Anular',
  settle: 'Liquidar',
  refund: 'Devolver',
  dispute: 'Abrir disputa',
  win: 'Disputa ganada',
  lose: 'Disputa perdida',
}

export const PLAN_LABEL: Record<Plan, string> = { standard: 'Estándar', pro: 'Pro' }

const STATE_LABELS: Record<AcademyLang, Record<PayState, string>> = {
  es: STATE_LABEL,
  en: {
    pending: 'Pending',
    authorized: 'Authorized',
    declined: 'Declined',
    cancelled: 'Voided',
    settled: 'Settled',
    partially_refunded: 'Partially refunded',
    refunded: 'Refunded',
    disputed: 'Disputed',
  },
}
const ACTION_LABELS: Record<AcademyLang, Record<PayAction, string>> = {
  es: ACTION_LABEL,
  en: {
    authorize: 'Authorize',
    decline: 'Decline',
    cancel: 'Void',
    settle: 'Settle',
    refund: 'Refund',
    dispute: 'Open dispute',
    win: 'Dispute won',
    lose: 'Dispute lost',
  },
}
const PLAN_LABELS: Record<AcademyLang, Record<Plan, string>> = { es: PLAN_LABEL, en: { standard: 'Standard', pro: 'Pro' } }

/** Etiquetas de estado en el idioma de la misión. */
export function stateLabelFor(lang: AcademyLang = 'es'): Record<PayState, string> {
  return STATE_LABELS[lang]
}
/** Etiquetas de acción en el idioma de la misión. */
export function actionLabelFor(lang: AcademyLang = 'es'): Record<PayAction, string> {
  return ACTION_LABELS[lang]
}
/** Etiquetas de plan en el idioma de la misión. */
export function planLabelFor(lang: AcademyLang = 'es'): Record<Plan, string> {
  return PLAN_LABELS[lang]
}

/** Textos de la API de cobros y de los eventos. */
const MESSAGES = {
  es: {
    created: (amount: string) => `Cobro creado · ${amount}`,
    refundedNote: (amount: string) => ` (devuelto ${amount})`,
    invalidSeedAmount: 'Importe del cobro no válido',
    invalidAge: 'Antigüedad no válida (0–365 días)',
    testMerchantPro: 'Comercio de prueba Pro',
    testMerchant: 'Comercio de prueba',
    seedError: (err: string) => `Generador: ${err}`,
    seedOk: (ref: string, state: string) => `${ref} creado en ${state}`,
    seedSummary: (ref: string, plan: string, amount: string, days: number, state: string, refunded: string) =>
      `Generador: ${ref} (${plan}, ${amount}, hace ${days} días) creado en «${state}»${refunded ? ` con ${refunded} devueltos` : ''}`,
    notAllowed: (from: string, action: string) => `Transición no permitida: ${from} → ${action}`,
    invalidRefund: 'Importe no válido: mayor que 0 y con 2 decimales como máximo',
    overRefund: (remaining: string) => `El importe supera lo pendiente de devolver (${remaining})`,
    refundHistory: (amount: string, fee: string, state: string) => `Devolución de ${amount} · comisión ${fee} → ${state}`,
    chargeback: (amount: string) => `Contracargo de ${amount}`,
    empty: '(vacío)',
    amountSuffix: (raw: string) => ` ${raw} €`,
    fee: (fee: string) => ` · comisión ${fee}`,
    okSummary: (ref: string, from: string, plan: string, days: number, verb: string, code: number, state: string, refunded: string, amount: string, fee: string) =>
      `${ref} (${from}, ${plan}, hace ${days} días) · ${verb} → ${code} ${state} · devuelto ${refunded} de ${amount}${fee}`,
    notFound: (id: number) => `Cobro ${id} no encontrado`,
  },
  en: {
    created: (amount: string) => `Payment created · ${amount}`,
    refundedNote: (amount: string) => ` (refunded ${amount})`,
    invalidSeedAmount: 'Invalid payment amount',
    invalidAge: 'Invalid age (0–365 days)',
    testMerchantPro: 'Test merchant Pro',
    testMerchant: 'Test merchant',
    seedError: (err: string) => `Generator: ${err}`,
    seedOk: (ref: string, state: string) => `${ref} created as ${state}`,
    seedSummary: (ref: string, plan: string, amount: string, days: number, state: string, refunded: string) =>
      `Generator: ${ref} (${plan}, ${amount}, ${days} days ago) created as “${state}”${refunded ? ` with ${refunded} refunded` : ''}`,
    notAllowed: (from: string, action: string) => `Transition not allowed: ${from} → ${action}`,
    invalidRefund: 'Invalid amount: greater than 0 and at most 2 decimal places',
    overRefund: (remaining: string) => `The amount exceeds what is left to refund (${remaining})`,
    refundHistory: (amount: string, fee: string, state: string) => `Refund of ${amount} · fee ${fee} → ${state}`,
    chargeback: (amount: string) => `Chargeback of ${amount}`,
    empty: '(empty)',
    amountSuffix: (raw: string) => ` €${raw}`,
    fee: (fee: string) => ` · fee ${fee}`,
    okSummary: (ref: string, from: string, plan: string, days: number, verb: string, code: number, state: string, refunded: string, amount: string, fee: string) =>
      `${ref} (${from}, ${plan}, ${days} days ago) · ${verb} → ${code} ${state} · refunded ${refunded} of ${amount}${fee}`,
    notFound: (id: number) => `Payment ${id} not found`,
  },
}

/** Mensajes de la consola de cobros en el idioma indicado. */
export function paymentMessages(lang: AcademyLang = 'es') {
  return MESSAGES[lang]
}

/** Transiciones válidas según el ciclo de vida (wiki). La devolución depende además del importe. */
export const TRANSITIONS: Record<PayState, Partial<Record<PayAction, PayState>>> = {
  pending: { authorize: 'authorized', decline: 'declined', cancel: 'cancelled' },
  authorized: { settle: 'settled', cancel: 'cancelled' },
  declined: {},
  cancelled: {},
  settled: { refund: 'partially_refunded', dispute: 'disputed' },
  partially_refunded: { refund: 'partially_refunded', dispute: 'disputed' },
  refunded: {},
  disputed: { win: 'settled', lose: 'refunded' },
}

export const PAY_BUGS = {
  refundCancelled: 'S1',
  refundAuthorized: 'S1b',
  cancelSettled: 'S2',
  settleCancelled: 'S2b',
  cumulativeOverRefund: 'S3',
  refundDisputed: 'S4',
  disputePartialRejected: 'S4b',
  exactRefundStaysPartial: 'S5',
  authorizeDeclined: 'S5b',
  proPaysPartialFee: 'F1',
  lateTotalFree: 'F1b',
  day30Late: 'F2',
  /** Regresión: tras corregir S3, devolver exactamente lo pendiente se rechaza. */
  exactRemainingRejected: 'S-R1',
} as const

export const PAY_BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'refund_source', options: ['S1', 'S1b'] },
  { slot: 'capture', options: ['S2', 'S2b'] },
  { slot: 'cumulative', options: ['S3'] },
  { slot: 'dispute', options: ['S4', 'S4b'] },
  { slot: 'final', options: ['S5', 'S5b'] },
  { slot: 'fee_rule', options: ['F1', 'F1b'] },
  { slot: 'fee_boundary', options: ['F2'] },
]

export const FEE = { inTerm: 0, partialInTerm: 0.75, late: 1.5, termDays: 30 } as const

export interface HistoryItem {
  label: string
}

export interface Payment {
  id: number
  ref: string
  merchant: string
  plan: Plan
  amount: number
  refunded: number
  /** Días desde el cobro. */
  daysAgo: number
  state: PayState
  /** Estado antes de abrir la disputa (al ganarla se vuelve a él). */
  prevState?: PayState
  fees: number
  history: HistoryItem[]
  test?: boolean
}

export interface PaymentsState {
  payments: Payment[]
  nextId: number
}

export interface PayBuild {
  active?: string[]
  fixed?: string[]
  regressions?: string[]
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function parseAmount(raw: string): number {
  let s = raw.trim().replace(/\s|€/g, '')
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '')
  s = s.replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN
}

const MERCHANTS: Record<AcademyLang, { name: string; plan: Plan }[]> = {
  es: [
    { name: 'Café Lumbre', plan: 'standard' },
    { name: 'Ferretería Montes', plan: 'pro' },
    { name: 'Óptica Rivera', plan: 'standard' },
    { name: 'Bicis Norte', plan: 'pro' },
  ],
  en: [
    { name: 'Lumbre Café', plan: 'standard' },
    { name: 'Montes Hardware', plan: 'pro' },
    { name: 'Rivera Optics', plan: 'standard' },
    { name: 'Norte Bikes', plan: 'pro' },
  ],
}

function base(
  id: number,
  merchant: string,
  plan: Plan,
  amount: number,
  daysAgo: number,
  state: PayState,
  refunded = 0,
  test = false,
  lang: AcademyLang = 'es',
): Payment {
  const M = MESSAGES[lang]
  const p: Payment = { id, ref: `KP-${1000 + id}`, merchant, plan, amount, refunded, daysAgo, state, fees: 0, history: [], test }
  if (state === 'disputed') p.prevState = refunded > 0 ? 'partially_refunded' : 'settled'
  p.history = [{ label: M.created(formatEur(amount, lang)) }]
  if (state !== 'pending') p.history.push({ label: `→ ${STATE_LABELS[lang][state]}${refunded ? M.refundedNote(formatEur(refunded, lang)) : ''}` })
  return p
}

/** Cobros iniciales de la consola (mismos datos; textos en el idioma indicado). */
export function initialPayments(lang: AcademyLang = 'es'): PaymentsState {
  const m = MERCHANTS[lang]
  return {
    payments: [
      base(1, m[0].name, 'standard', 24.5, 3, 'settled', 0, false, lang),
      base(2, m[1].name, 'pro', 189.9, 0, 'authorized', 0, false, lang),
      base(3, m[2].name, 'standard', 120, 12, 'partially_refunded', 40, false, lang),
      base(4, m[3].name, 'pro', 450, 20, 'disputed', 0, false, lang),
    ],
    nextId: 5,
  }
}

export const INITIAL_PAYMENTS: PaymentsState = initialPayments('es')

export interface SeedInput {
  plan: Plan
  amount: string
  days: string
  state: PayState
}

/** Generador de datos de prueba de staging: crea un cobro directamente en el estado pedido. */
export function seedPayment(id: number, input: SeedInput, lang: AcademyLang = 'es'): Payment | { error: string } {
  const M = MESSAGES[lang]
  const amount = parseAmount(input.amount)
  const days = Number(input.days)
  if (Number.isNaN(amount) || amount <= 0) return { error: M.invalidSeedAmount }
  if (!Number.isInteger(days) || days < 0 || days > 365) return { error: M.invalidAge }
  const refunded = input.state === 'partially_refunded' ? round2(Math.min(30, amount / 2)) : input.state === 'refunded' ? amount : 0
  return base(id, input.plan === 'pro' ? M.testMerchantPro : M.testMerchant, input.plan, round2(amount), days, input.state, refunded, true, lang)
}

export function createTestPayment(
  state: PaymentsState,
  input: SeedInput,
  lang: AcademyLang = 'es',
): { ok: boolean; message: string; state: PaymentsState; event: AppEvent; id?: number } {
  const M = MESSAGES[lang]
  const S = STATE_LABELS[lang]
  const p = seedPayment(state.nextId, input, lang)
  if ('error' in p) {
    return {
      ok: false,
      message: p.error,
      state,
      event: { app: 'kobalto-payments', action: 'seed', summary: M.seedError(p.error), technical: `POST /test-data/payments → 422 {"error":"${p.error}"}`, status: 'error', bugs: [] },
    }
  }
  const next = { payments: [p, ...state.payments], nextId: state.nextId + 1 }
  return {
    ok: true,
    message: M.seedOk(p.ref, S[p.state]),
    state: next,
    id: p.id,
    event: {
      app: 'kobalto-payments',
      action: 'seed',
      summary: M.seedSummary(p.ref, PLAN_LABELS[lang][p.plan], formatEur(p.amount, lang), p.daysAgo, S[p.state], p.refunded ? formatEur(p.refunded, lang) : ''),
      technical: `POST /test-data/payments {"plan":"${p.plan}","amount":${p.amount},"daysAgo":${p.daysAgo},"state":"${p.state}"} → 201 {"ref":"${p.ref}"}`,
      status: 'ok',
      bugs: [],
    },
  }
}

// ----------------------------------------------------------------- Reglas

/** Comisión al comercio según la tabla de decisión de Finanzas (con los bugs activos). */
export function refundFee(p: Payment, amount: number, has: (b: string) => boolean): number {
  const total = p.refunded === 0 && round2(amount) === round2(p.amount)
  const inTerm = has(PAY_BUGS.day30Late) ? p.daysAgo < FEE.termDays : p.daysAgo <= FEE.termDays
  if (has(PAY_BUGS.proPaysPartialFee) && !total) return inTerm ? FEE.partialInTerm : FEE.late
  if (p.plan === 'pro') return 0
  if (total) return inTerm || has(PAY_BUGS.lateTotalFree) ? FEE.inTerm : FEE.late
  return inTerm ? FEE.partialInTerm : FEE.late
}

interface Outcome {
  ok: boolean
  code: number
  error?: string
  payment: Payment
  fee?: number
}

function allowed(from: PayState, action: PayAction, has: (b: string) => boolean): PayState | undefined {
  if (action === 'refund') {
    if (from === 'cancelled' && has(PAY_BUGS.refundCancelled)) return 'partially_refunded'
    if (from === 'authorized' && has(PAY_BUGS.refundAuthorized)) return 'partially_refunded'
    if (from === 'disputed' && has(PAY_BUGS.refundDisputed)) return 'partially_refunded'
  }
  if (action === 'cancel' && from === 'settled' && has(PAY_BUGS.cancelSettled)) return 'cancelled'
  if (action === 'settle' && from === 'cancelled' && has(PAY_BUGS.settleCancelled)) return 'settled'
  if (action === 'authorize' && from === 'declined' && has(PAY_BUGS.authorizeDeclined)) return 'authorized'
  if (action === 'dispute' && from === 'partially_refunded' && has(PAY_BUGS.disputePartialRejected)) return undefined
  return TRANSITIONS[from][action]
}

function apply(p: Payment, action: PayAction, amountRaw: string, has: (b: string) => boolean, lang: AcademyLang = 'es'): Outcome {
  const M = MESSAGES[lang]
  const S = STATE_LABELS[lang]
  const A = ACTION_LABELS[lang]
  const to = allowed(p.state, action, has)
  if (!to) {
    return { ok: false, code: 409, error: M.notAllowed(S[p.state], A[action]), payment: p }
  }
  const next: Payment = { ...p, history: [...p.history] }
  if (action === 'refund') {
    const amt = parseAmount(amountRaw)
    if (Number.isNaN(amt) || amt <= 0 || round2(amt) !== amt) {
      return { ok: false, code: 422, error: M.invalidRefund, payment: p }
    }
    const remaining = round2(p.amount - p.refunded)
    let limitOk = amt <= remaining
    if (has(PAY_BUGS.cumulativeOverRefund)) limitOk = amt <= p.amount
    else if (has(PAY_BUGS.exactRemainingRejected)) limitOk = amt < remaining
    if (!limitOk) {
      return { ok: false, code: 422, error: M.overRefund(formatEur(remaining, lang)), payment: p }
    }
    const fee = refundFee(p, amt, has)
    next.refunded = round2(p.refunded + amt)
    const full = has(PAY_BUGS.exactRefundStaysPartial) ? next.refunded > p.amount : next.refunded >= p.amount
    next.state = full ? 'refunded' : 'partially_refunded'
    next.fees = round2(p.fees + fee)
    next.history.push({ label: M.refundHistory(formatEur(amt, lang), formatEur(fee, lang), S[next.state]) })
    return { ok: true, code: 201, payment: next, fee }
  }
  if (action === 'dispute') next.prevState = p.state
  if (action === 'win') {
    next.state = p.prevState ?? 'settled'
    next.prevState = undefined
  } else if (action === 'lose') {
    next.state = 'refunded'
    next.history.push({ label: M.chargeback(formatEur(round2(p.amount - p.refunded), lang)) })
    next.refunded = p.amount
    next.prevState = undefined
  } else {
    next.state = to
  }
  next.history.push({ label: `${A[action]} → ${S[next.state]}` })
  return { ok: true, code: 200, payment: next }
}

function signature(o: Outcome): string {
  return JSON.stringify([o.ok, o.code, o.payment.state, o.payment.refunded, o.fee ?? null])
}

export interface ActResult {
  ok: boolean
  message: string
  payment: Payment
  fee?: number
  /** Bugs sembrados que se han manifestado. */
  bugs: string[]
  event: AppEvent
}

/** Ejecuta una acción sobre un cobro (sin tocar la lista). */
export function actOn(p: Payment, action: PayAction, amountRaw: string, build: PayBuild = {}, lang: AcademyLang = 'es'): ActResult {
  const M = MESSAGES[lang]
  const S = STATE_LABELS[lang]
  const active = new Set(build.active ?? PAY_BUG_SLOTS.map((s) => s.options[0]))
  const fixed = new Set(build.fixed ?? [])
  const regressions = (build.regressions ?? []).filter((r) => !fixed.has(r))
  const live = [...[...active].filter((b) => !fixed.has(b)), ...regressions]
  const liveSet = new Set(live)
  const actual = apply(p, action, amountRaw, (b) => liveSet.has(b), lang)
  const spec = apply(p, action, amountRaw, () => false)
  const bugs: string[] = []
  if (signature(actual) !== signature(spec)) {
    for (const b of live) {
      const only = apply(p, action, amountRaw, (x) => x === b)
      if (signature(only) !== signature(spec)) bugs.push(b)
    }
  }
  const amt = action === 'refund' ? M.amountSuffix(amountRaw.trim() || M.empty) : ''
  const from = S[p.state]
  const verb = `${ACTION_LABELS[lang][action]}${amt}`
  const endpoint = action === 'refund' ? `POST /api/v1/ops/payments/${p.ref}/refunds {"amount":"${amountRaw.trim()}"}` : `POST /api/v1/ops/payments/${p.ref}/${action}`
  if (!actual.ok) {
    return {
      ok: false,
      message: `${actual.code} · ${actual.error}`,
      payment: p,
      bugs,
      event: {
        app: 'kobalto-payments',
        action,
        summary: `${p.ref} (${from}) · ${verb} → ${actual.code} ${actual.error}`,
        technical: `${endpoint} → ${actual.code} {"error":"${actual.error}"}`,
        status: 'error',
        bugs,
      },
    }
  }
  const q = actual.payment
  const feeTxt = actual.fee !== undefined ? M.fee(formatEur(actual.fee, lang)) : ''
  return {
    ok: true,
    message: `${actual.code} · ${S[q.state]}${feeTxt}`,
    payment: q,
    fee: actual.fee,
    bugs,
    event: {
      app: 'kobalto-payments',
      action,
      summary: M.okSummary(p.ref, from, PLAN_LABELS[lang][p.plan], p.daysAgo, verb, actual.code, S[q.state], formatEur(q.refunded, lang), formatEur(q.amount, lang), feeTxt),
      technical: `${endpoint} → ${actual.code} {"state":"${q.state}","refunded":${q.refunded}${actual.fee !== undefined ? `,"fee":${actual.fee}` : ''}}`,
      status: 'ok',
      bugs,
    },
  }
}

/** Ejecuta una acción sobre un cobro de la lista. */
export function act(
  state: PaymentsState,
  id: number,
  action: PayAction,
  amountRaw: string,
  build: PayBuild = {},
  lang: AcademyLang = 'es',
): ActResult & { state: PaymentsState } {
  const p = state.payments.find((x) => x.id === id)
  if (!p) throw new Error(MESSAGES[lang].notFound(id))
  const r = actOn(p, action, amountRaw, build, lang)
  const next = r.ok ? { ...state, payments: state.payments.map((x) => (x.id === id ? r.payment : x)) } : state
  return { ...r, state: next }
}

/** Resultado según la especificación (sin bugs): el oráculo. */
export function specOutcome(p: Payment, action: PayAction, amountRaw: string): { ok: boolean; state: PayState; refunded: number; fee?: number } {
  const o = apply(p, action, amountRaw, () => false)
  return { ok: o.ok, state: o.payment.state, refunded: o.payment.refunded, fee: o.fee }
}
