import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const IMPORT = 'SELECT id, nombre, categoria, ciudad FROM comercios_import'

/**
 * Curso 7: SQL avanzado · Misión 5 — Modificar con cabeza.
 *
 * Entorno de pruebas con escritura: UPDATE … FROM con RETURNING, MERGE (o
 * INSERT … ON CONFLICT), DELETE … USING para quitar copias, DELETE …
 * RETURNING dentro de un WITH para mover filas, ON CONFLICT DO NOTHING y
 * transacciones con SAVEPOINT. Trampas: un UPDATE … FROM con claves repetidas
 * en el origen y un ON CONFLICT que «actualiza» con el valor viejo.
 */
export const m05Modificar: Mission = {
  ...COMUN,
  id: 'm05-modificar',
  number: 5,
  title: 'Modificar con cabeza',
  subtitle: 'UPDATE … FROM, MERGE, DELETE … USING, RETURNING, ON CONFLICT y SAVEPOINT.',
  dayLabel: 'Lunes · mes 4',
  verdicts: {
    good: {
      title: 'Cambios hechos, y sabes lo que cambiaste',
      body: 'Límites ajustados, catálogo al día, copias fuera, incidencias archivadas, preferencias para todos y una transacción a medias deshecha con un SAVEPOINT. Y ninguna fila se quedó con un valor al azar o con el valor viejo.',
    },
    ok: {
      title: 'Cambios a medias',
      body: 'Ya modificas datos con varias tablas, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Cambios sin control',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de modificaciones a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Modificar con cabeza',
    paragraphs: [
      'Lunes. Hoy no basta con leer: la consola apunta a una **copia de pruebas** de la base de datos y puedes cambiar datos. Si algo sale mal, «Restaurar» la deja como al principio (cuesta tiempo).',
      'Cada encargo se cumple cuando los datos quedan exactamente como se pide. Si abres una transacción, ciérrala con COMMIT o ROLLBACK.',
    ],
    goals: [
      'Actualiza una tabla con datos de otra (UPDATE … FROM) y mira lo que cambió con RETURNING.',
      'Sincroniza un catálogo con MERGE o INSERT … ON CONFLICT.',
      'Quita filas repetidas con DELETE … USING sin borrar el original.',
      'Mueve filas de una tabla a otra en una sola sentencia.',
      'Inserta solo lo que falta con ON CONFLICT DO NOTHING.',
      'Deshaz parte de una transacción con SAVEPOINT.',
    ],
  },

  docs: [
    {
      id: 'chuleta_modificar',
      title: 'Chuleta: modificar con cabeza',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'update_from' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas de hoy
| tabla | qué es |
|---|---|
| \`ajustes_limite(tarjeta_id, nuevo_limite)\` | límites diarios nuevos aprobados |
| \`comercios_import(id, nombre, categoria, ciudad)\` | el catálogo de comercios que manda el proveedor |
| \`incidencias_archivo\` | misma estructura que \`incidencias\`, vacía |

## Sentencias
| Quiero | Uso |
|---|---|
| Ver lo que cambié | \`UPDATE … RETURNING id, columna\` (también en INSERT y DELETE) |
| Actualizar con otra tabla | \`UPDATE t SET c = o.c FROM otra o WHERE o.id = t.id\` |
| Actualizar o insertar | \`MERGE INTO t USING o ON … WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …\` |
| Lo mismo con clave única | \`INSERT … ON CONFLICT (id) DO UPDATE SET c = EXCLUDED.c\` |
| Insertar solo lo que falta | \`INSERT … ON CONFLICT (id) DO NOTHING\` |
| Borrar con otra tabla | \`DELETE FROM t USING otra o WHERE …\` |
| Mover filas | \`WITH m AS (DELETE … RETURNING *) INSERT INTO destino SELECT * FROM m\` |

## Transacciones
\`\`\`
BEGIN;
  …
  SAVEPOINT punto;
  …
  ROLLBACK TO SAVEPOINT punto;   -- deshace solo desde el punto
COMMIT;
\`\`\``,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: mira antes de cambiar\nSELECT t.id, t.limite_diario, a.nuevo_limite\nFROM tarjetas t\nJOIN ajustes_limite a ON a.tarjeta_id = t.id;',
    retos: [
      {
        id: 'ajustar_limites',
        from: 'ines',
        title: 'Los límites nuevos, con lo que cambió',
        description: 'Pon a cada tarjeta de `ajustes_limite` su `nuevo_limite` en `limite_diario`, en **una sola sentencia** que devuelva `id` y `limite_diario` de las tarjetas cambiadas.',
        hint: '`UPDATE tarjetas t SET limite_diario = a.nuevo_limite FROM ajustes_limite a WHERE a.tarjeta_id = t.id RETURNING t.id, t.limite_diario;`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        columns: ['id', 'limite_diario'],
        requires: [
          exige(/\bupdate\b[\s\S]*\bfrom\b/i, 'Actualiza con los datos de la otra tabla: `UPDATE … SET … FROM ajustes_limite …`.'),
          exige(/\breturning\b/i, 'Devuelve lo que cambiaste con `RETURNING`.'),
        ],
        state: [
          { query: "SELECT string_agg(id || ':' || limite_diario, ',' ORDER BY id) FROM tarjetas WHERE id IN (3, 7, 11, 19, 26)", rows: [['3:800.00,7:1500.00,11:600.00,19:2000.00,26:450.00']] },
          { query: 'SELECT SUM(limite_diario) FROM tarjetas', rows: [['22450.00']] },
        ],
        check: (r) => r.rows.length === 5,
      },
      {
        id: 'sincronizar_comercios',
        from: 'marta',
        title: 'El catálogo de comercios al día',
        description: 'Deja `comercios` como dice `comercios_import`: los que ya existen, con su `nombre`, `categoria` y `ciudad` nuevos; los que no, insertados. Sin tocar el resto.',
        hint: '`MERGE INTO comercios c USING comercios_import i ON c.id = i.id WHEN MATCHED THEN UPDATE SET … WHEN NOT MATCHED THEN INSERT (…) VALUES (…);`',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [exige(/\bmerge\b|\bon\s+conflict\b/i, 'Actualiza o inserta en una sentencia: `MERGE` o `INSERT … ON CONFLICT … DO UPDATE`.')],
        state: [
          { query: `SELECT COUNT(*) FROM ((SELECT id, nombre, categoria, ciudad FROM comercios WHERE id IN (SELECT id FROM comercios_import) EXCEPT ${IMPORT}) UNION ALL (${IMPORT} EXCEPT SELECT id, nombre, categoria, ciudad FROM comercios)) d`, rows: [['0']] },
          { query: 'SELECT COUNT(*) FROM comercios', rows: [['25']] },
        ],
      },
      {
        id: 'quitar_copias',
        from: 'carmen',
        title: 'Fuera los pagos repetidos',
        description: 'Hay pagos con **otra fila idéntica** (misma tarjeta, comercio, importe y hora). Borra las **copias** y deja el original (el de `id` más bajo).',
        hint: '`DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE p.tarjeta_id = o.tarjeta_id AND … AND p.id > o.id;`',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [exige(/\bdelete\b/i, 'Este encargo se cumple borrando: `DELETE FROM pagos_tarjeta …`.')],
        state: [
          { query: 'SELECT COUNT(*) FROM pagos_tarjeta', rows: [['303']] },
          { query: 'SELECT string_agg(id::text, \',\' ORDER BY id) FROM pagos_tarjeta WHERE id IN (55, 180, 233, 304, 305, 306)', rows: [['55,180,233']] },
        ],
      },
      {
        id: 'archivar',
        from: 'nuria',
        title: 'Archivar las incidencias de 2025',
        description: 'Mueve a `incidencias_archivo` las incidencias **cerradas antes del 1 de enero de 2026**: que salgan de `incidencias` y entren en el archivo, en **una sola sentencia**.',
        hint: "`WITH movidas AS (DELETE FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING *) INSERT INTO incidencias_archivo SELECT * FROM movidas;`",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        requires: [exige(/\bdelete\b[\s\S]*\breturning\b/i, 'En una sola sentencia: `WITH m AS (DELETE … RETURNING *) INSERT INTO … SELECT * FROM m`.')],
        state: [
          { query: 'SELECT COUNT(*) FROM incidencias', rows: [['19']] },
          { query: "SELECT string_agg(id::text, ',' ORDER BY id) FROM incidencias_archivo", rows: [['1,2,3,5,6,7,9,10,11,13,14']] },
        ],
      },
      {
        id: 'preferencias_todos',
        from: 'diego',
        title: 'Preferencias para todos los clientes',
        description: "Cada cliente sin fila en `preferencias` necesita una con `canales` = `{email}` e `intereses` vacío (`{}`). Los que ya tienen fila, **igual que estaban**.",
        hint: "`INSERT INTO preferencias (cliente_id, canales, intereses) SELECT id, '{email}', '{}' FROM clientes ON CONFLICT (cliente_id) DO NOTHING;`",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [exige(/\bon\s+conflict\b[\s\S]*\bdo\s+nothing\b|\bnot\s+exists\b|\bexcept\b|\bleft\s+join\b/i, 'Inserta solo los que faltan: `ON CONFLICT (cliente_id) DO NOTHING` (o `WHERE NOT EXISTS`).')],
        state: [
          { query: 'SELECT COUNT(*), SUM(cardinality(canales)) FROM preferencias', rows: [['40', '61']] },
          { query: "SELECT canales::text || '/' || intereses::text FROM preferencias WHERE cliente_id = 38", rows: [['{email}/{}']] },
        ],
      },
      {
        id: 'savepoint',
        from: 'laura',
        title: 'Una transacción deshecha a medias',
        description: 'En una transacción: suma **10 €** al saldo de las cuentas de **ahorro**, marca un `SAVEPOINT`, suma 10 € a las **corrientes**, **deshaz solo esto último** y confirma.',
        hint: '`BEGIN; UPDATE … ahorro; SAVEPOINT antes; UPDATE … corriente; ROLLBACK TO SAVEPOINT antes; COMMIT;`',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [exige(/\bsavepoint\b|\bcommit\b/i, 'Hazlo en una transacción con `SAVEPOINT` y confírmala con `COMMIT`.')],
        state: [{ query: 'SELECT tipo, SUM(saldo) FROM cuentas GROUP BY tipo ORDER BY tipo', rows: [['ahorro', '241982.94'], ['corriente', '174520.13']] }],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La app enseña comercios con nombres mal escritos y faltan tres', severity: 'medium', explanation: 'El catálogo del proveedor no llegó a la tabla.', technique: 'MERGE o INSERT … ON CONFLICT DO UPDATE.', preventedBy: 'reto.sincronizar_comercios' },
    { id: 'C-CARMEN', title: 'Tres clientes ven un pago cobrado dos veces', severity: 'high', explanation: 'Las copias de pagos siguieron en la tabla.', technique: 'DELETE … USING con p.id > o.id.', preventedBy: 'reto.quitar_copias' },
    { id: 'C-NURIA', title: 'La bandeja de Nuria sigue llena de incidencias de 2025', severity: 'low', explanation: 'Nadie las movió al archivo.', technique: 'WITH … DELETE … RETURNING + INSERT.', preventedBy: 'reto.archivar' },
    { id: 'C-DIEGO', title: 'El cliente 38 no puede abrir sus ajustes en la app', severity: 'medium', explanation: 'No tenía fila en preferencias.', technique: 'INSERT … ON CONFLICT DO NOTHING.', preventedBy: 'reto.preferencias_todos' },
    { id: 'C-LAURA', title: 'La prueba de intereses deja las cuentas corrientes cambiadas', severity: 'medium', explanation: 'Sin un SAVEPOINT, había que deshacerlo todo o nada.', technique: 'SAVEPOINT y ROLLBACK TO SAVEPOINT.', preventedBy: 'reto.savepoint' },
    { id: 'C-DUPLICADO', title: 'Una tarjeta se queda con un límite que nadie aprobó', severity: 'high', explanation: 'UPDATE … FROM con dos filas de origen para la misma tarjeta aplica una cualquiera.', technique: 'Comprobar que el origen no repite claves, o MERGE, que da error.', preventedBy: 'practice.update_from_unique' },
    { id: 'C-EXCLUDED', title: 'La sincronización de comercios «actualiza» sin cambiar nada', severity: 'medium', explanation: 'SET nombre = nombre deja el valor que ya había.', technique: 'EXCLUDED.nombre es el valor que se intentó insertar.', preventedBy: 'practice.excluded' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los cambios del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.sincronizar_comercios', label: 'Catálogo de Marta', explanation: 'Comercios actualizados e insertados.' },
      { flag: 'reto.quitar_copias', label: 'Pagos de Carmen', explanation: 'Copias fuera, originales dentro.' },
      { flag: 'reto.archivar', label: 'Bandeja de Nuria', explanation: 'Incidencias de 2025 en el archivo.' },
      { flag: 'reto.preferencias_todos', label: 'Ajustes de Diego', explanation: 'Preferencias para todos.' },
      { flag: 'reto.savepoint', label: 'Prueba de Laura', explanation: 'Solo el ahorro cambió.' },
      { flag: 'practice.update_from_unique', label: 'Origen sin repetidos', explanation: 'Una fila de origen por fila a cambiar.' },
      { flag: 'practice.excluded', label: 'EXCLUDED', explanation: 'El valor nuevo, no el viejo.' },
    ],
  },

  concepts: [
    { id: 'update_from', title: 'UPDATE … FROM', summary: 'Actualizar una tabla con los datos de otra; si el origen repite claves, el resultado es imprevisible.' },
    { id: 'returning', title: 'RETURNING', summary: 'INSERT, UPDATE y DELETE devuelven las filas afectadas, como un SELECT.' },
    { id: 'merge', title: 'MERGE', summary: 'Actualizar las que coinciden e insertar las que no, en una sentencia.' },
    { id: 'upsert', title: 'INSERT … ON CONFLICT', summary: 'DO NOTHING ignora las que chocan con una clave única; DO UPDATE las actualiza con EXCLUDED.' },
    { id: 'delete_using', title: 'DELETE … USING', summary: 'Borrar mirando otra tabla (o la misma), por ejemplo las copias de un original.' },
    { id: 'cte_dml', title: 'Mover filas con WITH', summary: 'WITH m AS (DELETE … RETURNING *) INSERT … SELECT * FROM m: todo o nada.' },
    { id: 'savepoint', title: 'Transacciones y SAVEPOINT', summary: 'BEGIN … COMMIT agrupa cambios; ROLLBACK TO SAVEPOINT deshace solo una parte.' },
  ],
  debriefConcepts: ['update_from', 'returning', 'merge', 'upsert', 'delete_using', 'cte_dml', 'savepoint'],
  seniorTips: [
    'Lee la chuleta de modificar con cabeza en la wiki.',
    'Inés: UPDATE tarjetas t SET limite_diario = a.nuevo_limite FROM ajustes_limite a WHERE a.tarjeta_id = t.id RETURNING t.id, t.limite_diario.',
    'Marta: MERGE INTO comercios c USING comercios_import i ON c.id = i.id WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT ….',
    'Carmen: DELETE FROM pagos_tarjeta p USING pagos_tarjeta o WHERE (mismas columnas) AND p.id > o.id.',
    "Nuria: WITH m AS (DELETE FROM incidencias WHERE cerrada_en < '2026-01-01' RETURNING *) INSERT INTO incidencias_archivo SELECT * FROM m.",
    "Diego: INSERT INTO preferencias … SELECT id, '{email}', '{}' FROM clientes ON CONFLICT (cliente_id) DO NOTHING.",
    'Laura: BEGIN; UPDATE ahorro; SAVEPOINT antes; UPDATE corriente; ROLLBACK TO SAVEPOINT antes; COMMIT;',
    'Con Inés: el origen de un UPDATE … FROM sin claves repetidas, y EXCLUDED en ON CONFLICT.',
  ],

  lessons: [
    {
      id: 'update_from',
      question: '¿Cómo actualizo una tabla con datos de otra?',
      conceptId: 'update_from',
      cost: 5,
      body: `Con \`FROM\` y la condición de cruce en el \`WHERE\`:

\`\`\`
UPDATE tarjetas t
SET limite_diario = a.nuevo_limite
FROM ajustes_limite a
WHERE a.tarjeta_id = t.id;
\`\`\`

Solo cambian las filas de \`tarjetas\` que cruzan. **Ojo:** si el origen tiene dos filas para la misma tarjeta, PostgreSQL aplica **una cualquiera**, sin avisar. Antes, \`GROUP BY tarjeta_id HAVING COUNT(*) > 1\` sobre el origen.`,
    },
    {
      id: 'returning',
      question: '¿Cómo veo lo que acabo de cambiar?',
      conceptId: 'returning',
      cost: 5,
      body: `Añade \`RETURNING\` al final de un INSERT, UPDATE o DELETE: devuelve las filas afectadas, como un SELECT.

\`\`\`
UPDATE … RETURNING t.id, t.limite_diario;
DELETE FROM … RETURNING id;
INSERT INTO … RETURNING id;   -- el id que generó la base de datos
\`\`\`

Te ahorra la consulta de comprobación y te dice exactamente qué filas tocaste.`,
    },
    {
      id: 'merge',
      question: '¿Cómo sincronizo una tabla con otra?',
      conceptId: 'merge',
      cost: 5,
      body: `\`MERGE\` decide fila a fila:

\`\`\`
MERGE INTO comercios c
USING comercios_import i ON c.id = i.id
WHEN MATCHED THEN
  UPDATE SET nombre = i.nombre, categoria = i.categoria, ciudad = i.ciudad
WHEN NOT MATCHED THEN
  INSERT (id, nombre, categoria, ciudad) VALUES (i.id, i.nombre, i.categoria, i.ciudad);
\`\`\`

Si una fila de destino cruza con dos del origen, MERGE **da error** en vez de elegir una: mejor que un dato al azar.`,
    },
    {
      id: 'upsert',
      question: '¿Qué es ON CONFLICT y qué es EXCLUDED?',
      conceptId: 'upsert',
      cost: 5,
      body: `\`INSERT … ON CONFLICT (columna_única)\` dice qué hacer si la fila choca con una clave única:

- \`DO NOTHING\`: no la inserta y sigue con las demás.
- \`DO UPDATE SET nombre = EXCLUDED.nombre\`: actualiza la que ya estaba.

\`EXCLUDED\` es la fila que **intentabas** insertar. \`SET nombre = nombre\` deja el valor viejo. Necesita una clave primaria o única en esas columnas.`,
    },
    {
      id: 'delete_using',
      question: '¿Cómo borro las copias sin borrar el original?',
      conceptId: 'delete_using',
      cost: 5,
      body: `Cruza la tabla consigo misma con \`USING\` y quédate con la de id más bajo:

\`\`\`
DELETE FROM pagos_tarjeta p
USING pagos_tarjeta o
WHERE p.tarjeta_id = o.tarjeta_id AND p.comercio_id = o.comercio_id
  AND p.importe = o.importe AND p.pagado_en = o.pagado_en
  AND p.id > o.id;
\`\`\`

Con \`p.id <> o.id\` borrarías las dos filas de cada pareja. Prueba antes con un SELECT de las mismas condiciones.`,
    },
    {
      id: 'cte_dml',
      question: '¿Cómo muevo filas de una tabla a otra sin perder ninguna?',
      conceptId: 'cte_dml',
      cost: 5,
      body: `En una sola sentencia, con un WITH que borra y devuelve lo borrado:

\`\`\`
WITH movidas AS (
  DELETE FROM incidencias WHERE cerrada_en < '2026-01-01'
  RETURNING *
)
INSERT INTO incidencias_archivo SELECT * FROM movidas;
\`\`\`

Es una sola sentencia: o se hace todo o nada. Con un INSERT y luego un DELETE por separado, una fila que cambie entre medias se queda en un sitio o en ninguno.`,
    },
    {
      id: 'savepoint',
      question: '¿Para qué sirve un SAVEPOINT?',
      conceptId: 'savepoint',
      cost: 5,
      body: `\`BEGIN\` abre una transacción: nada se ve fuera hasta el \`COMMIT\`, y \`ROLLBACK\` lo deshace todo. Un \`SAVEPOINT\` marca un punto intermedio:

\`\`\`
BEGIN;
UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'ahorro';
SAVEPOINT antes_corrientes;
UPDATE cuentas SET saldo = saldo + 10 WHERE tipo = 'corriente';
ROLLBACK TO SAVEPOINT antes_corrientes;   -- deshace solo las corrientes
COMMIT;
\`\`\`

Si una sentencia falla dentro de la transacción, todo lo siguiente da error hasta un ROLLBACK (o ROLLBACK TO SAVEPOINT).`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a5pre_returning', conceptId: 'returning', question: '¿Qué hace `RETURNING id` al final de un UPDATE?', options: ['Deshace el cambio', 'Devuelve el id de las filas cambiadas', 'Cuenta las filas', 'Nada'], correct: 1, explanation: 'Devuelve las filas afectadas.' },
      { id: 'a5pre_update', conceptId: 'update_from', question: 'Para actualizar `tarjetas` con datos de `ajustes_limite`…', options: ['UPDATE tarjetas JOIN ajustes_limite …', 'UPDATE tarjetas t SET … FROM ajustes_limite a WHERE a.tarjeta_id = t.id', 'UPDATE ajustes_limite SET tarjetas …', 'No se puede'], correct: 1, explanation: 'En PostgreSQL, UPDATE … FROM.' },
      { id: 'a5pre_merge', conceptId: 'merge', question: '¿Qué hace MERGE?', options: ['Une dos tablas en una', 'Actualiza las filas que coinciden e inserta las que no', 'Borra duplicados', 'Crea un índice'], correct: 1, explanation: 'WHEN MATCHED / WHEN NOT MATCHED.' },
      { id: 'a5pre_nothing', conceptId: 'upsert', question: '¿Qué hace `ON CONFLICT (cliente_id) DO NOTHING`?', options: ['Falla si hay conflicto', 'No inserta las filas que ya existen y sigue', 'Borra la existente', 'Actualiza la existente'], correct: 1, explanation: 'Ignora las que chocan con la clave única.' },
      { id: 'a5pre_delete', conceptId: 'delete_using', question: 'Para borrar las copias y quedarte con el original de id más bajo…', options: ['p.id <> o.id', 'p.id > o.id', 'p.id < o.id', 'DISTINCT'], correct: 1, explanation: 'Se borra la de id más alto de cada pareja.' },
      { id: 'a5pre_savepoint', conceptId: 'savepoint', question: '¿Qué deshace `ROLLBACK TO SAVEPOINT x`?', options: ['Toda la transacción', 'Solo lo hecho después de x', 'Solo la última sentencia', 'Nada'], correct: 1, explanation: 'La transacción sigue abierta desde x.' },
    ],
    post: [
      { id: 'a5post_dup', conceptId: 'update_from', question: 'El origen de un UPDATE … FROM tiene dos filas para la tarjeta 7 (1.500 y 2.500). ¿Qué límite queda?', options: ['El mayor', 'Uno cualquiera de los dos, sin aviso', 'La suma', 'Da error'], correct: 1, explanation: 'Por eso hay que comprobar el origen (o usar MERGE, que sí da error).' },
      { id: 'a5post_excluded', conceptId: 'upsert', question: '`ON CONFLICT (id) DO UPDATE SET nombre = nombre`. ¿Qué nombre queda?', options: ['El nuevo', 'El que ya había', 'NULL', 'Da error'], correct: 1, explanation: 'El nuevo es EXCLUDED.nombre.' },
      { id: 'a5post_cte', conceptId: 'cte_dml', question: '¿Por qué mover filas con `WITH m AS (DELETE … RETURNING *) INSERT …`?', options: ['Es más corto', 'Es una sola sentencia: o se mueven todas o ninguna, las mismas filas', 'Es más rápido siempre', 'No se puede de otra forma'], correct: 1, explanation: 'Lo borrado y lo insertado son exactamente las mismas filas.' },
      { id: 'a5post_returning', conceptId: 'returning', question: '¿Qué devuelve `DELETE FROM pagos_tarjeta WHERE id = 304 RETURNING *`?', options: ['Nada', 'La fila borrada, con todas sus columnas', 'El número 1', 'Un error'], correct: 1, explanation: 'RETURNING funciona igual en DELETE.' },
      { id: 'a5post_merge', conceptId: 'merge', question: 'MERGE encuentra dos filas de origen para el mismo destino. ¿Qué pasa?', options: ['Usa la primera', 'Da error', 'Inserta las dos', 'Las ignora'], correct: 1, explanation: 'Mejor un error que un dato al azar.' },
      { id: 'a5post_tx', conceptId: 'savepoint', question: 'En una transacción, un UPDATE da error. ¿Qué pasa con la siguiente sentencia?', options: ['Se ejecuta normal', 'Da error hasta que hagas ROLLBACK (o ROLLBACK TO SAVEPOINT)', 'Se hace COMMIT solo', 'Se repite el UPDATE'], correct: 1, explanation: 'La transacción queda abortada.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Hoy se escribe',
      body: 'Buenos días.\n\nHasta ahora solo has leído. Esta semana toca **cambiar datos**, y hacerlo bien: con varias tablas a la vez, sabiendo qué filas tocas y pudiendo deshacer. La consola apunta a una **copia de pruebas**; si algo sale mal, «Restaurar» la deja como al principio.\n\nPara empezar, Riesgos ha aprobado **límites diarios nuevos** para cinco tarjetas (`ajustes_limite`):\n\n- Ponlos en `tarjetas.limite_diario` en **una sola sentencia** que devuelva `id` y `limite_diario` de las tarjetas cambiadas.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'update_from' }, { kind: 'unlock', conceptId: 'returning' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.ajustar_limites' },
      body: 'Cinco tarjetas, y RETURNING te dice cuáles sin otra consulta. La 11 ya tenía 600: también cuenta como cambiada, porque el UPDATE la tocó.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_catalogo',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! El proveedor nos manda el catálogo de comercios corregido en `comercios_import`: hay nombres arreglados de comercios que ya tenemos y **tres comercios nuevos**. ¿Dejas `comercios` como dice el proveedor? Sin tocar los que no vienen.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'merge' }, { kind: 'unlock', conceptId: 'upsert' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.sincronizar_comercios' },
      body: '«Café Central» ya sin el espacio delante, la floristería con su categoría y tres comercios más. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_copias',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Hay pagos de tarjeta que están **dos veces**: misma tarjeta, mismo comercio, mismo importe y misma hora. Borra las **copias** y deja el original, el de `id` más bajo.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'delete_using' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.quitar_copias' },
      body: 'Tres copias fuera (304, 305 y 306) y los originales en su sitio. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_repetidas',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «¿1.500 o 2.500?»',
      body: '**Inés:** Riesgos mandó otra tanda de límites y la tarjeta 7 venía **dos veces** en el fichero: una con 1.500 y otra con 2.500. Rubén lanzó el mismo `UPDATE … FROM` que tú y no dio ningún error. ¿Qué límite tiene ahora la tarjeta 7?',
      onDeliver: [],
      choices: [
        {
          id: 'unique',
          text: 'No se sabe: con dos filas de origen para la misma tarjeta, `UPDATE … FROM` aplica **una cualquiera** y no avisa. Antes de actualizar hay que comprobar el origen (`GROUP BY tarjeta_id HAVING COUNT(*) > 1`) y decidir cuál vale. Con `MERGE`, en cambio, daría error.',
          cost: 10,
          reply: 'Exacto. Un UPDATE … FROM se fía del origen. Si el origen repite claves, el resultado depende de cómo lea las filas PostgreSQL ese día.',
          effects: [
            { kind: 'flag', key: 'practice.update_from_unique' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Comprueba que el origen de un UPDATE … FROM no repite claves.' },
          ],
        },
        {
          id: 'last',
          text: '2.500, el último del fichero.',
          cost: 10,
          reply: 'Una tabla no tiene «último»: sin ORDER BY no hay orden, y el UPDATE no usa ninguno. Puede ser cualquiera de los dos.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por hecho un orden que el UPDATE no tiene.' }],
        },
        {
          id: 'both',
          text: 'Se aplican los dos, uno detrás de otro, y queda 2.500.',
          cost: 10,
          reply: 'Cada fila de destino se actualiza una sola vez por sentencia. Gana una de las dos, la que sea.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Pensaste que el UPDATE aplica todas las filas del origen.' }],
        },
      ],
    },
    {
      id: 'nuria_archivo',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Mi bandeja de incidencias va lentísima. ¿Puedes **mover al archivo** (`incidencias_archivo`) las que se **cerraron antes del 1 de enero de 2026**? Que salgan de `incidencias` y entren en el archivo, sin perder ninguna por el camino.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'cte_dml' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.archivar' },
      body: 'Once al archivo y diecinueve en la bandeja. ¡Qué descanso, gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_preferencias',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. La pantalla de ajustes de la app falla si el cliente **no tiene fila** en `preferencias`. Quiero una para cada cliente que no la tenga, con `canales` = `{email}` e `intereses` vacío (`{}`). Y los que ya la tienen, **que no se toquen**: hay gente que ha quitado el email a propósito.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.preferencias_todos' },
      body: 'Solo faltaba el cliente 38, y los cinco que quitaron todos los canales siguen igual. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_savepoint',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Estoy probando el abono de intereses y necesito este estado en la copia: **10 € más** en todas las cuentas de **ahorro**, y las corrientes como estaban. Quiero ver que se puede deshacer **solo una parte**: en una transacción, suma 10 € al ahorro, marca un `SAVEPOINT`, suma 10 € a las corrientes, **vuelve al savepoint** y confirma.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'savepoint' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.savepoint' },
      body: 'Ahorro con 130 € más entre las trece cuentas y las corrientes intactas. Justo lo que quería probar. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_excluded',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «se actualizó, pero no cambió nada»',
      body: '**Inés:** Diego ha hecho la sincronización de comercios para el proceso nocturno así:\n\n`INSERT INTO comercios SELECT * FROM comercios_import ON CONFLICT (id) DO UPDATE SET nombre = comercios.nombre, categoria = comercios.categoria, ciudad = comercios.ciudad;`\n\nNo da error y dice que ha procesado siete filas, pero los nombres siguen mal. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'excluded',
          text: 'Que en `DO UPDATE`, `comercios.nombre` es el valor que **ya estaba**: lo está poniendo igual. El valor que intentaba insertar es `EXCLUDED.nombre`. Tiene que ser `SET nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria, ciudad = EXCLUDED.ciudad`.',
          cost: 10,
          reply: 'Eso es. EXCLUDED es la fila que chocó. Sin él, el DO UPDATE no hace nada útil y encima lo cuenta como hecho.',
          effects: [
            { kind: 'flag', key: 'practice.excluded' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'En ON CONFLICT DO UPDATE, el valor nuevo es EXCLUDED.columna.' },
          ],
        },
        {
          id: 'nothing',
          text: 'Que use `DO NOTHING`, que es más seguro.',
          cost: 10,
          reply: 'Con DO NOTHING los comercios que ya existen se quedan con el nombre mal. Queremos actualizarlos, con el valor bueno.',
          effects: [{ kind: 'note', tone: 'bad', text: 'DO NOTHING no actualiza nada.' }],
        },
        {
          id: 'commit',
          text: 'Que le faltará un COMMIT.',
          cost: 10,
          reply: 'Sin transacción abierta, cada sentencia se confirma sola. Los cambios están: es que cambió cada valor por sí mismo.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a la transacción de un SET que no cambia nada.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Primer día escribiendo. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que antes de cambiar hay que saber qué filas toco (un SELECT con las mismas condiciones y RETURNING); que el origen de un UPDATE … FROM no puede repetir claves; que MERGE y ON CONFLICT sincronizan, con EXCLUDED para el valor nuevo; que DELETE … USING con `p.id > o.id` deja el original; que mover filas se hace en una sentencia; y que un SAVEPOINT deshace solo una parte.',
          reply: 'Muy bien. Mañana, que la base de datos no deje entrar datos malos: reglas.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'restore',
          text: 'Que da igual equivocarse, porque siempre se puede restaurar.',
          reply: 'En la copia de pruebas, sí. En producción no hay botón de «Restaurar». Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con que siempre se puede restaurar.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
