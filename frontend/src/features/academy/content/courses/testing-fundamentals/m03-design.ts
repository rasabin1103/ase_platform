import type { TestDesignModel } from '../../../engine/types'
import { TRANSITIONS, actOn, seedPayment, specOutcome, type PayAction, type PayState, type Payment, type Plan } from '../../../apps/kobalto-payments/paymentLogic'

/**
 * Diseño de pruebas de la consola de cobros (KOB-170): transición de estados
 * (válidas e inválidas), importes y secuencias de devoluciones, y la tabla
 * de decisión de la comisión por devolución.
 */

const STATE_WORDS: [RegExp, PayState][] = [
  [/^(devuelto|devuelta)?\s*parcial(mente)?(\s*devuelto)?$|^devuelto_parcial$|^partially_refunded$/, 'partially_refunded'],
  [/^pendiente$|^pending$/, 'pending'],
  [/^autorizad[oa]$|^authorized$/, 'authorized'],
  [/^rechazad[oa]$|^declined$/, 'declined'],
  [/^anulad[oa]$|^cancelad[oa]$|^cancelled$/, 'cancelled'],
  [/^liquidad[oa]$|^settled$|^capturad[oa]$/, 'settled'],
  [/^devuelt[oa]$|^refunded$|^reembolsad[oa]$/, 'refunded'],
  [/^(en\s*)?disputa$|^disputed$/, 'disputed'],
]

const ACTION_WORDS: [RegExp, PayAction][] = [
  [/^autorizar$|^authorize$/, 'authorize'],
  [/^rechazar$|^decline$/, 'decline'],
  [/^anular$|^cancelar$|^cancel$/, 'cancel'],
  [/^liquidar$|^capturar$|^settle$/, 'settle'],
  [/^devolver$|^devoluci[oó]n$|^reembolsar$|^refund$/, 'refund'],
  [/^(abrir\s*)?disputa$|^disputar$|^dispute$/, 'dispute'],
  [/^(disputa\s*)?ganada$|^ganar$|^win$/, 'win'],
  [/^(disputa\s*)?perdida$|^perder$|^lose$/, 'lose'],
]

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
const parts = (raw: string) => raw.split(/[;→>|/]+|\s+-\s+/).map(norm).filter(Boolean)

function parseState(w: string): PayState | undefined {
  return STATE_WORDS.find(([re]) => re.test(w))?.[1]
}
function parseAction(w: string): PayAction | undefined {
  return ACTION_WORDS.find(([re]) => re.test(w))?.[1]
}

function transition(input: string): { from: PayState; action: PayAction } | null {
  const p = parts(input)
  if (p.length !== 2) return null
  const from = parseState(p[0])
  const action = parseAction(p[1])
  return from && action ? { from, action } : null
}

function seed(state: PayState, plan: Plan = 'standard', days = 5, amount = '100'): Payment {
  const p = seedPayment(1, { plan, amount, days: String(days), state })
  if ('error' in p) throw new Error(p.error)
  return p
}

const isValid = (from: PayState, action: PayAction) => TRANSITIONS[from][action] !== undefined
const tkey = (from: PayState, action: PayAction) => `${from}:${action}`

const VALID_KEYS = Object.entries(TRANSITIONS).flatMap(([from, acts]) => Object.keys(acts).map((a) => `${from}:${a}`))
const INVALID_CORE = ['cancelled:refund', 'authorized:refund', 'disputed:refund', 'settled:cancel', 'cancelled:settle', 'declined:authorize', 'refunded:refund']

function money(raw: string): number {
  let s = raw.trim().replace(/\s|€/g, '')
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '')
  s = s.replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN
}

function pair(raw: string): [string, string] | null {
  const p = raw.split(/[;|/]+/).map((x) => x.trim()).filter(Boolean)
  return p.length === 2 ? [p[0], p[1]] : null
}

interface FeeCase {
  plan: Plan
  total: boolean
  days: number
}
function feeCase(input: string): FeeCase | null {
  const p = parts(input)
  if (p.length !== 3) return null
  const plan: Plan | undefined = /^pro$/.test(p[0]) ? 'pro' : /^est[aá]ndar$|^standard$/.test(p[0]) ? 'standard' : undefined
  const total = /^total$/.test(p[1]) ? true : /^parcial$/.test(p[1]) ? false : undefined
  const days = Number(p[2].replace(/d[ií]as?$/, '').trim())
  if (!plan || total === undefined || !Number.isInteger(days) || days < 0) return null
  return { plan, total, days }
}
const FEE_REFUND_PARTIAL = '40'

