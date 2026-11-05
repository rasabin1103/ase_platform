import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const RESUMEN = "SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total FROM movimientos GROUP BY 1"

/**
 * Curso 7: SQL avanzado · Misión 9 — Rendimiento.
 *
 * Paginación por clave (keyset) en vez de OFFSET, EXISTS y NOT EXISTS
 * (semi y anti join), vistas materializadas y REFRESH, y DISTINCT ON para «el
 * último de cada grupo». Trampas: OFFSET en páginas profundas y NOT IN con
 * una subconsulta que tiene NULL.
 */
export const m09Rendimiento: Mission = {
  ...COMUN,
  id: 'm09-rendimiento',
  number: 9,
  title: 'Rendimiento',
  subtitle: 'Paginación por clave, EXISTS y NOT EXISTS, vistas materializadas y DISTINCT ON.',
  dayLabel: 'Viernes · mes 4',
  verdicts: {
    good: {
      title: 'Rápido y correcto',
      body: 'Páginas que no se ralentizan, cuentas con pendientes sin repetir, un resumen mensual que no recalcula 60.000 filas, las cuentas sin transferencias que NOT IN escondía, marzo cargado y refrescado, y el último movimiento de cada cuenta. Y nada de OFFSET 50000.',
    },
    ok: {
      title: 'Rendimiento a medias',
      body: 'Ya escribes consultas que aguantan volumen, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Consultas que no aguantan',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de rendimiento a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Rendimiento',
    paragraphs: [
      'Viernes. Ayer fueron los índices; hoy, **cómo escribir** las consultas para que aguanten cuando hay muchas filas, y para que además den el resultado correcto.',
      'Seguimos en la **copia de pruebas**. Unos encargos se cumplen con el resultado exacto y otros cuando la base de datos queda como se pide.',
    ],
    goals: [
      'Pagina por clave (WHERE id > … LIMIT) en vez de OFFSET.',
      'Pregunta «¿tiene alguno?» con EXISTS.',
      'Busca lo que no tiene ninguno con NOT EXISTS (y sabe por qué NOT IN falla con NULL).',
      'Guarda un resumen caro en una vista materializada.',
      'Refresca la vista materializada cuando cambian los datos.',
      'Saca el último de cada grupo con DISTINCT ON.',
    ],
  },

  docs: [
    {
      id: 'chuleta_rendimiento',
      title: 'Chuleta: rendimiento',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'keyset' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Paginar
| Así no | Así sí |
|---|---|
| \`ORDER BY id LIMIT 20 OFFSET 40000\` | \`WHERE id > (último id de la página anterior) ORDER BY id LIMIT 20\` |

## ¿Tiene alguno? ¿No tiene ninguno?
\`\`\`
WHERE EXISTS (SELECT 1 FROM hijos h WHERE h.padre_id = p.id)
WHERE NOT EXISTS (SELECT 1 FROM hijos h WHERE h.padre_id = p.id)
\`\`\`
Ojo con \`NOT IN (subconsulta)\`: si la subconsulta devuelve algún NULL, no sale **nada**.

## Vistas materializadas
\`\`\`
CREATE MATERIALIZED VIEW nombre AS SELECT …;   -- calcula y guarda
REFRESH MATERIALIZED VIEW nombre;              -- vuelve a calcular
\`\`\`
Ver las que hay: \`SELECT matviewname FROM pg_matviews;\`

## El último de cada grupo
\`\`\`
SELECT DISTINCT ON (grupo) grupo, …
FROM t
ORDER BY grupo, orden DESC;
\`\`\`

## Tablas de hoy
\`movimientos_nuevos\`: los 500 movimientos de marzo, con la misma estructura que \`movimientos\`, todavía sin cargar.`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: la página «profunda» de siempre\nEXPLAIN ANALYZE\nSELECT id FROM movimientos ORDER BY id LIMIT 20 OFFSET 50000;',
    retos: [
      {
        id: 'keyset',
        from: 'ines',
        title: 'La página siguiente, sin OFFSET',
        description: 'La app enseña los movimientos de la **cuenta 5** de 20 en 20, ordenados por `id`. La página que se ve acaba en el **id 30000**. Pide la **siguiente**: `id`, `fecha`, `importe` y `concepto`, **sin OFFSET**.',
        hint: '`WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT id, fecha, importe, concepto FROM movimientos WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20',
        columns: ['id', 'fecha', 'importe', 'concepto'],
        ordered: true,
        forbid: [exige(/\boffset\b/i, 'Sin OFFSET: sigue desde el último id de la página anterior (`id > 30000`).')],
        requires: [exige(/\bid\s*>\s*30000\b/i, 'Sigue desde el último id visto: `id > 30000`.'), exige(/\blimit\s+20\b/i, 'Una página son 20 filas: `LIMIT 20`.')],
      },
      {
        id: 'con_pendientes',
        from: 'marta',
        title: 'Las cuentas con algún movimiento pendiente',
        description: 'Las **cuentas** que tienen **al menos un** movimiento en estado **pendiente**: `id` y `cliente_id`, **una fila por cuenta**.',
        hint: "`FROM cuentas a WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND m.estado = 'pendiente')`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT a.id, a.cliente_id FROM cuentas a WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND m.estado = 'pendiente')",
        columns: ['id', 'cliente_id'],
        requires: [exige(/\bexists\b/i, 'Pregunta «¿tiene alguno?» con `WHERE EXISTS (SELECT 1 FROM movimientos …)`.')],
      },
      {
        id: 'resumen_mensual',
        from: 'carmen',
        title: 'El resumen mensual, calculado una vez',
        description: `Crea la **vista materializada** \`resumen_mensual\` con una fila por mes: \`mes\` (date, el día 1 del mes), \`movimientos\` (cuántos) y \`total\` (suma del importe).`,
        hint: `\`CREATE MATERIALIZED VIEW resumen_mensual AS ${RESUMEN};\``,
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [exige(/\bcreate\s+materialized\s+view\b/i, 'Este encargo se cumple con `CREATE MATERIALIZED VIEW resumen_mensual AS …`.')],
        state: [
          { query: "SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'resumen_mensual'", rows: [['1']] },
          {
            query: `SELECT COUNT(*) FROM ((SELECT mes, movimientos, total FROM resumen_mensual EXCEPT ALL ${RESUMEN}) UNION ALL (${RESUMEN} EXCEPT ALL SELECT mes, movimientos, total FROM resumen_mensual)) d`,
            rows: [['0']],
          },
        ],
      },
      {
        id: 'sin_transferencias',
        from: 'nuria',
        title: 'Las cuentas que nunca han recibido una transferencia',
        description: 'Las **cuentas** que **no aparecen como destino** (`cuenta_destino_id`) de ninguna transferencia: `id` y `cliente_id`.',
        hint: '`WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT a.id, a.cliente_id FROM cuentas a WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)',
        columns: ['id', 'cliente_id'],
      },
      {
        id: 'refresh',
        from: 'diego',
        title: 'Marzo cargado y en el resumen',
        description: 'Carga en `movimientos` los 500 movimientos de **marzo** que esperan en `movimientos_nuevos`, y haz que `resumen_mensual` los muestre.',
        hint: '`INSERT INTO movimientos SELECT * FROM movimientos_nuevos;` y después `REFRESH MATERIALIZED VIEW resumen_mensual;`',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [exige(/\brefresh\s+materialized\s+view\b/i, 'La vista materializada no se entera sola: `REFRESH MATERIALIZED VIEW resumen_mensual;`.')],
        state: [
          { query: 'SELECT COUNT(*) FROM movimientos', rows: [['60500']] },
          { query: "SELECT movimientos FROM resumen_mensual WHERE mes = '2026-03-01'", rows: [['500']] },
        ],
      },
      {
        id: 'ultimo_movimiento',
        from: 'laura',
        title: 'El último movimiento de cada cuenta',
        description: 'Para cada cuenta, su **último** movimiento (el de `id` más alto): `cuenta_id`, `id`, `fecha` e `importe`. Una fila por cuenta.',
        hint: '`SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe FROM movimientos ORDER BY cuenta_id, id DESC`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe FROM movimientos ORDER BY cuenta_id, id DESC',
        columns: ['cuenta_id', 'id', 'fecha', 'importe'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El aviso de «tienes movimientos pendientes» llega repetido', severity: 'low', explanation: 'Un JOIN devolvía la cuenta una vez por cada pendiente.', technique: 'EXISTS: una fila por cuenta, y para en el primero.', preventedBy: 'reto.con_pendientes' },
    { id: 'C-CARMEN', title: 'El panel mensual de Riesgos tarda medio minuto en abrir', severity: 'medium', explanation: 'Cada apertura recalculaba el resumen sobre 60.000 filas.', technique: 'Vista materializada.', preventedBy: 'reto.resumen_mensual' },
    { id: 'C-NURIA', title: 'La campaña de bienvenida a cuentas sin transferencias no llega a nadie', severity: 'medium', explanation: 'NOT IN con un NULL en la subconsulta no devolvía ninguna cuenta.', technique: 'NOT EXISTS.', preventedBy: 'reto.sin_transferencias' },
    { id: 'C-DIEGO', title: 'El resumen mensual no tiene marzo', severity: 'medium', explanation: 'Se cargaron los datos, pero la vista materializada no se refrescó.', technique: 'REFRESH MATERIALIZED VIEW tras cada carga.', preventedBy: 'reto.refresh' },
    { id: 'C-LAURA', title: 'El informe de «último movimiento» repite cuentas', severity: 'low', explanation: 'Sin DISTINCT ON, salían todos los movimientos de la última fecha.', technique: 'DISTINCT ON (cuenta_id) … ORDER BY cuenta_id, id DESC.', preventedBy: 'reto.ultimo_movimiento' },
    { id: 'C-OFFSET', title: 'Las últimas páginas del histórico tardan segundos y repiten filas', severity: 'medium', explanation: 'OFFSET lee y descarta todas las filas anteriores, y se descoloca si entran filas nuevas.', technique: 'Paginación por clave: WHERE id > último LIMIT n.', preventedBy: 'practice.keyset' },
    { id: 'C-NOTIN', title: 'Un informe de «sin …» sale vacío sin error', severity: 'high', explanation: 'NOT IN (subconsulta) con algún NULL nunca es verdadero.', technique: 'NOT EXISTS, o filtrar los NULL de la subconsulta.', preventedBy: 'practice.not_in_null' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con las consultas del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.con_pendientes', label: 'Avisos de Marta', explanation: 'Una fila por cuenta con EXISTS.' },
      { flag: 'reto.resumen_mensual', label: 'Panel de Carmen', explanation: 'Resumen materializado.' },
      { flag: 'reto.sin_transferencias', label: 'Campaña de Nuria', explanation: 'NOT EXISTS.' },
      { flag: 'reto.refresh', label: 'Carga de Diego', explanation: 'Marzo en el resumen.' },
      { flag: 'reto.ultimo_movimiento', label: 'Informe de Laura', explanation: 'DISTINCT ON.' },
      { flag: 'practice.keyset', label: 'Paginación', explanation: 'Por clave, no por OFFSET.' },
      { flag: 'practice.not_in_null', label: 'NOT IN y NULL', explanation: 'NOT EXISTS en su lugar.' },
    ],
  },

  concepts: [
    { id: 'keyset', title: 'Paginación por clave', summary: 'WHERE id > último_visto ORDER BY id LIMIT n: cada página cuesta lo mismo y no se descoloca.' },
    { id: 'offset_cost', title: 'Lo que cuesta OFFSET', summary: 'OFFSET n lee y descarta n filas: las páginas profundas son lentas, y una fila nueva desplaza todas las demás.' },
    { id: 'exists', title: 'EXISTS', summary: '¿Tiene alguno? Para en el primero y no repite la fila de fuera, a diferencia de un JOIN.' },
    { id: 'not_in_null', title: 'NOT EXISTS y NOT IN', summary: 'x NOT IN (… NULL …) nunca es verdadero; NOT EXISTS no tiene ese problema.' },
    { id: 'matview', title: 'Vistas materializadas', summary: 'Guardan el resultado de una consulta cara; leerla es leer una tabla pequeña.' },
    { id: 'refresh', title: 'REFRESH MATERIALIZED VIEW', summary: 'La vista materializada no cambia sola: hay que refrescarla cuando cambian los datos.' },
    { id: 'distinct_on', title: 'DISTINCT ON', summary: 'Una fila por grupo: la primera según el ORDER BY, que empieza por las columnas del DISTINCT ON.' },
  ],
  debriefConcepts: ['keyset', 'offset_cost', 'exists', 'not_in_null', 'matview', 'refresh', 'distinct_on'],
  seniorTips: [
    'Lee la chuleta de rendimiento en la wiki.',
    'Inés: WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20, sin OFFSET.',
    "Marta: FROM cuentas a WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND m.estado = 'pendiente').",
    "Carmen: CREATE MATERIALIZED VIEW resumen_mensual AS SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total FROM movimientos GROUP BY 1.",
    'Nuria: WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id).',
    'Diego: INSERT INTO movimientos SELECT * FROM movimientos_nuevos; REFRESH MATERIALIZED VIEW resumen_mensual;',
    'Laura: SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe FROM movimientos ORDER BY cuenta_id, id DESC.',
    'Con Inés: OFFSET profundo se paga en cada página, y NOT IN con un NULL no devuelve nada.',
  ],

  lessons: [
    {
      id: 'keyset',
      question: '¿Cómo pagino sin OFFSET?',
      conceptId: 'keyset',
      cost: 5,
      body: `Recordando **dónde acabó** la página anterior:

\`\`\`
-- primera página
SELECT … FROM movimientos WHERE cuenta_id = 5 ORDER BY id LIMIT 20;
-- siguientes: desde el último id que se vio
SELECT … FROM movimientos WHERE cuenta_id = 5 AND id > 30000 ORDER BY id LIMIT 20;
\`\`\`

Con un índice sobre la columna del orden, cada página cuesta lo mismo, sea la segunda o la milésima. El orden tiene que ser **único** (si ordenas por fecha, añade el id: \`WHERE (fecha, id) > (…, …) ORDER BY fecha, id\`). Lo que no puedes es saltar a «la página 37» directamente.`,
    },
    {
      id: 'offset_cost',
      question: '¿Qué tiene de malo OFFSET?',
      conceptId: 'offset_cost',
      cost: 5,
      body: `\`LIMIT 20 OFFSET 50000\` **lee 50.020 filas** y tira 50.000. Cuanto más profunda la página, más lenta:

\`\`\`
Limit  (actual time=30.764..30.780 rows=20)
  ->  Index Only Scan using movimientos_pkey  (… rows=50020)
\`\`\`

Y si entre página y página entra una fila nueva al principio, todas se desplazan una: la página siguiente repite la última fila de la anterior (o se salta una si se borra). Con la paginación por clave, no.`,
    },
    {
      id: 'exists',
      question: '¿Por qué EXISTS y no un JOIN?',
      conceptId: 'exists',
      cost: 5,
      body: `Para «las cuentas que tienen algún pendiente»:

- \`JOIN movimientos\` devuelve la cuenta **una vez por cada** pendiente: hay que añadir DISTINCT, y la base de datos ha juntado todas las filas para nada.
- \`WHERE EXISTS (SELECT 1 FROM movimientos m WHERE m.cuenta_id = a.id AND …)\` devuelve cada cuenta **una vez** y deja de buscar en cuanto encuentra el primero.

Da igual qué pongas en el SELECT de dentro (\`SELECT 1\` es la costumbre): solo importa si hay filas.`,
    },
    {
      id: 'not_in_null',
      question: '¿Por qué NOT IN puede no devolver nada?',
      conceptId: 'not_in_null',
      cost: 5,
      body: `\`id NOT IN (1, 2, NULL)\` significa \`id <> 1 AND id <> 2 AND id <> NULL\`. Y \`id <> NULL\` es NULL (desconocido), así que la condición **nunca es verdadera**:

\`\`\`
SELECT COUNT(*) FROM cuentas
WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias);  -- 0
\`\`\`

En \`transferencias\` hay 24 transferencias sin cuenta destino (a otros bancos): \`cuenta_destino_id\` es NULL. \`NOT EXISTS\` no tiene ese problema. Si usas NOT IN, filtra: \`… WHERE cuenta_destino_id IS NOT NULL\`.`,
    },
    {
      id: 'matview',
      question: '¿Qué es una vista materializada?',
      conceptId: 'matview',
      cost: 5,
      body: `Una vista normal es una consulta guardada: se ejecuta **cada vez** que la lees. Una materializada **guarda el resultado**:

\`\`\`
CREATE MATERIALIZED VIEW resumen_mensual AS
SELECT DATE_TRUNC('month', fecha)::date AS mes, COUNT(*) AS movimientos, SUM(importe) AS total
FROM movimientos GROUP BY 1;
\`\`\`

Leerla es leer catorce filas en vez de agrupar 60.000. A cambio, **no se actualiza sola**. Se le pueden poner índices como a una tabla. Sirve para resúmenes que se leen mucho y pueden ir un poco por detrás.`,
    },
    {
      id: 'refresh',
      question: '¿Cómo se pone al día una vista materializada?',
      conceptId: 'refresh',
      cost: 5,
      body: `\`\`\`
REFRESH MATERIALIZED VIEW resumen_mensual;
\`\`\`

Vuelve a ejecutar la consulta y sustituye lo guardado. Mientras dura, la vista está bloqueada para lectura. Con \`REFRESH MATERIALIZED VIEW CONCURRENTLY\` se puede seguir leyendo, pero necesita un índice único en la vista.

Lo normal: refrescar después de cada carga, o cada cierto tiempo. Y decir en el panel **de cuándo** son los datos.`,
    },
    {
      id: 'distinct_on',
      question: '¿Cómo saco el último de cada grupo?',
      conceptId: 'distinct_on',
      cost: 5,
      body: `En PostgreSQL, con \`DISTINCT ON\`:

\`\`\`
SELECT DISTINCT ON (cuenta_id) cuenta_id, id, fecha, importe
FROM movimientos
ORDER BY cuenta_id, id DESC;
\`\`\`

Se queda con la **primera fila de cada cuenta** según el ORDER BY, que tiene que empezar por las mismas columnas del DISTINCT ON. Hace lo mismo que \`ROW_NUMBER() OVER (PARTITION BY cuenta_id ORDER BY id DESC) = 1\`, más corto. Si el orden empata (dos con la misma fecha), añade un desempate.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a9pre_offset', conceptId: 'offset_cost', question: '¿Cuántas filas lee `ORDER BY id LIMIT 20 OFFSET 50000`?', options: ['20', 'Unas 50.020', '50.000', 'Depende del índice: siempre 20'], correct: 1, explanation: 'Lee y descarta las 50.000 primeras.' },
      { id: 'a9pre_keyset', conceptId: 'keyset', question: 'La última página acabó en id 30000. ¿Cómo pides la siguiente?', options: ['OFFSET 30000', 'WHERE id > 30000 ORDER BY id LIMIT 20', 'WHERE id = 30001', 'LIMIT 30020'], correct: 1, explanation: 'Paginación por clave.' },
      { id: 'a9pre_exists', conceptId: 'exists', question: '¿Qué devuelve `WHERE EXISTS (SELECT 1 FROM …)`?', options: ['El número 1', 'Las filas de fuera para las que la subconsulta tiene alguna fila', 'La subconsulta', 'Un error'], correct: 1, explanation: 'Solo importa si hay filas.' },
      { id: 'a9pre_notin', conceptId: 'not_in_null', question: '¿Cuánto da `5 NOT IN (1, 2, NULL)`?', options: ['true', 'false', 'NULL', 'Error'], correct: 2, explanation: '5 <> NULL es NULL.' },
      { id: 'a9pre_matview', conceptId: 'matview', question: '¿En qué se diferencia una vista materializada de una normal?', options: ['En nada', 'Guarda el resultado; la normal se calcula al leerla', 'Solo se puede leer una vez', 'No admite GROUP BY'], correct: 1, explanation: 'Y por eso hay que refrescarla.' },
      { id: 'a9pre_distinct', conceptId: 'distinct_on', question: '`DISTINCT ON (cuenta_id) … ORDER BY cuenta_id, id DESC` devuelve…', options: ['Todas las filas', 'Una fila por cuenta: la de id más alto', 'Las cuentas sin repetir, sin más columnas', 'Un error'], correct: 1, explanation: 'La primera de cada grupo según el ORDER BY.' },
    ],
    post: [
      { id: 'a9post_notin', conceptId: 'not_in_null', question: '`WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)` devuelve 0 filas. ¿Por qué?', options: ['No hay cuentas sin transferencias', 'La subconsulta tiene algún NULL', 'Falta un índice', 'NOT IN no funciona con subconsultas'], correct: 1, explanation: 'Con un solo NULL, NOT IN nunca es verdadero.' },
      { id: 'a9post_refresh', conceptId: 'refresh', question: 'Cargas 500 movimientos nuevos. ¿Qué enseña la vista materializada?', options: ['Los nuevos también', 'Lo de antes de la carga, hasta un REFRESH', 'Nada', 'Un error'], correct: 1, explanation: 'No se actualiza sola.' },
      { id: 'a9post_shift', conceptId: 'offset_cost', question: 'Con OFFSET, entra un movimiento nuevo mientras el usuario pasa de página. ¿Qué ve?', options: ['Nada raro', 'La última fila de la página anterior, repetida', 'Un error', 'La página vacía'], correct: 1, explanation: 'Todo se desplaza una posición.' },
      { id: 'a9post_exists', conceptId: 'exists', question: 'Una cuenta tiene 3 pendientes. ¿Cuántas veces sale con `JOIN movimientos … WHERE estado = \'pendiente\'`?', options: ['1', '3', '0', 'Depende'], correct: 1, explanation: 'Con EXISTS saldría una.' },
      { id: 'a9post_keyset', conceptId: 'keyset', question: 'Paginas por `fecha`, que se repite. ¿Qué hace falta?', options: ['Nada', 'Un desempate único: ORDER BY fecha, id y WHERE (fecha, id) > (…, …)', 'OFFSET', 'DISTINCT'], correct: 1, explanation: 'El orden tiene que ser único para no perder ni repetir filas.' },
      { id: 'a9post_distinct', conceptId: 'distinct_on', question: '¿Qué tiene que cumplir el ORDER BY con DISTINCT ON (cuenta_id)?', options: ['Nada', 'Empezar por cuenta_id', 'Acabar en cuenta_id', 'No llevar DESC'], correct: 1, explanation: 'Las columnas del DISTINCT ON van primero.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Que aguante',
      body: 'Buenos días, último día de la semana.\n\nAyer pusiste índices. Hoy toca **escribir** las consultas para que aguanten cuando hay muchas filas, y que además den lo que tienen que dar. Seguimos en la copia de pruebas.\n\nPara empezar, el histórico de la app. Enseña los movimientos de una cuenta de 20 en 20 con `OFFSET`, y las últimas páginas tardan segundos. Mira el `EXPLAIN ANALYZE` que te he dejado en la consola.\n\n- La **cuenta 5**, ordenada por `id`: la página que se ve acaba en el **id 30000**. Pide la **siguiente** (`id`, `fecha`, `importe`, `concepto`) **sin OFFSET**.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'keyset' }, { kind: 'unlock', conceptId: 'offset_cost' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.keyset' },
      body: 'Veinte filas desde la 30032. Y la página mil costaría lo mismo, porque no tiene que contar las anteriores.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_pendientes',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Vamos a mandar el aviso «tienes movimientos pendientes». Quiero las **cuentas** con **al menos un** movimiento **pendiente**: `id` y `cliente_id`, **una fila por cuenta** (el mes pasado a alguien le llegó el aviso cinco veces).',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'exists' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.con_pendientes' },
      body: 'Trece cuentas, cada una una vez. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_resumen',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Mi panel mensual agrupa los 60.000 movimientos **cada vez que alguien lo abre**. Los datos solo cambian con la carga de cada noche. ¿Puedes guardar el resumen en una **vista materializada** `resumen_mensual`, con `mes` (date, el día 1), `movimientos` y `total`?',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'matview' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.resumen_mensual' },
      body: 'El panel lee catorce filas y abre al momento. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_offset',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «con un índice se arregla»',
      body: '**Inés:** Rubén dice que lo del OFFSET no hace falta cambiarlo: «con un índice en `id`, `OFFSET 50000` va directo a la fila 50.000». Además, los de Atención al cliente se quejan de que a veces, al pasar de página, **ven una fila repetida**. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'keyset',
          text: 'Que un índice no sabe «saltar» 50.000 posiciones: con OFFSET la base de datos **lee y descarta** todas las filas anteriores, y cuanto más profunda la página, más lenta. Y lo de la fila repetida también es el OFFSET: si entra un movimiento nuevo entre página y página, todo se desplaza una posición. Las dos cosas se arreglan paginando por clave: `WHERE id > último_visto ORDER BY id LIMIT 20`.',
          cost: 10,
          reply: 'Exacto. El EXPLAIN ANALYZE lo enseña: rows=50020 para devolver 20. Y la paginación por clave no se descoloca.',
          effects: [
            { kind: 'flag', key: 'practice.keyset' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'OFFSET lee y tira las filas anteriores; por clave, cada página cuesta lo mismo.' },
          ],
        },
        {
          id: 'index',
          text: 'Que tiene razón: con un buen índice, OFFSET es igual de rápido.',
          cost: 10,
          reply: 'Mira el plan: Index Only Scan con rows=50020. Va por el índice, sí, pero recorre 50.020 entradas para devolver 20.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Creíste que un índice hace gratis el OFFSET.' }],
        },
        {
          id: 'cache',
          text: 'Que guarden en la app todas las páginas la primera vez.',
          cost: 10,
          reply: '¿Sesenta mil filas en memoria por cada usuario? Y seguirían viendo datos viejos. El problema es cómo se pide la página.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste esconder el problema en la app.' }],
        },
      ],
    },
    {
      id: 'nuria_bienvenida',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Queremos llamar a los clientes cuyas cuentas **nunca han recibido una transferencia**, para explicarles cómo hacerlo. Las **cuentas** que no aparecen como destino (`cuenta_destino_id`) de ninguna transferencia: `id` y `cliente_id`. Rubén lo intentó y le salió vacío…',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'not_in_null' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.sin_transferencias' },
      body: 'Tres cuentas: la 21, la 32 y la 47. A Rubén le salían cero. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_marzo',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Tengo los **500 movimientos de marzo** en `movimientos_nuevos`, con la misma estructura. ¿Los cargas en `movimientos` y haces que el resumen mensual de Carmen los enseñe?',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'refresh' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.refresh' },
      body: 'Marzo ya sale en el resumen, con sus 500 movimientos. Lo apunto en el proceso de carga: después del INSERT, el REFRESH. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_ultimo',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Para los tests del extracto necesito el **último movimiento de cada cuenta** (el de `id` más alto): `cuenta_id`, `id`, `fecha` e `importe`. Una fila por cuenta.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'distinct_on' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.ultimo_movimiento' },
      body: 'Una fila por cuenta, cincuenta y dos. Justo lo que necesitaba. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_notin',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «cero cuentas»',
      body: '**Inés:** Lo de Rubén con la lista de Nuria. Escribió:\n\n`SELECT id, cliente_id FROM cuentas WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias);`\n\nY le salieron **cero** cuentas, sin ningún error. Tú has encontrado tres. ¿Qué le pasó?',
      onDeliver: [],
      choices: [
        {
          id: 'null',
          text: 'Que hay transferencias a **otros bancos** con `cuenta_destino_id` NULL. `id NOT IN (…, NULL)` es `id <> … AND id <> NULL`, y `id <> NULL` es desconocido: la condición **nunca es verdadera**. Con `NOT EXISTS` no pasa; o, si usa NOT IN, `WHERE cuenta_destino_id IS NOT NULL` en la subconsulta.',
          cost: 10,
          reply: 'Eso es. Un solo NULL en la subconsulta y NOT IN no devuelve nada. Por eso, para «los que no tienen», NOT EXISTS siempre.',
          effects: [
            { kind: 'flag', key: 'practice.not_in_null' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'NOT IN con un NULL en la subconsulta no devuelve nada: NOT EXISTS.' },
          ],
        },
        {
          id: 'distinct',
          text: 'Que le faltó un DISTINCT en la subconsulta.',
          cost: 10,
          reply: 'Los repetidos no cambian el resultado de NOT IN. Lo que lo rompe es un NULL.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Buscaste repetidos donde había un NULL.' }],
        },
        {
          id: 'data',
          text: 'Que los datos han cambiado entre su consulta y la tuya.',
          cost: 10,
          reply: 'Es la misma copia y nadie ha tocado las transferencias. Prueba su consulta: sigue dando cero.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a los datos de un NOT IN con NULL.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre de la semana con Inés',
      body: '**Inés:** Semana cerrada: modificar, reglas, funciones, índices y hoy rendimiento. La semana que viene, el examen práctico. ¿Qué te llevas de hoy?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que se pagina por clave (id > último visto) y no con OFFSET; que «¿tiene alguno?» es EXISTS y «no tiene ninguno», NOT EXISTS, porque NOT IN con un NULL no devuelve nada; que un resumen caro va en una vista materializada que hay que refrescar tras cada carga; y que DISTINCT ON da el último de cada grupo.',
          reply: 'Muy bien. Con esto tienes todo lo del curso. Repasa la semana antes del examen.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'hardware',
          text: 'Que si va lento, lo mejor es un servidor más grande.',
          reply: 'Un servidor el doble de grande no arregla un OFFSET 50000 ni un NOT IN que devuelve cero. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con arreglarlo con más máquina.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
