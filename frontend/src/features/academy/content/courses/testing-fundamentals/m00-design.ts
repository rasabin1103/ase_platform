import type { TestDesignModel } from '../../../engine/types'
import { INITIAL_BANK, SPEC, isValidIban, normalizeIban, submitTransfer, type BankState } from '../../../apps/kobalto/transferLogic'

/**
 * Modelo de diseño de pruebas de KOB-142 (Transferencias).
 *
 * El alumno escribe casos (zona + valor + resultado esperado). Aquí se
 * define qué particiones cubre cada caso, el resultado correcto según la
 * especificación aclarada por la PO y qué bug sembrado revelaría.
 */

const VALID_IBAN = 'ES3091010001120200012345'
const BASE_FORM = { iban: VALID_IBAN, beneficiary: 'Ana López', amount: '100', concept: '' }

interface ParsedAmount {
  numeric: boolean
  value: number
  decimals: number
  hasComma: boolean
  empty: boolean
}

export function parseAmount(raw: string): ParsedAmount {
  const s = raw.trim()
  const hasComma = s.includes(',')
  const normalized = s.replace(',', '.')
  const numeric = /^-?\d+(\.\d+)?$/.test(normalized)
  const decimals = numeric && normalized.includes('.') ? normalized.split('.')[1].length : 0
  return { numeric, value: numeric ? Number(normalized) : NaN, decimals, hasComma, empty: s === '' }
}

function parseSequence(raw: string): ParsedAmount[] {
  return raw
    .split(/[+;]|\s+y\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseAmount)
}

function amountIsValid(a: ParsedAmount): boolean {
  return a.numeric && a.decimals <= 2 && a.value >= SPEC.min && a.value <= SPEC.maxPerOperation
}

function firstBug(events: { bugs: string[] }[]): string | undefined {
  return events.flatMap((e) => e.bugs)[0]
}

