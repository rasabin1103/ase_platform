import type { AppEvent } from '../../engine/types'
import { formatEur } from '../kobalto/transferLogic'

/**
 * App bajo prueba de la misión 2: simulador de préstamos personales (KOB-163).
 *
 * Política (clara y con ejemplos, gracias a lo aprendido el martes):
 * - Edad: 18 a 70 años, ambos incluidos.
 * - Importe: 1.000 € a 30.000 €, en múltiplos de 100 €.
 * - Plazo: 12 a 84 meses, ambos incluidos.
 * - Ingresos netos mensuales: mínimo 1.000 €.
 * - Edad al terminar de pagar (edad + plazo en años) ≤ 75.
 * - TIN: 6,95 % por debajo de 10.000 €; 5,95 % desde 10.000 € (incluido).
 * - Cuota: sistema francés, redondeada al céntimo (half-up).
 * - Total a devolver = cuota × plazo. Intereses = total − importe.
 * - Preaprobado si cuota ≤ 35 % de los ingresos netos.
 */

export const LOAN_BUGS = {
  age17: 'L1',
  age70Rejected: 'L1b',
  notMultipleOf100: 'L2',
  max30000Rejected: 'L2b',
  term6: 'L3',
  term84Rejected: 'L3b',
  tierAbove10000: 'L4',
  tierFrom9000: 'L4b',
  ratio40: 'L5',
  ratioIgnored: 'L5b',
  ageTermIgnored: 'L6',
  truncatedInstallment: 'L7',
  /** Regresión: tras corregir el tramo, el total deja de cuadrar con cuota × plazo. */
  totalMismatch: 'L-R1',
} as const

export const LOAN_BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'age', options: ['L1', 'L1b'] },
  { slot: 'amount', options: ['L2', 'L2b'] },
  { slot: 'term', options: ['L3', 'L3b'] },
  { slot: 'tier', options: ['L4', 'L4b'] },
  { slot: 'ratio', options: ['L5', 'L5b'] },
  { slot: 'age_term', options: ['L6'] },
  { slot: 'rounding', options: ['L7'] },
]

export const SPEC = {
  ageMin: 18,
  ageMax: 70,
  amountMin: 1000,
  amountMax: 30000,
  termMin: 12,
  termMax: 84,
  incomeMin: 1000,
  endAgeMax: 75,
  tierThreshold: 10000,
  rateHigh: 6.95,
  rateLow: 5.95,
  maxRatio: 0.35,
} as const

export interface LoanForm {
  age: string
  income: string
  amount: string
  term: string
}

export interface LoanQuote {
  rate: number
  installment: number
  total: number
  interest: number
  ratio: number
  approved: boolean
  reason?: string
}

export interface LoanResult {
  ok: boolean
  /** Error de validación (campo fuera de rango). */
  error?: string
  quote?: LoanQuote
  event: AppEvent
}

export interface LoanBuild {
  active?: string[]
  fixed?: string[]
  regressions?: string[]
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function trunc2(n: number): number {
  return Math.floor(n * 100 + 1e-9) / 100
}

export function frenchInstallment(amount: number, annualRatePct: number, months: number): number {
  const i = annualRatePct / 100 / 12
  return (amount * i) / (1 - Math.pow(1 + i, -months))
}

function parseNum(raw: string): number {
  let s = raw.trim()
  // «6.000» o «6.000,50»: punto como separador de miles; si no, coma decimal.
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '')
  s = s.replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN
}

/** Resultado según la política (sin bugs): el oráculo. */
export function specQuote(form: LoanForm): { error?: string; quote?: LoanQuote } {
  return evaluate(form, { active: [] }).spec
}

interface Evaluation {
  spec: { error?: string; quote?: LoanQuote }
  actual: { error?: string; quote?: LoanQuote }
  bugs: string[]
}

