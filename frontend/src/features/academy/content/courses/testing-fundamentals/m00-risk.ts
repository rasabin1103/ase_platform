import type { RiskModel } from '../../../engine/types'

/** Priorización por riesgo de KOB-142 (referencia de un QA senior). */
export const m00Risk: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'amount',
      label: 'Importe',
      description: 'Validación de cantidades, decimales y límite por operación.',
      reference: { p: 3, i: 3, why: 'Lógica nueva con números, formatos y límites (alta probabilidad) y mueve dinero (impacto máximo).' },
    },
    {
      id: 'double',
      label: 'Doble envío',
      description: 'Pulsar «Confirmar» varias veces o reintentar.',
      reference: { p: 2, i: 3, why: 'Nadie lo prueba en local y un duplicado es dinero perdido.' },
    },
    {
      id: 'daily',
      label: 'Límite diario',
      description: 'Acumulado de varias transferencias en el mismo día.',
      reference: { p: 2, i: 3, why: 'Requiere secuencias que el dev no suele probar; incumplirlo es un problema regulatorio.' },
    },
    {
      id: 'iban',
      label: 'IBAN',
      description: 'Formato y validez de la cuenta de destino.',
      reference: { p: 2, i: 2, why: 'Validación con reglas propias; un error genera devoluciones y quejas, pero el banco las recupera.' },
    },
    {
      id: 'beneficiary',
      label: 'Beneficiario',
      description: 'Nombre del destinatario.',
      reference: { p: 1, i: 1, why: 'Campo de texto simple; un error es fácil de detectar y de bajo impacto.' },
    },
    {
      id: 'concept',
      label: 'Concepto',
      description: 'Texto opcional de hasta 140 caracteres.',
      reference: { p: 1, i: 1, why: 'Opcional y sin efecto en el dinero.' },
    },
  ],
}
