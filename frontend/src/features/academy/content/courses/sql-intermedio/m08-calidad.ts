import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m08Lessons } from './m08-lessons'
import { m08Quiz } from './m08-quiz'
import { m08Scenes } from './m08-scenes'

/** Copias sobrantes de los pagos duplicados (todas menos la de id más bajo). */
const COPIAS = 'SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n FROM pagos_tarjeta) x WHERE n > 1'
const BLOQUEADA = "SELECT p.id, p.tarjeta_id, p.importe FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'"
const CADUCADA = "SELECT p.id, p.tarjeta_id, p.pagado_en, t.caduca_en FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en"

/**
 * Curso 6: SQL intermedio · Misión 8 — Datos que no cuadran.
 * Guion legible: docs/academy/sql-intermedio/missions/m08-calidad.md
 *
 * Calidad de datos sobre las anomalías sembradas en Kobalto ampliada: copias
 * duplicadas (ROW_NUMBER), reglas de negocio como consultas, DISTINCT ON y un
 * panel de reglas. Trampas: borrar también el original y esconder con DISTINCT.
 */
export const m08Calidad: Mission = {
  id: 'm08-calidad',
  courseKey: 'sql-intermedio',
  number: 8,
  title: 'Datos que no cuadran',
  subtitle: 'Duplicados, reglas de negocio como consultas, DISTINCT ON y un panel de calidad de datos.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · mes 2, semana 2',
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
  lessons: m08Lessons,
  mentor: 'ines',
  quiz: m08Quiz,
  verdicts: {
    good: {
      title: 'Cada dato sucio, con su bug',
      body: 'Has localizado las copias, los pagos con tarjeta bloqueada y caducada, el email compartido y los picos por comercio. Y Laura tiene un panel que avisará si vuelven.',
    },
    ok: {
      title: 'Datos sucios a medio encontrar',
      body: 'Ya escribes reglas como consultas, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Los datos siguen sin cuadrar',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de calidad de datos a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Semana 2 · Datos que no cuadran',
    paragraphs: [
      'Jueves. Hoy no hay informes: hay que encontrar lo que está mal. Duplicados, pagos que no deberían haberse aceptado, datos de clientes que se pisan.',
      'Cada regla de negocio se escribe como una consulta que encuentra los casos que la incumplen. Cada encargo tiene que devolver exactamente esos casos.',
    ],
    goals: [
      'Escribe reglas de negocio como consultas que deberían devolver cero filas.',
      'Encuentra duplicados y distingue el original de las copias.',
      'Limpia duplicados conservando una copia.',
      'Saca una fila por grupo con DISTINCT ON.',
      'Junta varias reglas en un panel de una fila.',
      'Reporta los datos sucios en vez de esconderlos.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m08Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_calidad',
      title: 'Chuleta: calidad de datos',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'rules_as_queries' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Regla = consulta que debería dar 0 filas
| Regla | Busca |
|---|---|
| Sin duplicados | \`ROW_NUMBER() OVER (PARTITION BY columnas ORDER BY id)\` > 1 |
| Tarjeta bloqueada no paga | pagos aceptados con \`t.estado = 'bloqueada'\` |
| Tarjeta caducada no paga | pagos aceptados con \`pagado_en::date > caduca_en\` |
| Email único | \`GROUP BY LOWER(email) HAVING COUNT(*) > 1\` |
| Sin huérfanos | \`LEFT JOIN … WHERE padre.id IS NULL\` |

## Una fila por grupo
\`SELECT DISTINCT ON (grupo) … ORDER BY grupo, criterio\`

## Panel de reglas
\`SELECT (SELECT COUNT(*) FROM …) AS regla1, (SELECT COUNT(*) FROM …) AS regla2;\`

## Limpieza
Borra las copias (\`n > 1\`), conserva una. Ensaya el DELETE como SELECT. Reporta la causa.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Una regla como consulta: debería devolver 0 filas\nSELECT tarjeta_id, comercio_id, importe, pagado_en, COUNT(*) AS veces\nFROM pagos_tarjeta\nGROUP BY tarjeta_id, comercio_id, importe, pagado_en\nHAVING COUNT(*) > 1;',
    retos: [
      {
        id: 'duplicados',
        from: 'ines',
        title: 'Las copias sobrantes',
        description: 'El `id` de las **copias sobrantes** de los pagos duplicados (misma tarjeta, comercio, importe y `pagado_en`): de cada grupo, todas menos la de id más bajo.',
        hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) AS n` en un paso; fuera, `WHERE n > 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: COPIAS,
        columns: ['id'],
      },
      {
        id: 'tarjeta_bloqueada',
        from: 'marta',
        title: 'Pagos aceptados con tarjeta bloqueada',
        description: '`id`, `tarjeta_id` e `importe` de los pagos **aceptados** con una tarjeta **bloqueada**.',
        hint: "`pagos_tarjeta JOIN tarjetas` y las dos condiciones: `t.estado = 'bloqueada'` y `p.estado = 'aceptado'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: BLOQUEADA,
        columns: ['id', 'tarjeta_id', 'importe'],
      },
      {
        id: 'tarjeta_caducada',
        from: 'carmen',
        title: 'Pagos después de la caducidad',
        description: '`id`, `tarjeta_id`, `pagado_en` y `caduca_en` de los pagos **aceptados** hechos **después** de la fecha de caducidad de la tarjeta.',
        hint: '`p.pagado_en::date > t.caduca_en` (el día de caducidad todavía vale).',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: CADUCADA,
        columns: ['id', 'tarjeta_id', 'pagado_en', 'caduca_en'],
      },
      {
        id: 'emails_repetidos',
        from: 'nuria',
        title: 'Clientes que comparten email',
        description: '`id`, `nombre` y `email` de los clientes cuyo email lo tiene **algún otro cliente** (sin distinguir mayúsculas).',
        hint: '`WHERE LOWER(email) IN (SELECT LOWER(email) FROM clientes GROUP BY LOWER(email) HAVING COUNT(*) > 1)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT id, nombre, email FROM clientes WHERE LOWER(email) IN (SELECT LOWER(email) FROM clientes GROUP BY LOWER(email) HAVING COUNT(*) > 1)',
        columns: ['id', 'nombre', 'email'],
      },
      {
        id: 'maximo_comercio',
        from: 'diego',
        title: 'El pago más alto de cada comercio',
        description: '`comercio_id`, `id` e `importe` del **pago más alto** (cualquier estado) de cada comercio. Una fila por comercio.',
        hint: '`SELECT DISTINCT ON (comercio_id) comercio_id, id, importe FROM pagos_tarjeta ORDER BY comercio_id, importe DESC`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT DISTINCT ON (comercio_id) comercio_id, id, importe FROM pagos_tarjeta ORDER BY comercio_id, importe DESC',
        columns: ['comercio_id', 'id', 'importe'],
      },
      {
        id: 'panel_reglas',
        from: 'laura',
        title: 'Panel de reglas en una fila',
        description: 'Una sola fila: `duplicados` (copias sobrantes), `tarjeta_bloqueada` (pagos aceptados), `tarjeta_caducada` (pagos aceptados), `sin_categoria` (comercios) y `nombres_con_espacios` (comercios cuyo nombre no coincide con su `TRIM`).',
        hint: 'Una subconsulta escalar `(SELECT COUNT(*) FROM (…) x)` por columna, reutilizando las consultas de los otros encargos.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `SELECT (SELECT COUNT(*) FROM (${COPIAS}) a) AS duplicados, (SELECT COUNT(*) FROM (${BLOQUEADA}) b) AS tarjeta_bloqueada, (SELECT COUNT(*) FROM (${CADUCADA}) c) AS tarjeta_caducada, (SELECT COUNT(*) FROM comercios WHERE categoria IS NULL) AS sin_categoria, (SELECT COUNT(*) FROM comercios WHERE nombre <> TRIM(nombre)) AS nombres_con_espacios`,
        columns: ['duplicados', 'tarjeta_bloqueada', 'tarjeta_caducada', 'sin_categoria', 'nombres_con_espacios'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Siguen aceptándose pagos con tarjetas bloqueadas', severity: 'high', explanation: 'Nadie detectó los pagos aceptados con la tarjeta 12.', technique: 'Regla como consulta: bloqueada y aceptado.', preventedBy: 'reto.tarjeta_bloqueada' },
    { id: 'C-CARMEN', title: 'La auditoría no detecta tarjetas caducadas que siguen pagando', severity: 'high', explanation: 'Carmen se quedó sin los 24 pagos posteriores a la caducidad.', technique: 'Comparar la fecha del pago con la de caducidad.', preventedBy: 'reto.tarjeta_caducada' },
    { id: 'C-NURIA', title: 'Un cliente sigue recibiendo los extractos de otro', severity: 'high', explanation: 'Nadie encontró el email compartido.', technique: 'GROUP BY LOWER(email) HAVING COUNT(*) > 1.', preventedBy: 'reto.emails_repetidos' },
    { id: 'C-DIEGO', title: 'El límite antifraude se fija sin ver los picos', severity: 'medium', explanation: 'Diego no tuvo el pago más alto de cada comercio.', technique: 'DISTINCT ON.', preventedBy: 'reto.maximo_comercio' },
    { id: 'C-LAURA', title: 'Los datos sucios vuelven sin que nadie se entere', severity: 'medium', explanation: 'No hay panel de reglas en el pipeline nocturno.', technique: 'Una fila de recuentos, uno por regla.', preventedBy: 'reto.panel_reglas' },
    { id: 'C-BORRADO', title: 'La limpieza borra también los pagos originales', severity: 'high', explanation: 'El DELETE eliminó las dos filas de cada grupo duplicado.', technique: 'Borrar solo n > 1 y ensayar como SELECT.', preventedBy: 'practice.keep_one' },
    { id: 'C-DISTINCT', title: 'Los duplicados siguen inflando los saldos', severity: 'medium', explanation: 'Se escondieron con DISTINCT en un informe en vez de reportarlos.', technique: 'Reportar y arreglar en origen, con una regla que avise.', preventedBy: 'practice.fix_source' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los datos sucios del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.tarjeta_bloqueada', label: 'Autorización de Marta', explanation: 'Pagos con tarjeta bloqueada.' },
      { flag: 'reto.tarjeta_caducada', label: 'Auditoría de Carmen', explanation: 'Pagos tras la caducidad.' },
      { flag: 'reto.emails_repetidos', label: 'Clientes de Nuria', explanation: 'Email compartido.' },
      { flag: 'reto.maximo_comercio', label: 'Límite de Diego', explanation: 'Pago máximo por comercio.' },
      { flag: 'reto.panel_reglas', label: 'Panel de Laura', explanation: 'Reglas en el pipeline.' },
      { flag: 'practice.keep_one', label: 'Limpieza segura', explanation: 'Solo las copias.' },
      { flag: 'practice.fix_source', label: 'Datos arreglados en origen', explanation: 'Reportar, no esconder.' },
    ],
  },

  concepts: [
    { id: 'rules_as_queries', title: 'Reglas como consultas', summary: 'La consulta busca los incumplimientos: si la regla se cumple, devuelve cero filas.' },
    { id: 'find_duplicates', title: 'Encontrar duplicados', summary: 'Decide qué columnas definen «igual»; ROW_NUMBER por esas columnas marca las copias.' },
    { id: 'keep_one', title: 'Limpiar conservando una', summary: 'Se borran las copias (n > 1), no los originales; el DELETE se ensaya como SELECT.' },
    { id: 'distinct_on', title: 'DISTINCT ON', summary: 'Una fila por grupo, la primera según el ORDER BY (solo PostgreSQL).' },
    { id: 'quality_dashboard', title: 'Panel de reglas', summary: 'Una fila con un recuento por regla; todo a 0 cuando los datos están limpios.' },
    { id: 'fix_at_source', title: 'Arreglar en origen', summary: 'Los datos sucios se reportan y se corrigen, no se esconden con DISTINCT o filtros.' },
  ],
  debriefConcepts: ['rules_as_queries', 'find_duplicates', 'keep_one', 'distinct_on', 'quality_dashboard', 'fix_at_source'],
  seniorTips: [
    'Lee la chuleta de calidad de datos en la wiki.',
    'Inés: ROW_NUMBER() OVER (PARTITION BY tarjeta_id, comercio_id, importe, pagado_en ORDER BY id) y n > 1.',
    "Marta: pagos JOIN tarjetas con t.estado = 'bloqueada' y p.estado = 'aceptado'.",
    "Carmen: p.estado = 'aceptado' AND p.pagado_en::date > t.caduca_en.",
    'Nuria: LOWER(email) IN (SELECT LOWER(email) … GROUP BY LOWER(email) HAVING COUNT(*) > 1).',
    'Diego: SELECT DISTINCT ON (comercio_id) comercio_id, id, importe … ORDER BY comercio_id, importe DESC.',
    'Laura: una fila con (SELECT COUNT(*) FROM (…) x) por regla.',
    'Con Inés: se borran las copias, no los originales; y los datos sucios se reportan, no se esconden.',
  ],
}
