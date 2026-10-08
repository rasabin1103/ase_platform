import type { TestDesignModel } from '../../../engine/types'
import { SPEC, simulate, specQuote, type LoanForm } from '../../../apps/kobalto-loans/loanLogic'

/**
 * Diseño de pruebas del simulador de préstamos (KOB-163): varias variables
 * que interactúan. Base válida y una variable cada vez en sus bordes, más
 * las combinaciones críticas (endeudamiento, edad + plazo) y el cálculo
 * comparado con el oráculo.
 */
const BASE: LoanForm = { age: '35', income: '2500', amount: '6000', term: '48' }
const RATIO_LOAN = { amount: '15000', term: '36' } // cuota 455,99 € → límite de ingresos ≈ 1.302,83 €

function num(raw: string): number {
  const s = raw.trim().replace(/\./g, '').replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN
}

function pair(raw: string): [number, number] | null {
  const m = raw.split(/[;,/\s]+/).filter(Boolean).map(num)
  return m.length === 2 && m.every((n) => !Number.isNaN(n)) ? [m[0], m[1]] : null
}

function formFor(areaId: string, input: string): LoanForm | null {
  switch (areaId) {
    case 'age':
      return { ...BASE, age: input }
    case 'amount':
    case 'tier':
      return { ...BASE, amount: input }
    case 'term':
      return { ...BASE, term: input }
    case 'income':
      return { ...BASE, income: input }
    case 'ratio':
      return { ...BASE, ...RATIO_LOAN, income: input }
    case 'age_term': {
      const p = pair(input)
      return p ? { ...BASE, income: '4000', amount: '12000', age: String(p[0]), term: String(p[1]) } : null
    }
    case 'rounding': {
      const p = pair(input)
      return p ? { ...BASE, income: '5000', amount: String(p[0]), term: String(p[1]) } : null
    }
    default:
      return null
  }
}

