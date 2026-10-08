import type { RiskModel } from '../../../engine/types'

/** Priorización por riesgo de KOB-170 (referencia de un QA senior). */
export const m03Risk: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'refund_source',
      label: 'Devolver desde estados no permitidos',
      description: 'Devoluciones sobre cobros anulados, solo autorizados o en disputa.',
      reference: { p: 3, i: 3, why: 'Es donde se pierde dinero de verdad y nadie lo prueba porque «el botón no debería usarse». Ya pasó en producción con las disputas.' },
    },
    {
      id: 'cumulative',
      label: 'Importe acumulado de devoluciones',
      description: 'Varias devoluciones parciales sobre el mismo cobro.',
      reference: { p: 2, i: 3, why: 'Validar cada devolución contra el importe original y no contra lo pendiente es un error clásico; si falla, se devuelve más de lo cobrado.' },
    },
    {
      id: 'dispute',
      label: 'Disputas y contracargos',
      description: 'Abrir, ganar y perder disputas; su relación con las devoluciones.',
      reference: { p: 2, i: 3, why: 'Ciclo poco usado y con dinero en juego: una disputa perdida más una devolución es pagar dos veces.' },
    },
    {
      id: 'capture',
      label: 'Anular y liquidar',
      description: 'Anular antes de liquidar; no liquidar lo anulado.',
      reference: { p: 1, i: 3, why: 'Reglas simples, pero cobrar un pago anulado afecta directamente al cliente.' },
    },
    {
      id: 'fees',
      label: 'Comisión por devolución',
      description: 'Tabla de decisión de Finanzas: plan, tipo y plazo.',
      reference: { p: 2, i: 2, why: 'Muchas combinaciones y un límite de 30 días: fácil equivocarse, pero el importe es pequeño y se puede regularizar.' },
    },
    {
      id: 'happy_path',
      label: 'Camino feliz',
      description: 'Autorizar → liquidar → devolver.',
      reference: { p: 1, i: 3, why: 'Si falla, no funciona nada; pero es justo lo que Diego ya ha probado.' },
    },
    {
      id: 'ui',
      label: 'Textos y presentación de la consola',
      description: 'Etiquetas, colores de estado, historial.',
      reference: { p: 1, i: 1, why: 'Herramienta interna: un texto mejorable no pierde dinero.' },
    },
  ],
}
