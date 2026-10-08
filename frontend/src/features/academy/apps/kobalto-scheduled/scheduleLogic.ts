import type { AppEvent } from '../../engine/types'
import { isValidIban, normalizeIban, formatEur } from '../kobalto/transferLogic'

/**
 * App bajo prueba de la misión 1: «Transferencias programadas» (KOB-151),
 * el prototipo que Diego construye el martes.
 *
 * Varios bugs nacen de requisitos ambiguos que nadie aclaró antes de
 * desarrollar (BugDef.preventedBy): si el alumno los aclaró a tiempo, el
 * motor los quita de `activeBugs` y aquí nunca se manifiestan.
 *
 * Especificación aclarada:
 * - Fecha de ejecución: desde mañana hasta 365 días; si cae en fin de semana,
 *   se ejecuta el siguiente lunes.
 * - Mensual en día 29–31: en meses más cortos, el último día del mes.
 * - Máximo 5.000 € por operación, validado al programar.
 * - Destino: cualquier cuenta válida (propia o de terceros).
 * - Fecha de fin (opcional, recurrentes) posterior o igual a la de inicio.
 * - Cancelar una recurrente: el cliente elige «solo la próxima» o «toda la serie».
 */

export const SCHEDULE_BUGS = {
  pastDate: 'M1-B1',
  monthlySkips: 'M1-B2',
  noLimitAtSchedule: 'M1-B3',
  cancelWholeSeries: 'M1-B4',
  ownAccountsOnly: 'M1-B5',
  endBeforeStart: 'M1-B6',
} as const

/** "Hoy" en la simulación: martes 6 de octubre de 2026. */
export const SIM_TODAY = '2026-10-06'
export const OWN_ACCOUNTS = ['ES8491010001150300067890']
const MAX_AMOUNT = 5000

export type Frequency = 'once' | 'weekly' | 'monthly'

export interface ScheduleForm {
  iban: string
  beneficiary: string
  amount: string
  date: string
  frequency: Frequency
  endDate: string
}

export interface Scheduled {
  id: number
  iban: string
  beneficiary: string
  amount: number
  date: string
  frequency: Frequency
  endDate?: string
  executions: string[]
}

export interface ScheduleState {
  scheduled: Scheduled[]
  nextId: number
}

export const INITIAL_SCHEDULE: ScheduleState = { scheduled: [], nextId: 1 }

export interface BuildOpts {
  active?: string[]
  fixed?: string[]
}

// ----------------------------------------------------------- fechas
export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCMonth() === Number(m[2]) - 1 ? d : null
}

export function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso) as Date
  d.setUTCDate(d.getUTCDate() + days)
  return fmt(d)
}

function daysBetween(a: string, b: string): number {
  return Math.round(((parseDate(b) as Date).getTime() - (parseDate(a) as Date).getTime()) / 86400000)
}

function nextBusinessDay(iso: string): string {
  const d = parseDate(iso) as Date
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() + 1)
  return fmt(d)
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

export function formatDateEs(iso: string): string {
  const d = parseDate(iso)
  return d ? d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : iso
}

/** Próximas ejecuciones (hasta 4) según la especificación o con el bug de meses cortos. */
export function executions(form: Pick<ScheduleForm, 'date' | 'frequency' | 'endDate'>, monthlySkips: boolean): string[] {
  const start = parseDate(form.date)
  if (!start) return []
  const end = form.endDate ? parseDate(form.endDate) : null
  const out: string[] = []
  if (form.frequency === 'once') return [nextBusinessDay(form.date)]
  if (form.frequency === 'weekly') {
    for (let k = 0; out.length < 4 && k < 60; k++) out.push(nextBusinessDay(addDays(form.date, 7 * k)))
  } else {
    const day = start.getUTCDate()
    for (let k = 0; out.length < 4 && k < 24; k++) {
      const y = start.getUTCFullYear() + Math.floor((start.getUTCMonth() + k) / 12)
      const m = (start.getUTCMonth() + k) % 12
      const dim = daysInMonth(y, m)
      if (day > dim && monthlySkips) continue
      out.push(nextBusinessDay(fmt(new Date(Date.UTC(y, m, Math.min(day, dim))))))
    }
  }
  return end ? out.filter((d) => (parseDate(d) as Date) <= end) : out
}

function parseAmount(raw: string): number {
  const s = raw.trim().replace(',', '.')
  return /^-?\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN
}

export interface ScheduleResult {
  state: ScheduleState
  ok: boolean
  message: string
  scheduled?: Scheduled
  event: AppEvent
}

function mask(iban: string): string {
  return iban.length > 8 ? `${iban.slice(0, 4)}…${iban.slice(-4)}` : iban
}