export const m02Design: TestDesignModel = {
  storyId: 'KOB-163',
  caseCost: 2,
  reviewCost: 10,
  reviewer: 'laura',
  areas: [
    {
      id: 'age',
      label: 'Edad',
      inputLabel: 'Edad del solicitante (resto: base válida)',
      inputPlaceholder: 'Ej.: 17 · 18 · 70 · 71',
      expectedQuestion: '¿Se puede simular (edad válida)?',
      partitions: [
        { id: 'just_below', label: '17 (justo por debajo del mínimo)', technique: 'Valores límite', core: true, hint: 'Prueba el borde inferior por fuera…' },
        { id: 'min', label: '18 (mínimo)', technique: 'Valores límite', core: true, hint: '…y por dentro.' },
        { id: 'valid', label: 'Edad intermedia válida', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal?' },
        { id: 'max', label: '70 (máximo)', technique: 'Valores límite', core: true, hint: 'El máximo también es un borde…' },
        { id: 'just_above', label: '71 (justo por encima del máximo)', technique: 'Valores límite', core: true, hint: '…y un año más.' },
        { id: 'out', label: 'Muy fuera de rango', technique: 'Particiones de equivalencia', hint: '' },
      ],
    },
    {
      id: 'amount',
      label: 'Importe',
      inputLabel: 'Importe (resto: base válida)',
      inputPlaceholder: 'Ej.: 999 · 1000 · 30000 · 30100 · 6050',
      expectedQuestion: '¿Se puede simular (importe válido)?',
      partitions: [
        { id: 'just_below', label: 'Por debajo de 1.000 €', technique: 'Valores límite', core: true, hint: 'Borde inferior por fuera…' },
        { id: 'min', label: '1.000 € (mínimo)', technique: 'Valores límite', core: true, hint: '…y por dentro.' },
        { id: 'valid', label: 'Importe válido normal', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal?' },
        { id: 'max', label: '30.000 € (máximo)', technique: 'Valores límite', core: true, hint: 'El máximo…' },
        { id: 'just_above', label: 'Por encima de 30.000 €', technique: 'Valores límite', core: true, hint: '…y justo por encima.' },
        { id: 'not_multiple', label: 'No múltiplo de 100 €', technique: 'Particiones de equivalencia', core: true, hint: 'Lee bien la regla del importe: no solo hay mínimo y máximo.' },
      ],
    },
    {
      id: 'term',
      label: 'Plazo',
      inputLabel: 'Plazo en meses (resto: base válida)',
      inputPlaceholder: 'Ej.: 11 · 12 · 84 · 85',
      expectedQuestion: '¿Se puede simular (plazo válido)?',
      partitions: [
        { id: 'just_below', label: '11 meses', technique: 'Valores límite', core: true, hint: 'Borde inferior por fuera…' },
        { id: 'min', label: '12 meses (mínimo)', technique: 'Valores límite', core: true, hint: '…y por dentro.' },
        { id: 'valid', label: 'Plazo válido normal', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal?' },
        { id: 'max', label: '84 meses (máximo)', technique: 'Valores límite', core: true, hint: 'El máximo…' },
        { id: 'just_above', label: '85 meses', technique: 'Valores límite', core: true, hint: '…y uno más.' },
      ],
    },
    {
      id: 'income',
      label: 'Ingresos',
      inputLabel: 'Ingresos netos al mes (resto: base válida)',
      inputPlaceholder: 'Ej.: 999 · 1000 · 2500',
      expectedQuestion: '¿Se puede simular (ingresos suficientes)?',
      partitions: [
        { id: 'just_below', label: 'Por debajo de 1.000 €', technique: 'Valores límite', core: true, hint: 'Los ingresos tienen un mínimo: pruébalo por fuera…' },
        { id: 'min', label: '1.000 € (mínimo)', technique: 'Valores límite', core: true, hint: '…y justo en él.' },
        { id: 'valid', label: 'Ingresos holgados', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso normal?' },
      ],
    },
    {
      id: 'tier',
      label: 'Tramo de interés',
      inputLabel: 'Importe alrededor de 10.000 € (compara el TIN con la política)',
      inputPlaceholder: 'Ej.: 9500 · 9900 · 10000 · 10100',
      expectedQuestion: '¿Se puede simular?',
      partitions: [
        { id: 'below_far', label: 'Bastante por debajo (9.000–9.800 €)', technique: 'Particiones de equivalencia', core: true, hint: 'El tipo de interés cambia en un umbral: prueba lejos de él…' },
        { id: 'below', label: 'Justo por debajo (9.900 €)', technique: 'Valores límite', core: true, hint: '…justo antes…' },
        { id: 'exact', label: 'Exactamente 10.000 €', technique: 'Valores límite', core: true, hint: '…justo en el umbral…' },
        { id: 'above', label: 'Por encima (10.100 € o más)', technique: 'Valores límite', core: true, hint: '…y después.' },
      ],
    },
    {
      id: 'ratio',
      label: 'Endeudamiento (35 %)',
      inputLabel: 'Ingresos para un préstamo de 15.000 € a 36 meses (cuota 455,99 €)',
      inputPlaceholder: 'Ej.: 1100 · 1250 · 1310 · 2000',
      expectedQuestion: '¿Se preaprueba?',
      partitions: [
        { id: 'approve', label: 'Ratio ≤ 35 % (ingresos ≥ 1.302,83 €)', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso que deba aprobarse?' },
        { id: 'reject_near', label: 'Ratio entre 35 % y 40 %', technique: 'Valores límite', core: true, hint: 'Acércate al límite del 35 % por encima, sin pasarte mucho…' },
        { id: 'reject_far', label: 'Ratio por encima del 40 %', technique: 'Particiones de equivalencia', core: true, hint: '…y bastante por encima.' },
      ],
    },
    {
      id: 'age_term',
      label: 'Edad + plazo (≤ 75)',
      inputLabel: '«edad;plazo» para 12.000 € con 4.000 € de ingresos',
      inputPlaceholder: 'Ej.: 60;84 · 68;84 · 70;84',
      expectedQuestion: '¿Se preaprueba?',
      partitions: [
        { id: 'under', label: 'Termina antes de los 75', technique: 'Particiones de equivalencia', core: true, hint: '¿Un caso que deba aprobarse?' },
        { id: 'exact', label: 'Termina justo a los 75', technique: 'Valores límite', core: true, hint: 'Hay una regla que combina dos variables: busca su borde…' },
        { id: 'over', label: 'Termina después de los 75', technique: 'Valores límite', core: true, hint: '…y pásalo.' },
      ],
    },
    {
      id: 'rounding',
      label: 'Cálculo de la cuota',
      inputLabel: '«importe;plazo» para comparar la cuota con la tabla de Riesgos',
      inputPlaceholder: 'Ej.: 6000;48 · 10000;60',
      expectedQuestion: '¿Se puede simular?',
      partitions: [
        { id: 'oracle', label: 'Caso comparado con el oráculo', technique: 'Oráculo de pruebas', core: true, hint: 'Las cuotas también se prueban: compáralas con un resultado de referencia.' },
      ],
    },
  ],

  classify(areaId, input) {
    const f = formFor(areaId, input)
    if (!f) return []
    const v = num(input)
    switch (areaId) {
      case 'age':
        if (Number.isNaN(v)) return []
        return [v === 17 ? 'just_below' : v === 18 ? 'min' : v === 70 ? 'max' : v === 71 ? 'just_above' : v > 18 && v < 70 ? 'valid' : 'out']
      case 'amount': {
        if (Number.isNaN(v)) return []
        const out = [v < SPEC.amountMin ? 'just_below' : v === SPEC.amountMin ? 'min' : v === SPEC.amountMax ? 'max' : v > SPEC.amountMax ? 'just_above' : 'valid']
        if (v % 100 !== 0) out.push('not_multiple')
        return out
      }
      case 'term':
        if (Number.isNaN(v)) return []
        return [v < 12 ? 'just_below' : v === 12 ? 'min' : v === 84 ? 'max' : v > 84 ? 'just_above' : 'valid']
      case 'income':
        if (Number.isNaN(v)) return []
        return [v < 1000 ? 'just_below' : v === 1000 ? 'min' : 'valid']
      case 'tier':
        if (Number.isNaN(v)) return []
        return [v === 10000 ? 'exact' : v > 10000 ? 'above' : v >= 9900 ? 'below' : v >= 9000 ? 'below_far' : 'below_far']
      case 'ratio': {
        if (Number.isNaN(v) || v <= 0) return []
        const ratio = 455.99 / v
        return [ratio <= 0.35 ? 'approve' : ratio <= 0.4 ? 'reject_near' : 'reject_far']
      }
      case 'age_term': {
        const p = pair(input)
        if (!p) return []
        const end = p[0] + p[1] / 12
        return [end < 75 ? 'under' : end === 75 ? 'exact' : 'over']
      }
      case 'rounding':
        return ['oracle']
      default:
        return []
    }
  },

  expected(areaId, input) {
    const f = formFor(areaId, input)
    if (!f) return undefined
    const r = specQuote(f)
    if (areaId === 'ratio' || areaId === 'age_term') return r.quote ? r.quote.approved : false
    return !r.error
  },

  reveals(areaId, input, active) {
    const f = formFor(areaId, input)
    return f ? simulate(f, { active }).event.bugs[0] : undefined
  },

  prefill(areaId, input) {
    return { ...(formFor(areaId, input) ?? BASE) }
  },
}
