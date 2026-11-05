import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

/** Comprobación con una sonda que siempre se deshace: 'ok' o el SQLSTATE del error. */
const sonda = (sql: string, esperado: string) => ({ query: `SELECT qa.probar('${sql.replace(/'/g, "''")}')`, rows: [[esperado]] })

/**
 * Curso 7: SQL avanzado · Misión 6 — Reglas en la base de datos.
 *
 * CHECK sobre datos que ya la incumplen, UNIQUE de varias columnas con un
 * repetido dentro, acciones de clave foránea (ON DELETE CASCADE), columnas
 * generadas e índices únicos parciales. Las reglas se comprueban con sondas
 * (qa.probar) que intentan meter datos malos y lo deshacen. Trampas: NOT VALID
 * para esquivar los datos malos y CASCADE donde no toca.
 */
export const m06Reglas: Mission = {
  ...COMUN,
  id: 'm06-reglas',
  number: 6,
  title: 'Reglas en la base de datos',
  subtitle: 'CHECK, UNIQUE, claves foráneas con ON DELETE, columnas generadas e índices únicos parciales.',
  dayLabel: 'Martes · mes 4',
  verdicts: {
    good: {
      title: 'La base de datos ya dice que no',
      body: 'Plazos válidos, cuotas sin repetir, una tarjeta activa por cuenta, incidencias que no se cierran antes de abrirse, cuotas que se van con su préstamo y un total que se calcula solo. Y ninguna regla a medias ni un CASCADE que se lleve lo que no debe.',
    },
    ok: {
      title: 'Reglas a medias',
      body: 'Ya pones reglas en la base de datos, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Una base de datos que lo acepta todo',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de reglas a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Reglas en la base de datos',
    paragraphs: [
      'Martes. Ayer arreglaste datos; hoy toca que **no vuelvan a entrar mal**. Las reglas que pones en la propia tabla se cumplen siempre, venga el dato de la app, de un script o de una consola.',
      'Seguimos en la **copia de pruebas**. Cada encargo se cumple cuando la regla existe y hace su trabajo: Inés la prueba intentando meter un dato malo (y deshaciéndolo).',
    ],
    goals: [
      'Añade un CHECK a una tabla con datos que ya lo incumplen.',
      'Haz única una combinación de columnas.',
      'Cambia lo que pasa con los hijos al borrar el padre (ON DELETE).',
      'Crea una columna que se calcula sola (GENERATED).',
      'Haz única una columna solo para algunas filas (índice único parcial).',
      'Lee los códigos de error de las reglas (23514, 23505, 23503).',
    ],
  },

  docs: [
    {
      id: 'chuleta_reglas',
      title: 'Chuleta: reglas en la base de datos',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'check' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Añadir reglas a una tabla que ya existe
| Regla | Sentencia |
|---|---|
| Condición | \`ALTER TABLE t ADD CONSTRAINT nombre CHECK (condición)\` |
| Única (varias columnas) | \`ALTER TABLE t ADD CONSTRAINT nombre UNIQUE (a, b)\` |
| Única solo en algunas filas | \`CREATE UNIQUE INDEX nombre ON t (a) WHERE condición\` |
| Clave foránea con acción | \`… FOREIGN KEY (x) REFERENCES p(id) ON DELETE CASCADE\` |
| Cambiar una regla | \`ALTER TABLE t DROP CONSTRAINT nombre, ADD CONSTRAINT nombre …\` |
| Columna calculada | \`ALTER TABLE t ADD COLUMN c tipo GENERATED ALWAYS AS (expresión) STORED\` |

## Ver las reglas de una tabla
\`\`\`
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'cuotas'::regclass;
\`\`\`

## Si la regla no entra
Los datos que ya hay la incumplen. Busca esas filas con la condición contraria, **arréglalas** y vuelve a añadir la regla.

## Códigos de error
| Código | Regla |
|---|---|
| 23514 | CHECK |
| 23505 | UNIQUE o clave primaria |
| 23503 | clave foránea |
| 23502 | NOT NULL |`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: "-- Entorno de pruebas: las reglas que ya tiene cuotas\nSELECT conname, pg_get_constraintdef(oid)\nFROM pg_constraint\nWHERE conrelid = 'cuotas'::regclass;",
    retos: [
      {
        id: 'plazo_valido',
        from: 'ines',
        title: 'Solo plazos de 12, 24, 36, 48 o 60 meses',
        description: 'Añade a `prestamos` la regla **`plazo_valido`**: `plazo_meses` solo puede ser 12, 24, 36, 48 o 60. Si algún préstamo la incumple, **arregla el dato** antes (el contrato manda).',
        hint: 'Busca los que no cumplen (`WHERE plazo_meses NOT IN (…)`), corrige con un UPDATE y luego `ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60));`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [exige(/\bcheck\b/i, 'Este encargo se cumple con una regla `CHECK`: `ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (…)`.')],
        state: [
          { query: "SELECT convalidated::text FROM pg_constraint WHERE conname = 'plazo_valido' AND conrelid = 'prestamos'::regclass", rows: [['true']] },
          { query: 'SELECT plazo_meses FROM prestamos WHERE id = 23', rows: [['24']] },
          sonda('UPDATE prestamos SET plazo_meses = 18 WHERE id = 1', '23514'),
          sonda('UPDATE prestamos SET plazo_meses = 60 WHERE id = 1', 'ok'),
        ],
      },
      {
        id: 'cuota_unica',
        from: 'marta',
        title: 'Cada cuota, una sola vez',
        description: 'Que no pueda haber **dos cuotas con el mismo número del mismo préstamo**: regla única sobre `(prestamo_id, numero)` en `cuotas`. Si hay una repetida, borra **la copia** (la de `id` más alto).',
        hint: '`GROUP BY prestamo_id, numero HAVING COUNT(*) > 1` para encontrarla, `DELETE` de la copia y `ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero);`',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [exige(/\bunique\b/i, 'Este encargo se cumple con una regla `UNIQUE (prestamo_id, numero)`.')],
        state: [
          { query: 'SELECT COUNT(*), COUNT(*) FILTER (WHERE id = 9) FROM cuotas', rows: [['84', '1']] },
          sonda("INSERT INTO cuotas VALUES (901, 2, 3, '2026-01-01', 10, NULL)", '23505'),
          sonda("INSERT INTO cuotas VALUES (901, 2, 99, '2026-01-01', 10, NULL)", 'ok'),
        ],
      },
      {
        id: 'una_activa',
        from: 'carmen',
        title: 'Una sola tarjeta activa por cuenta',
        description: 'Cada cuenta puede tener **una sola tarjeta activa**, pero sí otras bloqueadas o caducadas. Haz que `tarjetas` no acepte una segunda **activa** en la misma cuenta.',
        hint: "Un índice único que solo mira las activas: `CREATE UNIQUE INDEX una_activa_por_cuenta ON tarjetas (cuenta_id) WHERE estado = 'activa';`",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [exige(/\bunique\b/i, 'Haz que la base de datos lo impida con algo único (`UNIQUE`).')],
        state: [
          sonda("INSERT INTO tarjetas VALUES (99, 1, 'debito', 600, 'activa', '2028-01-31')", '23505'),
          sonda("INSERT INTO tarjetas VALUES (99, 1, 'debito', 600, 'bloqueada', '2028-01-31')", 'ok'),
          sonda("INSERT INTO tarjetas VALUES (99, 1, 'debito', 600, 'caducada', '2028-01-31'), (98, 1, 'credito', 600, 'caducada', '2028-01-31')", 'ok'),
        ],
      },
      {
        id: 'cierre_posterior',
        from: 'nuria',
        title: 'Ninguna incidencia se cierra antes de abrirse',
        description: 'Añade a `incidencias` una regla: si tiene `cerrada_en`, no puede ser **anterior** a `abierta_en`. Las que siguen abiertas (`cerrada_en` vacío) tienen que poder guardarse.',
        hint: '`ALTER TABLE incidencias ADD CONSTRAINT cierre_posterior CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en);`',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        requires: [exige(/\bcheck\b/i, 'Este encargo se cumple con una regla `CHECK`.')],
        state: [
          sonda("UPDATE incidencias SET cerrada_en = abierta_en - INTERVAL '1 day' WHERE id = 1", '23514'),
          sonda('UPDATE incidencias SET cerrada_en = NULL WHERE id = 1', 'ok'),
          sonda('UPDATE incidencias SET cerrada_en = abierta_en WHERE id = 1', 'ok'),
        ],
      },
      {
        id: 'cuotas_cascade',
        from: 'diego',
        title: 'Las cuotas se van con su préstamo',
        description: 'Cuando se borra un préstamo, sus **cuotas** tienen que borrarse con él. Cambia la clave foránea de `cuotas.prestamo_id` para que lo haga. Una cuota de un préstamo que no existe tiene que seguir sin poder entrar.',
        hint: '`ALTER TABLE cuotas DROP CONSTRAINT cuotas_prestamo_id_fkey, ADD CONSTRAINT cuotas_prestamo_id_fkey FOREIGN KEY (prestamo_id) REFERENCES prestamos(id) ON DELETE CASCADE;`',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [exige(/\bon\s+delete\s+cascade\b/i, 'Este encargo se cumple con `ON DELETE CASCADE` en la clave foránea.')],
        state: [
          { query: "SELECT qa.efecto(ARRAY['DELETE FROM prestamos WHERE id = 1'], 'SELECT COUNT(*) FROM cuotas WHERE prestamo_id = 1')", rows: [['0']] },
          sonda("INSERT INTO cuotas VALUES (901, 999, 1, '2026-01-01', 10, NULL)", '23503'),
        ],
      },
      {
        id: 'total_generado',
        from: 'laura',
        title: 'El total a devolver, calculado por la base de datos',
        description: 'Añade a `prestamos` la columna **`total_a_devolver`** (numeric(12,2)): `importe × (1 + tipo_interes / 100)`, redondeado a 2 decimales, que **se calcule sola** y se mantenga al día si cambia el importe o el interés.',
        hint: '`ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2) GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED;`',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [exige(/\bgenerated\s+always\b/i, 'Haz que se calcule sola: `GENERATED ALWAYS AS (…) STORED`.')],
        state: [
          { query: "SELECT is_generated FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'prestamos' AND column_name = 'total_a_devolver'", rows: [['ALWAYS']] },
          { query: 'SELECT total_a_devolver FROM prestamos WHERE id = 1', rows: [['29900.68']] },
          { query: "SELECT qa.efecto(ARRAY['UPDATE prestamos SET importe = 10000 WHERE id = 1'], 'SELECT total_a_devolver FROM prestamos WHERE id = 1')", rows: [['10675.00']] },
        ],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El informe de cuotas de Marta cobra una cuota dos veces', severity: 'high', explanation: 'Nada impedía dos cuotas con el mismo número del mismo préstamo.', technique: 'UNIQUE (prestamo_id, numero).', preventedBy: 'reto.cuota_unica' },
    { id: 'C-CARMEN', title: 'Un cliente acaba con dos tarjetas activas en la misma cuenta', severity: 'high', explanation: 'La regla vivía solo en la app, y un script se la saltó.', technique: 'Índice único parcial WHERE estado = activa.', preventedBy: 'reto.una_activa' },
    { id: 'C-NURIA', title: 'El tiempo medio de resolución sale negativo', severity: 'medium', explanation: 'Entró una incidencia cerrada antes de abrirse.', technique: 'CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en).', preventedBy: 'reto.cierre_posterior' },
    { id: 'C-DIEGO', title: 'Borrar una solicitud de préstamo falla en el backoffice', severity: 'medium', explanation: 'Las cuotas bloqueaban el borrado del préstamo.', technique: 'ON DELETE CASCADE en cuotas.prestamo_id.', preventedBy: 'reto.cuotas_cascade' },
    { id: 'C-LAURA', title: 'La app y el informe dan totales distintos del mismo préstamo', severity: 'low', explanation: 'Cada uno calculaba el total a su manera.', technique: 'Una columna GENERATED que calcula la base de datos.', preventedBy: 'reto.total_generado' },
    { id: 'C-NOTVALID', title: 'Un préstamo de 18 meses sigue en la cartera «validada»', severity: 'medium', explanation: 'La regla se añadió con NOT VALID y no miró los datos que ya había.', technique: 'Arreglar los datos y añadir la regla validada (o VALIDATE CONSTRAINT).', preventedBy: 'practice.not_valid' },
    { id: 'C-CASCADE', title: 'Borrar un cliente de pruebas se lleva sus cuentas y movimientos', severity: 'high', explanation: 'Se puso ON DELETE CASCADE en tablas con historia propia.', technique: 'CASCADE solo para hijos que no tienen vida sin el padre.', preventedBy: 'practice.cascade_care' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las reglas del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.cuota_unica', label: 'Cuotas de Marta', explanation: 'Una cuota por número y préstamo.' },
      { flag: 'reto.una_activa', label: 'Tarjetas de Carmen', explanation: 'Una activa por cuenta.' },
      { flag: 'reto.cierre_posterior', label: 'Incidencias de Nuria', explanation: 'El cierre, después de la apertura.' },
      { flag: 'reto.cuotas_cascade', label: 'Backoffice de Diego', explanation: 'Las cuotas se van con el préstamo.' },
      { flag: 'reto.total_generado', label: 'Totales de Laura', explanation: 'Calculados por la base de datos.' },
      { flag: 'practice.not_valid', label: 'Reglas validadas', explanation: 'Los datos viejos también cumplen.' },
      { flag: 'practice.cascade_care', label: 'CASCADE con cuidado', explanation: 'Solo donde no hay historia propia.' },
    ],
  },

  concepts: [
    { id: 'check', title: 'CHECK', summary: 'Una condición que cada fila tiene que cumplir; NULL la cumple (no es falsa).' },
    { id: 'not_valid', title: 'Reglas sobre datos que ya existen', summary: 'ADD CONSTRAINT revisa las filas que hay; NOT VALID se lo salta y deja los datos malos dentro.' },
    { id: 'unique_multi', title: 'UNIQUE de varias columnas', summary: 'La combinación no se repite, aunque cada columna sí.' },
    { id: 'partial_unique', title: 'Índice único parcial', summary: 'CREATE UNIQUE INDEX … WHERE: único solo entre las filas que cumplen la condición.' },
    { id: 'fk_actions', title: 'ON DELETE en claves foráneas', summary: 'RESTRICT/NO ACTION impide borrar el padre; CASCADE borra los hijos; SET NULL los deja sin padre.' },
    { id: 'generated', title: 'Columnas generadas', summary: 'GENERATED ALWAYS AS (…) STORED: la calcula la base de datos y no se puede escribir.' },
    { id: 'sqlstate', title: 'Códigos de error de las reglas', summary: '23514 CHECK, 23505 UNIQUE, 23503 clave foránea, 23502 NOT NULL.' },
  ],
  debriefConcepts: ['check', 'not_valid', 'unique_multi', 'partial_unique', 'fk_actions', 'generated', 'sqlstate'],
  seniorTips: [
    'Lee la chuleta de reglas en la wiki.',
    'Inés: el préstamo 23 tiene 18 meses; su contrato dice 24. UPDATE y luego ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60)).',
    'Marta: la cuota 900 repite la 9 (préstamo 2, cuota 3). DELETE de la 900 y ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero).',
    "Carmen: CREATE UNIQUE INDEX una_activa_por_cuenta ON tarjetas (cuenta_id) WHERE estado = 'activa'.",
    'Nuria: CHECK (cerrada_en IS NULL OR cerrada_en >= abierta_en).',
    'Diego: DROP CONSTRAINT cuotas_prestamo_id_fkey y ADD de nuevo con ON DELETE CASCADE.',
    'Laura: ADD COLUMN total_a_devolver numeric(12,2) GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED.',
    'Con Inés: arreglar los datos en vez de NOT VALID, y CASCADE solo donde los hijos no tienen vida propia.',
  ],

  lessons: [
    {
      id: 'check',
      question: '¿Qué es un CHECK y qué pasa con los NULL?',
      conceptId: 'check',
      cost: 5,
      body: `Una condición que **cada fila** tiene que cumplir al insertarse o cambiarse:

\`\`\`
ALTER TABLE prestamos
  ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60));
\`\`\`

Si no se cumple, error **23514**. Ojo: el CHECK solo falla si la condición es **falsa**; si da NULL, pasa. Por eso \`CHECK (cerrada_en >= abierta_en)\` ya acepta las abiertas, aunque escribir \`cerrada_en IS NULL OR …\` lo deja más claro.`,
    },
    {
      id: 'not_valid',
      question: '¿Y si los datos que ya hay incumplen la regla?',
      conceptId: 'not_valid',
      cost: 5,
      body: `\`ADD CONSTRAINT\` revisa todas las filas y, si alguna falla, no añade la regla:

> check constraint "plazo_valido" of relation "prestamos" is violated by some row

Lo correcto: buscar esas filas (\`WHERE NOT (condición)\`), **arreglarlas** y volver a añadirla. Existe \`… NOT VALID\`, que añade la regla sin mirar lo que ya hay: solo sirve para tablas enormes, y después hay que arreglar los datos y hacer \`ALTER TABLE … VALIDATE CONSTRAINT nombre\`.`,
    },
    {
      id: 'unique_multi',
      question: '¿Cómo hago única una combinación de columnas?',
      conceptId: 'unique_multi',
      cost: 5,
      body: `\`\`\`
ALTER TABLE cuotas ADD CONSTRAINT cuota_unica UNIQUE (prestamo_id, numero);
\`\`\`

El préstamo 2 puede tener muchas cuotas y muchas cuotas pueden ser la número 3, pero **la cuota 3 del préstamo 2** solo una vez. Si ya hay repetidas, no entra («could not create unique index»): búscalas con \`GROUP BY prestamo_id, numero HAVING COUNT(*) > 1\`.`,
    },
    {
      id: 'partial_unique',
      question: '¿Cómo hago algo único solo para algunas filas?',
      conceptId: 'partial_unique',
      cost: 5,
      body: `Con un índice único con \`WHERE\`:

\`\`\`
CREATE UNIQUE INDEX una_activa_por_cuenta
  ON tarjetas (cuenta_id) WHERE estado = 'activa';
\`\`\`

Solo mira las filas activas: una cuenta puede tener muchas tarjetas bloqueadas o caducadas, pero una sola activa. Un \`UNIQUE (cuenta_id)\` normal impediría también tener una bloqueada y otra activa.`,
    },
    {
      id: 'fk_actions',
      question: '¿Qué pasa con los hijos cuando borro el padre?',
      conceptId: 'fk_actions',
      cost: 5,
      body: `Lo decide la clave foránea:

| Acción | Al borrar el préstamo… |
|---|---|
| \`NO ACTION\` / \`RESTRICT\` (por defecto) | error 23503 si tiene cuotas |
| \`ON DELETE CASCADE\` | se borran sus cuotas |
| \`ON DELETE SET NULL\` | las cuotas se quedan con \`prestamo_id\` NULL |

Para cambiarla: \`DROP CONSTRAINT\` y \`ADD CONSTRAINT\` de nuevo, en la misma sentencia. CASCADE es cómodo y peligroso: un DELETE puede llevarse filas de varias tablas.`,
    },
    {
      id: 'generated',
      question: '¿Qué es una columna generada?',
      conceptId: 'generated',
      cost: 5,
      body: `Una columna que calcula la base de datos a partir de otras de la misma fila:

\`\`\`
ALTER TABLE prestamos ADD COLUMN total_a_devolver numeric(12,2)
  GENERATED ALWAYS AS (ROUND(importe * (1 + tipo_interes / 100), 2)) STORED;
\`\`\`

Se recalcula sola si cambian \`importe\` o \`tipo_interes\`, y nadie puede escribirla a mano. La expresión solo puede usar columnas de la fila y funciones que siempre den lo mismo (nada de \`now()\` ni subconsultas).`,
    },
    {
      id: 'sqlstate',
      question: '¿Cómo sé qué regla ha saltado?',
      conceptId: 'sqlstate',
      cost: 5,
      body: `Cada error trae un código (SQLSTATE) y el nombre de la regla:

| Código | Regla |
|---|---|
| 23514 | CHECK |
| 23505 | UNIQUE o PRIMARY KEY |
| 23503 | FOREIGN KEY |
| 23502 | NOT NULL |

La app debería usar el código, no el texto del mensaje. Y por eso conviene **poner nombre** a las reglas: \`plazo_valido\` dice más que \`prestamos_plazo_meses_check\`.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a6pre_check', conceptId: 'check', question: '`CHECK (plazo_meses IN (12, 24, 36, 48, 60))`. ¿Qué pasa si insertas 18?', options: ['Se guarda', 'Error 23514', 'Se guarda como 24', 'Se guarda NULL'], correct: 1, explanation: 'El CHECK es falso: la fila no entra.' },
      { id: 'a6pre_existing', conceptId: 'not_valid', question: 'Añades un CHECK y un préstamo que ya existe lo incumple. ¿Qué pasa?', options: ['Se añade y se borra el préstamo', 'No se añade la regla', 'Se añade y el préstamo se queda', 'Se arregla solo'], correct: 1, explanation: 'ADD CONSTRAINT revisa las filas existentes.' },
      { id: 'a6pre_unique', conceptId: 'unique_multi', question: '`UNIQUE (prestamo_id, numero)`. ¿Qué no se puede?', options: ['Dos cuotas del mismo préstamo', 'Dos cuotas número 3', 'Dos cuotas número 3 del mismo préstamo', 'Una cuota sin pagar'], correct: 2, explanation: 'Lo único es la combinación.' },
      { id: 'a6pre_partial', conceptId: 'partial_unique', question: '¿Qué permite `CREATE UNIQUE INDEX … ON tarjetas (cuenta_id) WHERE estado = \'activa\'`?', options: ['Una tarjeta por cuenta', 'Una activa por cuenta y las bloqueadas que quieras', 'Ninguna activa', 'Una cuenta por tarjeta'], correct: 1, explanation: 'Solo mira las activas.' },
      { id: 'a6pre_fk', conceptId: 'fk_actions', question: 'Por defecto, ¿qué pasa al borrar un préstamo que tiene cuotas?', options: ['Se borran las cuotas', 'Error de clave foránea (23503)', 'Las cuotas se quedan sin préstamo', 'Nada'], correct: 1, explanation: 'NO ACTION: no deja borrarlo.' },
      { id: 'a6pre_gen', conceptId: 'generated', question: 'Una columna `GENERATED ALWAYS AS (…) STORED`…', options: ['Se escribe en cada INSERT', 'La calcula la base de datos y no se puede escribir', 'Se calcula solo al crearla', 'Es una vista'], correct: 1, explanation: 'Y se recalcula si cambian sus columnas.' },
    ],
    post: [
      { id: 'a6post_notvalid', conceptId: 'not_valid', question: 'Una regla añadida con `NOT VALID`…', options: ['No hace nada', 'Se cumple para lo nuevo, pero deja dentro los datos malos que ya había', 'Borra los datos malos', 'Solo vale para hoy'], correct: 1, explanation: 'Luego hay que arreglarlos y hacer VALIDATE CONSTRAINT.' },
      { id: 'a6post_null', conceptId: 'check', question: '`CHECK (cerrada_en >= abierta_en)` y `cerrada_en` es NULL. ¿Entra la fila?', options: ['No', 'Sí: el CHECK solo falla si es falso, y NULL no lo es', 'Da error', 'Solo con NOT NULL'], correct: 1, explanation: 'NULL ≥ algo es NULL, no falso.' },
      { id: 'a6post_code', conceptId: 'sqlstate', question: 'La app recibe el error 23505. ¿Qué regla saltó?', options: ['CHECK', 'UNIQUE o clave primaria', 'Clave foránea', 'NOT NULL'], correct: 1, explanation: '23505 = unique_violation.' },
      { id: 'a6post_cascade', conceptId: 'fk_actions', question: '¿Dónde tiene sentido `ON DELETE CASCADE`?', options: ['De cuentas a clientes', 'De cuotas a su préstamo', 'De transferencias a cuentas', 'En todas'], correct: 1, explanation: 'Las cuotas no tienen vida sin su préstamo; las cuentas y las transferencias, sí.' },
      { id: 'a6post_partial', conceptId: 'partial_unique', question: '¿Por qué no vale `UNIQUE (cuenta_id)` para «una activa por cuenta»?', options: ['Sí vale', 'Impediría también tener una bloqueada además de la activa', 'No se puede en tarjetas', 'Es más lento'], correct: 1, explanation: 'Haría única la cuenta en todas las filas.' },
      { id: 'a6post_gen', conceptId: 'generated', question: 'Cambias el `importe` de un préstamo con `total_a_devolver` generado. ¿Qué pasa con el total?', options: ['Se queda igual', 'Se recalcula solo', 'Hay que hacer un UPDATE', 'Da error'], correct: 1, explanation: 'Para eso es una columna generada.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Que no vuelva a pasar',
      body: 'Buenos días.\n\nAyer quitaste copias y arreglaste datos. Hoy toca que la **base de datos no deje entrar** datos malos: reglas en las propias tablas, que se cumplen venga el dato de donde venga. Seguimos en la copia de pruebas.\n\nPara empezar:\n\n- En `prestamos`, la regla **`plazo_valido`**: `plazo_meses` solo puede ser 12, 24, 36, 48 o 60. Te aviso: hay un préstamo con un plazo imposible. Su contrato dice **24 meses**; alguien tecleó mal.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'check' }, { kind: 'unlock', conceptId: 'not_valid' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.plazo_valido' },
      body: 'Préstamo 23 con sus 24 meses y la regla validada. Intenté poner 18 al préstamo 1 y me dio el 23514. Así se hace: primero los datos, luego la regla.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'unlock', conceptId: 'sqlstate' }],
    },
    {
      id: 'marta_cuotas',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! El informe de cuotas me sale con una cuota **repetida**: la misma cuota del mismo préstamo dos veces. ¿Puedes quitar la copia (la de `id` más alto) y hacer que no pueda volver a pasar? Única la combinación `(prestamo_id, numero)`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'unique_multi' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.cuota_unica' },
      body: 'La 900 era la copia de la 9, y ahora ya no puede repetirse. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_tarjetas',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Norma de Riesgos: **una sola tarjeta activa por cuenta**. Bloqueadas o caducadas, las que haga falta. Ahora solo lo controla la app; quiero que lo impida la base de datos.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'partial_unique' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.una_activa' },
      body: 'Una segunda activa en la misma cuenta da error, y una bloqueada entra. Justo lo que pide la norma. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_not_valid',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «a mí me entró a la primera»',
      body: '**Inés:** Rubén ha puesto la misma regla de plazos en la base de datos de informes. Le daba el error de «violated by some row» y lo ha resuelto así:\n\n`ALTER TABLE prestamos ADD CONSTRAINT plazo_valido CHECK (plazo_meses IN (12, 24, 36, 48, 60)) NOT VALID;`\n\nDice que ya está, que la regla funciona. ¿Qué opinas?',
      onDeliver: [],
      choices: [
        {
          id: 'fix',
          text: 'Que con `NOT VALID` la regla solo mira lo **nuevo**: el préstamo de 18 meses sigue dentro, y cualquiera que se fíe de la regla se equivoca. Hay que buscar las filas que fallan, **arreglarlas** y validar la regla (`VALIDATE CONSTRAINT`, o quitarla y añadirla sin NOT VALID).',
          cost: 10,
          reply: 'Exacto. NOT VALID es para tablas enormes, y siempre con el arreglo de los datos detrás. No para callar el error.',
          effects: [
            { kind: 'flag', key: 'practice.not_valid' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Una regla que no entra se arregla en los datos, no con NOT VALID.' },
          ],
        },
        {
          id: 'fine',
          text: 'Que está bien: lo importante es que los préstamos nuevos cumplan.',
          cost: 10,
          reply: 'Y el informe que dice «todos los plazos son válidos porque hay una regla» miente. Los datos viejos siguen mal.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste una regla que deja los datos malos dentro.' }],
        },
        {
          id: 'delete',
          text: 'Que borre el préstamo de 18 meses y vuelva a añadir la regla.',
          cost: 10,
          reply: '¿Borrar un préstamo aprobado, con su cliente y sus cuotas, porque tiene un dato mal tecleado? Se arregla el dato, no se borra la fila.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Borraste datos buenos en vez de corregir uno.' }],
        },
      ],
    },
    {
      id: 'nuria_incidencias',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. El mes pasado el tiempo medio de resolución salió **negativo**: alguien cerró una incidencia con una fecha anterior a la de apertura. Ya la arreglaron, pero ¿puedes hacer que **no se pueda**? Las que siguen abiertas, sin fecha de cierre, tienen que poder guardarse.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.cierre_posterior' },
      body: 'Cerrar antes de abrir ya da error y las abiertas se guardan bien. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_cascade',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. En el backoffice, borrar un préstamo da error de clave foránea porque tiene **cuotas**. Las cuotas no tienen sentido sin su préstamo: quiero que se **borren con él**. Pero que siga sin poder entrar una cuota de un préstamo que no existe.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'fk_actions' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.cuotas_cascade' },
      body: 'Borro el préstamo y sus cuotas se van con él, y una cuota huérfana sigue dando error. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_total',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. La app y el informe de préstamos calculan el **total a devolver** cada uno a su manera y no coinciden. Quiero que lo calcule **la base de datos**: una columna `total_a_devolver` (numeric(12,2)) = `importe × (1 + tipo_interes / 100)`, redondeada a 2 decimales, y que se mantenga sola si cambian el importe o el interés.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'generated' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.total_generado' },
      body: 'Préstamo 1: 29.900,68 €. Le cambié el importe en una prueba y el total cambió solo. Ya no hay dos cálculos. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_cascade',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «CASCADE en todas»',
      body: '**Inés:** A Diego le ha gustado lo del CASCADE. Propone ponerlo también en `cuentas.cliente_id`, `tarjetas.cuenta_id` y `transferencias`, «para poder borrar clientes de prueba sin pelearse con las claves». ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'care',
          text: 'Que no: un `DELETE FROM clientes` se llevaría en cascada sus cuentas, tarjetas y transferencias, que son **historia del dinero** y tienen vida propia. CASCADE, solo donde el hijo no tiene sentido sin el padre (las cuotas de un préstamo). Para los clientes de prueba, un script que borre en orden, o marcarlos como dados de baja.',
          cost: 10,
          reply: 'Eso es. El error de clave foránea es la base de datos protegiéndote. Quitarlo en todas partes es apagar la alarma.',
          effects: [
            { kind: 'flag', key: 'practice.cascade_care' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'CASCADE solo para hijos sin vida propia; el resto, que proteja.' },
          ],
        },
        {
          id: 'yes',
          text: 'Que sí, que así se borra todo de una vez y no hay errores.',
          cost: 10,
          reply: 'Y el día que alguien borre un cliente real por error, desaparecen también sus transferencias. Sin aviso.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Pusiste CASCADE donde hay historia que proteger.' }],
        },
        {
          id: 'drop',
          text: 'Que mejor quite las claves foráneas de esas tablas.',
          cost: 10,
          reply: 'Entonces nada impide transferencias de cuentas que no existen. Las claves se quedan.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste quitar reglas para no ver sus errores.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy la base de datos ha aprendido a decir que no. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una regla en la tabla se cumple siempre, venga el dato de donde venga; que si no entra, se arreglan los datos (no NOT VALID); que UNIQUE puede ser de varias columnas o, con un índice parcial, solo de algunas filas; que ON DELETE decide qué pasa con los hijos y CASCADE solo va donde no hay historia propia; y que una columna generada evita cálculos repetidos.',
          reply: 'Muy bien. Mañana, lógica dentro de la base de datos: funciones y triggers.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'app',
          text: 'Que estas reglas ya las controla la app, así que en la base de datos sobran.',
          reply: 'Hasta que alguien entra por otro sitio: un script, una consola, otra app. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con que las reglas viven solo en la app.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
