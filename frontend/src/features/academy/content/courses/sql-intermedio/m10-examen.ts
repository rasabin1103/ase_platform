import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { EXAM_TODAY, prestamosDbSql } from '../../../sql/prestamosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { viewChecks } from './m09-vistas'

const RESUMEN = 'SELECT estado, COUNT(*) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY estado'

/**
 * Curso 6: SQL intermedio · Examen práctico.
 * Guion legible: docs/academy/sql-intermedio/missions/m10-examen.md
 *
 * Tres horas, sin mentora ni pistas, sobre Kobalto ampliada y las tablas de
 * préstamos y cuotas, en el entorno de pruebas. Diez encargos, uno por misión
 * del curso, a 10 puntos cada uno; aprueba con 70/100. Solo cuenta como
 * terminado (y para el certificado) si se aprueba.
 */
export const m10Examen: Mission = {
  id: 'm10-examen',
  courseKey: 'sql-intermedio',
  number: 10,
  title: 'Examen práctico',
  subtitle: 'Tres horas, sin pistas: diez encargos de varios pasos sobre préstamos, pagos y clientes. Aprueba con 70 de 100.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Préstamos', laura: 'QA Lead · examinadora' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · mes 2, semana 3',
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
      body: 'Has resuelto encargos de varios pasos sin ayuda: subconsultas, WITH, ventanas, cruces, calidad de datos y vistas. Esto cuenta para el certificado.',
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
      'Lunes de la semana 3, 09:00. El comité de préstamos se reúne a mediodía y necesita respuestas de varios pasos: préstamos, cuotas, clientes y pagos con tarjeta.',
      'Tienes tres horas y diez encargos, uno por cada misión del curso. No hay mentora ni pistas: la descripción de las tablas está en la wiki.',
      'Cada encargo vale 10 puntos. Apruebas con 70 de 100. Estás en el entorno de pruebas: no modifiques datos (los encargos de consulta se comparan con los datos de partida). El último encargo pide crear una vista. Si te equivocas, «Restaurar» lo deja como al principio.',
    ],
    goals: [
      'Lee en la wiki cómo son las tablas.',
      'Resuelve los diez encargos de la consola (10 puntos cada uno).',
      'No modifiques datos: solo crea la vista que se pide.',
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
      subject: 'Examen práctico de SQL intermedio',
      body: 'Buenos días:\n\nHoy es tu examen práctico. Tienes en la consola **diez encargos** sobre préstamos y cuotas (`prestamos`, `cuotas`) y las tablas de siempre, incluidas `pagos_tarjeta` y `comercios`. La descripción de las tablas nuevas está en la wiki: «Préstamos: tablas».\n\n- Tienes hasta las **12:00**.\n- Cada encargo vale **10 puntos**; apruebas con **70**.\n- Sin pistas ni ayuda de Inés: hoy vas sola.\n- Estás en el entorno de pruebas. **No toques datos**: solo crea la vista del último encargo.\n\nSuerte.\nLaura',
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
- \`importe\` (numeric), \`plazo_meses\` (integer: 12, 24, 36, 48 o 60), \`tipo_interes\` (numeric, en %)
- \`estado\`: **solicitado**, **aprobado**, **rechazado** o **cancelado**
- \`solicitado_en\` (date) y \`aprobado_en\` (date; vacío si no se ha aprobado)

## cuotas
- \`id\`, \`prestamo_id\` → \`prestamos.id\`
- \`numero\` (1, 2, 3…), \`vence_en\` (date), \`importe\` (numeric)
- \`pagada_en\` (date; vacío si no se ha pagado)

## Las de siempre
\`clientes\`, \`cuentas\`, \`tarjetas\`, \`transferencias\`, \`incidencias\`, \`comercios\` y \`pagos_tarjeta\`. Un pago con tarjeta llega a su cliente por \`pagos_tarjeta\` → \`tarjetas\` → \`cuentas\`.

## Reglas
- Hoy es **${EXAM_TODAY}**: una cuota está **vencida** si \`vence_en\` es anterior a hoy. No uses CURRENT_DATE.

## Evaluación
- 10 encargos × 10 puntos. Aprobado: 70.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql() + prestamosDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Examen práctico: tablas prestamos y cuotas, y las de siempre\nSELECT *\nFROM prestamos\nLIMIT 5;',
    retos: [
      {
        id: 'e1_sobre_media',
        from: 'marta',
        title: '1 · Por encima de la media',
        description: '`id` e `importe` de los préstamos (de cualquier estado) cuyo importe es **mayor que la media de todos los préstamos**, sin escribir la media a mano.',
        hint: '',
        solution: 'SELECT id, importe FROM prestamos WHERE importe > (SELECT AVG(importe) FROM prestamos)',
        columns: ['id', 'importe'],
        requires: [{ pattern: /\(\s*select\b/i, message: 'La media la tiene que calcular la propia consulta.' }],
      },
      {
        id: 'e2_grandes_deudores',
        from: 'carmen',
        title: '2 · Más de 20.000 € aprobados',
        description: '`id`, `nombre` y `total_aprobado` de los clientes cuya suma de préstamos **aprobados** supera los **20.000 €**.',
        hint: '',
        solution: "WITH aprobados AS (SELECT cliente_id, SUM(importe) AS total_aprobado FROM prestamos WHERE estado = 'aprobado' GROUP BY cliente_id) SELECT c.id, c.nombre, a.total_aprobado FROM clientes c JOIN aprobados a ON a.cliente_id = c.id WHERE a.total_aprobado > 20000",
        columns: ['id', 'nombre', 'total_aprobado'],
      },
      {
        id: 'e3_solicitudes_mes',
        from: 'marta',
        title: '3 · Solicitudes por mes',
        description: '`mes` (el primer día del mes, como fecha) y número de `solicitudes` de préstamo de cada mes, según `solicitado_en`.',
        hint: '',
        solution: "SELECT DATE_TRUNC('month', solicitado_en)::date AS mes, COUNT(*) AS solicitudes FROM prestamos GROUP BY DATE_TRUNC('month', solicitado_en)",
        columns: ['mes', 'solicitudes'],
      },
      {
        id: 'e4_sin_tarjeta',
        from: 'nuria',
        title: '4 · Con préstamo y sin pagos con tarjeta',
        description: '`cliente_id` de los clientes que tienen algún préstamo **aprobado** pero **ningún pago con tarjeta**.',
        hint: '',
        solution: "SELECT cliente_id FROM prestamos WHERE estado = 'aprobado' EXCEPT SELECT a.cliente_id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id",
      },
      {
        id: 'e5_plazos',
        from: 'carmen',
        title: '5 · Estados por plazo, en columnas',
        description: 'Una fila por `plazo_meses` con el número de préstamos `aprobados` y `rechazados` en dos columnas.',
        hint: '',
        solution: "SELECT plazo_meses, COUNT(*) FILTER (WHERE estado = 'aprobado') AS aprobados, COUNT(*) FILTER (WHERE estado = 'rechazado') AS rechazados FROM prestamos GROUP BY plazo_meses",
        columns: ['plazo_meses', 'aprobados', 'rechazados'],
      },
      {
        id: 'e6_mayor_por_plazo',
        from: 'marta',
        title: '6 · El mayor de cada plazo',
        description: '`plazo_meses`, `id` e `importe` del préstamo de **mayor importe de cada plazo** (cualquier estado).',
        hint: '',
        solution: 'WITH numerados AS (SELECT plazo_meses, id, importe, ROW_NUMBER() OVER (PARTITION BY plazo_meses ORDER BY importe DESC) AS n FROM prestamos) SELECT plazo_meses, id, importe FROM numerados WHERE n = 1',
        columns: ['plazo_meses', 'id', 'importe'],
      },
      {
        id: 'e7_cobrado',
        from: 'carmen',
        title: '7 · Cobrado por mes y acumulado',
        description: 'De las cuotas **pagadas**: `mes` del pago (primer día del mes, como fecha), `cobrado` en ese mes y `acumulado` desde el primer mes.',
        hint: '',
        solution: "WITH mensual AS (SELECT DATE_TRUNC('month', pagada_en)::date AS mes, SUM(importe) AS cobrado FROM cuotas WHERE pagada_en IS NOT NULL GROUP BY DATE_TRUNC('month', pagada_en)) SELECT mes, cobrado, SUM(cobrado) OVER (ORDER BY mes) AS acumulado FROM mensual",
        columns: ['mes', 'cobrado', 'acumulado'],
        requires: [{ pattern: /\bover\s*\(/i, message: 'El acumulado se calcula con una función de ventana.' }],
      },
      {
        id: 'e8_cuotas_por_prestamo',
        from: 'laura',
        title: '8 · Cuotas pagadas y pendientes',
        description: 'De **todos** los préstamos **aprobados** (también los que no tienen cuotas): `id`, número de cuotas `pagadas` y `pendientes` (0 si no hay).',
        hint: '',
        solution: "SELECT p.id, COUNT(c.id) FILTER (WHERE c.pagada_en IS NOT NULL) AS pagadas, COUNT(c.id) FILTER (WHERE c.pagada_en IS NULL) AS pendientes FROM prestamos p LEFT JOIN cuotas c ON c.prestamo_id = p.id WHERE p.estado = 'aprobado' GROUP BY p.id",
        columns: ['id', 'pagadas', 'pendientes'],
      },
      {
        id: 'e9_primera_impagada',
        from: 'nuria',
        title: '9 · La primera cuota impagada',
        description: `De cada préstamo con cuotas **vencidas** (antes del ${EXAM_TODAY}) **sin pagar**: \`prestamo_id\`, \`numero\` y \`vence_en\` de la **más antigua**.`,
        hint: '',
        solution: `SELECT DISTINCT ON (prestamo_id) prestamo_id, numero, vence_en FROM cuotas WHERE pagada_en IS NULL AND vence_en < '${EXAM_TODAY}' ORDER BY prestamo_id, vence_en`,
        columns: ['prestamo_id', 'numero', 'vence_en'],
      },
      {
        id: 'e10_vista',
        from: 'laura',
        title: '10 · La vista resumen_prestamos',
        description: 'Crea la vista **`resumen_prestamos`** con una fila por `estado`, el número de `prestamos` y el `importe_total`.',
        hint: '',
        requires: [{ pattern: /\bcreate\s+(or\s+replace\s+)?view\b/i, message: 'Este encargo se cumple creando una vista.' }],
        state: viewChecks('resumen_prestamos', ['estado', 'prestamos', 'importe_total'], RESUMEN),
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
 * Respuestas de referencia (una ejecución por encargo, en orden): las usa
 * c6m10.test.ts contra PostgreSQL. Escritas a propósito de otra forma que las
 * soluciones, para comprobar que se corrige el resultado y no la consulta.
 */
export const M10_SQL_ANSWERS = [
  'WITH media AS (SELECT AVG(importe) AS m FROM prestamos) SELECT p.id, p.importe FROM prestamos p WHERE p.importe > (SELECT m FROM media);',
  "SELECT c.id, c.nombre, SUM(p.importe) AS total_aprobado FROM clientes c JOIN prestamos p ON p.cliente_id = c.id WHERE p.estado = 'aprobado' GROUP BY c.id, c.nombre HAVING SUM(p.importe) > 20000;",
  "SELECT TO_CHAR(solicitado_en, 'YYYY-MM-01')::date AS mes, COUNT(*) AS solicitudes FROM prestamos GROUP BY 1 ORDER BY 1;",
  "SELECT DISTINCT p.cliente_id FROM prestamos p WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuentas a JOIN tarjetas t ON t.cuenta_id = a.id JOIN pagos_tarjeta pt ON pt.tarjeta_id = t.id WHERE a.cliente_id = p.cliente_id);",
  "SELECT plazo_meses, SUM(CASE WHEN estado = 'aprobado' THEN 1 ELSE 0 END) AS aprobados, SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END) AS rechazados FROM prestamos GROUP BY plazo_meses ORDER BY 1;",
  'SELECT DISTINCT ON (plazo_meses) plazo_meses, id, importe FROM prestamos ORDER BY plazo_meses, importe DESC;',
  "SELECT DATE_TRUNC('month', pagada_en)::date AS mes, SUM(importe) AS cobrado, SUM(SUM(importe)) OVER (ORDER BY DATE_TRUNC('month', pagada_en)::date) AS acumulado FROM cuotas WHERE pagada_en IS NOT NULL GROUP BY 1;",
  "SELECT p.id, COALESCE(SUM(CASE WHEN c.pagada_en IS NOT NULL THEN 1 END), 0) AS pagadas, COALESCE(SUM(CASE WHEN c.id IS NOT NULL AND c.pagada_en IS NULL THEN 1 END), 0) AS pendientes FROM prestamos p LEFT JOIN cuotas c ON c.prestamo_id = p.id WHERE p.estado = 'aprobado' GROUP BY p.id;",
  "WITH n AS (SELECT prestamo_id, numero, vence_en, ROW_NUMBER() OVER (PARTITION BY prestamo_id ORDER BY vence_en) AS r FROM cuotas WHERE pagada_en IS NULL AND vence_en < DATE '2026-03-01') SELECT prestamo_id, numero, vence_en FROM n WHERE r = 1;",
  'CREATE VIEW resumen_prestamos AS SELECT estado, COUNT(*) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY estado;',
]

// Resumen del debrief: un renglón por encargo, como en los demás exámenes.
m10Examen.prevention!.rules = m10Examen.sqlLab!.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') }))
