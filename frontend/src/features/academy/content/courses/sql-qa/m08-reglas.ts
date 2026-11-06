import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN, exige } from './shared'

const INSERT = 'INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES'
const INTACTA = { query: 'SELECT COUNT(*) FROM solicitudes', rows: [['5']] }
const PROBAR = exige(/\bprobar\s*\(/i, 'Cada caso se prueba con `probar(…)`, que ejecuta la sentencia, dice qué pasó y lo deshace.')

/**
 * Curso 8: SQL para QA · Misión 8 — Probar las reglas de la base de datos.
 *
 * `solicitudes` tiene reglas que no cumplen la especificación: el importe deja
 * fuera 1.000 y 60.000, el plazo y el cliente aceptan NULL, el estado nuevo
 * «en_estudio» no entra, nada impide dos solicitudes abiertas del mismo
 * cliente y el trigger de `revisada_en` solo salta al insertar. El alumno
 * prueba cada regla con `probar(…)` y `efecto(…)`, que siempre deshacen.
 * Trampas: probar solo lo válido y pruebas que dejan datos detrás.
 */
export const m08Reglas: Mission = {
  ...COMUN,
  id: 'm08-reglas',
  number: 8,
  title: 'Probar las reglas de la base de datos',
  subtitle: 'Restricciones y triggers puestos a prueba: lo que debe entrar, lo que no y sin dejar rastro.',
  dayLabel: 'Jueves · mes 4, semana 2',
  verdicts: {
    good: {
      title: 'Las reglas, a prueba',
      body: 'Probaste cada regla de `solicitudes` por los dos lados y en sus fronteras: los importes de 1.000 y 60.000 rechazados, el plazo y el cliente que aceptan vacíos, el estado nuevo que no entra, dos solicitudes abiertas del mismo cliente y un trigger que no salta al modificar. Y la tabla quedó como estaba.',
    },
    ok: {
      title: 'Reglas probadas a medias',
      body: 'Ya pruebas reglas de la base de datos, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Las reglas siguen sin probar',
      body: 'Varios encargos se quedaron sin hacer y las reglas rotas siguen en producción. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Probar las reglas de la base de datos',
    paragraphs: [
      'Jueves. Diego ha puesto las reglas de `solicitudes` (las solicitudes de préstamo) directamente en la base de datos: restricciones y un trigger. Antes de que la app nueva confíe en ellas, QA las prueba.',
      'Tienes dos funciones de prueba: `probar(\'sentencia\', …)` ejecuta, te dice `ok` o el **código de error** (SQLSTATE) y lo **deshace**; `efecto(ARRAY[\'sentencia\', …], \'consulta\')` ejecuta, te devuelve lo que diga la consulta y lo **deshace**. Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas, y `solicitudes` sigue con sus 5 filas.',
    ],
    goals: [
      'Prueba cada regla por los dos lados: lo que debe entrar y lo que no.',
      'Prueba las fronteras exactas de cada rango.',
      'Prueba los valores vacíos (NULL) en cada columna obligatoria.',
      'Prueba las reglas de negocio que cruzan filas.',
      'Prueba los triggers en cada operación que deberían cubrir.',
      'Deja los datos como estaban después de cada prueba.',
    ],
  },

  docs: [
    {
      id: 'chuleta_reglas',
      title: 'Solicitudes de préstamo: especificación y pruebas',
      updatedLabel: 'Marta Sanz · Product Owner Pagos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'dos_lados' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Especificación de \`solicitudes\`
| Columna | Regla |
|---|---|
| \`cliente_id\` | **obligatorio** y tiene que existir en \`clientes\` |
| \`importe\` | **obligatorio**, de **1.000 a 60.000 €, ambos incluidos** |
| \`plazo_meses\` | **obligatorio**: 12, 24, 36, 48 o 60 |
| \`estado\` | **obligatorio**: abierta, **en_estudio**, aprobada, rechazada o cancelada (en minúsculas) |
| \`revisada_en\` | la hora actual al **crear** y al **modificar** la solicitud |

Y además: un cliente puede tener **una sola** solicitud **abierta**.

## Cómo se prueba
\`\`\`
SELECT probar('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, 1000, 24, ''abierta'')');
\`\`\`
Devuelve \`ok\` o el código: **23514** CHECK, **23502** NOT NULL, **23503** clave foránea, **23505** UNIQUE.

Varios casos de una vez, con una tabla de casos y \`format\` (\`%L\` escribe el valor entre comillas, o NULL):
\`\`\`
SELECT v.importe,
       probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, %L, 24, %L)', v.importe, 'abierta')) AS resultado
FROM (VALUES (999.99), (1000.00)) AS v(importe);
\`\`\`

Para un trigger, \`efecto\`: hace los cambios, lee y deshace.
\`\`\`
SELECT efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'],
              'SELECT revisada_en::text FROM solicitudes WHERE id = 1');
\`\`\``,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: "-- Las reglas que tiene hoy solicitudes\nSELECT conname, pg_get_constraintdef(oid)\nFROM pg_constraint\nWHERE conrelid = 'solicitudes'::regclass;",
    retos: [
      {
        id: 'importes',
        from: 'laura',
        title: 'Las fronteras del importe',
        description: 'Prueba a crear una solicitud del cliente 2 (24 meses, abierta) con importe **999.99**, **1000.00**, **60000.00** y **60000.01**: una fila por caso con `importe` y `resultado` (lo que devuelve `probar`).',
        hint: "`FROM (VALUES (999.99), (1000.00), (60000.00), (60000.01)) AS v(importe)` y `probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, %L, 24, %L)', v.importe, 'abierta'))`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `SELECT v.importe, probar(format('${INSERT} (2, %L, 24, %L)', v.importe, 'abierta')) AS resultado FROM (VALUES (999.99), (1000.00), (60000.00), (60000.01)) AS v(importe)`,
        columns: ['importe', 'resultado'],
        requires: [PROBAR],
        state: [INTACTA],
      },
      {
        id: 'plazos',
        from: 'marta',
        title: 'Plazos que no deberían entrar',
        description: 'Prueba a crear una solicitud del cliente 2 (5000 €, abierta) con plazo **18**, **24** y **vacío** (NULL): `plazo` y `resultado`.',
        hint: "`FROM (VALUES (18), (24), (NULL)) AS v(plazo)` y `%L` en el `format`, que escribe NULL sin comillas.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `SELECT v.plazo, probar(format('${INSERT} (2, 5000, %L, %L)', v.plazo, 'abierta')) AS resultado FROM (VALUES (18), (24), (NULL)) AS v(plazo)`,
        columns: ['plazo', 'resultado'],
        requires: [PROBAR],
        state: [INTACTA],
      },
      {
        id: 'clientes',
        from: 'carmen',
        title: 'Solicitudes sin cliente',
        description: 'Prueba a crear una solicitud (5000 €, 24 meses, abierta) para el cliente **999** (no existe), **ninguno** (NULL) y el **3**: `cliente_id` y `resultado`.',
        hint: "`FROM (VALUES (999), (NULL), (3)) AS v(cliente_id)` y `format('… VALUES (%L, 5000, 24, %L)', v.cliente_id, 'abierta')`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: `SELECT v.cliente_id, probar(format('${INSERT} (%L, 5000, 24, %L)', v.cliente_id, 'abierta')) AS resultado FROM (VALUES (999), (NULL), (3)) AS v(cliente_id)`,
        columns: ['cliente_id', 'resultado'],
        requires: [PROBAR],
        state: [INTACTA],
      },
      {
        id: 'abiertas',
        from: 'nuria',
        title: 'Dos solicitudes abiertas',
        description: 'El cliente 1 ya tiene una solicitud abierta. Prueba a crear (5000 €, 24 meses) una **abierta** del cliente **1**, una **cancelada** del cliente **1** y una **abierta** del cliente **2**: `cliente_id`, `estado` y `resultado`.',
        hint: "`FROM (VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta')) AS v(cliente_id, estado)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: `SELECT v.cliente_id, v.estado, probar(format('${INSERT} (%s, 5000, 24, %L)', v.cliente_id, v.estado)) AS resultado FROM (VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta')) AS v(cliente_id, estado)`,
        columns: ['cliente_id', 'estado', 'resultado'],
        requires: [PROBAR],
        state: [INTACTA],
      },
      {
        id: 'revision',
        from: 'diego',
        title: 'El trigger de revisada_en',
        description: "Una fila con dos columnas, las dos con `efecto`: `al_insertar`, al crear una solicitud del cliente 6 (5000 €, 24 meses, abierta), si su `revisada_en` está informada (`(revisada_en IS NOT NULL)::text`); y `al_actualizar`, al cambiar a 6000 el importe de la solicitud 1, si su `revisada_en` **ha cambiado** (`(revisada_en <> '2026-02-21 10:00')::text`).",
        hint: "`SELECT efecto(ARRAY['INSERT …'], 'SELECT (revisada_en IS NOT NULL)::text FROM solicitudes WHERE cliente_id = 6') AS al_insertar, efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'], 'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1') AS al_actualizar`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: `SELECT efecto(ARRAY['${INSERT} (6, 5000, 24, ''abierta'')'], 'SELECT (revisada_en IS NOT NULL)::text FROM solicitudes WHERE cliente_id = 6') AS al_insertar, efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'], 'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1') AS al_actualizar`,
        columns: ['al_insertar', 'al_actualizar'],
        requires: [exige(/\befecto\s*\(/i, 'Un trigger se prueba por su efecto: `efecto(ARRAY[…], \'SELECT …\')` hace el cambio, lee y lo deshace.')],
        state: [INTACTA],
      },
      {
        id: 'estados',
        from: 'ines',
        title: 'Los estados de la solicitud',
        description: "Prueba a crear una solicitud del cliente 2 (5000 €, 24 meses) con estado **abierta**, **en_estudio**, **APROBADA** y **vacío** (NULL): `estado` y `resultado`.",
        hint: "`FROM (VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL)) AS v(estado)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: `SELECT v.estado, probar(format('${INSERT} (2, 5000, 24, %L)', v.estado)) AS resultado FROM (VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL)) AS v(estado)`,
        columns: ['estado', 'resultado'],
        requires: [PROBAR],
        state: [INTACTA],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Entra una solicitud sin plazo y el cuadro de cuotas sale vacío', severity: 'high', explanation: 'El CHECK del plazo deja pasar NULL y nadie probó el valor vacío.', technique: 'Probar NULL en cada columna obligatoria.', preventedBy: 'reto.plazos' },
    { id: 'C-CARMEN', title: 'Aparecen solicitudes de préstamo sin cliente', severity: 'high', explanation: 'La clave foránea no impide NULL: hacía falta NOT NULL.', technique: 'Probar el cliente inexistente y el vacío.', preventedBy: 'reto.clientes' },
    { id: 'C-NURIA', title: 'Un cliente con dos solicitudes abiertas recibe dos ofertas distintas', severity: 'medium', explanation: 'La regla «una sola abierta» no estaba en la base de datos.', technique: 'Probar las reglas que cruzan filas.', preventedBy: 'reto.abiertas' },
    { id: 'C-DIEGO', title: 'La cola de revisión no ve las solicitudes modificadas', severity: 'medium', explanation: 'El trigger de revisada_en solo salta al insertar.', technique: 'Probar el trigger en cada operación con efecto().', preventedBy: 'reto.revision' },
    { id: 'C-INES', title: 'Las solicitudes no pueden pasar a «en estudio»', severity: 'medium', explanation: 'El CHECK de estados no se actualizó con el estado nuevo.', technique: 'Un caso por cada valor de la especificación.', preventedBy: 'reto.estados' },
    { id: 'C-FELIZ', title: 'Rechazan los préstamos de 1.000 y 60.000 € justos', severity: 'high', explanation: 'Las pruebas solo usaban importes normales y el CHECK tenía < en vez de <=.', technique: 'Fronteras exactas por los dos lados.', preventedBy: 'practice.dos_lados' },
    { id: 'C-RESTOS', title: 'Las pruebas de reglas fallan la segunda vez que se ejecutan', severity: 'medium', explanation: 'Dejaban solicitudes creadas, y la siguiente ejecución chocaba con ellas.', technique: 'Cada prueba se deshace: transacción con ROLLBACK, probar o efecto.', preventedBy: 'practice.deshacer' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las reglas de las solicitudes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.plazos', label: 'Plazos de Marta', explanation: 'Sin plazo, no entra.' },
      { flag: 'reto.clientes', label: 'Clientes de Carmen', explanation: 'Sin cliente, no entra.' },
      { flag: 'reto.abiertas', label: 'Ofertas de Nuria', explanation: 'Una sola abierta.' },
      { flag: 'reto.revision', label: 'Trigger de Diego', explanation: 'También al modificar.' },
      { flag: 'reto.estados', label: 'Estados de Inés', explanation: 'en_estudio permitido.' },
      { flag: 'practice.dos_lados', label: 'Fronteras', explanation: 'Lo válido y lo inválido.' },
      { flag: 'practice.deshacer', label: 'Sin restos', explanation: 'Cada prueba se deshace.' },
    ],
  },

  concepts: [
    { id: 'dos_lados', title: 'Probar por los dos lados', summary: 'Una regla se prueba con lo que debe entrar y con lo que no; y en las fronteras, justo dentro y justo fuera.' },
    { id: 'sqlstate_qa', title: 'El código de error', summary: '23514 CHECK, 23502 NOT NULL, 23503 clave foránea, 23505 UNIQUE: el resultado de cada caso es un código, no un mensaje.' },
    { id: 'tabla_casos', title: 'Tabla de casos', summary: 'VALUES con un caso por fila y una sola consulta que prueba todos: la prueba se lee como una tabla.' },
    { id: 'null_reglas', title: 'NULL y las reglas', summary: 'Un CHECK y una clave foránea dejan pasar NULL; lo obligatorio necesita NOT NULL.' },
    { id: 'reglas_filas', title: 'Reglas entre filas', summary: '«Una sola abierta por cliente» no la cumple ningún CHECK: hace falta un índice único parcial, y una prueba con dos filas.' },
    { id: 'probar_trigger', title: 'Probar un trigger', summary: 'Por su efecto, en cada operación que debe cubrir: INSERT, UPDATE, DELETE.' },
    { id: 'deshacer', title: 'Pruebas que no dejan rastro', summary: 'Cada prueba deja los datos como estaban: BEGIN … ROLLBACK, o funciones que deshacen.' },
  ],
  debriefConcepts: ['dos_lados', 'sqlstate_qa', 'tabla_casos', 'null_reglas', 'reglas_filas', 'probar_trigger', 'deshacer'],
  seniorTips: [
    'Lee la especificación y cómo usar probar y efecto en la wiki.',
    'Laura: VALUES con 999.99, 1000.00, 60000.00 y 60000.01, y probar(format(…, %L …)).',
    'Marta: VALUES (18), (24), (NULL) en el plazo.',
    'Carmen: VALUES (999), (NULL), (3) en el cliente.',
    "Nuria: VALUES (1, 'abierta'), (1, 'cancelada'), (2, 'abierta').",
    'Diego: dos efecto() en una fila, uno con INSERT y otro con UPDATE.',
    "Inés: VALUES ('abierta'), ('en_estudio'), ('APROBADA'), (NULL).",
    'Con Laura: probar lo que no debe entrar y no dejar restos.',
  ],

  lessons: [
    {
      id: 'dos_lados',
      question: '¿Cómo se prueba una regla?',
      conceptId: 'dos_lados',
      cost: 5,
      body: `Por los **dos lados**: lo que la especificación dice que entra tiene que entrar, y lo que no, tiene que fallar. Y en los rangos, en la **frontera exacta**:

| Importe | Esperado |
|---|---|
| 999.99 | 23514 |
| 1000.00 | ok |
| 60000.00 | ok |
| 60000.01 | 23514 |

Un \`>\` donde debía ir \`>=\` solo se ve en 1000.00. Con 5000 todo «funciona».`,
    },
    {
      id: 'sqlstate_qa',
      question: '¿Qué me dice probar()?',
      conceptId: 'sqlstate_qa',
      cost: 5,
      body: `\`ok\` si la sentencia se acepta, o el **SQLSTATE** del error:

| Código | Regla |
|---|---|
| 23514 | CHECK |
| 23502 | NOT NULL |
| 23503 | clave foránea |
| 23505 | UNIQUE o clave primaria |

Comparar códigos (y no mensajes) hace la prueba estable: el mensaje cambia con el idioma o con el nombre de la regla; el código, no.`,
    },
    {
      id: 'tabla_casos',
      question: '¿Cómo pruebo varios casos de una vez?',
      conceptId: 'tabla_casos',
      cost: 5,
      body: `Con una tabla de casos en \`VALUES\` y \`format\` para construir cada sentencia:

\`\`\`
SELECT v.plazo,
       probar(format('INSERT INTO solicitudes (cliente_id, importe, plazo_meses, estado) VALUES (2, 5000, %L, %L)', v.plazo, 'abierta')) AS resultado
FROM (VALUES (18), (24), (NULL)) AS v(plazo);
\`\`\`

\`%L\` escribe el valor como literal (con comillas) y NULL como NULL. El resultado se lee como una tabla de casos: entrada y lo que pasó.`,
    },
    {
      id: 'null_reglas',
      question: '¿Por qué entra un plazo vacío si hay un CHECK?',
      conceptId: 'null_reglas',
      cost: 5,
      body: `Porque un CHECK solo rechaza lo que es **falso**, y \`NULL IN (12, 24, …)\` no es falso: es NULL. Lo mismo pasa con la clave foránea: un \`cliente_id\` vacío no apunta a nada, así que no la incumple.

Si la columna es obligatoria, hace falta **NOT NULL**. Y por eso, en cada columna obligatoria, NULL es un caso de prueba.`,
    },
    {
      id: 'reglas_filas',
      question: '¿Cómo pruebo «una sola solicitud abierta por cliente»?',
      conceptId: 'reglas_filas',
      cost: 5,
      body: `Con **dos filas**: una que ya existe y otra que choca con ella. Y con los casos que **sí** deben entrar:

| Caso | Esperado |
|---|---|
| segunda abierta del cliente 1 | 23505 |
| cancelada del cliente 1 | ok |
| abierta del cliente 2 | ok |

Una regla así se implementa con un índice único parcial: \`CREATE UNIQUE INDEX … ON solicitudes (cliente_id) WHERE estado = 'abierta'\`.`,
    },
    {
      id: 'probar_trigger',
      question: '¿Cómo pruebo un trigger?',
      conceptId: 'probar_trigger',
      cost: 5,
      body: `Por su **efecto**, en **cada** operación que la especificación dice que debe cubrir. Si \`revisada_en\` se pone al crear y al modificar, hay dos casos:

\`\`\`
SELECT efecto(ARRAY['UPDATE solicitudes SET importe = 6000 WHERE id = 1'],
              'SELECT (revisada_en <> ''2026-02-21 10:00'')::text FROM solicitudes WHERE id = 1');
\`\`\`

\`false\`: el trigger no saltó. Es un \`BEFORE INSERT\` que debía ser \`BEFORE INSERT OR UPDATE\`.`,
    },
    {
      id: 'deshacer',
      question: '¿Por qué mis pruebas tienen que deshacerse?',
      conceptId: 'deshacer',
      cost: 5,
      body: `Porque una prueba que deja datos cambia el escenario de la siguiente: la segunda ejecución choca con la solicitud que dejó la primera, o cuenta una fila de más.

\`\`\`
BEGIN;
INSERT INTO solicitudes …;   -- la prueba
ROLLBACK;                    -- todo como estaba
\`\`\`

\`probar\` y \`efecto\` hacen eso por dentro. La prueba se puede repetir mil veces y da lo mismo.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q8pre_lados', conceptId: 'dos_lados', question: 'Regla: importe de 1.000 a 60.000, ambos incluidos. ¿Qué casos pruebas?', options: ['5000', '999.99, 1000, 60000 y 60000.01', 'Solo 1000', '0 y 100000'], correct: 1, explanation: 'Justo dentro y justo fuera de cada frontera.' },
      { id: 'q8pre_code', conceptId: 'sqlstate_qa', question: '`probar(…)` devuelve 23514. ¿Qué regla saltó?', options: ['NOT NULL', 'CHECK', 'Clave foránea', 'UNIQUE'], correct: 1, explanation: '23514 = check_violation.' },
      { id: 'q8pre_null', conceptId: 'null_reglas', question: '`CHECK (plazo_meses IN (12, 24, 36, 48, 60))` y plazo NULL. ¿Entra?', options: ['No', 'Sí', 'Da otro error', 'Se guarda como 12'], correct: 1, explanation: 'NULL no es falso.' },
      { id: 'q8pre_fk', conceptId: 'null_reglas', question: 'Una clave foránea sin NOT NULL. ¿Se puede guardar una fila sin cliente?', options: ['No', 'Sí', 'Solo si el cliente 0 existe', 'Da 23503'], correct: 1, explanation: 'NULL no apunta a nada, así que no incumple la clave.' },
      { id: 'q8pre_trig', conceptId: 'probar_trigger', question: 'Un trigger debe actualizar `revisada_en` al crear y al modificar. ¿Cuántos casos mínimos?', options: ['Uno', 'Dos: un INSERT y un UPDATE', 'Ninguno', 'Uno por columna'], correct: 1, explanation: 'Uno por operación.' },
      { id: 'q8pre_desh', conceptId: 'deshacer', question: '¿Qué hace `probar(…)` con lo que ejecuta?', options: ['Lo guarda', 'Lo deshace siempre', 'Lo guarda si va bien', 'Lo borra al día siguiente'], correct: 1, explanation: 'Por eso se puede repetir.' },
    ],
    post: [
      { id: 'q8post_feliz', conceptId: 'dos_lados', question: 'Rubén prueba las reglas con una solicitud de 5000 €, 24 meses y abierta. Pasa. ¿Qué ha probado?', options: ['Todas las reglas', 'Solo que lo normal entra', 'Las fronteras', 'Los NULL'], correct: 1, explanation: 'Falta todo lo que no debe entrar.' },
      { id: 'q8post_23505', conceptId: 'reglas_filas', question: 'Segunda solicitud abierta del mismo cliente. ¿Qué resultado esperas si la regla existe?', options: ['ok', '23505', '23514', '23503'], correct: 1, explanation: 'Un índice único (parcial).' },
      { id: 'q8post_format', conceptId: 'tabla_casos', question: "¿Qué escribe `format('%L', NULL)`?", options: ["'NULL'", 'NULL, sin comillas', 'Una cadena vacía', 'Un error'], correct: 1, explanation: 'Por eso sirve para probar el vacío.' },
      { id: 'q8post_restos', conceptId: 'deshacer', question: 'Una prueba hace un INSERT real y la siguiente ejecución falla con 23505. ¿Por qué?', options: ['La regla está mal', 'La primera dejó su fila', 'PostgreSQL falla', 'Mala suerte'], correct: 1, explanation: 'Hay que deshacer.' },
      { id: 'q8post_estado', conceptId: 'dos_lados', question: "La especificación añade el estado «en_estudio». ¿Qué caso nuevo necesita la prueba?", options: ['Ninguno', "Que 'en_estudio' entre", "Que 'en_estudio' falle", 'Solo los antiguos'], correct: 1, explanation: 'Un caso por cada valor válido.' },
      { id: 'q8post_update', conceptId: 'probar_trigger', question: '`efecto` al modificar devuelve que `revisada_en` no cambió. ¿Qué le falta al trigger?', options: ['Nada', 'Saltar también en UPDATE', 'Un CHECK', 'Una clave foránea'], correct: 1, explanation: 'BEFORE INSERT OR UPDATE.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Las reglas de las solicitudes',
      body: 'Buenos días.\n\nDiego ha puesto las reglas de `solicitudes` en la base de datos. Antes de que la app nueva confíe en ellas, las probamos. La especificación y cómo usar `probar` y `efecto` están en la wiki. Y una condición para todo el día: **la tabla tiene que quedar como estaba**.\n\nEmpieza por el importe:\n\n- Prueba a crear una solicitud del cliente 2 (24 meses, abierta) con importe **999.99**, **1000.00**, **60000.00** y **60000.01**: `importe` y `resultado`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'dos_lados' }, { kind: 'unlock', conceptId: 'sqlstate_qa' }, { kind: 'unlock', conceptId: 'tabla_casos' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.importes' },
      body: 'Cuatro 23514. Los de fuera están bien rechazados, pero **1000 y 60000 también**, y la especificación dice «ambos incluidos». Ahí hay un `>` que debía ser `>=`. Se lo paso a Diego.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_plazos',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! El cuadro de cuotas necesita el plazo. Prueba a crear una solicitud del cliente 2 (5000 €, abierta) con plazo **18**, **24** y **vacío**: `plazo` y `resultado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'null_reglas' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.plazos' },
      body: '¿El vacío entra? Pues una solicitud sin plazo nos rompe el cuadro de cuotas. Le pido a Diego un NOT NULL. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_clientes',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para Riesgos, toda solicitud tiene que ser de un cliente que existe. Prueba con el cliente **999**, **ninguno** y el **3** (5000 €, 24 meses, abierta): `cliente_id` y `resultado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.clientes' },
      body: 'El 999 lo para la clave foránea, pero una solicitud **sin cliente** entra. Eso no lo puede aceptar Riesgos. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_feliz',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «las pruebas de Rubén pasan todas»',
      body: '**Laura:** Rubén tiene ya diez pruebas de las reglas de solicitudes y pasan todas. Todas crean solicitudes con datos buenos: 5000 €, 24 meses, abierta, cliente que existe… ¿Le das el visto bueno?',
      onDeliver: [],
      choices: [
        {
          id: 'dos_lados',
          text: 'No. Solo prueban que **lo bueno entra**; una regla que lo deja entrar **todo** también las pasa. Hay que probar lo que **no** debe entrar (cada valor prohibido, cada NULL obligatorio) y las **fronteras exactas** por los dos lados: así salió lo de 1000 y 60000.',
          cost: 10,
          reply: 'Exacto. Diez casos del camino feliz son un caso repetido diez veces.',
          effects: [
            { kind: 'flag', key: 'practice.dos_lados' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Las reglas se prueban por los dos lados y en sus fronteras.' },
          ],
        },
        {
          id: 'suficiente',
          text: 'Sí: si todas pasan, las reglas funcionan.',
          cost: 10,
          reply: 'Pasarían igual sin ninguna regla. Y hoy ya sabemos que 1000 y 60000 fallan.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buenas unas pruebas que solo miran el camino feliz.' }],
        },
        {
          id: 'app',
          text: 'Sí: los casos raros ya los valida la app.',
          cost: 10,
          reply: 'La app de hoy. Las reglas de la base de datos están precisamente para lo que la app no para: scripts, cargas, la app de mañana.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Confiaste en la app para no probar las reglas.' }],
        },
      ],
    },
    {
      id: 'nuria_abiertas',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Un cliente me llamó con **dos ofertas distintas** del mismo préstamo. El cliente 1 ya tiene una abierta: prueba a crear una **abierta** del 1, una **cancelada** del 1 y una **abierta** del 2: `cliente_id`, `estado` y `resultado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'reglas_filas' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.abiertas' },
      body: 'Las tres entran, también la segunda abierta del 1. Por eso le llegaron dos ofertas. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_revision',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. La cola de revisión ordena por `revisada_en`, que pone un trigger. ¿Me lo pruebas con `efecto`? Una fila: `al_insertar` (al crear una del cliente 6, ¿queda informada?) y `al_actualizar` (al cambiar a 6000 el importe de la 1, ¿cambia?). Los detalles, en el encargo.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'probar_trigger' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.revision' },
      body: '`true` y `false`. Lo puse `BEFORE INSERT` y se me olvidó el `OR UPDATE`. Las modificadas no vuelven a la cola. Lo arreglo. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_estados',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. Producto añadió el estado **en_estudio** el mes pasado. Prueba a crear una del cliente 2 (5000 €, 24 meses) con **abierta**, **en_estudio**, **APROBADA** y **vacío**: `estado` y `resultado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.estados' },
      body: 'APROBADA y el vacío, bien rechazados. Pero **en_estudio** también: el CHECK no se actualizó. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_restos',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «la segunda vez fallan»',
      body: '**Laura:** Las pruebas de Rubén pasan la primera vez y fallan la segunda: «23505» donde esperaban `ok`, o un recuento con una fila de más. Hacen `INSERT` de verdad. ¿Qué le propones?',
      onDeliver: [],
      choices: [
        {
          id: 'deshacer',
          text: 'Que cada prueba **deje los datos como estaban**: dentro de una transacción que termina en `ROLLBACK`, o con funciones como `probar` y `efecto`, que deshacen siempre. Una prueba que deja restos cambia el escenario de la siguiente y deja de ser repetible.',
          cost: 10,
          reply: 'Eso es. La prueba buena se puede ejecutar mil veces y da lo mismo.',
          effects: [
            { kind: 'flag', key: 'practice.deshacer' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Cada prueba se deshace y no deja restos.' },
          ],
        },
        {
          id: 'truncate',
          text: 'Que empiece con un `TRUNCATE solicitudes` para partir de cero.',
          cost: 10,
          reply: 'Y se lleva las solicitudes de todos los demás del entorno. Y la regla de «una abierta» ya no tendría con qué chocar.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste vaciar la tabla en vez de deshacer cada prueba.' }],
        },
        {
          id: 'ids',
          text: 'Que use un cliente distinto cada vez.',
          cost: 10,
          reply: 'Retrasa el problema: la tabla crece y los recuentos siguen cambiando. Lo que hay que hacer es no dejar nada.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Esquivaste los restos en vez de no dejarlos.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Seis reglas, seis fallos. Y ninguno se veía con datos buenos. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una regla se prueba por los dos lados: lo que debe entrar y lo que no, las fronteras exactas, NULL en cada columna obligatoria, las reglas que cruzan filas con dos filas y los triggers en cada operación; que el resultado es un código de error; y que cada prueba se deshace y no deja restos.',
          reply: 'Muy bien. Mañana, lo último: que una versión nueva no vaya más lenta que la anterior.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'confiar',
          text: 'Que si la regla está en la base de datos, no hace falta probarla.',
          reply: 'Hoy había seis reglas en la base de datos y las seis estaban mal. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con que las reglas no se prueban.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
