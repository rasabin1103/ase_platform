import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

/** Comprueba que el plan de `consulta` cumple la expresión regular `patron` (de PostgreSQL). */
const plan = (consulta: string, patron: string) => ({
  query: `SELECT (qa.plan('${consulta.replace(/'/g, "''")}') ~ '${patron.replace(/'/g, "''")}')::text`,
  rows: [['true']],
})

const CREAR_INDICE = exige(/\bcreate\s+(unique\s+)?index\b/i, 'Este encargo se cumple creando un índice: `CREATE INDEX nombre ON tabla (…)`.')

const EXTRACTO = "SELECT * FROM movimientos WHERE cuenta_id = 5 AND fecha >= '2026-02-01' ORDER BY fecha"
const PENDIENTES = "SELECT * FROM movimientos WHERE estado = 'pendiente' ORDER BY fecha"
const CONCEPTO = "SELECT * FROM movimientos WHERE LOWER(concepto) = 'recibo agua'"
const FEBRERO = "SELECT COUNT(*) FROM movimientos WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'"

/**
 * Curso 7: SQL avanzado · Misión 8 — Índices y planes.
 *
 * EXPLAIN y EXPLAIN ANALYZE sobre `movimientos` (60.000 filas): índice simple,
 * compuesto, parcial y de expresión; condiciones que pueden usar un índice
 * (sargables) y un índice repetido que sobra. Las comprobaciones leen el plan
 * con qa.plan. Trampas: LIKE con comodín al principio y un índice en cada columna.
 */
