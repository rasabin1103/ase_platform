import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import type { SqlResult } from '../../../sql/types'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m04Lessons } from './m04-lessons'
import { m04Quiz } from './m04-quiz'
import { m04Scenes } from './m04-scenes'

/** El resultado tiene que salir de la función pedida, no de escribir la cifra a mano. */
const uses =
  (...fns: RegExp[]) =>
  (_r: SqlResult, sql: string) =>
    /\bfrom\b/i.test(sql) && fns.every((f) => f.test(sql))

/**
 * Curso 5: SQL desde cero · Misión 4 — Contar.
 * Guion legible: docs/academy/sql-iniciacion/missions/m04-contar.md
 *
 * COUNT (filas, columna, DISTINCT), SUM, AVG, ROUND, MIN y MAX, con encargos
 * de Inés, Marta, Diego, Carmen y Laura. Cierra la semana 1.
 */
export const m04Contar: Mission = {
  id: 'm04-contar',
  courseKey: 'sql-iniciacion',
  number: 4,
  title: 'Contar',
  subtitle: 'COUNT, SUM, AVG, MIN, MAX y ROUND: de listas a cifras.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Viernes · semana 1',
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
      title: 'Las cifras cuadran',
      body: 'Marta va al comité con el saldo total, Diego dimensiona con la media correcta, Carmen tiene sus extremos y Laura sus recuentos. Y nadie va a decir que la transferencia típica es de 900 €.',
    },
    ok: {
      title: 'Cifras con algún asterisco',
      body: 'Ya usas los agregados, pero algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Cifras que no cuadran',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión: COUNT, SUM, AVG, MIN y MAX.',
    },
  },

  briefing: {
    title: 'Semana 1 · Contar',
    paragraphs: [
      'Viernes, último día de la primera semana. Hoy nadie quiere listas: quieren cifras. Cuántos, cuánto, la media, el máximo.',
      'Los encargos se cumplen con las funciones de agregación: escribir la cifra a mano no vale.',
    ],
    goals: [
      'Cuenta filas con COUNT(*) y valores con COUNT(columna) y COUNT(DISTINCT).',
      'Suma y haz medias con SUM y AVG, filtrando antes con WHERE.',
      'Redondea con ROUND.',
      'Saca extremos con MIN y MAX.',
      'Desconfía de una media sin mirar los extremos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m04Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_agregados',
      title: 'Chuleta: contar y resumir',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'count_rows' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Funciones de agregación
- \`COUNT(*)\`: filas · \`COUNT(col)\`: filas sin NULL en col · \`COUNT(DISTINCT col)\`: valores distintos.
- \`SUM(col)\` · \`AVG(col)\` · \`MIN(col)\` · \`MAX(col)\`. Todas ignoran los NULL.
- \`ROUND(valor, 2)\`: redondear a 2 decimales.

## Reglas
- El \`WHERE\` filtra **antes** de agregar.
- Sin GROUP BY devuelven **una fila**: no mezcles columnas sueltas.
- Ponles alias: \`COUNT(*) AS total\`.
- Antes de dar una media, mira MIN y MAX.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Resume muchas filas en una cifra\nSELECT COUNT(*) AS total\nFROM clientes;',
    retos: [
      {
        id: 'total_clientes',
        from: 'ines',
        title: '¿Cuántos clientes?',
        description: 'El **número de clientes**: una fila, una columna.',
        hint: '`SELECT COUNT(*) FROM clientes`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT COUNT(*) FROM clientes',
        check: uses(/\bcount\s*\(/i),
      },
      {
        id: 'saldo_activas',
        from: 'marta',
        title: 'Saldo total de las cuentas activas',
        description: 'La **suma del saldo** de las cuentas con estado **activa**. Una cifra.',
        hint: "`SUM(saldo)` y un `WHERE estado = 'activa'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT SUM(saldo) FROM cuentas WHERE estado = 'activa'",
        check: uses(/\bsum\s*\(/i),
      },
      {
        id: 'media_completadas',
        from: 'diego',
        title: 'Importe medio de las completadas',
        description: 'La **media del importe** de las transferencias **completadas**, redondeada a **2 decimales**.',
        hint: "`ROUND(AVG(importe), 2)` con `WHERE estado = 'completada'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT ROUND(AVG(importe), 2) FROM transferencias WHERE estado = 'completada'",
        check: uses(/\bavg\s*\(/i),
      },
      {
        id: 'extremos',
        from: 'carmen',
        title: 'La más pequeña y la más grande',
        description: 'El importe **mínimo** y el **máximo** de las transferencias, en columnas `minimo` y `maximo`.',
        hint: '`MIN(importe) AS minimo, MAX(importe) AS maximo` en el mismo SELECT.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias',
        columns: ['minimo', 'maximo'],
        check: uses(/\bmin\s*\(/i, /\bmax\s*\(/i),
      },
      {
        id: 'conceptos',
        from: 'laura',
        title: 'Total y con concepto',
        description: 'En una fila: el **total** de transferencias y cuántas **tienen concepto**. Columnas `total` y `con_concepto`.',
        hint: '`COUNT(*)` cuenta todas las filas; `COUNT(concepto)` solo las que tienen concepto.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT COUNT(*) AS total, COUNT(concepto) AS con_concepto FROM transferencias',
        columns: ['total', 'con_concepto'],
        check: uses(/\bcount\s*\(/i),
      },
      {
        id: 'ciudades_distintas',
        from: 'marta',
        title: '¿En cuántas ciudades?',
        description: 'El número de **ciudades distintas** donde hay clientes. Una cifra.',
        hint: '`COUNT(DISTINCT ciudad)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta2' },
        solution: 'SELECT COUNT(DISTINCT ciudad) FROM clientes',
        check: uses(/\bcount\s*\(/i),
      },
    ],
  },

  bugs: [
    { id: 'C-COMITE', title: 'Marta va al comité sin el saldo total', severity: 'high', explanation: 'El encargo de Marta se quedó sin hacer.', technique: 'SUM con WHERE.', preventedBy: 'reto.saldo_activas' },
    { id: 'C-MOTOR', title: 'El motor de pagos se dimensiona a ojo', severity: 'medium', explanation: 'Diego no recibió el importe medio.', technique: 'ROUND(AVG(…), 2).', preventedBy: 'reto.media_completadas' },
    { id: 'C-TRIMESTRAL', title: 'El informe trimestral de Riesgos sale sin extremos', severity: 'medium', explanation: 'Carmen no recibió el mínimo y el máximo.', technique: 'MIN y MAX en el mismo SELECT.', preventedBy: 'reto.extremos' },
    { id: 'C-EXTRACTO', title: 'El test del extracto no sabe cuántas filas sin concepto esperar', severity: 'medium', explanation: 'Laura no recibió los recuentos.', technique: 'COUNT(*) frente a COUNT(columna).', preventedBy: 'reto.conceptos' },
    { id: 'C-CIUDADES', title: 'La presentación dice que hay clientes en 40 ciudades', severity: 'low', explanation: 'Contar ciudades sin DISTINCT cuenta clientes.', technique: 'COUNT(DISTINCT ciudad).', preventedBy: 'reto.ciudades_distintas' },
    { id: 'C-MEZCLA', title: 'Nuria se atasca con un error que no entiende', severity: 'low', explanation: 'Mezclar columnas sueltas con agregados da error sin GROUP BY.', technique: 'Agregados solos o con GROUP BY.', preventedBy: 'practice.aggmix' },
    { id: 'C-MEDIA', title: 'Una diapositiva dice que la transferencia típica es de 893 €', severity: 'high', explanation: 'Cuatro transferencias enormes inflan la media.', technique: 'Mirar MIN, MAX y la media sin extremos o la mediana.', preventedBy: 'practice.outliers' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con las cifras del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.saldo_activas', label: 'Comité de Marta', explanation: 'Saldo total de las cuentas activas.' },
      { flag: 'reto.media_completadas', label: 'Motor de pagos', explanation: 'Media de las completadas.' },
      { flag: 'reto.extremos', label: 'Informe de Riesgos', explanation: 'Mínimo y máximo.' },
      { flag: 'reto.conceptos', label: 'Test del extracto', explanation: 'COUNT(*) y COUNT(concepto).' },
      { flag: 'reto.ciudades_distintas', label: 'Ciudades', explanation: 'COUNT(DISTINCT ciudad).' },
      { flag: 'practice.aggmix', label: 'Error entendido', explanation: 'Agregados sin columnas sueltas.' },
      { flag: 'practice.outliers', label: 'Media con contexto', explanation: 'Extremos antes de la media.' },
    ],
  },

  concepts: [
    { id: 'count_rows', title: 'COUNT(*)', summary: 'Cuenta filas; con WHERE, solo las que cumplen la condición.' },
    { id: 'count_column', title: 'COUNT(columna) y COUNT(DISTINCT)', summary: 'COUNT(col) no cuenta NULL; COUNT(DISTINCT col) cuenta valores distintos.' },
    { id: 'sum_avg', title: 'SUM y AVG', summary: 'Suma y media de las filas que deja pasar el WHERE; ignoran los NULL.' },
    { id: 'round', title: 'ROUND', summary: 'Redondea el resultado a los decimales que se pidan.' },
    { id: 'min_max', title: 'MIN y MAX', summary: 'El valor más pequeño y el más grande, también de fechas y textos.' },
    { id: 'aggregate_rows', title: 'Un agregado, una fila', summary: 'Sin GROUP BY, los agregados devuelven una fila: no se mezclan con columnas sueltas.' },
    { id: 'average_outliers', title: 'La media y los extremos', summary: 'Unos pocos valores extremos mueven mucho la media.' },
  ],
  debriefConcepts: ['count_rows', 'count_column', 'sum_avg', 'round', 'min_max', 'aggregate_rows', 'average_outliers'],
  seniorTips: [
    'Lee la chuleta de agregados en la wiki.',
    'Inés: SELECT COUNT(*) FROM clientes.',
    "Marta: SELECT SUM(saldo) FROM cuentas WHERE estado = 'activa'.",
    "Diego: SELECT ROUND(AVG(importe), 2) FROM transferencias WHERE estado = 'completada'.",
    'Carmen: SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias.',
    'Laura: SELECT COUNT(*) AS total, COUNT(concepto) AS con_concepto FROM transferencias.',
    'Marta: SELECT COUNT(DISTINCT ciudad) FROM clientes.',
    'Con Inés: agregados sin columnas sueltas; la media se infla con los extremos.',
  ],
}
