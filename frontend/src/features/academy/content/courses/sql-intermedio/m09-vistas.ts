import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import type { SqlReto } from '../../../sql/types'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m09Lessons } from './m09-lessons'
import { m09Quiz } from './m09-quiz'
import { m09Scenes } from './m09-scenes'

type StateCheck = NonNullable<SqlReto['state']>[number]

/**
 * Comprobaciones de que existe la vista `name`, con estas columnas en este
 * orden, y que devuelve exactamente lo mismo que `reference` (comparado en
 * SQL, así 0 y 0.00 son iguales). Si la vista no existe, la consulta falla y
 * el encargo no se cumple.
 */
export function viewChecks(name: string, columns: string[], reference: string): StateCheck[] {
  const cols = columns.join(', ')
  return [
    { query: `SELECT table_type FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${name}'`, rows: [['VIEW']] },
    { query: `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${name}' ORDER BY ordinal_position`, rows: columns.map((c) => [c]) },
    {
      query: `SELECT COUNT(*) FROM ((SELECT ${cols} FROM ${name} EXCEPT ALL (${reference})) UNION ALL ((${reference}) EXCEPT ALL SELECT ${cols} FROM ${name})) diferencias`,
      rows: [['0']],
    },
  ]
}

const CREATE_VIEW = { pattern: /\bcreate\s+(or\s+replace\s+)?view\b/i, message: 'Este encargo se cumple creando una vista: `CREATE VIEW nombre AS …`.' }

const SALDOS = 'SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id'
const KPI = `SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0) AS saldo_total FROM clientes c LEFT JOIN (${SALDOS}) s ON s.cliente_id = c.id`
const COPIAS = 'SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n FROM pagos_tarjeta) x WHERE n > 1'
const BLOQUEADA = "SELECT p.id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'"
const CADUCADA = "SELECT p.id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en"
const REVISAR = `SELECT id, 'duplicado' AS motivo FROM (${COPIAS}) a UNION ALL SELECT id, 'tarjeta_bloqueada' FROM (${BLOQUEADA}) b UNION ALL SELECT id, 'tarjeta_caducada' FROM (${CADUCADA}) c`

/**
 * Curso 6: SQL intermedio · Misión 9 — Tu informe reutilizable.
 * Guion legible: docs/academy/sql-intermedio/missions/m09-vistas.md
 *
 * En el entorno de pruebas: CREATE VIEW, vistas sobre vistas, usar una vista,
 * EXPLAIN básico y una vista de trabajo para soporte. Trampas: copiar los
 * datos en una tabla y EXPLAIN ANALYZE con un DELETE.
 */
