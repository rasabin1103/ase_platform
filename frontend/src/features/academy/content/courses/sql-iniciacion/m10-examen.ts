import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { PROBE_SQL, probe } from '../../../sql/probe'
import { EXAM_TODAY, prestamosData, prestamosDbSql } from '../../../sql/prestamosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'

/** Tipos de interés esperados tras el encargo 9: 7,50 en los aprobados de más de 20.000 €. */
const INTERES_FINAL = prestamosData().prestamos.map((p) => [String(p[0]), p[5] === 'aprobado' && Number(p[2]) > 20000 ? '7.50' : p[4]])

const columns = (table: string) =>
  `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY ordinal_position`

/**
 * Curso 5: SQL desde cero · Examen práctico.
 * Guion legible: docs/academy/sql-iniciacion/missions/m10-examen.md
 *
 * Tres horas, sin mentora ni pistas, sobre dos tablas que el alumno no ha visto
 * (préstamos y cuotas) en el entorno de pruebas. Diez encargos, uno por
 * misión del curso, a 10 puntos cada uno; aprueba con 70/100. Solo cuenta
 * como terminado (y para el certificado) si se aprueba.
 */
export const m10Examen: Mission = {
  id: 'm10-examen',
  courseKey: 'sql-iniciacion',
  number: 10,
  title: 'Examen práctico',
  subtitle: 'Tres horas, sin pistas: diez encargos sobre las tablas de préstamos. Aprueba con 70 de 100.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Préstamos', laura: 'QA Lead · examinadora' }),
  playerRole: 'QA · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · semana 3',
  duration: 180,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'DAT',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  practicalExam: { passMark: 70, retoPoints: 10, bugPoints: 0, rejectedPenalty: 0 },
  hideBugList: true,
  wikiLabel: 'Wiki · Datos',
  initialMetrics: {},
  verdicts: {
    good: {
      title: 'Examen práctico superado',
      body: 'Has resuelto encargos reales sobre tablas que no conocías, sin ayuda. Esto cuenta para el certificado.',
    },
    ok: {
      title: 'Examen práctico superado',
      body: 'Aprobado. Mira en el detalle qué encargos se quedaron por el camino.',
    },
    bad: {
      title: 'Examen práctico no superado',
      body: 'Todavía no llegas a 70. Mira qué encargos faltaron, repasa la misión de cada uno y vuelve a intentarlo: el examen se puede repetir.',
    },
  },

  briefing: {
    title: 'Examen práctico',
    paragraphs: [
      'Lunes de la semana 3, 09:00. Kobalto lanza los préstamos personales y el equipo necesita datos antes de la reunión de lanzamiento. Las tablas `prestamos` y `cuotas` son nuevas: nadie te las ha enseñado.',
      'Tienes tres horas y diez encargos, uno por cada misión del curso. No hay mentora ni pistas: la descripción de las tablas está en la wiki.',
      'Cada encargo vale 10 puntos. Apruebas con 70 de 100. Estás en el entorno de pruebas: no modifiques datos salvo en el encargo que lo pide (los encargos de consulta se comparan con los datos de partida). Si te equivocas, «Restaurar» lo deja como al principio.',
    ],
    goals: [
      'Lee en la wiki cómo son las tablas de préstamos.',
      'Resuelve los diez encargos de la consola (10 puntos cada uno).',
      'Modifica datos solo en el encargo que lo pide, y con cuidado.',
      'Entrega antes de las 12:00.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: [
    {
      id: 'mail_exam',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Examen práctico: préstamos',
      body: 'Buenos días:\n\nHoy es tu examen práctico. Tienes en la consola **diez encargos** sobre las tablas nuevas `prestamos` y `cuotas` (y las de siempre). Su descripción está en la wiki: «Préstamos: tablas».\n\n- Tienes hasta las **12:00**.\n- Cada encargo vale **10 puntos**; apruebas con **70**.\n- Sin pistas ni ayuda de Inés: hoy vas sola.\n- Estás en el entorno de pruebas. **No toques datos** salvo en el encargo que lo pide.\n\nSuerte.\nLaura',
      onDeliver: [{ kind: 'flag', key: 'exam.started' }],
    },
    {
      id: 'reminder',
      channel: 'chat',
      from: 'laura',
      at: 150,
      body: 'Te quedan 30 minutos. Repasa que los encargos que has hecho siguen en verde y entrega a las 12:00.',
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 180,
      subject: '12:00 · Entrega',
      body: '**Laura:** Se acabó el tiempo. ¿Entregas?',
      choices: [{ id: 'submit', text: 'Entregar el examen.', reply: 'Recibido. Aquí tienes el resultado.', effects: [{ kind: 'endMission' }] }],
    },
  ],
  endSceneId: 'closing',

  docs: [
    {
      id: 'prestamos',
      title: 'Préstamos: tablas',
      updatedLabel: 'Equipo de Datos',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.prestamos' }],
      body: `## prestamos
- \`id\`, \`cliente_id\` → \`clientes.id\`
- \`importe\` (numeric), \`plazo_meses\` (integer), \`tipo_interes\` (numeric, en %)
- \`estado\`: **solicitado**, **aprobado**, **rechazado** o **cancelado**
- \`solicitado_en\` (date) y \`aprobado_en\` (date; vacío si no se ha aprobado)

## cuotas
- \`id\`, \`prestamo_id\` → \`prestamos.id\`
- \`numero\` (1, 2, 3…), \`vence_en\` (date), \`importe\` (numeric)
- \`pagada_en\` (date; vacío si no se ha pagado)

## Reglas de negocio
- Hoy es **${EXAM_TODAY}**: una cuota está **vencida** si \`vence_en\` es anterior a hoy.
- Cada préstamo aprobado debería tener sus cuotas generadas.

## Evaluación
- 10 encargos × 10 puntos. Aprobado: 70.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql() + prestamosDbSql() + PROBE_SQL,
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Examen práctico: las tablas nuevas son prestamos y cuotas\nSELECT *\nFROM prestamos\nLIMIT 5;',
    retos: [
      {
        id: 'e1_catalogo',
        from: 'marta',
        title: '1 · Catálogo de préstamos',
        description: 'De **todos** los préstamos: `id`, el importe con el nombre `importe_solicitado` y el plazo con el nombre `meses`.',
        hint: '',
        solution: 'SELECT id, importe AS importe_solicitado, plazo_meses AS meses FROM prestamos',
        columns: ['id', 'importe_solicitado', 'meses'],
      },
      {
        id: 'e2_aprobados',
        from: 'marta',
        title: '2 · Aprobados medianos',
        description: '`id`, `cliente_id` e `importe` de los préstamos **aprobados** con un importe **entre 5.000 y 15.000 €** (ambos incluidos).',
        hint: '',
        solution: "SELECT id, cliente_id, importe FROM prestamos WHERE estado = 'aprobado' AND importe BETWEEN 5000 AND 15000",
      },
      {
        id: 'e3_top',
        from: 'carmen',
        title: '3 · Los cinco más grandes',
        description: '`id` e `importe` de los **5 préstamos de mayor importe**, del mayor al menor.',
        hint: '',
        solution: 'SELECT id, importe FROM prestamos ORDER BY importe DESC LIMIT 5',
        ordered: true,
      },
      {
        id: 'e4_tramos',
        from: 'marta',
        title: '4 · Solicitudes por tramo',
        description: 'De los préstamos **sin fecha de aprobación** y en estado **solicitado**: `id`, `importe` y `tramo`, que vale **pequeño** (menos de 5.000), **mediano** (menos de 15.000) o **grande** (el resto).',
        hint: '',
        solution: "SELECT id, importe, CASE WHEN importe < 5000 THEN 'pequeño' WHEN importe < 15000 THEN 'mediano' ELSE 'grande' END AS tramo FROM prestamos WHERE aprobado_en IS NULL AND estado = 'solicitado'",
        columns: ['id', 'importe', 'tramo'],
      },
      {
        id: 'e5_impagadas',
        from: 'carmen',
        title: '5 · Cuotas vencidas sin pagar',
        description: `Cuántas cuotas están **vencidas** (antes del ${EXAM_TODAY}) y **sin pagar**, y su importe total. Una fila, columnas \`impagadas\` e \`importe_impagado\`.`,
        hint: '',
        solution: `SELECT COUNT(*) AS impagadas, SUM(importe) AS importe_impagado FROM cuotas WHERE vence_en < '${EXAM_TODAY}' AND pagada_en IS NULL`,
        columns: ['impagadas', 'importe_impagado'],
        check: (_r, sql) => /\bcount\s*\(/i.test(sql) && /\bsum\s*\(/i.test(sql),
      },
      {
        id: 'e6_estados',
        from: 'marta',
        title: '6 · Resumen por estado',
        description: 'Por estado: `estado`, **número de préstamos** e **importe medio** redondeado a 2 decimales, solo de los estados con **más de 3 préstamos**.',
        hint: '',
        solution: 'SELECT estado, COUNT(*), ROUND(AVG(importe), 2) FROM prestamos GROUP BY estado HAVING COUNT(*) > 3',
      },
      {
        id: 'e7_clientes',
        from: 'nuria',
        title: '7 · Aprobados con su cliente',
        description: 'De los préstamos **aprobados**: `id` del préstamo y `nombre`, `apellidos` y `email` del cliente.',
        hint: '',
        solution: "SELECT p.id, c.nombre, c.apellidos, c.email FROM prestamos p JOIN clientes c ON p.cliente_id = c.id WHERE p.estado = 'aprobado'",
        check: (_r, sql) => /\bjoin\b/i.test(sql),
      },
      {
        id: 'e8_sin_cuotas',
        from: 'diego',
        title: '8 · Aprobados sin cuotas',
        description: 'El `id` de los préstamos **aprobados** que **no tienen ninguna cuota** generada.',
        hint: '',
        solution: "SELECT p.id FROM prestamos p WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id)",
      },
      {
        id: 'e9_interes',
        from: 'carmen',
        title: '9 · Revisión del tipo de interés',
        description: 'Pon el `tipo_interes` a **7,50** en los préstamos **aprobados** de **más de 20.000 €**. Ninguno más.',
        hint: '',
        state: [{ query: 'SELECT id, tipo_interes FROM prestamos ORDER BY id', rows: INTERES_FINAL }],
      },
      {
        id: 'e10_recordatorios',
        from: 'laura',
        title: '10 · Tabla de recordatorios',
        description: 'Crea **recordatorios**: `id` (integer, clave primaria), `cuota_id` (integer, obligatorio, referencia a `cuotas(id)`), `canal` (text, obligatorio, solo **email** o **sms**) y `enviado_en` (date, obligatoria).',
        hint: '',
        state: [
          { query: columns('recordatorios'), rows: [['id', 'integer', 'NO'], ['cuota_id', 'integer', 'NO'], ['canal', 'text', 'NO'], ['enviado_en', 'date', 'NO']] },
          { query: probe("INSERT INTO recordatorios (id, cuota_id, canal, enviado_en) VALUES (1, 1, 'sms', '2026-03-01')"), rows: [['ok']] },
          { query: probe("INSERT INTO recordatorios (id, cuota_id, canal, enviado_en) VALUES (1, 99999, 'sms', '2026-03-01')"), rows: [['23503']] },
          { query: probe("INSERT INTO recordatorios (id, cuota_id, canal, enviado_en) VALUES (1, 1, 'fax', '2026-03-01')"), rows: [['23514']] },
          { query: probe("INSERT INTO recordatorios (id, cuota_id, canal, enviado_en) VALUES (1, 1, 'sms', '2026-03-01')", "INSERT INTO recordatorios (id, cuota_id, canal, enviado_en) VALUES (1, 2, 'email', '2026-03-01')"), rows: [['23505']] },
        ],
      },
    ],
  },

  bugs: [],

  prevention: {
    title: 'Encargos del examen',
    intro: 'Lo que conseguiste en el examen práctico.',
    preventedLabel: 'Encargos conseguidos',
    appearedLabel: 'Encargos',
    rules: [],
  },


  concepts: [],
  debriefConcepts: [],
  seniorTips: [],
}

/**
 * Respuestas de referencia (una ejecución por encargo, en orden): las usan
 * c5m10.test.ts contra PostgreSQL y el E2E en la consola del navegador.
 */
export const M10_SQL_ANSWERS = [
  'SELECT id, importe AS importe_solicitado, plazo_meses AS meses FROM prestamos;',
  "SELECT id, cliente_id, importe FROM prestamos WHERE importe >= 5000 AND importe <= 15000 AND estado = 'aprobado';",
  'SELECT id, importe FROM prestamos ORDER BY importe DESC LIMIT 5;',
  "SELECT id, importe, CASE WHEN importe < 5000 THEN 'pequeño' WHEN importe < 15000 THEN 'mediano' ELSE 'grande' END AS tramo FROM prestamos WHERE estado = 'solicitado' AND aprobado_en IS NULL;",
  "SELECT COUNT(*) AS impagadas, SUM(importe) AS importe_impagado FROM cuotas WHERE pagada_en IS NULL AND vence_en < '2026-03-01';",
  'SELECT estado, COUNT(*) AS n, ROUND(AVG(importe), 2) AS media FROM prestamos GROUP BY estado HAVING COUNT(*) > 3;',
  "SELECT p.id, c.nombre, c.apellidos, c.email FROM prestamos p JOIN clientes c ON c.id = p.cliente_id WHERE p.estado = 'aprobado';",
  "SELECT p.id FROM prestamos p LEFT JOIN cuotas c ON c.prestamo_id = p.id WHERE p.estado = 'aprobado' AND c.id IS NULL;",
  "BEGIN; UPDATE prestamos SET tipo_interes = 7.50 WHERE estado = 'aprobado' AND importe > 20000; COMMIT;",
  "CREATE TABLE recordatorios (id integer PRIMARY KEY, cuota_id integer NOT NULL REFERENCES cuotas(id), canal text NOT NULL CHECK (canal IN ('email', 'sms')), enviado_en date NOT NULL);",
]

// Resumen del debrief: un renglón por encargo, como en el examen de Karate.
m10Examen.prevention!.rules = m10Examen.sqlLab!.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') }))
