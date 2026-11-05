import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const VENTANA = exige(/\bover\s*[(\w]/i, 'Este encargo se resuelve con una función de ventana: `… OVER (…)`.')
const WINDOW_CON_NOMBRE = exige(/\bwindow\s+\w+\s+as\b/i, 'Define la ventana una sola vez con `WINDOW w AS (…)` y úsala con `OVER w`.')

/** Total aceptado de cada día de febrero de 2026 (solo los días con pagos). */
const DIARIO_FEB = "WITH d AS (SELECT pagado_en::date AS dia, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01' GROUP BY pagado_en::date)"
const MENSUAL = "WITH m AS (SELECT DATE_TRUNC('month', pagado_en)::date AS mes, SUM(importe) AS total FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY DATE_TRUNC('month', pagado_en)::date)"

/**
 * Curso 7: SQL avanzado · Misión 1 — Ventanas a fondo.
 *
 * FIRST_VALUE, LAST_VALUE y NTH_VALUE, marcos ROWS y RANGE (también hacia
 * delante), CUME_DIST y ventanas con nombre (WINDOW). Trampas: LAST_VALUE con
 * el marco por defecto y ROWS en vez de RANGE cuando faltan días.
 */
export const m01Ventanas: Mission = {
  ...COMUN,
  id: 'm01-ventanas',
  number: 1,
  title: 'Ventanas a fondo',
  subtitle: 'Marcos ROWS y RANGE, primero, último y enésimo, distribución y ventanas con nombre.',
  dayLabel: 'Martes · mes 3',
  verdicts: {
    good: {
      title: 'Cada ventana con su marco',
      body: 'Marta tiene su suma de siete días de verdad, Carmen los segundos pagos más altos, Nuria sus percentiles, Diego su informe sin repetir la ventana y Laura su media centrada. Y ningún «último» se quedó en la fila actual.',
    },
    ok: {
      title: 'Ventanas con algún marco torcido',
      body: 'Ya controlas los marcos, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Ventanas con el marco por defecto',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de marcos a mano.',
    },
  },

  briefing: {
    title: 'Mes 3 · Ventanas a fondo',
    paragraphs: [
      'El mes pasado usaste ventanas para rankings y acumulados. Hoy toca lo que decide qué filas ve cada ventana: el marco.',
      'Cada encargo se cumple cuando tu consulta, con funciones de ventana, devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Saca el primer y el último valor de cada grupo con FIRST_VALUE y LAST_VALUE.',
      'Entiende el marco por defecto y cuándo cambiarlo.',
      'Distingue ROWS (filas) de RANGE (valores, como días).',
      'Saca el enésimo valor con NTH_VALUE.',
      'Mide la posición de cada fila en la distribución con CUME_DIST.',
      'Define una ventana una vez con WINDOW y úsala varias.',
    ],
  },

  docs: [
    {
      id: 'chuleta_marcos',
      title: 'Chuleta: marcos de ventana',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'window_frame_default' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma completa
\`función() OVER (PARTITION BY … ORDER BY … marco)\`

## El marco
| Marco | Filas que ve cada fila |
|---|---|
| (por defecto, con ORDER BY) | \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`: desde el principio hasta ella y sus empates |
| \`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\` | Ella y las 2 filas anteriores |
| \`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING\` | La anterior, ella y la siguiente |
| \`RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW\` | Las de los 6 días anteriores (por valor, aunque falten días) |
| \`ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING\` | Todas las del grupo |

## Valores
- \`FIRST_VALUE(x)\`, \`LAST_VALUE(x)\`, \`NTH_VALUE(x, n)\`: el primero, el último y el enésimo **del marco**.
- \`LAST_VALUE\` y \`NTH_VALUE\` con el marco por defecto se quedan en la fila actual: amplía el marco.

## Distribución
\`CUME_DIST()\`: fracción de filas con valor menor o igual (0–1). \`PERCENT_RANK()\`: (puesto − 1) / (filas − 1). Devuelven double: \`ROUND((100 * CUME_DIST() OVER …)::numeric, 1)\`.

## Ventana con nombre
\`… OVER w … WINDOW w AS (PARTITION BY … ORDER BY …)\`, después del WHERE/GROUP BY/HAVING y antes del ORDER BY.`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: true,
    runCost: 2,
    starter:
      "-- El primer y el último pago de la tarjeta 5, en cada fila\nSELECT id, pagado_en, importe,\n       FIRST_VALUE(importe) OVER w AS primer_importe,\n       LAST_VALUE(importe) OVER w AS ultimo_importe\nFROM pagos_tarjeta\nWHERE tarjeta_id = 5\nWINDOW w AS (ORDER BY pagado_en);",
    retos: [
      {
        id: 'primero_ultimo',
        from: 'ines',
        title: 'El primer y el último pago de la tarjeta 5',
        description: 'Pagos de la **tarjeta 5** (todos los estados): `id`, `pagado_en`, `importe`, `primer_importe` (el del primer pago de la tarjeta) y `ultimo_importe` (el del **último**), en todas las filas.',
        hint: '`FIRST_VALUE(importe)` y `LAST_VALUE(importe)` ordenando por `pagado_en` y con el marco completo: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT id, pagado_en, importe, FIRST_VALUE(importe) OVER w AS primer_importe, LAST_VALUE(importe) OVER w AS ultimo_importe FROM pagos_tarjeta WHERE tarjeta_id = 5 WINDOW w AS (ORDER BY pagado_en ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)',
        columns: ['id', 'pagado_en', 'importe', 'primer_importe', 'ultimo_importe'],
        requires: [VENTANA],
      },
      {
        id: 'ultimos_7_dias',
        from: 'marta',
        title: 'Lo aceptado en los últimos 7 días',
        description: 'Cada día de **febrero de 2026** con pagos **aceptados**: `dia`, `total` del día y `ultimos_7_dias` (lo aceptado ese día y los **6 días naturales anteriores**, aunque alguno no tenga pagos).',
        hint: "Un paso con el total por día y fuera `SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW)`. Con ROWS contarías 7 filas, no 7 días.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `${DIARIO_FEB} SELECT dia, total, SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW) AS ultimos_7_dias FROM d`,
        columns: ['dia', 'total', 'ultimos_7_dias'],
        requires: [VENTANA],
      },
      {
        id: 'segundo_mayor',
        from: 'carmen',
        title: 'El segundo pago más alto de cada comercio',
        description: 'Para cada comercio, con sus pagos **aceptados**: `comercio_id` y `segundo_importe`, el importe de su **segundo pago más alto**. Una fila por comercio.',
        hint: '`NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)` y `DISTINCT`, o numerar con `ROW_NUMBER` y quedarte con el 2.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT DISTINCT comercio_id, NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS segundo_importe FROM pagos_tarjeta WHERE estado = 'aceptado'",
        columns: ['comercio_id', 'segundo_importe'],
        requires: [VENTANA],
      },
      {
        id: 'percentil_saldo',
        from: 'nuria',
        title: 'En qué percentil está cada cliente',
        description: 'Cada cliente con cuentas: `cliente_id`, `saldo_total` (suma de sus cuentas) y `percentil`: el **porcentaje de clientes con un saldo total menor o igual** que el suyo, con 1 decimal.',
        hint: '`ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1)` sobre un paso con el saldo por cliente. CUME_DIST devuelve double: convierte antes de redondear.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'WITH s AS (SELECT cliente_id, SUM(saldo) AS saldo_total FROM cuentas GROUP BY cliente_id) SELECT cliente_id, saldo_total, ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1) AS percentil FROM s',
        columns: ['cliente_id', 'saldo_total', 'percentil'],
        requires: [VENTANA],
      },
      {
        id: 'pagos_viajes',
        from: 'diego',
        title: 'Los pagos de Viajes Horizonte frente a su media',
        description: 'Pagos del **comercio 20** (todos los estados): `id`, `importe`, `media_comercio` (redondeada a 2 decimales) y `maximo_comercio`, definiendo la ventana **una sola vez** con `WINDOW`.',
        hint: '`ROUND(AVG(importe) OVER w, 2) AS media_comercio, MAX(importe) OVER w AS maximo_comercio … WINDOW w AS (PARTITION BY comercio_id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT id, importe, ROUND(AVG(importe) OVER w, 2) AS media_comercio, MAX(importe) OVER w AS maximo_comercio FROM pagos_tarjeta WHERE comercio_id = 20 WINDOW w AS (PARTITION BY comercio_id)',
        columns: ['id', 'importe', 'media_comercio', 'maximo_comercio'],
        requires: [VENTANA, WINDOW_CON_NOMBRE],
      },
      {
        id: 'media_centrada',
        from: 'laura',
        title: 'La media centrada de cada mes',
        description: 'Total **aceptado** de cada mes: `mes` (primer día, como fecha), `total` y `media_centrada`: la media del mes anterior, el propio mes y el siguiente, con 2 decimales.',
        hint: '`ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2)` sobre un paso con el total por mes.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `${MENSUAL} SELECT mes, total, ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2) AS media_centrada FROM m`,
        columns: ['mes', 'total', 'media_centrada'],
        requires: [VENTANA],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La alerta semanal de producto mira siete pagos, no siete días', severity: 'medium', explanation: 'Sin el marco por días, la suma «semanal» abarcaba a veces dos semanas.', technique: 'RANGE con INTERVAL.', preventedBy: 'reto.ultimos_7_dias' },
    { id: 'C-CARMEN', title: 'El control de picos no compara con el segundo pago', severity: 'high', explanation: 'Carmen no vio que la tienda online tiene un pago de 3.373 € y el siguiente de 237 €.', technique: 'NTH_VALUE con el marco completo.', preventedBy: 'reto.segundo_mayor' },
    { id: 'C-NURIA', title: 'La oferta «top 10 %» se manda a quien no toca', severity: 'medium', explanation: 'Sin percentiles, Nuria eligió por un corte de saldo a ojo.', technique: 'CUME_DIST.', preventedBy: 'reto.percentil_saldo' },
    { id: 'C-DIEGO', title: 'Un informe repite la misma ventana cuatro veces y una sale distinta', severity: 'low', explanation: 'Al copiar la ventana, una se quedó sin el PARTITION BY.', technique: 'WINDOW con nombre.', preventedBy: 'reto.pagos_viajes' },
    { id: 'C-LAURA', title: 'La tendencia del panel va un mes por detrás', severity: 'low', explanation: 'La media solo miraba hacia atrás; Laura quería una centrada.', technique: 'ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING.', preventedBy: 'reto.media_centrada' },
    { id: 'C-ULTIMO', title: 'El «último pago» de cada tarjeta es siempre el de la propia fila', severity: 'medium', explanation: 'LAST_VALUE con el marco por defecto termina en la fila actual.', technique: 'Marco hasta UNBOUNDED FOLLOWING.', preventedBy: 'practice.last_value_frame' },
    { id: 'C-ROWS', title: 'La suma de 7 días cuenta 7 filas cuando faltan días', severity: 'high', explanation: 'ROWS cuenta filas; los días sin pagos no tienen fila.', technique: 'RANGE con un intervalo, o un calendario.', preventedBy: 'practice.range_days' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.ultimos_7_dias', label: 'Alerta de Marta', explanation: 'Siete días de verdad.' },
      { flag: 'reto.segundo_mayor', label: 'Control de Carmen', explanation: 'El segundo pago de cada comercio.' },
      { flag: 'reto.percentil_saldo', label: 'Oferta de Nuria', explanation: 'Percentil de cada cliente.' },
      { flag: 'reto.pagos_viajes', label: 'Informe de Diego', explanation: 'Una ventana con nombre.' },
      { flag: 'reto.media_centrada', label: 'Panel de Laura', explanation: 'Media centrada.' },
      { flag: 'practice.last_value_frame', label: 'Últimos de verdad', explanation: 'LAST_VALUE con el marco completo.' },
      { flag: 'practice.range_days', label: 'Días, no filas', explanation: 'RANGE con intervalo.' },
    ],
  },

  concepts: [
    { id: 'first_last_value', title: 'FIRST_VALUE y LAST_VALUE', summary: 'El primer y el último valor del marco de cada fila.' },
    { id: 'window_frame_default', title: 'El marco por defecto', summary: 'Con ORDER BY, del principio a la fila actual (y sus empates): LAST_VALUE se queda en ella.' },
    { id: 'rows_vs_range', title: 'ROWS o RANGE', summary: 'ROWS cuenta filas; RANGE mira valores (días, importes): con huecos dan cosas distintas.' },
    { id: 'nth_value', title: 'NTH_VALUE', summary: 'El enésimo valor del marco; necesita el marco completo para no depender de la fila.' },
    { id: 'cume_dist', title: 'CUME_DIST y PERCENT_RANK', summary: 'La posición de cada fila en la distribución, entre 0 y 1.' },
    { id: 'named_window', title: 'WINDOW con nombre', summary: 'La ventana se define una vez y se usa en varias funciones: menos copias, menos errores.' },
    { id: 'centered_frame', title: 'Marcos hacia delante', summary: 'FOLLOWING mira filas posteriores: medias centradas, siguiente valor.' },
  ],
  debriefConcepts: ['first_last_value', 'window_frame_default', 'rows_vs_range', 'nth_value', 'cume_dist', 'named_window', 'centered_frame'],
  seniorTips: [
    'Lee la chuleta de marcos en la wiki.',
    'Inés: FIRST_VALUE y LAST_VALUE con WINDOW w AS (ORDER BY pagado_en ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING).',
    "Marta: total por día de febrero y SUM(total) OVER (ORDER BY dia RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW).",
    'Carmen: NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) con DISTINCT.',
    'Nuria: ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1) sobre el saldo por cliente.',
    'Diego: AVG y MAX OVER w, con WINDOW w AS (PARTITION BY comercio_id), WHERE comercio_id = 20.',
    'Laura: ROUND(AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 2) sobre el total por mes.',
    'Con Inés: el marco por defecto acaba en la fila actual; y con huecos, RANGE, no ROWS.',
  ],

  lessons: [
    {
      id: 'first_last',
      question: '¿Cómo saco el primer y el último valor de un grupo en cada fila?',
      conceptId: 'first_last_value',
      cost: 5,
      body: `Con \`FIRST_VALUE\` y \`LAST_VALUE\`:

\`\`\`
SELECT id, importe,
       FIRST_VALUE(importe) OVER w AS primero,
       LAST_VALUE(importe)  OVER w AS ultimo
FROM pagos_tarjeta
WHERE tarjeta_id = 5
WINDOW w AS (ORDER BY pagado_en
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING);
\`\`\`

Devuelven el primer y el último valor **del marco** de cada fila. Sin el marco completo, el último no es el último del grupo.`,
    },
    {
      id: 'default',
      question: '¿Qué marco usa una ventana si no digo nada?',
      conceptId: 'window_frame_default',
      cost: 5,
      body: `- Sin \`ORDER BY\` en el OVER: todas las filas de la partición.
- Con \`ORDER BY\`: \`RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\`, del principio **hasta la fila actual** (y las que empatan con ella).

Por eso \`SUM() OVER (ORDER BY …)\` es un acumulado… y \`LAST_VALUE() OVER (ORDER BY …)\` devuelve el valor de la propia fila: el último de un marco que acaba en ella.`,
    },
    {
      id: 'rows_range',
      question: '¿ROWS o RANGE?',
      conceptId: 'rows_vs_range',
      cost: 5,
      body: `- \`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW\`: la fila y las **6 filas** anteriores.
- \`RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW\`: las filas cuyo valor del ORDER BY está en los **6 días** anteriores.

Si hay un dato por día sin huecos, dan lo mismo. Si faltan días, ROWS se va más atrás de una semana. Con RANGE y un intervalo, el ORDER BY tiene que ser una sola columna de fecha o número.`,
    },
    {
      id: 'nth',
      question: '¿Y el segundo valor más alto?',
      conceptId: 'nth_value',
      cost: 5,
      body: `\`NTH_VALUE(x, n)\` da el valor número n del marco:

\`\`\`
SELECT DISTINCT comercio_id,
       NTH_VALUE(importe, 2) OVER (PARTITION BY comercio_id ORDER BY importe DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS segundo
FROM pagos_tarjeta;
\`\`\`

Con el marco por defecto, en la primera fila de cada grupo da NULL (el marco solo tiene una fila). Alternativa: \`ROW_NUMBER()\` en un paso y quedarte con el 2.`,
    },
    {
      id: 'dist',
      question: '¿Cómo sé en qué percentil está cada fila?',
      conceptId: 'cume_dist',
      cost: 5,
      body: `- \`CUME_DIST()\`: fracción de filas con valor **menor o igual** (de 1/n a 1).
- \`PERCENT_RANK()\`: (puesto − 1) / (filas − 1), de 0 a 1.

\`\`\`
ROUND((100 * CUME_DIST() OVER (ORDER BY saldo_total))::numeric, 1) AS percentil
\`\`\`

Las dos devuelven \`double precision\`: \`ROUND(x, 1)\` solo acepta \`numeric\`, así que hay que convertir antes.`,
    },
    {
      id: 'named',
      question: '¿Puedo no repetir la misma ventana?',
      conceptId: 'named_window',
      cost: 5,
      body: `Sí, con \`WINDOW\`, después del \`WHERE\`/\`GROUP BY\`/\`HAVING\` y antes del \`ORDER BY\`:

\`\`\`
SELECT id, importe,
       AVG(importe) OVER w, MAX(importe) OVER w, COUNT(*) OVER w
FROM pagos_tarjeta
WINDOW w AS (PARTITION BY comercio_id);
\`\`\`

Se puede ampliar: \`OVER (w ORDER BY pagado_en)\` usa la partición de \`w\` y añade un orden. Una sola definición: si cambias la partición, cambian todas.`,
    },
    {
      id: 'centered',
      question: '¿Una ventana puede mirar hacia delante?',
      conceptId: 'centered_frame',
      cost: 5,
      body: `Sí, con \`FOLLOWING\`:

\`\`\`
AVG(total) OVER (ORDER BY mes ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING)
\`\`\`

Media del mes anterior, el actual y el siguiente: suaviza sin ir retrasada. En los extremos usa las filas que haya (el primer mes, dos; el último, dos).`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a1pre_last', conceptId: 'window_frame_default', question: '`LAST_VALUE(importe) OVER (ORDER BY pagado_en)` devuelve…', options: ['El último importe del grupo', 'El importe de la propia fila (o de su último empate)', 'NULL', 'El primero'], correct: 1, explanation: 'El marco por defecto acaba en la fila actual.' },
      { id: 'a1pre_first', conceptId: 'first_last_value', question: '`FIRST_VALUE(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en)` devuelve…', options: ['El primer pago de cada tarjeta', 'El primer pago de la tabla', 'El mayor', 'Error'], correct: 0, explanation: 'El primero del marco, que empieza al principio del grupo.' },
      { id: 'a1pre_rows', conceptId: 'rows_vs_range', question: 'Faltan dos días en tus datos diarios. ¿Qué abarca `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`?', options: ['Exactamente 7 días', 'Las 7 últimas filas, que cubren 9 días', 'Nada', '6 días'], correct: 1, explanation: 'ROWS cuenta filas, no días.' },
      { id: 'a1pre_nth', conceptId: 'nth_value', question: '¿Qué hace `NTH_VALUE(importe, 2)`?', options: ['Multiplica por 2', 'Devuelve el segundo valor del marco', 'Devuelve el segundo grupo', 'Divide en 2 grupos'], correct: 1, explanation: 'El enésimo del marco.' },
      { id: 'a1pre_dist', conceptId: 'cume_dist', question: '`CUME_DIST()` del cliente con más saldo de 40 es…', options: ['0', '1', '0,5', '40'], correct: 1, explanation: 'Todas las filas tienen un valor menor o igual.' },
      { id: 'a1pre_named', conceptId: 'named_window', question: '¿Dónde va la cláusula `WINDOW w AS (…)`?', options: ['Antes del FROM', 'Después del WHERE/GROUP BY/HAVING y antes del ORDER BY', 'Dentro del OVER', 'Al final, después del LIMIT'], correct: 1, explanation: 'Y después se usa con OVER w.' },
    ],
    post: [
      { id: 'a1post_last', conceptId: 'window_frame_default', question: 'Para que `LAST_VALUE` dé el último del grupo en todas las filas…', options: ['Quitar el ORDER BY de la consulta', 'ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING', 'Añadir DISTINCT', 'Usar MAX'], correct: 1, explanation: 'El marco tiene que llegar al final del grupo.' },
      { id: 'a1post_range', conceptId: 'rows_vs_range', question: 'Suma de los últimos 7 días naturales aunque falten días:', options: ['ROWS BETWEEN 6 PRECEDING AND CURRENT ROW', "RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW", 'LAG(total, 7)', 'SUM(total) OVER ()'], correct: 1, explanation: 'RANGE mira el valor de la fecha.' },
      { id: 'a1post_nth', conceptId: 'nth_value', question: 'Con el marco por defecto, `NTH_VALUE(importe, 2)` en la primera fila de cada grupo da…', options: ['El segundo importe', 'NULL', 'El primero', 'Error'], correct: 1, explanation: 'Su marco solo tiene una fila.' },
      { id: 'a1post_dist', conceptId: 'cume_dist', question: '`ROUND(100 * CUME_DIST() OVER (…), 1)` da error. ¿Por qué?', options: ['CUME_DIST no existe', 'Devuelve double y ROUND con decimales necesita numeric', 'Falta PARTITION BY', 'Hay que multiplicar por 100.0'], correct: 1, explanation: 'Convierte antes: (…)::numeric.' },
      { id: 'a1post_named', conceptId: 'named_window', question: '¿Qué ventaja tiene `WINDOW w AS (…)` si usas la misma ventana en cuatro columnas?', options: ['Ninguna', 'Se define una vez: no hay copias que se desincronicen', 'Es más rápida siempre', 'Permite usar la ventana en el WHERE'], correct: 1, explanation: 'Un solo sitio que cambiar.' },
      { id: 'a1post_centered', conceptId: 'centered_frame', question: '`ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` en el último mes usa…', options: ['3 filas', '2 filas: el anterior y él', '1 fila', 'Ninguna'], correct: 1, explanation: 'No hay siguiente: usa las que hay.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Lo que decide una ventana: el marco',
      body: 'Buenos días.\n\nEl mes pasado usaste ventanas para rankings y acumulados. Hoy vamos a lo que hay debajo: el **marco**, las filas que ve cada fila. Casi todos los errores con ventanas vienen de no saber qué marco se está usando.\n\nPara empezar, con los pagos de la **tarjeta 5** (todos los estados):\n\n- `id`, `pagado_en`, `importe`, `primer_importe` (el del primer pago de la tarjeta) y `ultimo_importe` (el del **último**), en todas las filas.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'first_last_value' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.primero_ultimo' },
      body: '27,35 € el primero y 29,95 € el último, en las doce filas. Fíjate en que has tenido que decirle a LAST_VALUE que mire hasta el final: sola no lo hace.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_semana',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Quiero una alerta que mire **lo aceptado en los últimos 7 días**. Para probarla con febrero de 2026: cada día con pagos aceptados, `dia`, `total` del día y `ultimos_7_dias` (ese día y los **6 días naturales anteriores**, tengan pagos o no).',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'rows_vs_range' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.ultimos_7_dias' },
      body: 'Diecinueve días y el pico del 15 se ve claro: más de 3.500 € en una semana. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_segundo',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para el control de picos quiero comparar el pago más alto de cada comercio con el **segundo más alto**: si hay mucha distancia, es sospechoso. De momento, `comercio_id` y `segundo_importe` de cada comercio, con sus pagos **aceptados**.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'nth_value' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.segundo_mayor' },
      body: 'La tienda online: 3.373 € el más alto y 237,55 € el segundo. Lo investigo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_ultimo',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «El último pago es… cada pago»',
      body: '**Inés:** Diego quería el último pago de cada tarjeta en cada fila:\n\n`SELECT id, importe, LAST_VALUE(importe) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) FROM pagos_tarjeta;`\n\nY en cada fila le sale su propio importe. ¿Qué pasa?',
      onDeliver: [{ kind: 'unlock', conceptId: 'window_frame_default' }],
      choices: [
        {
          id: 'frame',
          text: 'Con `ORDER BY` en el OVER, el marco por defecto va **del principio a la fila actual**: el último de ese marco es la propia fila. Hay que ampliar el marco: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. (O usar `FIRST_VALUE` ordenando al revés.)',
          cost: 10,
          reply: 'Exacto. Es el error más típico con ventanas: el marco por defecto está pensado para acumulados, no para «el último».',
          effects: [
            { kind: 'flag', key: 'practice.last_value_frame' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'LAST_VALUE y NTH_VALUE necesitan el marco completo.' },
          ],
        },
        {
          id: 'order',
          text: 'Que le falta un `ORDER BY pagado_en` al final de la consulta.',
          cost: 10,
          reply: 'El ORDER BY de la consulta solo ordena el resultado; el marco de la ventana sigue acabando en cada fila.',
          effects: [{ kind: 'note', tone: 'bad', text: 'El ORDER BY de la consulta no cambia el marco.' }],
        },
        {
          id: 'bug',
          text: 'Que LAST_VALUE funciona mal en PostgreSQL y es mejor no usarlo.',
          cost: 10,
          reply: 'Funciona exactamente como dice el estándar: el último del marco. El marco es lo que había que cambiar.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a la función de un marco mal elegido.' }],
        },
      ],
    },
    {
      id: 'nuria_percentil',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Vamos a llamar al **10 % de clientes con más saldo** para una oferta. Antes quiero ver a todos con su **percentil**: `cliente_id`, `saldo_total` y `percentil` (el porcentaje de clientes con un saldo total menor o igual que el suyo, con 1 decimal).',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'cume_dist' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.percentil_saldo' },
      body: 'Treinta y nueve clientes y los cuatro de arriba por encima del 90. Esos son los míos. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_ventana',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Para un informe de Viajes Horizonte (comercio 20) quiero cada pago (todos los estados) con la `media_comercio` (2 decimales) y el `maximo_comercio`: `id`, `importe`, `media_comercio` y `maximo_comercio`. Y Inés dice que la ventana se escriba **una sola vez**, con `WINDOW`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'named_window' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.pagos_viajes' },
      body: 'Trece pagos, media de 636,89 € y máximo de 1.075,49 €. Y si mañana cambio la partición, la cambio en un sitio. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_centrada',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. La media móvil del panel va siempre un poco por detrás de la realidad. Quiero una **media centrada**: de cada mes, la media del mes anterior, el propio mes y el siguiente. `mes` (primer día, como fecha), `total` aceptado y `media_centrada` con 2 decimales.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'centered_frame' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.media_centrada' },
      body: 'Catorce meses, y los extremos con dos meses cada uno. Ahora la curva no llega tarde. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_rows',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «¿Siete días o siete filas?»',
      body: '**Inés:** Marta había probado su alerta así:\n\n`SUM(total) OVER (ORDER BY dia ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)`\n\nY le sale distinto que a ti en 14 de los 19 días de febrero. ¿Cuál está bien?',
      onDeliver: [],
      choices: [
        {
          id: 'range',
          text: 'La tuya cuenta **7 filas**, no 7 días: en febrero hay nueve días sin pagos aceptados, que no tienen fila, así que las 7 filas anteriores se van más de una semana atrás. Para 7 días naturales hay que usar `RANGE BETWEEN INTERVAL \'6 days\' PRECEDING AND CURRENT ROW` (o rellenar el calendario con ceros y entonces sí, ROWS).',
          cost: 10,
          reply: 'Eso es. ROWS cuenta filas; RANGE mira el valor. Con datos que tienen huecos, la diferencia es justo la que quieres evitar.',
          effects: [
            { kind: 'flag', key: 'practice.range_days' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Con huecos en las fechas, RANGE con intervalo (o un calendario); ROWS cuenta filas.' },
          ],
        },
        {
          id: 'rows_ok',
          text: 'Que las dos están bien: es una cuestión de redondeo.',
          cost: 10,
          reply: 'No es redondeo: suman días distintos. En algunas fechas, la de ROWS mete pagos de hace diez días.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buenas dos sumas que miran periodos distintos.' }],
        },
        {
          id: 'seven',
          text: 'Que cambie el 6 por un 7 para compensar.',
          cost: 10,
          reply: 'Así serían 8 filas, que tampoco son 7 días. El problema no es el número, es que cuenta filas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Ajustar el número de filas no convierte filas en días.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy has trabajado los marcos de ventana. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que cada ventana tiene un marco y el de por defecto acaba en la fila actual, así que LAST_VALUE y NTH_VALUE necesitan el marco completo; que ROWS cuenta filas y RANGE valores; que se puede mirar hacia delante con FOLLOWING; que CUME_DIST da percentiles; y que con WINDOW defino la ventana una vez.',
          reply: 'Muy bien. Mañana, rachas, huecos y percentiles: los problemas de «islas».',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'maxmin',
          text: 'Que para el primero y el último es más fácil MIN y MAX.',
          reply: 'MIN y MAX dan el menor y el mayor, no el primero y el último en el tiempo. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con MIN y MAX, que no son primero y último.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
