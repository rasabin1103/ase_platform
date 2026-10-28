import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'
import { m07Scenes } from './m07-scenes'

const uses = (re: RegExp, what: string) => ({ pattern: re, message: `Este encargo se resuelve con ${what}.` })

/**
 * Curso 6: SQL intermedio · Misión 7 — Cruces complicados.
 * Guion legible: docs/academy/sql-intermedio/missions/m07-cruces.md
 *
 * La misma tabla unida varias veces (origen y destino), self-join, FULL OUTER
 * JOIN, CROSS JOIN y calendarios con generate_series. Trampas: un solo alias
 * para dos papeles y el filtro de la tabla de la derecha en el WHERE.
 */
export const m07Cruces: Mission = {
  id: 'm07-cruces',
  courseKey: 'sql-intermedio',
  number: 7,
  title: 'Cruces complicados',
  subtitle: 'La misma tabla dos veces, FULL OUTER JOIN, CROSS JOIN y calendarios con generate_series.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles · mes 2, semana 2',
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
  lessons: m07Lessons,
  mentor: 'ines',
  quiz: m07Quiz,
  verdicts: {
    good: {
      title: 'Todo cruzado, nada perdido',
      body: 'Marta tiene los grandes movimientos con nombres, Carmen su calendario con ceros, Nuria la explicación para su cliente, Diego la comparación de enero y febrero y Laura su matriz de cobertura.',
    },
    ok: {
      title: 'Cruces con algún cabo suelto',
      body: 'Ya unes tablas de formas más complicadas, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Filas que se pierden por el camino',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de cruces a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Semana 2 · Cruces complicados',
    paragraphs: [
      'Miércoles. Hoy los datos están repartidos de formas incómodas: dos cuentas en cada transferencia, meses sin pagos, comercios que solo aparecen en una de dos listas.',
      'Cada encargo tiene que devolver exactamente las filas y columnas pedidas, sin perder las que no tienen pareja.',
    ],
    goals: [
      'Une la misma tabla dos veces, un alias por papel.',
      'Compara filas de una tabla entre sí (self-join).',
      'Junta dos listas sin perder nada con FULL OUTER JOIN.',
      'Genera todas las combinaciones con CROSS JOIN.',
      'Fabrica un calendario con generate_series para no perder huecos.',
      'Pon los filtros de la tabla de la derecha de un LEFT JOIN en el ON.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m07Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_cruces',
      title: 'Chuleta: cruces complicados',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'same_table_twice' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Origen y destino
\`\`\`
FROM transferencias t
JOIN cuentas  ao ON ao.id = t.cuenta_origen_id
JOIN clientes co ON co.id = ao.cliente_id
LEFT JOIN cuentas  ad ON ad.id = t.cuenta_destino_id
LEFT JOIN clientes cd ON cd.id = ad.cliente_id
\`\`\`

## Tipos de JOIN
| JOIN | Conserva |
|---|---|
| \`JOIN\` | Solo las filas con pareja |
| \`LEFT JOIN\` | Todas las de la izquierda |
| \`FULL OUTER JOIN\` | Todas, de los dos lados |
| \`CROSS JOIN\` | Todas las combinaciones (sin ON) |

## Calendario
\`generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month')\` + \`LEFT JOIN\` + \`COALESCE(total, 0)\`.

## LEFT JOIN y filtros
Filtro sobre la tabla de la derecha → en el **ON** (en el WHERE, el LEFT JOIN se convierte en JOIN).`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Origen y destino: la misma tabla dos veces\nSELECT t.id, ao.cliente_id AS cliente_origen, ad.cliente_id AS cliente_destino\nFROM transferencias t\nJOIN cuentas ao ON ao.id = t.cuenta_origen_id\nLEFT JOIN cuentas ad ON ad.id = t.cuenta_destino_id;',
    retos: [
      {
        id: 'misma_ciudad',
        from: 'ines',
        title: 'Transferencias dentro de la misma ciudad',
        description: '`id` y `ciudad` de las transferencias en las que el cliente que envía y el que recibe son de la **misma ciudad** (sin las que van a otros bancos).',
        hint: 'Une `cuentas` y `clientes` dos veces (origen y destino, con alias distintos) y compara las dos ciudades.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT t.id, co.ciudad FROM transferencias t JOIN cuentas ao ON ao.id = t.cuenta_origen_id JOIN clientes co ON co.id = ao.cliente_id JOIN cuentas ad ON ad.id = t.cuenta_destino_id JOIN clientes cd ON cd.id = ad.cliente_id WHERE co.ciudad = cd.ciudad',
        columns: ['id', 'ciudad'],
      },
      {
        id: 'grandes_con_nombres',
        from: 'marta',
        title: 'Grandes transferencias con nombres',
        description: '`id`, `importe`, `emisor` (nombre de quien envía) y `receptor` (nombre de quien recibe, vacío si es de otro banco) de las transferencias de **más de 5.000 €**.',
        hint: 'Origen con `JOIN`, destino con `LEFT JOIN` (cuentas y clientes), para no perder las que van fuera.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT t.id, t.importe, co.nombre AS emisor, cd.nombre AS receptor FROM transferencias t JOIN cuentas ao ON ao.id = t.cuenta_origen_id JOIN clientes co ON co.id = ao.cliente_id LEFT JOIN cuentas ad ON ad.id = t.cuenta_destino_id LEFT JOIN clientes cd ON cd.id = ad.cliente_id WHERE t.importe > 5000',
        columns: ['id', 'importe', 'emisor', 'receptor'],
      },
      {
        id: 'calendario_servicios',
        from: 'carmen',
        title: 'Calendario de servicios con ceros',
        description: "Importe **aceptado** de la categoría **servicios** de **cada mes** de enero de 2025 a febrero de 2026, con **0** en los meses sin pagos: `mes` (como fecha, con `::date`) y `total`.",
        hint: "`generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month')` como calendario; `LEFT JOIN` con el total de servicios por mes; `COALESCE(total, 0)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "WITH meses AS (SELECT generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') AS mes), servicios AS (SELECT DATE_TRUNC('month', p.pagado_en) AS mes, SUM(p.importe) AS total FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.categoria = 'servicios' GROUP BY DATE_TRUNC('month', p.pagado_en)) SELECT m.mes::date AS mes, COALESCE(s.total, 0) AS total FROM meses m LEFT JOIN servicios s ON s.mes = m.mes",
        columns: ['mes', 'total'],
        requires: [uses(/\bgenerate_series\s*\(/i, 'un calendario: `generate_series(…)`')],
      },
      {
        id: 'traspasos_internos',
        from: 'nuria',
        title: 'Transferencias a uno mismo',
        description: '`id` y `cliente_id` de las transferencias en las que la cuenta de origen y la de destino son del **mismo cliente**.',
        hint: '`cuentas` dos veces (origen y destino) y `ao.cliente_id = ad.cliente_id`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT t.id, ao.cliente_id FROM transferencias t JOIN cuentas ao ON ao.id = t.cuenta_origen_id JOIN cuentas ad ON ad.id = t.cuenta_destino_id WHERE ao.cliente_id = ad.cliente_id',
        columns: ['id', 'cliente_id'],
      },
      {
        id: 'enero_febrero',
        from: 'diego',
        title: 'Enero y febrero, comercio a comercio',
        description: '`comercio_id`, `enero` y `febrero`: número de pagos (cualquier estado) de cada comercio en enero y en febrero de 2026, con **0** donde no haya; también los que solo tienen pagos en uno de los dos meses.',
        hint: 'Un paso por mes (recuento por comercio) y `FULL OUTER JOIN` entre los dos; `COALESCE` para el id y para los ceros.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "WITH enero AS (SELECT comercio_id, COUNT(*) AS n FROM pagos_tarjeta WHERE pagado_en >= '2026-01-01' AND pagado_en < '2026-02-01' GROUP BY comercio_id), febrero AS (SELECT comercio_id, COUNT(*) AS n FROM pagos_tarjeta WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01' GROUP BY comercio_id) SELECT COALESCE(e.comercio_id, f.comercio_id) AS comercio_id, COALESCE(e.n, 0) AS enero, COALESCE(f.n, 0) AS febrero FROM enero e FULL OUTER JOIN febrero f ON f.comercio_id = e.comercio_id",
        columns: ['comercio_id', 'enero', 'febrero'],
      },
      {
        id: 'matriz_cobertura',
        from: 'laura',
        title: 'Matriz tipo de tarjeta × categoría',
        description: '`tipo`, `categoria` y `pagos`: **cada tipo de tarjeta con cada categoría** de comercio (sin la que no tiene) y el número de pagos (cualquier estado) de la combinación, **con 0** si no hay.',
        hint: 'Tipos distintos de `tarjetas` `CROSS JOIN` categorías distintas de `comercios`; después `LEFT JOIN` con los pagos (unidos a su tarjeta y su comercio) y `COUNT(p.id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'WITH combinaciones AS (SELECT t.tipo, c.categoria FROM (SELECT DISTINCT tipo FROM tarjetas) t CROSS JOIN (SELECT DISTINCT categoria FROM comercios WHERE categoria IS NOT NULL) c), pagos AS (SELECT t.tipo, c.categoria, p.id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN comercios c ON c.id = p.comercio_id) SELECT x.tipo, x.categoria, COUNT(p.id) AS pagos FROM combinaciones x LEFT JOIN pagos p ON p.tipo = x.tipo AND p.categoria = x.categoria GROUP BY x.tipo, x.categoria',
        columns: ['tipo', 'categoria', 'pagos'],
        requires: [uses(/\bcross\s+join\b/i, 'todas las combinaciones: `CROSS JOIN`')],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Una gran transferencia a otro banco se queda sin revisar', severity: 'high', explanation: 'Sin LEFT JOIN en el destino, la que va fuera desaparece del informe.', technique: 'Origen con JOIN, destino con LEFT JOIN.', preventedBy: 'reto.grandes_con_nombres' },
    { id: 'C-CARMEN', title: 'El informe de servicios se salta los meses sin pagos', severity: 'medium', explanation: 'Sin calendario, los meses vacíos no aparecen.', technique: 'generate_series y LEFT JOIN.', preventedBy: 'reto.calendario_servicios' },
    { id: 'C-NURIA', title: 'Un cliente cree que le han cobrado dos veces', severity: 'medium', explanation: 'Nuria no pudo explicarle sus traspasos internos.', technique: 'La misma tabla dos veces.', preventedBy: 'reto.traspasos_internos' },
    { id: 'C-DIEGO', title: 'Los comercios nuevos de febrero no salen en la comparación', severity: 'medium', explanation: 'Con LEFT JOIN se pierden los que solo están en el segundo mes.', technique: 'FULL OUTER JOIN.', preventedBy: 'reto.enero_febrero' },
    { id: 'C-LAURA', title: 'Nadie prueba los pagos con crédito en servicios', severity: 'low', explanation: 'Sin la matriz completa, la combinación sin datos no se ve.', technique: 'CROSS JOIN y LEFT JOIN.', preventedBy: 'reto.matriz_cobertura' },
    { id: 'C-ALIAS', title: 'Un informe dice que no hay transferencias entre clientes', severity: 'medium', explanation: 'Un solo JOIN a cuentas para origen y destino a la vez devuelve 0 filas.', technique: 'Un alias por papel.', preventedBy: 'practice.double_alias' },
    { id: 'C-WHERE', title: 'El calendario vuelve a perder los meses vacíos', severity: 'high', explanation: 'El filtro de la tabla de la derecha en el WHERE anuló el LEFT JOIN.', technique: 'Filtro de la derecha en el ON.', preventedBy: 'practice.on_vs_where' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los cruces del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.grandes_con_nombres', label: 'Grandes movimientos', explanation: 'Emisor y receptor, también fuera.' },
      { flag: 'reto.calendario_servicios', label: 'Calendario de Carmen', explanation: 'Meses vacíos con 0.' },
      { flag: 'reto.traspasos_internos', label: 'Cliente de Nuria', explanation: 'Traspasos a uno mismo.' },
      { flag: 'reto.enero_febrero', label: 'Comparación de Diego', explanation: 'FULL OUTER JOIN.' },
      { flag: 'reto.matriz_cobertura', label: 'Matriz de Laura', explanation: 'Todas las combinaciones.' },
      { flag: 'practice.double_alias', label: 'Origen y destino', explanation: 'Dos alias.' },
      { flag: 'practice.on_vs_where', label: 'LEFT JOIN que conserva', explanation: 'Filtro en el ON.' },
    ],
  },

  concepts: [
    { id: 'same_table_twice', title: 'La misma tabla dos veces', summary: 'Un alias por papel: cuenta de origen y cuenta de destino.' },
    { id: 'self_join', title: 'Self-join', summary: 'Unir una tabla consigo misma para comparar sus filas entre sí.' },
    { id: 'full_outer_join', title: 'FULL OUTER JOIN', summary: 'Conserva las filas sin pareja de los dos lados; COALESCE para la clave.' },
    { id: 'cross_join', title: 'CROSS JOIN', summary: 'Todas las combinaciones de dos tablas; luego LEFT JOIN con los datos.' },
    { id: 'calendar_series', title: 'Calendarios con generate_series', summary: 'Una fila por mes o día para que los periodos sin datos salgan con 0.' },
    { id: 'on_vs_where', title: 'ON o WHERE en un LEFT JOIN', summary: 'El filtro de la tabla de la derecha va en el ON; en el WHERE anula el LEFT JOIN.' },
  ],
  debriefConcepts: ['same_table_twice', 'self_join', 'full_outer_join', 'cross_join', 'calendar_series', 'on_vs_where'],
  seniorTips: [
    'Lee la chuleta de cruces en la wiki.',
    'Inés: cuentas y clientes dos veces (ao/co y ad/cd) y co.ciudad = cd.ciudad.',
    'Marta: origen con JOIN, destino con LEFT JOIN; co.nombre AS emisor, cd.nombre AS receptor, importe > 5000.',
    "Carmen: generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') LEFT JOIN el total de servicios por mes; mes::date y COALESCE(total, 0).",
    'Nuria: cuentas ao y ad, ao.cliente_id = ad.cliente_id.',
    'Diego: un paso por mes y FULL OUTER JOIN; COALESCE en el id y en los recuentos.',
    'Laura: tipos CROSS JOIN categorías, LEFT JOIN pagos y COUNT(p.id).',
    'Con Inés: dos papeles, dos alias; y en un LEFT JOIN el filtro de la derecha va en el ON.',
  ],
}
