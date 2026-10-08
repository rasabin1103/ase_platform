import type { TestDesignModel } from '../../../engine/types'
import {
  INITIAL_SCHEDULE,
  OWN_ACCOUNTS,
  SIM_TODAY,
  addDays,
  cancel,
  parseDate,
  schedule,
  type ScheduleForm,
} from '../../../apps/kobalto-scheduled/scheduleLogic'

/** Modelo de diseño de pruebas del prototipo KOB-151 (transferencias programadas). */

const THIRD_PARTY = 'ES3091010001120200012345'
/** Base aislada: cuenta propia, para que cada zona pruebe solo su regla. */
const BASE: ScheduleForm = {
  iban: OWN_ACCOUNTS[0],
  beneficiary: 'Mi cuenta de ahorro',
  amount: '650',
  date: addDays(SIM_TODAY, 10),
  frequency: 'once',
  endDate: '',
}

/** «-1», «0», «365» (días desde hoy) o una fecha AAAA-MM-DD. */
function toDate(input: string): string | null {
  const t = input.trim()
  if (/^[+-]?\d{1,4}$/.test(t)) return addDays(SIM_TODAY, Number(t))
  return parseDate(t) ? t : null
}

function daysFromToday(iso: string): number {
  return Math.round(((parseDate(iso) as Date).getTime() - (parseDate(SIM_TODAY) as Date).getTime()) / 86400000)
}

function isWeekend(iso: string): boolean {
  const d = (parseDate(iso) as Date).getUTCDay()
  return d === 0 || d === 6
}

function parseAmount(raw: string): number {
  const s = raw.trim().replace(',', '.')
  return /^-?\d+(\.\d{1,2})?$/.test(s) ? Number(s) : NaN
}

/** Día del mes → primera fecha futura con ese día (octubre de 2026 tiene 31). */
function monthlyStart(day: number): string {
  return `2026-10-${String(day).padStart(2, '0')}`
}

function cancelMode(input: string): 'once' | 'next' | 'series' | null {
  const t = input.toLowerCase()
  if (/única|unica|una vez/.test(t)) return 'once'
  if (/próxima|proxima/.test(t)) return 'next'
  if (/serie|toda/.test(t)) return 'series'
  return null
}

function formFor(areaId: string, input: string): { form: ScheduleForm; cancel?: 'next' | 'series' | 'once' } | null {
  switch (areaId) {
    case 'exec_date': {
      const d = toDate(input)
      return d ? { form: { ...BASE, date: d } } : null
    }
    case 'monthly_day': {
      const day = Number(input.trim())
      return Number.isInteger(day) && day >= 1 && day <= 31 ? { form: { ...BASE, frequency: 'monthly', date: monthlyStart(day) } } : null
    }
    case 'amount':
      return { form: { ...BASE, amount: input } }
    case 'end_date': {
      const t = input.trim()
      if (!t) return { form: { ...BASE, frequency: 'weekly', endDate: '' } }
      if (!/^[+-]?\d{1,4}$/.test(t)) return null
      return { form: { ...BASE, frequency: 'weekly', endDate: addDays(BASE.date, Number(t)) } }
    }
    case 'destination':
      return { form: { ...BASE, iban: /propia/i.test(input) ? OWN_ACCOUNTS[0] : THIRD_PARTY } }
    case 'cancel': {
      const mode = cancelMode(input)
      if (!mode) return null
      return { form: { ...BASE, frequency: mode === 'once' ? 'once' : 'weekly' }, cancel: mode }
    }
    default:
      return null
  }
}