/** Ejecuta el caso contra un build y devuelve el primer bug que se manifiesta. */
function runCase(areaId: string, input: string, active: string[]): string | undefined {
  const build = { active }
  switch (areaId) {
    case 'valid':
    case 'invalid': {
      const t = transition(input)
      return t ? actOn(seed(t.from), t.action, '20', build).bugs[0] : undefined
    }
    case 'amount':
      return actOn(seed('settled'), 'refund', input, build).bugs[0]
    case 'cumulative': {
      const p = pair(input)
      if (!p) return undefined
      const first = actOn(seed('settled'), 'refund', p[0], build)
      if (first.bugs[0]) return first.bugs[0]
      return actOn(first.payment, 'refund', p[1], build).bugs[0]
    }
    case 'fee': {
      const f = feeCase(input)
      return f ? actOn(seed('settled', f.plan, f.days), 'refund', f.total ? '100' : FEE_REFUND_PARTIAL, build).bugs[0] : undefined
    }
    default:
      return undefined
  }
}

export const m03Design: TestDesignModel = {
  storyId: 'KOB-170',
  intro:
    'Cada flecha del ciclo de vida es un caso, y cada flecha que no existe también: la API debe responder 409 sin tocar el cobro. Después, secuencias de devoluciones y una prueba por regla de la tabla de comisiones.',
  caseCost: 2,
  reviewCost: 10,
  reviewer: 'laura',
  areas: [
    {
      id: 'valid',
      label: 'Transiciones válidas',
      inputLabel: '«estado;acción» (estados: pendiente, autorizado, rechazado, anulado, liquidado, parcial, devuelto, disputa · acciones: autorizar, rechazar, anular, liquidar, devolver, disputa, ganada, perdida)',
      inputPlaceholder: 'Ej.: autorizado;liquidar · parcial;disputa',
      expectedQuestion: '¿Se permite la acción?',
      expectedLabels: { yes: 'Se permite', no: '409' },
      partitions: [
        { id: 'pending:authorize', label: 'Pendiente → Autorizar', technique: 'Transición de estados', core: true, hint: 'Recorre el diagrama: cada flecha es un caso…' },
        { id: 'pending:decline', label: 'Pendiente → Rechazar', technique: 'Transición de estados', core: true, hint: 'Desde «Pendiente» salen tres flechas.' },
        { id: 'pending:cancel', label: 'Pendiente → Anular', technique: 'Transición de estados', core: true, hint: 'Desde «Pendiente» salen tres flechas.' },
        { id: 'authorized:settle', label: 'Autorizado → Liquidar', technique: 'Transición de estados', core: true, hint: 'El camino feliz también cuenta.' },
        { id: 'authorized:cancel', label: 'Autorizado → Anular', technique: 'Transición de estados', core: true, hint: '¿Se puede anular antes de liquidar?' },
        { id: 'settled:refund', label: 'Liquidado → Devolver', technique: 'Transición de estados', core: true, hint: 'El camino feliz también cuenta.' },
        { id: 'partially_refunded:refund', label: 'Devuelto parcialmente → Devolver', technique: 'Transición de estados', core: true, hint: 'Un estado intermedio también tiene sus flechas.' },
        { id: 'settled:dispute', label: 'Liquidado → Abrir disputa', technique: 'Transición de estados', core: true, hint: 'Las disputas tienen su propio ciclo.' },
        { id: 'partially_refunded:dispute', label: 'Devuelto parcialmente → Abrir disputa', technique: 'Transición de estados', core: true, hint: '¿Desde qué estados se puede abrir una disputa?' },
        { id: 'disputed:win', label: 'En disputa → Disputa ganada', technique: 'Transición de estados', core: true, hint: 'Una disputa termina de dos formas…' },
        { id: 'disputed:lose', label: 'En disputa → Disputa perdida', technique: 'Transición de estados', core: true, hint: '…y las dos son flechas.' },
      ],
    },
    {
      id: 'invalid',
      label: 'Transiciones inválidas',
      inputLabel: '«estado;acción» que NO debería permitirse (mismos nombres que en las válidas)',
      inputPlaceholder: 'Ej.: anulado;devolver · rechazado;autorizar',
      expectedQuestion: '¿Se permite la acción?',
      expectedLabels: { yes: 'Se permite', no: '409' },
      partitions: [
        { id: 'cancelled:refund', label: 'Anulado → Devolver', technique: 'Transiciones inválidas', core: true, hint: '¿Se puede devolver dinero que nunca se cobró?' },
        { id: 'authorized:refund', label: 'Autorizado → Devolver', technique: 'Transiciones inválidas', core: true, hint: 'Autorizado no es lo mismo que cobrado…' },
        { id: 'disputed:refund', label: 'En disputa → Devolver', technique: 'Transiciones inválidas', core: true, hint: 'Piensa en la incidencia que cuenta Carmen.' },
        { id: 'settled:cancel', label: 'Liquidado → Anular', technique: 'Transiciones inválidas', core: true, hint: 'Una vez liquidado, ¿anular o devolver?' },
        { id: 'cancelled:settle', label: 'Anulado → Liquidar', technique: 'Transiciones inválidas', core: true, hint: '¿Puede «revivir» un cobro anulado?' },
        { id: 'declined:authorize', label: 'Rechazado → Autorizar', technique: 'Transiciones inválidas', core: true, hint: 'Los estados finales deberían ser finales.' },
        { id: 'refunded:refund', label: 'Devuelto → Devolver', technique: 'Transiciones inválidas', core: true, hint: '¿Y si ya se devolvió todo?' },
        { id: 'other', label: 'Otra transición inválida', technique: 'Transiciones inválidas', hint: '' },
      ],
    },
    {
      id: 'amount',
      label: 'Importe de la devolución',
      inputLabel: 'Importe a devolver de un cobro liquidado de 100,00 € sin devoluciones',
      inputPlaceholder: 'Ej.: 0 · 40 · 100 · 100,01',
      expectedQuestion: '¿Se acepta la devolución?',
      partitions: [
        { id: 'zero', label: '0 € o negativo', technique: 'Valores límite', core: true, hint: 'El importe mínimo también es un borde…' },
        { id: 'partial', label: 'Devolución parcial', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal?' },
        { id: 'total', label: 'Exactamente el importe (100,00 €)', technique: 'Valores límite', core: true, hint: 'Justo en el máximo… y mira en qué estado queda.' },
        { id: 'above', label: 'Por encima del importe (100,01 € o más)', technique: 'Valores límite', core: true, hint: '…y un céntimo más.' },
        { id: 'decimals', label: 'Más de 2 decimales', technique: 'Particiones de equivalencia', hint: '' },
      ],
    },
    {
      id: 'cumulative',
      label: 'Devoluciones sucesivas',
      inputLabel: '«primera;segunda» devolución sobre un cobro liquidado de 100,00 €',
      inputPlaceholder: 'Ej.: 30;40 · 60;40 · 60;41',
      expectedQuestion: '¿Se acepta la segunda devolución?',
      partitions: [
        { id: 'under', label: 'Suman menos que el importe', technique: 'Secuencias de transiciones', core: true, hint: 'Dos devoluciones seguidas: el estado intermedio importa.' },
        { id: 'exact', label: 'Suman exactamente el importe', technique: 'Valores límite en secuencia', core: true, hint: '¿Y si la segunda completa justo el total?' },
        { id: 'over', label: 'Suman más que el importe', technique: 'Valores límite en secuencia', core: true, hint: 'Cada una por separado es válida… ¿y juntas?' },
      ],
    },
    {
      id: 'fee',
      label: 'Comisión (tabla de decisión)',
      inputLabel: '«plan;tipo;días» · plan: estándar o pro · tipo: total o parcial (40 €) · días desde el cobro (cobro de 100,00 €)',
      inputPlaceholder: 'Ej.: pro;parcial;10 · estándar;total;31',
      expectedQuestion: '¿Sale sin comisión para el comercio (0 €)?',
      expectedLabels: { yes: 'Comisión 0 €', no: 'Con comisión' },
      partitions: [
        { id: 'r1_total', label: 'R1 · Pro con devolución total', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Cada regla (columna) de la tabla es al menos un caso.' },
        { id: 'r1_partial', label: 'R1 · Pro con devolución parcial', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Una regla con «–» (indiferente) esconde varias combinaciones: prueba más de una.' },
        { id: 'r2', label: 'R2 · Estándar, total, en plazo', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Cada regla (columna) de la tabla es al menos un caso.' },
        { id: 'r3', label: 'R3 · Estándar, total, fuera de plazo', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Cada regla (columna) de la tabla es al menos un caso.' },
        { id: 'r4', label: 'R4 · Estándar, parcial, en plazo', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Cada regla (columna) de la tabla es al menos un caso.' },
        { id: 'r5', label: 'R5 · Estándar, parcial, fuera de plazo', technique: 'Tabla de decisión', core: true, requiresFlag: 'fees.read', hint: 'Cada regla (columna) de la tabla es al menos un caso.' },
        { id: 'd30', label: 'Día 30 (último día en plazo)', technique: 'Valores límite', core: true, hint: 'Una condición de la tabla tiene un límite: pruébalo por dentro…' },
        { id: 'd31', label: 'Día 31 (primer día fuera de plazo)', technique: 'Valores límite', core: true, hint: '…y por fuera.' },
      ],
    },
  ],

  classify(areaId, input) {
    switch (areaId) {
      case 'valid':
      case 'invalid': {
        const t = transition(input)
        if (!t) return []
        const k = tkey(t.from, t.action)
        if (areaId === 'valid') return VALID_KEYS.includes(k) ? [k] : []
        if (isValid(t.from, t.action)) return []
        return INVALID_CORE.includes(k) ? [k] : ['other']
      }
      case 'amount': {
        const v = money(input)
        if (Number.isNaN(v)) return []
        const out = [v <= 0 ? 'zero' : v < 100 ? 'partial' : v === 100 ? 'total' : 'above']
        if (Math.round(v * 100) / 100 !== v) out.push('decimals')
        return out
      }
      case 'cumulative': {
        const p = pair(input)
        if (!p) return []
        const a = money(p[0])
        const b = money(p[1])
        if (Number.isNaN(a) || Number.isNaN(b) || a <= 0 || b <= 0 || a >= 100) return []
        const sum = Math.round((a + b) * 100) / 100
        return [sum < 100 ? 'under' : sum === 100 ? 'exact' : 'over']
      }
      case 'fee': {
        const f = feeCase(input)
        if (!f) return []
        const inTerm = f.days <= 30
        const out = [f.plan === 'pro' ? (f.total ? 'r1_total' : 'r1_partial') : f.total ? (inTerm ? 'r2' : 'r3') : inTerm ? 'r4' : 'r5']
        if (f.plan === 'standard' && f.days === 30) out.push('d30')
        if (f.plan === 'standard' && f.days === 31) out.push('d31')
        return out
      }
      default:
        return []
    }
  },

  expected(areaId, input) {
    switch (areaId) {
      case 'valid':
      case 'invalid': {
        const t = transition(input)
        return t ? isValid(t.from, t.action) : undefined
      }
      case 'amount':
        return Number.isNaN(money(input)) ? undefined : specOutcome(seed('settled'), 'refund', input).ok
      case 'cumulative': {
        const p = pair(input)
        if (!p) return undefined
        const first = actOn(seed('settled'), 'refund', p[0], { active: [] })
        return first.ok ? specOutcome(first.payment, 'refund', p[1]).ok : false
      }
      case 'fee': {
        const f = feeCase(input)
        return f ? specOutcome(seed('settled', f.plan, f.days), 'refund', f.total ? '100' : FEE_REFUND_PARTIAL).fee === 0 : undefined
      }
      default:
        return undefined
    }
  },

  reveals(areaId, input, active) {
    return runCase(areaId, input, active)
  },

  prefill(areaId, input) {
    const base = { plan: 'standard', amount: '100', days: '5' }
    switch (areaId) {
      case 'valid':
      case 'invalid': {
        const t = transition(input)
        return t ? { ...base, state: t.from, action: t.action, refund: t.action === 'refund' ? '20' : '' } : { ...base, state: 'settled' }
      }
      case 'amount':
        return { ...base, state: 'settled', action: 'refund', refund: input }
      case 'cumulative': {
        const p = pair(input)
        return { ...base, state: 'settled', action: 'refund', refund: p?.[0] ?? '', refund2: p?.[1] ?? '' }
      }
      case 'fee': {
        const f = feeCase(input)
        return f
          ? { plan: f.plan, amount: '100', days: String(f.days), state: 'settled', action: 'refund', refund: f.total ? '100' : FEE_REFUND_PARTIAL }
          : { ...base, state: 'settled' }
      }
      default:
        return { ...base, state: 'settled' }
    }
  },
}
