import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Scenes } from './m02-scenes'

/** La réplica es una foto del 1/3/2026: CURRENT_DATE cambiaría el resultado cada día. */
const NO_NOW = { pattern: /\b(current_date|current_timestamp|now\s*\(|localtimestamp)/i, message: 'La réplica es una foto del 1 de marzo de 2026: usa esa fecha en vez de CURRENT_DATE o NOW().' }

/**
 * Curso 6: SQL intermedio · Misión 2 — Fechas y textos.
 * Guion legible: docs/academy/sql-intermedio/missions/m02-fechas-textos.md
 *
 * Primera misión con Kobalto ampliada (comercios y pagos_tarjeta): DATE_TRUNC,
 * EXTRACT, intervalos, rangos de un mes, TO_CHAR solo para mostrar y
 * funciones de texto (SPLIT_PART, TRIM…).
 */
export const m02FechasTextos: Mission = {
  id: 'm02-fechas-textos',
  courseKey: 'sql-intermedio',
  number: 2,
  title: 'Fechas y textos',
  subtitle: 'DATE_TRUNC, EXTRACT, intervalos, TO_CHAR y funciones de texto.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles · mes 2',
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
  lessons: m02Lessons,
  mentor: 'ines',
  quiz: m02Quiz,
  verdicts: {
    good: {
      title: 'Cada fecha en su sitio',
      body: 'Inés tiene su serie mensual, Marta sus premios, Carmen la revisión antifraude, Nuria su presupuesto de emails, Diego sus pagos de madrugada y Laura su bug de espacios. Y ningún informe mezcla febreros.',
    },
    ok: {
      title: 'Fechas casi bajo control',
      body: 'Ya trabajas con fechas y textos, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Febrero el doble y enero desordenado',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de fechas y textos a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Fechas y textos',
    paragraphs: [
      'Llegan a la réplica los pagos con tarjeta: comercios y pagos de enero de 2025 a febrero de 2026. Hoy todo va de cuándo: por mes, por día de la semana, por hora. Y de textos que no están tan limpios como parecen.',
      'La réplica es una foto del 1 de marzo de 2026: cuando necesites «hoy», usa esa fecha.',
    ],
    goals: [
      'Agrupa por mes con DATE_TRUNC.',
      'Saca el día de la semana y la hora con EXTRACT.',
      'Resta tiempo a una fecha con INTERVAL.',
      'Filtra un mes concreto con un rango, sin mezclar años.',
      'Usa TO_CHAR solo para mostrar, nunca para ordenar.',
      'Trabaja textos con SPLIT_PART, TRIM, LOWER y compañía.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m02Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_fechas',
      title: 'Chuleta: fechas y textos',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'date_trunc' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas nuevas
- \`comercios\`: id, nombre, categoria, ciudad (la tienda online no tiene ciudad).
- \`pagos_tarjeta\`: id, tarjeta_id, comercio_id, importe, estado (aceptado, rechazado, devuelto), pagado_en (fecha y hora).
- Datos de enero de 2025 a febrero de 2026. «Hoy» = **1 de marzo de 2026**.

## Fechas
| Quiero | Uso |
|---|---|
| Agrupar por mes | \`DATE_TRUNC('month', pagado_en)\` |
| Día de la semana | \`EXTRACT(ISODOW FROM pagado_en)\` → 1 lunes … 7 domingo |
| Hora | \`EXTRACT(HOUR FROM pagado_en)\` |
| Restar tiempo | \`DATE '2026-03-01' - INTERVAL '1 year'\` |
| Edad exacta | \`AGE(fin, inicio)\` |
| Un mes concreto | \`>= '2026-02-01' AND < '2026-03-01'\` |
| Mostrar | \`TO_CHAR(pagado_en, 'DD/MM/YYYY')\` (texto: solo al final) |

## Textos
\`UPPER\`, \`LOWER\`, \`INITCAP\`, \`LENGTH\`, \`TRIM\`, \`SPLIT_PART(t, '@', 2)\`, \`REPLACE\`, \`SUBSTRING\`, \`||\` (con NULL da NULL).`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Pagos aceptados por mes\nSELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos\nFROM pagos_tarjeta\nWHERE estado = 'aceptado'\nGROUP BY DATE_TRUNC('month', pagado_en)\nORDER BY mes;",
    retos: [
      {
        id: 'pagos_mes',
        from: 'ines',
        title: 'Pagos aceptados por mes',
        description: "De los pagos **aceptados**, una fila por mes: `mes` (con `DATE_TRUNC('month', pagado_en)`), número de `pagos` y `total` de importe.",
        hint: "`SELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total … WHERE estado = 'aceptado' GROUP BY 1`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY DATE_TRUNC('month', pagado_en)",
        columns: ['mes', 'pagos', 'total'],
      },
      {
        id: 'antiguedad',
        from: 'marta',
        title: 'Al menos un año de antigüedad',
        description: '`id`, `nombre` y `fecha_alta` de los clientes con **al menos un año** de antigüedad a **1 de marzo de 2026** (dados de alta el 1/3/2025 o antes).',
        hint: "`WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'`. No uses CURRENT_DATE.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT id, nombre, fecha_alta FROM clientes WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'",
        forbid: [NO_NOW],
      },
      {
        id: 'finde',
        from: 'carmen',
        title: 'Fin de semana y más de 200 €',
        description: '`id`, `importe` y `pagado_en` de los pagos **aceptados** hechos en **sábado o domingo** con importe **mayor que 200 €**.',
        hint: '`EXTRACT(ISODOW FROM pagado_en) IN (6, 7)` (o `EXTRACT(DOW …) IN (0, 6)`), más las otras dos condiciones con AND.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT id, importe, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND EXTRACT(ISODOW FROM pagado_en) IN (6, 7) AND importe > 200",
      },
      {
        id: 'dominios',
        from: 'nuria',
        title: 'Clientes por dominio de email',
        description: '`dominio` (lo que va después de la @ en el email) y número de `clientes` de cada dominio.',
        hint: "`SPLIT_PART(email, '@', 2) AS dominio`, `COUNT(*) AS clientes` y `GROUP BY` del dominio.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT SPLIT_PART(email, '@', 2) AS dominio, COUNT(*) AS clientes FROM clientes GROUP BY SPLIT_PART(email, '@', 2)",
        columns: ['dominio', 'clientes'],
      },
      {
        id: 'madrugada',
        from: 'diego',
        title: 'Pagos de madrugada',
        description: '`id`, `tarjeta_id`, `importe` y `pagado_en` de los pagos (cualquier estado) hechos **entre las 00:00 y las 06:00** (sin incluir las 06:00).',
        hint: '`EXTRACT(HOUR FROM pagado_en) < 6`: las horas 0 a 5.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT id, tarjeta_id, importe, pagado_en FROM pagos_tarjeta WHERE EXTRACT(HOUR FROM pagado_en) < 6',
      },
      {
        id: 'espacios',
        from: 'laura',
        title: 'Comercios con espacios de más',
        description: 'Los comercios cuyo nombre tiene **espacios al principio o al final**: `id`, `nombre` (tal cual) y `limpio` (el nombre sin esos espacios).',
        hint: '`TRIM(nombre) AS limpio` y `WHERE nombre <> TRIM(nombre)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT id, nombre, TRIM(nombre) AS limpio FROM comercios WHERE nombre <> TRIM(nombre)',
        columns: ['id', 'nombre', 'limpio'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Los premios por antigüedad no salen', severity: 'medium', explanation: 'Marta no recibió los clientes con al menos un año.', technique: 'Fecha menos INTERVAL.', preventedBy: 'reto.antiguedad' },
    { id: 'C-CARMEN', title: 'Antifraude no revisa los pagos de fin de semana', severity: 'high', explanation: 'Carmen se quedó sin la lista de pagos grandes en sábado y domingo.', technique: 'EXTRACT(ISODOW).', preventedBy: 'reto.finde' },
    { id: 'C-NURIA', title: 'Se contrata el plan de emails más caro', severity: 'low', explanation: 'Sin el recuento por dominio, Nuria contrató el plan grande.', technique: 'SPLIT_PART y GROUP BY.', preventedBy: 'reto.dominios' },
    { id: 'C-DIEGO', title: 'El proceso nocturno se prueba sin pagos de madrugada', severity: 'medium', explanation: 'Diego no tuvo los pagos que caen en la franja de liquidación.', technique: 'EXTRACT(HOUR).', preventedBy: 'reto.madrugada' },
    { id: 'C-LAURA', title: 'La búsqueda de comercios sigue fallando', severity: 'medium', explanation: 'Nadie encontró los nombres con espacios de más.', technique: 'TRIM y comparar con el original.', preventedBy: 'reto.espacios' },
    { id: 'C-FEBRERO', title: 'El informe mensual dice que febrero dobló las ventas', severity: 'high', explanation: 'EXTRACT(MONTH) = 2 sumó febrero de 2025 y de 2026.', technique: 'Rango de fechas para un mes concreto.', preventedBy: 'practice.month_range' },
    { id: 'C-ORDEN', title: 'El informe mensual sale desordenado', severity: 'low', explanation: 'Ordenar por TO_CHAR ordena texto.', technique: 'Ordenar por la fecha; formato al final.', preventedBy: 'practice.format_last' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.antiguedad', label: 'Premios de Marta', explanation: 'Un año de antigüedad con INTERVAL.' },
      { flag: 'reto.finde', label: 'Revisión antifraude', explanation: 'Fin de semana con EXTRACT.' },
      { flag: 'reto.dominios', label: 'Plan de emails', explanation: 'Clientes por dominio.' },
      { flag: 'reto.madrugada', label: 'Proceso nocturno', explanation: 'Pagos de 00:00 a 06:00.' },
      { flag: 'reto.espacios', label: 'Búsqueda de comercios', explanation: 'Nombres con espacios de más.' },
      { flag: 'practice.month_range', label: 'Febrero bien contado', explanation: 'Rango de fechas, sin mezclar años.' },
      { flag: 'practice.format_last', label: 'Informe en orden', explanation: 'Ordenar por fecha, formato al final.' },
    ],
  },

  concepts: [
    { id: 'date_trunc', title: 'DATE_TRUNC', summary: 'Corta una fecha al mes, día u hora: sirve para agrupar por periodos.' },
    { id: 'date_extract', title: 'EXTRACT', summary: 'Saca un número de una fecha: año, mes, hora o día de la semana (ISODOW).' },
    { id: 'intervals', title: 'Intervalos y AGE', summary: "Fecha menos INTERVAL '1 year'; AGE da la diferencia exacta. «Hoy» fijo, no CURRENT_DATE." },
    { id: 'date_ranges', title: 'Un mes concreto', summary: 'Rango >= primer día AND < primer día del mes siguiente; EXTRACT(MONTH) mezcla años.' },
    { id: 'format_last', title: 'TO_CHAR solo para mostrar', summary: 'TO_CHAR devuelve texto: ordena por la fecha y da formato al final.' },
    { id: 'text_functions', title: 'Funciones de texto', summary: 'UPPER, LOWER, LENGTH, SPLIT_PART, REPLACE, ||…' },
    { id: 'trim_clean', title: 'TRIM y textos sucios', summary: 'Quita espacios del principio y del final; nombre <> TRIM(nombre) los encuentra.' },
  ],
  debriefConcepts: ['date_trunc', 'date_extract', 'intervals', 'date_ranges', 'format_last', 'text_functions', 'trim_clean'],
  seniorTips: [
    'Lee la chuleta de fechas y textos en la wiki.',
    "Inés: SELECT DATE_TRUNC('month', pagado_en) AS mes, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY 1.",
    "Marta: WHERE fecha_alta <= DATE '2026-03-01' - INTERVAL '1 year'.",
    "Carmen: estado = 'aceptado' AND EXTRACT(ISODOW FROM pagado_en) IN (6, 7) AND importe > 200.",
    "Nuria: SPLIT_PART(email, '@', 2) AS dominio, COUNT(*) AS clientes, GROUP BY 1.",
    'Diego: WHERE EXTRACT(HOUR FROM pagado_en) < 6.',
    'Laura: SELECT id, nombre, TRIM(nombre) AS limpio FROM comercios WHERE nombre <> TRIM(nombre).',
    'Con Inés: un mes concreto con un rango; TO_CHAR solo al final.',
  ],
}
