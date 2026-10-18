import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m07Lab } from './m07-lab'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'
import { m07Scenes } from './m07-scenes'

/**
 * Curso 3: Karate Framework · Misión 8 — El tercero que no responde.
 * Guion legible: docs/academy/karate-framework/missions/m07-mocks.md
 *
 * El servicio de pagos con tarjeta se prueba en local contra un mock de
 * Karate del procesador Paynexo (karate.start en el puerto 8090): aprobado,
 * denegado, errores, lentitud y validación del contrato de la petición.
 */
export const m07Mocks: Mission = {
  id: 'm07-mocks',
  courseKey: 'karate-framework',
  number: 7,
  title: 'El tercero que no responde',
  subtitle: 'Mocks de Karate: karate.start, escenarios por condición, responseStatus y responseDelay, validar el contrato con karate.match.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m07Lab,
  initialMetrics: {},
  lessons: m07Lessons,
  mentor: 'sergio',
  quiz: m07Quiz,
  verdicts: {
    good: {
      title: 'Paynexo, a tus órdenes',
      body: 'Tu mock provoca todo lo que el procesador puede hacer —aprobar, denegar, fallar, tardar— y vigila el contrato de lo que le enviamos. Encontraste los fallos del servicio sin esperar a nadie.',
    },
    ok: {
      title: 'Un mock demasiado amable',
      body: 'El mock aprueba, pero algún caso difícil (denegación, error, lentitud o contrato) se quedó sin probar. Mira el debrief.',
    },
    bad: {
      title: 'Esperando al tercero',
      body: 'Sin un mock útil, los pagos llegan al lanzamiento sin saber qué pasa cuando Paynexo falla. Repite la misión empezando por la lección «¿Cómo se escribe un mock en Karate?».',
    },
  },

  briefing: {
    title: 'Miércoles: el procesador',
    paragraphs: [
      'El lunes se abren los pagos con tarjeta a los partners. Cada pago lo autoriza Paynexo, el procesador de tarjetas, y su sandbox lleva caído toda la semana.',
      'El servicio de pagos se arranca en local y llama a Paynexo en localhost:8090. Ahí vas a poner tu propio Paynexo: un mock de Karate.',
      'Con él puedes provocar lo que el real nunca te deja: denegaciones, errores, lentitud. Y descubrir qué hace nuestro servicio en cada caso.',
    ],
    goals: [
      'En el stand-up, propón cómo probar sin Paynexo.',
      'Haz que el mock apruebe y que el pago salga 201.',
      'Provoca una denegación y un error del procesador.',
      'Recorre todos los casos con un Scenario Outline.',
      'Simula lentitud y valida el contrato en el mock.',
      'Decide con datos si los pagos se lanzan el lunes.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m07Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'pagos',
      title: 'Pagos con tarjeta: servicio y Paynexo v2',
      updatedLabel: 'Mantenida por Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'mock' },
        { kind: 'flag', key: 'doc.pagos' },
      ],
      body: `## Arranque en local
- Servicio de pagos: **http://localhost:8080/v1** (\`mvn spring-boot:run -Plocal\`).
- Llama a Paynexo en **PROCESSOR_URL = http://localhost:8090**. Si no hay nada escuchando: **503 PROCESSOR_UNAVAILABLE**.

## Kobalto · POST /cards/{id}/payments
- Cuerpo: **amount** (euros, hasta 2 decimales), **currency** (EUR), **merchant** (1–60).
- Tarjetas: **CRD-1001** activa · **CRD-1002** bloqueada (422 CARD_BLOCKED, sin llamar a Paynexo) · **CRD-1003** caducada (422 CARD_EXPIRED).
- Paynexo aprueba → **201** { id, status: APPROVED, authCode, amount, currency, merchant, cardId }.
- Paynexo deniega → **422 PAYMENT_DECLINED** con **reason** = el motivo de Paynexo.
- Paynexo responde 4xx/5xx o algo inválido → **502 PROCESSOR_ERROR**.
- Paynexo no responde en **3 s** → **504 PROCESSOR_TIMEOUT**. Un pago sin autorización **nunca** se aprueba.
- Errores de validación: 400 VALIDATION_ERROR con field.

## Paynexo v2 · POST /v2/authorizations
- Cabeceras: Content-Type JSON, **Idempotency-Key**, X-Merchant-Id.
- Cuerpo: **amount** en **céntimos enteros** (25,50 € → 2550), **currency** ISO (EUR), **merchant**, **cardToken**, **reference**.
- Si el cuerpo no cumple: **400** { error: "invalid_request" }.
- **200** { result: "APPROVED", authCode } o { result: "DECLINED", reason } (INSUFFICIENT_FUNDS, DO_NOT_HONOR, EXPIRED_CARD, SUSPECTED_FRAUD).
- 5xx cuando falla su lado.`,
    },
  ],

  tickets: [
    {
      id: 'API-44',
      title: 'Pagos con tarjeta para partners',
      status: 'En QA',
      type: 'story',
      description: 'Como partner, quiero cobrar con las tarjetas de Kobalto de mis usuarios y saber siempre si el pago se autorizó y, si no, por qué.',
      acceptanceCriteria: ['Aprobado → 201 con authCode.', 'Denegado → 422 con el motivo de Paynexo.', 'Error o lentitud del procesador → 502/504; nunca un pago aprobado sin autorización.'],
      comments: [{ author: 'nico', body: 'Migrado a Paynexo v2 (importes en céntimos) la semana pasada.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-TIMEOUT',
      title: 'Si Paynexo tarda más de 3 s, el pago se aprueba sin autorización',
      severity: 'critical',
      explanation: 'El manejo del timeout devolvía el pago por defecto como APROBADO (sin authCode): el comercio entregaba el producto y el cobro nunca se había autorizado.',
      technique: 'Mock con responseDelay por encima del timeout del servicio y aserción de 504.',
      fix: { delay: 90, note: 'Un timeout del procesador devuelve ya 504 PROCESSOR_TIMEOUT y el pago no se aprueba. Desplegado.' },
      repro: { groups: [['tarda', 'lento', 'timeout', 'responsedelay', 'delay'], ['201', 'approved', 'aprob', 'authcode']], ask: '¿Cuánto tardó el mock y qué devolvió el servicio?' },
    },
    {
      id: 'KA-UNIDADES',
      title: 'Se envía el importe en euros a Paynexo v2, que espera céntimos',
      severity: 'high',
      explanation: 'La migración a Paynexo v2 no cambió la conversión: se enviaba 25.5 en lugar de 2550. Paynexo rechaza los decimales y, con importes enteros, cobraría cien veces menos.',
      technique: 'Mock que valida la petición contra el contrato del tercero (karate.match con esquema) y un pago con decimales.',
      fix: { delay: 60, note: 'El importe se envía en céntimos enteros. Desplegado.' },
      repro: { groups: [['amount', 'importe', 'céntimo', 'centimo', 'euros', '2550', '25.5'], ['400', 'contrato', 'esquema', 'decimal']], ask: '¿Qué importe le llegó al mock y qué esperaba Paynexo?' },
    },
    {
      id: 'KA-MOTIVO',
      title: 'El motivo de la denegación de Paynexo se pierde',
      severity: 'medium',
      explanation: 'El mapeo de respuestas solo copiaba el motivo DO_NOT_HONOR: cualquier otro llegaba como UNKNOWN y el partner no podía decirle al cliente por qué se denegó.',
      technique: 'Mock que deniega con un motivo concreto y aserción del reason propagado.',
      fix: { delay: 60, note: 'Se propaga cualquier motivo de denegación de Paynexo. Desplegado.' },
      repro: { groups: [['deneg', 'declined', 'reason', 'motivo'], ['unknown', 'insufficient', 'se pierde']], ask: '¿Con qué motivo denegó el mock y qué motivo devolvió el servicio?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Lo que tu mock de Paynexo sabía hacer al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.mock', label: 'Mock que aprueba', explanation: "Scenario: pathMatches('/v2/authorizations') && methodIs('post') con { result: 'APPROVED', authCode }." },
      { flag: 'reto.denegado', label: 'Denegación con motivo', explanation: 'El mock deniega por comercio y el test comprueba el reason propagado.' },
      { flag: 'reto.caida', label: 'Error del procesador → 502', explanation: 'responseStatus = 503 en el mock.' },
      { flag: 'reto.tabla', label: 'Todos los caminos en una tabla', explanation: 'Scenario Outline con una fila por comportamiento de Paynexo.' },
      { flag: 'reto.lento', label: 'Lentitud → 504', explanation: 'responseDelay = 5000 por encima del timeout de 3 s.' },
      { flag: 'reto.contrato', label: 'El mock valida el contrato', explanation: 'karate.match(request, esquema) → 400 si la petición no cumple Paynexo v2.' },
    ],
  },

  concepts: [
    { id: 'mock', title: 'Mocks de Karate', summary: 'Un feature con escenarios-condición (pathMatches, methodIs, request…) que responde con response, responseStatus y responseDelay. Se arranca con karate.start; con puerto fijo, una vez (callonce).' },
    { id: 'dobles', title: 'Dobles de prueba', summary: 'Sustituyen a un tercero para provocar casos a voluntad. Deben validar el contrato de lo que reciben y no sustituyen a una comprobación final con el servicio real.' },
  ],
  debriefConcepts: ['mock', 'dobles'],
  seniorTips: [
    'Lee «Pagos con tarjeta» en la wiki: contrato de Kobalto y de Paynexo v2.',
    "En el mock, encima del catch-all: Scenario: pathMatches('/v2/authorizations') && methodIs('post') → { result: 'APPROVED', authCode: 'A1B2C3' }.",
    "Un escenario por comercio: DENEGADO (DECLINED con reason), CAIDO (responseStatus 503), LENTO (responseDelay 5000).",
    'Scenario Outline en payments.feature con merchant y status: 201, 422, 502, 504.',
    "Contrato: authRequest con amount '#? _ > 0 && _ % 1 == 0' y el primer escenario del mock con !karate.match(request, authRequest).pass → 400. Paga con decimales.",
  ],
}
