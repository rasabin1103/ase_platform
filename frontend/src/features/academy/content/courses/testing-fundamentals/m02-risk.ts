import type { RiskModel } from '../../../engine/types'

/** Priorización por riesgo de KOB-163 (referencia de un QA senior). */
export const m02Risk: RiskModel = {
  topN: 2,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'ratio',
      label: 'Límite de endeudamiento (35 %)',
      description: 'Cuota frente a ingresos: decide si se preaprueba.',
      reference: { p: 3, i: 3, why: 'Regla regulatoria con un cálculo nuevo: muy probable que falle y, si falla, el banco concede préstamos que no debe.' },
    },
    {
      id: 'age_term',
      label: 'Edad al terminar de pagar (≤ 75)',
      description: 'Regla que combina edad y plazo.',
      reference: { p: 2, i: 3, why: 'Las reglas que combinan variables casi nunca se prueban; incumplirla es un problema con Riesgos.' },
    },
    {
      id: 'tier',
      label: 'Tramo de interés (10.000 €)',
      description: 'Cambio de TIN a partir de un importe.',
      reference: { p: 2, i: 2, why: 'Umbral clásico de «>» frente a «>=»; afecta al precio, pero solo en una franja.' },
    },
    {
      id: 'rounding',
      label: 'Cálculo y redondeo de la cuota',
      description: 'Sistema francés, redondeo al céntimo.',
      reference: { p: 2, i: 2, why: 'Errores pequeños pero repetidos en miles de préstamos; la oferta mostrada es vinculante.' },
    },
    {
      id: 'age',
      label: 'Edad (18–70)',
      description: 'Rango de edad del solicitante.',
      reference: { p: 2, i: 2, why: 'Validación sencilla, pero un menor de edad sería un problema legal.' },
    },
    {
      id: 'amount',
      label: 'Importe (1.000–30.000 €)',
      description: 'Rango y múltiplos de 100 €.',
      reference: { p: 1, i: 2, why: 'Validación sencilla y visible.' },
    },
    {
      id: 'term',
      label: 'Plazo (12–84 meses)',
      description: 'Rango del plazo.',
      reference: { p: 1, i: 2, why: 'Validación sencilla y visible.' },
    },
  ],
}