export const m00Design: TestDesignModel = {
  storyId: 'KOB-142',
  caseCost: 2,
  reviewCost: 10,
  reviewer: 'laura',
  areas: [
    {
      id: 'amount',
      label: 'Importe',
      inputLabel: 'Importe que escribirías',
      inputPlaceholder: 'Ej.: 150 · 0 · 5000,01',
      expectedQuestion: '¿La transferencia se acepta?',
      partitions: [
        { id: 'valid', label: 'Importe válido normal', technique: 'Particiones de equivalencia', core: true, hint: '¿Tienes un caso «normal» que deba funcionar?' },
        { id: 'zero', label: 'Cero', technique: 'Particiones de equivalencia', core: true, hint: '¿Qué pasa con valores que no tienen sentido como importe?' },
        { id: 'negative', label: 'Importe negativo', technique: 'Particiones de equivalencia', core: true, hint: '¿Y por debajo de cero?' },
        { id: 'min_boundary', label: 'Mínimo exacto (0,01 €)', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: 'Revisa los bordes del rango permitido, por abajo…' },
        { id: 'max_boundary', label: 'Máximo exacto (5.000,00 €)', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: '…y por arriba: justo en el límite.' },
        { id: 'above_max_boundary', label: 'Justo por encima del máximo (5.000,01 €)', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: 'Y un céntimo por encima del límite.' },
        { id: 'above_max', label: 'Muy por encima del máximo', technique: 'Particiones de equivalencia', requiresFlag: 'rules.known', hint: '' },
        { id: 'comma_decimal', label: 'Decimales con coma (10,50)', technique: 'Particiones de formato', core: true, hint: 'Piensa en cómo escribe un cliente español los decimales.' },
        { id: 'too_many_decimals', label: 'Más de 2 decimales', technique: 'Particiones de formato', requiresFlag: 'rules.known', hint: '' },
        { id: 'non_numeric', label: 'Texto o vacío', technique: 'Particiones de equivalencia', hint: '' },
      ],
    },
    {
      id: 'iban',
      label: 'IBAN',
      inputLabel: 'IBAN que escribirías',
      inputPlaceholder: 'Ej.: ES30 9101 0001 1202 0001 2345',
      expectedQuestion: '¿La transferencia se acepta?',
      partitions: [
        { id: 'valid', label: 'IBAN válido', technique: 'Particiones de equivalencia', core: true, hint: '¿Tienes un IBAN correcto de los datos de prueba?' },
        { id: 'bad_checksum', label: 'Formato correcto, dígitos de control erróneos', technique: 'Datos inválidos con formato válido', core: true, hint: 'Un IBAN puede «parecer» correcto y no serlo: ¿qué lo valida de verdad?' },
        { id: 'bad_format', label: 'Formato incorrecto (longitud, país…)', technique: 'Particiones de equivalencia', core: true, hint: '¿Y algo que ni siquiera tenga forma de IBAN español?' },
        { id: 'with_spaces', label: 'IBAN válido escrito con espacios', technique: 'Particiones de formato', core: true, hint: '¿Y si el cliente lo copia tal cual, con espacios?' },
        { id: 'empty', label: 'Vacío', technique: 'Particiones de equivalencia', hint: '' },
      ],
    },
    {
      id: 'beneficiary',
      label: 'Beneficiario',
      inputLabel: 'Nombre del beneficiario',
      inputPlaceholder: 'Ej.: Ana López (o déjalo vacío)',
      expectedQuestion: '¿La transferencia se acepta?',
      partitions: [
        { id: 'filled', label: 'Con nombre', technique: 'Particiones de equivalencia', core: true, hint: '¿Un beneficiario normal?' },
        { id: 'empty', label: 'Vacío o solo espacios', technique: 'Particiones de equivalencia', core: true, hint: 'Los campos obligatorios también se prueban vacíos.' },
      ],
    },
    {
      id: 'concept',
      label: 'Concepto',
      inputLabel: 'Concepto (puedes escribir «140 caracteres» o «141 caracteres»)',
      inputPlaceholder: 'Ej.: Cena del viernes · 141 caracteres',
      expectedQuestion: '¿La transferencia se acepta?',
      partitions: [
        { id: 'normal', label: 'Concepto normal', technique: 'Particiones de equivalencia', hint: '' },
        { id: 'empty', label: 'Vacío (es opcional)', technique: 'Particiones de equivalencia', hint: '' },
        { id: 'max_140', label: 'Exactamente 140 caracteres', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: 'Los textos también tienen límites: pruébalos en el borde.' },
        { id: 'over_140', label: 'Más de 140 caracteres', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: '¿Y justo por encima?' },
      ],
    },
    {
      id: 'daily',
      label: 'Límite diario',
      inputLabel: 'Secuencia de importes del mismo día',
      inputPlaceholder: 'Ej.: 4000 + 2500',
      expectedQuestion: '¿Se acepta la última transferencia?',
      partitions: [
        { id: 'under', label: 'Acumulado por debajo de 6.000 €', technique: 'Pruebas de secuencia', core: true, requiresFlag: 'rules.known', hint: 'Algunos límites solo aparecen al encadenar operaciones.' },
        { id: 'exact', label: 'Acumulado exacto de 6.000 €', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: 'Prueba el acumulado justo en el límite…' },
        { id: 'over', label: 'Acumulado por encima de 6.000 €', technique: 'Valores límite', core: true, requiresFlag: 'rules.known', hint: '…y pasándolo.' },
        { id: 'single', label: 'Una sola operación', technique: 'Pruebas de secuencia', hint: '' },
      ],
    },
    {
      id: 'double',
      label: 'Doble envío',
      inputLabel: 'Qué harás (p. ej. «doble clic en Confirmar»)',
      inputPlaceholder: 'Ej.: doble clic en Confirmar',
      expectedQuestion: '¿Se acepta la segunda transferencia?',
      partitions: [
        { id: 'double_click', label: 'Doble clic / reintento', technique: 'Comportamiento real del usuario', core: true, hint: '¿Qué hace un usuario impaciente con el botón de confirmar?' },
      ],
    },
  ],

  classify(areaId, raw) {
    const input = raw ?? ''
    switch (areaId) {
      case 'amount': {
        const a = parseAmount(input)
        if (!a.numeric) return ['non_numeric']
        const out: string[] = []
        if (a.hasComma) out.push('comma_decimal')
        if (a.decimals > 2) out.push('too_many_decimals')
        const v = a.value
        if (v < 0) out.push('negative')
        else if (v === 0) out.push('zero')
        else if (v === SPEC.min) out.push('min_boundary')
        else if (v === SPEC.maxPerOperation) out.push('max_boundary')
        else if (v > SPEC.maxPerOperation && v < SPEC.maxPerOperation + 1) out.push('above_max_boundary')
        else if (v >= SPEC.maxPerOperation + 1) out.push('above_max')
        else if (a.decimals <= 2) out.push('valid')
        return out
      }
      case 'iban': {
        const n = normalizeIban(input)
        if (!n) return ['empty']
        if (!/^ES\d{22}$/.test(n)) return ['bad_format']
        if (!isValidIban(n)) return ['bad_checksum']
        return /\s/.test(input.trim()) ? ['valid', 'with_spaces'] : ['valid']
      }
      case 'beneficiary':
        return input.trim() ? ['filled'] : ['empty']
      case 'concept': {
        const len = conceptLength(input)
        if (len === 0) return ['empty']
        if (len === SPEC.conceptMax) return ['max_140']
        if (len > SPEC.conceptMax) return ['over_140']
        return ['normal']
      }
      case 'daily': {
        const seq = parseSequence(input)
        if (seq.length < 2 || seq.some((a) => !a.numeric)) return seq.length === 1 ? ['single'] : []
        const total = seq.reduce((n, a) => n + a.value, 0)
        return [total < SPEC.dailyLimit ? 'under' : total === SPEC.dailyLimit ? 'exact' : 'over']
      }
      case 'double':
        return ['double_click']
      default:
        return []
    }
  },

  expected(areaId, raw) {
    const input = raw ?? ''
    switch (areaId) {
      case 'amount': {
        const a = parseAmount(input)
        return amountIsValid(a)
      }
      case 'iban':
        return isValidIban(input)
      case 'beneficiary':
        return input.trim().length > 0
      case 'concept':
        return conceptLength(input) <= SPEC.conceptMax
      case 'daily': {
        const seq = parseSequence(input)
        if (seq.length === 0 || seq.some((a) => !amountIsValid(a))) return undefined
        return seq.reduce((n, a) => n + a.value, 0) <= SPEC.dailyLimit
      }
      case 'double':
        return false
      default:
        return undefined
    }
  },

  reveals(areaId, raw, active) {
    const input = raw ?? ''
    const run = (form: Partial<typeof BASE_FORM>, opts: { concurrent?: boolean } = {}) =>
      submitTransfer(INITIAL_BANK, { ...BASE_FORM, ...form }, { ...opts, active }).event
    switch (areaId) {
      case 'amount':
        return firstBug([run({ amount: input })])
      case 'iban':
        return firstBug([run({ iban: input })])
      case 'beneficiary':
        return firstBug([run({ beneficiary: input })])
      case 'concept':
        return firstBug([run({ concept: conceptText(input) })])
      case 'daily': {
        let bank: BankState = INITIAL_BANK
        const events = parseSequence(input).map((a) => {
          const r = submitTransfer(bank, { ...BASE_FORM, amount: String(a.value) }, { active })
          bank = r.bank
          return r.event
        })
        return firstBug(events)
      }
      case 'double':
        return firstBug([run({}, { concurrent: true })])
      default:
        return undefined
    }
  },

  prefill(areaId, raw) {
    const input = raw ?? ''
    switch (areaId) {
      case 'amount':
        return { ...BASE_FORM, amount: input }
      case 'iban':
        return { ...BASE_FORM, iban: input }
      case 'beneficiary':
        return { ...BASE_FORM, beneficiary: input }
      case 'concept':
        return { ...BASE_FORM, concept: conceptText(input) }
      case 'daily':
        return { ...BASE_FORM, amount: String(parseSequence(input)[0]?.value ?? '') }
      default:
        return { ...BASE_FORM }
    }
  },
}

/** «141 caracteres» → longitud 141; cualquier otro texto, su longitud. */
function conceptLength(input: string): number {
  const m = input.trim().match(/^(\d{1,4})\s*(caracteres|chars?|c)$/i)
  return m ? Number(m[1]) : input.length
}

function conceptText(input: string): string {
  const m = input.trim().match(/^(\d{1,4})\s*(caracteres|chars?|c)$/i)
  return m ? 'x'.repeat(Number(m[1])) : input
}