export const m08Indices: Mission = {
  ...COMUN,
  id: 'm08-indices',
  number: 8,
  title: 'Índices y planes',
  subtitle: 'EXPLAIN, índices simples, compuestos, parciales y de expresión, y consultas que los pueden usar.',
  dayLabel: 'Jueves · mes 4',
  verdicts: {
    good: {
      title: 'Consultas que van al grano',
      body: 'El extracto de Marta, los pendientes de Carmen, la búsqueda de Nuria y el informe de Diego ya usan índices, y Laura tiene un índice repetido menos. Y nadie llenó la tabla de índices «por si acaso».',
    },
    ok: {
      title: 'Índices a medias',
      body: 'Ya lees planes y creas índices, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Todo a Seq Scan',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de índices a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Índices y planes',
    paragraphs: [
      'Jueves. `movimientos` tiene **60.000 filas** y varias consultas van lentas. Hoy toca mirar **cómo** las ejecuta PostgreSQL (`EXPLAIN`) y darle los índices que necesita, ni uno más.',
      'Seguimos en la **copia de pruebas**. Cada encargo se cumple cuando el plan de la consulta usa un índice como se pide (Inés lo comprueba con EXPLAIN).',
    ],
    goals: [
      'Lee un plan: Seq Scan, Index Scan, Bitmap, coste y filas.',
      'Crea un índice para un filtro por una columna.',
      'Crea un índice compuesto en el orden correcto.',
      'Crea un índice parcial y uno sobre una expresión.',
      'Reescribe una condición para que pueda usar un índice.',
      'Quita un índice que sobra.',
    ],
  },

  docs: [
    {
      id: 'chuleta_indices',
      title: 'Chuleta: índices y planes',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'explain' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## movimientos (60.000 filas)
\`id, cuenta_id, fecha, importe, tipo, concepto, estado\`

## Ver el plan
| Sentencia | Qué hace |
|---|---|
| \`EXPLAIN consulta\` | el plan, sin ejecutarla |
| \`EXPLAIN ANALYZE consulta\` | la ejecuta y da tiempos y filas reales |

| En el plan | Significa |
|---|---|
| Seq Scan | lee la tabla entera |
| Index Scan / Index Only Scan | va por un índice |
| Bitmap Index Scan + Bitmap Heap Scan | usa el índice para marcar las filas y luego las lee |
| Index Cond | la parte del WHERE que resuelve el índice |
| Filter | lo que se comprueba fila a fila |
| cost=…, rows=… | estimación del planificador |

## Índices
\`\`\`
CREATE INDEX nombre ON tabla (col);                 -- simple
CREATE INDEX nombre ON tabla (col1, col2);          -- compuesto
CREATE INDEX nombre ON tabla (col) WHERE condición; -- parcial
CREATE INDEX nombre ON tabla (LOWER(col));          -- de expresión
DROP INDEX nombre;
\`\`\`
Ver los que hay: \`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'movimientos';\``,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: cómo ejecuta PostgreSQL una consulta\nEXPLAIN ANALYZE\nSELECT * FROM movimientos WHERE cuenta_id = 5;',
    retos: [
      {
        id: 'indice_cuenta',
        from: 'ines',
        title: 'Los movimientos de una cuenta, por índice',
        description: 'Haz que `SELECT * FROM movimientos WHERE cuenta_id = 5` deje de leer la tabla entera: crea el índice que necesita.',
        hint: '`CREATE INDEX movimientos_cuenta_idx ON movimientos (cuenta_id);` y vuelve a mirar el plan con EXPLAIN.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [CREAR_INDICE],
        state: [plan('SELECT * FROM movimientos WHERE cuenta_id = 5', 'Index Cond: \\(+cuenta_id = 5')],
      },
      {
        id: 'indice_compuesto',
        from: 'marta',
        title: 'El extracto, con un solo índice',
        description: `Marta pide el extracto: \`${EXTRACTO}\`. Crea un índice que resuelva **las dos condiciones** (cuenta y fecha) a la vez.`,
        hint: 'Un índice compuesto, con la columna de la igualdad primero: `CREATE INDEX movimientos_cuenta_fecha_idx ON movimientos (cuenta_id, fecha);`',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [CREAR_INDICE],
        state: [plan(EXTRACTO, 'Index Cond: \\(\\(cuenta_id = 5\\) AND \\(fecha >=')],
      },
      {
        id: 'indice_parcial',
        from: 'carmen',
        title: 'Los pendientes, con un índice pequeño',
        description: `El panel de Carmen consulta \`${PENDIENTES}\`. Son 300 de 60.000 filas: crea un índice que **solo guarde las pendientes**.`,
        hint: "Un índice parcial: `CREATE INDEX movimientos_pendientes_idx ON movimientos (fecha) WHERE estado = 'pendiente';`",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [CREAR_INDICE, exige(/\bwhere\b/i, "Que el índice solo guarde las pendientes: `CREATE INDEX … WHERE estado = 'pendiente'`.")],
        state: [
          plan(PENDIENTES, 'Index'),
          { query: "SELECT (COUNT(*) > 0)::text FROM pg_indexes WHERE tablename = 'movimientos' AND indexdef ~ 'WHERE .*pendiente'", rows: [['true']] },
        ],
      },
      {
        id: 'indice_expresion',
        from: 'nuria',
        title: 'Buscar conceptos sin mirar mayúsculas',
        description: `Atención al cliente busca con \`${CONCEPTO}\` (los conceptos están escritos de cualquier manera). Crea el índice que esta búsqueda puede usar.`,
        hint: 'Un índice sobre la misma expresión del WHERE: `CREATE INDEX movimientos_concepto_idx ON movimientos (LOWER(concepto));`',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        requires: [CREAR_INDICE],
        state: [plan(CONCEPTO, 'Index Cond: \\(lower\\(concepto\\)')],
      },
      {
        id: 'fecha_sargable',
        from: 'diego',
        title: 'El informe de febrero, sin tocar la columna',
        description: 'El informe mensual cuenta los movimientos de **febrero de 2026** con `EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) = 2` y lee la tabla entera. Escribe la consulta para que pueda usar el índice de `fecha`: una columna `movimientos` con el número.',
        hint: "Compara la columna tal cual con un rango: `WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: `${FEBRERO.replace('COUNT(*)', 'COUNT(*) AS movimientos')}`,
        columns: ['movimientos'],
        forbid: [exige(/\b(extract|date_part|date_trunc|to_char)\s*\(|fecha\s*::/i, 'Si aplicas una función a `fecha`, el índice no sirve: compara la columna tal cual con un rango de fechas.')],
        requires: [exige(/\bfecha\s*(>=|>|between)/i, "Usa un rango sobre la columna: `fecha >= '2026-02-01' AND fecha < '2026-03-01'`.")],
      },
      {
        id: 'indice_duplicado',
        from: 'laura',
        title: 'Un índice repetido de más',
        description: 'Laura sospecha que `movimientos` tiene **dos índices iguales**. Encuéntralos y quita uno: que siga habiendo un índice sobre `fecha`.',
        hint: "`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'movimientos';` y `DROP INDEX` del que sobra.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [exige(/\bdrop\s+index\b/i, 'Este encargo se cumple quitando un índice: `DROP INDEX nombre;`.')],
        state: [
          { query: "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'movimientos' AND indexdef ~ 'USING btree \\(fecha\\)$'", rows: [['1']] },
          plan(FEBRERO, 'Index Cond: \\(\\(fecha >='),
        ],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El extracto de la app tarda varios segundos', severity: 'medium', explanation: 'Leía la tabla entera para cada cuenta.', technique: 'Índice compuesto (cuenta_id, fecha).', preventedBy: 'reto.indice_compuesto' },
    { id: 'C-CARMEN', title: 'El panel de pendientes de Riesgos se queda colgado', severity: 'medium', explanation: 'Buscaba 300 filas entre 60.000 sin índice.', technique: "Índice parcial WHERE estado = 'pendiente'.", preventedBy: 'reto.indice_parcial' },
    { id: 'C-NURIA', title: 'Las búsquedas de Atención al cliente van a paso de tortuga', severity: 'low', explanation: 'Un índice sobre concepto no sirve para LOWER(concepto).', technique: 'Índice de expresión sobre LOWER(concepto).', preventedBy: 'reto.indice_expresion' },
    { id: 'C-DIEGO', title: 'El informe mensual bloquea la base de datos a fin de mes', severity: 'high', explanation: 'EXTRACT sobre fecha impedía usar el índice.', technique: 'Rango sobre la columna sin funciones.', preventedBy: 'reto.fecha_sargable' },
    { id: 'C-LAURA', title: 'Las cargas de movimientos van más lentas de lo normal', severity: 'low', explanation: 'Cada INSERT mantenía dos índices idénticos.', technique: 'Revisar pg_indexes y quitar el repetido.', preventedBy: 'reto.indice_duplicado' },
    { id: 'C-LIKE', title: "Un índice nuevo y la búsqueda con '%agua%' sigue igual de lenta", severity: 'medium', explanation: 'Un LIKE que empieza por % no puede usar un índice normal.', technique: 'Buscar por el principio, por igualdad con LOWER o con un índice de trigramas.', preventedBy: 'practice.like_prefix' },
    { id: 'C-SOBRE', title: 'Ocho índices nuevos y las escrituras van el doble de lentas', severity: 'medium', explanation: 'Un índice en cada columna «por si acaso» se paga en cada INSERT y UPDATE.', technique: 'Índices para consultas reales, comprobados con EXPLAIN.', preventedBy: 'practice.over_index' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los índices del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.indice_compuesto', label: 'Extracto de Marta', explanation: 'Índice compuesto.' },
      { flag: 'reto.indice_parcial', label: 'Panel de Carmen', explanation: 'Índice parcial.' },
      { flag: 'reto.indice_expresion', label: 'Búsquedas de Nuria', explanation: 'Índice de expresión.' },
      { flag: 'reto.fecha_sargable', label: 'Informe de Diego', explanation: 'Rango sobre la columna.' },
      { flag: 'reto.indice_duplicado', label: 'Cargas de Laura', explanation: 'Un índice repetido menos.' },
      { flag: 'practice.like_prefix', label: 'LIKE y comodines', explanation: 'Sin % al principio para un índice normal.' },
      { flag: 'practice.over_index', label: 'Índices justos', explanation: 'Solo los que usa alguien.' },
    ],
  },

  concepts: [
    { id: 'explain', title: 'EXPLAIN y EXPLAIN ANALYZE', summary: 'El plan que elige PostgreSQL: Seq Scan, Index Scan, Bitmap; costes y filas estimadas (y reales con ANALYZE).' },
    { id: 'btree', title: 'Índice simple', summary: 'Un índice sobre una columna acelera igualdades, rangos y ORDER BY sobre ella.' },
    { id: 'composite', title: 'Índice compuesto', summary: 'Sirve para las columnas de la izquierda: (cuenta_id, fecha) vale para cuenta_id y para cuenta_id + fecha, no para fecha sola.' },
    { id: 'partial', title: 'Índice parcial', summary: 'CREATE INDEX … WHERE: solo guarda las filas que interesan; pequeño y rápido.' },
    { id: 'expression', title: 'Índice de expresión', summary: 'Un índice sobre LOWER(col) sirve para WHERE LOWER(col) = …; uno sobre col, no.' },
    { id: 'sargable', title: 'Condiciones que usan índices', summary: 'Sin funciones sobre la columna y sin % al principio de un LIKE: fecha >= … AND fecha < …' },
    { id: 'index_cost', title: 'Lo que cuesta un índice', summary: 'Ocupa espacio y se actualiza en cada INSERT, UPDATE y DELETE; los repetidos o sin usar sobran.' },
  ],
  debriefConcepts: ['explain', 'btree', 'composite', 'partial', 'expression', 'sargable', 'index_cost'],
  seniorTips: [
    'Lee la chuleta de índices y planes en la wiki.',
    'Inés: CREATE INDEX ON movimientos (cuenta_id) y EXPLAIN otra vez.',
    'Marta: CREATE INDEX ON movimientos (cuenta_id, fecha): la igualdad primero, el rango después.',
    "Carmen: CREATE INDEX ON movimientos (fecha) WHERE estado = 'pendiente'.",
    'Nuria: CREATE INDEX ON movimientos (LOWER(concepto)).',
    "Diego: SELECT COUNT(*) AS movimientos FROM movimientos WHERE fecha >= '2026-02-01' AND fecha < '2026-03-01'.",
    'Laura: movimientos_fecha_idx e idx_mov_fecha son iguales: DROP INDEX de uno.',
    'Con Inés: LIKE con % al principio no usa índices normales, y cada índice se paga al escribir.',
  ],

  lessons: [
    {
      id: 'explain',
      question: '¿Cómo leo un plan?',
      conceptId: 'explain',
      cost: 5,
      body: `\`EXPLAIN\` enseña el plan sin ejecutar; \`EXPLAIN ANALYZE\` la ejecuta y añade lo real:

\`\`\`
Seq Scan on movimientos  (cost=0.00..1322.00 rows=1066 width=44)
                         (actual time=0.049..10.371 rows=1154 loops=1)
  Filter: (cuenta_id = 5)
  Rows Removed by Filter: 58846
\`\`\`

- **Seq Scan**: ha leído las 60.000 filas y ha tirado 58.846.
- **cost**: unidades del planificador (no milisegundos); el segundo número es el total.
- **rows**: filas estimadas; con ANALYZE, también las reales. Si se parecen poco, las estadísticas están viejas (\`ANALYZE tabla\`).`,
    },
    {
      id: 'btree',
      question: '¿Qué hace un índice?',
      conceptId: 'btree',
      cost: 5,
      body: `Es una lista ordenada de los valores de una columna con dónde está cada fila, como el índice de un libro:

\`\`\`
CREATE INDEX movimientos_cuenta_idx ON movimientos (cuenta_id);
\`\`\`

Sirve para \`=\`, \`<\`, \`>\`, \`BETWEEN\`, \`ORDER BY\` y \`LIKE 'abc%'\` sobre esa columna. Con muchas filas, PostgreSQL usa **Bitmap**: marca en el índice las filas y luego las lee en orden. Si la consulta devuelve casi toda la tabla, un Seq Scan es más rápido y lo seguirá eligiendo: no es un fallo.`,
    },
    {
      id: 'composite',
      question: '¿En qué orden pongo las columnas de un índice compuesto?',
      conceptId: 'composite',
      cost: 5,
      body: `El índice \`(cuenta_id, fecha)\` está ordenado por cuenta y, dentro de cada cuenta, por fecha. Por eso:

| Consulta | ¿Lo usa? |
|---|---|
| \`cuenta_id = 5\` | sí |
| \`cuenta_id = 5 AND fecha >= …\` | sí, las dos |
| \`fecha >= …\` | no bien: falta la primera columna |

Regla práctica: primero las columnas de **igualdad**, después la de **rango** u orden. Y un índice \`(cuenta_id)\` sobra si ya tienes \`(cuenta_id, fecha)\`.`,
    },
    {
      id: 'partial',
      question: '¿Qué es un índice parcial?',
      conceptId: 'partial',
      cost: 5,
      body: `Un índice que solo guarda **algunas filas**:

\`\`\`
CREATE INDEX movimientos_pendientes_idx
  ON movimientos (fecha) WHERE estado = 'pendiente';
\`\`\`

Tiene 300 entradas en vez de 60.000: ocupa poco y casi no se nota al escribir. Se usa cuando el WHERE de la consulta incluye la condición del índice (\`estado = 'pendiente'\`). Ideal para «lo poco que hay que revisar».`,
    },
    {
      id: 'expression',
      question: '¿Por qué mi índice no sirve para LOWER(concepto)?',
      conceptId: 'expression',
      cost: 5,
      body: `El índice sobre \`concepto\` guarda «Recibo luz», «recibo agua», «NÓMINA»… tal cual. La consulta busca por \`LOWER(concepto)\`, que es **otro valor**. Hace falta un índice sobre la misma expresión:

\`\`\`
CREATE INDEX movimientos_concepto_idx ON movimientos (LOWER(concepto));
\`\`\`

La consulta tiene que usar exactamente esa expresión. Lo mismo vale para \`(datos->>'codigo')\` en un JSON o para \`DATE(fecha_hora)\`.`,
    },
    {
      id: 'sargable',
      question: '¿Qué condiciones pueden usar un índice?',
      conceptId: 'sargable',
      cost: 5,
      body: `Las que comparan la **columna tal cual**:

| No usa el índice de fecha | Sí lo usa |
|---|---|
| \`EXTRACT(MONTH FROM fecha) = 2\` | \`fecha >= '2026-02-01' AND fecha < '2026-03-01'\` |
| \`fecha::text LIKE '2026-02%'\` | lo mismo |
| \`importe * 1.21 > 100\` | \`importe > 100 / 1.21\` |
| \`concepto LIKE '%agua%'\` | \`concepto LIKE 'Recibo%'\`* |

Al aplicar una función a la columna, el índice (ordenado por la columna) no ayuda. *El prefijo con LIKE necesita \`text_pattern_ops\` o la intercalación C.`,
    },
    {
      id: 'index_cost',
      question: '¿Por qué no pongo un índice en cada columna?',
      conceptId: 'index_cost',
      cost: 5,
      body: `Porque cada índice:

- **ocupa** espacio (a veces tanto como la tabla),
- se **actualiza** en cada INSERT, UPDATE y DELETE: más índices, escrituras más lentas,
- y el planificador solo usa uno o unos pocos por consulta.

Crea índices para consultas reales y compruébalos con EXPLAIN. Para encontrar los que sobran: repetidos en \`pg_indexes\`, y sin usar en \`pg_stat_user_indexes\` (\`idx_scan = 0\`).`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a8pre_seq', conceptId: 'explain', question: '¿Qué significa «Seq Scan» en un plan?', options: ['Que usa un índice', 'Que lee la tabla entera', 'Que ordena', 'Que hay un error'], correct: 1, explanation: 'Fila a fila, de principio a fin.' },
      { id: 'a8pre_analyze', conceptId: 'explain', question: '¿Qué añade `EXPLAIN ANALYZE` a `EXPLAIN`?', options: ['Nada', 'Ejecuta la consulta y da tiempos y filas reales', 'Crea los índices', 'Actualiza las estadísticas'], correct: 1, explanation: 'Ojo con un UPDATE: ANALYZE lo ejecuta de verdad.' },
      { id: 'a8pre_btree', conceptId: 'btree', question: 'Un índice sobre `cuenta_id` ayuda a…', options: ['Solo a ORDER BY', 'WHERE cuenta_id = 5, rangos y ORDER BY cuenta_id', 'Cualquier consulta de la tabla', 'Los INSERT'], correct: 1, explanation: 'Los INSERT, al contrario, los hace un poco más lentos.' },
      { id: 'a8pre_comp', conceptId: 'composite', question: 'Con el índice `(cuenta_id, fecha)`, ¿qué consulta lo aprovecha peor?', options: ['cuenta_id = 5', 'cuenta_id = 5 AND fecha > …', 'fecha > … (sin cuenta)', 'cuenta_id = 5 ORDER BY fecha'], correct: 2, explanation: 'Falta la primera columna del índice.' },
      { id: 'a8pre_partial', conceptId: 'partial', question: "¿Qué guarda `CREATE INDEX … ON movimientos (fecha) WHERE estado = 'pendiente'`?", options: ['Todas las fechas', 'Solo las fechas de los pendientes', 'Solo los estados', 'Nada'], correct: 1, explanation: 'Un índice parcial.' },
      { id: 'a8pre_expr', conceptId: 'expression', question: 'Hay un índice sobre `concepto`. ¿Lo usa `WHERE LOWER(concepto) = \'recibo agua\'`?', options: ['Sí', 'No: hace falta un índice sobre LOWER(concepto)', 'Solo con ANALYZE', 'Solo si hay pocas filas'], correct: 1, explanation: 'El índice guarda concepto, no LOWER(concepto).' },
    ],
    post: [
      { id: 'a8post_sarg', conceptId: 'sargable', question: '¿Qué condición puede usar el índice de `fecha`?', options: ['EXTRACT(MONTH FROM fecha) = 2', "fecha >= '2026-02-01' AND fecha < '2026-03-01'", "fecha::text LIKE '2026-02%'", 'date_trunc(\'month\', fecha) = \'2026-02-01\''], correct: 1, explanation: 'La columna tal cual, comparada con un rango.' },
      { id: 'a8post_like', conceptId: 'sargable', question: "¿Por qué `concepto LIKE '%agua%'` no usa un índice normal?", options: ['Porque LIKE nunca usa índices', 'Porque empieza por %: no se sabe por dónde empezar a buscar en el orden', 'Porque falta ANALYZE', 'Porque agua es una palabra corta'], correct: 1, explanation: 'Para buscar en medio del texto: índices de trigramas (pg_trgm).' },
      { id: 'a8post_cost', conceptId: 'index_cost', question: '¿Qué pasa al añadir diez índices a una tabla en la que se escribe mucho?', options: ['Todo va más rápido', 'Las lecturas pueden ir mejor, pero cada INSERT y UPDATE mantiene diez índices más', 'Nada', 'Se borran los datos'], correct: 1, explanation: 'Los índices se pagan al escribir.' },
      { id: 'a8post_redundant', conceptId: 'composite', question: 'Tienes `(cuenta_id)` y `(cuenta_id, fecha)`. ¿Cuál sobra normalmente?', options: ['El compuesto', 'El de cuenta_id: el compuesto ya sirve para cuenta_id', 'Ninguno', 'Los dos'], correct: 1, explanation: 'Un compuesto sirve para su prefijo.' },
      { id: 'a8post_seqok', conceptId: 'btree', question: 'Una consulta devuelve el 90 % de la tabla y el plan es Seq Scan aunque hay índice. ¿Está mal?', options: ['Sí, hay que forzar el índice', 'No: leer casi todo de seguido es más rápido que saltar por el índice', 'Sí, falta ANALYZE', 'Sí, el índice está roto'], correct: 1, explanation: 'El planificador elige lo más barato.' },
      { id: 'a8post_rows', conceptId: 'explain', question: 'EXPLAIN ANALYZE dice rows=10 estimadas y 50.000 reales. ¿Qué haces primero?', options: ['Crear un índice', 'ANALYZE de la tabla: las estadísticas están viejas', 'Borrar la tabla', 'Nada'], correct: 1, explanation: 'Con estadísticas malas, el planificador elige mal.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: '60.000 filas',
      body: 'Buenos días.\n\n`movimientos` ya tiene **60.000 filas** y empiezan las quejas: «va lento». Hoy toca ver **cómo** ejecuta PostgreSQL cada consulta (`EXPLAIN ANALYZE`) y darle los índices que necesita. Seguimos en la copia de pruebas.\n\nPara empezar, la consulta más básica de la app:\n\n- `SELECT * FROM movimientos WHERE cuenta_id = 5`. Mira su plan y crea el índice que necesita para dejar de leer la tabla entera.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'explain' }, { kind: 'unlock', conceptId: 'btree' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.indice_cuenta' },
      body: 'De «Rows Removed by Filter: 58846» a un Bitmap Index Scan. Mira el tiempo de EXPLAIN ANALYZE antes y después: esa es la diferencia que nota la app.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_extracto',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: `¡Hola! El extracto de la app tarda muchísimo. Hace esto:\n\n\`${EXTRACTO}\`\n\n¿Puedes crear un índice que resuelva **la cuenta y la fecha a la vez**?`,
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'composite' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.indice_compuesto' },
      body: 'Un solo índice para las dos condiciones. El extracto vuela. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_pendientes',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: `Hola. Mi panel de movimientos pendientes consulta \`${PENDIENTES}\` cada minuto. Solo hay **300 pendientes** entre 60.000. ¿Un índice que **solo guarde esas**, para que ocupe poco?`,
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'partial' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.indice_parcial' },
      body: 'Índice de 300 entradas y el panel ya no se cuelga. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_like',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: "11:00 · Inés: «'%agua%'»",
      body: "**Inés:** Los agentes de Nuria también buscan con `WHERE concepto LIKE '%agua%'`. Rubén ha creado un índice sobre `concepto` y la búsqueda sigue en Seq Scan. Dice que el índice «no funciona». ¿Qué le explicas?",
      onDeliver: [],
      choices: [
        {
          id: 'prefix',
          text: "Que un índice normal está **ordenado desde el principio del texto**: sirve para `LIKE 'agua%'`, pero con `%` al principio no sabe por dónde empezar y tiene que mirar todas las filas. Si buscan el concepto entero, igualdad con `LOWER(…)` y un índice de expresión; si de verdad buscan en medio del texto, un índice de **trigramas** (`pg_trgm`, GIN).",
          cost: 10,
          reply: 'Exacto. El índice funciona; lo que no puede es buscar por el medio. Hay que cambiar la consulta o el tipo de índice.',
          effects: [
            { kind: 'flag', key: 'practice.like_prefix' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: "LIKE '%…' no usa un índice normal: igualdad, prefijo o trigramas." },
          ],
        },
        {
          id: 'analyze',
          text: 'Que le falta un `ANALYZE movimientos` para que el planificador vea el índice.',
          cost: 10,
          reply: 'Las estadísticas no cambian que el índice no pueda buscar por el medio del texto. Seguiría en Seq Scan.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a las estadísticas de un LIKE que no puede usar el índice.' }],
        },
        {
          id: 'force',
          text: 'Que hay que obligar a PostgreSQL a usar el índice.',
          cost: 10,
          reply: 'PostgreSQL no tiene forma de usar ese índice para ese LIKE. Y si la tuviera, sería más lento que leer la tabla.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Quisiste forzar un índice que no sirve para esa búsqueda.' }],
        },
      ],
    },
    {
      id: 'nuria_conceptos',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: `Hola. Cuando un cliente pregunta por un recibo, buscamos así, porque los conceptos están escritos de mil maneras:\n\n\`${CONCEPTO}\`\n\nTarda muchísimo. Diego dice que ya hay índices… ¿puedes crear el que sirva para esto?`,
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'expression' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.indice_expresion' },
      body: 'Ahora la búsqueda sale al momento. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_febrero',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. El informe mensual hace esto y a fin de mes se come la base de datos:\n\n`SELECT COUNT(*) AS movimientos FROM movimientos WHERE EXTRACT(YEAR FROM fecha) = 2026 AND EXTRACT(MONTH FROM fecha) = 2`\n\nHay índice sobre `fecha`, pero el plan dice Seq Scan. ¿Me lo reescribes para que lo use? Una columna `movimientos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'sargable' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.fecha_sargable' },
      body: '3.961 movimientos, el mismo número, y ahora con Bitmap Index Scan. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_duplicado',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Las cargas de movimientos de mis pruebas van más lentas de lo normal y sospecho que `movimientos` tiene **dos índices iguales**. ¿Lo miras y quitas el que sobra? Que siga habiendo un índice sobre `fecha`, que el informe de Diego lo usa.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'index_cost' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.indice_duplicado' },
      body: 'movimientos_fecha_idx e idx_mov_fecha eran el mismo. Uno menos que mantener en cada carga. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_sobre',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «índices para todo»',
      body: '**Inés:** Diego, animado con lo de hoy, propone crear un índice en **cada columna** de `movimientos` «por si acaso, así todo va rápido». ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'real',
          text: 'Que cada índice **ocupa** espacio y se **actualiza en cada INSERT y UPDATE**: con siete índices más, las cargas irían bastante más lentas, y la mayoría no los usaría ninguna consulta. Índices para las consultas reales, comprobados con EXPLAIN, y quitar los que no se usan (`pg_stat_user_indexes`). Por cierto, el de `cuenta_id` de esta mañana ya sobra: lo cubre el `(cuenta_id, fecha)`.',
          cost: 10,
          reply: 'Eso es. Un índice es una consulta que va más rápido a cambio de que todas las escrituras vayan un poco más despacio. Hay que poder justificarlo.',
          effects: [
            { kind: 'flag', key: 'practice.over_index' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Índices para consultas reales; cada uno se paga al escribir.' },
          ],
        },
        {
          id: 'yes',
          text: 'Que sí: más índices, más rápido.',
          cost: 10,
          reply: 'Más rápido para leer, a veces. Más lento para escribir, siempre. Y una consulta usa uno o dos, no siete.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste índices sin consultas que los necesiten.' }],
        },
        {
          id: 'composite',
          text: 'Que mejor un solo índice compuesto con todas las columnas.',
          cost: 10,
          reply: 'Un índice con siete columnas solo sirve para consultas que filtran por la primera. Y es casi tan grande como la tabla.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Un índice compuesto gigante no sustituye a pensar las consultas.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy has hecho que vaya rápido. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que antes de crear un índice se mira el plan con EXPLAIN ANALYZE; que un compuesto va con la igualdad primero y sirve para su prefijo; que un parcial guarda solo lo que interesa; que si la consulta usa LOWER(col), el índice tiene que ser sobre LOWER(col); que una función sobre la columna o un % al principio impiden usar el índice; y que cada índice se paga al escribir.',
          reply: 'Muy bien. Mañana, último día de la semana: rendimiento de verdad, con paginación y vistas materializadas.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'more',
          text: 'Que si algo va lento, se añade un índice y listo.',
          reply: 'A veces el problema es la consulta (un EXTRACT, un LIKE con %), y otro índice no lo arregla. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con que todo se arregla con un índice.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