export const m01Design: TestDesignModel = {
  storyId: 'KOB-151',
  caseCost: 2,
  reviewCost: 10,
  reviewer: 'laura',
  areas: [
    {
      id: 'exec_date',
      label: 'Fecha de ejecución',
      inputLabel: 'Días desde hoy (−1, 0, 1, 365, 366…) o fecha AAAA-MM-DD',
      inputPlaceholder: 'Ej.: 0 · 1 · 365 · 2026-10-17',
      expectedQuestion: '¿Se puede programar?',
      partitions: [
        { id: 'past', label: 'Fecha pasada', technique: 'Particiones de equivalencia', core: true, requiresFlag: 'clar.date', hint: '¿Y una fecha que ya ha pasado?' },
        { id: 'today', label: 'Hoy', technique: 'Valores límite', core: true, requiresFlag: 'clar.date', hint: 'Revisa el borde inferior de las fechas permitidas…' },
        { id: 'tomorrow', label: 'Mañana (primer día válido)', technique: 'Valores límite', core: true, requiresFlag: 'clar.date', hint: '…y el primer día que sí debería valer.' },
        { id: 'within', label: 'Fecha válida intermedia', technique: 'Particiones de equivalencia', core: true, hint: '¿Tienes un caso normal que deba funcionar?' },
        { id: 'max_365', label: 'Dentro de 365 días (máximo)', technique: 'Valores límite', core: true, requiresFlag: 'clar.date', hint: 'Las fechas también tienen un máximo: pruébalo en el borde.' },
        { id: 'over_365', label: 'Más de 365 días', technique: 'Valores límite', core: true, requiresFlag: 'clar.date', hint: '¿Y un día más allá del máximo?' },
        { id: 'weekend', label: 'Cae en fin de semana', technique: 'Particiones de equivalencia', core: true, requiresFlag: 'clar.date', hint: '¿Qué pasa si la fecha es sábado o domingo?' },
      ],
    },
    {
      id: 'monthly_day',
      label: 'Mensual: día del mes',
      inputLabel: 'Día del mes en que empieza la mensual (1–31)',
      inputPlaceholder: 'Ej.: 15 · 30 · 31',
      expectedQuestion: '¿Se puede programar?',
      partitions: [
        { id: 'normal', label: 'Día 1–28 (existe en todos los meses)', technique: 'Particiones de equivalencia', core: true, hint: '¿Una mensual normal?' },
        { id: 'late', label: 'Día 29 o 30', technique: 'Particiones de equivalencia', core: true, requiresFlag: 'clar.monthly', hint: 'Hay días que no existen en todos los meses…' },
        { id: 'day31', label: 'Día 31', technique: 'Valores límite', core: true, requiresFlag: 'clar.monthly', hint: '…sobre todo el último posible.' },
      ],
    },
    {
      id: 'amount',
      label: 'Importe',
      inputLabel: 'Importe a programar',
      inputPlaceholder: 'Ej.: 650 · 5000 · 5000,01',
      expectedQuestion: '¿Se puede programar?',
      partitions: [
        { id: 'valid', label: 'Importe válido normal', technique: 'Particiones de equivalencia', core: true, hint: '¿Un importe normal?' },
        { id: 'zero', label: 'Cero o negativo', technique: 'Particiones de equivalencia', core: true, hint: '¿Y valores que no tienen sentido como importe?' },
        { id: 'max', label: 'Máximo exacto (5.000 €)', technique: 'Valores límite', core: true, requiresFlag: 'clar.limits', hint: '«Los mismos límites»: ¿los has probado aquí también, en el borde?' },
        { id: 'over_max', label: 'Por encima del máximo', technique: 'Valores límite', core: true, requiresFlag: 'clar.limits', hint: '¿Y justo por encima?' },
      ],
    },
    {
      id: 'end_date',
      label: 'Fecha de fin',
      inputLabel: 'Días de la fecha de fin respecto al inicio (−1, 0, 30) o vacío',
      inputPlaceholder: 'Ej.: -1 · 0 · 30 · (vacío)',
      expectedQuestion: '¿Se puede programar?',
      partitions: [
        { id: 'before', label: 'Fin antes del inicio', technique: 'Valores límite', core: true, hint: 'Dos fechas relacionadas: ¿qué pasa si están al revés?' },
        { id: 'same', label: 'Fin el mismo día del inicio', technique: 'Valores límite', core: true, hint: '¿Y si coinciden?' },
        { id: 'after', label: 'Fin después del inicio', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal con fin?' },
        { id: 'empty', label: 'Sin fecha de fin', technique: 'Particiones de equivalencia', core: true, hint: 'Es opcional: pruébalo sin ella.' },
      ],
    },
    {
      id: 'destination',
      label: 'Cuenta destino',
      inputLabel: '«propia» o «terceros»',
      inputPlaceholder: 'propia · terceros',
      expectedQuestion: '¿Se puede programar?',
      partitions: [
        { id: 'own', label: 'Cuenta propia', technique: 'Particiones de equivalencia', core: true, hint: '¿A una cuenta del propio cliente?' },
        { id: 'third', label: 'Cuenta de terceros', technique: 'Particiones de equivalencia', core: true, requiresFlag: 'clar.destination', hint: 'Relee la descripción y el ejemplo del alquiler: ¿a quién se paga?' },
      ],
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      inputLabel: '«única», «recurrente – próxima» o «recurrente – serie»',
      inputPlaceholder: 'única · recurrente – próxima · recurrente – serie',
      expectedQuestion: '¿Se cancela solo lo que el cliente elige?',
      partitions: [
        { id: 'once', label: 'Cancelar una única', technique: 'Particiones de equivalencia', hint: '' },
        { id: 'next', label: 'Recurrente: solo la próxima', technique: 'Flujos alternativos', core: true, requiresFlag: 'clar.cancel', hint: 'En una recurrente, ¿qué quiere cancelar el cliente exactamente?' },
        { id: 'series', label: 'Recurrente: toda la serie', technique: 'Flujos alternativos', core: true, hint: '¿Y si quiere quitarla del todo?' },
      ],
    },
  ],

  classify(areaId, input) {
    switch (areaId) {
      case 'exec_date': {
        const d = toDate(input)
        if (!d) return []
        const n = daysFromToday(d)
        const out = [n < 0 ? 'past' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : n < 365 ? 'within' : n === 365 ? 'max_365' : 'over_365']
        if (n >= 1 && n <= 365 && isWeekend(d)) out.push('weekend')
        return out
      }
      case 'monthly_day': {
        const day = Number(input.trim())
        if (!Number.isInteger(day) || day < 1 || day > 31) return []
        return [day <= 28 ? 'normal' : day === 31 ? 'day31' : 'late']
      }
      case 'amount': {
        const a = parseAmount(input)
        if (Number.isNaN(a)) return []
        return [a <= 0 ? 'zero' : a === 5000 ? 'max' : a > 5000 ? 'over_max' : 'valid']
      }
      case 'end_date': {
        const t = input.trim()
        if (!t) return ['empty']
        if (!/^[+-]?\d{1,4}$/.test(t)) return []
        const n = Number(t)
        return [n < 0 ? 'before' : n === 0 ? 'same' : 'after']
      }
      case 'destination':
        return /propia/i.test(input) ? ['own'] : /tercer/i.test(input) ? ['third'] : []
      case 'cancel': {
        const m = cancelMode(input)
        return m ? [m] : []
      }
      default:
        return []
    }
  },

  expected(areaId, input) {
    switch (areaId) {
      case 'exec_date': {
        const d = toDate(input)
        if (!d) return undefined
        const n = daysFromToday(d)
        return n >= 1 && n <= 365
      }
      case 'monthly_day':
        return formFor(areaId, input) ? true : undefined
      case 'amount': {
        const a = parseAmount(input)
        return Number.isNaN(a) ? undefined : a > 0 && a <= 5000
      }
      case 'end_date':
        return formFor(areaId, input) ? !input.trim() || Number(input.trim()) >= 0 : undefined
      case 'destination':
        return /propia|tercer/i.test(input) ? true : undefined
      case 'cancel':
        return cancelMode(input) ? true : undefined
      default:
        return undefined
    }
  },

  reveals(areaId, input, active) {
    const f = formFor(areaId, input)
    if (!f) return undefined
    const r = schedule(INITIAL_SCHEDULE, f.form, { active })
    if (r.event.bugs.length) return r.event.bugs[0]
    if (f.cancel && r.ok && r.scheduled) {
      const c = cancel(r.state, r.scheduled.id, f.cancel === 'series' ? 'series' : 'next', { active })
      return c.event.bugs[0]
    }
    return undefined
  },

  prefill(areaId, input) {
    const f = formFor(areaId, input)
    const form = f?.form ?? BASE
    return { ...form }
  },
}
