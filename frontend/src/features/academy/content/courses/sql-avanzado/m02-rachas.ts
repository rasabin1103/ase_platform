import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const VENTANA = exige(/\bover\s*[(\w]/i, 'Este encargo se resuelve con funciones de ventana: `… OVER (…)`.')
const ORDENADO = exige(/\bwithin\s+group\b/i, 'Este encargo se resuelve con un agregado ordenado: `… WITHIN GROUP (ORDER BY …)`.')

/** Días distintos con login de cada cliente y el grupo de su racha (fecha − número de fila). */
const RACHAS = "WITH dias AS (SELECT DISTINCT cliente_id, ocurrido_en::date AS dia FROM eventos_app WHERE tipo = 'login'), g AS (SELECT cliente_id, dia, dia - (ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY dia))::int AS grupo FROM dias)"

/**
 * Curso 7: SQL avanzado · Misión 2 — Rachas y percentiles.
 *
 * Huecos e islas (rachas de días seguidos, periodos sin actividad, rachas de
 * un mismo estado), PERCENTILE_CONT y MODE. Trampas: calcular rachas sin
 * quitar antes los días repetidos y la media con valores extremos.
 */
export const m02Rachas: Mission = {
  ...COMUN,
  id: 'm02-rachas',
  number: 2,
  title: 'Rachas y percentiles',
  subtitle: 'Huecos e islas: rachas, periodos sin actividad, mediana, percentiles y moda.',
  dayLabel: 'Miércoles · mes 3',
  verdicts: {
    good: {
      title: 'Cada racha, con su principio y su fin',
      body: 'Marta tiene a sus clientes más constantes, Carmen la mediana que no engaña, Nuria las horas típicas, Diego las tarjetas dormidas y Laura las rachas de rechazos. Y nadie presentó una media inflada como «lo normal».',
    },
    ok: {
      title: 'Islas encontradas, a medias',
      body: 'Ya encuentras rachas y huecos, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Rachas contadas a ojo',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de huecos e islas a mano.',
    },
  },

  briefing: {
    title: 'Mes 3 · Rachas y percentiles',
    paragraphs: [
      'Hoy llega una tabla nueva a la réplica: `eventos_app`, lo que hacen los clientes en la app en enero y febrero de 2026. Y con ella, preguntas de «cuántos días seguidos» y «qué es lo normal».',
      'Los problemas de rachas y huecos se llaman de «huecos e islas» y tienen un truco con ventanas. Cada encargo se cumple cuando la consulta devuelve exactamente lo que se pide.',
    ],
    goals: [
      'Encuentra rachas de días seguidos con el truco de fecha − ROW_NUMBER.',
      'Quita los días repetidos antes de buscar rachas.',
      'Encuentra periodos sin actividad con LAG.',
      'Encuentra rachas de un mismo estado restando dos ROW_NUMBER.',
      'Calcula mediana y percentiles con PERCENTILE_CONT.',
      'Saca el valor más frecuente con MODE.',
    ],
  },

  docs: [
    {
      id: 'chuleta_islas',
      title: 'Chuleta: huecos, islas y percentiles',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'gaps_islands' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tabla nueva
\`eventos_app\`: id, cliente_id, tipo (\`login\`, \`transferencia\`, \`error\`, \`ajuste\`), ocurrido_en, datos (JSON). Enero y febrero de 2026.

## Rachas de días seguidos (islas)
\`\`\`
WITH dias AS (SELECT DISTINCT ocurrido_en::date AS dia FROM eventos_app WHERE …),
g AS (SELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo FROM dias)
SELECT MIN(dia) AS inicio, MAX(dia) AS fin, COUNT(*) AS dias FROM g GROUP BY grupo;
\`\`\`
En días seguidos, la fecha y el número de fila suben a la vez: la resta es constante y marca la racha. **Antes, DISTINCT**: un día repetido rompe la cuenta.

## Huecos
\`LAG(fecha) OVER (PARTITION BY … ORDER BY fecha)\` y \`fecha - anterior\`: los saltos grandes son los huecos.

## Rachas de un mismo estado
\`ROW_NUMBER() OVER (PARTITION BY x ORDER BY t) - ROW_NUMBER() OVER (PARTITION BY x, estado ORDER BY t)\` es constante dentro de cada racha de un mismo estado.

## Agregados ordenados
| Quiero | Uso |
|---|---|
| Mediana | \`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY x)\` |
| Percentil 90 | \`PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY x)\` |
| Un valor que exista | \`PERCENTILE_DISC(0.5) …\` |
| El más frecuente | \`MODE() WITHIN GROUP (ORDER BY x)\` |
\`PERCENTILE_CONT\` devuelve double: \`ROUND(… ::numeric, 2)\`.`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: true,
    runCost: 2,
    starter:
      "-- Días con login del cliente 7 y el grupo de su racha\nWITH dias AS (\n  SELECT DISTINCT ocurrido_en::date AS dia\n  FROM eventos_app\n  WHERE cliente_id = 7 AND tipo = 'login'\n)\nSELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo\nFROM dias;",
    retos: [
      {
        id: 'rachas_cliente7',
        from: 'ines',
        title: 'Las rachas del cliente 7',
        description: 'Las rachas de días seguidos con **login** del **cliente 7**: `inicio`, `fin` y `dias` de cada racha (también las de un solo día).',
        hint: 'Días distintos con login, `dia - ROW_NUMBER() OVER (ORDER BY dia)` como grupo y después `MIN`, `MAX` y `COUNT(*)` por grupo.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "WITH dias AS (SELECT DISTINCT ocurrido_en::date AS dia FROM eventos_app WHERE cliente_id = 7 AND tipo = 'login'), g AS (SELECT dia, dia - (ROW_NUMBER() OVER (ORDER BY dia))::int AS grupo FROM dias) SELECT MIN(dia) AS inicio, MAX(dia) AS fin, COUNT(*) AS dias FROM g GROUP BY grupo",
        columns: ['inicio', 'fin', 'dias'],
        requires: [VENTANA],
      },
      {
        id: 'rachas_largas',
        from: 'marta',
        title: 'Los clientes más constantes',
        description: '`cliente_id` y `racha_maxima` (su racha más larga de días seguidos con login) de los clientes cuya racha más larga es de **10 días o más**.',
        hint: 'El mismo truco con `PARTITION BY cliente_id`; después la longitud de cada racha y, por cliente, la mayor con `HAVING MAX(n) >= 10`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `${RACHAS}, r AS (SELECT cliente_id, COUNT(*) AS n FROM g GROUP BY cliente_id, grupo) SELECT cliente_id, MAX(n) AS racha_maxima FROM r GROUP BY cliente_id HAVING MAX(n) >= 10`,
        columns: ['cliente_id', 'racha_maxima'],
        requires: [VENTANA],
      },
      {
        id: 'mediana_estado',
        from: 'carmen',
        title: 'Media, mediana y percentil 90 por estado',
        description: 'Por `estado` de pago con tarjeta: `media`, `mediana` y `p90` (percentil 90) del importe, las tres con 2 decimales.',
        hint: '`ROUND(AVG(importe), 2)`, `ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)::numeric, 2)` y lo mismo con 0.9, con `GROUP BY estado`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT estado, ROUND(AVG(importe), 2) AS media, ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)::numeric, 2) AS mediana, ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe)::numeric, 2) AS p90 FROM pagos_tarjeta GROUP BY estado',
        columns: ['estado', 'media', 'mediana', 'p90'],
        requires: [ORDENADO],
      },
      {
        id: 'hora_tipica',
        from: 'nuria',
        title: 'La hora típica de cada categoría',
        description: 'Por `categoria` de comercio (sin la que no tiene): `hora_tipica`, la hora del día (0–23) en la que **más pagos** hay (todos los estados). Si empatan, la más temprana.',
        hint: '`MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en))` con `GROUP BY c.categoria`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT c.categoria, MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en)) AS hora_tipica FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id WHERE c.categoria IS NOT NULL GROUP BY c.categoria',
        columns: ['categoria', 'hora_tipica'],
        requires: [ORDENADO],
      },
      {
        id: 'periodos_inactivos',
        from: 'diego',
        title: 'Tarjetas que se durmieron',
        description: 'Los huecos de **más de 120 días** entre dos pagos seguidos de una misma tarjeta: `tarjeta_id`, `desde` y `hasta` (fechas de los dos pagos) y `dias` entre ellos.',
        hint: '`LAG(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en)` en un paso; fuera, `pagado_en::date - anterior::date > 120`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'WITH p AS (SELECT tarjeta_id, pagado_en, LAG(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS anterior FROM pagos_tarjeta) SELECT tarjeta_id, anterior::date AS desde, pagado_en::date AS hasta, pagado_en::date - anterior::date AS dias FROM p WHERE pagado_en::date - anterior::date > 120',
        columns: ['tarjeta_id', 'desde', 'hasta', 'dias'],
        requires: [VENTANA],
      },
      {
        id: 'rachas_rechazo',
        from: 'laura',
        title: 'Rachas de rechazos seguidos',
        description: 'Las rachas de **3 o más pagos rechazados seguidos** de una misma tarjeta (por orden de `pagado_en`, desempatando por `id`): `tarjeta_id`, `inicio`, `fin` (fecha y hora del primer y el último rechazo) y `rechazos`.',
        hint: '`ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) - ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id)` es constante en cada racha de un mismo estado. Agrupa por tarjeta y ese grupo, solo los rechazados, `HAVING COUNT(*) >= 3`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "WITH p AS (SELECT tarjeta_id, pagado_en, estado, ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id) - ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id) AS grupo FROM pagos_tarjeta) SELECT tarjeta_id, MIN(pagado_en) AS inicio, MAX(pagado_en) AS fin, COUNT(*) AS rechazos FROM p WHERE estado = 'rechazado' GROUP BY tarjeta_id, grupo HAVING COUNT(*) >= 3",
        columns: ['tarjeta_id', 'inicio', 'fin', 'rechazos'],
        requires: [VENTANA],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El premio a la constancia se lo lleva quien más entra, no quien entra seguido', severity: 'medium', explanation: 'Marta premió por número de logins, sin rachas.', technique: 'Huecos e islas por cliente y MAX de las rachas.', preventedBy: 'reto.rachas_largas' },
    { id: 'C-CARMEN', title: 'El límite de «pago normal» se fija con la media', severity: 'high', explanation: 'La media de 121,85 € la inflan tres pagos enormes; la mediana es 37,85 €.', technique: 'PERCENTILE_CONT.', preventedBy: 'reto.mediana_estado' },
    { id: 'C-NURIA', title: 'El turno de refuerzo se pone a la hora equivocada', severity: 'low', explanation: 'Nuria no tuvo la hora más frecuente de cada categoría.', technique: 'MODE() WITHIN GROUP.', preventedBy: 'reto.hora_tipica' },
    { id: 'C-DIEGO', title: 'La alerta de tarjeta dormida no salta nunca', severity: 'medium', explanation: 'Diego no tuvo los huecos largos para probarla.', technique: 'LAG y diferencia de fechas.', preventedBy: 'reto.periodos_inactivos' },
    { id: 'C-LAURA', title: 'Nadie ve que la tarjeta 12 encadena rechazos', severity: 'high', explanation: 'Laura no tuvo las rachas de rechazos.', technique: 'Diferencia de dos ROW_NUMBER.', preventedBy: 'reto.rachas_rechazo' },
    { id: 'C-REPETIDOS', title: 'El informe de rachas parte las rachas en trozos', severity: 'medium', explanation: 'Con varios eventos el mismo día, la resta deja de ser constante.', technique: 'DISTINCT de los días antes de numerar.', preventedBy: 'practice.distinct_days' },
    { id: 'C-MEDIA', title: 'Se presenta la media como «lo que paga un cliente normal»', severity: 'medium', explanation: 'Con valores extremos, la media no representa a casi nadie.', technique: 'Mediana y percentiles.', preventedBy: 'practice.median' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.rachas_largas', label: 'Premio de Marta', explanation: 'Rachas de 10 días o más.' },
      { flag: 'reto.mediana_estado', label: 'Límite de Carmen', explanation: 'Mediana y percentil 90.' },
      { flag: 'reto.hora_tipica', label: 'Turnos de Nuria', explanation: 'La hora típica de cada categoría.' },
      { flag: 'reto.periodos_inactivos', label: 'Alerta de Diego', explanation: 'Huecos de más de 120 días.' },
      { flag: 'reto.rachas_rechazo', label: 'Rechazos de Laura', explanation: 'Rachas de 3 o más.' },
      { flag: 'practice.distinct_days', label: 'Rachas enteras', explanation: 'DISTINCT antes de numerar.' },
      { flag: 'practice.median', label: 'Lo normal, de verdad', explanation: 'Mediana, no media.' },
    ],
  },

  concepts: [
    { id: 'gaps_islands', title: 'Huecos e islas', summary: 'En una secuencia sin huecos, valor − número de fila es constante: marca cada racha.' },
    { id: 'distinct_first', title: 'Primero, valores distintos', summary: 'Un valor repetido rompe la resta: DISTINCT antes de numerar.' },
    { id: 'gaps_lag', title: 'Huecos con LAG', summary: 'La diferencia con el valor anterior encuentra los saltos.' },
    { id: 'runs_by_state', title: 'Rachas de un mismo estado', summary: 'ROW_NUMBER general menos ROW_NUMBER por estado: constante en cada racha.' },
    { id: 'percentiles', title: 'Mediana y percentiles', summary: 'PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY x): interpola; PERCENTILE_DISC devuelve un valor que existe.' },
    { id: 'mode_agg', title: 'MODE', summary: 'El valor más frecuente; con empates, el primero según el ORDER BY.' },
    { id: 'mean_vs_median', title: 'Media o mediana', summary: 'Con valores extremos, la media se va; la mediana describe lo típico.' },
  ],
  debriefConcepts: ['gaps_islands', 'distinct_first', 'gaps_lag', 'runs_by_state', 'percentiles', 'mode_agg', 'mean_vs_median'],
  seniorTips: [
    'Lee la chuleta de huecos e islas en la wiki.',
    'Inés: días distintos con login del 7, dia - ROW_NUMBER() OVER (ORDER BY dia) como grupo, MIN, MAX y COUNT por grupo.',
    'Marta: lo mismo con PARTITION BY cliente_id, la longitud de cada racha y MAX(n) >= 10 por cliente.',
    'Carmen: ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe)::numeric, 2) y 0.9, por estado.',
    'Nuria: MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM pagado_en)) por categoría.',
    'Diego: LAG(pagado_en) por tarjeta y pagado_en::date - anterior::date > 120.',
    'Laura: ROW_NUMBER por tarjeta menos ROW_NUMBER por tarjeta y estado, solo rechazados, HAVING COUNT(*) >= 3.',
    'Con Inés: DISTINCT antes de buscar rachas; y para «lo normal», la mediana.',
  ],

  lessons: [
    {
      id: 'islands',
      question: '¿Cómo encuentro rachas de días seguidos?',
      conceptId: 'gaps_islands',
      cost: 5,
      body: `Numera los días en orden y réstale el número a la fecha:

| dia | n | dia − n |
|---|---|---|
| 1 feb | 1 | 31 ene |
| 2 feb | 2 | 31 ene |
| 3 feb | 3 | 31 ene |
| 5 feb | 4 | 1 feb |

Mientras los días son seguidos, la resta no cambia: es el «grupo» de la racha. Después, \`GROUP BY grupo\` con \`MIN(dia)\`, \`MAX(dia)\` y \`COUNT(*)\`. En PostgreSQL, fecha − entero da otra fecha: \`dia - (ROW_NUMBER() OVER (ORDER BY dia))::int\`.`,
    },
    {
      id: 'distinct',
      question: '¿Por qué hay que quitar los días repetidos?',
      conceptId: 'distinct_first',
      cost: 5,
      body: `Si un día tiene dos eventos, ese día ocupa dos números de fila pero la fecha solo avanza una vez: la resta cambia y la racha se parte en dos.

Primero, un paso con \`SELECT DISTINCT ocurrido_en::date AS dia\` (y \`cliente_id\` si hay varios); después, el truco. Comprueba siempre con un caso conocido: si un cliente entró 21 días seguidos, su racha tiene que dar 21.`,
    },
    {
      id: 'gaps',
      question: '¿Y los huecos, los periodos sin actividad?',
      conceptId: 'gaps_lag',
      cost: 5,
      body: `Con \`LAG\`, compara cada fila con la anterior del mismo grupo:

\`\`\`
WITH p AS (
  SELECT tarjeta_id, pagado_en,
         LAG(pagado_en) OVER (PARTITION BY tarjeta_id ORDER BY pagado_en) AS anterior
  FROM pagos_tarjeta
)
SELECT tarjeta_id, anterior::date, pagado_en::date, pagado_en::date - anterior::date AS dias
FROM p WHERE pagado_en::date - anterior::date > 120;
\`\`\`

Restar dos \`date\` da un número de días.`,
    },
    {
      id: 'runs',
      question: '¿Y rachas de un mismo estado, como rechazos seguidos?',
      conceptId: 'runs_by_state',
      cost: 5,
      body: `Dos numeraciones: una de todas las filas y otra solo de las del mismo estado. Dentro de una racha, las dos avanzan a la vez y su diferencia es constante:

\`\`\`
ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en, id)
- ROW_NUMBER() OVER (PARTITION BY tarjeta_id, estado ORDER BY pagado_en, id) AS grupo
\`\`\`

Después, \`GROUP BY tarjeta_id, estado, grupo\`. Desempata el orden (\`, id\`) para que el resultado no dependa de la suerte.`,
    },
    {
      id: 'percentile',
      question: '¿Cómo calculo la mediana?',
      conceptId: 'percentiles',
      cost: 5,
      body: `Con un agregado ordenado:

\`\`\`
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY importe) AS mediana,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe) AS p90
FROM pagos_tarjeta;
\`\`\`

- \`PERCENTILE_CONT\` interpola entre los dos valores centrales; devuelve double (\`ROUND(…::numeric, 2)\`).
- \`PERCENTILE_DISC\` devuelve un valor que existe en los datos.

Funcionan con \`GROUP BY\` como cualquier agregado.`,
    },
    {
      id: 'mode',
      question: '¿Y el valor más frecuente?',
      conceptId: 'mode_agg',
      cost: 5,
      body: `\`MODE() WITHIN GROUP (ORDER BY x)\` devuelve el valor que más se repite:

\`\`\`
SELECT c.categoria,
       MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM p.pagado_en)) AS hora_tipica
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
GROUP BY c.categoria;
\`\`\`

Si hay empate, el primero según el \`ORDER BY\`: \`ORDER BY x DESC\` daría el mayor de los empatados.`,
    },
    {
      id: 'median',
      question: '¿Media o mediana?',
      conceptId: 'mean_vs_median',
      cost: 5,
      body: `La media suma todo y divide: tres pagos de casi 3.000 € entre 271 la suben mucho. La mediana es el valor del medio: la mitad paga menos y la mitad más.

Para describir «lo normal» con datos sesgados (importes, tiempos de respuesta, saldos), mediana y percentiles. La media sigue siendo útil para totales: media × número = suma.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a2pre_islands', conceptId: 'gaps_islands', question: 'En días seguidos, ¿qué pasa con `dia - ROW_NUMBER() OVER (ORDER BY dia)`?', options: ['Sube de uno en uno', 'Es constante', 'Es cero', 'Es NULL'], correct: 1, explanation: 'Fecha y número avanzan a la vez.' },
      { id: 'a2pre_distinct', conceptId: 'distinct_first', question: 'Un cliente tiene dos eventos el mismo día. Si numeras eventos y no días…', options: ['No pasa nada', 'La racha se parte', 'Da error', 'La racha se alarga'], correct: 1, explanation: 'El número avanza dos veces y la fecha una.' },
      { id: 'a2pre_gaps', conceptId: 'gaps_lag', question: '¿Qué da `fecha - LAG(fecha) OVER (ORDER BY fecha)` en la primera fila?', options: ['0', 'NULL', 'La fecha', 'Error'], correct: 1, explanation: 'No hay anterior.' },
      { id: 'a2pre_pct', conceptId: 'percentiles', question: '¿Cómo se calcula la mediana en PostgreSQL?', options: ['MEDIAN(x)', 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY x)', 'AVG(x)', 'MODE(x)'], correct: 1, explanation: 'No hay MEDIAN: es el percentil 50.' },
      { id: 'a2pre_mode', conceptId: 'mode_agg', question: '¿Qué devuelve `MODE() WITHIN GROUP (ORDER BY x)`?', options: ['La media', 'El valor más frecuente', 'El máximo', 'El número de valores'], correct: 1, explanation: 'La moda.' },
      { id: 'a2pre_median', conceptId: 'mean_vs_median', question: 'Importes: 10, 12, 14, 3.000. ¿Qué describe mejor «lo típico»?', options: ['La media (759)', 'La mediana (13)', 'El máximo', 'La suma'], correct: 1, explanation: 'Un valor extremo arrastra la media.' },
    ],
    post: [
      { id: 'a2post_islands', conceptId: 'gaps_islands', question: 'Ya tienes el grupo de cada día. ¿Cómo sacas el principio, el fin y la longitud de cada racha?', options: ['ORDER BY grupo', 'GROUP BY grupo con MIN, MAX y COUNT', 'DISTINCT grupo', 'LAG(grupo)'], correct: 1, explanation: 'Cada grupo es una racha.' },
      { id: 'a2post_distinct', conceptId: 'distinct_first', question: 'Diego dice que la mejor racha del cliente 7 es de 12 días y tú tienes 21. Él numeró todos los eventos. ¿Quién tiene razón?', options: ['Diego', 'Tú: hay que numerar días distintos', 'Los dos', 'Ninguno'], correct: 1, explanation: 'Los días con más de un evento rompen su cuenta.' },
      { id: 'a2post_runs', conceptId: 'runs_by_state', question: 'Para encontrar rachas de rechazos seguidos…', options: ['COUNT(*) FILTER', 'ROW_NUMBER por tarjeta menos ROW_NUMBER por tarjeta y estado', 'LAG(estado)', 'MODE()'], correct: 1, explanation: 'La diferencia es constante en cada racha.' },
      { id: 'a2post_pct', conceptId: 'percentiles', question: '`ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY importe), 2)` da error. ¿Por qué?', options: ['0.9 no es válido', 'Devuelve double y ROUND con decimales necesita numeric', 'Falta GROUP BY', 'Hay que usar PERCENTILE_DISC'], correct: 1, explanation: 'Convierte antes: ::numeric.' },
      { id: 'a2post_mode', conceptId: 'mode_agg', question: 'Dos horas empatan como las más frecuentes. `MODE() WITHIN GROUP (ORDER BY hora)` devuelve…', options: ['Las dos', 'La más temprana', 'NULL', 'Error'], correct: 1, explanation: 'La primera según el ORDER BY.' },
      { id: 'a2post_median', conceptId: 'mean_vs_median', question: 'Solo 54 de 271 pagos superan la media. ¿Qué te dice?', options: ['Que hay pocos pagos', 'Que unos pocos importes muy altos inflan la media', 'Que la media está mal calculada', 'Nada'], correct: 1, explanation: 'Con sesgo, la mediana describe mejor lo típico.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Días seguidos: huecos e islas',
      body: 'Buenos días.\n\nHa llegado a la réplica **`eventos_app`**: lo que hacen los clientes en la app en enero y febrero (logins, transferencias, errores…). Producto quiere saber cuántos días **seguidos** entra cada cliente, y eso es un problema clásico de **huecos e islas**: las rachas son islas de días seguidos separadas por huecos.\n\nPara empezar:\n\n- Las rachas de días seguidos con **login** del **cliente 7**: `inicio`, `fin` y `dias` de cada racha, también las de un solo día.\n\nPista: en días seguidos, la fecha y el número de fila suben a la vez.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'gaps_islands' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.rachas_cliente7' },
      body: 'Diez rachas, y una de 21 días: del 1 al 21 de febrero sin fallar ni uno. La resta fecha − número es constante en cada isla: ese es todo el truco.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_constancia',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Queremos premiar la **constancia**, no solo a quien más entra. Quiero los clientes cuya racha más larga de días seguidos con login es de **10 días o más**: `cliente_id` y `racha_maxima`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.rachas_largas' },
      body: 'Siete clientes, y el 29 con 23 días seguidos. ¡Ese es nuestro fan número uno!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_mediana',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para fijar qué es un **pago normal** quiero, por `estado` de pago con tarjeta: la `media`, la `mediana` y el percentil 90 (`p90`) del importe, con 2 decimales.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'percentiles' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.mediana_estado' },
      body: 'Media de 121,85 € y mediana de 37,85 € en los aceptados. Si llego a fijar el límite con la media… Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_repetidos',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «¿12 días o 21?»',
      body: '**Inés:** Diego ha calculado las rachas del cliente 7 así:\n\n`SELECT ocurrido_en::date AS dia, ocurrido_en::date - (ROW_NUMBER() OVER (ORDER BY ocurrido_en))::int AS grupo FROM eventos_app WHERE cliente_id = 7`\n\nY dice que su mejor racha es de 12 días, en fechas que no cuadran con las tuyas. ¿Qué ha pasado?',
      onDeliver: [{ kind: 'unlock', conceptId: 'distinct_first' }],
      choices: [
        {
          id: 'distinct',
          text: 'Ha numerado **eventos**, no días: los días en los que el cliente también hizo una transferencia tienen dos filas, el número avanza dos veces y la fecha una, así que la resta cambia y la racha se parte. Primero hay que sacar los **días distintos** con login (`SELECT DISTINCT ocurrido_en::date … WHERE tipo = \'login\'`) y después numerar.',
          cost: 10,
          reply: 'Exacto. El truco de las islas solo funciona con valores sin repetir. Y contrastar con un caso que conoces (21 días de febrero) lo destapa enseguida.',
          effects: [
            { kind: 'flag', key: 'practice.distinct_days' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Primero valores distintos (DISTINCT), después el truco de las islas.' },
          ],
        },
        {
          id: 'dense',
          text: 'Que use `RANK()` en vez de `ROW_NUMBER()`.',
          cost: 10,
          reply: 'RANK da el mismo número a los empates del mismo instante, pero no a dos eventos del mismo día a horas distintas. Sigue partiendo rachas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiar la función de numeración no quita los días repetidos.' }],
        },
        {
          id: 'both',
          text: 'Que las dos versiones son válidas: depende de cómo se cuente.',
          cost: 10,
          reply: 'Una racha de días es una racha de días. La suya da fechas que no existen como rachas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una racha partida por eventos repetidos.' }],
        },
      ],
    },
    {
      id: 'nuria_hora',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Para organizar los turnos de refuerzo quiero saber a qué **hora** se concentran los pagos de cada categoría: por `categoria` (sin la que no tiene), la `hora_tipica` (0–23) en la que más pagos hay, todos los estados. Si empatan, la más temprana.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'mode_agg' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.hora_tipica' },
      body: 'Ocho categorías: restauración a las 6 y compras y viajes a las 18. Ya sé dónde poner a la gente. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_dormidas',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Para probar la alerta de «tarjeta dormida» quiero los **huecos de más de 120 días** entre dos pagos seguidos de una misma tarjeta: `tarjeta_id`, `desde`, `hasta` (las fechas de los dos pagos) y `dias`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'gaps_lag' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.periodos_inactivos' },
      body: 'Diez huecos, y la tarjeta 1 con 234 días sin un pago. Con esto la alerta tiene casos de sobra. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_rechazos',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Quiero detectar tarjetas que encadenan rechazos: las rachas de **3 o más pagos rechazados seguidos** de una misma tarjeta (por orden de `pagado_en`, y por `id` si empatan): `tarjeta_id`, `inicio`, `fin` y `rechazos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'runs_by_state' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.rachas_rechazo' },
      body: 'Dos rachas, las dos de la tarjeta 12: una de 3 y otra de 5. Es la bloqueada, cuadra. Lo convierto en un test de regresión. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_media',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «El cliente medio paga 121 €»',
      body: '**Inés:** Marta va a poner en la presentación de producto que «un pago normal con tarjeta es de unos 121 €», la media de los aceptados. Solo 54 de los 271 pagos aceptados superan esa cifra. ¿Qué le recomiendas?',
      onDeliver: [{ kind: 'unlock', conceptId: 'mean_vs_median' }],
      choices: [
        {
          id: 'median',
          text: 'Que no use la media para «lo normal»: unos pocos pagos enormes (3.373 €, 3.082 €, 2.791 €) la inflan, y por eso solo el 20 % la supera. La **mediana** (37,85 €) dice lo que paga un cliente típico; y si quiere dar idea del rango, el percentil 90.',
          cost: 10,
          reply: 'Eso es. Con datos sesgados, mediana y percentiles. La media sirve para totales, no para describir al cliente típico.',
          effects: [
            { kind: 'flag', key: 'practice.median' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'communication', add: 1 },
            { kind: 'note', tone: 'good', text: 'Para describir lo típico con valores extremos, mediana y percentiles.' },
          ],
        },
        {
          id: 'remove',
          text: 'Que quite los tres pagos grandes y vuelva a calcular la media.',
          cost: 10,
          reply: 'Esos pagos existen. Quitar datos a mano para que la media quede bonita es elegir el resultado. La mediana no necesita ese recorte.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste quitar datos reales en vez de usar la medida adecuada.' }],
        },
        {
          id: 'ok',
          text: 'Que la media es la media: está bien calculada.',
          cost: 10,
          reply: 'Está bien calculada, pero no describe a casi nadie: el 80 % paga menos.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una media que no representa lo típico.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy has buscado rachas y huecos. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que las rachas salen restando el número de fila a la fecha, pero solo con valores distintos; que los huecos salen con LAG; que las rachas de un estado salen restando dos numeraciones; y que para lo típico uso la mediana y los percentiles, y MODE para lo más frecuente.',
          reply: 'Muy bien. Mañana, totales y subtotales en una sola consulta.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'loop',
          text: 'Que las rachas es más fácil calcularlas con un bucle en una hoja de cálculo.',
          reply: 'Con cuarenta clientes, quizá. Con cuarenta mil, no. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con calcular rachas fuera de la base de datos.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
