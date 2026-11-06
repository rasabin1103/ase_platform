import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { ROLES } from './shared'

const FEB = "pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'"
const PRUEBA = 'id BETWEEN 9301 AND 9330'

/**
 * Curso 8: SQL para QA · Examen práctico.
 *
 * Tres horas, sin mentora ni pistas, sobre la base de datos del curso en el
 * entorno de pruebas. Diez encargos, uno por misión: ocho consultas (se
 * comparan con los datos de partida), uno que crea datos de prueba y otro que
 * prueba reglas sin dejar rastro (se comprueba cómo queda la base de datos).
 * 10 puntos cada uno; aprueba con 70/100.
 */
export const m10Examen: Mission = {
  id: 'm10-examen',
  courseKey: 'sql-qa',
  number: 10,
  title: 'Examen práctico',
  subtitle: 'Tres horas, sin pistas: diez encargos de QA con SQL sobre la base de datos. Aprueba con 70 de 100.',
  world: kobaltoDataWorld({ ...ROLES, laura: 'QA Lead · examinadora' }),
  playerRole: 'QA · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · mes 4, semana 3',
  duration: 180,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'laura',
  ticketPrefix: 'QA',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  practicalExam: { passMark: 70, retoPoints: 10, bugPoints: 0, rejectedPenalty: 0 },
  hideBugList: true,
  wikiLabel: 'Wiki · QA',
  initialMetrics: {},
  verdicts: {
    good: {
      title: 'Examen práctico superado',
      body: 'Has probado con SQL, sin ayuda, lo que hizo la app, los bordes, los datos de prueba, las reglas que deben dar cero, una conciliación, una migración, un informe, unos estados, unas reglas y una versión nueva. Esto cuenta para el certificado.',
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
      'Lunes, 09:00. Varios equipos esperan respuestas de QA antes del mediodía.',
      'Tienes tres horas y diez encargos, uno por cada misión del curso. No hay mentora ni pistas: las tablas están en la wiki.',
      'Cada encargo vale 10 puntos. Apruebas con 70 de 100. Estás en el entorno de pruebas. Los encargos de consulta se comparan con los datos de partida. El 3 crea datos de prueba y el 9 prueba reglas: en esos se comprueba cómo queda la base de datos. No cambies nada que no se pida. Si te equivocas, «Restaurar» lo deja todo como al principio (también deshace lo que ya hubieras cambiado).',
    ],
    goals: [
      'Lee en la wiki cómo son las tablas.',
      'Resuelve los diez encargos de la consola (10 puntos cada uno).',
      'Cambia solo lo que pide el encargo 3; el 9 no debe dejar rastro.',
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
      subject: 'Examen práctico de SQL para QA',
      body: 'Buenos días:\n\nHoy es tu examen práctico. Tienes en la consola **diez encargos**, uno por cada misión del curso. Las tablas están descritas en la wiki: «Tablas del examen».\n\n- Tienes hasta las **12:00**.\n- Cada encargo vale **10 puntos**; apruebas con **70**.\n- Sin pistas ni ayuda: hoy vas sola.\n- El encargo **3** crea datos de prueba; el **9** prueba reglas y no debe dejar nada. El resto son consultas.\n\nSuerte.\nLaura',
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
      updatedLabel: 'Equipo de QA',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'doc.tablas' }],
      body: `## Ejecuciones de la app
- \`ejecuciones(ejecucion, referencia, importe, resultado_ui)\`: lo que pidió la app en cada ejecución de pruebas (R-0305, R-0306).
- \`transferencias(id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en)\`: el \`concepto\` es la \`referencia\` de la ejecución.
- \`cuentas(id, cliente_id, iban, tipo, saldo, abierta_en, estado)\`.

## Pagos
- \`pagos_tarjeta(id, tarjeta_id, comercio_id, importe, estado, pagado_en)\`: estado **aceptado**, **rechazado** o **devuelto**; \`pagado_en\` es timestamp.
- \`comercios(id, nombre, …)\` y \`liquidaciones(pago_id, importe, fecha_operacion, …)\`: lo que liquidó el procesador.

## Clientes y migración
- \`clientes(id, nombre, apellidos, email, ciudad, fecha_alta, segmento)\`.
- \`clientes_v2(id, nombre_completo, email, ciudad_id, segmento, alta)\` y \`ciudades(id, nombre)\`. Reglas: \`nombre || ' ' || apellidos\`, \`lower(trim(email))\`, la ciudad por nombre en \`ciudades\`, segmento vacío → \`'sin_segmento'\`, \`alta\` = \`fecha_alta\`.

## Incidencias
\`incidencias(id, cliente_id, canal, motivo, abierta_en, cerrada_en)\`: \`canal\` es chat, telefono o email.

## Órdenes
\`ordenes_historial(id, orden_id, estado, cambiado_en)\`.

## Solicitudes
\`solicitudes(id, cliente_id, importe, plazo_meses, estado, revisada_en)\`. Prueba con \`probar('sentencia', …)\`: devuelve \`ok\` o el SQLSTATE y lo deshace.

## Rendimiento
\`log_consultas(version, consulta_id, texto, llamadas, tiempo_total_ms, peticiones)\`, versiones 1.8 y 1.9.

## Evaluación
- 10 encargos × 10 puntos. Aprobado: 70.
- Consultas: el resultado se compara con el de los datos de partida.
- Encargos 3 y 9: se comprueba cómo queda la base de datos.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Examen práctico: empieza mirando las tablas\nSELECT *\nFROM ejecuciones\nLIMIT 5;',
    retos: [
      {
        id: 'e1_ejecucion',
        from: 'laura',
        title: '1 · Lo que pidió la app y lo que quedó',
        description: "Para **cada** referencia de la ejecución **R-0306**: `referencia`, `importe_app` (lo que pidió la app) e `importe_bd` (el importe de la transferencia con ese concepto; vacío si no se creó).",
        hint: '',
        solution: "SELECT e.referencia, e.importe AS importe_app, t.importe AS importe_bd FROM ejecuciones e LEFT JOIN transferencias t ON t.concepto = e.referencia WHERE e.ejecucion = 'R-0306'",
        columns: ['referencia', 'importe_app', 'importe_bd'],
      },
      {
        id: 'e2_estados_febrero',
        from: 'marta',
        title: '2 · Pagos de febrero por estado',
        description: 'Número de `pagos` con tarjeta de **febrero de 2026** (el 28 entero) por `estado`.',
        hint: '',
        solution: `SELECT estado, COUNT(*) AS pagos FROM pagos_tarjeta WHERE ${FEB} GROUP BY estado`,
        columns: ['estado', 'pagos'],
      },
      {
        id: 'e3_incidencias_prueba',
        from: 'nuria',
        title: '3 · Incidencias de prueba',
        description: "Crea las incidencias de prueba **9301 a 9330** (30) del cliente **3**: `motivo` 'Prueba QA', `canal` 'chat' las impares y 'email' las pares, `abierta_en` la 9301 el **2026-03-01 00:00** y cada una **una hora** después de la anterior, y sin cerrar. No cambies nada más.",
        hint: '',
        state: [
          { query: 'SELECT COUNT(*) FROM incidencias', rows: [['63']] },
          { query: `SELECT COUNT(*) FROM incidencias WHERE ${PRUEBA} AND cliente_id = 3 AND motivo = 'Prueba QA' AND cerrada_en IS NULL AND canal = CASE WHEN id % 2 = 1 THEN 'chat' ELSE 'email' END AND abierta_en = TIMESTAMP '2026-03-01 00:00' + (id - 9301) * INTERVAL '1 hour'`, rows: [['30']] },
        ],
      },
      {
        id: 'e4_cuentas_inexistentes',
        from: 'carmen',
        title: '4 · Transferencias con cuentas que no existen',
        description: 'Las transferencias cuya cuenta de **origen** o de **destino** (si tiene) **no existe** en `cuentas`: `id`, `cuenta_origen_id` y `cuenta_destino_id`.',
        hint: '',
        solution: 'SELECT t.id, t.cuenta_origen_id, t.cuenta_destino_id FROM transferencias t WHERE NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_origen_id) OR (t.cuenta_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id))',
        columns: ['id', 'cuenta_origen_id', 'cuenta_destino_id'],
      },
      {
        id: 'e5_liquidado',
        from: 'carmen',
        title: '5 · Pagos mal liquidados',
        description: 'Los pagos **aceptados de febrero** cuyo importe **liquidado** (la suma de todas sus liquidaciones; 0 si no tiene) es **distinto** de su importe, aunque sea por un céntimo: `pago_id`, `importe_app` y `liquidado`.',
        hint: '',
        solution: `SELECT p.id AS pago_id, p.importe AS importe_app, COALESCE(SUM(l.importe), 0) AS liquidado FROM pagos_tarjeta p LEFT JOIN liquidaciones l ON l.pago_id = p.id WHERE p.estado = 'aceptado' AND p.${FEB} GROUP BY p.id, p.importe HAVING COALESCE(SUM(l.importe), 0) <> p.importe`,
        columns: ['pago_id', 'importe_app', 'liquidado'],
      },
      {
        id: 'e6_migracion',
        from: 'diego',
        title: '6 · Clientes mal migrados',
        description: 'Los `id` de los clientes de `clientes` cuya fila en `clientes_v2` **no es exactamente la esperada** según las reglas de la wiki (en cualquier columna), **o no existe**.',
        hint: '',
        solution: "SELECT c.id FROM clientes c LEFT JOIN ciudades ci ON ci.nombre = c.ciudad LEFT JOIN clientes_v2 v ON v.id = c.id WHERE v.id IS NULL OR v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos OR v.email IS DISTINCT FROM lower(trim(c.email)) OR v.ciudad_id IS DISTINCT FROM ci.id OR v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento') OR v.alta IS DISTINCT FROM c.fecha_alta",
        columns: ['id'],
      },
      {
        id: 'e7_devueltos',
        from: 'marta',
        title: '7 · Devoluciones por comercio',
        description: 'Para **cada comercio** (también los que no tienen ninguna), el número de pagos **devueltos** en **febrero de 2026**: `comercio_id` y `devueltos`.',
        hint: '',
        solution: `SELECT c.id AS comercio_id, COUNT(p.id) AS devueltos FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'devuelto' AND p.${FEB} GROUP BY c.id`,
        columns: ['comercio_id', 'devueltos'],
      },
      {
        id: 'e8_estados_repetidos',
        from: 'ines',
        title: '8 · Estados repetidos en el historial',
        description: 'Las órdenes que pasan **más de una vez** por el mismo estado en su historial: `orden_id`, `estado` y `veces`.',
        hint: '',
        solution: 'SELECT orden_id, estado, COUNT(*) AS veces FROM ordenes_historial GROUP BY orden_id, estado HAVING COUNT(*) > 1',
        columns: ['orden_id', 'estado', 'veces'],
      },
      {
        id: 'e9_plazos',
        from: 'diego',
        title: '9 · Cambiar el plazo de una solicitud',
        description: 'Prueba a **cambiar** el plazo de la solicitud **2** a **12**, **36**, **60**, **72** y **vacío** (NULL), cada caso por separado y sin dejar ningún cambio: `plazo` y `resultado` (lo que devuelve `probar`).',
        hint: '',
        solution: "SELECT v.plazo, probar(format('UPDATE solicitudes SET plazo_meses = %L WHERE id = 2', v.plazo)) AS resultado FROM (VALUES (12), (36), (60), (72), (NULL)) AS v(plazo)",
        columns: ['plazo', 'resultado'],
        requires: [{ pattern: /\bprobar\s*\(/i, message: 'Cada caso se prueba con `probar(…)`.' }],
        state: [
          { query: 'SELECT COUNT(*) FROM solicitudes', rows: [['5']] },
          { query: 'SELECT plazo_meses FROM solicitudes WHERE id = 2', rows: [['36']] },
        ],
      },
      {
        id: 'e10_por_peticion',
        from: 'laura',
        title: '10 · Tiempo por petición',
        description: 'Las consultas que están en las dos versiones y cuyo **tiempo por petición** (`tiempo_total_ms / peticiones`) en la 1.9 es **más de un 50 %** mayor que en la 1.8: `consulta_id`, `ms_peticion_18` y `ms_peticion_19` (redondeados a 2 decimales).',
        hint: '',
        solution: "SELECT a.consulta_id, ROUND(a.tiempo_total_ms / a.peticiones, 2) AS ms_peticion_18, ROUND(b.tiempo_total_ms / b.peticiones, 2) AS ms_peticion_19 FROM log_consultas a JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9' WHERE a.version = '1.8' AND b.tiempo_total_ms / b.peticiones > 1.5 * a.tiempo_total_ms / a.peticiones",
        columns: ['consulta_id', 'ms_peticion_18', 'ms_peticion_19'],
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
 * c8m10.test.ts contra PostgreSQL. Escritas a propósito de otra forma que las
 * soluciones, para comprobar que se corrige el resultado y no la consulta.
 */
export const M10_SQL_ANSWERS = [
  "SELECT referencia, e.importe AS importe_app, (SELECT t.importe FROM transferencias t WHERE t.concepto = e.referencia) AS importe_bd FROM ejecuciones e WHERE ejecucion = 'R-0306' ORDER BY 1;",
  "SELECT estado, COUNT(id) AS pagos FROM pagos_tarjeta WHERE pagado_en::date BETWEEN '2026-02-01' AND '2026-02-28' GROUP BY 1 ORDER BY 2 DESC;",
  "INSERT INTO incidencias (id, cliente_id, canal, motivo, abierta_en, cerrada_en) SELECT n, 3, CASE WHEN n % 2 = 1 THEN 'chat' ELSE 'email' END, 'Prueba QA', TIMESTAMP '2026-03-01' + (n - 9301) * INTERVAL '1 hour', NULL FROM generate_series(9301, 9330) AS n;",
  'SELECT t.id, t.cuenta_origen_id, t.cuenta_destino_id FROM transferencias t LEFT JOIN cuentas o ON o.id = t.cuenta_origen_id LEFT JOIN cuentas d ON d.id = t.cuenta_destino_id WHERE o.id IS NULL OR (t.cuenta_destino_id IS NOT NULL AND d.id IS NULL);',
  "WITH liq AS (SELECT pago_id, SUM(importe) AS total FROM liquidaciones GROUP BY pago_id) SELECT p.id AS pago_id, p.importe AS importe_app, COALESCE(liq.total, 0) AS liquidado FROM pagos_tarjeta p LEFT JOIN liq ON liq.pago_id = p.id WHERE p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' AND COALESCE(liq.total, 0) IS DISTINCT FROM p.importe;",
  "SELECT id FROM (SELECT c.id, concat(c.nombre, ' ', c.apellidos) AS n, lower(trim(c.email)) AS e, ci.id AS ciudad, COALESCE(c.segmento, 'sin_segmento') AS s, c.fecha_alta AS a FROM clientes c LEFT JOIN ciudades ci ON ci.nombre = c.ciudad EXCEPT SELECT v.id, v.nombre_completo, v.email, v.ciudad_id, v.segmento, v.alta FROM clientes_v2 v) d;",
  "SELECT c.id AS comercio_id, COUNT(*) FILTER (WHERE p.estado = 'devuelto' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01') AS devueltos FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id GROUP BY 1;",
  'SELECT h.orden_id, h.estado, COUNT(h.id) AS veces FROM ordenes_historial h GROUP BY 1, 2 HAVING COUNT(h.id) >= 2 ORDER BY 1;',
  "SELECT 12 AS plazo, probar('UPDATE solicitudes SET plazo_meses = 12 WHERE id = 2') AS resultado UNION ALL SELECT 36, probar('UPDATE solicitudes SET plazo_meses = 36 WHERE id = 2') UNION ALL SELECT 60, probar('UPDATE solicitudes SET plazo_meses = 60 WHERE id = 2') UNION ALL SELECT 72, probar('UPDATE solicitudes SET plazo_meses = 72 WHERE id = 2') UNION ALL SELECT NULL, probar('UPDATE solicitudes SET plazo_meses = NULL WHERE id = 2');",
  "WITH x AS (SELECT version, consulta_id, tiempo_total_ms / peticiones AS mp FROM log_consultas) SELECT a.consulta_id, ROUND(a.mp, 2) AS ms_peticion_18, ROUND(b.mp, 2) AS ms_peticion_19 FROM x a JOIN x b USING (consulta_id) WHERE a.version = '1.8' AND b.version = '1.9' AND b.mp / a.mp > 1.5;",
]

// Resumen del debrief: un renglón por encargo, como en los demás exámenes.
m10Examen.prevention!.rules = m10Examen.sqlLab!.retos.map((r) => ({ flag: `reto.${r.id}`, label: r.title, explanation: r.description.replace(/\*\*|`/g, '') }))
