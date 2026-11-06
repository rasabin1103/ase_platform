import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

const JOIN = 'FROM clientes c JOIN clientes_v2 v ON v.id = c.id'

/**
 * Curso 8: SQL para QA · Misión 5 — Validar una migración.
 *
 * Clientes y cuentas migrados al esquema nuevo (`clientes_v2`, `ciudades`,
 * `cuentas_v2`). El alumno escribe el resultado esperado a partir de la
 * especificación de la migración y lo compara con lo migrado: filas que faltan
 * y sobran, nombres, emails, mapeo de segmentos, tabla de ciudades y saldos en
 * céntimos. Trampas: recuentos iguales con filas distintas y comparaciones
 * con <> que se saltan los NULL.
 */
export const m05Migracion: Mission = {
  ...COMUN,
  id: 'm05-migracion',
  number: 5,
  title: 'Validar una migración',
  subtitle: 'Comparar lo migrado con lo esperado: filas, transformaciones, mapeos, NULL y unidades.',
  dayLabel: 'Lunes · mes 4, semana 2',
  verdicts: {
    good: {
      title: 'Migración validada de verdad',
      body: 'Un cliente perdido y uno de prueba colado aunque los recuentos coincidían, un nombre sin apellidos, dos emails mal (uno vacío), dos segmentos mal mapeados, una ciudad cambiada y tres saldos mal convertidos a céntimos. La migración no sale hasta que esté arreglado.',
    },
    ok: {
      title: 'Validación a medias',
      body: 'Ya comparas origen y destino, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Migración a ciegas',
      body: 'Varios encargos se quedaron sin hacer y los defectos pasaron al sistema nuevo. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Validar una migración',
    paragraphs: [
      'Lunes. Este fin de semana Diego ha migrado los clientes y las cuentas al **esquema nuevo**: `clientes_v2`, `ciudades` y `cuentas_v2`. El viernes se apaga el antiguo. Antes, QA tiene que dar el visto bueno.',
      'La especificación está en la wiki. Cada encargo se cumple cuando la consulta devuelve exactamente las filas que no cumplen la especificación, con las columnas pedidas.',
    ],
    goals: [
      'Compara las claves del origen y del destino en los dos sentidos.',
      'Calcula el valor esperado de cada columna a partir de la especificación.',
      'Compara con IS DISTINCT FROM para no saltarte los NULL.',
      'Comprueba los mapeos de valores y de tablas.',
      'Comprueba los cambios de unidades.',
      'Sabe por qué un recuento igual no valida nada.',
    ],
  },

  docs: [
    {
      id: 'chuleta_migracion',
      title: 'Especificación de la migración a v2',
      updatedLabel: 'Diego Ruiz · Backend',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'esperado' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## clientes → clientes_v2
| Columna nueva | Regla |
|---|---|
| \`id\` | el mismo; **todos** los clientes, ninguno más |
| \`nombre_completo\` | \`nombre || ' ' || apellidos\` |
| \`email\` | \`lower(trim(email))\` |
| \`ciudad_id\` | el \`id\` de \`ciudades\` cuyo \`nombre\` es la ciudad del cliente |
| \`segmento\` | el mismo; **vacío → 'sin_segmento'** |
| \`alta\` | \`fecha_alta\` |

## cuentas → cuentas_v2
| Columna nueva | Regla |
|---|---|
| \`id\`, \`cliente_id\` | los mismos |
| \`iban\` | sin espacios |
| \`saldo_centimos\` | \`saldo × 100\` (entero, **con su signo**) |

## Cómo validar
1. Las claves: lo que falta y lo que sobra.
2. Cada columna: el valor esperado (según la regla) frente al migrado.
3. Comparar con \`IS DISTINCT FROM\` (un NULL también es una diferencia).`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Origen y destino, uno al lado del otro\nSELECT c.id, c.nombre, c.apellidos, c.email, c.ciudad, c.segmento,\n       v.nombre_completo, v.email, v.ciudad_id, v.segmento\nFROM clientes c\nLEFT JOIN clientes_v2 v ON v.id = c.id\nORDER BY c.id\nLIMIT 10;',
    retos: [
      {
        id: 'faltan_sobran',
        from: 'laura',
        title: 'Clientes que faltan y que sobran',
        description: "Los ids de clientes que **no** están en `clientes_v2` (`problema` = `'falta'`) y los de `clientes_v2` que **no** están en `clientes` (`problema` = `'sobra'`): `id` y `problema`.",
        hint: "`SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2) UNION ALL SELECT id, 'sobra' FROM clientes_v2 WHERE id NOT IN (SELECT id FROM clientes)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2) UNION ALL SELECT id, 'sobra' FROM clientes_v2 WHERE id NOT IN (SELECT id FROM clientes)",
        columns: ['id', 'problema'],
      },
      {
        id: 'nombres',
        from: 'marta',
        title: 'Nombres completos mal construidos',
        description: "Los clientes migrados cuyo `nombre_completo` **no** es `nombre || ' ' || apellidos`: una columna `id`.",
        hint: `\`SELECT c.id ${JOIN} WHERE v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos\`.`,
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `SELECT c.id ${JOIN} WHERE v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos`,
        columns: ['id'],
      },
      {
        id: 'emails',
        from: 'carmen',
        title: 'Emails mal migrados',
        description: 'Los clientes migrados cuyo email nuevo **no** es `lower(trim(email))` del antiguo, **incluido** si el nuevo está vacío: `id`, `email_origen` y `email_destino`.',
        hint: '`WHERE v.email IS DISTINCT FROM lower(trim(c.email))`: con `<>`, un email vacío no sale.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: `SELECT c.id, c.email AS email_origen, v.email AS email_destino ${JOIN} WHERE v.email IS DISTINCT FROM lower(trim(c.email))`,
        columns: ['id', 'email_origen', 'email_destino'],
      },
      {
        id: 'segmentos',
        from: 'nuria',
        title: 'Segmentos mal mapeados',
        description: "Los clientes migrados cuyo segmento nuevo no es el esperado (el mismo, y **vacío → 'sin_segmento'**): `id`, `segmento_origen` y `segmento_destino`.",
        hint: "`WHERE v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento')`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: `SELECT c.id, c.segmento AS segmento_origen, v.segmento AS segmento_destino ${JOIN} WHERE v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento')`,
        columns: ['id', 'segmento_origen', 'segmento_destino'],
      },
      {
        id: 'ciudades',
        from: 'diego',
        title: 'Ciudades cambiadas',
        description: 'Los clientes migrados cuyo `ciudad_id` **no** corresponde (en la tabla `ciudades`) a su ciudad de antes: `id`, `ciudad_origen` y `ciudad_destino` (el nombre de la ciudad a la que apunta).',
        hint: '`LEFT JOIN ciudades ci ON ci.id = v.ciudad_id WHERE ci.nombre IS DISTINCT FROM c.ciudad`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: `SELECT c.id, c.ciudad AS ciudad_origen, ci.nombre AS ciudad_destino ${JOIN} LEFT JOIN ciudades ci ON ci.id = v.ciudad_id WHERE ci.nombre IS DISTINCT FROM c.ciudad`,
        columns: ['id', 'ciudad_origen', 'ciudad_destino'],
      },
      {
        id: 'saldos_centimos',
        from: 'ines',
        title: 'Saldos mal convertidos a céntimos',
        description: 'Las cuentas migradas cuyo `saldo_centimos` **no** es `saldo × 100` (con su signo): `id`, `saldo` y `saldo_centimos`.',
        hint: '`FROM cuentas a JOIN cuentas_v2 v ON v.id = a.id WHERE v.saldo_centimos IS DISTINCT FROM a.saldo * 100`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT a.id, a.saldo, v.saldo_centimos FROM cuentas a JOIN cuentas_v2 v ON v.id = a.id WHERE v.saldo_centimos IS DISTINCT FROM a.saldo * 100',
        columns: ['id', 'saldo', 'saldo_centimos'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Los emails a clientes empiezan con «Hola, Lucía» sin apellido', severity: 'low', explanation: 'Un nombre completo se migró sin apellidos.', technique: 'Comparar con el valor esperado de la regla.', preventedBy: 'reto.nombres' },
    { id: 'C-CARMEN', title: 'Un cliente deja de recibir los avisos de seguridad', severity: 'high', explanation: 'Su email se migró vacío y nadie lo vio.', technique: 'IS DISTINCT FROM: un NULL también es una diferencia.', preventedBy: 'reto.emails' },
    { id: 'C-NURIA', title: 'Un cliente premium pierde sus ventajas', severity: 'medium', explanation: 'El mapeo de segmentos cambió su valor.', technique: 'Comprobar el mapeo de cada valor, también el vacío.', preventedBy: 'reto.segmentos' },
    { id: 'C-DIEGO', title: 'Un cliente de Bilbao recibe ofertas de Málaga', severity: 'low', explanation: 'El ciudad_id apuntaba a otra ciudad.', technique: 'Resolver la tabla de mapeo y comparar el nombre.', preventedBy: 'reto.ciudades' },
    { id: 'C-INES', title: 'Tres saldos cambian al pasar al sistema nuevo', severity: 'high', explanation: 'La conversión a céntimos falló en tres cuentas (una perdió el signo).', technique: 'Valor esperado con la unidad nueva, cuenta a cuenta.', preventedBy: 'reto.saldos_centimos' },
    { id: 'C-RECUENTO', title: 'La migración se da por buena con un cliente perdido', severity: 'high', explanation: 'Los recuentos coincidían: faltaba uno y sobraba otro.', technique: 'Comparar las claves en los dos sentidos, no solo cuántas hay.', preventedBy: 'practice.claves' },
    { id: 'C-NULL', title: 'La validación automática no ve los valores que se quedan vacíos', severity: 'medium', explanation: 'Comparaba con <>, y algo <> NULL nunca es verdadero.', technique: 'IS DISTINCT FROM.', preventedBy: 'practice.distinct_from' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con la migración a v2.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.nombres', label: 'Nombres de Marta', explanation: 'nombre + apellidos.' },
      { flag: 'reto.emails', label: 'Emails de Carmen', explanation: 'Ningún email vacío.' },
      { flag: 'reto.segmentos', label: 'Segmentos de Nuria', explanation: 'Mapeo correcto.' },
      { flag: 'reto.ciudades', label: 'Ciudades de Diego', explanation: 'Tabla de ciudades.' },
      { flag: 'reto.saldos_centimos', label: 'Saldos de Inés', explanation: 'Céntimos con su signo.' },
      { flag: 'practice.claves', label: 'Claves, no recuentos', explanation: 'Faltan y sobran.' },
      { flag: 'practice.distinct_from', label: 'IS DISTINCT FROM', explanation: 'Los NULL cuentan.' },
    ],
  },

  concepts: [
    { id: 'esperado', title: 'El valor esperado', summary: 'Se calcula desde el origen con la regla de la especificación y se compara con lo migrado.' },
    { id: 'claves', title: 'Faltan y sobran', summary: 'Comparar las claves en los dos sentidos; un recuento igual puede esconder una que falta y otra que sobra.' },
    { id: 'distinct_from', title: 'IS DISTINCT FROM', summary: 'Compara tratando NULL como un valor: NULL frente a algo es distinto; NULL frente a NULL, igual.' },
    { id: 'mapeo', title: 'Mapeo de valores', summary: 'Cada valor antiguo tiene su valor nuevo, también el vacío: COALESCE para escribirlo.' },
    { id: 'tabla_mapeo', title: 'Tablas de mapeo', summary: 'Si el destino guarda un id, se resuelve con su tabla y se compara el valor de verdad.' },
    { id: 'unidades', title: 'Cambios de unidades', summary: 'Euros a céntimos, horas a minutos: el valor esperado se calcula con la unidad nueva, con signo y sin perder decimales.' },
    { id: 'todas_filas', title: 'Todas las filas', summary: 'Una muestra de diez clientes no valida una migración; la consulta compara todas.' },
  ],
  debriefConcepts: ['esperado', 'claves', 'distinct_from', 'mapeo', 'tabla_mapeo', 'unidades', 'todas_filas'],
  seniorTips: [
    'Lee la especificación de la migración en la wiki.',
    "Laura: NOT IN en los dos sentidos con UNION ALL, y 'falta' / 'sobra' como columna.",
    "Marta: v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos.",
    'Carmen: v.email IS DISTINCT FROM lower(trim(c.email)).',
    "Nuria: v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento').",
    'Diego: LEFT JOIN ciudades y ci.nombre IS DISTINCT FROM c.ciudad.',
    'Inés: cuentas JOIN cuentas_v2 y saldo_centimos IS DISTINCT FROM saldo * 100.',
    'Con Laura: claves en los dos sentidos y comparaciones que no se salten los NULL.',
  ],

  lessons: [
    {
      id: 'esperado',
      question: '¿Cómo valido una migración columna a columna?',
      conceptId: 'esperado',
      cost: 5,
      body: `Con la especificación en la mano: para cada columna nueva, calcula desde el origen el **valor esperado** y compáralo con el migrado.

\`\`\`
SELECT c.id
FROM clientes c JOIN clientes_v2 v ON v.id = c.id
WHERE v.nombre_completo IS DISTINCT FROM c.nombre || ' ' || c.apellidos;
\`\`\`

Cada consulta así es una prueba de una regla. Cero filas: la regla se cumple para **todos** los clientes, no solo para los que miraste.`,
    },
    {
      id: 'claves',
      question: '¿Por qué no basta con que los recuentos coincidan?',
      conceptId: 'claves',
      cost: 5,
      body: `Porque 40 = 40 también cuando falta el cliente 17 y sobra el 9999. Compara las **claves** en los dos sentidos:

\`\`\`
SELECT id, 'falta' AS problema FROM clientes WHERE id NOT IN (SELECT id FROM clientes_v2)
UNION ALL
SELECT id, 'sobra' FROM clientes_v2 WHERE id NOT IN (SELECT id FROM clientes);
\`\`\`

(O \`EXCEPT\` en los dos órdenes.) El recuento es un primer vistazo, no una validación.`,
    },
    {
      id: 'distinct_from',
      question: '¿Por qué IS DISTINCT FROM y no <>?',
      conceptId: 'distinct_from',
      cost: 5,
      body: `\`'ana@mail.com' <> NULL\` no es verdadero: es NULL. Así que un email que se migró **vacío** no sale con \`<>\`, justo el peor caso.

| a | b | a <> b | a IS DISTINCT FROM b |
|---|---|---|---|
| 'x' | 'y' | true | true |
| 'x' | NULL | NULL | **true** |
| NULL | NULL | NULL | false |

En las validaciones, \`IS DISTINCT FROM\` siempre.`,
    },
    {
      id: 'mapeo',
      question: '¿Cómo pruebo un mapeo de valores?',
      conceptId: 'mapeo',
      cost: 5,
      body: `Escribe el mapeo de la especificación como una expresión y compara:

\`\`\`
WHERE v.segmento IS DISTINCT FROM COALESCE(c.segmento, 'sin_segmento')
\`\`\`

Si el mapeo es más complejo, \`CASE c.segmento WHEN 'joven' THEN 'young' … END\`. Y prueba **todos** los valores del origen, también el vacío: es el que más se olvida.`,
    },
    {
      id: 'tabla_mapeo',
      question: '¿Cómo compruebo un id que apunta a otra tabla?',
      conceptId: 'tabla_mapeo',
      cost: 5,
      body: `El destino guarda \`ciudad_id\` = 7. Eso no se puede comparar con «Bilbao». Resuélvelo con la tabla:

\`\`\`
FROM clientes c
JOIN clientes_v2 v ON v.id = c.id
LEFT JOIN ciudades ci ON ci.id = v.ciudad_id
WHERE ci.nombre IS DISTINCT FROM c.ciudad
\`\`\`

El \`LEFT JOIN\` hace que un \`ciudad_id\` que no existe (o vacío) también salga como diferencia.`,
    },
    {
      id: 'unidades',
      question: '¿Qué puede fallar al cambiar de unidad?',
      conceptId: 'unidades',
      cost: 5,
      body: `De euros a céntimos: \`saldo × 100\`. Los fallos típicos:

- Olvidar la multiplicación (8617,21 € → 8617).
- Truncar en vez de redondear (146,95 → 14694).
- Perder el signo (−245,30 → 24530).

Ninguno se ve en un total «parecido». Compara cuenta a cuenta con el valor esperado en la unidad nueva.`,
    },
    {
      id: 'todas_filas',
      question: '¿No vale con revisar unos cuantos clientes?',
      conceptId: 'todas_filas',
      cost: 5,
      body: `Una muestra encuentra los errores **sistemáticos** (todos los nombres sin apellidos). Los errores de **una fila** (un email vacío, una ciudad cambiada) solo los encuentra una comparación de todas las filas.

Y con SQL cuesta lo mismo comparar 40 que 4 millones: la consulta es la misma. Deja la revisión a ojo para entender los datos, no para validarlos.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q5pre_rec', conceptId: 'claves', question: 'Origen y destino tienen 40 clientes. ¿La migración está completa?', options: ['Sí', 'No necesariamente: puede faltar uno y sobrar otro', 'Solo si los ids son correlativos', 'Sí, si no hay errores en el log'], correct: 1, explanation: 'Hay que comparar las claves.' },
      { id: 'q5pre_null', conceptId: 'distinct_from', question: "¿Qué da `'x' <> NULL`?", options: ['true', 'false', 'NULL', 'Error'], correct: 2, explanation: 'Por eso no sale en un WHERE.' },
      { id: 'q5pre_esp', conceptId: 'esperado', question: '¿Contra qué compruebas un valor migrado?', options: ['Contra lo que parezca razonable', 'Contra el valor esperado según la especificación, calculado desde el origen', 'Contra el valor del día anterior', 'Contra nada'], correct: 1, explanation: 'La regla es el oráculo.' },
      { id: 'q5pre_map', conceptId: 'mapeo', question: "Regla: «segmento vacío → 'sin_segmento'». ¿Qué expresión da el esperado?", options: ['c.segmento', "COALESCE(c.segmento, 'sin_segmento')", "NULLIF(c.segmento, 'sin_segmento')", "c.segmento || 'sin_segmento'"], correct: 1, explanation: 'COALESCE sustituye el NULL.' },
      { id: 'q5pre_uni', conceptId: 'unidades', question: '−245,30 € en céntimos es…', options: ['24530', '−24530', '−245', '245'], correct: 1, explanation: 'Con su signo.' },
      { id: 'q5pre_todas', conceptId: 'todas_filas', question: '¿Por qué comparar todas las filas y no una muestra?', options: ['Porque es más rápido', 'Porque los errores de una sola fila no salen en una muestra', 'Porque lo exige PostgreSQL', 'No hace falta'], correct: 1, explanation: 'Y en SQL cuesta lo mismo.' },
    ],
    post: [
      { id: 'q5post_idf', conceptId: 'distinct_from', question: '¿Qué da `NULL IS DISTINCT FROM NULL`?', options: ['true', 'false', 'NULL', 'Error'], correct: 1, explanation: 'Dos vacíos son iguales.' },
      { id: 'q5post_email', conceptId: 'distinct_from', question: 'Un email se migró vacío. ¿Lo encuentra `WHERE v.email <> lower(trim(c.email))`?', options: ['Sí', 'No', 'Solo si el origen también es NULL', 'Da error'], correct: 1, explanation: 'Hace falta IS DISTINCT FROM.' },
      { id: 'q5post_tabla', conceptId: 'tabla_mapeo', question: 'El destino guarda `ciudad_id`. ¿Cómo lo validas?', options: ['Comparando el número con el nombre', 'Resolviendo el id en ciudades y comparando el nombre', 'Contando ciudades', 'No se puede'], correct: 1, explanation: 'Con LEFT JOIN para no perder ids inexistentes.' },
      { id: 'q5post_except', conceptId: 'claves', question: '`SELECT id FROM clientes_v2 EXCEPT SELECT id FROM clientes`. ¿Qué devuelve?', options: ['Los que faltan', 'Los que sobran en el destino', 'Los que coinciden', 'Nada'], correct: 1, explanation: 'Hace falta también el otro orden.' },
      { id: 'q5post_uni', conceptId: 'unidades', question: '146,95 € migrado como 14694 céntimos. ¿Qué pasó?', options: ['Nada', 'Se truncó en vez de redondear (o se perdió un céntimo)', 'Se perdió el signo', 'Falta multiplicar'], correct: 1, explanation: 'Esperado: 14695.' },
      { id: 'q5post_map', conceptId: 'mapeo', question: 'El mapeo de segmentos se probó con premium, estándar y joven. ¿Qué valor falta?', options: ['Ninguno', 'El vacío (NULL)', 'Uno inventado', 'El primero'], correct: 1, explanation: 'El que más se olvida.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'La migración a v2',
      body: 'Buenos días.\n\nEste fin de semana Diego ha migrado clientes y cuentas al esquema nuevo (`clientes_v2`, `ciudades`, `cuentas_v2`). El viernes apagamos el viejo, así que QA tiene que validarlo **antes**. La especificación está en la wiki.\n\nLo primero, las claves:\n\n- Los ids de clientes que **faltan** en `clientes_v2` y los que **sobran** (están en v2 y no en `clientes`): `id` y `problema` (\'falta\' o \'sobra\').\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'claves' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.faltan_sobran' },
      body: 'Falta el 17 y sobra el 9999, un cliente de prueba que se coló. Y los dos recuentos daban 40. Apúntatelo.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_nombres',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: "¡Hola! Los emails de la app nueva saludan con el `nombre_completo`. Según la especificación es `nombre || ' ' || apellidos`. ¿Me sacas los clientes migrados que no lo cumplen? Una columna `id`.",
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'esperado' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.nombres' },
      body: 'El 8, sin apellidos. Uno solo, pero es un cliente con nombre y cara. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_emails',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Los avisos de seguridad van al email, así que para Riesgos es crítico. El nuevo tiene que ser `lower(trim(email))` del antiguo. ¿Cuáles no lo son, **incluido** si se quedó vacío? `id`, `email_origen` y `email_destino`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'distinct_from' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.emails' },
      body: 'El 22 con un email inventado y el 30 sin email. El 30 no recibiría ningún aviso de seguridad. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_recuento',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «40 de 40, migración OK»',
      body: '**Laura:** El informe de la migración que mandó el script de Rubén dice: «Clientes origen: 40. Clientes destino: 40. Cuentas: 52 y 52. **Migración OK**». ¿Lo firmas?',
      onDeliver: [],
      choices: [
        {
          id: 'claves',
          text: 'No. Un recuento igual no dice que sean **los mismos**: falta el 17 y sobra el 9999, y salen 40 y 40. Hay que comparar las **claves** en los dos sentidos y luego cada columna con su valor esperado. El recuento es solo un primer vistazo.',
          cost: 10,
          reply: 'Exacto. «40 = 40» es la validación más barata y la más engañosa.',
          effects: [
            { kind: 'flag', key: 'practice.claves' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Las claves en los dos sentidos, no solo los recuentos.' },
          ],
        },
        {
          id: 'ok',
          text: 'Sí: si están todos, la migración está bien.',
          cost: 10,
          reply: 'No están todos: falta uno y sobra otro. Y aunque estuvieran, falta mirar qué valores tienen.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Firmaste una migración por un recuento.' }],
        },
        {
          id: 'suma',
          text: 'Que además compare la suma de los ids.',
          cost: 10,
          reply: 'Mejor que nada, pero sigue siendo un resumen: dos errores pueden sumar lo mismo. Las claves, una a una.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiaste un resumen por otro resumen.' }],
        },
      ],
    },
    {
      id: 'nuria_segmentos',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: "Hola. Los clientes premium tienen línea prioritaria y la app nueva la da según el segmento de v2. Regla: el mismo, y **vacío → 'sin_segmento'**. ¿Cuáles están mal? `id`, `segmento_origen` y `segmento_destino`.",
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'mapeo' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.segmentos' },
      body: "El 2, premium pasado a estándar, y el 9, sin segmento pasado a estándar en vez de 'sin_segmento'. Al 2 le habríamos quitado la línea prioritaria. ¡Gracias!",
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_ciudades',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. La ciudad ahora es un `ciudad_id` que apunta a `ciudades`. Lo hice con un JOIN por nombre y quiero estar seguro: ¿qué clientes migrados apuntan a una ciudad que no es la suya? `id`, `ciudad_origen` y `ciudad_destino` (el nombre).',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'tabla_mapeo' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.ciudades' },
      body: 'El 1: Bilbao a Málaga. Un parche a mano que hice el domingo. Lo corrijo. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_centimos',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. En v2 los saldos se guardan en **céntimos** (`saldo_centimos` = saldo × 100, entero y con su signo). La suma total «se parece», pero no me fío. ¿Qué cuentas no cumplen la regla? `id`, `saldo` y `saldo_centimos`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'unidades' }, { kind: 'unlock', conceptId: 'todas_filas' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.saldos_centimos' },
      body: 'Tres: la 21 sin multiplicar, la 33 con un céntimo de menos y la 17, que ha perdido el signo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_null',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «a mí me sale solo el 22»',
      body: '**Laura:** Rubén ha hecho la comprobación de los emails así:\n\n`… WHERE v.email <> lower(trim(c.email))`\n\nY le sale solo el 22. Tú tienes también el 30. ¿Quién tiene razón?',
      onDeliver: [],
      choices: [
        {
          id: 'distinct',
          text: 'El 30 tiene el email nuevo **vacío** (NULL). `algo <> NULL` no es verdadero, es NULL, así que el WHERE lo descarta: justo el peor caso, un cliente sin email. Hay que comparar con `IS DISTINCT FROM`, que trata el NULL como un valor.',
          cost: 10,
          reply: 'Eso es. En una validación, un `<>` es una puerta abierta a los NULL. IS DISTINCT FROM, siempre.',
          effects: [
            { kind: 'flag', key: 'practice.distinct_from' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'IS DISTINCT FROM para comparar sin saltarse los NULL.' },
          ],
        },
        {
          id: 'ruben',
          text: 'Rubén: el 30 no tiene email, no hay nada que comparar.',
          cost: 10,
          reply: 'El 30 sí tenía email en el origen. Que se quede vacío al migrar es precisamente el defecto.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una comparación que se salta los NULL.' }],
        },
        {
          id: 'coalesce',
          text: "Que ponga `COALESCE(v.email, '')` y compare con `<>`.",
          cost: 10,
          reply: 'Funciona aquí, pero confunde «vacío» con «cadena vacía» y hay que acordarse en cada columna. IS DISTINCT FROM lo resuelve sin trucos.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Usaste un truco en vez de la comparación hecha para NULL.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Diez defectos en una migración que «estaba OK». ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una migración se valida contra la especificación: primero las claves en los dos sentidos (los recuentos engañan), luego cada columna con su valor esperado calculado desde el origen, con IS DISTINCT FROM para no saltarme los NULL, resolviendo las tablas de mapeo, los cambios de unidad con su signo, y siempre todas las filas.',
          reply: 'Muy bien. Mañana, otro tipo de oráculo: probar un informe que ya existe.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'muestra',
          text: 'Que basta con comparar los recuentos y revisar unos cuantos clientes a mano.',
          reply: 'Hoy eso habría dejado pasar casi todo. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con recuentos y una muestra a mano.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
