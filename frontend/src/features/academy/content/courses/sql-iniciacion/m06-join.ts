import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import type { SqlResult } from '../../../sql/types'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'
import { m06Scenes } from './m06-scenes'

/** Los encargos de hoy se resuelven uniendo tablas en la consulta, no buscando ids a mano. */
const usesJoin = (_r: SqlResult, sql: string) => /\bjoin\b/i.test(sql)

/**
 * Curso 5: SQL desde cero · Misión 6 — Unir tablas.
 * Guion legible: docs/academy/sql-iniciacion/missions/m06-join.md
 *
 * Claves, INNER JOIN … ON, alias de tabla, JOIN de tres tablas, JOIN con
 * GROUP BY, producto cartesiano y filas que el INNER JOIN deja fuera.
 */
export const m06Join: Mission = {
  id: 'm06-join',
  courseKey: 'sql-iniciacion',
  number: 6,
  title: 'Unir tablas',
  subtitle: 'JOIN … ON, alias de tabla y JOIN de tres tablas.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Martes · semana 2',
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
  lessons: m06Lessons,
  mentor: 'ines',
  quiz: m06Quiz,
  verdicts: {
    good: {
      title: 'Tablas bien cosidas',
      body: 'Nuria resolvió la llamada, Carmen sabe quién envió cada transferencia grande, Marta tiene el saldo por ciudad y Laura ha abierto un bug real: tarjetas caducadas que siguen activas.',
    },
    ok: {
      title: 'Unes, pero se soltó algo',
      body: 'Ya usas JOIN, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Tablas sueltas',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión: JOIN con su ON, alias y cadenas de JOIN.',
    },
  },

  briefing: {
    title: 'Semana 2 · Unir tablas',
    paragraphs: [
      'Martes de la semana 2. Las preguntas de hoy cruzan tablas: de quién es esta cuenta, qué tarjeta tiene este cliente, quién envió esta transferencia.',
      'Los encargos de hoy se tienen que resolver con JOIN en la consulta: buscar los ids a mano y copiarlos no vale.',
    ],
    goals: [
      'Entiende cómo se relacionan las tablas por sus claves.',
      'Une dos tablas con JOIN … ON.',
      'Usa alias de tabla y evita columnas ambiguas.',
      'Encadena tres tablas.',
      'Combina JOIN con WHERE y GROUP BY.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m06Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'mapa_tablas',
      title: 'Mapa de tablas y claves',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'foreign_keys' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Cómo se relacionan
- \`cuentas.cliente_id\` → \`clientes.id\`
- \`tarjetas.cuenta_id\` → \`cuentas.id\`
- \`transferencias.cuenta_origen_id\` → \`cuentas.id\` (quien envía)
- \`transferencias.cuenta_destino_id\` → \`cuentas.id\` (quien recibe; vacío si es otro banco)
- \`incidencias.cliente_id\` → \`clientes.id\`

## Forma
\`\`\`
SELECT c.nombre, a.iban
FROM cuentas a
JOIN clientes c ON a.cliente_id = c.id;
\`\`\`

## Columnas que se repiten entre tablas
\`id\`, \`estado\`, \`tipo\`: escribe siempre \`alias.columna\`.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Une tablas con JOIN … ON\nSELECT a.iban, a.saldo, c.nombre\nFROM cuentas a\nJOIN clientes c ON a.cliente_id = c.id;',
    retos: [
      {
        id: 'cuentas_titular',
        from: 'ines',
        title: 'Cada cuenta con su titular',
        description: '`iban` y `saldo` de cada cuenta, con el `nombre` y los `apellidos` de su titular. Cuatro columnas, en ese orden.',
        hint: '`FROM cuentas a JOIN clientes c ON a.cliente_id = c.id`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT a.iban, a.saldo, c.nombre, c.apellidos FROM cuentas a JOIN clientes c ON a.cliente_id = c.id',
        check: usesJoin,
      },
      {
        id: 'tarjeta_cliente',
        from: 'nuria',
        title: 'La tarjeta de un cliente',
        description: '`tipo`, `estado`, `limite_diario` y `caduca_en` de la tarjeta del cliente con email **pablo.gil34@mail.com**.',
        hint: 'De tarjetas a clientes se pasa por cuentas: dos JOIN, y el email en el WHERE.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT t.tipo, t.estado, t.limite_diario, t.caduca_en FROM tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE c.email = 'pablo.gil34@mail.com'",
        check: usesJoin,
      },
      {
        id: 'rechazadas_iban',
        from: 'diego',
        title: 'Rechazadas con su IBAN',
        description: '`id` e `importe` de las transferencias **rechazadas**, con el `iban` de su **cuenta de origen**.',
        hint: "`transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id`, y `t.estado = 'rechazada'` (las dos tablas tienen `estado`).",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT t.id, t.importe, a.iban FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id WHERE t.estado = 'rechazada'",
        check: usesJoin,
      },
      {
        id: 'grandes_ordenante',
        from: 'carmen',
        title: 'Quién envió las grandes',
        description: '`id` e `importe` de las transferencias de **más de 10.000 €**, con `nombre` y `apellidos` del cliente de la cuenta de origen.',
        hint: 'Tres tablas: transferencias → cuentas (por `cuenta_origen_id`) → clientes.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT t.id, t.importe, c.nombre, c.apellidos FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE t.importe > 10000',
        check: usesJoin,
      },
      {
        id: 'saldo_ciudad',
        from: 'marta',
        title: 'Saldo total por ciudad',
        description: '`ciudad` y **saldo total** de las cuentas de los clientes de cada ciudad.',
        hint: 'Une cuentas con clientes y agrupa por `c.ciudad` con `SUM(a.saldo)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT c.ciudad, SUM(a.saldo) FROM cuentas a JOIN clientes c ON a.cliente_id = c.id GROUP BY c.ciudad',
        check: usesJoin,
      },
      {
        id: 'caducadas_activas',
        from: 'laura',
        title: 'Tarjetas caducadas que siguen activas',
        description: '`id` y `caduca_en` de las tarjetas **activas** que caducaron **antes del 1 de enero de 2026**, con el `email` del cliente.',
        hint: "Dos JOIN hasta clientes; en el WHERE, `t.estado = 'activa' AND t.caduca_en < '2026-01-01'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT t.id, t.caduca_en, c.email FROM tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE t.estado = 'activa' AND t.caduca_en < '2026-01-01'",
        check: usesJoin,
      },
    ],
  },

  bugs: [
    { id: 'C-LLAMADA', title: 'Un cliente sigue sin poder pagar con tarjeta', severity: 'high', explanation: 'Nuria no supo que su tarjeta estaba caducada.', technique: 'JOIN de tres tablas con WHERE.', preventedBy: 'reto.tarjeta_cliente' },
    { id: 'C-LOGS', title: 'Las transferencias rechazadas no se pueden rastrear', severity: 'medium', explanation: 'Diego no recibió el IBAN de origen.', technique: 'JOIN con alias y columnas cualificadas.', preventedBy: 'reto.rechazadas_iban' },
    { id: 'C-DOCUMENTACION', title: 'Riesgos no sabe a quién pedir explicaciones', severity: 'high', explanation: 'Carmen no recibió quién envió las transferencias grandes.', technique: 'Cadena transferencias → cuentas → clientes.', preventedBy: 'reto.grandes_ordenante' },
    { id: 'C-OFICINAS', title: 'El plan de oficinas sale sin el saldo por ciudad', severity: 'medium', explanation: 'Marta no recibió el saldo por ciudad.', technique: 'JOIN con GROUP BY.', preventedBy: 'reto.saldo_ciudad' },
    { id: 'C-CADUCADAS', title: 'Hay tarjetas caducadas activas y nadie lo sabe', severity: 'critical', explanation: 'Sin el listado de Laura, el fallo del proceso de bloqueo sigue oculto.', technique: 'JOIN de tres tablas con condiciones de estado y fecha.', preventedBy: 'reto.caducadas_activas' },
    { id: 'C-CARTESIANO', title: 'Una consulta sin ON tumba la réplica', severity: 'high', explanation: 'Sin condición de unión, cada fila se combina con todas.', technique: 'Un JOIN siempre con su ON.', preventedBy: 'practice.on' },
    { id: 'C-PERDIDO', title: 'Un informe dice que hay 39 clientes', severity: 'medium', explanation: 'El INNER JOIN deja fuera al cliente sin cuentas.', technique: 'Saber qué filas descarta un INNER JOIN.', preventedBy: 'practice.inner' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los cruces del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.tarjeta_cliente', label: 'Llamada resuelta', explanation: 'Tarjeta caducada detectada.' },
      { flag: 'reto.rechazadas_iban', label: 'Rechazadas rastreables', explanation: 'Con el IBAN de origen.' },
      { flag: 'reto.grandes_ordenante', label: 'Control de Riesgos', explanation: 'Quién envió cada transferencia grande.' },
      { flag: 'reto.saldo_ciudad', label: 'Plan de oficinas', explanation: 'Saldo por ciudad.' },
      { flag: 'reto.caducadas_activas', label: 'Bug de tarjetas', explanation: 'Caducadas que siguen activas.' },
      { flag: 'practice.on', label: 'JOIN con su ON', explanation: 'Sin productos cartesianos.' },
      { flag: 'practice.inner', label: 'Cuentas que cuadran', explanation: 'Lo que deja fuera el INNER JOIN.' },
    ],
  },

  concepts: [
    { id: 'foreign_keys', title: 'Claves que relacionan tablas', summary: 'Una clave foránea (cliente_id) apunta a la clave primaria de otra tabla (clientes.id).' },
    { id: 'inner_join', title: 'JOIN … ON', summary: 'Une las filas de dos tablas según la condición del ON.' },
    { id: 'join_condition', title: 'Producto cartesiano', summary: 'Sin condición de unión, cada fila se combina con todas las de la otra tabla.' },
    { id: 'table_alias', title: 'Alias de tabla', summary: 'Nombres cortos (c, a, t) que hacen la consulta legible y evitan columnas ambiguas.' },
    { id: 'multi_join', title: 'JOIN de varias tablas', summary: 'Se encadenan JOIN, cada uno con su ON.' },
    { id: 'inner_drops', title: 'Lo que deja fuera el INNER JOIN', summary: 'Solo quedan las filas con pareja en las dos tablas.' },
  ],
  debriefConcepts: ['foreign_keys', 'inner_join', 'join_condition', 'table_alias', 'multi_join', 'inner_drops'],
  seniorTips: [
    'Lee el mapa de tablas en la wiki.',
    'Inés: SELECT a.iban, a.saldo, c.nombre, c.apellidos FROM cuentas a JOIN clientes c ON a.cliente_id = c.id.',
    "Nuria: tarjetas t JOIN cuentas a ON t.cuenta_id = a.id JOIN clientes c ON a.cliente_id = c.id WHERE c.email = 'pablo.gil34@mail.com'.",
    "Diego: … FROM transferencias t JOIN cuentas a ON t.cuenta_origen_id = a.id WHERE t.estado = 'rechazada'.",
    'Carmen: tres tablas con WHERE t.importe > 10000.',
    'Marta: … GROUP BY c.ciudad con SUM(a.saldo).',
    "Laura: … WHERE t.estado = 'activa' AND t.caduca_en < '2026-01-01'.",
    'Con Inés: sin ON hay producto cartesiano; INNER JOIN deja fuera lo que no tiene pareja.',
  ],
}