function evaluate(form: LoanForm, build: LoanBuild): Evaluation {
  const active = new Set(build.active ?? LOAN_BUG_SLOTS.map((s) => s.options[0]))
  const fixed = new Set(build.fixed ?? [])
  const regressions = new Set(build.regressions ?? [])
  const has = (b: string) => active.has(b) && !fixed.has(b)
  const bugs: string[] = []

  const age = parseNum(form.age)
  const income = parseNum(form.income)
  const amount = parseNum(form.amount)
  const term = parseNum(form.term)

  // Cada regla: veredicto según la política y según el código de staging.
  type Check = { specOk: boolean; actualOk: boolean; bug?: string; error: string }
  const checks: Check[] = []
  const nums = [age, income, amount, term]
  if (nums.some((n) => Number.isNaN(n))) {
    const error = 'Revisa los datos: todos los campos son numéricos'
    return { spec: { error }, actual: { error }, bugs }
  }

  // Edad
  const ageSpec = Number.isInteger(age) && age >= SPEC.ageMin && age <= SPEC.ageMax
  let ageActual = ageSpec
  let ageBug: string | undefined
  if (has(LOAN_BUGS.age17)) {
    ageActual = Number.isInteger(age) && age >= 17 && age <= SPEC.ageMax
    ageBug = LOAN_BUGS.age17
  } else if (has(LOAN_BUGS.age70Rejected)) {
    ageActual = Number.isInteger(age) && age >= SPEC.ageMin && age < SPEC.ageMax
    ageBug = LOAN_BUGS.age70Rejected
  }
  checks.push({ specOk: ageSpec, actualOk: ageActual, bug: ageBug, error: 'Edad no válida: de 18 a 70 años' })

  // Importe
  const amountSpec = amount >= SPEC.amountMin && amount <= SPEC.amountMax && amount % 100 === 0
  let amountActual = amountSpec
  let amountBug: string | undefined
  if (has(LOAN_BUGS.notMultipleOf100)) {
    amountActual = amount >= SPEC.amountMin && amount <= SPEC.amountMax
    amountBug = LOAN_BUGS.notMultipleOf100
  } else if (has(LOAN_BUGS.max30000Rejected)) {
    amountActual = amount >= SPEC.amountMin && amount < SPEC.amountMax && amount % 100 === 0
    amountBug = LOAN_BUGS.max30000Rejected
  }
  checks.push({ specOk: amountSpec, actualOk: amountActual, bug: amountBug, error: 'Importe no válido: de 1.000 € a 30.000 €, en múltiplos de 100 €' })

  // Plazo
  const termSpec = Number.isInteger(term) && term >= SPEC.termMin && term <= SPEC.termMax
  let termActual = termSpec
  let termBug: string | undefined
  if (has(LOAN_BUGS.term6)) {
    termActual = Number.isInteger(term) && term >= 6 && term <= SPEC.termMax
    termBug = LOAN_BUGS.term6
  } else if (has(LOAN_BUGS.term84Rejected)) {
    termActual = Number.isInteger(term) && term >= SPEC.termMin && term < SPEC.termMax
    termBug = LOAN_BUGS.term84Rejected
  }
  checks.push({ specOk: termSpec, actualOk: termActual, bug: termBug, error: 'Plazo no válido: de 12 a 84 meses' })

  // Ingresos
  const incomeOk = income >= SPEC.incomeMin
  checks.push({ specOk: incomeOk, actualOk: incomeOk, error: 'Ingresos insuficientes: mínimo 1.000 € netos al mes' })

  let specError: string | undefined
  let actualError: string | undefined
  for (const c of checks) {
    if (!specError && !c.specOk) specError = c.error
    if (!actualError && !c.actualOk) actualError = c.error
    if (c.bug && c.specOk !== c.actualOk && !(specError && actualError)) bugs.push(c.bug)
  }

  const quote = (mode: 'spec' | 'actual'): LoanQuote => {
    const buggy = mode === 'actual'
    let rate: number = amount >= SPEC.tierThreshold ? SPEC.rateLow : SPEC.rateHigh
    if (buggy && has(LOAN_BUGS.tierAbove10000)) rate = amount > SPEC.tierThreshold ? SPEC.rateLow : SPEC.rateHigh
    if (buggy && has(LOAN_BUGS.tierFrom9000)) rate = amount >= 9000 ? SPEC.rateLow : SPEC.rateHigh
    const raw = frenchInstallment(amount, rate, term)
    const installment = buggy && has(LOAN_BUGS.truncatedInstallment) ? trunc2(raw) : round2(raw)
    const total = buggy && regressions.has(LOAN_BUGS.totalMismatch) ? round2(raw * term) : round2(installment * term)
    const interest = round2(total - amount)
    const ratio = installment / income
    const endAge = age + term / 12
    let approved = true
    let reason: string | undefined
    const ageTermOk = endAge <= SPEC.endAgeMax || (buggy && has(LOAN_BUGS.ageTermIgnored))
    let ratioLimit: number = SPEC.maxRatio
    if (buggy && has(LOAN_BUGS.ratio40)) ratioLimit = 0.4
    const ratioOk = ratio <= ratioLimit || (buggy && has(LOAN_BUGS.ratioIgnored))
    if (!ageTermOk) {
      approved = false
      reason = 'No preaprobado: terminarías de pagar con más de 75 años'
    } else if (!ratioOk) {
      approved = false
      reason = 'No preaprobado: la cuota supera el 35 % de tus ingresos'
    }
    return { rate, installment, total, interest, ratio, approved, reason }
  }

  const specQ = specError ? undefined : quote('spec')
  const actualQ = actualError ? undefined : quote('actual')

  if (specQ && actualQ) {
    if (actualQ.rate !== specQ.rate) bugs.push(has(LOAN_BUGS.tierAbove10000) ? LOAN_BUGS.tierAbove10000 : LOAN_BUGS.tierFrom9000)
    const endAge = age + term / 12
    if (endAge > SPEC.endAgeMax && actualQ.approved !== specQ.approved && has(LOAN_BUGS.ageTermIgnored)) bugs.push(LOAN_BUGS.ageTermIgnored)
    else if (actualQ.approved !== specQ.approved) bugs.push(has(LOAN_BUGS.ratio40) ? LOAN_BUGS.ratio40 : LOAN_BUGS.ratioIgnored)
    if (actualQ.rate === specQ.rate && actualQ.installment !== specQ.installment) bugs.push(LOAN_BUGS.truncatedInstallment)
    if (regressions.has(LOAN_BUGS.totalMismatch) && actualQ.total !== round2(actualQ.installment * term)) bugs.push(LOAN_BUGS.totalMismatch)
  }

  return { spec: { error: specError, quote: specQ }, actual: { error: actualError, quote: actualQ }, bugs }
}

