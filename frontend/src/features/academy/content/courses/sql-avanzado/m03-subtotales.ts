import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

/** Pagos aceptados con su comercio: la base de casi todos los informes de hoy. */
const PAGOS = "FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE p.estado = 'aceptado'"

/**
 * Curso 7: SQL avanzado · Misión 3 — Totales y subtotales.
 *
 * ROLLUP, CUBE y GROUPING SETS para varios niveles de total en una consulta,
 * GROUPING() para distinguir un subtotal de un NULL de verdad, y LATERAL para
 * «los N de cada uno» con columnas de la fila de fuera. Trampas: COALESCE en
 * vez de GROUPING() y sumar un resultado que ya trae subtotales.
 */
export const m03Subtotales: Mission = {
  ...COMUN,
  id: 'm03-subtotales',
  number: 3,
  title: 'Totales y subtotales',
  subtitle: 'ROLLUP, CUBE, GROUPING SETS, GROUPING() y LATERAL.',
  dayLabel: 'Jueves · mes 3',
  verdicts: {
    good: {
      title: 'Cada total en su nivel',
      body: 'Inés tiene su informe con subtotales, Marta su cubo, Carmen sus dos vistas del año, Nuria sus etiquetas bien puestas, Diego las dos mayores transferencias de cada cliente y Laura el último evento de todos, también del que no tiene ninguno.',
    },
    ok: {
      title: 'Subtotales con algún NULL de más',
      body: 'Ya haces totales y subtotales en una consulta, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Un informe por cada nivel de total',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de subtotales a mano.',
    },
  },

  briefing: {
    title: 'Mes 3 · Totales y subtotales',
    paragraphs: [
      'Jueves de informes: totales por categoría, por ciudad, por las dos cosas y el total general, todo en la misma tabla. Y algún «los dos mayores de cada cliente».',
      'Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas, subtotales incluidos.',
    ],
    goals: [
      'Saca subtotales jerárquicos y el total general con ROLLUP.',
      'Saca todas las combinaciones de totales con CUBE.',
      'Elige exactamente qué totales quieres con GROUPING SETS.',
      'Distingue una fila de subtotal de un NULL de los datos con GROUPING().',
      'Saca los N primeros de cada fila con LATERAL.',
      'Conserva las filas sin datos con LEFT JOIN LATERAL.',
    ],
  },

  docs: [
    {
      id: 'chuleta_subtotales',
      title: 'Chuleta: subtotales y LATERAL',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'rollup' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Varios niveles de total
| GROUP BY | Grupos que salen |
|---|---|
| \`ROLLUP (a, b)\` | (a, b), (a), () |
| \`CUBE (a, b)\` | (a, b), (a), (b), () |
| \`GROUPING SETS ((a), (b), ())\` | Exactamente los que digas |

En las filas de subtotal, las columnas «sumadas» salen como **NULL**.

## ¿Subtotal o NULL de verdad?
\`GROUPING(a)\` = 1 si la fila es un subtotal que ha sumado todos los valores de \`a\`; 0 si \`a\` es un valor de los datos (aunque sea NULL).
\`\`\`
CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total'
     ELSE COALESCE(c.categoria, 'sin categoría') END
\`\`\`

## LATERAL
Una subconsulta en el FROM que puede usar columnas de las tablas de su izquierda:
\`\`\`
FROM clientes c
CROSS JOIN LATERAL (SELECT … WHERE x.cliente_id = c.id ORDER BY … LIMIT 2) t
\`\`\`
\`LEFT JOIN LATERAL (…) t ON true\` conserva los clientes para los que la subconsulta no devuelve nada.

## Cuidado
Un resultado con ROLLUP ya trae los subtotales: si lo sumas entero, cuentas dos veces.`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: true,
    runCost: 2,
    starter:
      "-- Total aceptado por categoría, con el total general\nSELECT c.categoria, SUM(p.importe) AS total\nFROM pagos_tarjeta p\nJOIN comercios c ON c.id = p.comercio_id\nWHERE p.estado = 'aceptado'\nGROUP BY ROLLUP (c.categoria);",
    retos: [
      {
        id: 'rollup_categoria',
        from: 'ines',
        title: 'Categoría, ciudad, subtotales y total',
        description: 'Importe de los pagos **aceptados** por `categoria` y `ciudad` del comercio, con el **subtotal de cada categoría** y el **total general**: `categoria`, `ciudad` y `total`.',
        hint: '`GROUP BY ROLLUP (c.categoria, c.ciudad)` con `SUM(p.importe) AS total`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: `SELECT c.categoria, c.ciudad, SUM(p.importe) AS total ${PAGOS} GROUP BY ROLLUP (c.categoria, c.ciudad)`,
        columns: ['categoria', 'ciudad', 'total'],
        requires: [exige(/\brollup\b/i, 'Este encargo se resuelve con `GROUP BY ROLLUP (…)`.')],
      },
      {
        id: 'cubo_estado_tipo',
        from: 'marta',
        title: 'Estado de pago por tipo de tarjeta, en todas las combinaciones',
        description: 'Número de pagos (todos) por `estado` del pago y `tipo` de tarjeta, con **todas las combinaciones de totales**: por estado, por tipo y el general. Columnas `estado`, `tipo` y `pagos`.',
        hint: '`pagos_tarjeta JOIN tarjetas` y `GROUP BY CUBE (p.estado, t.tipo)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT p.estado, t.tipo, COUNT(*) AS pagos FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id GROUP BY CUBE (p.estado, t.tipo)',
        columns: ['estado', 'tipo', 'pagos'],
        requires: [exige(/\bcube\b/i, 'Este encargo se resuelve con `GROUP BY CUBE (…)`.')],
      },
      {
        id: 'sets_2026',
        from: 'carmen',
        title: 'El año 2026 por categoría y por mes, en una tabla',
        description: 'Pagos **aceptados** desde el **1 de enero de 2026**: el total por `categoria`, el total por `mes` (primer día, como fecha) y el total general, **sin** el cruce categoría × mes. Columnas `categoria`, `mes` y `total`.',
        hint: "`GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ())`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: `SELECT c.categoria, DATE_TRUNC('month', p.pagado_en)::date AS mes, SUM(p.importe) AS total ${PAGOS} AND p.pagado_en >= '2026-01-01' GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ())`,
        columns: ['categoria', 'mes', 'total'],
        requires: [exige(/\bgrouping\s+sets\b/i, 'Este encargo se resuelve con `GROUP BY GROUPING SETS (…)`.')],
      },
      {
        id: 'etiquetas',
        from: 'nuria',
        title: 'Pagos por categoría con etiquetas que no engañan',
        description: 'Número de pagos (todos) por categoría con el total general. En la columna `categoria`: **`Total`** en la fila del total y **`sin categoría`** para los comercios que no tienen. Columnas `categoria` y `pagos`.',
        hint: "`GROUP BY ROLLUP (c.categoria)` y `CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END AS categoria, COUNT(*) AS pagos FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id GROUP BY ROLLUP (c.categoria)",
        columns: ['categoria', 'pagos'],
        requires: [exige(/\bgrouping\s*\(/i, 'Usa `GROUPING(…)` para saber qué fila es el total.')],
      },
      {
        id: 'top2_transferencias',
        from: 'diego',
        title: 'Las dos mayores transferencias de cada cliente',
        description: 'Para cada cliente, sus **dos transferencias enviadas de mayor importe** (si empatan, la de menor id): `cliente_id`, `transferencia_id` e `importe`. Los clientes sin transferencias no salen.',
        hint: '`FROM clientes c CROSS JOIN LATERAL (SELECT tr.id, tr.importe FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id WHERE a.cliente_id = c.id ORDER BY tr.importe DESC, tr.id LIMIT 2) t`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT c.id AS cliente_id, t.id AS transferencia_id, t.importe FROM clientes c CROSS JOIN LATERAL (SELECT tr.id, tr.importe FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id WHERE a.cliente_id = c.id ORDER BY tr.importe DESC, tr.id LIMIT 2) t',
        columns: ['cliente_id', 'transferencia_id', 'importe'],
        requires: [exige(/\blateral\b/i, 'Este encargo se resuelve con `LATERAL`.')],
      },
      {
        id: 'ultimo_evento',
        from: 'laura',
        title: 'El último evento de cada cliente',
        description: '**Todos** los clientes, también los que no tienen eventos: `id`, `nombre`, `ultimo_evento` (fecha y hora de su último evento en la app) y `tipo` de ese evento. Si dos eventos coinciden, el de mayor id.',
        hint: '`FROM clientes c LEFT JOIN LATERAL (SELECT e.ocurrido_en, e.tipo FROM eventos_app e WHERE e.cliente_id = c.id ORDER BY e.ocurrido_en DESC, e.id DESC LIMIT 1) u ON true`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT c.id, c.nombre, u.ocurrido_en AS ultimo_evento, u.tipo FROM clientes c LEFT JOIN LATERAL (SELECT e.ocurrido_en, e.tipo FROM eventos_app e WHERE e.cliente_id = c.id ORDER BY e.ocurrido_en DESC, e.id DESC LIMIT 1) u ON true',
        columns: ['id', 'nombre', 'ultimo_evento', 'tipo'],
        requires: [exige(/\blateral\b/i, 'Este encargo se resuelve con `LATERAL`.')],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El comité de producto recibe cuatro informes para una sola tabla', severity: 'low', explanation: 'Sin CUBE, Marta juntó a mano los totales por estado, por tipo y el general.', technique: 'GROUP BY CUBE.', preventedBy: 'reto.cubo_estado_tipo' },
    { id: 'C-CARMEN', title: 'El informe anual de riesgos cruza todo con todo', severity: 'medium', explanation: 'Carmen solo quería dos cortes y el total, y le llegó el cruce completo.', technique: 'GROUPING SETS con los grupos exactos.', preventedBy: 'reto.sets_2026' },
    { id: 'C-NURIA', title: 'El cuadro de mando muestra dos filas «Total»', severity: 'medium', explanation: 'COALESCE convirtió en «Total» también la categoría vacía de los datos.', technique: 'GROUPING() para el total, COALESCE para los datos.', preventedBy: 'reto.etiquetas' },
    { id: 'C-DIEGO', title: 'La revisión de grandes transferencias se queda en una por cliente', severity: 'medium', explanation: 'Diego usó MAX, que solo da el importe más alto.', technique: 'LATERAL con ORDER BY y LIMIT.', preventedBy: 'reto.top2_transferencias' },
    { id: 'C-LAURA', title: 'El informe de actividad pierde al cliente que nunca entró', severity: 'low', explanation: 'Con CROSS JOIN LATERAL, el cliente 38 desaparece.', technique: 'LEFT JOIN LATERAL … ON true.', preventedBy: 'reto.ultimo_evento' },
    { id: 'C-COALESCE', title: 'Un subtotal se confunde con los pagos de la tienda online', severity: 'high', explanation: 'La tienda online no tiene ciudad: su fila y el subtotal de compras parecían iguales.', technique: 'GROUPING() para distinguirlas.', preventedBy: 'practice.grouping_fn' },
    { id: 'C-DOBLE', title: 'El total de una presentación sale el doble', severity: 'high', explanation: 'Se sumó un resultado con ROLLUP que ya traía el total.', technique: 'Sumar solo las filas de detalle o usar la fila de total.', preventedBy: 'practice.no_double_count' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los informes del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.cubo_estado_tipo', label: 'Comité de Marta', explanation: 'Todas las combinaciones con CUBE.' },
      { flag: 'reto.sets_2026', label: 'Informe de Carmen', explanation: 'Solo los cortes pedidos.' },
      { flag: 'reto.etiquetas', label: 'Cuadro de Nuria', explanation: 'Total y sin categoría, bien etiquetados.' },
      { flag: 'reto.top2_transferencias', label: 'Revisión de Diego', explanation: 'Dos por cliente con LATERAL.' },
      { flag: 'reto.ultimo_evento', label: 'Actividad de Laura', explanation: 'Todos los clientes, con LEFT JOIN LATERAL.' },
      { flag: 'practice.grouping_fn', label: 'Subtotales reconocibles', explanation: 'GROUPING() en vez de COALESCE.' },
      { flag: 'practice.no_double_count', label: 'Totales que cuadran', explanation: 'No sumar subtotales dos veces.' },
    ],
  },

  concepts: [
    { id: 'rollup', title: 'ROLLUP', summary: 'Subtotales jerárquicos de izquierda a derecha y el total general.' },
    { id: 'cube', title: 'CUBE', summary: 'Los totales de todas las combinaciones de columnas.' },
    { id: 'grouping_sets', title: 'GROUPING SETS', summary: 'Exactamente los grupos que digas, en una consulta.' },
    { id: 'grouping_fn', title: 'GROUPING()', summary: '1 en las filas de subtotal de esa columna, 0 en las de datos: distingue un subtotal de un NULL real.' },
    { id: 'lateral', title: 'LATERAL', summary: 'Una subconsulta del FROM que usa columnas de la fila de fuera: los N de cada uno.' },
    { id: 'left_lateral', title: 'LEFT JOIN LATERAL', summary: 'Conserva las filas para las que la subconsulta no devuelve nada.' },
    { id: 'double_count', title: 'Subtotales y sumas', summary: 'Un resultado con subtotales no se vuelve a sumar entero.' },
  ],
  debriefConcepts: ['rollup', 'cube', 'grouping_sets', 'grouping_fn', 'lateral', 'left_lateral', 'double_count'],
  seniorTips: [
    'Lee la chuleta de subtotales en la wiki.',
    'Inés: SUM(p.importe) de aceptados con GROUP BY ROLLUP (c.categoria, c.ciudad).',
    'Marta: pagos JOIN tarjetas y GROUP BY CUBE (p.estado, t.tipo).',
    "Carmen: GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ()) desde 2026.",
    "Nuria: CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total' ELSE COALESCE(c.categoria, 'sin categoría') END con ROLLUP.",
    'Diego: CROSS JOIN LATERAL con ORDER BY tr.importe DESC, tr.id LIMIT 2.',
    'Laura: LEFT JOIN LATERAL (… ORDER BY ocurrido_en DESC, id DESC LIMIT 1) u ON true.',
    'Con Inés: GROUPING() para los subtotales; y no sumar un ROLLUP entero.',
  ],

  lessons: [
    {
      id: 'rollup',
      question: '¿Cómo saco subtotales y el total en la misma consulta?',
      conceptId: 'rollup',
      cost: 5,
      body: `Con \`ROLLUP\` en el \`GROUP BY\`:

\`\`\`
SELECT c.categoria, c.ciudad, SUM(p.importe) AS total
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
GROUP BY ROLLUP (c.categoria, c.ciudad);
\`\`\`

Salen los grupos (categoría, ciudad), después (categoría) —el subtotal de cada categoría, con la ciudad a NULL— y () —el total general, con las dos a NULL—. El orden importa: \`ROLLUP (ciudad, categoria)\` daría subtotales por ciudad.`,
    },
    {
      id: 'cube',
      question: '¿Y si quiero los totales por cada columna por separado?',
      conceptId: 'cube',
      cost: 5,
      body: `\`CUBE (a, b)\` saca todas las combinaciones: (a, b), (a), (b) y ().

\`\`\`
SELECT p.estado, t.tipo, COUNT(*)
FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id
GROUP BY CUBE (p.estado, t.tipo);
\`\`\`

Con tres columnas son 8 grupos; con cuatro, 16. Úsalo cuando de verdad quieras todos los cortes.`,
    },
    {
      id: 'sets',
      question: '¿Puedo elegir exactamente qué totales salen?',
      conceptId: 'grouping_sets',
      cost: 5,
      body: `Sí, con \`GROUPING SETS\`:

\`\`\`
GROUP BY GROUPING SETS ((c.categoria), (DATE_TRUNC('month', p.pagado_en)::date), ())
\`\`\`

Total por categoría, total por mes y total general, sin el cruce de las dos. ROLLUP y CUBE son atajos de GROUPING SETS: \`ROLLUP (a, b)\` = \`GROUPING SETS ((a, b), (a), ())\`.`,
    },
    {
      id: 'grouping',
      question: '¿Cómo sé si un NULL es un subtotal o un dato vacío?',
      conceptId: 'grouping_fn',
      cost: 5,
      body: `Con \`GROUPING(columna)\`: 1 si en esa fila la columna se ha «sumado» (subtotal o total), 0 si es un valor de los datos.

\`\`\`
SELECT CASE WHEN GROUPING(c.categoria) = 1 THEN 'Total'
            ELSE COALESCE(c.categoria, 'sin categoría') END AS categoria,
       COUNT(*)
FROM … GROUP BY ROLLUP (c.categoria);
\`\`\`

Con \`COALESCE(c.categoria, 'Total')\`, la floristería, que no tiene categoría, también se llamaría «Total».`,
    },
    {
      id: 'lateral',
      question: '¿Qué es LATERAL?',
      conceptId: 'lateral',
      cost: 5,
      body: `Una subconsulta en el \`FROM\` que puede usar columnas de las tablas que tiene a su izquierda. Se ejecuta «para cada fila» de fuera:

\`\`\`
SELECT c.id, t.id, t.importe
FROM clientes c
CROSS JOIN LATERAL (
  SELECT tr.id, tr.importe
  FROM transferencias tr JOIN cuentas a ON a.id = tr.cuenta_origen_id
  WHERE a.cliente_id = c.id
  ORDER BY tr.importe DESC, tr.id
  LIMIT 2
) t;
\`\`\`

Es la forma natural de «los N primeros de cada uno» con ORDER BY y LIMIT.`,
    },
    {
      id: 'left_lateral',
      question: '¿Y los que no tienen ninguno?',
      conceptId: 'left_lateral',
      cost: 5,
      body: `\`CROSS JOIN LATERAL\` funciona como un JOIN: si la subconsulta no devuelve filas, la fila de fuera desaparece. Para conservarla, \`LEFT JOIN LATERAL\` con una condición que siempre se cumple:

\`\`\`
FROM clientes c
LEFT JOIN LATERAL (SELECT … LIMIT 1) u ON true
\`\`\`

El cliente sin eventos sale con NULL en las columnas de \`u\`.`,
    },
    {
      id: 'double',
      question: '¿Puedo sumar el resultado de un ROLLUP?',
      conceptId: 'double_count',
      cost: 5,
      body: `No entero: ya trae los subtotales y el total, y los sumarías otra vez. Con un \`ROLLUP (categoria)\`, sumar todas las filas da **el doble** del total.

O sumas solo las filas de detalle (\`WHERE GROUPING(…) = 0\`, o la consulta sin ROLLUP), o usas directamente la fila del total. Es un error típico al pasar un informe a una hoja de cálculo.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a3pre_rollup', conceptId: 'rollup', question: '¿Qué grupos saca `GROUP BY ROLLUP (a, b)`?', options: ['(a, b)', '(a, b), (a), ()', '(a, b), (a), (b), ()', '(a), (b)'], correct: 1, explanation: 'Subtotales de izquierda a derecha y el total.' },
      { id: 'a3pre_cube', conceptId: 'cube', question: '¿Y `GROUP BY CUBE (a, b)`?', options: ['(a, b), (a), ()', '(a, b), (a), (b), ()', '(a, b)', '()'], correct: 1, explanation: 'Todas las combinaciones.' },
      { id: 'a3pre_sets', conceptId: 'grouping_sets', question: '¿Cómo pides solo el total por a, el total por b y el general?', options: ['ROLLUP (a, b)', 'GROUPING SETS ((a), (b), ())', 'CUBE (a, b)', 'GROUP BY a, b'], correct: 1, explanation: 'GROUPING SETS elige los grupos exactos.' },
      { id: 'a3pre_null', conceptId: 'grouping_fn', question: 'En la fila del total de un ROLLUP, las columnas agrupadas salen como…', options: ['0', 'NULL', "'Total'", "vacías ('')"], correct: 1, explanation: 'Y por eso se confunden con NULL de los datos.' },
      { id: 'a3pre_lateral', conceptId: 'lateral', question: '¿Qué permite LATERAL en una subconsulta del FROM?', options: ['Usar columnas de las tablas de su izquierda', 'Ordenar', 'Agrupar', 'Nada especial'], correct: 0, explanation: 'Por eso sirve para «los N de cada uno».' },
      { id: 'a3pre_double', conceptId: 'double_count', question: 'Sumas todas las filas de un `GROUP BY ROLLUP (categoria)`. Te sale…', options: ['El total', 'El doble del total', 'La media', 'Error'], correct: 1, explanation: 'La fila del total se suma con las de detalle.' },
    ],
    post: [
      { id: 'a3post_rollup', conceptId: 'rollup', question: 'Con `ROLLUP (categoria, ciudad)`, ¿qué fila es el subtotal de «compras»?', options: ["categoria = 'compras' y ciudad NULL (con GROUPING(ciudad) = 1)", "ciudad = 'compras'", 'La última fila', 'No hay subtotales por categoría'], correct: 0, explanation: 'Y la tienda online, sin ciudad, también tiene ciudad NULL: por eso GROUPING().' },
      { id: 'a3post_cube', conceptId: 'cube', question: '¿Cuántos grupos genera `CUBE` con tres columnas?', options: ['3', '4', '8', '9'], correct: 2, explanation: '2³ combinaciones.' },
      { id: 'a3post_grouping', conceptId: 'grouping_fn', question: '¿Qué devuelve `GROUPING(c.categoria)` en la fila de la floristería (categoría NULL en los datos)?', options: ['1', '0', 'NULL', 'Error'], correct: 1, explanation: 'Es un valor de los datos, no un subtotal.' },
      { id: 'a3post_coalesce', conceptId: 'grouping_fn', question: "¿Por qué `COALESCE(categoria, 'Total')` es mala idea con ROLLUP?", options: ['Es lenta', 'Llama «Total» también a los NULL de los datos', 'No funciona con ROLLUP', 'Cambia el orden'], correct: 1, explanation: 'Salen dos filas «Total».' },
      { id: 'a3post_left', conceptId: 'left_lateral', question: 'El cliente 38 no tiene eventos. ¿Sale con `CROSS JOIN LATERAL (… LIMIT 1)`?', options: ['Sí, con NULL', 'No: hace falta LEFT JOIN LATERAL … ON true', 'Sí, con 0', 'Da error'], correct: 1, explanation: 'CROSS JOIN pierde las filas sin pareja.' },
      { id: 'a3post_lateral', conceptId: 'lateral', question: 'Para las dos mayores transferencias de cada cliente, dentro del LATERAL va…', options: ['GROUP BY cliente_id', 'WHERE a.cliente_id = c.id ORDER BY importe DESC LIMIT 2', 'MAX(importe)', 'DISTINCT'], correct: 1, explanation: 'Filtra por el cliente de fuera, ordena y corta.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Subtotales sin copiar y pegar',
      body: 'Buenos días.\n\nHoy todo el mundo quiere tablas con subtotales: por categoría, por ciudad, por las dos y el total. Hasta ahora eso eran varias consultas pegadas en una hoja de cálculo. PostgreSQL lo hace en una con `ROLLUP`, `CUBE` y `GROUPING SETS`.\n\nPara empezar, con los pagos **aceptados**:\n\n- El importe por `categoria` y `ciudad` del comercio, con el **subtotal de cada categoría** y el **total general**: columnas `categoria`, `ciudad` y `total`.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'rollup' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.rollup_categoria' },
      body: 'Treinta y dos filas y el total general abajo: 33.021,22 €. Fíjate en «compras»: hay dos filas con la ciudad vacía. Una es la tienda online, que no tiene ciudad; la otra, el subtotal. Ya hablaremos de eso.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_cubo',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Para el comité quiero una tabla con el número de pagos (todos) por `estado` y por `tipo` de tarjeta, y **todos los totales**: por estado, por tipo y el general. Columnas `estado`, `tipo` y `pagos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'cube' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.cubo_estado_tipo' },
      body: 'Diez filas: todo el crédito aceptado y 306 pagos en total. Una tabla en vez de cuatro. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_sets',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para el informe de riesgos de 2026 quiero, de los pagos **aceptados** desde el 1 de enero: el total por `categoria`, el total por `mes` (primer día, como fecha) y el total general. **Sin** el cruce de categoría y mes, que no lo leo. Columnas `categoria`, `mes` y `total`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'grouping_sets' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.sets_2026' },
      body: 'Doce filas, 6.593,70 € en total. Justo lo que pedí, ni una fila de más. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_coalesce',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «Dos filas que se llaman Total»',
      body: '**Inés:** Nuria ha preparado su cuadro de mando con:\n\n`SELECT COALESCE(c.categoria, \'Total\') AS categoria, COUNT(*) FROM … GROUP BY ROLLUP (c.categoria);`\n\nY le salen **dos** filas «Total»: una con 306 pagos y otra con 12. ¿Qué pasa?',
      onDeliver: [{ kind: 'unlock', conceptId: 'grouping_fn' }],
      choices: [
        {
          id: 'grouping',
          text: 'La floristería **no tiene categoría** en los datos: su NULL y el NULL de la fila del total se ven iguales, y COALESCE los convierte a los dos en «Total» (la de 12 es la floristería). Hay que preguntar con `GROUPING(c.categoria)`: 1 en la fila del total, 0 en las de datos. Total si es 1; si no, `COALESCE(c.categoria, \'sin categoría\')`.',
          cost: 10,
          reply: 'Exacto. En un ROLLUP, NULL puede significar «todas» o «no hay dato». GROUPING() es la única forma segura de distinguirlos.',
          effects: [
            { kind: 'flag', key: 'practice.grouping_fn' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Para etiquetar subtotales, GROUPING(); COALESCE confunde los NULL de los datos con los del total.' },
          ],
        },
        {
          id: 'where',
          text: 'Que quite los comercios sin categoría con un `WHERE c.categoria IS NOT NULL`.',
          cost: 10,
          reply: 'Así desaparecen doce pagos reales y el total deja de cuadrar con el de los demás informes.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Quitaste datos reales para arreglar una etiqueta.' }],
        },
        {
          id: 'order',
          text: 'Que ordene por el número de pagos: la mayor es el total.',
          cost: 10,
          reply: 'Funciona hoy y falla el día que una categoría tenga más pagos que el total de otra consulta… y la etiqueta seguiría mintiendo.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Identificaste el total por su tamaño en vez de por GROUPING().' }],
        },
      ],
    },
    {
      id: 'nuria_etiquetas',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Para el cuadro de mando quiero el número de pagos (todos) por categoría y el total, con las **etiquetas bien**: **`Total`** en la fila del total y **`sin categoría`** para los comercios que no tienen. Columnas `categoria` y `pagos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.etiquetas' },
      body: 'Diez filas, un solo «Total» con 306 y la floristería como «sin categoría» con 12. ¡Ahora sí!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_top2',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Para la revisión de grandes movimientos quiero, de cada cliente, sus **dos transferencias enviadas de mayor importe** (si empatan, la de menor id): `cliente_id`, `transferencia_id` e `importe`. Los que no tienen transferencias, fuera.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'lateral' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.top2_transferencias' },
      body: 'Setenta y ocho filas, dos por cliente. La de 15.700 € del cliente 19 encabeza la revisión. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_ultimo',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Para el informe de actividad quiero a **todos** los clientes con su **último evento** en la app: `id`, `nombre`, `ultimo_evento` (fecha y hora) y su `tipo`. Si dos coinciden, el de mayor id. Y que salgan también los que no tienen ninguno.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'left_lateral' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.ultimo_evento' },
      body: 'Cuarenta clientes, y el 38 con todo vacío: nunca ha entrado en la app. Justo el que más me interesaba. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_doble',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «66.042 €»',
      body: '**Inés:** Marta ha copiado el resultado de un `GROUP BY ROLLUP (c.categoria)` de los aceptados a una hoja de cálculo y ha sumado la columna `total` para su presentación: **66.042,44 €**. Los pagos aceptados suman 33.021,22 €. ¿Qué ha pasado?',
      onDeliver: [{ kind: 'unlock', conceptId: 'double_count' }],
      choices: [
        {
          id: 'double',
          text: 'El ROLLUP ya trae la fila del **total general**, y al sumar la columna entera ha sumado las categorías **y** el total: el doble exacto. O suma solo las filas de detalle (las que tienen `GROUPING(c.categoria) = 0`) o usa directamente la fila del total. Y conviene marcar esa fila para que no se confunda.',
          cost: 10,
          reply: 'Eso es. Un resultado con subtotales es para leerlo, no para volver a sumarlo. Y el doble exacto es una pista clarísima.',
          effects: [
            { kind: 'flag', key: 'practice.no_double_count' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Un resultado con ROLLUP ya trae los totales: no se suma entero.' },
          ],
        },
        {
          id: 'dups',
          text: 'Que habrá pagos duplicados en los datos.',
          cost: 10,
          reply: 'Hay tres copias duplicadas, pero no explican el doble exacto. Lo que se repite es el total del ROLLUP.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a los datos de una suma mal hecha.' }],
        },
        {
          id: 'half',
          text: 'Que divida entre dos y listo.',
          cost: 10,
          reply: 'Con un ROLLUP de dos columnas ya no sería entre dos, y nadie sabría por qué. Hay que entender qué filas se suman.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Corregiste el número sin entender el error.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy has hecho totales y subtotales. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que ROLLUP da subtotales jerárquicos, CUBE todas las combinaciones y GROUPING SETS los grupos exactos; que GROUPING() distingue un subtotal de un NULL de los datos; que un resultado con subtotales no se suma entero; y que LATERAL saca los N de cada uno, con LEFT JOIN LATERAL para no perder a nadie.',
          reply: 'Muy bien. Mañana, JSON y arrays: datos que no caben en columnas.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'union',
          text: 'Que es más claro hacer una consulta por nivel de total y juntarlas con UNION ALL.',
          reply: 'Se puede, pero son tres consultas que mantener y la misma tabla leída tres veces. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con una consulta por nivel de total.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
