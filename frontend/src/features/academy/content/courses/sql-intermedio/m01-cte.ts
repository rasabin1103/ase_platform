import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Scenes } from './m01-scenes'

/** Los encargos de hoy se piden por pasos: exigen un WITH. */
const WITH = { pattern: /^\s*with\b/i, message: 'Este encargo se pide por pasos: empieza la consulta con `WITH paso AS (…)`.' }

/**
 * Curso 6: SQL intermedio · Misión 1 — Paso a paso.
 * Guion legible: docs/academy/sql-intermedio/missions/m01-cte.md
 *
 * CTE (WITH): un paso, varios encadenados, un paso reutilizado, ámbito del WITH
 * y granularidad antes de agregar.
 */
export const m01Cte: Mission = {
  id: 'm01-cte',
  courseKey: 'sql-intermedio',
  number: 1,
  title: 'Paso a paso',
  subtitle: 'WITH: cada paso con su nombre, la consulta se lee de arriba abajo.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Martes · mes 2',
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
  lessons: m01Lessons,
  mentor: 'ines',
  quiz: m01Quiz,
  verdicts: {
    good: {
      title: 'Consultas que se entienden',
      body: 'Marta tiene su programa de fidelización, Carmen su análisis por ciudad, Nuria sus llamadas, Diego las comisiones con la media correcta y Laura sus clientes de prueba. Y cualquiera puede revisar cada paso.',
    },
    ok: {
      title: 'Pasos con nombre, a medias',
      body: 'Ya usas WITH, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Paréntesis dentro de paréntesis',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de WITH a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Paso a paso',
    paragraphs: [
      'Segundo día del mes. Los encargos ya necesitan dos o tres pasos: primero un total por cliente, luego una media, luego un filtro. Hoy los escribirás con WITH, un paso con nombre detrás de otro.',
      'Los encargos de hoy se piden por pasos: la consulta tiene que empezar con WITH y devolver exactamente lo que se pide.',
    ],
    goals: [
      'Escribe un paso con WITH y úsalo como una tabla.',
      'Encadena varios pasos separados por comas.',
      'Reutiliza un paso dos veces en la misma consulta.',
      'Entiende que un WITH solo vive dentro de su consulta.',
      'Lleva los datos a la granularidad correcta antes de agregar.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m01Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_with',
      title: 'Chuleta: consultas por pasos con WITH',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'cte_basic' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma
\`\`\`
WITH paso1 AS (
  SELECT …
),
paso2 AS (
  SELECT … FROM paso1 …
)
SELECT … FROM paso2 …;
\`\`\`
- Un solo \`WITH\` al principio; los pasos, separados por **comas**; sin coma antes del SELECT final.
- Cada paso puede usar los anteriores, y la consulta final puede usar cualquiera, las veces que quiera.
- Ponle a cada columna calculada un alias (\`SUM(saldo) AS saldo_total\`): es el nombre que verán los pasos siguientes.

## Ámbito
El WITH termina con su consulta (\`;\`). No crea tablas. Para algo reutilizable: una vista.

## Granularidad
Antes de agregar: «¿una fila de qué?». Media por cliente → primero una fila por cliente con su total, después la media.

## Saldo total de un cliente
\`SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id\``,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Un paso con nombre y la consulta final\nWITH saldos AS (\n  SELECT cliente_id, SUM(saldo) AS saldo_total\n  FROM cuentas\n  GROUP BY cliente_id\n)\nSELECT *\nFROM saldos;',
    retos: [
      {
        id: 'saldo_alto',
        from: 'ines',
        title: 'Más de 20.000 € en total',
        description: 'Con un paso `saldos` (saldo total de cada cliente): `id`, `nombre` y `saldo_total` de los clientes con **más de 20.000 €** en total.',
        hint: 'El paso suma por `cliente_id`; la consulta final une `clientes` con `saldos` y filtra `saldo_total > 20000`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN saldos s ON s.cliente_id = c.id WHERE s.saldo_total > 20000',
        columns: ['id', 'nombre', 'saldo_total'],
        requires: [WITH],
      },
      {
        id: 'emisores',
        from: 'marta',
        title: 'Más de 1.000 € enviados',
        description: '`id`, `nombre` y `total_enviado` de los clientes que han enviado **más de 1.000 €** en transferencias **completadas**, sumando todas sus cuentas.',
        hint: 'Un paso `enviado` con `transferencias JOIN cuentas` (por `cuenta_origen_id`), solo completadas, agrupado por `cliente_id`. Después, `clientes JOIN enviado` con `total_enviado > 1000`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "WITH enviado AS (SELECT a.cliente_id, SUM(t.importe) AS total_enviado FROM transferencias t JOIN cuentas a ON a.id = t.cuenta_origen_id WHERE t.estado = 'completada' GROUP BY a.cliente_id) SELECT c.id, c.nombre, e.total_enviado FROM clientes c JOIN enviado e ON e.cliente_id = c.id WHERE e.total_enviado > 1000",
        columns: ['id', 'nombre', 'total_enviado'],
        requires: [WITH],
      },
      {
        id: 'sobre_media_ciudad',
        from: 'carmen',
        title: 'Por encima de la media de su ciudad',
        description: '`id`, `nombre`, `ciudad` y `saldo_total` de los clientes cuyo saldo total supera la **media de los saldos totales de su ciudad**.',
        hint: 'Dos pasos: `saldos` (una fila por cliente, con su ciudad y su total) y `medias` (AVG de `saldo_total` por ciudad, sobre `saldos`). Al final, une los dos por ciudad y compara.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'WITH saldos AS (SELECT c.id, c.nombre, c.ciudad, SUM(a.saldo) AS saldo_total FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre, c.ciudad), medias AS (SELECT ciudad, AVG(saldo_total) AS media FROM saldos GROUP BY ciudad) SELECT s.id, s.nombre, s.ciudad, s.saldo_total FROM saldos s JOIN medias m ON m.ciudad = s.ciudad WHERE s.saldo_total > m.media',
        columns: ['id', 'nombre', 'ciudad', 'saldo_total'],
        requires: [WITH],
      },
      {
        id: 'abiertas_saldo_bajo',
        from: 'nuria',
        title: 'Incidencia abierta y poco saldo',
        description: '`id`, `nombre` y `saldo_total` de los clientes con **alguna incidencia abierta** (`cerrada_en` vacía) y un saldo total **menor que 5.000 €**.',
        hint: 'Un paso con los `cliente_id` distintos de incidencias abiertas y otro con los saldos. Al final, `clientes` unido a los dos.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'WITH abiertas AS (SELECT DISTINCT cliente_id FROM incidencias WHERE cerrada_en IS NULL), saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN abiertas a ON a.cliente_id = c.id JOIN saldos s ON s.cliente_id = c.id WHERE s.saldo_total < 5000',
        columns: ['id', 'nombre', 'saldo_total'],
        requires: [WITH],
      },
      {
        id: 'segmentos',
        from: 'diego',
        title: 'Saldo medio por cliente y segmento',
        description: 'De cada `segmento` (sin los clientes sin segmento): `segmento`, número de `clientes` y `saldo_medio` **por cliente**, redondeado a 2 decimales.',
        hint: 'Primero una fila por cliente con su segmento y su saldo total; después `GROUP BY segmento` con `COUNT(*)` y `ROUND(AVG(saldo_total), 2)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'WITH saldos AS (SELECT c.id, c.segmento, SUM(a.saldo) AS saldo_total FROM clientes c JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.segmento) SELECT segmento, COUNT(*) AS clientes, ROUND(AVG(saldo_total), 2) AS saldo_medio FROM saldos WHERE segmento IS NOT NULL GROUP BY segmento',
        columns: ['segmento', 'clientes', 'saldo_medio'],
        requires: [WITH],
      },
      {
        id: 'sobre_media',
        from: 'laura',
        title: 'Por encima de la media de todos',
        description: '`cliente_id` y `saldo_total` de los clientes cuyo saldo total supera la **media de los saldos totales de todos los clientes**. El paso `saldos`, escrito una sola vez.',
        hint: 'En la consulta final, `FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT cliente_id, saldo_total FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos)',
        columns: ['cliente_id', 'saldo_total'],
        requires: [WITH],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El programa de fidelización arranca sin lista', severity: 'medium', explanation: 'Marta no recibió los clientes que más envían.', technique: 'Un paso que agrega y un filtro sobre él.', preventedBy: 'reto.emisores' },
    { id: 'C-CARMEN', title: 'El análisis de riesgo por zonas no tiene datos', severity: 'high', explanation: 'Carmen se quedó sin los clientes por encima de la media de su ciudad.', technique: 'Dos pasos encadenados con WITH.', preventedBy: 'reto.sobre_media_ciudad' },
    { id: 'C-NURIA', title: 'Atención al cliente llama al azar', severity: 'medium', explanation: 'Nuria no tuvo la lista de clientes con incidencia abierta y poco saldo.', technique: 'Dos pasos y un JOIN final.', preventedBy: 'reto.abiertas_saldo_bajo' },
    { id: 'C-DIEGO', title: 'Las comisiones se calculan con la media por cuenta', severity: 'high', explanation: 'Sin la media por cliente, las comisiones de los estándar salen casi 2.000 € por debajo.', technique: 'Una fila por cliente y después la media.', preventedBy: 'reto.segmentos' },
    { id: 'C-LAURA', title: 'Los clientes de prueba se eligen a ojo', severity: 'low', explanation: 'Laura no recibió los clientes por encima de la media.', technique: 'Un paso reutilizado dos veces.', preventedBy: 'reto.sobre_media' },
    { id: 'C-AMBITO', title: 'Aparece una tabla «saldos» copiada y desactualizada', severity: 'medium', explanation: 'Para reutilizar un WITH, alguien copió los saldos en una tabla que nadie actualiza.', technique: 'WITH para una consulta; vista para algo permanente.', preventedBy: 'practice.scope' },
    { id: 'C-GRANULARIDAD', title: 'Un informe mezcla medias por cuenta y por cliente', severity: 'high', explanation: 'AVG sobre un JOIN con cuentas da una media por cuenta.', technique: 'Llevar los datos a una fila por cliente antes de agregar.', preventedBy: 'practice.grain' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.emisores', label: 'Fidelización de Marta', explanation: 'Clientes que envían más de 1.000 €.' },
      { flag: 'reto.sobre_media_ciudad', label: 'Riesgo por zonas', explanation: 'Dos pasos: saldos y medias por ciudad.' },
      { flag: 'reto.abiertas_saldo_bajo', label: 'Llamadas de Nuria', explanation: 'Incidencia abierta y poco saldo.' },
      { flag: 'reto.segmentos', label: 'Comisiones de Diego', explanation: 'Media por cliente, no por cuenta.' },
      { flag: 'reto.sobre_media', label: 'Clientes de prueba', explanation: 'Un paso usado dos veces.' },
      { flag: 'practice.scope', label: 'Sin tablas copiadas', explanation: 'El WITH vive en su consulta.' },
      { flag: 'practice.grain', label: 'Medias bien hechas', explanation: 'Primero la granularidad, luego el agregado.' },
    ],
  },

  concepts: [
    { id: 'cte_basic', title: 'WITH (CTE)', summary: 'Un paso con nombre que la consulta final usa como una tabla.' },
    { id: 'cte_readability', title: 'Consultas que se leen', summary: 'Cada paso con un nombre que dice qué calcula; la consulta se lee de arriba abajo.' },
    { id: 'cte_chain', title: 'Pasos encadenados', summary: 'Un solo WITH, pasos separados por comas; cada uno puede usar los anteriores.' },
    { id: 'cte_reuse', title: 'Reutilizar un paso', summary: 'El mismo paso se usa varias veces en la consulta: el cálculo se escribe una vez.' },
    { id: 'cte_scope', title: 'Ámbito del WITH', summary: 'Solo existe dentro de su consulta; para algo permanente, una vista.' },
    { id: 'cte_grain', title: 'Granularidad', summary: '«¿Una fila de qué?»: lleva los datos a la granularidad correcta antes de agregar.' },
    { id: 'cte_vs_subquery', title: 'WITH o subconsulta', summary: 'Subconsulta para algo sencillo; WITH para varios pasos o pasos reutilizados.' },
  ],
  debriefConcepts: ['cte_basic', 'cte_readability', 'cte_chain', 'cte_reuse', 'cte_scope', 'cte_grain', 'cte_vs_subquery'],
  seniorTips: [
    'Lee la chuleta de WITH en la wiki.',
    'Inés: WITH saldos AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT c.id, c.nombre, s.saldo_total FROM clientes c JOIN saldos s ON … WHERE s.saldo_total > 20000.',
    "Marta: paso enviado = transferencias completadas JOIN cuentas por cuenta_origen_id, SUM por cliente_id; filtra total_enviado > 1000.",
    'Carmen: pasos saldos (por cliente, con ciudad) y medias (AVG por ciudad sobre saldos); compara uniendo por ciudad.',
    'Nuria: pasos abiertas (DISTINCT cliente_id con cerrada_en IS NULL) y saldos; saldo_total < 5000.',
    'Diego: una fila por cliente con segmento y total; después COUNT(*) y ROUND(AVG(saldo_total), 2) por segmento.',
    'Laura: FROM saldos WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos).',
    'Con Inés: el WITH vive en su consulta; y antes de una media, «¿una fila de qué?».',
  ],
}
