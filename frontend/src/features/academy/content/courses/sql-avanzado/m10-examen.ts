import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'

const q = (sql: string) => sql.replace(/'/g, "''")
const POR_COMERCIO = "SELECT comercio_id, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY comercio_id"
const JUNIO = "SELECT * FROM movimientos WHERE cuenta_id = 7 AND fecha BETWEEN '2025-06-01' AND '2025-06-30'"

/**
 * Curso 7: SQL avanzado · Examen práctico.
 *
 * Tres horas, sin mentora ni pistas, sobre la base de datos del curso en el
 * entorno de pruebas. Diez encargos, uno por misión: cinco de consulta (se
 * comparan con los datos de partida) y cinco que cambian la base de datos
 * (se comprueba cómo queda). 10 puntos cada uno; aprueba con 70/100.
 */
export const m10Examen: Mission = {
  id: 'm10-examen',
  courseKey: 'sql-avanzado',
  number: 10,
  title: 'Examen práctico',
  subtitle: 'Tres horas, sin pistas: diez encargos de consulta y de cambios sobre la base de datos. Aprueba con 70 de 100.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', laura: 'QA Lead · examinadora' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · mes 4, semana 2',
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
      body: 'Has resuelto sin ayuda consultas recursivas, de ventana, de subtotales y de JSON, y has cambiado la base de datos con cuidado: datos movidos, reglas, funciones, índices y una vista materializada. Esto cuenta para el certificado.',
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
      'Lunes, 09:00. Varios equipos esperan respuestas y cambios en la base de datos antes del mediodía.',
      'Tienes tres horas y diez encargos, uno por cada misión del curso. No hay mentora ni pistas: las tablas están en la wiki.',
      'Cada encargo vale 10 puntos. Apruebas con 70 de 100. Estás en el entorno de pruebas. Los cinco primeros encargos son consultas y se comparan con los datos de partida; los cinco últimos cambian la base de datos y se comprueba cómo queda. No cambies nada que no se pida. Si te equivocas, «Restaurar» lo deja todo como al principio (también deshace lo que ya hubieras cambiado).',
    ],
    goals: [
      'Lee en la wiki cómo son las tablas.',
      'Resuelve los diez encargos de la consola (10 puntos cada uno).',
      'Cambia solo lo que piden los encargos 6 a 10.',
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
      subject: 'Examen práctico de SQL avanzado',
      body: 'Buenos días:\n\nHoy es tu examen práctico. Tienes en la consola **diez encargos**, uno por cada misión del curso. Las tablas están descritas en la wiki: «Tablas del examen».\n\n- Tienes hasta las **12:00**.\n- Cada encargo vale **10 puntos**; apruebas con **70**.\n- Sin pistas ni ayuda de Inés: hoy vas sola.\n- Los encargos **1 a 5** son consultas. Los **6 a 10** cambian la base de datos: haz solo lo que piden.\n\nSuerte.\nLaura',
      onDeliver: [{ kind: 'flag', key: 'exam.started' }],
    },
    {
      id: 'reminder',
      channel: 'chat',
      from: 'laura',
      at: 150,
      body: 'Te quedan 30 minutos. Repasa que los encargos que has hecho siguen en verde y que no tienes ninguna transacción abierta. Entrega a las 12:00.',
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
      id: 'tablas',
      title: 'Tablas del examen',
      updatedLabel: 'Equipo de Datos',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.tablas' }],
      body: `## empleados
\`id\`, \`nombre\`, \`puesto\`, \`departamento\`, \`jefe_id\` → \`empleados.id\` (vacío para la directora general), \`salario\`, \`alta\`

## pagos_tarjeta y comercios
- \`pagos_tarjeta\`: \`id\`, \`tarjeta_id\`, \`comercio_id\`, \`importe\`, \`estado\` (**aceptado**, **rechazado** o **devuelto**), \`pagado_en\` (timestamp)
- \`comercios\`: \`id\`, \`nombre\`, \`categoria\` (puede estar vacía), \`ciudad\`

## prestamos y cuotas
- \`prestamos\`: \`id\`, \`cliente_id\`, \`importe\`, \`plazo_meses\`, \`tipo_interes\`, \`estado\`, \`solicitado_en\`, \`aprobado_en\`
- \`cuotas\`: \`id\`, \`prestamo_id\`, \`numero\`, \`vence_en\`, \`importe\`, \`pagada_en\`

## eventos_app
\`id\`, \`cliente_id\`, \`tipo\` (login, transferencia, error, ajuste), \`ocurrido_en\`, \`datos\` (jsonb). En los errores: \`{"codigo", "pantalla", "reintentos", "detalle": {…}}\`.

## incidencias e incidencias_archivo
Misma estructura: \`id\`, \`cliente_id\`, \`canal\`, \`motivo\`, \`abierta_en\`, \`cerrada_en\` (vacío si sigue abierta).

## movimientos
60.000 filas: \`id\`, \`cuenta_id\`, \`fecha\`, \`importe\`, \`tipo\`, \`concepto\`, \`estado\`.

## Evaluación
- 10 encargos × 10 puntos. Aprobado: 70.
- 1 a 5: el resultado se compara con el de los datos de partida.
- 6 a 10: se comprueba cómo queda la base de datos.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Examen práctico: empieza mirando las tablas\nSELECT *\nFROM empleados\nLIMIT 5;',
    retos: [
      {
        id: 'e1_equipo_jorge',
        from: 'laura',
        title: '1 · Todo el equipo de Jorge',
        description: 'Todas las personas que dependen de **Jorge Llorente** (`id` 2), a cualquier nivel: `id`, `nombre` y `nivel` (1 para quien depende directamente de él, 2 para el siguiente…).',
        hint: '',
        solution: 'WITH RECURSIVE equipo AS (SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 2 UNION ALL SELECT e.id, e.nombre, q.nivel + 1 FROM empleados e JOIN equipo q ON e.jefe_id = q.id) SELECT id, nombre, nivel FROM equipo',
        columns: ['id', 'nombre', 'nivel'],
        requires: [{ pattern: /\bwith\s+recursive\b/i, message: 'Este encargo se resuelve con una consulta recursiva (`WITH RECURSIVE`).' }],
      },
      {
        id: 'e2_diferencia',
        from: 'carmen',
        title: '2 · Cada pago de 2026 frente al anterior',
        description: 'De los pagos con tarjeta de **2026**: `id`, `tarjeta_id`, `importe` y `diferencia` con el pago **anterior de la misma tarjeta** (por `pagado_en` y, si empatan, por `id`). El anterior puede ser de 2025: solo queda vacío si es el primer pago de la tarjeta.',
        hint: '',
        solution: "SELECT id, tarjeta_id, importe, diferencia FROM (SELECT id, tarjeta_id, importe, pagado_en, importe - LAG(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) AS diferencia FROM pagos_tarjeta) x WHERE pagado_en >= '2026-01-01'",
        columns: ['id', 'tarjeta_id', 'importe', 'diferencia'],
      },
      {
        id: 'e3_mediana',
        from: 'marta',
        title: '3 · Mediana por categoría',
        description: 'Para cada `categoria` de comercio (también la vacía), la **mediana** del importe de los pagos **aceptados**, redondeada a 2 decimales: `categoria` y `mediana`.',
        hint: '',
        solution: "SELECT c.categoria, ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p.importe)::numeric, 2) AS mediana FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado' GROUP BY c.categoria",
        columns: ['categoria', 'mediana'],
      },
      {
        id: 'e4_subtotales',
        from: 'carmen',
        title: '4 · Préstamos con subtotales',
        description: 'Número de `prestamos` e `importe_total` por `estado` y `plazo_meses`, con un **subtotal por estado** y el **total general** (en esas filas, la columna agrupada queda vacía).',
        hint: '',
        solution: 'SELECT estado, plazo_meses, COUNT(*) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY ROLLUP (estado, plazo_meses)',
        columns: ['estado', 'plazo_meses', 'prestamos', 'importe_total'],
      },
      {
        id: 'e5_errores_pantalla',
        from: 'laura',
        title: '5 · Errores por pantalla',
        description: 'De los eventos de tipo **error**: `pantalla` (como texto), número de `errores` y `media_reintentos` (la media de `reintentos`, redondeada a 2 decimales).',
        hint: '',
        solution: "SELECT datos->>'pantalla' AS pantalla, COUNT(*) AS errores, ROUND(AVG((datos->>'reintentos')::numeric), 2) AS media_reintentos FROM eventos_app WHERE tipo = 'error' GROUP BY datos->>'pantalla'",
        columns: ['pantalla', 'errores', 'media_reintentos'],
      },
      {
        id: 'e6_archivar',
        from: 'nuria',
        title: '6 · Archivar las incidencias de 2025',
        description: 'Mueve a `incidencias_archivo` las incidencias **cerradas antes del 1 de enero de 2026**, en **una sola sentencia**: que salgan de `incidencias` y entren en el archivo.',
        hint: '',
        requires: [{ pattern: /\bdelete\b[\s\S]*\breturning\b/i, message: 'En una sola sentencia: un DELETE … RETURNING dentro de un WITH y un INSERT.' }],
        state: [
          { query: 'SELECT COUNT(*) FROM incidencias', rows: [['19']] },
          { query: "SELECT string_agg(id::text, ',' ORDER BY id) FROM incidencias_archivo", rows: [['1,2,3,5,6,7,9,10,11,13,14']] },
        ],
      },
      {
        id: 'e7_cuota_unica',
        from: 'marta',
        title: '7 · Cuotas sin repetir',
        description: 'Haz que `cuotas` no admita **dos cuotas con el mismo número del mismo préstamo**. Si hay alguna repetida, borra la **copia** (la de `id` más alto) y deja la original.',
        hint: '',
        requires: [{ pattern: /\bunique\b/i, message: 'Este encargo se cumple con una regla única.' }],
        state: [
          { query: 'SELECT COUNT(*), COUNT(*) FILTER (WHERE id = 9) FROM cuotas', rows: [['84', '1']] },
          { query: `SELECT qa.probar('${q("INSERT INTO cuotas VALUES (901, 2, 3, '2026-01-01', 10, NULL)")}')`, rows: [['23505']] },
          { query: `SELECT qa.probar('${q("INSERT INTO cuotas VALUES (901, 2, 99, '2026-01-01', 10, NULL)")}')`, rows: [['ok']] },
        ],
      },
      {
        id: 'e8_total_pagado',
        from: 'carmen',
        title: '8 · La función total_pagado',
        description: 'Crea la función **`total_pagado(p_tarjeta integer)`** que devuelve la suma del importe de los pagos **aceptados** de esa tarjeta, y **0** si no tiene ninguno.',
        hint: '',
        requires: [{ pattern: /\bcreate\s+(or\s+replace\s+)?function\b/i, message: 'Este encargo se cumple creando una función.' }],
        state: [
          {
            query: "SELECT COUNT(*) FROM tarjetas t WHERE total_pagado(t.id) IS DISTINCT FROM (SELECT COALESCE(SUM(importe), 0) FROM pagos_tarjeta p WHERE p.tarjeta_id = t.id AND p.estado = 'aceptado')",
            rows: [['0']],
          },
          { query: 'SELECT (total_pagado(999) = 0)::text', rows: [['true']] },
        ],
      },
      {
        id: 'e9_indice',
        from: 'diego',
        title: '9 · Un índice para el extracto de junio',
        description: `Crea el índice que permita resolver **las dos condiciones** de esta consulta con él: \`${JUNIO}\`.`,
        hint: '',
        requires: [{ pattern: /\bcreate\s+index\b/i, message: 'Este encargo se cumple creando un índice.' }],
        state: [{ query: `SELECT (qa.plan('${q(JUNIO)}') ~ 'Index Cond: \\(\\(cuenta_id = 7\\) AND \\(fecha >=')::text`, rows: [['true']] }],
      },
      {
        id: 'e10_matview',
        from: 'marta',
        title: '10 · La vista materializada pagos_por_comercio',
        description: 'Crea la **vista materializada** `pagos_por_comercio` con una fila por comercio: `comercio_id`, número de `pagos` **aceptados** y su `total`.',
        hint: '',
        requires: [{ pattern: /\bcreate\s+materialized\s+view\b/i, message: 'Este encargo se cumple con una vista materializada.' }],
        state: [
          { query: "SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'pagos_por_comercio'", rows: [['1']] },
          {
            query: `SELECT COUNT(*) FROM ((SELECT comercio_id, pagos, total FROM pagos_por_comercio EXCEPT ALL ${POR_COMERCIO}) UNION ALL (${POR_COMERCIO} EXCEPT ALL SELECT comercio_id, pagos, total FROM pagos_por_comercio)) d`,
            rows: [['0']],
          },
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
 * Respuestas de referencia (una ejecución por encargo, en orden): las usa
 * c7m10.test.ts contra PostgreSQL. Escritas a propósito de otra forma que las
 * soluciones, para comprobar que se corrige el resultado y no la consulta.
 */
export const M10_SQL_ANSWERS = [
  'WITH RECURSIVE abajo (id, nombre, nivel) AS (SELECT e.id, e.nombre, 1 FROM empleados e WHERE e.jefe_id = 2 UNION ALL SELECT e.id, e.nombre, a.nivel + 1 FROM abajo a JOIN empleados e ON e.jefe_id = a.id) SELECT * FROM abajo ORDER BY nivel, id;',
  "WITH con_anterior AS (SELECT p.*, LAG(p.importe) OVER w AS anterior FROM pagos_tarjeta p WINDOW w AS (PARTITION BY p.tarjeta_id ORDER BY p.pagado_en, p.id)) SELECT id, tarjeta_id, importe, importe - anterior AS diferencia FROM con_anterior WHERE pagado_en >= '2026-01-01' AND pagado_en < '2027-01-01';",
  "SELECT co.categoria, ROUND(CAST(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pt.importe) AS numeric), 2) AS mediana FROM comercios co JOIN pagos_tarjeta pt ON pt.comercio_id = co.id AND pt.estado = 'aceptado' GROUP BY 1;",
  'SELECT estado, plazo_meses, COUNT(id) AS prestamos, SUM(importe) AS importe_total FROM prestamos GROUP BY GROUPING SETS ((estado, plazo_meses), (estado), ()) ORDER BY 1, 2;',
  "SELECT datos #>> '{pantalla}' AS pantalla, COUNT(*) AS errores, ROUND(SUM((datos->>'reintentos')::int)::numeric / COUNT(*), 2) AS media_reintentos FROM eventos_app WHERE datos ? 'codigo' AND tipo = 'error' GROUP BY 1;",
  "WITH m AS (DELETE FROM incidencias WHERE cerrada_en < DATE '2026-01-01' RETURNING id, cliente_id, canal, motivo, abierta_en, cerrada_en) INSERT INTO incidencias_archivo (id, cliente_id, canal, motivo, abierta_en, cerrada_en) SELECT * FROM m;",
  'DELETE FROM cuotas c USING cuotas o WHERE c.prestamo_id = o.prestamo_id AND c.numero = o.numero AND c.id > o.id; ALTER TABLE cuotas ADD UNIQUE (prestamo_id, numero);',
  "CREATE FUNCTION total_pagado(p_tarjeta integer) RETURNS numeric LANGUAGE plpgsql AS $$ DECLARE t numeric; BEGIN SELECT SUM(importe) INTO t FROM pagos_tarjeta WHERE tarjeta_id = p_tarjeta AND estado = 'aceptado'; RETURN COALESCE(t, 0); END $$;",
  'CREATE INDEX movimientos_cuenta_fecha ON movimientos (cuenta_id, fecha);',
  "CREATE MATERIALIZED VIEW pagos_por_comercio AS SELECT comercio_id, COUNT(*) AS pagos, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY comercio_id;",
]

// Resumen del debrief: un renglón por encargo, como en los demás exámenes.
m10Examen.prevention!.rules = m10Examen.sqlLab!.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') }))
