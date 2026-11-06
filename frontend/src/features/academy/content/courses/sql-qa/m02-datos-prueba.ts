import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN, exige } from './shared'

const ANONIMOS = "SELECT id, 'Cliente ' || id AS nombre, 'cliente' || id || '@ejemplo.test' AS email, ciudad, segmento FROM clientes WHERE id < 9000"

/**
 * Curso 8: SQL para QA · Misión 2 — Datos de prueba.
 *
 * Entorno de pruebas con escritura: fabricar datos con generate_series e
 * INSERT … SELECT, valores frontera, datos repartidos de forma conocida,
 * limpieza en el orden que piden las claves foráneas y una copia anonimizada.
 * Trampas: datos de prueba que se confunden con los reales y pruebas que
 * dependen de los datos de otras.
 */
export const m02DatosPrueba: Mission = {
  ...COMUN,
  id: 'm02-datos-prueba',
  number: 2,
  title: 'Datos de prueba',
  subtitle: 'generate_series, INSERT … SELECT, valores frontera, limpieza y datos anonimizados.',
  dayLabel: 'Miércoles · mes 4',
  verdicts: {
    good: {
      title: 'Datos a medida, y nada de basura',
      body: 'Cien clientes de prueba con sus cuentas, las tres transferencias de la frontera de 3.000 €, treinta incidencias repartidas por canal, todo borrado sin tocar lo real y una copia de clientes sin un solo dato personal. Y nadie confundirá tus datos con los de verdad.',
    },
    ok: {
      title: 'Datos de prueba a medias',
      body: 'Ya fabricas datos de prueba, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Pruebas sin datos (o con los de verdad)',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de datos de prueba a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Datos de prueba',
    paragraphs: [
      'Miércoles. Para probar los bordes de ayer hacen falta datos que los tengan, y a mano no se acaba nunca. Hoy fabricas datos de prueba con SQL en la **copia de pruebas**, y los quitas cuando ya no hacen falta.',
      'Los datos de prueba usan siempre ids **a partir de 9001** y el dominio **kobalto.test**, para que nadie los confunda con los reales. Cada encargo se cumple cuando la base de datos queda como se pide. Si algo sale mal, «Restaurar» la deja como al principio.',
    ],
    goals: [
      'Genera muchas filas de una vez con generate_series.',
      'Crea filas a partir de otras con INSERT … SELECT.',
      'Prepara los valores frontera de una regla.',
      'Reparte los datos de una forma conocida.',
      'Borra los datos de prueba en el orden que piden las claves foráneas.',
      'Haz una copia anonimizada de datos reales.',
    ],
  },

  docs: [
    {
      id: 'chuleta_datos',
      title: 'Chuleta: datos de prueba',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'generate_series' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Reglas de la casa
- Ids de prueba **a partir de 9001**. Emails en **@kobalto.test**.
- Nada de datos personales reales en las pruebas.

## Fabricar filas
\`\`\`
-- 100 filas numeradas
INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento)
SELECT 9000 + n, 'Prueba', 'QA ' || n, 'qa' || n || '@kobalto.test', 'Madrid', '2026-03-01', 'estandar'
FROM generate_series(1, 100) AS n;

-- Una fila por cada fila de otra tabla
INSERT INTO cuentas (…) SELECT … FROM clientes WHERE id BETWEEN 9001 AND 9100;
\`\`\`

## Repartir de forma conocida
- Alternar: \`CASE WHEN n % 2 = 1 THEN 'a' ELSE 'b' END\`
- Rotar una lista: \`(ARRAY['chat', 'telefono', 'email'])[1 + n % 3]\`
- Espaciar en el tiempo: \`TIMESTAMP '2026-02-01 09:00' + (n - 1) * INTERVAL '22 hours'\`

## Columnas de las tablas
- \`clientes(id, nombre, apellidos, email, ciudad, fecha_alta, segmento)\`
- \`cuentas(id, cliente_id, iban, tipo, saldo, moneda, abierta_en, estado)\` (\`iban\` único)
- \`transferencias(id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en)\`
- \`incidencias(id, cliente_id, canal, motivo, abierta_en, cerrada_en)\``,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: generate_series fabrica filas numeradas\nSELECT n, \'qa\' || n || \'@kobalto.test\' AS email\nFROM generate_series(1, 5) AS n;',
    retos: [
      {
        id: 'clientes_prueba',
        from: 'laura',
        title: 'Cien clientes de prueba',
        description: "Crea **100 clientes de prueba** con ids **9001 a 9100**, email `qa<n>@kobalto.test` (único para cada uno), ciudad `Madrid`, alta el `2026-03-01` y segmento `estandar`. Nombre y apellidos, los que quieras (por ejemplo `Prueba` y `QA <n>`).",
        hint: "`INSERT INTO clientes (…) SELECT 9000 + n, 'Prueba', 'QA ' || n, 'qa' || n || '@kobalto.test', 'Madrid', '2026-03-01', 'estandar' FROM generate_series(1, 100) AS n;`",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [exige(/\bgenerate_series\s*\(/i, 'Fabrica las cien filas de una vez con `generate_series(1, 100)`.')],
        state: [
          { query: "SELECT COUNT(*), COUNT(DISTINCT email), MIN(id), MAX(id), COUNT(*) FILTER (WHERE email LIKE 'qa%@kobalto.test' AND ciudad = 'Madrid' AND segmento = 'estandar' AND fecha_alta = '2026-03-01') FROM clientes WHERE id >= 9000", rows: [['100', '100', '9001', '9100', '100']] },
          { query: 'SELECT COUNT(*) FROM clientes WHERE id < 9000', rows: [['40']] },
        ],
      },
      {
        id: 'cuentas_prueba',
        from: 'marta',
        title: 'Una cuenta para cada cliente de prueba',
        description: "Una cuenta para cada uno de los 100 clientes de prueba: **mismo id que su cliente**, IBAN `ES00 QA <id>`, tipo **`corriente` para los ids impares y `ahorro` para los pares**, saldo **1.000 €**, abierta el `2026-03-01` y estado `activa`.",
        hint: "`INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado) SELECT id, id, 'ES00 QA ' || id, CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END, 1000, '2026-03-01', 'activa' FROM clientes WHERE id BETWEEN 9001 AND 9100;`",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [exige(/\binsert\s+into\s+cuentas\b[\s\S]*\bselect\b/i, 'Crea las cuentas a partir de los clientes con `INSERT INTO cuentas (…) SELECT … FROM clientes …`.')],
        state: [
          { query: "SELECT COUNT(*), COUNT(*) FILTER (WHERE id = cliente_id), COUNT(*) FILTER (WHERE tipo = CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END), SUM(saldo), COUNT(*) FILTER (WHERE estado = 'activa') FROM cuentas WHERE cliente_id BETWEEN 9001 AND 9100", rows: [['100', '100', '100', '100000.00', '100']] },
          { query: 'SELECT COUNT(*) FROM cuentas WHERE id < 9000', rows: [['52']] },
        ],
      },
      {
        id: 'valores_frontera',
        from: 'carmen',
        title: 'Las tres transferencias de la frontera',
        description: "La regla de Riesgos revisa las transferencias **de 3.000 € o más**. Crea las tres transferencias que prueban la frontera, de la cuenta **9001** a la **9002**: **2.999,99**, **3.000,00** y **3.000,01**, con ids **9001, 9002 y 9003**, estado `pendiente`, concepto el que quieras y fecha `2026-03-02 10:00`.",
        hint: "`INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, importe, concepto, estado, creada_en) VALUES (9001, 9001, 9002, 2999.99, 'QA frontera', 'pendiente', '2026-03-02 10:00'), (…), (…);`",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [exige(/\binsert\s+into\s+transferencias\b/i, 'Crea las transferencias con `INSERT INTO transferencias …`.')],
        state: [
          { query: "SELECT string_agg(id || ':' || importe, ',' ORDER BY id) FROM transferencias WHERE id >= 9000 AND cuenta_origen_id = 9001 AND cuenta_destino_id = 9002 AND estado = 'pendiente'", rows: [['9001:2999.99,9002:3000.00,9003:3000.01']] },
        ],
      },
      {
        id: 'incidencias_prueba',
        from: 'nuria',
        title: 'Treinta incidencias repartidas',
        description: "Crea **30 incidencias de prueba** (ids **9001 a 9030**), una para cada cliente de prueba del **9001 al 9030**, **abiertas** (sin cierre), con **10 por canal** (`chat`, `telefono`, `email`) y todas abiertas **en febrero de 2026**. El motivo, el que quieras.",
        hint: "`SELECT 9000 + i, 9000 + i, (ARRAY['chat', 'telefono', 'email'])[1 + i % 3], 'Prueba QA', TIMESTAMP '2026-02-01 09:00' + (i - 1) * INTERVAL '22 hours' FROM generate_series(1, 30) AS i`",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        requires: [exige(/\binsert\s+into\s+incidencias\b/i, 'Crea las incidencias con `INSERT INTO incidencias … SELECT …`.')],
        state: [
          { query: 'SELECT canal, COUNT(*) FROM incidencias WHERE id >= 9000 GROUP BY canal ORDER BY canal', rows: [['chat', '10'], ['email', '10'], ['telefono', '10']] },
          { query: "SELECT COUNT(*), MIN(id), MAX(id), COUNT(*) FILTER (WHERE cliente_id = id AND cerrada_en IS NULL AND abierta_en >= '2026-02-01' AND abierta_en < '2026-03-01') FROM incidencias WHERE id >= 9000", rows: [['30', '9001', '9030', '30']] },
        ],
      },
      {
        id: 'limpieza',
        from: 'diego',
        title: 'Todo limpio, sin tocar lo real',
        description: 'Borra **todos** los datos de prueba (ids **9001 o más**) de `transferencias`, `incidencias`, `cuentas` y `clientes`, **sin tocar** ni una fila real.',
        hint: 'Primero lo que depende de otras tablas: transferencias e incidencias, luego cuentas y al final clientes. `DELETE FROM … WHERE id >= 9000;`',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [exige(/\bdelete\b/i, 'Este encargo se cumple borrando: `DELETE FROM … WHERE id >= 9000`.')],
        state: [
          { query: 'SELECT (SELECT COUNT(*) FROM clientes WHERE id >= 9000) + (SELECT COUNT(*) FROM cuentas WHERE id >= 9000) + (SELECT COUNT(*) FROM transferencias WHERE id >= 9000) + (SELECT COUNT(*) FROM incidencias WHERE id >= 9000)', rows: [['0']] },
          { query: 'SELECT (SELECT COUNT(*) FROM clientes), (SELECT COUNT(*) FROM cuentas), (SELECT COUNT(*) FROM transferencias), (SELECT COUNT(*) FROM incidencias)', rows: [['40', '52', '131', '33']] },
        ],
      },
      {
        id: 'anonimos',
        from: 'ines',
        title: 'Una copia de clientes sin datos personales',
        description: "Crea la tabla **`clientes_anonimos`** con los **clientes reales** (`id` < 9000) y las columnas `id`, `nombre` (`Cliente <id>`), `email` (`cliente<id>@ejemplo.test`), `ciudad` y `segmento` (estas dos, las de verdad).",
        hint: `\`CREATE TABLE clientes_anonimos AS ${ANONIMOS};\``,
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [exige(/\bcreate\s+table\s+clientes_anonimos\b/i, 'Este encargo se cumple creando la tabla: `CREATE TABLE clientes_anonimos AS SELECT …`.')],
        state: [
          { query: "SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clientes_anonimos'", rows: [['id,nombre,email,ciudad,segmento']] },
          { query: `SELECT COUNT(*) FROM ((SELECT id, nombre, email, ciudad, segmento FROM clientes_anonimos EXCEPT ${ANONIMOS}) UNION ALL (${ANONIMOS} EXCEPT SELECT id, nombre, email, ciudad, segmento FROM clientes_anonimos)) d`, rows: [['0']] },
        ],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Las pruebas de cuentas fallan al azar porque no hay datos', severity: 'medium', explanation: 'Cada prueba buscaba cuentas «que hubiera» en vez de crear las suyas.', technique: 'INSERT … SELECT a partir de los clientes de prueba.', preventedBy: 'reto.cuentas_prueba' },
    { id: 'C-CARMEN', title: 'Una transferencia de 3.000 € exactos se salta la revisión de Riesgos', severity: 'high', explanation: 'Nadie probó el valor exacto de la frontera.', technique: 'Valores frontera: justo debajo, en el límite y justo encima.', preventedBy: 'reto.valores_frontera' },
    { id: 'C-NURIA', title: 'El panel de incidencias por canal solo se probó con chat', severity: 'low', explanation: 'Los datos de prueba no cubrían todos los canales.', technique: 'Repartir los datos de forma conocida.', preventedBy: 'reto.incidencias_prueba' },
    { id: 'C-DIEGO', title: 'Los informes de producción cuentan cien clientes que no existen', severity: 'high', explanation: 'Los datos de prueba se quedaron en la base de datos compartida.', technique: 'Limpiar en orden: hijos primero, padres después.', preventedBy: 'reto.limpieza' },
    { id: 'C-INES', title: 'Una base de datos de pruebas con emails reales llega a un proveedor', severity: 'high', explanation: 'Se copiaron los clientes tal cual.', technique: 'Anonimizar: sustituir los datos personales, conservar lo que importa para probar.', preventedBy: 'reto.anonimos' },
    { id: 'C-IDS', title: 'Un cliente real recibe un email de una prueba automática', severity: 'high', explanation: 'Los datos de prueba usaban ids y emails que existían de verdad.', technique: 'Rangos reservados y dominios de prueba (.test).', preventedBy: 'practice.identificables' },
    { id: 'C-ORDEN', title: 'Las pruebas pasan juntas y fallan una por una', severity: 'medium', explanation: 'Cada prueba usaba los datos que dejaba la anterior.', technique: 'Cada prueba prepara y limpia sus propios datos.', preventedBy: 'practice.independencia' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los datos de prueba del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.cuentas_prueba', label: 'Cuentas de Marta', explanation: 'Cada prueba con sus cuentas.' },
      { flag: 'reto.valores_frontera', label: 'Frontera de Carmen', explanation: '2.999,99 · 3.000 · 3.000,01.' },
      { flag: 'reto.incidencias_prueba', label: 'Canales de Nuria', explanation: 'Diez por canal.' },
      { flag: 'reto.limpieza', label: 'Limpieza de Diego', explanation: 'Sin restos de prueba.' },
      { flag: 'reto.anonimos', label: 'Copia de Inés', explanation: 'Sin datos personales.' },
      { flag: 'practice.identificables', label: 'Datos reconocibles', explanation: 'Ids 9001+ y kobalto.test.' },
      { flag: 'practice.independencia', label: 'Pruebas independientes', explanation: 'Cada una con sus datos.' },
    ],
  },

  concepts: [
    { id: 'generate_series', title: 'generate_series', summary: 'Devuelve una fila por número (o por fecha): la forma rápida de fabricar muchas filas.' },
    { id: 'insert_select', title: 'INSERT … SELECT', summary: 'Inserta el resultado de una consulta: una cuenta por cliente, una copia de otra tabla…' },
    { id: 'frontera', title: 'Valores frontera', summary: 'Justo debajo, en el límite y justo encima: donde fallan los «>» que deberían ser «>=».' },
    { id: 'reparto', title: 'Repartir de forma conocida', summary: 'Con %, CASE y arrays, los datos cubren todos los casos y sabes cuántos hay de cada uno.' },
    { id: 'identificables', title: 'Datos de prueba identificables', summary: 'Rangos de ids reservados y dominios .test: nadie los confunde con los reales y se limpian fácil.' },
    { id: 'limpieza', title: 'Limpiar en orden', summary: 'Las claves foráneas obligan a borrar primero los hijos (transferencias, cuentas) y luego los padres (clientes).' },
    { id: 'anonimizar', title: 'Anonimizar', summary: 'Sustituir los datos personales y conservar lo que importa para probar (ciudad, segmento, relaciones).' },
  ],
  debriefConcepts: ['generate_series', 'insert_select', 'frontera', 'reparto', 'identificables', 'limpieza', 'anonimizar'],
  seniorTips: [
    'Lee la chuleta de datos de prueba en la wiki.',
    "Laura: INSERT INTO clientes … SELECT 9000 + n, … FROM generate_series(1, 100) AS n.",
    "Marta: INSERT INTO cuentas … SELECT id, id, 'ES00 QA ' || id, CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END, 1000, … FROM clientes WHERE id BETWEEN 9001 AND 9100.",
    'Carmen: tres filas con VALUES: 2999.99, 3000.00 y 3000.01.',
    "Nuria: (ARRAY['chat', 'telefono', 'email'])[1 + i % 3] y fechas espaciadas 22 horas desde el 1 de febrero.",
    'Diego: DELETE de transferencias e incidencias, después de cuentas y al final de clientes, siempre con id >= 9000.',
    "Inés: CREATE TABLE clientes_anonimos AS SELECT id, 'Cliente ' || id AS nombre, … FROM clientes WHERE id < 9000.",
    'Con Laura: datos reconocibles y pruebas que no dependen de las demás.',
  ],

  lessons: [
    {
      id: 'generate_series',
      question: '¿Cómo fabrico cien filas sin escribirlas?',
      conceptId: 'generate_series',
      cost: 5,
      body: `\`generate_series(1, 100)\` devuelve cien filas con los números del 1 al 100. Úsalo en el FROM y construye cada columna a partir del número:

\`\`\`
SELECT 9000 + n AS id, 'qa' || n || '@kobalto.test' AS email
FROM generate_series(1, 100) AS n;
\`\`\`

También genera fechas: \`generate_series(TIMESTAMP '2026-02-01', TIMESTAMP '2026-02-28', INTERVAL '1 day')\`. Primero mira el SELECT; cuando sea lo que quieres, ponle delante el \`INSERT INTO … (columnas)\`.`,
    },
    {
      id: 'insert_select',
      question: '¿Cómo creo una cuenta para cada cliente de prueba?',
      conceptId: 'insert_select',
      cost: 5,
      body: `Con \`INSERT … SELECT\`: el SELECT devuelve una fila por cliente y cada fila se inserta como una cuenta.

\`\`\`
INSERT INTO cuentas (id, cliente_id, iban, tipo, saldo, abierta_en, estado)
SELECT id, id, 'ES00 QA ' || id,
       CASE WHEN id % 2 = 1 THEN 'corriente' ELSE 'ahorro' END,
       1000, '2026-03-01', 'activa'
FROM clientes
WHERE id BETWEEN 9001 AND 9100;
\`\`\`

Las columnas del SELECT van en el mismo orden que la lista del INSERT. Las que no pongas toman su valor por defecto (aquí, \`moneda\` = EUR).`,
    },
    {
      id: 'frontera',
      question: '¿Qué valores pruebo para una regla de «3.000 € o más»?',
      conceptId: 'frontera',
      cost: 5,
      body: `Los de la **frontera**: justo debajo, justo en el límite y justo encima.

| Importe | Debe |
|---|---|
| 2.999,99 | no revisar |
| 3.000,00 | revisar |
| 3.000,01 | revisar |

Si alguien escribió \`> 3000\` en vez de \`>= 3000\`, solo el caso de 3.000,00 lo destapa. Probar con 100 € y con 10.000 € no encuentra nunca ese error.`,
    },
    {
      id: 'reparto',
      question: '¿Cómo reparto los datos para cubrir todos los casos?',
      conceptId: 'reparto',
      cost: 5,
      body: `Con el número de la fila:

- Alternar dos valores: \`CASE WHEN n % 2 = 1 THEN 'corriente' ELSE 'ahorro' END\`
- Rotar una lista: \`(ARRAY['chat', 'telefono', 'email'])[1 + n % 3]\` (los arrays empiezan en 1)
- Espaciar en el tiempo: \`TIMESTAMP '2026-02-01 09:00' + (n - 1) * INTERVAL '22 hours'\`

Así sabes de antemano cuántas filas hay de cada caso: el resultado esperado de la prueba sale de los datos.`,
    },
    {
      id: 'identificables',
      question: '¿Por qué ids a partir de 9001 y emails .test?',
      conceptId: 'identificables',
      cost: 5,
      body: `Para que los datos de prueba sean **inconfundibles**:

- Un **rango de ids reservado** no choca con los reales y se borra con un \`WHERE id >= 9000\`.
- El dominio **.test** (como \`.example\`) está reservado: ningún email de prueba puede llegar a una persona.
- Un nombre reconocible (\`Prueba\`, \`QA 17\`) avisa a quien lo vea en un informe.

Si tus datos de prueba pueden pasar por reales, tarde o temprano alguien los tratará como reales.`,
    },
    {
      id: 'limpieza',
      question: '¿Por qué falla el DELETE de los clientes de prueba?',
      conceptId: 'limpieza',
      cost: 5,
      body: `Porque tienen cuentas, y la clave foránea \`cuentas.cliente_id\` no deja borrar un cliente con cuentas. Hay que borrar **de los hijos a los padres**:

\`\`\`
DELETE FROM transferencias WHERE id >= 9000;
DELETE FROM incidencias    WHERE id >= 9000;
DELETE FROM cuentas        WHERE id >= 9000;
DELETE FROM clientes       WHERE id >= 9000;
\`\`\`

El error de clave foránea te está protegiendo: no lo quites, cambia el orden. Y antes de cada DELETE, el mismo WHERE con un SELECT.`,
    },
    {
      id: 'anonimizar',
      question: '¿Cómo uso datos reales para probar sin exponer a nadie?',
      conceptId: 'anonimizar',
      cost: 5,
      body: `**Anonimizándolos**: sustituye lo que identifica a una persona y conserva lo que importa para la prueba.

\`\`\`
CREATE TABLE clientes_anonimos AS
SELECT id,
       'Cliente ' || id AS nombre,
       'cliente' || id || '@ejemplo.test' AS email,
       ciudad, segmento
FROM clientes WHERE id < 9000;
\`\`\`

Se mantienen la ciudad, el segmento y el id (para cruzar con otras tablas); desaparecen el nombre y el email. Si el id también es sensible, se sustituye por otro de forma consistente.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q2pre_gs', conceptId: 'generate_series', question: '¿Cuántas filas devuelve `generate_series(1, 100)`?', options: ['1', '100', '99', '101'], correct: 1, explanation: 'Una por número, incluidos el 1 y el 100.' },
      { id: 'q2pre_is', conceptId: 'insert_select', question: '¿Qué hace `INSERT INTO cuentas (…) SELECT … FROM clientes WHERE id > 9000`?', options: ['Copia la tabla clientes', 'Inserta una cuenta por cada cliente que devuelva el SELECT', 'Da error', 'Actualiza las cuentas'], correct: 1, explanation: 'Cada fila del SELECT es una fila nueva.' },
      { id: 'q2pre_frontera', conceptId: 'frontera', question: 'Regla: «revisar desde 3.000 €». ¿Qué importes prueban la frontera?', options: ['100 y 10.000', '2.999,99, 3.000 y 3.000,01', '0 y 3.000', 'Solo 3.000'], correct: 1, explanation: 'Debajo, en el límite y encima.' },
      { id: 'q2pre_ids', conceptId: 'identificables', question: '¿Por qué usar emails @kobalto.test en las pruebas?', options: ['Porque son más cortos', 'Porque .test está reservado y no llegan a nadie', 'Porque es obligatorio en PostgreSQL', 'Da igual'], correct: 1, explanation: 'Ningún correo de prueba llega a una persona real.' },
      { id: 'q2pre_fk', conceptId: 'limpieza', question: '`DELETE FROM clientes WHERE id >= 9000` da error de clave foránea. ¿Por qué?', options: ['Porque no hay clientes', 'Porque esos clientes tienen cuentas', 'Porque falta un COMMIT', 'Porque el id es texto'], correct: 1, explanation: 'Primero los hijos.' },
      { id: 'q2pre_anon', conceptId: 'anonimizar', question: '¿Qué conserva una copia anonimizada de clientes?', options: ['Nada', 'Lo que importa para probar (ciudad, segmento, relaciones) sin datos personales', 'Los emails reales', 'Solo los ids'], correct: 1, explanation: 'Sustituye lo que identifica a la persona.' },
    ],
    post: [
      { id: 'q2post_arr', conceptId: 'reparto', question: '¿Qué devuelve `(ARRAY[\'chat\', \'telefono\', \'email\'])[1 + n % 3]` para n = 3?', options: ['chat', 'telefono', 'email', 'NULL'], correct: 0, explanation: '3 % 3 = 0 → posición 1.' },
      { id: 'q2post_orden', conceptId: 'limpieza', question: '¿En qué orden borras transferencias, cuentas y clientes de prueba?', options: ['Clientes, cuentas, transferencias', 'Transferencias, cuentas, clientes', 'Da igual', 'Solo clientes, con CASCADE'], correct: 1, explanation: 'De los hijos a los padres.' },
      { id: 'q2post_dep', conceptId: 'identificables', question: 'Las pruebas usan los ids 1 a 100. ¿Qué riesgo hay?', options: ['Ninguno', 'Chocar con datos reales y no poder limpiar sin tocar lo real', 'Que vayan lentas', 'Que falte un índice'], correct: 1, explanation: 'Rango reservado.' },
      { id: 'q2post_front', conceptId: 'frontera', question: 'El código dice `importe > 3000` y la regla «desde 3.000 €». ¿Qué prueba lo destapa?', options: ['2.999,99', '3.000,00', '3.000,01', '10.000'], correct: 1, explanation: 'Solo el valor exacto del límite.' },
      { id: 'q2post_gs', conceptId: 'generate_series', question: '¿Cómo pruebas lo que vas a insertar antes de insertarlo?', options: ['No se puede', 'Lanzando primero el SELECT solo', 'Con ROLLBACK siempre', 'Con EXPLAIN'], correct: 1, explanation: 'Cuando el SELECT esté bien, le pones el INSERT delante.' },
      { id: 'q2post_anon', conceptId: 'anonimizar', question: '¿Por qué no copiar los clientes reales tal cual a un entorno de pruebas?', options: ['Ocupan mucho', 'Expone datos personales a quien no debería verlos', 'Es más lento', 'No se puede en PostgreSQL'], correct: 1, explanation: 'Y los entornos de pruebas se comparten con más gente.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Fabricar datos',
      body: 'Buenos días.\n\nAyer encontraste los bordes; hoy toca fabricar datos que los tengan. Estás en la **copia de pruebas**: puedes crear y borrar. Reglas de la casa: ids de prueba **a partir de 9001** y emails en **@kobalto.test**.\n\nPara empezar:\n\n- **100 clientes de prueba**, ids 9001 a 9100, email `qa<n>@kobalto.test`, ciudad Madrid, alta el 1 de marzo de 2026 y segmento estándar. Con `generate_series`, nada de escribirlos uno a uno.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'generate_series' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.clientes_prueba' },
      body: 'Cien clientes en una sentencia. Y como empiezan en 9001, sabemos en todo momento cuáles son de prueba.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_cuentas',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Para probar la pantalla de cuentas necesito **una cuenta para cada cliente de prueba**: mismo id que su cliente, IBAN `ES00 QA <id>`, **corriente** los impares y **ahorro** los pares, 1.000 € de saldo, abierta el 1 de marzo y activa.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'insert_select' }, { kind: 'unlock', conceptId: 'reparto' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.cuentas_prueba' },
      body: 'Cincuenta corrientes y cincuenta de ahorro. Ahora mis pruebas no dependen de las cuentas que haya. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_frontera',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Diego ha cambiado la regla que manda a revisión las transferencias **de 3.000 € o más**. Quiero probarla justo en la frontera: de la cuenta 9001 a la 9002, **2.999,99**, **3.000,00** y **3.000,01**, con ids 9001, 9002 y 9003, pendientes y con fecha del 2 de marzo a las 10:00.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'frontera' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.valores_frontera' },
      body: 'Lanzada la regla: la de 3.000,00 no va a revisión. Diego puso «mayor que». Sin tu caso exacto no lo habríamos visto. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_ids',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «mis datos parecen de verdad»',
      body: '**Laura:** Rubén se ha hecho sus propios datos de prueba para la app. Está orgulloso: «parecen de verdad». Usa los ids del **1 al 100** y emails como `maria.lopez@gmail.com`. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'identificables',
          text: 'Que los datos de prueba tienen que ser **inconfundibles**: los ids 1 a 100 ya existen y chocan con clientes reales (y luego no puede borrar los suyos sin tocar los de verdad), y un email de gmail puede ser de alguien: una prueba que mande avisos le escribiría. Rango reservado (9001+) y un dominio de prueba (.test).',
          cost: 10,
          reply: 'Exacto. Realistas en la forma, sí; confundibles con los reales, nunca.',
          effects: [
            { kind: 'flag', key: 'practice.identificables' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Datos de prueba con ids reservados y dominios .test.' },
          ],
        },
        {
          id: 'real',
          text: 'Que está muy bien: cuanto más reales, mejores pruebas.',
          cost: 10,
          reply: '¿Y cuando la prueba de avisos le escriba a una tal María López que existe? ¿O cuando borre sus «datos de prueba» con WHERE id <= 100?',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste datos de prueba que se confunden con los reales.' }],
        },
        {
          id: 'prod',
          text: 'Que mejor copie los clientes de producción, que son más realistas todavía.',
          cost: 10,
          reply: 'Eso es justo lo que no se puede hacer con datos personales. Si hacen falta datos reales, anonimizados.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste usar datos personales reales para probar.' }],
        },
      ],
    },
    {
      id: 'nuria_incidencias',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Quiero probar el panel de incidencias por canal. Necesito **30 incidencias de prueba**, ids 9001 a 9030, una para cada cliente de prueba del 9001 al 9030, **abiertas**, **10 por canal** (chat, teléfono y email) y todas abiertas **en febrero**.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.incidencias_prueba' },
      body: 'El panel enseña 10, 10 y 10. Antes solo lo habíamos probado con chat. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_limpieza',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Esta noche se copia la base de datos de pruebas para los informes de la semana y no quiero ni un dato de prueba ahí. ¿Borras **todo** lo de ids **9001 o más** de transferencias, incidencias, cuentas y clientes? Sin tocar nada real, claro.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'limpieza' }, { kind: 'unlock', conceptId: 'identificables' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.limpieza' },
      body: 'Cero filas de prueba y las reales como estaban: 40 clientes, 52 cuentas. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_anonimos',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. Un proveedor va a probar nuestra integración y necesita una tabla de clientes con datos **realistas**, pero **sin datos personales**. Crea `clientes_anonimos` con los clientes reales (id < 9000): `id`, `nombre` = `Cliente <id>`, `email` = `cliente<id>@ejemplo.test`, y la `ciudad` y el `segmento` de verdad.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'anonimizar' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.anonimos' },
      body: 'Cuarenta clientes, con su ciudad y su segmento, y ni un nombre ni un email reales. Esto sí se lo puedo mandar. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_dependencias',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «juntas pasan, por separado fallan»',
      body: '**Laura:** Las pruebas automáticas de Rubén pasan todas cuando se lanzan juntas. Pero si lanzas solo la de «cerrar cuenta», falla: usa la cuenta que crea la prueba de «abrir cuenta». ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'independencia',
          text: 'Que cada prueba tiene que **preparar sus propios datos** y **limpiarlos** al acabar (o ir dentro de una transacción que se deshace). Si una depende de lo que deja otra, el resultado cambia según el orden y no se puede lanzar una sola cuando falla.',
          cost: 10,
          reply: 'Eso es. Una prueba que solo funciona acompañada no te dice nada cuando falla.',
          effects: [
            { kind: 'flag', key: 'practice.independencia' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Cada prueba prepara y limpia sus datos.' },
          ],
        },
        {
          id: 'orden',
          text: 'Que las lance siempre juntas y en el mismo orden.',
          cost: 10,
          reply: 'Hasta que alguien añada una prueba en medio, o las lance en paralelo. Y cuando una falle, no podrá repetir solo esa.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste pruebas que dependen del orden.' }],
        },
        {
          id: 'fijos',
          text: 'Que deje cuentas fijas en la base de datos para todas las pruebas.',
          cost: 10,
          reply: 'Y en cuanto una prueba cambie esa cuenta, las demás heredan el cambio. Datos compartidos, pruebas que se pisan.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste datos compartidos entre pruebas.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Has fabricado y limpiado más de doscientas filas sin tocar lo real. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que con generate_series e INSERT … SELECT se fabrican muchos datos en una sentencia; que hay que probar la frontera exacta; que los datos se reparten para cubrir todos los casos; que tienen que ser inconfundibles (ids reservados, .test); que se limpian de los hijos a los padres; que lo real se anonimiza; y que cada prueba prepara sus propios datos.',
          reply: 'Muy bien. Mañana, las pruebas que se lanzan solas cada noche: consultas que deben dar cero.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'prod',
          text: 'Que lo más rápido es copiar los datos de producción y probar con ellos.',
          reply: 'Rápido y peligroso: datos personales y pruebas que no controlas. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con probar con datos de producción.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
