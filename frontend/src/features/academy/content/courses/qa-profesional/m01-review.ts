import type { RequirementsReviewModel } from '../../../engine/types'

/**
 * Especificación KOB-E-12 «Facturación recurrente» para la inspección.
 * Ocho defectos reales (claves). Carmen, Tomás y Sofía aportan los suyos en
 * la reunión si participan como revisores y la revisión les deja prepararse.
 */
export const m01Review: RequirementsReviewModel = {
  storyId: 'KOB-E-12',
  reviewer: 'elena',
  submitCost: 60,
  title: 'Inspección de la especificación',
  intro:
    'Revisión individual: lee el documento antes de la reunión y marca cada defecto con su tipo. Cuando estés listo, celebra la reunión: el resto de revisores aportará lo que haya encontrado en su preparación y Elena registrará y corregirá los defectos del acta. Lo que no se encuentre hoy pasa a desarrollo a las 16:00.',
  submitLabel: 'Celebrar la reunión de revisión',
  sections: [
    { id: 'scope', label: '1. Alcance' },
    { id: 'issue', label: '2. Emisión' },
    { id: 'amounts', label: '3. Importes' },
    { id: 'payment', label: '4. Cobro' },
    { id: 'corrections', label: '5. Correcciones' },
    { id: 'nfr', label: '6. Requisitos no funcionales' },
  ],
  fragments: [
    {
      id: 'f1',
      section: 'scope',
      text: 'Los clientes de Kobalto Empresas pueden configurar facturas recurrentes, mensuales o anuales, para sus propios clientes.',
      fineReply: 'Es el alcance de la funcionalidad, tal cual.',
    },
    {
      id: 'f2',
      section: 'issue',
      text: 'La factura se emite automáticamente el día 1 de cada mes.',
      issue: {
        types: ['contradictory'],
        key: 'fecha',
        explanation: 'Contradice el punto siguiente: ¿el día 1 o la fecha de alta?',
        clarifyFlag: 'clarify.fecha',
        clarification: 'Se emite cada mes en el día de alta del cliente; si ese día no existe en el mes, el último día del mes.',
      },
    },
    {
      id: 'f3',
      section: 'issue',
      text: 'La primera factura se emite en la fecha de alta del cliente y las siguientes, en esa misma fecha cada mes.',
      issue: {
        types: ['contradictory'],
        key: 'fecha',
        explanation: 'Contradice el punto anterior (día 1 de cada mes).',
        clarifyFlag: 'clarify.fecha',
        clarification: 'Se emite cada mes en el día de alta del cliente; si ese día no existe en el mes, el último día del mes.',
      },
    },
    {
      id: 'f4',
      section: 'issue',
      text: 'Cada factura lleva un número.',
      issue: {
        types: ['incomplete'],
        key: 'numeracion',
        explanation: 'La normativa exige numeración correlativa por serie, sin saltos; no se dice nada.',
        clarifyFlag: 'clarify.numeracion',
        clarification: 'Numeración correlativa por serie y año (EMP-2026-000001), sin saltos. Una factura anulada no libera su número.',
      },
    },
    {
      id: 'f5',
      section: 'issue',
      text: 'La factura se envía por email al cliente en PDF.',
      fineReply: 'El formato y el canal están definidos en el documento de plantillas.',
    },
    {
      id: 'f6',
      section: 'amounts',
      text: 'El IVA se calcula sobre el importe.',
      issue: {
        types: ['ambiguous', 'incomplete'],
        key: 'iva',
        explanation: '¿Qué importe? ¿Antes o después del descuento? ¿Por línea o sobre el total? El redondeo cambia el resultado.',
        clarifyFlag: 'clarify.iva',
        clarification: 'Sobre la base imponible de cada línea, después del descuento, redondeando cada línea al céntimo.',
      },
    },
    {
      id: 'f7',
      section: 'amounts',
      text: 'Si hay descuento, la factura muestra el importe original, el descuento y la base imponible.',
      fineReply: 'Eso está claro y es verificable.',
    },
    {
      id: 'f8',
      section: 'amounts',
      text: 'El cliente puede cambiar de plan en cualquier momento.',
      issue: {
        types: ['incomplete', 'ambiguous'],
        key: 'prorrateo',
        explanation: '¿Qué pasa con la factura del mes en curso? ¿Se prorratea?',
        clarifyFlag: 'clarify.prorrateo',
        clarification: 'El cambio se aplica desde la siguiente factura; no se prorratea el mes en curso.',
      },
    },
    {
      id: 'f9',
      section: 'payment',
      text: 'Si el cobro de la factura falla, se reintenta.',
      issue: {
        types: ['incomplete'],
        key: 'reintentos',
        explanation: '¿Cuántas veces, cada cuánto y qué pasa al final?',
        clarifyFlag: 'clarify.reintentos',
        clarification: 'Hasta 3 reintentos, a los 1, 3 y 7 días. Después, aviso al cliente y la factura queda «impagada».',
      },
    },
    {
      id: 'f10',
      section: 'payment',
      text: 'El cliente recibe una notificación cuando se cobra cada factura.',
      fineReply: 'La notificación es la estándar de cobros, ya definida.',
    },
    {
      id: 'f11',
      section: 'corrections',
      text: 'Una factura con errores se puede borrar y volver a emitir.',
      issue: {
        types: ['incomplete', 'contradictory'],
        key: 'rectificativa',
        explanation: 'Las facturas emitidas no se pueden borrar: se corrigen con una factura rectificativa. Choca con la normativa.',
        clarifyFlag: 'clarify.rectificativa',
        clarification: 'Las facturas no se borran nunca: se emite una rectificativa que referencia a la original y explica la corrección.',
      },
    },
    {
      id: 'f12',
      section: 'nfr',
      text: 'El envío de las facturas será rápido.',
      issue: {
        types: ['untestable'],
        key: 'rapido',
        explanation: '«Rápido» no se puede verificar.',
        clarifyFlag: 'clarify.rapido',
        clarification: 'Todas las facturas del día enviadas antes de las 08:00; cada PDF generado en menos de 3 s.',
      },
    },
    {
      id: 'f13',
      section: 'nfr',
      text: 'La facturación cumple la normativa vigente.',
      issue: {
        types: ['untestable', 'ambiguous'],
        key: 'normativa',
        explanation: '¿Qué normativa? Sin nombrarla, nadie sabe qué requisitos probar.',
        clarifyFlag: 'clarify.normativa',
        clarification: 'Reglamento de facturación y sistema de registro de facturas (requisitos en el anexo de Compliance, que se añade al documento).',
      },
    },
  ],
  teamFindings: [
    {
      by: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.carmen' }, { kind: 'any', of: [{ kind: 'flag', key: 'review.type.inspection' }, { kind: 'flag', key: 'review.type.technical' }] }] },
      fragmentIds: ['f4', 'f11'],
    },
    {
      by: 'carmen',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.carmen' }, { kind: 'flag', key: 'review.checklist' }, { kind: 'notFlag', key: 'review.type.informal' }] },
      fragmentIds: ['f13'],
    },
    {
      by: 'tomas',
      when: {
        kind: 'all',
        of: [
          { kind: 'flag', key: 'role.reviewer.tomas' },
          { kind: 'notFlag', key: 'role.manager.in' },
          { kind: 'any', of: [{ kind: 'flag', key: 'review.type.inspection' }, { kind: 'flag', key: 'review.type.technical' }] },
        ],
      },
      fragmentIds: ['f6', 'f9'],
    },
    {
      by: 'tomas',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.reviewer.tomas' }, { kind: 'flag', key: 'review.type.walkthrough' }] },
      fragmentIds: ['f6'],
    },
    {
      by: 'sofia',
      when: { kind: 'all', of: [{ kind: 'flag', key: 'role.in.sofia' }, { kind: 'flag', key: 'review.type.inspection' }, { kind: 'notFlag', key: 'role.manager.in' }] },
      fragmentIds: ['f8'],
    },
  ],
}
