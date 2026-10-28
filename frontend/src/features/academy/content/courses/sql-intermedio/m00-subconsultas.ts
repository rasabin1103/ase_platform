import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m00Lessons } from './m00-lessons'
import { m00Quiz } from './m00-quiz'
import { m00Scenes } from './m00-scenes'

/** Exige una subconsulta: un SELECT entre paréntesis dentro de la consulta. */
const SUBQUERY = { pattern: /\(\s*select\b/i, message: 'Este encargo se resuelve con una subconsulta: un `(SELECT …)` dentro de la consulta.' }

/**
 * Curso 6: SQL intermedio · Misión 0 — La consulta dentro de la consulta (demo gratis).
 * Guion legible: docs/academy/sql-intermedio/missions/m00-subconsultas.md
 *
 * Subconsultas escalares, con IN, correlacionadas, en el FROM y en el SELECT;
 * trampas: `=` con varias filas y duplicados del JOIN frente a IN/EXISTS.
 */
export const m00Subconsultas: Mission = {
  id: 'm00-subconsultas',
  courseKey: 'sql-intermedio',
  number: 0,
  title: 'La consulta dentro de la consulta',
  subtitle: 'Subconsultas: un valor, una lista, una tabla o un dato por fila.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · mes 2',
  duration: 480,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'ines',
  ticketPrefix: 'DAT',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  hideBugList: true,
  wikiLabel: 'Wiki · Datos',
  initialMetrics: {},
  lessons: m00Lessons,
  mentor: 'ines',
  quiz: m00Quiz,
  verdicts: {
    good: {
      title: 'Preguntas de dos pasos, en una consulta',
      body: 'Marta tiene su campaña sin repetidos, Carmen sus máximos por estado, Nuria su encuesta, Diego su media y Laura sus datos de prueba con los ceros donde tocan.',
    },
    ok: {
      title: 'Las subconsultas ya salen, a medias',
      body: 'Resuelves parte de los encargos, pero alguno o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Copiar cifras a mano no escala',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de subconsultas a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · La consulta dentro de la consulta',
    paragraphs: [
      'Empieza tu segundo mes en Kobalto. El equipo ya no te pide listas: te pide respuestas, y muchas necesitan un dato que primero hay que calcular.',
      'Hoy aprenderás a meter una consulta dentro de otra. Cada encargo se cumple cuando tu consulta devuelve exactamente lo que se pide, calculado por la propia consulta.',
    ],
    goals: [
      'Compara con un valor calculado: subconsulta escalar.',
      'Filtra con una lista calculada: IN y NOT EXISTS.',
      'Escribe una subconsulta correlacionada con la fila de fuera.',
      'Agrega un agregado con una tabla derivada en el FROM.',
      'Añade una columna calculada con una subconsulta en el SELECT.',
      'Distingue cuándo un JOIN repite filas y cuándo usar IN o EXISTS.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m00Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_subconsultas',
      title: 'Chuleta: subconsultas',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'subquery_scalar' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## ¿Qué devuelve tu subconsulta?
| Devuelve | Dónde va | Ejemplo |
|---|---|---|
| Un valor | \`=\`, \`>\`, \`<\`… o en el SELECT | \`WHERE importe > (SELECT AVG(importe) FROM transferencias)\` |
| Una lista | \`IN\` / \`NOT IN\` | \`WHERE id IN (SELECT cliente_id FROM cuentas)\` |
| Una tabla | En el \`FROM\`, con alias | \`FROM (SELECT …) AS t\` |
| ¿Hay alguna fila? | \`EXISTS\` / \`NOT EXISTS\` | \`WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)\` |

## Correlacionada
Usa una columna de la consulta de fuera y se evalúa para cada fila. Pon alias a las dos tablas (\`t\`, \`t2\`).

## Trampas
- \`=\` con una subconsulta de varias filas: error. Usa \`IN\` o un agregado. Nunca \`LIMIT 1\` para taparlo.
- \`NOT IN\` con una lista que tenga NULL no devuelve nada: mejor \`NOT EXISTS\`.
- «Los que tienen alguno» con JOIN repite una fila por coincidencia: \`IN\`, \`EXISTS\` o \`COUNT(DISTINCT …)\`.
- \`AVG(COUNT(*))\` da error: cuenta en una subconsulta del FROM y haz la media fuera.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Una consulta dentro de otra\nSELECT id, importe\nFROM transferencias\nWHERE importe > (SELECT AVG(importe) FROM transferencias);',
    retos: [
      {
        id: 'sobre_media',
        from: 'ines',
        title: 'Por encima de la media',
        description: 'El `id` y el `importe` de las transferencias cuyo importe es **mayor que la media de todas**, sin escribir la media a mano.',
        hint: 'La media, en una subconsulta entre paréntesis: `WHERE importe > (SELECT AVG(importe) FROM transferencias)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT id, importe FROM transferencias WHERE importe > (SELECT AVG(importe) FROM transferencias)',
        requires: [SUBQUERY],
      },
      {
        id: 'ahorradores',
        from: 'marta',
        title: 'Clientes con cuenta de ahorro',
        description: 'El `id`, el `nombre` y los `apellidos` de los clientes que tienen **alguna cuenta de ahorro**, una vez cada uno.',
        hint: "La subconsulta da la lista de `cliente_id` de las cuentas con `tipo = 'ahorro'`; fuera, `WHERE id IN (…)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT id, nombre, apellidos FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro')",
      },
      {
        id: 'max_estado',
        from: 'carmen',
        title: 'La más alta de cada estado',
        description: 'De cada `estado` de transferencia, la transferencia **más alta**: `id`, `estado` e `importe`. Una fila por estado.',
        hint: 'Correlacionada: `FROM transferencias t WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT t.id, t.estado, t.importe FROM transferencias t WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado)',
      },
      {
        id: 'sin_incidencias',
        from: 'nuria',
        title: 'Clientes sin incidencias',
        description: 'El `id`, el `nombre` y el `email` de los clientes que **nunca han abierto una incidencia**.',
        hint: '`WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)`, o `NOT IN` con la lista de `cliente_id` de incidencias.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT c.id, c.nombre, c.email FROM clientes c WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id)',
      },
      {
        id: 'media_envios',
        from: 'diego',
        title: 'Media de envíos por cuenta',
        description: 'Cuántas transferencias **envía de media cada cuenta** (de las que han enviado alguna), redondeado a **2 decimales**. Una sola cifra.',
        hint: 'Primero cuenta por `cuenta_origen_id` en una subconsulta del `FROM` (ponle un alias, `AS envios`); fuera, `ROUND(AVG(n), 2)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT ROUND(AVG(n), 2) AS media FROM (SELECT cuenta_origen_id, COUNT(*) AS n FROM transferencias GROUP BY cuenta_origen_id) AS envios',
        requires: [SUBQUERY],
      },
      {
        id: 'incidencias_cliente',
        from: 'laura',
        title: 'Incidencias de cada cliente',
        description: '**Todos** los clientes con `id`, `nombre` y una columna `incidencias` con cuántas ha abierto cada uno (0 si ninguna).',
        hint: 'En el SELECT: `(SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT c.id, c.nombre, (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias FROM clientes c',
        columns: ['id', 'nombre', 'incidencias'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La oferta de ahorro no sale (o sale repetida)', severity: 'high', explanation: 'Marta no recibió la lista de clientes con cuenta de ahorro, una vez cada uno.', technique: 'Subconsulta con IN.', preventedBy: 'reto.ahorradores' },
    { id: 'C-CARMEN', title: 'El control de importes no tiene los máximos por estado', severity: 'high', explanation: 'Carmen se quedó sin la transferencia más alta de cada estado.', technique: 'Subconsulta correlacionada.', preventedBy: 'reto.max_estado' },
    { id: 'C-NURIA', title: 'La encuesta de satisfacción se queda sin destinatarios', severity: 'medium', explanation: 'Nuria no tuvo la lista de clientes sin incidencias.', technique: 'NOT EXISTS (o NOT IN sin NULL).', preventedBy: 'reto.sin_incidencias' },
    { id: 'C-DIEGO', title: 'El nuevo servicio se dimensiona a ojo', severity: 'medium', explanation: 'Sin la media de envíos por cuenta, Diego calculó el pico sin datos.', technique: 'Tabla derivada en el FROM: agregar un agregado.', preventedBy: 'reto.media_envios' },
    { id: 'C-LAURA', title: 'Los tests no tienen clientes sin historial', severity: 'medium', explanation: 'Laura no recibió el recuento por cliente con los ceros.', technique: 'Subconsulta correlacionada en el SELECT.', preventedBy: 'reto.incidencias_cliente' },
    { id: 'C-MULTIFILA', title: 'Un LIMIT 1 deja un informe con un solo cliente de trece', severity: 'high', explanation: 'Tapar el error de «más de una fila» con LIMIT 1 devuelve un resultado cualquiera.', technique: 'Un valor → =; una lista → IN.', preventedBy: 'practice.multirow' },
    { id: 'C-DUPLICADOS', title: 'El informe dice 49 clientes con cuenta activa (son 38)', severity: 'high', explanation: 'El JOIN repite al cliente por cada cuenta activa.', technique: 'IN, EXISTS o COUNT(DISTINCT).', preventedBy: 'practice.semijoin' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.ahorradores', label: 'Oferta de ahorro', explanation: 'Clientes con IN, sin repetidos.' },
      { flag: 'reto.max_estado', label: 'Control de Carmen', explanation: 'La más alta de cada estado.' },
      { flag: 'reto.sin_incidencias', label: 'Encuesta de Nuria', explanation: 'Clientes sin incidencias con NOT EXISTS.' },
      { flag: 'reto.media_envios', label: 'Dimensionado de Diego', explanation: 'Media de un recuento con una tabla derivada.' },
      { flag: 'reto.incidencias_cliente', label: 'Datos de prueba de Laura', explanation: 'Recuento por cliente con los ceros.' },
      { flag: 'practice.multirow', label: 'Error de varias filas bien resuelto', explanation: 'IN en vez de LIMIT 1.' },
      { flag: 'practice.semijoin', label: 'Recuento sin duplicados', explanation: 'IN o EXISTS en lugar de JOIN.' },
    ],
  },

  concepts: [
    { id: 'subquery_scalar', title: 'Subconsulta escalar', summary: 'Una consulta entre paréntesis que devuelve un valor y se usa como un número.' },
    { id: 'subquery_in', title: 'Subconsulta con IN', summary: 'Compara con la lista que devuelve otra consulta; cada fila de fuera sale una vez.' },
    { id: 'subquery_correlated', title: 'Subconsulta correlacionada', summary: 'Usa columnas de la consulta de fuera y se evalúa para cada fila.' },
    { id: 'subquery_from', title: 'Tabla derivada', summary: 'Una subconsulta en el FROM, con alias: sirve para agregar un agregado.' },
    { id: 'subquery_select', title: 'Subconsulta en el SELECT', summary: 'Una columna calculada por fila, como un recuento por cliente.' },
    { id: 'subquery_multirow', title: 'Un valor o una lista', summary: 'Con = la subconsulta debe devolver una fila; si son varias, IN. Nunca LIMIT 1 para taparlo.' },
    { id: 'semijoin_duplicates', title: 'JOIN frente a IN/EXISTS', summary: 'El JOIN da una fila por pareja; IN y EXISTS responden «¿tiene alguna?».' },
  ],
  debriefConcepts: ['subquery_scalar', 'subquery_in', 'subquery_correlated', 'subquery_from', 'subquery_select', 'subquery_multirow', 'semijoin_duplicates'],
  seniorTips: [
    'Lee la chuleta de subconsultas en la wiki.',
    'Inés: SELECT id, importe FROM transferencias WHERE importe > (SELECT AVG(importe) FROM transferencias).',
    "Marta: … FROM clientes WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro').",
    'Carmen: … WHERE t.importe = (SELECT MAX(t2.importe) FROM transferencias t2 WHERE t2.estado = t.estado).',
    'Nuria: … WHERE NOT EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id).',
    'Diego: SELECT ROUND(AVG(n), 2) FROM (SELECT cuenta_origen_id, COUNT(*) AS n FROM transferencias GROUP BY cuenta_origen_id) AS envios.',
    'Laura: (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias, en el SELECT.',
    'Con Inés: un valor → =, una lista → IN; y para «los que tienen alguno», IN o EXISTS, no JOIN.',
  ],
}
