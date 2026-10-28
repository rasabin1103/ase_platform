import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m06Lessons } from './m06-lessons'
import { m06Quiz } from './m06-quiz'
import { m06Scenes } from './m06-scenes'

/** Las tendencias de hoy se calculan con funciones de ventana. */
const OVER = { pattern: /\bover\s*\(/i, message: 'Este encargo se resuelve con una función de ventana: `… OVER (…)`.' }

/** Total aceptado por mes: el primer paso de casi todos los encargos de hoy. */
const MENSUAL = "WITH mensual AS (SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY DATE_TRUNC('month', pagado_en))"

/**
 * Curso 6: SQL intermedio · Misión 6 — Tendencias.
 * Guion legible: docs/academy/sql-intermedio/missions/m06-tendencias.md
 *
 * Acumulados (SUM OVER ORDER BY), acumulado por año (PARTITION BY), LAG/LEAD,
 * medias móviles (ROWS BETWEEN) y porcentaje sobre el total (OVER ()).
 * Trampas: OVER () sin ORDER BY y LAG con meses que faltan.
 */
export const m06Tendencias: Mission = {
  id: 'm06-tendencias',
  courseKey: 'sql-intermedio',
  number: 6,
  title: 'Tendencias',
  subtitle: 'Acumulados, medias móviles, LAG y LEAD y porcentajes sobre el total.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Martes · mes 2, semana 2',
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
      title: 'La tendencia, clara',
      body: 'Marta tiene su variación mensual, Carmen la media móvil para el comité, Nuria el acumulado de cada año, Diego la tarjeta dormida localizada y Laura el peso de cada categoría.',
    },
    ok: {
      title: 'Tendencias con algún salto',
      body: 'Ya usas ventanas para acumular y comparar, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Cada mes por separado',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de tendencias a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Semana 2 · Tendencias',
    paragraphs: [
      'Martes. Hoy las preguntas son de evolución: ¿cuánto llevamos?, ¿sube o baja?, ¿cuál es la tendencia sin el ruido de cada mes?',
      'Casi todos los encargos parten del total aceptado por mes. Se hacen con funciones de ventana y tienen que devolver exactamente las columnas pedidas.',
    ],
    goals: [
      'Calcula un acumulado con SUM() OVER (ORDER BY …).',
      'Reinícialo cada año con PARTITION BY.',
      'Compara con la fila anterior con LAG.',
      'Haz una media móvil con ROWS BETWEEN.',
      'Calcula porcentajes sobre el total con OVER ().',
      'Desconfía de LAG cuando faltan periodos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m06Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_tendencias',
      title: 'Chuleta: tendencias con ventanas',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'running_total' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Total por mes (primer paso)
\`\`\`
WITH mensual AS (
  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total
  FROM pagos_tarjeta WHERE estado = 'aceptado'
  GROUP BY DATE_TRUNC('month', pagado_en)
)
\`\`\`

## Ventanas para tendencias
| Quiero | Ventana |
|---|---|
| Acumulado | \`SUM(total) OVER (ORDER BY mes)\` |
| Acumulado por año | \`SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes)\` |
| Total de todo | \`SUM(total) OVER ()\` |
| Fila anterior / siguiente | \`LAG(total) OVER (ORDER BY mes)\` / \`LEAD(…)\` |
| Media móvil 3 | \`AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)\` |

## Días entre fechas
\`fecha1::date - fecha2::date\` da un número de días.

## Cuidado
- \`OVER ()\` es toda la tabla; el \`ORDER BY\` dentro del OVER convierte la suma en acumulado.
- \`LAG\` es la **fila** anterior: si falta un mes, compara con otro.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Total aceptado por mes\nWITH mensual AS (\n  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total\n  FROM pagos_tarjeta\n  WHERE estado = 'aceptado'\n  GROUP BY DATE_TRUNC('month', pagado_en)\n)\nSELECT mes, total\nFROM mensual\nORDER BY mes;",
    retos: [
      {
        id: 'acumulado',
        from: 'ines',
        title: 'Acumulado mensual',
        description: "Pagos **aceptados** por mes: `mes` (con `DATE_TRUNC('month', pagado_en)`), `total` del mes y `acumulado` desde el principio.",
        hint: 'Un paso `mensual` con mes y total; fuera, `SUM(total) OVER (ORDER BY mes) AS acumulado`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: `${MENSUAL} SELECT mes, total, SUM(total) OVER (ORDER BY mes) AS acumulado FROM mensual`,
        columns: ['mes', 'total', 'acumulado'],
        requires: [OVER],
      },
      {
        id: 'variacion',
        from: 'marta',
        title: 'Variación respecto al mes anterior',
        description: '`mes`, `total`, `anterior` (total del mes anterior) y `variacion` (total − anterior), de los pagos **aceptados**.',
        hint: '`LAG(total) OVER (ORDER BY mes) AS anterior` y `total - LAG(total) OVER (ORDER BY mes) AS variacion`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `${MENSUAL} SELECT mes, total, LAG(total) OVER (ORDER BY mes) AS anterior, total - LAG(total) OVER (ORDER BY mes) AS variacion FROM mensual`,
        columns: ['mes', 'total', 'anterior', 'variacion'],
        requires: [OVER],
      },
      {
        id: 'media_movil',
        from: 'carmen',
        title: 'Media móvil de 3 meses',
        description: '`mes`, `total` y `media_3m`: la media del mes y los dos anteriores, con 2 decimales. Pagos **aceptados**.',
        hint: '`ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: `${MENSUAL} SELECT mes, total, ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m FROM mensual`,
        columns: ['mes', 'total', 'media_3m'],
        requires: [OVER],
      },
      {
        id: 'acumulado_anio',
        from: 'nuria',
        title: 'Acumulado de cada año',
        description: '`mes`, `total` y `acumulado_anio`: el acumulado que **vuelve a empezar en enero** de cada año. Pagos **aceptados**.',
        hint: "`SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: `${MENSUAL} SELECT mes, total, SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio FROM mensual`,
        columns: ['mes', 'total', 'acumulado_anio'],
        requires: [OVER],
      },
      {
        id: 'dias_entre_pagos',
        from: 'diego',
        title: 'Días entre pagos de la tarjeta 5',
        description: 'Pagos de la **tarjeta 5** (cualquier estado): `id`, `pagado_en` y `dias` desde su pago anterior (días naturales; el primero, vacío).',
        hint: '`pagado_en::date - LAG(pagado_en::date) OVER (ORDER BY pagado_en) AS dias`, con `WHERE tarjeta_id = 5`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT id, pagado_en, pagado_en::date - LAG(pagado_en::date) OVER (ORDER BY pagado_en) AS dias FROM pagos_tarjeta WHERE tarjeta_id = 5',
        columns: ['id', 'pagado_en', 'dias'],
        requires: [OVER],
      },
      {
        id: 'peso_categoria',
        from: 'laura',
        title: 'Peso de cada categoría',
        description: "`categoria` ('sin categoría' para la que no tiene), `total` aceptado y `porcentaje` sobre el total de todas las categorías, con 1 decimal.",
        hint: "`ROUND(100.0 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1) AS porcentaje`, agrupando por `COALESCE(c.categoria, 'sin categoría')`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT COALESCE(c.categoria, 'sin categoría') AS categoria, SUM(p.importe) AS total, ROUND(100.0 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1) AS porcentaje FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY COALESCE(c.categoria, 'sin categoría')",
        columns: ['categoria', 'total', 'porcentaje'],
        requires: [OVER],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El informe mensual no dice si se sube o se baja', severity: 'medium', explanation: 'Marta no recibió la variación respecto al mes anterior.', technique: 'LAG.', preventedBy: 'reto.variacion' },
    { id: 'C-CARMEN', title: 'El comité reacciona a un mes aislado', severity: 'high', explanation: 'Sin la media móvil, un pico de un mes pareció una tendencia.', technique: 'AVG con ROWS BETWEEN.', preventedBy: 'reto.media_movil' },
    { id: 'C-NURIA', title: 'El objetivo de 2026 se mide sumando 2025', severity: 'medium', explanation: 'Nuria no tuvo el acumulado que se reinicia cada año.', technique: 'PARTITION BY año.', preventedBy: 'reto.acumulado_anio' },
    { id: 'C-DIEGO', title: 'La alerta de tarjeta dormida sale sin probar', severity: 'medium', explanation: 'Diego no vio los 130 días sin uso de la tarjeta 5.', technique: 'LAG con fechas.', preventedBy: 'reto.dias_entre_pagos' },
    { id: 'C-LAURA', title: 'El panel no muestra el peso de cada categoría', severity: 'low', explanation: 'Laura se quedó sin los porcentajes.', technique: 'SUM(SUM(…)) OVER ().', preventedBy: 'reto.peso_categoria' },
    { id: 'C-OVER', title: 'Un informe muestra el mismo acumulado en todos los meses', severity: 'medium', explanation: 'OVER () sin ORDER BY dio el total general en cada fila.', technique: 'ORDER BY dentro del OVER.', preventedBy: 'practice.window_order' },
    { id: 'C-HUECOS', title: 'La variación de servicios compara julio con mayo', severity: 'high', explanation: 'LAG tomó la fila anterior, y faltaba junio.', technique: 'Comprobar el periodo anterior o rellenar el calendario.', preventedBy: 'practice.lag_gaps' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las tendencias del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.variacion', label: 'Informe de Marta', explanation: 'Variación mes a mes.' },
      { flag: 'reto.media_movil', label: 'Comité de Carmen', explanation: 'Media móvil de 3 meses.' },
      { flag: 'reto.acumulado_anio', label: 'Objetivos de Nuria', explanation: 'Acumulado por año.' },
      { flag: 'reto.dias_entre_pagos', label: 'Alerta de Diego', explanation: 'Días entre pagos.' },
      { flag: 'reto.peso_categoria', label: 'Panel de Laura', explanation: 'Porcentaje por categoría.' },
      { flag: 'practice.window_order', label: 'Acumulados de verdad', explanation: 'ORDER BY dentro del OVER.' },
      { flag: 'practice.lag_gaps', label: 'Comparaciones con el mes correcto', explanation: 'LAG y los huecos.' },
    ],
  },

  concepts: [
    { id: 'running_total', title: 'Acumulados', summary: 'SUM() OVER (ORDER BY …); con PARTITION BY se reinicia en cada grupo.' },
    { id: 'lag_lead', title: 'LAG y LEAD', summary: 'El valor de la fila anterior o la siguiente, según el ORDER BY del OVER.' },
    { id: 'window_frame', title: 'Marcos y medias móviles', summary: 'ROWS BETWEEN n PRECEDING AND CURRENT ROW decide qué filas entran en la ventana.' },
    { id: 'share_of_total', title: 'Porcentaje sobre el total', summary: 'OVER () ve todas las filas: SUM(SUM(x)) OVER () es el total general.' },
    { id: 'lag_gaps', title: 'LAG y los huecos', summary: 'LAG da la fila anterior, no el periodo anterior: si falta un mes, compara con otro.' },
  ],
  debriefConcepts: ['running_total', 'lag_lead', 'window_frame', 'share_of_total', 'lag_gaps'],
  seniorTips: [
    'Lee la chuleta de tendencias en la wiki.',
    'Inés: paso mensual (DATE_TRUNC y SUM de aceptados) y SUM(total) OVER (ORDER BY mes) AS acumulado.',
    'Marta: LAG(total) OVER (ORDER BY mes) AS anterior y total - LAG(total) OVER (ORDER BY mes) AS variacion.',
    'Carmen: ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m.',
    "Nuria: SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio.",
    'Diego: pagado_en::date - LAG(pagado_en::date) OVER (ORDER BY pagado_en) AS dias, con tarjeta_id = 5.',
    "Laura: ROUND(100.0 * SUM(p.importe) / SUM(SUM(p.importe)) OVER (), 1), por COALESCE(c.categoria, 'sin categoría').",
    'Con Inés: OVER () es todo, OVER (ORDER BY …) acumula; LAG mira la fila, no el calendario.',
  ],
}
