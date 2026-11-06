import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

/**
 * Curso 8: SQL para QA · Misión 3 — Consultas que deben dar cero.
 *
 * Aserciones de calidad de datos: consultas que devuelven las filas que
 * incumplen una regla (cero filas = todo bien) y se pueden lanzar cada noche.
 * Huérfanos, duplicados, estados incompatibles, fechas imposibles, saldos
 * prohibidos y relaciones que faltan. Trampas: aserciones con falsos
 * positivos y aserciones que devuelven un número en vez de las filas.
 */
export const m03CeroFilas: Mission = {
  ...COMUN,
  id: 'm03-cero-filas',
  number: 3,
  title: 'Consultas que deben dar cero',
  subtitle: 'Aserciones de calidad de datos: las filas que incumplen una regla, para lanzarlas cada noche.',
  dayLabel: 'Jueves · mes 4',
  verdicts: {
    good: {
      title: 'Seis aserciones para la noche',
      body: 'Transferencias a cuentas que no existen, pagos repetidos, cobros con la tarjeta bloqueada, una incidencia cerrada antes de abrirse, una cuenta de ahorro en negativo y un préstamo aprobado sin cuotas. Cada aserción devuelve las filas culpables, sin falsos positivos.',
    },
    ok: {
      title: 'Aserciones a medias',
      body: 'Ya escribes aserciones, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'La noche sin vigilancia',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de aserciones a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Consultas que deben dar cero',
    paragraphs: [
      'Jueves. Laura quiere un paquete de **aserciones de datos** que se lance cada noche: consultas que devuelven las filas que **incumplen** una regla. Si devuelven cero filas, todo bien; si no, cada fila es un problema con nombre y apellidos.',
      'Hoy escribes seis. Cada encargo se cumple cuando la consulta devuelve exactamente las filas culpables (con las columnas pedidas) y ninguna más.',
    ],
    goals: [
      'Escribe una regla como una consulta que devuelve las filas que la incumplen.',
      'Busca huérfanos sin confundirlos con los vacíos legítimos.',
      'Encuentra duplicados exactos y quédate con las copias.',
      'Comprueba estados que no pueden ir juntos.',
      'Comprueba fechas y saldos imposibles.',
      'Busca relaciones que tendrían que existir y faltan.',
    ],
  },

  docs: [
    {
      id: 'chuleta_aserciones',
      title: 'Chuleta: aserciones de datos',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'asercion' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Qué es una aserción de datos
Una consulta que devuelve **las filas que incumplen una regla**. El proceso de la noche la lanza y:
- **0 filas** → la regla se cumple.
- **N filas** → hay N problemas, y cada fila dice cuál.

## Plantillas
| Regla | Aserción |
|---|---|
| Toda X apunta a una Y que existe | \`… WHERE x.y_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM y WHERE y.id = x.y_id)\` |
| No hay copias | \`… WHERE EXISTS (SELECT 1 FROM t o WHERE (mismas columnas) AND o.id < t.id)\` |
| Estados compatibles | \`… JOIN … WHERE a.estado = 'x' AND b.estado = 'y'\` |
| Orden de fechas | \`… WHERE fin < inicio\` |
| Rango de valores | \`… WHERE tipo = 'x' AND valor < 0\` |
| Toda X tiene alguna Y | \`… WHERE NOT EXISTS (SELECT 1 FROM y WHERE y.x_id = x.id)\` |

## Reglas de Kobalto
- \`transferencias.cuenta_destino_id\` vacío = transferencia a **otro banco** (es normal).
- Las tarjetas **bloqueadas** no pueden tener pagos **aceptados**.
- Las cuentas de **ahorro** no pueden estar en negativo (las corrientes, sí).
- Un préstamo **aprobado** tiene sus **cuotas**.`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Una aserción devuelve las filas que incumplen la regla.\n-- Regla: ninguna incidencia tiene un canal desconocido.\nSELECT id, canal\nFROM incidencias\nWHERE canal NOT IN ('chat', 'telefono', 'email');",
    retos: [
      {
        id: 'destinos_inexistentes',
        from: 'laura',
        title: 'Transferencias a cuentas que no existen',
        description: 'Las transferencias con una **cuenta destino** que **no existe** en `cuentas`. Las transferencias a otros bancos (destino vacío) son normales y **no** cuentan. Columnas: `id` y `cuenta_destino_id`.',
        hint: '`WHERE cuenta_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'SELECT t.id, t.cuenta_destino_id FROM transferencias t WHERE t.cuenta_destino_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id)',
        columns: ['id', 'cuenta_destino_id'],
      },
      {
        id: 'pagos_duplicados',
        from: 'marta',
        title: 'Pagos repetidos',
        description: 'Los pagos con tarjeta que son **copia exacta** de otro anterior (misma tarjeta, comercio, importe y hora, y un `id` mayor). Solo las copias, no los originales: una columna `id`.',
        hint: '`WHERE EXISTS (SELECT 1 FROM pagos_tarjeta o WHERE o.tarjeta_id = p.tarjeta_id AND … AND o.id < p.id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT p.id FROM pagos_tarjeta p WHERE EXISTS (SELECT 1 FROM pagos_tarjeta o WHERE o.tarjeta_id = p.tarjeta_id AND o.comercio_id = p.comercio_id AND o.importe = p.importe AND o.pagado_en = p.pagado_en AND o.id < p.id)',
        columns: ['id'],
      },
      {
        id: 'aceptados_bloqueada',
        from: 'carmen',
        title: 'Pagos aceptados con la tarjeta bloqueada',
        description: 'Los pagos **aceptados** hechos con una tarjeta **bloqueada**: `id` (del pago) y `tarjeta_id`.',
        hint: "`JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT p.id, p.tarjeta_id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado'",
        columns: ['id', 'tarjeta_id'],
      },
      {
        id: 'cierre_antes',
        from: 'nuria',
        title: 'Incidencias cerradas antes de abrirse',
        description: 'Las incidencias con fecha de **cierre anterior** a la de apertura: `id`, `abierta_en` y `cerrada_en`.',
        hint: '`WHERE cerrada_en < abierta_en` (las abiertas, con cierre vacío, no salen solas).',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT id, abierta_en, cerrada_en FROM incidencias WHERE cerrada_en < abierta_en',
        columns: ['id', 'abierta_en', 'cerrada_en'],
      },
      {
        id: 'ahorro_negativo',
        from: 'diego',
        title: 'Cuentas de ahorro en negativo',
        description: 'Las cuentas de **ahorro** con saldo **negativo** (las corrientes pueden estarlo): `id` y `saldo`.',
        hint: "`WHERE tipo = 'ahorro' AND saldo < 0`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT id, saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0",
        columns: ['id', 'saldo'],
      },
      {
        id: 'aprobados_sin_cuotas',
        from: 'ines',
        title: 'Préstamos aprobados sin cuotas',
        description: 'Los préstamos **aprobados** que **no tienen ninguna cuota**: `id` y `cliente_id`.',
        hint: "`WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT p.id, p.cliente_id FROM prestamos p WHERE p.estado = 'aprobado' AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id)",
        columns: ['id', 'cliente_id'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Tres clientes ven un pago cobrado dos veces durante semanas', severity: 'high', explanation: 'Nada vigilaba los pagos repetidos.', technique: 'Aserción de copias con EXISTS y o.id < p.id.', preventedBy: 'reto.pagos_duplicados' },
    { id: 'C-CARMEN', title: 'Se aceptan pagos con una tarjeta bloqueada y nadie se entera', severity: 'high', explanation: 'Estados incompatibles sin vigilancia.', technique: 'Aserción de estados que no pueden ir juntos.', preventedBy: 'reto.aceptados_bloqueada' },
    { id: 'C-NURIA', title: 'El tiempo medio de resolución sale negativo en el informe del mes', severity: 'medium', explanation: 'Una incidencia cerrada antes de abrirse.', technique: 'Aserción de orden de fechas.', preventedBy: 'reto.cierre_antes' },
    { id: 'C-DIEGO', title: 'Una cuenta de ahorro en negativo pasa un mes sin que nadie la vea', severity: 'medium', explanation: 'La regla solo estaba en la app.', technique: 'Aserción de rango de valores por tipo.', preventedBy: 'reto.ahorro_negativo' },
    { id: 'C-INES', title: 'Un préstamo aprobado nunca empieza a cobrarse', severity: 'high', explanation: 'Se aprobó sin generar sus cuotas.', technique: 'Aserción de relación que falta (NOT EXISTS).', preventedBy: 'reto.aprobados_sin_cuotas' },
    { id: 'C-RUIDO', title: 'El equipo deja de mirar las alertas de datos', severity: 'medium', explanation: 'Una aserción con falsos positivos «fallaba» cada noche por las transferencias a otros bancos.', technique: 'Excluir los casos legítimos: cada fila tiene que ser un problema de verdad.', preventedBy: 'practice.sin_ruido' },
    { id: 'C-COUNT', title: 'Las aserciones de Rubén fallan todas las noches, haya problemas o no', severity: 'low', explanation: 'Devolvían una fila con el recuento en vez de las filas culpables.', technique: 'Devolver las filas que incumplen, con su identificador.', preventedBy: 'practice.filas' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las aserciones del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.pagos_duplicados', label: 'Pagos de Marta', explanation: 'Copias vigiladas.' },
      { flag: 'reto.aceptados_bloqueada', label: 'Tarjetas de Carmen', explanation: 'Estados compatibles.' },
      { flag: 'reto.cierre_antes', label: 'Incidencias de Nuria', explanation: 'Fechas en orden.' },
      { flag: 'reto.ahorro_negativo', label: 'Cuentas de Diego', explanation: 'Ahorro nunca negativo.' },
      { flag: 'reto.aprobados_sin_cuotas', label: 'Préstamos de Inés', explanation: 'Aprobado con cuotas.' },
      { flag: 'practice.sin_ruido', label: 'Sin falsos positivos', explanation: 'Cada fila, un problema real.' },
      { flag: 'practice.filas', label: 'Filas, no recuentos', explanation: 'Cero filas = todo bien.' },
    ],
  },

  concepts: [
    { id: 'asercion', title: 'Aserción de datos', summary: 'Una consulta que devuelve las filas que incumplen una regla: cero filas = la regla se cumple.' },
    { id: 'huerfanos', title: 'Huérfanos', summary: 'Filas que apuntan a algo que no existe; los vacíos legítimos (otro banco) no lo son.' },
    { id: 'duplicados', title: 'Duplicados', summary: 'Copias exactas: EXISTS con las mismas columnas y o.id < p.id para quedarse con las copias.' },
    { id: 'estados', title: 'Estados incompatibles', summary: 'Combinaciones que no pueden darse: pago aceptado con tarjeta bloqueada.' },
    { id: 'temporal', title: 'Fechas imposibles', summary: 'Un fin antes del inicio, una fecha futura en algo que ya pasó.' },
    { id: 'falta_relacion', title: 'Relaciones que faltan', summary: 'Lo que debería tener algo y no tiene nada: NOT EXISTS.' },
    { id: 'falsos_positivos', title: 'Falsos positivos', summary: 'Una aserción que avisa de casos correctos acaba ignorada; cada fila tiene que ser un problema real.' },
  ],
  debriefConcepts: ['asercion', 'huerfanos', 'duplicados', 'estados', 'temporal', 'falta_relacion', 'falsos_positivos'],
  seniorTips: [
    'Lee la chuleta de aserciones de datos en la wiki.',
    'Laura: cuenta_destino_id IS NOT NULL AND NOT EXISTS en cuentas.',
    'Marta: EXISTS con las mismas cuatro columnas y o.id < p.id.',
    "Carmen: JOIN tarjetas, t.estado = 'bloqueada' AND p.estado = 'aceptado'.",
    'Nuria: cerrada_en < abierta_en.',
    "Diego: tipo = 'ahorro' AND saldo < 0.",
    "Inés: estado = 'aprobado' AND NOT EXISTS en cuotas.",
    'Con Laura: sin falsos positivos, y siempre las filas culpables, no un recuento.',
  ],

  lessons: [
    {
      id: 'asercion',
      question: '¿Qué es una aserción de datos?',
      conceptId: 'asercion',
      cost: 5,
      body: `Una regla de negocio escrita al revés: en vez de «todas las X cumplen Y», una consulta que devuelve **las X que no cumplen Y**.

\`\`\`
-- Regla: las cuentas de ahorro no están en negativo
SELECT id, saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0;
\`\`\`

Un proceso nocturno las lanza todas: si alguna devuelve filas, avisa con esas filas. Así una regla que solo vivía en la app, o en la cabeza de alguien, queda vigilada siempre.`,
    },
    {
      id: 'huerfanos',
      question: '¿Cómo busco huérfanos sin falsos positivos?',
      conceptId: 'huerfanos',
      cost: 5,
      body: `Un huérfano apunta a algo que **no existe**. Pero un vacío no siempre es un error: en Kobalto, un destino vacío es una transferencia a otro banco.

\`\`\`
SELECT t.id, t.cuenta_destino_id
FROM transferencias t
WHERE t.cuenta_destino_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM cuentas c WHERE c.id = t.cuenta_destino_id);
\`\`\`

Con \`LEFT JOIN cuentas … WHERE c.id IS NULL\` a secas saldrían también las 24 transferencias a otros bancos.`,
    },
    {
      id: 'duplicados',
      question: '¿Cómo encuentro solo las copias de un pago?',
      conceptId: 'duplicados',
      cost: 5,
      body: `Con un EXISTS que busca otra fila **idéntica** y **anterior**:

\`\`\`
SELECT p.id FROM pagos_tarjeta p
WHERE EXISTS (
  SELECT 1 FROM pagos_tarjeta o
  WHERE o.tarjeta_id = p.tarjeta_id AND o.comercio_id = p.comercio_id
    AND o.importe = p.importe AND o.pagado_en = p.pagado_en
    AND o.id < p.id
);
\`\`\`

\`o.id < p.id\` deja fuera los originales: la aserción señala justo lo que habría que quitar.`,
    },
    {
      id: 'estados',
      question: '¿Cómo vigilo estados que no pueden ir juntos?',
      conceptId: 'estados',
      cost: 5,
      body: `Une las dos tablas y pide la combinación prohibida:

\`\`\`
SELECT p.id, p.tarjeta_id
FROM pagos_tarjeta p
JOIN tarjetas t ON t.id = p.tarjeta_id
WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado';
\`\`\`

Cada regla de negocio del tipo «si A, nunca B» se convierte en una aserción así.`,
    },
    {
      id: 'temporal',
      question: '¿Qué fechas imposibles conviene vigilar?',
      conceptId: 'temporal',
      cost: 5,
      body: `- Fin antes del inicio: \`cerrada_en < abierta_en\`.
- Algo que ya pasó con fecha futura: \`pagado_en > '2026-03-02'\` (con la fecha de referencia de la prueba, no con \`now()\`).
- Pasos en desorden: una aprobación antes de la solicitud.

Ojo con los NULL: \`cerrada_en < abierta_en\` es NULL para las incidencias abiertas, así que no salen. Es lo que queremos: una incidencia abierta no tiene fecha de cierre que comparar.`,
    },
    {
      id: 'falta_relacion',
      question: '¿Cómo busco lo que falta?',
      conceptId: 'falta_relacion',
      cost: 5,
      body: `Con NOT EXISTS: las filas de una tabla para las que **no hay ninguna** fila en otra.

\`\`\`
SELECT p.id, p.cliente_id FROM prestamos p
WHERE p.estado = 'aprobado'
  AND NOT EXISTS (SELECT 1 FROM cuotas c WHERE c.prestamo_id = p.id);
\`\`\`

Es la aserción que encuentra procesos a medias: algo se aprobó, se creó o se cerró… y no dejó lo que tenía que dejar.`,
    },
    {
      id: 'falsos_positivos',
      question: '¿Por qué importan tanto los falsos positivos?',
      conceptId: 'falsos_positivos',
      cost: 5,
      body: `Una aserción que avisa **todas las noches** de casos que están bien enseña al equipo a ignorarla. Y el día que avise de un problema de verdad, nadie lo mirará.

Por eso:

- Cada fila que devuelve tiene que ser un **problema real**: excluye los casos legítimos (destino vacío = otro banco).
- Devuelve las **filas culpables** con su identificador, no un recuento: «hay 3» no dice cuáles.
- Si una regla tiene excepciones, escríbelas en la consulta, no en la cabeza de quien mira el aviso.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q3pre_asercion', conceptId: 'asercion', question: 'Una aserción de datos devuelve cero filas. ¿Qué significa?', options: ['Que la consulta está mal', 'Que la regla se cumple', 'Que la tabla está vacía', 'Que hay un error'], correct: 1, explanation: 'Cada fila sería un incumplimiento.' },
      { id: 'q3pre_huerfano', conceptId: 'huerfanos', question: '¿Qué es una fila huérfana?', options: ['Una fila sin id', 'Una fila que apunta a otra que no existe', 'Una fila repetida', 'Una fila con NULL'], correct: 1, explanation: 'Un NULL puede ser legítimo.' },
      { id: 'q3pre_dup', conceptId: 'duplicados', question: 'Para devolver solo las copias (no los originales) de los pagos repetidos, ¿qué condición añades?', options: ['o.id <> p.id', 'o.id < p.id', 'o.id = p.id', 'DISTINCT'], correct: 1, explanation: 'Existe uno anterior igual.' },
      { id: 'q3pre_estado', conceptId: 'estados', question: 'Regla: «una tarjeta bloqueada no tiene pagos aceptados». ¿Qué devuelve su aserción?', options: ['Las tarjetas bloqueadas', 'Los pagos aceptados de tarjetas bloqueadas', 'Todos los pagos', 'El número de tarjetas'], correct: 1, explanation: 'La combinación prohibida.' },
      { id: 'q3pre_falta', conceptId: 'falta_relacion', question: '¿Con qué buscas préstamos aprobados sin cuotas?', options: ['JOIN cuotas', 'NOT EXISTS (SELECT 1 FROM cuotas …)', 'COUNT(*)', 'GROUP BY'], correct: 1, explanation: 'O LEFT JOIN … WHERE c.id IS NULL.' },
      { id: 'q3pre_ruido', conceptId: 'falsos_positivos', question: 'Una aserción avisa todas las noches de casos correctos. ¿Qué pasa?', options: ['Nada', 'El equipo aprende a ignorarla', 'Se arregla sola', 'Mejora la calidad'], correct: 1, explanation: 'Y un día ignorará un aviso de verdad.' },
    ],
    post: [
      { id: 'q3post_null', conceptId: 'huerfanos', question: '`LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL`. ¿Qué devuelve además de los huérfanos?', options: ['Nada más', 'Las transferencias a otros bancos (destino vacío)', 'Las cuentas cerradas', 'Los duplicados'], correct: 1, explanation: 'Hay que añadir cuenta_destino_id IS NOT NULL.' },
      { id: 'q3post_count', conceptId: 'falsos_positivos', question: 'El proceso nocturno da por buena una aserción si devuelve cero filas. Rubén escribe `SELECT COUNT(*) …`. ¿Qué pasa?', options: ['Funciona', 'Siempre devuelve una fila, así que siempre «falla»', 'Nunca falla', 'Da error'], correct: 1, explanation: 'Devuelve las filas, no el recuento.' },
      { id: 'q3post_temp', conceptId: 'temporal', question: 'Una incidencia abierta tiene `cerrada_en` vacío. ¿Sale en `WHERE cerrada_en < abierta_en`?', options: ['Sí', 'No: la comparación con NULL no es verdadera', 'Da error', 'Depende'], correct: 1, explanation: 'Y es lo correcto.' },
      { id: 'q3post_regla', conceptId: 'asercion', question: '«Las cuentas de ahorro no pueden estar en negativo». ¿Cuál es la aserción?', options: ["SELECT … WHERE tipo = 'ahorro' AND saldo >= 0", "SELECT id, saldo FROM cuentas WHERE tipo = 'ahorro' AND saldo < 0", 'SELECT COUNT(*) FROM cuentas', 'SELECT MIN(saldo) FROM cuentas'], correct: 1, explanation: 'Las filas que incumplen.' },
      { id: 'q3post_dup', conceptId: 'duplicados', question: 'Con `o.id <> p.id` en vez de `o.id < p.id`, ¿qué devuelve la aserción de copias?', options: ['Solo las copias', 'Las copias y los originales', 'Nada', 'Solo los originales'], correct: 1, explanation: 'Cada fila de la pareja encuentra a la otra.' },
      { id: 'q3post_proc', conceptId: 'falta_relacion', question: '¿Qué tipo de problema encuentra una aserción con NOT EXISTS?', options: ['Duplicados', 'Procesos a medias: algo que debería haber dejado otra cosa y no lo hizo', 'Índices que faltan', 'Rendimiento'], correct: 1, explanation: 'Aprobado sin cuotas, alta sin auditoría…' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Lo que vigila la noche',
      body: 'Buenos días.\n\nTodo lo que encontraste esta semana lo encontraste porque lo buscaste. Quiero que se busque solo: un paquete de **aserciones de datos** que se lance cada noche. Cada una es una consulta que devuelve **las filas que incumplen una regla**: cero filas, todo bien.\n\nLa primera:\n\n- Las transferencias con una **cuenta destino que no existe**. Ojo: un destino **vacío** es una transferencia a otro banco y es normal. `id` y `cuenta_destino_id`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'asercion' }, { kind: 'unlock', conceptId: 'huerfanos' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.destinos_inexistentes' },
      body: 'Tres: la 77 (a la 999, que viene de hace meses), la 2001 y la 2002. Y ninguna de las 24 a otros bancos. Así se escribe una aserción que se puede creer.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_duplicados',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! El año pasado tuvimos pagos con tarjeta **repetidos** (misma tarjeta, comercio, importe y hora). Quiero una aserción que devuelva **solo las copias**, no los originales: una columna `id`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'duplicados' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.pagos_duplicados' },
      body: 'La 304, la 305 y la 306. Si mañana aparece otra, nos enteramos al día siguiente. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_bloqueadas',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Regla de Riesgos: una tarjeta **bloqueada** no puede tener pagos **aceptados**. Quiero la aserción: `id` del pago y `tarjeta_id`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'estados' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.aceptados_bloqueada' },
      body: 'Tres pagos aceptados con la tarjeta 12, la bloqueada. Abro la investigación. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_ruido',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «27 huérfanos cada noche»',
      body: '**Laura:** Rubén ya tenía una aserción de huérfanos:\n\n`SELECT t.id FROM transferencias t LEFT JOIN cuentas c ON c.id = t.cuenta_destino_id WHERE c.id IS NULL;`\n\nDevuelve 27 filas todas las noches, y el equipo ya ni la mira. ¿Qué le pasa?',
      onDeliver: [],
      choices: [
        {
          id: 'ruido',
          text: 'Que cuenta como huérfanas las **24 transferencias a otros bancos**, que tienen el destino vacío a propósito. Son **falsos positivos**: tapan los 3 huérfanos de verdad y enseñan al equipo a ignorar el aviso. Hay que añadir `cuenta_destino_id IS NOT NULL`.',
          cost: 10,
          reply: 'Exacto. Una aserción que siempre suena es peor que ninguna: da falsa tranquilidad a quien la tiene y ruido a quien la recibe.',
          effects: [
            { kind: 'flag', key: 'practice.sin_ruido' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Una aserción sin falsos positivos: excluye los casos legítimos.' },
          ],
        },
        {
          id: 'umbral',
          text: 'Que avise solo si salen más de 27.',
          cost: 10,
          reply: '¿Y si mañana desaparecen dos transferencias a otros bancos y aparecen dos huérfanos de verdad? Seguirían siendo 27.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Pusiste un umbral para tapar falsos positivos.' }],
        },
        {
          id: 'quitar',
          text: 'Que la quite: si nadie la mira, no sirve.',
          cost: 10,
          reply: 'Los tres huérfanos de verdad siguen ahí. La aserción sirve; lo que falla es cómo está escrita.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Quitaste la vigilancia en vez de arreglarla.' }],
        },
      ],
    },
    {
      id: 'nuria_fechas',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. El informe de tiempos de resolución vuelve a salir raro. ¿Me haces la aserción de las incidencias **cerradas antes de abrirse**? `id`, `abierta_en` y `cerrada_en`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'temporal' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.cierre_antes' },
      body: 'La 5: cerrada dos horas antes de abrirse. Ya sé de dónde salía el número negativo. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_ahorro',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. La app no deja que una cuenta de **ahorro** quede en negativo, pero los procesos de cierre van por otro lado. ¿Me haces la aserción? `id` y `saldo` de las de ahorro con saldo negativo.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.ahorro_negativo' },
      body: 'La 28, con −12,40 €. Un cierre de comisiones se la saltó. Lo miro. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_cuotas',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. Cuando se aprueba un préstamo se generan sus cuotas. Si el proceso se queda a medias, el préstamo nunca se cobra. Aserción: préstamos **aprobados** sin **ninguna** cuota, con `id` y `cliente_id`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'falta_relacion' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.aprobados_sin_cuotas' },
      body: 'El 19. Aprobado y sin una sola cuota. Lo paso a Préstamos. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_count',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «las mías fallan siempre»',
      body: '**Laura:** El proceso de la noche da una aserción por buena si devuelve **cero filas**. Rubén ha escrito las suyas así:\n\n`SELECT COUNT(*) AS problemas FROM cuentas WHERE tipo = \'ahorro\' AND saldo < 0;`\n\nY dice que todas «fallan» siempre, aunque no haya problemas. ¿Por qué?',
      onDeliver: [],
      choices: [
        {
          id: 'filas',
          text: 'Porque `COUNT(*)` devuelve **siempre una fila**, aunque el recuento sea 0. La aserción tiene que devolver **las filas que incumplen** (aquí, `id` y `saldo` de cada cuenta), así cero filas significa «todo bien» y, cuando falla, cada fila dice dónde está el problema.',
          cost: 10,
          reply: 'Eso es. Y fíjate en lo segundo: «hay 1» no ayuda a nadie a las tres de la mañana; «la cuenta 28 está en −12,40» sí.',
          effects: [
            { kind: 'flag', key: 'practice.filas' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Las aserciones devuelven las filas culpables, no un recuento.' },
          ],
        },
        {
          id: 'proceso',
          text: 'Que cambie el proceso para que mire el número.',
          cost: 10,
          reply: 'Se podría, pero perderíamos lo importante: saber qué filas fallan. Y cada aserción necesitaría su propia lógica.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Adaptaste el proceso a una aserción mal escrita.' }],
        },
        {
          id: 'having',
          text: 'Que añada `HAVING COUNT(*) > 0`.',
          cost: 10,
          reply: 'Ya no fallaría siempre… pero seguiría sin decir qué cuentas son. La aserción tiene que devolver las filas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Arreglaste el síntoma y no el diseño.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Seis aserciones para el proceso de la noche. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una regla se vigila con una consulta que devuelve las filas que la incumplen: huérfanos (sin contar los vacíos legítimos), copias, estados incompatibles, fechas imposibles, valores prohibidos y relaciones que faltan. Sin falsos positivos y con las filas culpables, no un recuento.',
          reply: 'Muy bien. Mañana, cuando hay dos fuentes que deberían decir lo mismo: conciliar.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'manual',
          text: 'Que es mejor revisar los datos a mano cuando haya tiempo.',
          reply: 'Nunca hay tiempo. Por eso se automatiza. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con revisar a mano.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