export function schedule(state: ScheduleState, form: ScheduleForm, opts: BuildOpts = {}): ScheduleResult {
  const active = new Set(opts.active ?? Object.values(SCHEDULE_BUGS))
  const fixed = new Set(opts.fixed ?? [])
  const has = (b: string) => active.has(b) && !fixed.has(b)
  const iban = normalizeIban(form.iban)
  const describe = `importe "${form.amount}", fecha ${form.date || '—'}, ${form.frequency}${form.endDate ? ` hasta ${form.endDate}` : ''}, IBAN ${mask(iban) || '—'}`
  const reject = (message: string, bugs: string[] = []): ScheduleResult => ({
    state,
    ok: false,
    message,
    event: {
      app: 'kobalto-scheduled',
      action: 'schedule',
      summary: `Error al programar (${describe}): ${message}`,
      technical: `POST /api/v1/scheduled-transfers {"date":"${form.date}","frequency":"${form.frequency}"} → 422 {"error":"${message}"}`,
      status: 'error',
      bugs,
    },
  })

  if (!isValidIban(iban)) return reject('IBAN no válido')
  if (has(SCHEDULE_BUGS.ownAccountsOnly) && !OWN_ACCOUNTS.includes(iban))
    return reject('Solo puedes programar transferencias entre tus cuentas', [SCHEDULE_BUGS.ownAccountsOnly])
  if (!form.beneficiary.trim()) return reject('Indica el nombre del beneficiario')
  const amount = parseAmount(form.amount)
  if (Number.isNaN(amount) || amount <= 0) return reject('Importe no válido')
  if (amount > MAX_AMOUNT && !has(SCHEDULE_BUGS.noLimitAtSchedule)) return reject('Supera el límite por operación de 5.000 €')
  if (!parseDate(form.date)) return reject('Fecha no válida')
  const days = daysBetween(SIM_TODAY, form.date)
  if (days > 365) return reject('La fecha no puede superar un año')
  if (days < 1 && !has(SCHEDULE_BUGS.pastDate)) return reject('La fecha debe ser a partir de mañana')
  const recurring = form.frequency !== 'once'
  const endDate = recurring && form.endDate.trim() ? form.endDate.trim() : ''
  if (endDate && !parseDate(endDate)) return reject('Fecha de fin no válida')
  if (endDate && endDate < form.date && !has(SCHEDULE_BUGS.endBeforeStart))
    return reject('La fecha de fin debe ser posterior a la de inicio')

  const shown = executions({ date: form.date, frequency: form.frequency, endDate }, has(SCHEDULE_BUGS.monthlySkips))
  const correct = executions({ date: form.date, frequency: form.frequency, endDate }, false)

  const bugs: string[] = []
  if (days < 1) bugs.push(SCHEDULE_BUGS.pastDate)
  if (amount > MAX_AMOUNT) bugs.push(SCHEDULE_BUGS.noLimitAtSchedule)
  if (endDate && endDate < form.date) bugs.push(SCHEDULE_BUGS.endBeforeStart)
  if (shown.join() !== correct.join()) bugs.push(SCHEDULE_BUGS.monthlySkips)

  const item: Scheduled = {
    id: state.nextId,
    iban,
    beneficiary: form.beneficiary.trim(),
    amount,
    date: form.date,
    frequency: form.frequency,
    endDate: endDate || undefined,
    executions: shown,
  }
  const next: ScheduleState = { scheduled: [item, ...state.scheduled], nextId: state.nextId + 1 }
  const freqLabel = { once: 'una vez', weekly: 'semanal', monthly: 'mensual' }[form.frequency]
  return {
    state: next,
    ok: true,
    message: 'Transferencia programada',
    scheduled: item,
    event: {
      app: 'kobalto-scheduled',
      action: 'schedule',
      summary: `Programada ${formatEur(amount)} a ${item.beneficiary} (${mask(iban)}), ${freqLabel}, inicio ${form.date}${endDate ? `, fin ${endDate}` : ''} · próximas: ${shown.join(', ') || 'ninguna'}`,
      technical: `POST /api/v1/scheduled-transfers {"date":"${form.date}","frequency":"${form.frequency}","amount":${amount}} → 201 {"id":"SCH-${item.id}","next":${JSON.stringify(shown)}}`,
      status: 'ok',
      bugs,
    },
  }
}

/** Cancelar. `mode` lo elige el cliente en recurrentes (salvo con el bug M1-B4). */
export function cancel(
  state: ScheduleState,
  id: number,
  mode: 'next' | 'series',
  opts: BuildOpts = {},
): { state: ScheduleState; event: AppEvent } {
  const active = new Set(opts.active ?? Object.values(SCHEDULE_BUGS))
  const fixed = new Set(opts.fixed ?? [])
  const askFirst = !(active.has(SCHEDULE_BUGS.cancelWholeSeries) && !fixed.has(SCHEDULE_BUGS.cancelWholeSeries))
  const item = state.scheduled.find((x) => x.id === id)
  if (!item) return { state, event: { app: 'kobalto-scheduled', action: 'cancel', summary: 'Nada que cancelar', technical: '', status: 'error', bugs: [] } }
  const recurring = item.frequency !== 'once'
  const effective = askFirst ? mode : 'series'
  let scheduled: Scheduled[]
  if (recurring && effective === 'next' && item.executions.length > 1) {
    scheduled = state.scheduled.map((x) => (x.id === id ? { ...x, executions: x.executions.slice(1) } : x))
  } else {
    scheduled = state.scheduled.filter((x) => x.id !== id)
  }
  const bugs = recurring && !askFirst ? [SCHEDULE_BUGS.cancelWholeSeries] : []
  return {
    state: { ...state, scheduled },
    event: {
      app: 'kobalto-scheduled',
      action: 'cancel',
      summary: `Cancelada ${recurring ? (effective === 'next' ? 'la próxima ejecución de' : 'toda la serie de') : ''} la programada SCH-${id} (${formatEur(item.amount)} a ${item.beneficiary})${recurring && !askFirst ? ' sin preguntar' : ''}`,
      technical: `DELETE /api/v1/scheduled-transfers/SCH-${id}${askFirst ? `?scope=${effective}` : ''} → 204`,
      status: 'ok',
      bugs,
    },
  }
}

export function cancelAsksScope(opts: BuildOpts = {}): boolean {
  const active = new Set(opts.active ?? Object.values(SCHEDULE_BUGS))
  return !(active.has(SCHEDULE_BUGS.cancelWholeSeries) && !new Set(opts.fixed ?? []).has(SCHEDULE_BUGS.cancelWholeSeries))
}
