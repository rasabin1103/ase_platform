import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'
import { m04Scenes } from './m04-scenes'

/**
 * Curso 6: SQL intermedio · Misión 4 — Informes en una consulta.
 * Guion legible: docs/academy/sql-intermedio/missions/m04-informes.md
 *
 * Agregados condicionales (FILTER y SUM/COUNT con CASE), tablas en columnas
 * (pivot), porcentajes y una fila de indicadores. Trampas: división entera y
 * COUNT(CASE … ELSE 0). Cierra la semana 1 del mes 2.
 */
export const m04Informes: Mission = {
  id: 'm04-informes',
  courseKey: 'sql-intermedio',
  number: 4,
  title: 'Informes en una consulta',
  subtitle: 'FILTER, CASE dentro de agregados, columnas por estado o por año y porcentajes.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Viernes · mes 2',
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
  lessons: m04Lessons,
  mentor: 'ines',
  quiz: m04Quiz,
  verdicts: {
    good: {
      title: 'Informes listos para presentar',
      body: 'Marta tiene su tabla por categorías, Carmen el rechazo por tipo de tarjeta, Nuria su resumen por canal, Diego la comparación entre años y Laura su fila de indicadores. Y todos los porcentajes con sus decimales.',
    },
    ok: {
      title: 'Informes casi listos',
      body: 'Ya pones recuentos en columnas, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Una consulta por número',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de informes a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Informes en una consulta',
    paragraphs: [
      'Viernes, cierre de semana: todo el mundo quiere su informe. Tablas con los estados en columnas, porcentajes, comparaciones entre años y una fila de indicadores.',
      'Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas que se piden, con los nombres de columna indicados.',
    ],
    goals: [
      'Cuenta solo algunas filas con COUNT(*) FILTER (WHERE …).',
      'Haz lo mismo con SUM o COUNT y un CASE dentro.',
      'Pon valores de filas en columnas (pivot).',
      'Calcula porcentajes sin perder decimales.',
      'Resume una tabla en una fila de indicadores.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m04Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_informes',
      title: 'Chuleta: informes en una consulta',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'filter_clause' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Contar solo algunas filas
| Forma | Ejemplo |
|---|---|
| FILTER (PostgreSQL) | \`COUNT(*) FILTER (WHERE estado = 'rechazado')\` |
| SUM con CASE | \`SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)\` |
| COUNT con CASE | \`COUNT(CASE WHEN estado = 'rechazado' THEN 1 END)\` (¡sin ELSE!) |

## Columnas por valor (pivot)
\`SUM(importe) FILTER (WHERE pagado_en < '2026-01-01') AS total_2025\`, una por columna. Sin filas, NULL: \`COALESCE(…, 0)\`.

## Porcentajes
- Sobre el total: \`ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM t), 1)\`.
- Sobre el grupo: \`ROUND(100.0 * COUNT(*) FILTER (WHERE …) / COUNT(*), 1)\`.
- **100.0**, no 100: entero entre entero da entero.

## Una fila de indicadores
Agregados sin GROUP BY.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Varios recuentos en columnas\nSELECT COUNT(*) AS pagos,\n       COUNT(*) FILTER (WHERE estado = 'rechazado') AS rechazados\nFROM pagos_tarjeta;",
    retos: [
      {
        id: 'estados_pct',
        from: 'ines',
        title: 'Pagos por estado y porcentaje',
        description: 'De cada `estado` de pago: número de `pagos` y `porcentaje` sobre el total de pagos, redondeado a **1 decimal**.',
        hint: '`ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje`, con `GROUP BY estado`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT estado, COUNT(*) AS pagos, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje FROM pagos_tarjeta GROUP BY estado',
        columns: ['estado', 'pagos', 'porcentaje'],
      },
      {
        id: 'pivot_categoria',
        from: 'marta',
        title: 'Estados en columnas por categoría',
        description: "Una fila por `categoria` de comercio ('sin categoría' para la que no tiene) con el número de pagos `aceptados`, `rechazados` y `devueltos`.",
        hint: "`COALESCE(c.categoria, 'sin categoría') AS categoria` y un `COUNT(*) FILTER (WHERE p.estado = …)` por columna; agrupa por la misma expresión del COALESCE.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT COALESCE(c.categoria, 'sin categoría') AS categoria, COUNT(*) FILTER (WHERE p.estado = 'aceptado') AS aceptados, COUNT(*) FILTER (WHERE p.estado = 'rechazado') AS rechazados, COUNT(*) FILTER (WHERE p.estado = 'devuelto') AS devueltos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY COALESCE(c.categoria, 'sin categoría')",
        columns: ['categoria', 'aceptados', 'rechazados', 'devueltos'],
      },
      {
        id: 'rechazo_tipo',
        from: 'carmen',
        title: 'Rechazo por tipo de tarjeta',
        description: 'Por `tipo` de tarjeta: `pagos`, `rechazados` y `pct_rechazo` (rechazados sobre los pagos de ese tipo, en %, con 1 decimal).',
        hint: "`pagos_tarjeta JOIN tarjetas`, `GROUP BY t.tipo`; `ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / COUNT(*), 1)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT t.tipo, COUNT(*) AS pagos, COUNT(*) FILTER (WHERE p.estado = 'rechazado') AS rechazados, ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / COUNT(*), 1) AS pct_rechazo FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id GROUP BY t.tipo",
        columns: ['tipo', 'pagos', 'rechazados', 'pct_rechazo'],
      },
      {
        id: 'canales',
        from: 'nuria',
        title: 'Incidencias por canal',
        description: 'Por `canal`: `total` de incidencias, `abiertas` (sin `cerrada_en`) y `cerradas`.',
        hint: '`COUNT(*) AS total`, `COUNT(*) FILTER (WHERE cerrada_en IS NULL) AS abiertas` y `COUNT(cerrada_en) AS cerradas`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT canal, COUNT(*) AS total, COUNT(*) FILTER (WHERE cerrada_en IS NULL) AS abiertas, COUNT(cerrada_en) AS cerradas FROM incidencias GROUP BY canal',
        columns: ['canal', 'total', 'abiertas', 'cerradas'],
      },
      {
        id: 'anios_categoria',
        from: 'diego',
        title: '2025 y 2026 en columnas',
        description: 'Por `categoria` (sin la que no tiene categoría): importe de pagos **aceptados** de 2025 (`total_2025`) y de 2026 (`total_2026`).',
        hint: "`SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025` y otra con `>= '2026-01-01'`; aceptados y categoría no nula en el WHERE.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT c.categoria, SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025, SUM(p.importe) FILTER (WHERE p.pagado_en >= '2026-01-01') AS total_2026 FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' AND c.categoria IS NOT NULL GROUP BY c.categoria",
        columns: ['categoria', 'total_2025', 'total_2026'],
      },
      {
        id: 'kpis',
        from: 'laura',
        title: 'Una fila de indicadores',
        description: 'Una sola fila con el `total` de clientes, `con_segmento`, `sin_segmento` y `premium`.',
        hint: 'Sin GROUP BY: `COUNT(*)`, `COUNT(segmento)`, `COUNT(*) FILTER (WHERE segmento IS NULL)` y `COUNT(*) FILTER (WHERE segmento = \'premium\')`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT COUNT(*) AS total, COUNT(segmento) AS con_segmento, COUNT(*) FILTER (WHERE segmento IS NULL) AS sin_segmento, COUNT(*) FILTER (WHERE segmento = 'premium') AS premium FROM clientes",
        columns: ['total', 'con_segmento', 'sin_segmento', 'premium'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La reunión de producto empieza sin la tabla por categorías', severity: 'medium', explanation: 'Marta no recibió los estados en columnas.', technique: 'COUNT(*) FILTER por columna.', preventedBy: 'reto.pivot_categoria' },
    { id: 'C-CARMEN', title: 'El informe de riesgos no distingue débito y crédito', severity: 'high', explanation: 'Carmen se quedó sin el porcentaje de rechazo por tipo de tarjeta.', technique: 'Porcentaje sobre el grupo.', preventedBy: 'reto.rechazo_tipo' },
    { id: 'C-NURIA', title: 'Atención al cliente no sabe qué canal deja más casos abiertos', severity: 'low', explanation: 'Nuria no tuvo el resumen por canal.', technique: 'FILTER y COUNT(columna).', preventedBy: 'reto.canales' },
    { id: 'C-DIEGO', title: 'La comparación entre años se hace a mano', severity: 'medium', explanation: 'Diego no recibió 2025 y 2026 en columnas.', technique: 'SUM … FILTER por año.', preventedBy: 'reto.anios_categoria' },
    { id: 'C-LAURA', title: 'El panel de calidad de datos sale vacío', severity: 'low', explanation: 'Laura no tuvo su fila de indicadores.', technique: 'Agregados sin GROUP BY.', preventedBy: 'reto.kpis' },
    { id: 'C-DIVISION', title: 'Los porcentajes del informe salen truncados', severity: 'medium', explanation: 'La división entre enteros tiró los decimales: el 2 % de devueltos salió 1 %.', technique: '100.0 antes de dividir.', preventedBy: 'practice.decimal_division' },
    { id: 'C-COUNTCASE', title: 'Un informe dice que se rechaza el 100 % de los pagos', severity: 'high', explanation: 'COUNT(CASE … ELSE 0 END) contó todas las filas.', technique: 'COUNT sin ELSE, SUM con ELSE 0, o FILTER.', preventedBy: 'practice.count_case' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los informes del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.pivot_categoria', label: 'Tabla de Marta', explanation: 'Estados en columnas.' },
      { flag: 'reto.rechazo_tipo', label: 'Informe de riesgos', explanation: 'Rechazo por tipo de tarjeta.' },
      { flag: 'reto.canales', label: 'Resumen de Nuria', explanation: 'Abiertas y cerradas por canal.' },
      { flag: 'reto.anios_categoria', label: 'Comparación de Diego', explanation: 'Dos años en columnas.' },
      { flag: 'reto.kpis', label: 'Panel de Laura', explanation: 'Una fila de indicadores.' },
      { flag: 'practice.decimal_division', label: 'Porcentajes con decimales', explanation: '100.0 antes de dividir.' },
      { flag: 'practice.count_case', label: 'Recuentos bien hechos', explanation: 'COUNT con CASE, sin ELSE.' },
    ],
  },

  concepts: [
    { id: 'filter_clause', title: 'FILTER', summary: 'Un agregado que solo ve las filas que cumplen su condición.' },
    { id: 'case_aggregate', title: 'CASE dentro de un agregado', summary: 'SUM(CASE … THEN 1 ELSE 0 END) o COUNT(CASE … THEN 1 END), sin ELSE.' },
    { id: 'pivot', title: 'Valores en columnas', summary: 'Un agregado con condición por columna: una columna por estado, año o canal.' },
    { id: 'percentages', title: 'Porcentajes', summary: 'Parte entre total (del grupo o de todo), por 100.0, y ROUND al final.' },
    { id: 'integer_division', title: 'División entera', summary: 'Entero entre entero da entero: un decimal antes de dividir.' },
    { id: 'kpi_row', title: 'Fila de indicadores', summary: 'Agregados sin GROUP BY: toda la tabla resumida en una fila.' },
  ],
  debriefConcepts: ['filter_clause', 'case_aggregate', 'pivot', 'percentages', 'integer_division', 'kpi_row'],
  seniorTips: [
    'Lee la chuleta de informes en la wiki.',
    'Inés: estado, COUNT(*) AS pagos, ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje, GROUP BY estado.',
    "Marta: COALESCE(c.categoria, 'sin categoría') y un COUNT(*) FILTER (WHERE p.estado = …) por columna.",
    "Carmen: GROUP BY t.tipo; ROUND(100.0 * COUNT(*) FILTER (WHERE p.estado = 'rechazado') / COUNT(*), 1) AS pct_rechazo.",
    'Nuria: COUNT(*) AS total, COUNT(*) FILTER (WHERE cerrada_en IS NULL) AS abiertas, COUNT(cerrada_en) AS cerradas.',
    "Diego: SUM(p.importe) FILTER (WHERE p.pagado_en < '2026-01-01') AS total_2025 y otra para 2026.",
    "Laura: COUNT(*), COUNT(segmento), COUNT(*) FILTER (WHERE segmento IS NULL), COUNT(*) FILTER (WHERE segmento = 'premium').",
    'Con Inés: 100.0 antes de dividir; COUNT con CASE, sin ELSE.',
  ],
}