export const m09Vistas: Mission = {
  id: 'm09-vistas',
  courseKey: 'sql-intermedio',
  number: 9,
  title: 'Tu informe reutilizable',
  subtitle: 'Vistas, vistas sobre vistas y una primera lectura de EXPLAIN.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Viernes · mes 2, semana 2',
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
  lessons: m09Lessons,
  mentor: 'ines',
  quiz: m09Quiz,
  verdicts: {
    good: {
      title: 'Tus consultas, para todo el equipo',
      body: 'Marta tiene su panel, Carmen su control diario, Nuria consulta sola, Diego sabe cómo se ejecuta la vista y soporte tiene su lista de pagos a revisar. Lista para el examen.',
    },
    ok: {
      title: 'Vistas casi listas',
      body: 'Ya creas vistas, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief antes del examen.',
    },
    bad: {
      title: 'Consultas que solo viven en tu consola',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de vistas antes del examen.',
    },
  },

  briefing: {
    title: 'Mes 2 · Semana 2 · Tu informe reutilizable',
    paragraphs: [
      'Viernes, último día antes del examen. Hoy tus mejores consultas pasan a ser vistas que todo el equipo puede usar.',
      'Estás en el entorno de pruebas: puedes crear y borrar vistas. «Restaurar» deja la base de datos como al principio. Los encargos de vistas se comprueban mirando la vista que has creado.',
    ],
    goals: [
      'Crea una vista con CREATE VIEW y nombres de columna claros.',
      'Construye una vista encima de otra.',
      'Usa una vista como si fuera una tabla.',
      'Lee un plan con EXPLAIN.',
      'Decide entre vista, tabla copiada y vista materializada.',
      'Mide con EXPLAIN ANALYZE sin cambiar datos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m09Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_vistas',
      title: 'Chuleta: vistas y EXPLAIN',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'create_view' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Vistas
\`\`\`
CREATE VIEW nombre AS
SELECT …;                      -- alias en todo lo calculado
CREATE OR REPLACE VIEW nombre AS …;   -- cambiar (añadir columnas al final)
DROP VIEW nombre;              -- borrar (no toca las tablas)
\`\`\`
- Se usa como una tabla: \`SELECT … FROM nombre\`.
- Se recalcula cada vez: siempre al día.
- Una vista puede usar otras vistas.
- No uses \`SELECT *\` dentro de una vista.

## Ver qué vistas hay
\`SELECT table_name FROM information_schema.views WHERE table_schema = 'public';\`

## EXPLAIN
- \`EXPLAIN consulta\`: el plan, sin ejecutar.
- \`EXPLAIN ANALYZE consulta\`: **ejecuta** y mide. Con DML: \`BEGIN; EXPLAIN ANALYZE …; ROLLBACK;\`
- Seq Scan = recorre la tabla entera · Index Scan = usa un índice.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: una consulta guardada con nombre\nCREATE VIEW saldos_cliente AS\nSELECT cliente_id, SUM(saldo) AS saldo_total\nFROM cuentas\nGROUP BY cliente_id;',
    retos: [
      {
        id: 'vista_saldos',
        from: 'ines',
        title: 'La vista saldos_cliente',
        description: 'Crea la vista **`saldos_cliente`** con `cliente_id` y `saldo_total` (suma del saldo de sus cuentas).',
        hint: '`CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id;`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [CREATE_VIEW],
        state: viewChecks('saldos_cliente', ['cliente_id', 'saldo_total'], SALDOS),
      },
      {
        id: 'vista_kpi',
        from: 'marta',
        title: 'La vista kpi_clientes, sobre saldos_cliente',
        description: 'Crea **`kpi_clientes`** con `id`, `nombre`, `ciudad` y `saldo_total` de **todos** los clientes (0 si no tienen cuentas), **usando la vista `saldos_cliente`**.',
        hint: '`clientes LEFT JOIN saldos_cliente` y `COALESCE(s.saldo_total, 0) AS saldo_total`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [CREATE_VIEW],
        state: [
          ...viewChecks('kpi_clientes', ['id', 'nombre', 'ciudad', 'saldo_total'], KPI),
          { query: "SELECT COUNT(*) FROM information_schema.view_table_usage WHERE view_name = 'kpi_clientes' AND table_name = 'saldos_cliente'", rows: [['1']] },
        ],
      },
      {
        id: 'vista_control',
        from: 'carmen',
        title: 'La vista control_pagos',
        description: 'Crea **`control_pagos`**: una sola fila con `duplicados` (copias sobrantes), `tarjeta_bloqueada` y `tarjeta_caducada` (pagos **aceptados** con tarjeta bloqueada o después de su caducidad).',
        hint: 'Una subconsulta escalar `(SELECT COUNT(*) FROM (…) x)` por columna, como el panel del jueves.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [CREATE_VIEW],
        state: viewChecks(
          'control_pagos',
          ['duplicados', 'tarjeta_bloqueada', 'tarjeta_caducada'],
          `SELECT (SELECT COUNT(*) FROM (${COPIAS}) a), (SELECT COUNT(*) FROM (${BLOQUEADA}) b), (SELECT COUNT(*) FROM (${CADUCADA}) c)`,
        ),
      },
      {
        id: 'usar_vista',
        from: 'nuria',
        title: 'Madrid y más de 10.000 €, con la vista',
        description: '**Usando la vista `kpi_clientes`**: `id`, `nombre` y `saldo_total` de los clientes de **Madrid** con un saldo total **mayor que 10.000 €**.',
        hint: "`SELECT id, nombre, saldo_total FROM kpi_clientes WHERE ciudad = 'Madrid' AND saldo_total > 10000`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: `SELECT id, nombre, saldo_total FROM (${KPI}) k WHERE ciudad = 'Madrid' AND saldo_total > 10000`,
        columns: ['id', 'nombre', 'saldo_total'],
        requires: [{ pattern: /\bfrom\s+kpi_clientes\b/i, message: 'Este encargo se hace con la vista: `FROM kpi_clientes`.' }],
      },
      {
        id: 'explain_vista',
        from: 'diego',
        title: 'El plan de una consulta sobre la vista',
        description: 'Ejecuta un **`EXPLAIN`** (sin ANALYZE) de una consulta sobre **`kpi_clientes`**, por ejemplo la de un cliente concreto.',
        hint: '`EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;` y mira qué tablas aparecen.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [
          { pattern: /^\s*explain\b(?!\s*\(?\s*analy[sz]e)/i, message: 'Empieza la consulta con `EXPLAIN` (sin ANALYZE).' },
          { pattern: /\bkpi_clientes\b/i, message: 'La consulta del EXPLAIN tiene que usar la vista `kpi_clientes`.' },
        ],
        check: (r) => r.columns[0] === 'QUERY PLAN' && r.rows.some((row) => /\b(clientes|cuentas)\b/.test(String(row[0]))),
      },
      {
        id: 'vista_revisar',
        from: 'laura',
        title: 'La vista pagos_a_revisar',
        description: "Crea **`pagos_a_revisar`** con `id` y `motivo`: una fila por pago y motivo, con los motivos **'duplicado'** (copias sobrantes), **'tarjeta_bloqueada'** y **'tarjeta_caducada'** (pagos aceptados).",
        hint: "Tres consultas (una por regla) con una columna fija para el motivo, unidas con `UNION ALL`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [CREATE_VIEW],
        state: viewChecks('pagos_a_revisar', ['id', 'motivo'], REVISAR),
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El panel de producto repite el cálculo del saldo', severity: 'medium', explanation: 'Sin kpi_clientes sobre saldos_cliente, cada informe calcula el saldo a su manera.', technique: 'Vistas sobre vistas.', preventedBy: 'reto.vista_kpi' },
    { id: 'C-CARMEN', title: 'El control diario se sigue pidiendo por chat', severity: 'medium', explanation: 'Carmen no tiene su vista de control.', technique: 'Una vista de una fila con un recuento por regla.', preventedBy: 'reto.vista_control' },
    { id: 'C-NURIA', title: 'Atención al cliente depende de ti para cada listado', severity: 'low', explanation: 'Nuria no aprendió a usar la vista.', technique: 'SELECT sobre la vista.', preventedBy: 'reto.usar_vista' },
    { id: 'C-DIEGO', title: 'La app usa la vista sin saber cómo se ejecuta', severity: 'low', explanation: 'Nadie miró el plan antes de ponerla en producción.', technique: 'EXPLAIN.', preventedBy: 'reto.explain_vista' },
    { id: 'C-LAURA', title: 'Soporte no tiene lista de pagos a revisar', severity: 'medium', explanation: 'Laura se quedó sin la vista de trabajo.', technique: 'UNION ALL con una columna de motivo.', preventedBy: 'reto.vista_revisar' },
    { id: 'C-FOTO', title: 'Producto presenta saldos de la semana pasada', severity: 'high', explanation: 'El panel se guardó como tabla copiada y nadie la actualizó.', technique: 'Vista en vez de CREATE TABLE AS.', preventedBy: 'practice.view_live' },
    { id: 'C-ANALYZE', title: 'Un EXPLAIN ANALYZE borra pagos en un entorno compartido', severity: 'high', explanation: 'EXPLAIN ANALYZE ejecutó el DELETE que solo se quería medir.', technique: 'BEGIN; EXPLAIN ANALYZE …; ROLLBACK;', preventedBy: 'practice.explain_safe' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con las vistas del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.vista_kpi', label: 'Panel de Marta', explanation: 'kpi_clientes sobre saldos_cliente.' },
      { flag: 'reto.vista_control', label: 'Control de Carmen', explanation: 'Vista de una fila.' },
      { flag: 'reto.usar_vista', label: 'Nuria, autónoma', explanation: 'Consultas sobre la vista.' },
      { flag: 'reto.explain_vista', label: 'Plan revisado', explanation: 'EXPLAIN antes de producción.' },
      { flag: 'reto.vista_revisar', label: 'Lista de soporte', explanation: 'Pagos con su motivo.' },
      { flag: 'practice.view_live', label: 'Datos al día', explanation: 'Vista, no copia.' },
      { flag: 'practice.explain_safe', label: 'Medir sin romper', explanation: 'ANALYZE dentro de una transacción.' },
    ],
  },

  concepts: [
    { id: 'create_view', title: 'CREATE VIEW', summary: 'Una consulta guardada con nombre que se usa como una tabla y se recalcula siempre.' },
    { id: 'view_on_view', title: 'Vistas sobre vistas', summary: 'Cada vista resuelve un paso; las dependencias impiden borrar sin CASCADE.' },
    { id: 'view_vs_table', title: 'Vista, tabla copiada o materializada', summary: 'Vista: siempre al día. Tabla copiada: foto que caduca. Materializada: foto con REFRESH.' },
    { id: 'explain_basics', title: 'EXPLAIN', summary: 'El plan de ejecución sin ejecutar: Seq Scan, Index Scan, joins y estimaciones.' },
    { id: 'explain_analyze', title: 'EXPLAIN ANALYZE', summary: 'Ejecuta de verdad para medir: con DML, dentro de BEGIN … ROLLBACK.' },
  ],
  debriefConcepts: ['create_view', 'view_on_view', 'view_vs_table', 'explain_basics', 'explain_analyze'],
  seniorTips: [
    'Lee la chuleta de vistas en la wiki.',
    'Inés: CREATE VIEW saldos_cliente AS SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id;',
    'Marta: CREATE VIEW kpi_clientes AS SELECT c.id, c.nombre, c.ciudad, COALESCE(s.saldo_total, 0) AS saldo_total FROM clientes c LEFT JOIN saldos_cliente s ON s.cliente_id = c.id;',
    'Carmen: CREATE VIEW control_pagos AS SELECT (SELECT COUNT(*) …) AS duplicados, (…) AS tarjeta_bloqueada, (…) AS tarjeta_caducada;',
    "Nuria: SELECT id, nombre, saldo_total FROM kpi_clientes WHERE ciudad = 'Madrid' AND saldo_total > 10000;",
    'Diego: EXPLAIN SELECT * FROM kpi_clientes WHERE id = 7;',
    "Laura: CREATE VIEW pagos_a_revisar AS SELECT id, 'duplicado' AS motivo FROM (…) UNION ALL … 'tarjeta_bloqueada' … UNION ALL … 'tarjeta_caducada' …;",
    'Con Inés: vista, no tabla copiada; y EXPLAIN ANALYZE ejecuta.',
  ],
}
