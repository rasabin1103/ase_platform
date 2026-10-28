import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Scenes } from './m05-scenes'

/** Los rankings de hoy se hacen con funciones de ventana. */
const OVER = { pattern: /\bover\s*\(/i, message: 'Este encargo se resuelve con una función de ventana: `… OVER (…)`.' }

/**
 * Curso 6: SQL intermedio · Misión 5 — El ranking.
 * Guion legible: docs/academy/sql-intermedio/missions/m05-ranking.md
 *
 * Funciones de ventana: RANK, ROW_NUMBER, DENSE_RANK, PARTITION BY, top N por
 * grupo y NTILE. Trampas: la ventana en el WHERE y los empates con ROW_NUMBER.
 */
export const m05Ranking: Mission = {
  id: 'm05-ranking',
  courseKey: 'sql-intermedio',
  number: 5,
  title: 'El ranking',
  subtitle: 'Funciones de ventana: RANK, ROW_NUMBER, DENSE_RANK, PARTITION BY y los N primeros de cada grupo.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · mes 2, semana 2',
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
  lessons: m05Lessons,
  mentor: 'ines',
  quiz: m05Quiz,
  verdicts: {
    good: {
      title: 'Cada uno en su puesto',
      body: 'Marta tiene sus comercios locales, Carmen el último pago de cada tarjeta, Nuria sus embajadores, Diego los niveles con empates bien resueltos y Laura sus cuatro grupos de clientes.',
    },
    ok: {
      title: 'Rankings con algún hueco',
      body: 'Ya usas funciones de ventana, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Ordenar y contar a mano',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de funciones de ventana a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Semana 2 · El ranking',
    paragraphs: [
      'Empieza la segunda semana del mes. Hoy todo son rankings: los que más facturan, el último de cada tarjeta, el mejor de cada ciudad.',
      'Los encargos de hoy se hacen con funciones de ventana (`… OVER (…)`) y tienen que devolver exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Numera filas con RANK, ROW_NUMBER y DENSE_RANK.',
      'Reinicia el ranking en cada grupo con PARTITION BY.',
      'Quédate con los N primeros de cada grupo: numera en un WITH y filtra fuera.',
      'Decide qué hacer con los empates.',
      'Reparte filas en grupos iguales con NTILE.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m05Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_ventanas',
      title: 'Chuleta: funciones de ventana (rankings)',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'window_basics' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma
\`función() OVER (PARTITION BY grupo ORDER BY criterio)\`
- \`PARTITION BY\`: opcional; reinicia en cada grupo.
- \`ORDER BY\`: el orden del ranking.

## Funciones de ranking
| Función | 100, 100, 80 |
|---|---|
| \`ROW_NUMBER()\` | 1, 2, 3 |
| \`RANK()\` | 1, 1, 3 |
| \`DENSE_RANK()\` | 1, 1, 2 |
| \`NTILE(n)\` | reparte en n grupos |

## Los N primeros de cada grupo
\`\`\`
WITH numerados AS (
  SELECT …, ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC) AS n
  FROM …
)
SELECT … FROM numerados WHERE n <= 3;
\`\`\`
Las ventanas **no** van en el WHERE ni en el HAVING: se calculan después.

## Orden de ejecución
FROM → WHERE → GROUP BY → HAVING → ventanas → ORDER BY → LIMIT`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Un ranking con una función de ventana\nSELECT comercio_id,\n       SUM(importe) AS total,\n       RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto\nFROM pagos_tarjeta\nWHERE estado = 'aceptado'\nGROUP BY comercio_id;",
    retos: [
      {
        id: 'ranking_comercios',
        from: 'ines',
        title: 'Ranking de comercios',
        description: 'De los pagos **aceptados**: `comercio_id`, `total` de importe y `puesto` (1 el que más factura).',
        hint: "`RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto`, con `WHERE estado = 'aceptado'` y `GROUP BY comercio_id`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT comercio_id, SUM(importe) AS total, RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY comercio_id",
        columns: ['comercio_id', 'total', 'puesto'],
        requires: [OVER],
      },
      {
        id: 'top3_ciudad',
        from: 'marta',
        title: 'Los 3 que más facturan de cada ciudad',
        description: '`ciudad`, `nombre` y `total` (pagos **aceptados**) de los **3 comercios que más facturan de cada ciudad**; sin la tienda online, que no tiene ciudad.',
        hint: 'Un paso con el total por comercio (con su ciudad y nombre) y `ROW_NUMBER() OVER (PARTITION BY ciudad ORDER BY total DESC) AS n`; fuera, `WHERE n <= 3`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "WITH totales AS (SELECT c.ciudad, c.nombre, SUM(p.importe) AS total, ROW_NUMBER() OVER (PARTITION BY c.ciudad ORDER BY SUM(p.importe) DESC) AS n FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.ciudad IS NOT NULL GROUP BY c.ciudad, c.nombre) SELECT ciudad, nombre, total FROM totales WHERE n <= 3",
        columns: ['ciudad', 'nombre', 'total'],
        requires: [OVER],
      },
      {
        id: 'ultimo_pago',
        from: 'carmen',
        title: 'El último pago de cada tarjeta',
        description: '`tarjeta_id`, `id`, `importe` y `pagado_en` del **último pago** (cualquier estado) de cada tarjeta.',
        hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) AS n` en un WITH; fuera, `WHERE n = 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'WITH numerados AS (SELECT tarjeta_id, id, importe, pagado_en, ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) AS n FROM pagos_tarjeta) SELECT tarjeta_id, id, importe, pagado_en FROM numerados WHERE n = 1',
        columns: ['tarjeta_id', 'id', 'importe', 'pagado_en'],
        requires: [OVER],
      },
      {
        id: 'top_cliente_ciudad',
        from: 'nuria',
        title: 'El cliente con más saldo de cada ciudad',
        description: '`ciudad`, `nombre` y `saldo_total` (suma de sus cuentas) del **cliente con más saldo total de cada ciudad**.',
        hint: 'Saldo por cliente con su ciudad, `RANK() OVER (PARTITION BY ciudad ORDER BY saldo_total DESC)` y fuera el puesto 1.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'WITH saldos AS (SELECT c.ciudad, c.nombre, SUM(a.saldo) AS saldo_total, RANK() OVER (PARTITION BY c.ciudad ORDER BY SUM(a.saldo) DESC) AS puesto FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.ciudad, c.nombre) SELECT ciudad, nombre, saldo_total FROM saldos WHERE puesto = 1',
        columns: ['ciudad', 'nombre', 'saldo_total'],
        requires: [OVER],
      },
      {
        id: 'ranking_pagos',
        from: 'diego',
        title: 'Clientes por número de pagos, sin huecos',
        description: '`cliente_id`, número de `pagos` con tarjeta (todos los estados) y `puesto`: empatados con el mismo puesto y el siguiente puesto, el número siguiente (1, 1, 2…).',
        hint: '`pagos_tarjeta` → `tarjetas` → `cuentas` para llegar al cliente; `DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS puesto`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT a.cliente_id, COUNT(*) AS pagos, DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) AS puesto FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id GROUP BY a.cliente_id',
        columns: ['cliente_id', 'pagos', 'puesto'],
        requires: [OVER],
      },
      {
        id: 'cuartiles',
        from: 'laura',
        title: 'Clientes en cuatro grupos por saldo',
        description: '`cliente_id`, `saldo_total` y `cuartil`: los clientes repartidos en **4 grupos** por saldo total, 1 los de más saldo.',
        hint: 'Saldo por `cliente_id` en `cuentas` y `NTILE(4) OVER (ORDER BY SUM(saldo) DESC) AS cuartil`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT cliente_id, SUM(saldo) AS saldo_total, NTILE(4) OVER (ORDER BY SUM(saldo) DESC) AS cuartil FROM cuentas GROUP BY cliente_id',
        columns: ['cliente_id', 'saldo_total', 'cuartil'],
        requires: [OVER],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La campaña local se queda sin comercios', severity: 'medium', explanation: 'Marta no recibió los tres que más facturan de cada ciudad.', technique: 'PARTITION BY y filtrar el número fuera.', preventedBy: 'reto.top3_ciudad' },
    { id: 'C-CARMEN', title: 'Nadie revisa las tarjetas inactivas', severity: 'high', explanation: 'Carmen se quedó sin el último pago de cada tarjeta.', technique: 'ROW_NUMBER por tarjeta, de más reciente a más antiguo.', preventedBy: 'reto.ultimo_pago' },
    { id: 'C-NURIA', title: 'El programa de embajadores no arranca', severity: 'low', explanation: 'Nuria no tuvo el mejor cliente de cada ciudad.', technique: 'RANK por ciudad.', preventedBy: 'reto.top_cliente_ciudad' },
    { id: 'C-DIEGO', title: 'Los niveles de la app saltan del 1 al 7', severity: 'medium', explanation: 'Sin DENSE_RANK, los puestos dejan huecos tras los empates.', technique: 'DENSE_RANK.', preventedBy: 'reto.ranking_pagos' },
    { id: 'C-LAURA', title: 'Los tests de rendimiento usan clientes parecidos', severity: 'low', explanation: 'Laura no pudo elegir clientes de cada grupo de saldo.', technique: 'NTILE(4).', preventedBy: 'reto.cuartiles' },
    { id: 'C-WHERE', title: 'Un informe de «últimos pagos» trae todos los pagos', severity: 'medium', explanation: 'Para esquivar el error de la ventana en el WHERE, alguien quitó el filtro.', technique: 'Numerar en un WITH y filtrar fuera.', preventedBy: 'practice.window_filter' },
    { id: 'C-EMPATES', title: 'Tres clientes empatados se quedan sin premio', severity: 'high', explanation: 'ROW_NUMBER cortó el top 3 a ciegas entre seis empatados.', technique: 'RANK o DENSE_RANK, o un desempate explícito.', preventedBy: 'practice.ties' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los rankings del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.top3_ciudad', label: 'Campaña local', explanation: 'Top 3 por ciudad.' },
      { flag: 'reto.ultimo_pago', label: 'Tarjetas inactivas', explanation: 'Último pago de cada tarjeta.' },
      { flag: 'reto.top_cliente_ciudad', label: 'Embajadores', explanation: 'El mejor cliente de cada ciudad.' },
      { flag: 'reto.ranking_pagos', label: 'Niveles de la app', explanation: 'DENSE_RANK sin huecos.' },
      { flag: 'reto.cuartiles', label: 'Tests de rendimiento', explanation: 'Clientes en cuatro grupos.' },
      { flag: 'practice.window_filter', label: 'Filtro bien puesto', explanation: 'La ventana en un WITH.' },
      { flag: 'practice.ties', label: 'Premios justos', explanation: 'Empates respetados.' },
    ],
  },

  concepts: [
    { id: 'window_basics', title: 'Funciones de ventana', summary: 'Un cálculo sobre un grupo de filas que no las junta: cada fila gana una columna.' },
    { id: 'partition_by', title: 'PARTITION BY', summary: 'Reinicia la ventana en cada grupo: un ranking por ciudad, por tarjeta…' },
    { id: 'rank_functions', title: 'ROW_NUMBER, RANK y DENSE_RANK', summary: 'Iguales sin empates; con empates: 1,2,3 / 1,1,3 / 1,1,2.' },
    { id: 'top_n_per_group', title: 'Los N primeros de cada grupo', summary: 'Numerar en un WITH con PARTITION BY y filtrar n <= N fuera.' },
    { id: 'window_filter', title: 'Ventanas y WHERE', summary: 'Las ventanas se calculan después del WHERE y el HAVING: se filtran en otro paso.' },
    { id: 'ntile', title: 'NTILE', summary: 'Reparte las filas en n grupos lo más iguales posible.' },
  ],
  debriefConcepts: ['window_basics', 'partition_by', 'rank_functions', 'top_n_per_group', 'window_filter', 'ntile'],
  seniorTips: [
    'Lee la chuleta de funciones de ventana en la wiki.',
    "Inés: comercio_id, SUM(importe) AS total, RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto … WHERE estado = 'aceptado' GROUP BY comercio_id.",
    'Marta: ROW_NUMBER() OVER (PARTITION BY c.ciudad ORDER BY SUM(p.importe) DESC) en un WITH, y n <= 3 fuera.',
    'Carmen: ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) en un WITH, y n = 1 fuera.',
    'Nuria: RANK() OVER (PARTITION BY c.ciudad ORDER BY SUM(a.saldo) DESC) y el puesto 1.',
    'Diego: DENSE_RANK() OVER (ORDER BY COUNT(*) DESC) por cliente (pagos → tarjetas → cuentas).',
    'Laura: NTILE(4) OVER (ORDER BY SUM(saldo) DESC) por cliente_id en cuentas.',
    'Con Inés: la ventana no va en el WHERE; y con empates, ROW_NUMBER corta a ciegas.',
  ],
}
