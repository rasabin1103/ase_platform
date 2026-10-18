import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { MAX_ACTIVE_ORDERS, SANDBOX_TODAY } from '../../../karate/apis/kobaltoOpenApi'
import { EXAM_MIN_SCENARIOS, m10Lab } from './m10-lab'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Examen práctico.
 * Guion legible: docs/academy/karate-framework/missions/m10-examen.md
 *
 * Cuatro horas, sin mentor ni pistas, sobre un recurso nuevo de la API
 * (órdenes periódicas) con bugs que el alumno no ha visto. Nota: 10 puntos por
 * reto y 5 por bug reportado, −5 por report rechazado; aprueba con 70/100.
 * Solo cuenta como terminado (y para el certificado) si se aprueba.
 */
export const m10Examen: Mission = {
  id: 'm10-examen',
  courseKey: 'karate-framework',
  number: 10,
  title: 'Examen práctico',
  subtitle: 'Cuatro horas, sin pistas: automatiza un recurso nuevo de la API y encuentra sus bugs. Aprueba con 70 de 100.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Lunes',
  duration: 240,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m10Lab,
  practicalExam: { passMark: 70, retoPoints: 10, bugPoints: 5, rejectedPenalty: 5 },
  initialMetrics: {},
  hideBugList: true,
  verdicts: {
    good: {
      title: 'Examen práctico superado',
      body: 'Has automatizado un recurso que no conocías, con criterio y sin ayuda, y has encontrado lo que estaba mal. Esto cuenta para el certificado.',
    },
    ok: {
      title: 'Examen práctico superado',
      body: 'Aprobado. Mira en el detalle qué retos y qué bugs se quedaron por el camino.',
    },
    bad: {
      title: 'Examen práctico no superado',
      body: 'Todavía no llegas a 70. Mira qué retos faltaron, repasa la misión correspondiente y vuelve a intentarlo: el examen se puede repetir.',
    },
  },

  briefing: {
    title: 'Examen práctico',
    paragraphs: [
      'Lunes, 09:00. El squad estrena un recurso en la Open API: las órdenes periódicas (transferencias programadas). Nadie lo ha probado todavía.',
      'Tienes cuatro horas para automatizarlo con Karate y descubrir qué falla. No hay mentor ni pistas: el contrato está en la wiki y el framework de la suite (login, esquema de error, utilidad de cuentas de prueba, runner) ya está montado.',
      'Cada reto vale 10 puntos y cada bug real que reportes, 5. Un report rechazado resta 5. Apruebas con 70 de 100.',
    ],
    goals: [
      'Lee el contrato de las órdenes periódicas en la wiki.',
      'Consigue los 8 retos del IDE (80 puntos).',
      'Reporta en el Tablero los bugs que encuentres (5 puntos cada uno).',
      'No reportes lo que no es un bug: resta.',
      'Entrega antes de las 13:00.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: [
    {
      id: 'mail_exam',
      channel: 'email',
      from: 'ivan',
      at: 0,
      subject: 'Examen práctico: órdenes periódicas',
      body: `Buenos días:\n\nHoy estrenamos **/standing-orders** en sandbox y es tu examen práctico. El contrato está en la wiki («Órdenes periódicas»).\n\n- Tienes hasta las **13:00**.\n- Los **retos** del IDE valen 10 puntos cada uno; cada **bug** real que reportes en el Tablero, 5; un report rechazado resta 5.\n- Apruebas con **70 de 100**.\n\nEl framework de la suite ya está: login en karate-config.js, \`schemas/error.json\`, \`common/cuenta-prueba.feature\` y el runner nocturno.\n\nSuerte.\nIván`,
    },
    {
      id: 'reminder',
      channel: 'chat',
      from: 'ivan',
      at: 180,
      body: 'Queda **una hora**. Si aún no lo has hecho, lanza el nocturno y reporta lo que hayas encontrado.',
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ivan',
      at: 240,
      subject: '13:00 · Entrega',
      body: '**Iván:** Se acabó el tiempo. Vamos a ver la nota.',
      choices: [{ id: 'submit', text: 'Entregar el examen.', reply: 'Recibido. Aquí tienes el resultado.', effects: [{ kind: 'endMission' }] }],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'standing_orders',
      title: 'Órdenes periódicas · contrato (Open API 1.8)',
      updatedLabel: 'Mantenida por Nicolás Prado',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.standing' }],
      body: `## Endpoints (token OAuth2)
- **POST /standing-orders** (scope transfers:write) → **201** con la orden y cabecera Location.
- **GET /standing-orders/{id}** (accounts:read) → **200**. Id con formato SO-0000 (si no, 400 INVALID_ORDER_ID). Inexistente: 404 STANDING_ORDER_NOT_FOUND.
- **GET /standing-orders?accountId=ACC-0000** (accounts:read) → **200** { items, total }.
- **DELETE /standing-orders/{id}** (scope **transfers:write**) → **204** sin cuerpo; desde ese momento la orden está **CANCELLED** y nextExecution es null. Cancelar otra vez: 409 ALREADY_CANCELLED. Sin el scope: **403 INSUFFICIENT_SCOPE**.

## Crear: cuerpo
- **fromAccount**, **toIban** (ES + 22 dígitos), **amount**, **currency**, **frequency**, **startDate** (AAAA-MM-DD) y **concept** (opcional).
- **frequency**: exactamente **WEEKLY**, **MONTHLY** o **QUARTERLY** (en mayúsculas).

## Reglas
- **amount**: mayor que 0, hasta 2 decimales. En cuentas personales, como mucho **1.000** por orden (por encima: 422 LIMIT_EXCEEDED).
- **startDate**: **hoy o después**. El sandbox está fijado en **${SANDBOX_TODAY}**. Una fecha pasada: 400 VALIDATION_ERROR (field startDate).
- Como mucho **${MAX_ACTIVE_ORDERS} órdenes activas** por cuenta (si no: 422 TOO_MANY_ORDERS). Usa cuentas de prueba.
- La cuenta debe estar activa (422 ACCOUNT_NOT_OPERATIVE) y en la misma divisa (422 CURRENCY_MISMATCH).
- Errores de validación: **400 VALIDATION_ERROR** con **field**, en el formato común de errores.

## Orden
- { id, fromAccount, toIban, amount, currency, frequency, startDate, nextExecution, concept, status, createdAt }
- **status**: ACTIVE o CANCELLED. **nextExecution**: la próxima fecha de ejecución (al crear, startDate; cancelada, null).

## Evaluación
- 8 retos × 10 puntos, 4 bugs × 5 puntos, −5 por report rechazado. Aprobado: 70. Nocturno: al menos ${EXAM_MIN_SCENARIOS} escenarios.`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-60',
      title: 'Órdenes periódicas para partners',
      status: 'En QA',
      type: 'story',
      description: 'Como partner, quiero programar transferencias periódicas para mis usuarios y poder cancelarlas.',
      acceptanceCriteria: ['Crear, consultar y cancelar según el contrato.', 'Validación de frecuencia, importe y fecha.', 'Cancelar exige transfers:write.'],
      comments: [],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-FRECUENCIA',
      title: 'Se acepta la frecuencia en minúsculas',
      severity: 'medium',
      explanation: 'La validación comparaba sin distinguir mayúsculas y guardaba el valor tal cual: «monthly» se aceptaba y luego el planificador no lo reconocía.',
      technique: 'Casos negativos del enumerado: valores fuera de la lista, también con otra capitalización.',
      repro: { groups: [['frequency', 'frecuencia'], ['minúscula', 'minuscula', 'monthly', 'weekly', '201']], ask: '¿Qué valor de frecuencia enviaste y qué respondió la API?' },
    },
    {
      id: 'KA-HOY',
      title: 'Una orden que empieza hoy se rechaza',
      severity: 'high',
      explanation: 'La comparación de fechas usaba «mayor que» en lugar de «mayor o igual»: el día de hoy, permitido por el contrato, se rechazaba.',
      technique: 'Valores límite de la fecha de inicio: ayer, hoy y mañana.',
      repro: { groups: [['startdate', 'fecha', 'hoy', '2026-10-23'], ['400', 'rechaza', 'límite', 'limite']], ask: '¿Qué fecha de inicio enviaste y qué respondió la API?' },
    },
    {
      id: 'KA-CANCELAR',
      title: 'Cancelar responde 204 pero la orden sigue activa',
      severity: 'critical',
      explanation: 'La cancelación se registraba en otra tabla y el estado de la orden no se actualizaba: la orden seguía ejecutándose.',
      technique: 'Encadenar: cancelar y consultar después.',
      repro: { groups: [['cancel', 'delete'], ['active', 'activa', 'sigue', 'cancelled']], ask: '¿Qué hiciste después de cancelar y qué estado tenía la orden?' },
    },
    {
      id: 'KA-SCOPE-DEL',
      title: 'Un token de solo lectura puede cancelar órdenes',
      severity: 'critical',
      explanation: 'El DELETE no comprobaba el scope: cualquier token válido podía cancelar órdenes de pago.',
      technique: 'Prueba negativa de autorización con un token de mínimo privilegio.',
      repro: { groups: [['scope', 'accounts:read', 'solo lectura', 'token'], ['delete', 'cancel', '204', '403']], ask: '¿Con qué token cancelaste y qué respondió la API?' },
    },
  ],

  prevention: {
    title: 'Retos del examen',
    intro: 'Lo que conseguiste en el examen práctico.',
    preventedLabel: 'Bugs encontrados a tiempo',
    appearedLabel: 'Bugs',
    rules: m10Lab.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') })),
  },

  concepts: [],
  debriefConcepts: [],
  seniorTips: [],
}
