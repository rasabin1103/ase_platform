import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN, exige } from './shared'

const ULTIMO = 'SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en DESC'
const PASOS = 'SELECT orden_id, LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde, estado AS hasta FROM ordenes_historial'

/**
 * Curso 8: SQL para QA · Misión 7 — Estados y transiciones.
 *
 * Órdenes de pago con su historial de estados y la tabla de transiciones
 * válidas. Defectos: la 4 vuelve a pendiente después de completada, la 7 salta
 * pendiente, la 10 repite pendiente, la 11 dice rechazada y su historial
 * completada, la 16 lleva días pendiente, la 20 no empieza en creada y la 21
 * no tiene historial. Trampas: LAG sin PARTITION BY y now() en vez de una
 * fecha de referencia fija.
 */
export const m07Estados: Mission = {
  ...COMUN,
  id: 'm07-estados',
  number: 7,
  title: 'Estados y transiciones',
  subtitle: 'El historial de cada orden contra su estado actual y contra las transiciones permitidas.',
  dayLabel: 'Miércoles · mes 4, semana 2',
  verdicts: {
    good: {
      title: 'Cada orden, por donde debía',
      body: 'Encontraste las órdenes cuyo estado no es el de su historial, los saltos prohibidos, la orden atascada desde hace días, la que no empieza en creada, la que no tiene historial y las que tardan más de una hora. Y con LAG bien particionado y una fecha de referencia fija.',
    },
    ok: {
      title: 'Estados revisados a medias',
      body: 'Ya pruebas estados con SQL, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Las órdenes siguen a su aire',
      body: 'Varios encargos se quedaron sin hacer y los saltos de estado siguen ahí. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Estados y transiciones',
    paragraphs: [
      'Miércoles. Las órdenes de pago pasan por estados: creada, pendiente y, al final, completada, rechazada o cancelada. Cada cambio queda en `ordenes_historial`, y `transiciones_validas` dice qué pasos están permitidos.',
      'La foto de datos de pruebas es del **2 de marzo de 2026 a las 12:00**. Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Saca el último estado de cada orden de su historial.',
      'Reconstruye cada paso con LAG, orden por orden.',
      'Compara los pasos con la tabla de transiciones válidas.',
      'Encuentra órdenes atascadas con una fecha de referencia fija.',
      'Encuentra órdenes sin historial o que no empiezan donde deben.',
      'Mide cuánto tarda cada orden de un estado a otro.',
    ],
  },

  docs: [
    {
      id: 'chuleta_estados',
      title: 'Órdenes de pago: estados y transiciones',
      updatedLabel: 'Diego Ruiz · Backend',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'ultimo_estado' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas
- \`ordenes(id, cliente_id, importe, estado, creada_en)\`: el **estado actual**.
- \`ordenes_historial(id, orden_id, estado, cambiado_en)\`: **cada** cambio de estado, con su hora.
- \`transiciones_validas(desde, hasta)\`: los pasos permitidos.

## Reglas
1. Toda orden empieza en **creada** y tiene historial.
2. Cada paso del historial está en \`transiciones_validas\`.
3. El estado de \`ordenes\` es el **último** de su historial.
4. Una orden no debe seguir **pendiente** más de **48 horas**.
5. De creada a su estado final, como mucho **60 minutos**.

## Fecha de referencia
Los datos de pruebas son una foto del **2026-03-02 12:00**. Úsala como «ahora»: \`now()\` es la fecha del día en que ejecutas.`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- El historial de una orden\nSELECT *\nFROM ordenes_historial\nWHERE orden_id = 4\nORDER BY cambiado_en;',
    retos: [
      {
        id: 'estado_distinto',
        from: 'laura',
        title: 'Órdenes cuyo estado no es el de su historial',
        description: 'De las órdenes con historial, las que tienen en `ordenes` un estado **distinto** del **último** de su historial: `id`, `estado` y `ultimo`.',
        hint: '`SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en DESC` te da el último; únelo a `ordenes` y compara.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `SELECT o.id, o.estado, u.estado AS ultimo FROM ordenes o JOIN (${ULTIMO}) u ON u.orden_id = o.id WHERE u.estado <> o.estado`,
        columns: ['id', 'estado', 'ultimo'],
      },
      {
        id: 'transiciones_invalidas',
        from: 'marta',
        title: 'Pasos que no están permitidos',
        description: 'Cada paso del historial (de un estado al **siguiente** de la misma orden, por hora) que **no** está en `transiciones_validas`: `orden_id`, `desde` y `hasta`.',
        hint: '`LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde` y `NOT EXISTS (SELECT 1 FROM transiciones_validas v WHERE v.desde = t.desde AND v.hasta = t.hasta)`, sin la primera fila de cada orden.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `SELECT orden_id, desde, hasta FROM (${PASOS}) t WHERE desde IS NOT NULL AND NOT EXISTS (SELECT 1 FROM transiciones_validas v WHERE v.desde = t.desde AND v.hasta = t.hasta)`,
        columns: ['orden_id', 'desde', 'hasta'],
        requires: [exige(/\bpartition\s+by\b/i, 'Cada orden tiene su propio historial: `LAG(…) OVER (PARTITION BY orden_id ORDER BY cambiado_en)`.')],
      },
      {
        id: 'atascadas',
        from: 'carmen',
        title: 'Órdenes atascadas en pendiente',
        description: 'Las órdenes que **siguen pendientes** y cuyo último cambio fue hace **más de 48 horas** respecto a la fecha de referencia (**2026-03-02 12:00**): `id` y `pendiente_desde`.',
        hint: "`WHERE o.estado = 'pendiente'`, `GROUP BY o.id` y `HAVING MAX(h.cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT o.id, MAX(h.cambiado_en) AS pendiente_desde FROM ordenes o JOIN ordenes_historial h ON h.orden_id = o.id WHERE o.estado = 'pendiente' GROUP BY o.id HAVING MAX(h.cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours'",
        columns: ['id', 'pendiente_desde'],
        forbid: [exige(/\b(now\s*\(|current_date|current_timestamp|localtimestamp)/i, 'Con `now()` el resultado depende del día en que ejecutas. Usa la fecha de referencia: `TIMESTAMP \'2026-03-02 12:00\'`.')],
      },
      {
        id: 'sin_creada',
        from: 'nuria',
        title: 'Órdenes que no empiezan en creada',
        description: 'Las órdenes cuyo **primer** estado del historial (por hora) **no** es `creada`: `orden_id` y `estado` (el primero que tienen).',
        hint: "`SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en` y fuera las que empiezan en `'creada'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT orden_id, estado FROM (SELECT DISTINCT ON (orden_id) orden_id, estado FROM ordenes_historial ORDER BY orden_id, cambiado_en) f WHERE estado <> 'creada'",
        columns: ['orden_id', 'estado'],
      },
      {
        id: 'sin_historial',
        from: 'diego',
        title: 'Órdenes sin historial',
        description: 'Las órdenes que **no tienen ni una fila** en `ordenes_historial`: `id` y `estado`.',
        hint: '`FROM ordenes o WHERE NOT EXISTS (SELECT 1 FROM ordenes_historial h WHERE h.orden_id = o.id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT o.id, o.estado FROM ordenes o WHERE NOT EXISTS (SELECT 1 FROM ordenes_historial h WHERE h.orden_id = o.id)',
        columns: ['id', 'estado'],
      },
      {
        id: 'lentas',
        from: 'ines',
        title: 'Órdenes que tardan más de una hora',
        description: 'Las órdenes que tardan **más de 60 minutos** desde `creada` hasta su estado final (`completada`, `rechazada` o `cancelada`), según el historial: `orden_id` y `minutos`.',
        hint: "`MIN(cambiado_en) FILTER (WHERE estado = 'creada')`, `MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada'))`, la resta en un `HAVING … > INTERVAL '60 minutes'` y `EXTRACT(EPOCH FROM …) / 60` para los minutos.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT orden_id, EXTRACT(EPOCH FROM MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada')) - MIN(cambiado_en) FILTER (WHERE estado = 'creada')) / 60 AS minutos FROM ordenes_historial GROUP BY orden_id HAVING MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada')) - MIN(cambiado_en) FILTER (WHERE estado = 'creada') > INTERVAL '60 minutes'",
        columns: ['orden_id', 'minutos'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Una orden completada vuelve a pendiente y se cobra dos veces', severity: 'high', explanation: 'Nadie comprobó los pasos del historial contra las transiciones permitidas.', technique: 'LAG por orden + NOT EXISTS en transiciones_validas.', preventedBy: 'reto.transiciones_invalidas' },
    { id: 'C-CARMEN', title: 'Un cliente espera una semana una orden pendiente', severity: 'medium', explanation: 'Nadie buscaba órdenes atascadas.', technique: 'Pendientes con su último cambio antes de la fecha de referencia − 48 h.', preventedBy: 'reto.atascadas' },
    { id: 'C-NURIA', title: 'Atención no puede explicar de dónde sale una orden', severity: 'low', explanation: 'Su historial empieza en pendiente: falta el alta.', technique: 'El primer estado de cada historial.', preventedBy: 'reto.sin_creada' },
    { id: 'C-DIEGO', title: 'Una orden completada no deja rastro', severity: 'medium', explanation: 'Se cambió el estado sin escribir en el historial.', technique: 'NOT EXISTS: órdenes sin una sola fila de historial.', preventedBy: 'reto.sin_historial' },
    { id: 'C-INES', title: 'El acuerdo de servicio se incumple sin que nadie lo sepa', severity: 'medium', explanation: 'Siete órdenes tardaron más de una hora y nadie lo medía.', technique: 'Duración entre estados con FILTER.', preventedBy: 'reto.lentas' },
    { id: 'C-LAG', title: 'La prueba de transiciones da 25 fallos que no existen', severity: 'medium', explanation: 'LAG sin PARTITION BY compara el último estado de una orden con el primero de la siguiente.', technique: 'PARTITION BY la entidad cuyo historial recorres.', preventedBy: 'practice.particion' },
    { id: 'C-AHORA', title: 'La prueba de atascos cambia de resultado cada día', severity: 'medium', explanation: 'Usaba now() sobre una foto de datos fija: hoy todas las pendientes parecen atascadas.', technique: 'Fecha de referencia fija en las pruebas.', preventedBy: 'practice.referencia' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las órdenes de pago.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.transiciones_invalidas', label: 'Cobros de Marta', explanation: 'Solo pasos permitidos.' },
      { flag: 'reto.atascadas', label: 'Clientes de Carmen', explanation: 'Ninguna orden atascada.' },
      { flag: 'reto.sin_creada', label: 'Altas de Nuria', explanation: 'Todas empiezan en creada.' },
      { flag: 'reto.sin_historial', label: 'Rastro de Diego', explanation: 'Todas con historial.' },
      { flag: 'reto.lentas', label: 'Tiempos de Inés', explanation: 'Duraciones medidas.' },
      { flag: 'practice.particion', label: 'LAG por orden', explanation: 'PARTITION BY.' },
      { flag: 'practice.referencia', label: 'Fecha de referencia', explanation: 'Nada de now().' },
    ],
  },

  concepts: [
    { id: 'ultimo_estado', title: 'El último estado', summary: 'DISTINCT ON (clave) … ORDER BY clave, fecha DESC: una fila por entidad, la más reciente.' },
    { id: 'lag', title: 'LAG por entidad', summary: 'LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en): el estado anterior de la misma orden.' },
    { id: 'transiciones', title: 'Transiciones válidas', summary: 'Cada par (desde, hasta) del historial se busca en la tabla de pasos permitidos; lo que no está, es un defecto.' },
    { id: 'atasco', title: 'Estados atascados', summary: 'Entidades que siguen en un estado intermedio más tiempo del permitido.' },
    { id: 'referencia', title: 'Fecha de referencia', summary: 'En pruebas sobre una foto de datos, «ahora» es una fecha fija, no now().' },
    { id: 'huerfanas', title: 'Entidades sin historial', summary: 'NOT EXISTS: lo que debería tener rastro y no lo tiene.' },
    { id: 'duraciones', title: 'Duraciones entre estados', summary: 'MIN/MAX con FILTER por estado y la resta de timestamps; EXTRACT(EPOCH …) para pasarla a minutos.' },
  ],
  debriefConcepts: ['ultimo_estado', 'lag', 'transiciones', 'atasco', 'referencia', 'huerfanas', 'duraciones'],
  seniorTips: [
    'Lee las reglas de estados y la fecha de referencia en la wiki.',
    'Laura: DISTINCT ON (orden_id) … ORDER BY orden_id, cambiado_en DESC y compárala con ordenes.estado.',
    'Marta: LAG con PARTITION BY orden_id y NOT EXISTS en transiciones_validas.',
    "Carmen: pendientes con MAX(cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours'.",
    'Nuria: DISTINCT ON por la hora ascendente y las que no empiezan en creada.',
    'Diego: ordenes NOT EXISTS en ordenes_historial.',
    'Inés: MAX y MIN con FILTER por estado, la resta y EXTRACT(EPOCH …) / 60.',
    'Con Laura: LAG particionado por orden y una fecha de referencia en vez de now().',
  ],

  lessons: [
    {
      id: 'ultimo_estado',
      question: '¿Cómo saco el último estado de cada orden?',
      conceptId: 'ultimo_estado',
      cost: 5,
      body: `Con \`DISTINCT ON\`: una fila por orden, la primera según el ORDER BY.

\`\`\`
SELECT DISTINCT ON (orden_id) orden_id, estado
FROM ordenes_historial
ORDER BY orden_id, cambiado_en DESC;
\`\`\`

El ORDER BY tiene que empezar por la misma columna del DISTINCT ON. Con \`cambiado_en\` ascendente sacas el **primero**. (En otras bases de datos: \`ROW_NUMBER() OVER (PARTITION BY orden_id ORDER BY cambiado_en DESC) = 1\`.)`,
    },
    {
      id: 'lag',
      question: '¿Cómo veo cada paso del historial?',
      conceptId: 'lag',
      cost: 5,
      body: `\`LAG\` te da el valor de la fila anterior. Con \`PARTITION BY\`, la anterior **de la misma orden**:

\`\`\`
SELECT orden_id,
       LAG(estado) OVER (PARTITION BY orden_id ORDER BY cambiado_en) AS desde,
       estado AS hasta
FROM ordenes_historial;
\`\`\`

La primera fila de cada orden tiene \`desde\` NULL: no es un paso. Sin PARTITION BY, el último estado de una orden se convierte en el «desde» de la siguiente.`,
    },
    {
      id: 'transiciones',
      question: '¿Cómo compruebo que cada paso está permitido?',
      conceptId: 'transiciones',
      cost: 5,
      body: `Con los pasos en una subconsulta, buscando cada par en la tabla de transiciones:

\`\`\`
SELECT orden_id, desde, hasta
FROM (…pasos con LAG…) t
WHERE desde IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM transiciones_validas v
                  WHERE v.desde = t.desde AND v.hasta = t.hasta);
\`\`\`

Cero filas: todas las órdenes siguieron el flujo. Cada fila es un salto, una vuelta atrás o un paso repetido.`,
    },
    {
      id: 'atasco',
      question: '¿Cómo encuentro órdenes atascadas?',
      conceptId: 'atasco',
      cost: 5,
      body: `Las que **siguen** en un estado intermedio y cuyo último cambio es anterior al límite:

\`\`\`
SELECT o.id, MAX(h.cambiado_en) AS pendiente_desde
FROM ordenes o JOIN ordenes_historial h ON h.orden_id = o.id
WHERE o.estado = 'pendiente'
GROUP BY o.id
HAVING MAX(h.cambiado_en) < TIMESTAMP '2026-03-02 12:00' - INTERVAL '48 hours';
\`\`\`

Una pendiente de ayer por la noche no está atascada todavía; una de hace una semana, sí.`,
    },
    {
      id: 'referencia',
      question: '¿Por qué no usar now()?',
      conceptId: 'referencia',
      cost: 5,
      body: `Porque los datos de pruebas son una **foto** de un día concreto, y \`now()\` es el día en que ejecutas. Hoy, con \`now()\`, **todas** las pendientes parecen atascadas, y mañana el resultado cambia otra vez: la prueba no es repetible.

En pruebas, «ahora» es un valor fijo: \`TIMESTAMP '2026-03-02 12:00'\` (o un parámetro). Así la misma consulta da lo mismo hoy y dentro de un año.`,
    },
    {
      id: 'huerfanas',
      question: '¿Y si una orden no tiene historial?',
      conceptId: 'huerfanas',
      cost: 5,
      body: `Entonces ninguna consulta que empiece por el historial la verá: ni la del último estado ni la de transiciones. Hay que buscarla desde \`ordenes\`:

\`\`\`
SELECT o.id, o.estado
FROM ordenes o
WHERE NOT EXISTS (SELECT 1 FROM ordenes_historial h WHERE h.orden_id = o.id);
\`\`\`

Una orden sin historial es un cambio de estado que alguien hizo sin dejar rastro.`,
    },
    {
      id: 'duraciones',
      question: '¿Cómo mido cuánto tarda una orden?',
      conceptId: 'duraciones',
      cost: 5,
      body: `Con agregados filtrados por estado, en una sola pasada:

\`\`\`
SELECT orden_id,
       EXTRACT(EPOCH FROM
         MAX(cambiado_en) FILTER (WHERE estado IN ('completada', 'rechazada', 'cancelada'))
       - MIN(cambiado_en) FILTER (WHERE estado = 'creada')) / 60 AS minutos
FROM ordenes_historial
GROUP BY orden_id;
\`\`\`

La resta de dos timestamps es un INTERVAL; \`EXTRACT(EPOCH …)\` lo pasa a segundos. Si falta uno de los dos estados, el resultado es NULL y la orden no sale en un \`> 60\`.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q7pre_ultimo', conceptId: 'ultimo_estado', question: '`DISTINCT ON (orden_id) … ORDER BY orden_id, cambiado_en DESC`. ¿Qué fila sale de cada orden?', options: ['La primera', 'La más reciente', 'Una al azar', 'Todas'], correct: 1, explanation: 'El ORDER BY decide cuál.' },
      { id: 'q7pre_lag', conceptId: 'lag', question: '¿Qué devuelve `LAG(estado)` en la primera fila de cada partición?', options: ['El mismo estado', 'NULL', 'El último estado', 'Un error'], correct: 1, explanation: 'No hay fila anterior.' },
      { id: 'q7pre_part', conceptId: 'lag', question: '`LAG(estado) OVER (ORDER BY cambiado_en)` sin PARTITION BY. ¿Qué pasa?', options: ['Nada', 'Mezcla estados de órdenes distintas', 'Da un error', 'Ordena por orden_id'], correct: 1, explanation: 'Hace falta PARTITION BY orden_id.' },
      { id: 'q7pre_trans', conceptId: 'transiciones', question: '¿Cómo detectas un paso no permitido?', options: ['Contando estados', 'Buscando cada par (desde, hasta) en la tabla de transiciones válidas', 'Mirando el último estado', 'Con un CHECK'], correct: 1, explanation: 'NOT EXISTS.' },
      { id: 'q7pre_ref', conceptId: 'referencia', question: 'Los datos de pruebas son del 2 de marzo. ¿Qué usas como «ahora»?', options: ['now()', "TIMESTAMP '2026-03-02 12:00'", 'CURRENT_DATE', 'Da igual'], correct: 1, explanation: 'La fecha de la foto.' },
      { id: 'q7pre_huerf', conceptId: 'huerfanas', question: 'Una orden no tiene historial. ¿La encuentra una consulta que empieza en `ordenes_historial`?', options: ['Sí', 'No', 'Solo si está completada', 'Solo con LAG'], correct: 1, explanation: 'Hay que empezar por ordenes.' },
    ],
    post: [
      { id: 'q7post_now', conceptId: 'referencia', question: 'Una prueba de atascos con `now()` sobre una foto de datos de hace meses. ¿Qué devuelve?', options: ['Las atascadas', 'Todas las pendientes', 'Ninguna', 'Un error'], correct: 1, explanation: 'Todas parecen antiguas.' },
      { id: 'q7post_null', conceptId: 'transiciones', question: '¿Por qué `desde IS NOT NULL` al buscar pasos no permitidos?', options: ['Por rendimiento', 'Porque la primera fila de cada orden no es un paso', 'Porque NULL es un estado', 'No hace falta'], correct: 1, explanation: 'Sin él, cada alta sería un fallo.' },
      { id: 'q7post_atasco', conceptId: 'atasco', question: 'Una orden pendiente desde hace 16 horas, con un límite de 48. ¿Está atascada?', options: ['Sí', 'No, todavía no', 'Depende del importe', 'Solo si no tiene historial'], correct: 1, explanation: 'Todavía está en plazo.' },
      { id: 'q7post_filter', conceptId: 'duraciones', question: "¿Qué hace `MIN(cambiado_en) FILTER (WHERE estado = 'creada')`?", options: ['Filtra las filas de la consulta', 'Calcula el mínimo solo sobre las filas en estado creada', 'Da un error', 'Cuenta las creadas'], correct: 1, explanation: 'El FILTER afecta solo a ese agregado.' },
      { id: 'q7post_vuelta', conceptId: 'transiciones', question: 'Una orden pasa de completada a pendiente. ¿Qué detecta la prueba de transiciones?', options: ['Nada', 'El paso completada → pendiente', 'Solo el último estado', 'Que está atascada'], correct: 1, explanation: 'No está en transiciones_validas.' },
      { id: 'q7post_ultimo', conceptId: 'ultimo_estado', question: '¿Contra qué compruebas el estado de la tabla `ordenes`?', options: ['Contra el primer estado del historial', 'Contra el último estado de su historial', 'Contra transiciones_validas', 'Contra nada'], correct: 1, explanation: 'Deben coincidir.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Órdenes de pago y sus estados',
      body: 'Buenos días.\n\nHoy toca el flujo de órdenes de pago. Cada cambio de estado queda en `ordenes_historial` y las reglas están en la wiki. La foto de datos es del 2 de marzo a las 12:00.\n\nPara empezar:\n\n- De las órdenes con historial, las que tienen en `ordenes` un estado **distinto** del **último** de su historial: `id`, `estado` y `ultimo`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'ultimo_estado' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.estado_distinto' },
      body: 'La 4 dice completada y su historial acaba en pendiente; la 11 dice rechazada y su historial, completada. Dos órdenes que mienten sobre sí mismas.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_transiciones',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! El flujo es creada → pendiente → completada, rechazada o cancelada, y está en `transiciones_validas`. ¿Qué pasos del historial **no** están permitidos? `orden_id`, `desde` y `hasta`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'lag' }, { kind: 'unlock', conceptId: 'transiciones' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.transiciones_invalidas' },
      body: 'La 4 vuelve a pendiente después de completada (¡se podría cobrar dos veces!), la 7 se salta pendiente y la 10 repite pendiente. Abro tres incidencias. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_atascadas',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Una orden no debería seguir pendiente más de 48 horas. Con la fecha de la foto (2 de marzo, 12:00), ¿cuáles siguen pendientes desde hace más? `id` y `pendiente_desde`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'atasco' }, { kind: 'unlock', conceptId: 'referencia' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.atascadas' },
      body: 'La 16, pendiente desde el 25 de febrero. La 19 es de anoche, todavía está en plazo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_lag',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «25 transiciones inválidas»',
      body: '**Laura:** Rubén ha hecho la misma prueba de transiciones con `LAG(estado) OVER (ORDER BY cambiado_en)` y le salen **25** pasos inválidos, casi todos «completada → creada». ¿Qué le pasa?',
      onDeliver: [],
      choices: [
        {
          id: 'particion',
          text: 'Que sin **PARTITION BY orden_id**, LAG coge la fila anterior **de toda la tabla**: el último estado de una orden se convierte en el «desde» de la siguiente. Esos «completada → creada» son la frontera entre dos órdenes, no un fallo. El historial se recorre orden por orden.',
          cost: 10,
          reply: 'Eso es. Veinticinco alarmas falsas esconden las tres de verdad.',
          effects: [
            { kind: 'flag', key: 'practice.particion' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'LAG con PARTITION BY la entidad del historial.' },
          ],
        },
        {
          id: 'excluir',
          text: "Que quite los «completada → creada» con un `WHERE` y ya está.",
          cost: 10,
          reply: 'Eso tapa el síntoma: seguirían saliendo fronteras como «rechazada → creada» o «pendiente → creada», y una de verdad podría quedar escondida.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Filtraste los falsos positivos en vez de arreglar el LAG.' }],
        },
        {
          id: 'datos',
          text: 'Que los datos de pruebas están mal: hay demasiados fallos.',
          cost: 10,
          reply: 'Los datos están bien. Es la consulta la que compara órdenes distintas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a los datos de un fallo de la consulta.' }],
        },
      ],
    },
    {
      id: 'nuria_inicio',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Un cliente pregunta por una orden y, en el historial, no veo cuándo se creó. ¿Qué órdenes **no empiezan** en `creada`? `orden_id` y `estado` (el primero que tienen).',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.sin_creada' },
      body: 'La 20, que empieza directamente en pendiente. Ya sé por qué no encontraba el alta. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_historial',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Hay un proceso de cierre que cambia el estado de las órdenes directamente en `ordenes`. Me temo que alguna no tiene historial. ¿Cuáles **no tienen ni una fila** en `ordenes_historial`? `id` y `estado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'huerfanas' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.sin_historial' },
      body: 'La 21: completada y sin rastro. Ninguna de las otras pruebas la veía porque todas empiezan por el historial. Lo arreglo. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_lentas',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. El acuerdo de servicio dice que una orden llega a su estado final en **60 minutos** como mucho desde que se crea. ¿Cuáles tardan más, según el historial? `orden_id` y `minutos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'duraciones' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.lentas' },
      body: 'Siete órdenes, entre 65 y 85 minutos. Nadie lo estaba midiendo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_ahora',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «hoy todas están atascadas»',
      body: '**Laura:** La prueba automática de atascos de Rubén usa `now() - INTERVAL \'48 hours\'`. Ayer, en su entorno, daba una. Hoy da **las dos** pendientes, y la de anoche no está atascada. ¿Qué cambiarías?',
      onDeliver: [],
      choices: [
        {
          id: 'referencia',
          text: 'Que los datos de pruebas son una **foto** del 2 de marzo, y `now()` es el día en que se ejecuta: cada día el resultado es distinto. La prueba tiene que usar una **fecha de referencia fija** (la de la foto, o un parámetro), para que dé lo mismo hoy y dentro de un año.',
          cost: 10,
          reply: 'Exacto. Una prueba que depende del reloj no es repetible.',
          effects: [
            { kind: 'flag', key: 'practice.referencia' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Fecha de referencia fija en vez de now().' },
          ],
        },
        {
          id: 'margen',
          text: 'Que suba el límite a una semana para que no salgan tantas.',
          cost: 10,
          reply: 'Con eso dejas de ver la de verdad… y dentro de un mes volverán a salir todas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiaste la regla para que la prueba pase.' }],
        },
        {
          id: 'recargar',
          text: 'Que recargue los datos cada mañana para que estén al día.',
          cost: 10,
          reply: 'Unos datos que cambian cada día hacen la prueba todavía menos repetible. La fecha es la que tiene que quedarse quieta.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Intentaste mover los datos en vez de fijar la fecha.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Veintiuna órdenes, siete con algo raro. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que los estados se prueban contra su historial: el estado actual es el último del historial, cada paso (con LAG por orden) está en las transiciones válidas, todo empieza donde debe, nada se queda atascado (con una fecha de referencia fija, no now()), todo tiene rastro y las duraciones se miden.',
          reply: 'Muy bien. Mañana, las reglas de la propia base de datos: restricciones y triggers.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'actual',
          text: 'Que basta con comprobar el estado actual de cada orden.',
          reply: 'El estado actual no cuenta cómo llegó: hoy, cinco de los siete problemas estaban en el camino. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste solo con el estado actual.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