export function simulate(form: LoanForm, build: LoanBuild = {}): LoanResult {
  const ev = evaluate(form, build)
  const input = `edad ${form.age}, ingresos ${form.income}, importe ${form.amount}, plazo ${form.term}`
  if (ev.actual.error) {
    return {
      ok: false,
      error: ev.actual.error,
      event: {
        app: 'kobalto-loans',
        action: 'simulate',
        summary: `Error al simular (${input}): ${ev.actual.error}`,
        technical: `POST /api/v1/loans/simulate {${input}} → 422 {"error":"${ev.actual.error}"}`,
        status: 'error',
        bugs: ev.bugs,
      },
    }
  }
  const q = ev.actual.quote as LoanQuote
  return {
    ok: true,
    quote: q,
    event: {
      app: 'kobalto-loans',
      action: 'simulate',
      summary: `Simulación (${input}) → TIN ${q.rate.toFixed(2)} %, cuota ${formatEur(q.installment)}, total ${formatEur(q.total)}, ratio ${(q.ratio * 100).toFixed(1)} %: ${q.approved ? 'PREAPROBADO' : q.reason}`,
      technical: `POST /api/v1/loans/simulate {${input}} → 200 {"tin":${q.rate},"cuota":${q.installment},"total":${q.total},"approved":${q.approved}}`,
      status: 'ok',
      bugs: ev.bugs,
    },
  }
}
