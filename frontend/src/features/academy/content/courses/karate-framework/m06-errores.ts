import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m06Lab } from './m06-lab'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'
import { m06Scenes } from './m06-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 7 — Cuando todo falla.
 * Guion legible: docs/academy/karate-framework/missions/m06-errores.md
 *
 * La Open API 1.7 hace asíncronas las transferencias (202 PROCESSING). El
 * alumno adapta la suite con retry until y configure retry, valida el formato
 * común de errores con un esquema, monta la tabla de casos negativos y prueba
 * entrada basura y caídas simuladas (x-sandbox-fault).
 */
export const m06Errores: Mission = {
  id: 'm06-errores',
  courseKey: 'karate-framework',
  number: 6,
  title: 'Cuando todo falla',
  subtitle: 'Casos negativos, esquema de error, retry until y configure retry, responseHeaders y caídas simuladas.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Martes',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m06Lab,
  initialMetrics: {},
  lessons: m06Lessons,
  mentor: 'sergio',
  quiz: m06Quiz,
  verdicts: {
    good: {
      title: 'Preparado para lo peor',
      body: 'Tu suite sabe cómo responde la API cuando algo va mal: errores con un formato verificado, una tabla de casos negativos, esperas con retry until y caídas simuladas. Y encontraste lo que habría fallado el jueves.',
    },
    ok: {
      title: 'Caminos felices, sobre todo',
      body: 'La suite vuelve a estar en verde, pero algún error, alguna espera o algún destino se quedó sin probar. Mira el debrief.',
    },
    bad: {
      title: 'Solo cuando todo va bien',
      body: 'Sin casos negativos ni esperas fiables, la suite no dice nada de lo que pasa cuando algo falla. Repite la misión empezando por la lección «¿Qué casos negativos merece la pena automatizar?».',
    },
  },

  briefing: {
    title: 'Martes: lo que falla',
    paragraphs: [
      'Anoche se desplegó la Open API 1.7 en sandbox: confirmar una transferencia ya no la completa al momento. La suite de transferencias amaneció en rojo.',
      'Finvo empieza el jueves con transferencias reales. Antes, Iván quiere saber cómo se comporta la API cuando las cosas van mal: errores, entrada incorrecta, caídas.',
      'Hoy sales del camino feliz: el formato de los errores también es contrato, y a lo asíncrono se le espera bien.',
    ],
    goals: [
      'Decide si el rojo de la suite es un bug o el cambio de contrato.',
      'En el stand-up, propón cómo esperar a una transferencia.',
      'Arregla el escenario de transferencias con retry until.',
      'Valida el formato de los errores con un esquema común y una tabla de casos negativos.',
      'Prueba la entrada basura y una caída simulada.',
      'Decide con datos si se activan las transferencias a otros bancos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m06Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'errores',
      title: 'Guía de errores y transferencias asíncronas (Open API 1.7)',
      updatedLabel: 'Mantenida por Nicolás Prado',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'errores' },
        { kind: 'flag', key: 'doc.errores' },
      ],
      body: `## Formato común de errores
- Todos los errores: **{ code, message, traceId }**. traceId es un UUID: es lo que el partner nos da al abrir una incidencia.
- Errores de validación: además **field** (el campo que falla).
- Nunca se devuelven trazas internas ni el error por defecto del framework.

## Catálogo
- **400** VALIDATION_ERROR (con field), INVALID_IBAN, INVALID_ACCOUNT_ID, INVALID_STATUS, INVALID_PAGE, INVALID_SIZE
- **401** UNAUTHORIZED, INVALID_TOKEN, TOKEN_REVOKED · **403** INSUFFICIENT_SCOPE
- **404** ACCOUNT_NOT_FOUND, TRANSFER_NOT_FOUND, NOT_FOUND (ruta)
- **405** METHOD_NOT_ALLOWED (p. ej. GET sobre /transfers)
- **409** TRANSFER_ALREADY_CONFIRMED
- **422** INSUFFICIENT_FUNDS, ACCOUNT_NOT_OPERATIVE, CURRENCY_MISMATCH
- **429** TOO_MANY_REQUESTS (con Retry-After)
- **5xx** INTERNAL_ERROR (500), SERVICE_UNAVAILABLE (503, con **Retry-After** en segundos), GATEWAY_TIMEOUT (504)

## Transferencias asíncronas (1.7)
- **POST /transfers/{id}/confirm** → **202** con la transferencia en **status: PROCESSING** y cabecera Location.
- El procesamiento tarda **hasta 8 segundos**, sea a una cuenta de Kobalto o de **otro banco**. Después, GET /transfers/{id} devuelve **COMPLETED** con completedAt.
- Recomendación para partners: consultar **cada segundo**; timeout de Finvo: 10 s.
- Confirmar una transferencia que ya está en proceso o completada: **409 TRANSFER_ALREADY_CONFIRMED**.

## Simular fallos en el sandbox
- Cabecera **x-sandbox-fault** con 500, 503 o 504 en cualquier llamada a /accounts o /transfers: la API responde con ese error (formato común).
- Solo sandbox: en pre y prod se ignora.`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-38',
      title: 'Transferencias asíncronas para partners',
      status: 'En QA',
      type: 'story',
      description: 'Como partner, quiero confirmar una transferencia y consultar su estado hasta que se complete, para no bloquear mi app mientras se procesa.',
      acceptanceCriteria: ['Confirmar devuelve 202 PROCESSING.', 'La transferencia pasa a COMPLETED en 8 s como mucho, a cualquier banco.', 'Confirmar dos veces devuelve 409.'],
      comments: [{ author: 'nico', body: 'Desplegado en sandbox anoche (1.7).' }],
      actions: [],
    },
    {
      id: 'API-39',
      title: 'Formato común de errores',
      status: 'Hecho',
      type: 'story',
      description: 'Como partner, quiero que todos los errores tengan el mismo formato ({ code, message, traceId }) para tratarlos igual y poder abrir incidencias con el traceId.',
      acceptanceCriteria: ['Todos los 4xx y 5xx con code, message y traceId.', 'Las validaciones indican field.', 'Nunca trazas internas.'],
      comments: [],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-ASYNC',
      title: 'Las transferencias a otros bancos se quedan en PROCESSING para siempre',
      severity: 'critical',
      explanation: 'El procesador de transferencias externas no recibía la confirmación del sistema de compensación: el dinero salía de la cuenta y la transferencia nunca se completaba.',
      technique: 'Esperar el estado final con retry until y repetir el caso con un destino de otro banco (Scenario Outline por destino).',
      fix: { delay: 90, note: 'El procesador de transferencias externas ya escucha la confirmación de compensación. Desplegado en sandbox.' },
      repro: { groups: [['otro banco', 'externa', 'iban', 'es1420'], ['processing', 'retry', 'nunca', 'completed', 'colgada']], ask: '¿A qué IBAN hiciste la transferencia y en qué estado se quedó?' },
    },
    {
      id: 'KA-PARSE',
      title: 'Un importe como texto devuelve 500 con un error de Java',
      severity: 'medium',
      explanation: 'El importe se convertía a BigDecimal sin validar el tipo antes: un texto provocaba una excepción no controlada y un 500 que, además, mostraba detalles internos.',
      technique: 'Entrada basura: tipos equivocados en el cuerpo → 400 VALIDATION_ERROR con field.',
      fix: { delay: 60, note: 'Se valida el tipo de amount antes de convertirlo: 400 VALIDATION_ERROR. Desplegado.' },
      repro: { groups: [['amount', 'importe', 'texto', 'string'], ['500', 'bigdecimal', 'deserialize', '400']], ask: '¿Qué importe enviaste y qué respondió la API?' },
    },
    {
      id: 'KA-ERRFMT',
      title: 'El 404 de una transferencia inexistente no tiene el formato común de errores',
      severity: 'medium',
      explanation: 'El controlador de transferencias no tenía el manejador de errores común: el 404 salía con el formato por defecto del framework ({ timestamp, status, error, path }), sin code ni traceId.',
      technique: 'Validar todos los errores contra un esquema común (match response == errorSchema), no solo el status.',
      fix: { delay: 60, note: 'Las transferencias usan ya el manejador de errores común. Desplegado.' },
      repro: { groups: [['transferencia', 'transfer', 'trf'], ['404', 'formato', 'code', 'traceid', 'timestamp', 'esquema']], ask: '¿Qué consultaste y qué le faltaba a la respuesta?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo quedó la suite frente a los errores al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.esquema', label: 'Esquema común de errores', explanation: "* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' } y match response == errorSchema." },
      { flag: 'reto.negativos', label: 'Tabla de casos negativos', explanation: 'Scenario Outline con status y code por fila: 400, 404, 405…' },
      { flag: 'reto.asincrona', label: 'Espera con retry until', explanation: "202 PROCESSING y retry until response.status == 'COMPLETED' con configure retry ajustado." },
      { flag: 'reto.basura', label: 'Entrada basura → 400', explanation: "amount: '10,50' → 400 VALIDATION_ERROR con field amount." },
      { flag: 'reto.caida', label: 'Caída simulada → 503 + Retry-After', explanation: "header x-sandbox-fault = '503' y responseHeaders['Retry-After']." },
      { flag: 'reto.externa', label: 'Transferencia a otro banco', explanation: 'El mismo flujo con un IBAN de fuera de Kobalto (Outline por destino).' },
    ],
  },

  concepts: [
    { id: 'negativos', title: 'Casos negativos', summary: 'Uno por regla que un partner puede romper: formato (400), no existe (404), no se puede (405/409/422), seguridad (401/403). En tabla, comprobando status y code.' },
    { id: 'errores', title: 'El error también es contrato', summary: 'Esquema común reutilizable (code, message, traceId, ##field), cabeceras como Retry-After en responseHeaders, nunca trazas internas ni 5xx por culpa del cliente.' },
    { id: 'retry', title: 'retry until', summary: 'Repite la petición hasta que se cumple la condición. Por defecto 3 intentos cada 3 s; configure retry = { count, interval } según el contrato. Nunca sleeps fijos.' },
  ],
  debriefConcepts: ['negativos', 'errores', 'retry'],
  seniorTips: [
    'Lee la «Guía de errores» en la wiki: el 202 es el contrato nuevo, no un bug.',
    "Confirmar → status 202 → Given path 'transfers', id · And retry until response.status == 'COMPLETED' · When method get.",
    'El procesamiento tarda hasta 8 s: configure retry = { count: 10, interval: 1000 }.',
    "Background: * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }.",
    'Tabla de errores con Scenario Outline: 400, 404 (cuenta y transferencia), 405. Comprueba el code de cada fila.',
    "Basura: amount: '10,50' → 400. Caída: header x-sandbox-fault = '503' → 503 y Retry-After.",
    'Repite la transferencia con un IBAN de otro banco.',
  ],
}
