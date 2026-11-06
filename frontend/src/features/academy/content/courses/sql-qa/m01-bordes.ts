import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

const FEBRERO = "pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'"

/**
 * Curso 8: SQL para QA · Misión 1 — Los bordes.
 *
 * Los casos que rompen consultas que «funcionan»: rangos de fechas con
 * timestamp, NULL en los recuentos, filas repetidas por un JOIN, textos que
 * solo cambian en mayúsculas o espacios, redondeos y divisiones. Trampas:
 * BETWEEN con fechas y un JOIN que multiplica los importes.
 */
export const m01Bordes: Mission = {
  ...COMUN,
  id: 'm01-bordes',
  number: 1,
  title: 'Los bordes',
  subtitle: 'Fechas con hora, NULL, filas repetidas, textos casi iguales, redondeos y divisiones.',
  dayLabel: 'Martes · mes 4',
  verdicts: {
    good: {
      title: 'Ningún borde se te escapa',
      body: 'Febrero con su día 28 entero, los clientes sin segmento, totales sin multiplicar, emails repetidos aunque cambien las mayúsculas, comisiones redondeadas como manda el contrato y porcentajes que no salen a cero. Y nadie te coló un BETWEEN.',
    },
    ok: {
      title: 'Bordes a medias',
      body: 'Ya buscas los casos límite, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Los bordes llegaron a producción',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de casos límite a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Los bordes',
    paragraphs: [
      'Martes. Los informes de Kobalto «funcionan» con los datos de siempre. Hoy toca probarlos donde se rompen: el último día del mes, los valores vacíos, los repetidos, los textos casi iguales y los decimales.',
      'Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas, con el caso límite bien resuelto.',
    ],
    goals: [
      'Filtra un mes entero cuando la columna tiene hora.',
      'Cuenta los vacíos sin confundir COUNT(*) con COUNT(columna).',
      'Suma sin que un JOIN repita filas.',
      'Encuentra textos repetidos que solo cambian en mayúsculas o espacios.',
      'Redondea donde dice la regla, no donde es más cómodo.',
      'Divide sin división entera y sin dividir entre cero.',
    ],
  },

  docs: [
    {
      id: 'chuleta_bordes',
      title: 'Chuleta: los bordes',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'casos_borde' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Dónde se rompen las consultas
| Borde | Mal | Bien |
|---|---|---|
| Un mes con timestamp | \`BETWEEN '2026-02-01' AND '2026-02-28'\` | \`>= '2026-02-01' AND < '2026-03-01'\` |
| Vacíos | \`COUNT(segmento)\` (no cuenta NULL) | \`COUNT(*) - COUNT(segmento)\` |
| Repetidos por un JOIN | \`JOIN incidencias\` y \`SUM\` | \`WHERE EXISTS (…)\` |
| Textos casi iguales | \`GROUP BY email\` | \`GROUP BY lower(trim(email))\` |
| Redondeo | \`ROUND(SUM(x), 2)\` si la regla es por línea | \`SUM(ROUND(x, 2))\` |
| División | \`a / b\` con enteros (da 0) | \`100.0 * a / NULLIF(b, 0)\` |

## Tablas de hoy
- \`pagos_tarjeta\`: 52 pagos en febrero de 2026, dos de ellos el 28 por la tarde.
- \`altas_web\`: altas de clientes desde la web (\`email\` tal como lo escribieron).
- \`incidencias\`: algunos clientes tienen varias.
- \`tarjetas\`: la 33 es nueva y no tiene pagos.`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- ¿Cuántos pagos hubo en febrero? Mira bien el último día\nSELECT id, pagado_en, estado\nFROM pagos_tarjeta\nWHERE pagado_en >= '2026-02-27'\nORDER BY pagado_en;",
    retos: [
      {
        id: 'pagos_febrero',
        from: 'laura',
        title: 'Los pagos de febrero, el 28 incluido',
        description: 'Cuántos pagos con tarjeta (de cualquier estado) hubo en **febrero de 2026**, contando el **día 28 entero**: una columna `pagos`.',
        hint: "`WHERE pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `SELECT COUNT(*) AS pagos FROM pagos_tarjeta WHERE ${FEBRERO}`,
        columns: ['pagos'],
      },
      {
        id: 'sin_segmento',
        from: 'marta',
        title: 'Clientes sin segmento por ciudad',
        description: 'Por `ciudad`: el número de `clientes` y cuántos están **sin segmento** (`sin_segmento`, segmento vacío). Todas las ciudades, aunque tengan 0.',
        hint: '`COUNT(*) AS clientes, COUNT(*) - COUNT(segmento) AS sin_segmento` (o `COUNT(*) FILTER (WHERE segmento IS NULL)`).',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT ciudad, COUNT(*) AS clientes, COUNT(*) - COUNT(segmento) AS sin_segmento FROM clientes GROUP BY ciudad',
        columns: ['ciudad', 'clientes', 'sin_segmento'],
      },
      {
        id: 'total_con_incidencias',
        from: 'carmen',
        title: 'Lo que pagan los clientes con incidencias',
        description: 'El importe **total** de los pagos **aceptados** de los clientes que tienen **alguna incidencia** (abierta o cerrada): una columna `total`. Cada pago cuenta una sola vez.',
        hint: 'Pagos → tarjetas → cuentas y `WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = a.cliente_id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT SUM(p.importe) AS total FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id WHERE p.estado = 'aceptado' AND EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = a.cliente_id)",
        columns: ['total'],
      },
      {
        id: 'altas_repetidas',
        from: 'nuria',
        title: 'Altas repetidas con el mismo email',
        description: 'Los emails de `altas_web` que se repiten **sin contar mayúsculas ni espacios** al principio o al final: `email_normalizado` (en minúsculas y sin espacios) y `altas`. Solo los que aparecen más de una vez.',
        hint: '`lower(trim(email)) AS email_normalizado`, `GROUP BY` esa expresión y `HAVING COUNT(*) > 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT lower(trim(email)) AS email_normalizado, COUNT(*) AS altas FROM altas_web GROUP BY lower(trim(email)) HAVING COUNT(*) > 1',
        columns: ['email_normalizado', 'altas'],
      },
      {
        id: 'comision_por_comercio',
        from: 'diego',
        title: 'La comisión de cada comercio, redondeada por pago',
        description: 'Kobalto cobra a cada comercio un **1,5 %** de cada pago **aceptado**, **redondeado a céntimos en cada pago**. Por comercio: `comercio_id` y `comision` (la suma de las comisiones de sus pagos).',
        hint: '`SUM(ROUND(importe * 0.015, 2))`: primero se redondea cada pago y luego se suma.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT comercio_id, SUM(ROUND(importe * 0.015, 2)) AS comision FROM pagos_tarjeta WHERE estado = 'aceptado' GROUP BY comercio_id",
        columns: ['comercio_id', 'comision'],
      },
      {
        id: 'rechazo_por_tarjeta',
        from: 'ines',
        title: 'El porcentaje de rechazos de cada tarjeta',
        description: 'Para **todas** las tarjetas (también las que no tienen pagos): `tarjeta_id`, `pagos` y `pct_rechazo` (porcentaje de pagos **rechazados**, con 1 decimal). Sin pagos, el porcentaje queda **vacío**.',
        hint: '`LEFT JOIN pagos_tarjeta` y `ROUND(100.0 * COUNT(p.id) FILTER (WHERE p.estado = \'rechazado\') / NULLIF(COUNT(p.id), 0), 1)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT t.id AS tarjeta_id, COUNT(p.id) AS pagos, ROUND(100.0 * COUNT(p.id) FILTER (WHERE p.estado = 'rechazado') / NULLIF(COUNT(p.id), 0), 1) AS pct_rechazo FROM tarjetas t LEFT JOIN pagos_tarjeta p ON p.tarjeta_id = t.id GROUP BY t.id",
        columns: ['tarjeta_id', 'pagos', 'pct_rechazo'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Marketing escribe a clientes «sin segmento» que sí lo tienen', severity: 'low', explanation: 'COUNT(segmento) cuenta los que tienen, no los que faltan.', technique: 'COUNT(*) − COUNT(columna).', preventedBy: 'reto.sin_segmento' },
    { id: 'C-CARMEN', title: 'Riesgos ve un volumen de pagos inflado en clientes con incidencias', severity: 'medium', explanation: 'El JOIN con incidencias repite los pagos de quien tiene varias.', technique: 'EXISTS en vez de JOIN.', preventedBy: 'reto.total_con_incidencias' },
    { id: 'C-NURIA', title: 'Un mismo cliente tiene tres fichas y no le llegan los avisos', severity: 'medium', explanation: 'Los repetidos solo cambiaban en mayúsculas y espacios.', technique: 'lower(trim(email)).', preventedBy: 'reto.altas_repetidas' },
    { id: 'C-DIEGO', title: 'Las facturas de comisiones no cuadran con el contrato por céntimos', severity: 'medium', explanation: 'Se redondeó el total en vez de cada pago.', technique: 'SUM(ROUND(…)) cuando la regla es por línea.', preventedBy: 'reto.comision_por_comercio' },
    { id: 'C-INES', title: 'El panel de fraude muestra 0 % de rechazos en todas las tarjetas', severity: 'high', explanation: 'División entera: 2 / 12 = 0.', technique: '100.0 * … / NULLIF(…, 0).', preventedBy: 'reto.rechazo_por_tarjeta' },
    { id: 'C-BETWEEN', title: 'El cierre de febrero deja fuera los pagos del 28 por la tarde', severity: 'high', explanation: "BETWEEN … AND '2026-02-28' corta a las 00:00 del 28.", technique: '>= primer día AND < primer día del mes siguiente.', preventedBy: 'practice.rango_fechas' },
    { id: 'C-JOIN', title: 'Un informe de pagos por cliente suma más de lo que se cobró', severity: 'medium', explanation: 'Un JOIN a una tabla con varias filas por cliente multiplicó los importes.', technique: 'Comprobar la cardinalidad antes de sumar; EXISTS o agregar antes.', preventedBy: 'practice.fan_out' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los bordes del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.sin_segmento', label: 'Segmentos de Marta', explanation: 'Los vacíos bien contados.' },
      { flag: 'reto.total_con_incidencias', label: 'Volumen de Carmen', explanation: 'Cada pago una vez.' },
      { flag: 'reto.altas_repetidas', label: 'Fichas de Nuria', explanation: 'Emails normalizados.' },
      { flag: 'reto.comision_por_comercio', label: 'Comisiones de Diego', explanation: 'Redondeo por pago.' },
      { flag: 'reto.rechazo_por_tarjeta', label: 'Panel de Inés', explanation: 'Sin división entera.' },
      { flag: 'practice.rango_fechas', label: 'El último día', explanation: 'Rangos semiabiertos.' },
      { flag: 'practice.fan_out', label: 'JOIN que multiplica', explanation: 'Cardinalidad antes de sumar.' },
    ],
  },

  concepts: [
    { id: 'casos_borde', title: 'Casos borde', summary: 'Los valores en los límites (último día, cero, vacío, repetido) son donde fallan las consultas.' },
    { id: 'rango_fechas', title: 'Rangos de fechas con hora', summary: '>= inicio AND < inicio del siguiente periodo; BETWEEN con una fecha corta a las 00:00.' },
    { id: 'count_null', title: 'COUNT y NULL', summary: 'COUNT(*) cuenta filas; COUNT(columna), solo las que no son NULL.' },
    { id: 'fan_out', title: 'Filas multiplicadas por un JOIN', summary: 'Unir con una tabla que tiene varias filas por clave repite las de la otra; SUM y COUNT se inflan.' },
    { id: 'normalizar', title: 'Normalizar textos', summary: 'lower(trim(…)) para comparar textos que solo cambian en mayúsculas o espacios.' },
    { id: 'redondeo', title: 'Dónde redondear', summary: 'SUM(ROUND(x)) y ROUND(SUM(x)) dan resultados distintos: manda la regla de negocio.' },
    { id: 'division', title: 'Divisiones seguras', summary: 'Entero / entero trunca; 100.0 * a / NULLIF(b, 0) evita el cero y la división entre cero.' },
  ],
  debriefConcepts: ['casos_borde', 'rango_fechas', 'count_null', 'fan_out', 'normalizar', 'redondeo', 'division'],
  seniorTips: [
    'Lee la chuleta de los bordes en la wiki.',
    "Laura: COUNT(*) con pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'.",
    'Marta: COUNT(*) AS clientes y COUNT(*) − COUNT(segmento) AS sin_segmento.',
    "Carmen: SUM de pagos aceptados con WHERE EXISTS en incidencias, sin JOIN.",
    'Nuria: lower(trim(email)), GROUP BY y HAVING COUNT(*) > 1.',
    'Diego: SUM(ROUND(importe * 0.015, 2)) por comercio_id.',
    "Inés: LEFT JOIN, 100.0 * … / NULLIF(COUNT(p.id), 0) y ROUND(…, 1).",
    'Con Laura: rangos semiabiertos para las fechas y cuidado con los JOIN que multiplican.',
  ],

  lessons: [
    {
      id: 'casos_borde',
      question: '¿Qué son los casos borde y por qué los busca QA?',
      conceptId: 'casos_borde',
      cost: 5,
      body: `Los valores en los **límites**: el primer y el último día, el cero, el vacío, el repetido, el máximo. Las consultas suelen probarse con datos «normales» y fallan justo ahí.

Para cada consulta, pregúntate:

- ¿Qué pasa el **último día** del periodo, a última hora?
- ¿Y si la columna está **vacía** (NULL)?
- ¿Y si hay **varias filas** donde espero una?
- ¿Y si el texto cambia solo en **mayúsculas o espacios**?
- ¿Y si el divisor es **cero**?`,
    },
    {
      id: 'rango_fechas',
      question: '¿Por qué BETWEEN falla con fechas?',
      conceptId: 'rango_fechas',
      cost: 5,
      body: `\`pagado_en\` tiene **hora**. \`BETWEEN '2026-02-01' AND '2026-02-28'\` compara con \`2026-02-28 00:00:00\`: un pago del 28 a las 18:20 queda fuera.

La forma segura es un **rango semiabierto**:

\`\`\`
WHERE pagado_en >= '2026-02-01'
  AND pagado_en <  '2026-03-01'
\`\`\`

Funciona igual con fechas sin hora, con meses de 28, 30 o 31 días y con años bisiestos.`,
    },
    {
      id: 'count_null',
      question: '¿Qué diferencia hay entre COUNT(*) y COUNT(columna)?',
      conceptId: 'count_null',
      cost: 5,
      body: `- \`COUNT(*)\`: cuenta **filas**.
- \`COUNT(segmento)\`: cuenta las filas cuyo segmento **no es NULL**.

Así que los que **faltan** son \`COUNT(*) - COUNT(segmento)\`, o \`COUNT(*) FILTER (WHERE segmento IS NULL)\`.

Lo mismo pasa con \`AVG\`, \`SUM\` o \`MAX\`: **ignoran** los NULL. Una media «sin los vacíos» puede no ser la que pide el negocio.`,
    },
    {
      id: 'fan_out',
      question: '¿Cómo puede un JOIN inflar una suma?',
      conceptId: 'fan_out',
      cost: 5,
      body: `Si unes los pagos de un cliente con sus incidencias y tiene **dos** incidencias, **cada pago sale dos veces**. El \`SUM\` lo cuenta dos veces.

Antes de sumar, pregúntate cuántas filas hay **por clave** en cada tabla. Si solo necesitas saber si existe:

\`\`\`
WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = a.cliente_id)
\`\`\`

Y si necesitas datos de las dos tablas, agrega cada una antes de unirlas.`,
    },
    {
      id: 'normalizar',
      question: '¿Cómo encuentro textos que son el mismo aunque no lo parezcan?',
      conceptId: 'normalizar',
      cost: 5,
      body: `«ana.garcia@mail.com», « Ana.Garcia@mail.com» y «ANA.GARCIA@MAIL.COM » son el mismo email. Para compararlos, **normaliza**:

\`\`\`
SELECT lower(trim(email)) AS email_normalizado, COUNT(*)
FROM altas_web
GROUP BY lower(trim(email))
HAVING COUNT(*) > 1;
\`\`\`

\`trim\` quita los espacios de los extremos; \`lower\`, las mayúsculas. Para acentos hace falta más (\`unaccent\`), pero empieza por aquí.`,
    },
    {
      id: 'redondeo',
      question: '¿Redondeo cada línea o el total?',
      conceptId: 'redondeo',
      cost: 5,
      body: `No es lo mismo:

- \`SUM(ROUND(importe * 0.015, 2))\`: redondea **cada pago** y suma.
- \`ROUND(SUM(importe) * 0.015, 2)\`: suma y redondea **una vez**.

Pueden diferir en uno o varios céntimos. Ninguna es «la correcta» en general: manda la **regla de negocio** (aquí, el contrato dice «por pago»). El caso de prueba es justo un comercio donde las dos difieran.`,
    },
    {
      id: 'division',
      question: '¿Por qué un porcentaje me sale 0?',
      conceptId: 'division',
      cost: 5,
      body: `\`COUNT\` devuelve enteros, y **entero / entero** en PostgreSQL trunca: \`2 / 12 = 0\`.

\`\`\`
ROUND(100.0 * rechazados / NULLIF(pagos, 0), 1)
\`\`\`

- \`100.0\` convierte la operación a decimal.
- \`NULLIF(pagos, 0)\` devuelve NULL si no hay pagos: el resultado queda vacío en vez de dar «division by zero».

La tarjeta 33, nueva y sin pagos, es justo el caso que lo prueba.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q1pre_between', conceptId: 'rango_fechas', question: "`pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`. ¿Entra un pago del 28 a las 18:20?", options: ['Sí', 'No', 'Solo si es aceptado', 'Depende del índice'], correct: 1, explanation: 'El límite es el 28 a las 00:00.' },
      { id: 'q1pre_count', conceptId: 'count_null', question: '¿Qué cuenta `COUNT(segmento)`?', options: ['Todas las filas', 'Las filas con segmento no vacío', 'Las filas con segmento vacío', 'Los segmentos distintos'], correct: 1, explanation: 'COUNT(columna) ignora los NULL.' },
      { id: 'q1pre_fan', conceptId: 'fan_out', question: 'Un cliente con 2 incidencias tiene 5 pagos. ¿Cuántas filas da `pagos JOIN incidencias`?', options: ['5', '10', '7', '2'], correct: 1, explanation: 'Cada pago por cada incidencia.' },
      { id: 'q1pre_norm', conceptId: 'normalizar', question: '¿Cómo comparas emails sin mayúsculas ni espacios de más?', options: ['email = email', 'lower(trim(email))', 'email LIKE email', 'upper(email)'], correct: 1, explanation: 'trim quita los espacios de los extremos.' },
      { id: 'q1pre_div', conceptId: 'division', question: '¿Cuánto da `2 / 12` en PostgreSQL con enteros?', options: ['0.1666', '0', '0.17', 'Error'], correct: 1, explanation: 'División entera.' },
      { id: 'q1pre_borde', conceptId: 'casos_borde', question: '¿Dónde suele fallar una consulta que «funciona»?', options: ['Con los datos normales', 'En los límites: último día, vacíos, ceros, repetidos', 'Nunca', 'Solo con muchos datos'], correct: 1, explanation: 'Ahí es donde hay que probar.' },
    ],
    post: [
      { id: 'q1post_rango', conceptId: 'rango_fechas', question: '¿Cuál es el filtro seguro para «febrero de 2026»?', options: ["BETWEEN '2026-02-01' AND '2026-02-28'", "pagado_en >= '2026-02-01' AND pagado_en < '2026-03-01'", "EXTRACT(MONTH FROM pagado_en) = 2", "pagado_en LIKE '2026-02%'"], correct: 1, explanation: 'Semiabierto y sin funciones sobre la columna.' },
      { id: 'q1post_null', conceptId: 'count_null', question: '`AVG(comision)` con dos filas: 10 y NULL. ¿Cuánto da?', options: ['5', '10', 'NULL', 'Error'], correct: 1, explanation: 'AVG ignora los NULL.' },
      { id: 'q1post_exists', conceptId: 'fan_out', question: 'Quieres el total de pagos de los clientes con alguna incidencia. ¿Qué usas?', options: ['JOIN incidencias', 'WHERE EXISTS (SELECT 1 FROM incidencias …)', 'CROSS JOIN', 'UNION'], correct: 1, explanation: 'EXISTS no repite filas.' },
      { id: 'q1post_round', conceptId: 'redondeo', question: 'El contrato dice «1,5 % de cada pago, redondeado a céntimos». ¿Qué calculas?', options: ['ROUND(SUM(importe) * 0.015, 2)', 'SUM(ROUND(importe * 0.015, 2))', 'SUM(importe) * 0.015', 'ROUND(AVG(importe), 2)'], correct: 1, explanation: 'Redondeo por línea.' },
      { id: 'q1post_nullif', conceptId: 'division', question: '¿Qué hace `NULLIF(pagos, 0)`?', options: ['Pone 0 si es NULL', 'Devuelve NULL si pagos es 0', 'Borra las filas con 0', 'Nada'], correct: 1, explanation: 'Así no se divide entre cero.' },
      { id: 'q1post_norm', conceptId: 'normalizar', question: '« Ana@mail.com» y «ana@mail.com ». ¿Las agrupa `GROUP BY email`?', options: ['Sí', 'No: hace falta lower(trim(email))', 'Solo con DISTINCT', 'Solo con ORDER BY'], correct: 1, explanation: 'Son textos distintos para PostgreSQL.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Donde se rompen las consultas',
      body: 'Buenos días.\n\nAyer viste que la app puede mentir. Hoy toca otra cosa: las consultas que «funcionan» con los datos de siempre y fallan en los **bordes**. El último día del mes, los vacíos, los repetidos, los decimales.\n\nEmpezamos por el cierre de mes:\n\n- Cuántos pagos con tarjeta (de cualquier estado) hubo en **febrero de 2026**, con el **día 28 entero**: una columna `pagos`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'casos_borde' }, { kind: 'unlock', conceptId: 'rango_fechas' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.pagos_febrero' },
      body: '52. Con BETWEEN hasta el 28 salen 48: se pierden los cuatro pagos del 28, porque el límite es el 28 a las 00:00. Ese es el borde.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_segmentos',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Vamos a lanzar una campaña para clientes **sin segmento**. Por `ciudad`, quiero el número de `clientes` y cuántos están sin segmento (`sin_segmento`). Todas las ciudades, aunque tengan cero.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'count_null' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.sin_segmento' },
      body: 'Dos en total, uno en Madrid y otro en Barcelona. El borrador que me pasaron decía 11 y 7: estaba contando los que **sí** tienen. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_volumen',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Necesito el importe **total** de los pagos **aceptados** de los clientes que tienen **alguna incidencia** (abierta o cerrada). Una columna `total`. Ojo: hay clientes con varias incidencias y cada pago tiene que contar **una sola vez**.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'fan_out' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.total_con_incidencias' },
      body: '24.253,47 €. El informe que tenía decía 25.874,11: el cliente 3 tiene tres incidencias y sus pagos salían tres veces. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_between',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «el cierre cuadra con el banco»',
      body: "**Laura:** El informe de cierre de febrero que hizo Rubén usa `WHERE pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`. Dice que lo ha probado con los datos de enero y que cuadraba. ¿Lo das por bueno?",
      onDeliver: [],
      choices: [
        {
          id: 'rango',
          text: "No. `pagado_en` tiene hora y BETWEEN corta en el **28 a las 00:00**: los pagos del 28 por la tarde no entran. Con enero cuadraba porque no había pagos el último día después de medianoche. El filtro tiene que ser `>= '2026-02-01' AND < '2026-03-01'`, y la prueba, con pagos el último día a última hora.",
          cost: 10,
          reply: 'Exacto. Y fíjate en la segunda parte: la prueba de Rubén no tenía el caso que lo rompe. Un buen caso de prueba vive en el borde.',
          effects: [
            { kind: 'flag', key: 'practice.rango_fechas' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Rangos semiabiertos, y casos de prueba en el último instante del periodo.' },
          ],
        },
        {
          id: 'ok',
          text: 'Sí: si con enero cuadraba, con febrero también.',
          cost: 10,
          reply: 'Con febrero se pierden cuatro pagos del día 28. Que una prueba pase no dice nada si no tiene el caso difícil.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una prueba sin el caso borde.' }],
        },
        {
          id: 'mes',
          text: "Que mejor use `EXTRACT(MONTH FROM pagado_en) = 2`.",
          cost: 10,
          reply: 'Eso cogería febrero de todos los años, y además impide usar el índice de la fecha. El rango semiabierto es más seguro.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiaste un borde por otro problema.' }],
        },
      ],
    },
    {
      id: 'nuria_altas',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Hay clientes que se dan de alta varias veces en la web y luego no les llegan los avisos. ¿Me sacas los emails de `altas_web` que se repiten **sin contar mayúsculas ni espacios**? `email_normalizado` (en minúsculas y sin espacios) y `altas`, solo los repetidos.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'normalizar' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.altas_repetidas' },
      body: 'Ana tres veces, Lucía dos y Elena dos. Con un GROUP BY normal solo salía Elena. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_comisiones',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Estoy probando la facturación a comercios. El contrato dice: **1,5 % de cada pago aceptado, redondeado a céntimos en cada pago**. Por comercio, `comercio_id` y `comision`. Quiero compararlo con lo que calcula el backend.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'redondeo' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.comision_por_comercio' },
      body: 'En 14 comercios mi backend se va de un céntimo: redondeaba el total, no cada pago. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_rechazos',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. El panel de fraude dice **0 %** de rechazos en todas las tarjetas, y no me lo creo. Para **todas** las tarjetas (la 33 es nueva y no tiene pagos): `tarjeta_id`, `pagos` y `pct_rechazo` con 1 decimal. Sin pagos, el porcentaje vacío.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'division' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.rechazo_por_tarjeta' },
      body: 'La 12 con un 76,9 %, y la 33 sin dato en vez de un error. El panel dividía enteros. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_join',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «el total está bien, lo he comprobado»',
      body: '**Laura:** Para lo de Carmen, Rubén había hecho `… JOIN incidencias i ON i.cliente_id = a.cliente_id …` y dice que lo comprobó: «el cliente 5 tiene una incidencia y su total cuadra». ¿Qué le falta a esa comprobación?',
      onDeliver: [],
      choices: [
        {
          id: 'cardinalidad',
          text: 'Que la ha probado con un cliente que tiene **una** incidencia, donde el JOIN no repite nada. Con un cliente con **varias** (el 3 tiene tres), cada pago sale varias veces y el total se infla. Hay que pensar cuántas filas hay por cliente en cada tabla, y usar EXISTS o agregar antes de unir.',
          cost: 10,
          reply: 'Eso es. Igual que con las fechas: el caso fácil pasa siempre. El de varias filas por clave es el que destapa el error.',
          effects: [
            { kind: 'flag', key: 'practice.fan_out' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Prueba los JOIN con claves que tengan varias filas.' },
          ],
        },
        {
          id: 'distinct',
          text: 'Que le falta un `SUM(DISTINCT p.importe)`.',
          cost: 10,
          reply: 'Y dos pagos distintos del mismo importe contarían como uno. DISTINCT tapa un problema con otro.',
          effects: [{ kind: 'note', tone: 'bad', text: 'SUM(DISTINCT) no arregla un JOIN que multiplica.' }],
        },
        {
          id: 'ok',
          text: 'Nada: si con el cliente 5 cuadra, con los demás también.',
          cost: 10,
          reply: 'Con el cliente 3 no cuadra: sus pagos salen tres veces.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Generalizaste desde un caso fácil.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Seis bordes, seis defectos. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que las consultas se rompen en los límites: el último día con hora (rango semiabierto), los NULL en los recuentos, los JOIN que multiplican filas, los textos casi iguales, dónde se redondea y las divisiones enteras o entre cero. Y que una prueba sin el caso difícil no prueba nada.',
          reply: 'Muy bien. Mañana fabricamos esos casos difíciles: datos de prueba.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'normal',
          text: 'Que si una consulta funciona con datos normales, está bien.',
          reply: 'Hoy todas funcionaban con datos normales. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con probar solo con datos normales.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
