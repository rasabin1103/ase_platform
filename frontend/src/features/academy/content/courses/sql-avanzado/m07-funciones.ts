import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const q = (sql: string) => sql.replace(/'/g, "''")
/** Comprobación con una sonda que siempre se deshace: 'ok' o el SQLSTATE del error. */
const sonda = (sql: string, esperado: string) => ({ query: `SELECT qa.probar('${q(sql)}')`, rows: [[esperado]] })
/** Ejecuta las sentencias, lee la consulta y lo deshace todo. */
const efecto = (sentencias: string[], consulta: string, esperado: string) => ({
  query: `SELECT qa.efecto(ARRAY[${sentencias.map((s) => `'${q(s)}'`).join(', ')}], '${q(consulta)}')`,
  rows: [[esperado]],
})

const FUNCION = exige(/\bcreate\s+(or\s+replace\s+)?function\b/i, 'Este encargo se cumple creando una función: `CREATE FUNCTION nombre(…) RETURNS … AS $$ … $$`.')
const TRIGGER = exige(/\bcreate\s+(or\s+replace\s+)?trigger\b/i, 'Este encargo se cumple con un trigger: `CREATE TRIGGER … EXECUTE FUNCTION …`.')

/**
 * Curso 7: SQL avanzado · Misión 7 — Funciones y triggers.
 *
 * Funciones en SQL (un valor y RETURNS TABLE) y en PL/pgSQL (variables, IF),
 * triggers AFTER para auditar y BEFORE para validar o completar la fila.
 * Las comprobaciones usan qa.efecto y qa.probar, que lo deshacen todo.
 * Trampas: un trigger BEFORE con RETURN NULL (la fila no se guarda) y un
 * trigger que actualiza su propia tabla (recursión infinita).
 */
export const m07Funciones: Mission = {
  ...COMUN,
  id: 'm07-funciones',
  number: 7,
  title: 'Funciones y triggers',
  subtitle: 'Funciones en SQL y PL/pgSQL, RETURNS TABLE y triggers BEFORE y AFTER.',
  dayLabel: 'Miércoles · mes 4',
  verdicts: {
    good: {
      title: 'Lógica donde están los datos',
      body: 'El saldo de un cliente en una llamada, los pagos de una tarjeta como una tabla, el nivel de riesgo calculado igual para todos, cada cambio de saldo auditado, los ahorros sin negativos y la fecha de cambio de los comercios puesta sola. Y ningún trigger que se coma filas o se llame a sí mismo.',
    },
    ok: {
      title: 'Funciones a medias',
      body: 'Ya escribes funciones y triggers, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Lógica repetida por todas partes',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de funciones y triggers a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Funciones y triggers',
    paragraphs: [
      'Miércoles. Hay cálculos que cada equipo hace a su manera y cosas que deberían pasar **siempre** que cambia un dato. Hoy los metes en la base de datos: funciones que se llaman desde cualquier consulta y triggers que saltan solos.',
      'Seguimos en la **copia de pruebas**. Inés comprueba cada encargo llamando a tus funciones o cambiando datos dentro de una prueba que luego deshace.',
    ],
    goals: [
      'Escribe una función en SQL que devuelve un valor.',
      'Escribe una función que devuelve una tabla (RETURNS TABLE).',
      'Escribe una función en PL/pgSQL con variables e IF.',
      'Audita cambios con un trigger AFTER.',
      'Valida o completa la fila con un trigger BEFORE.',
      'Evita los dos errores clásicos: RETURN NULL y el trigger que se llama a sí mismo.',
    ],
  },

  docs: [
    {
      id: 'chuleta_funciones',
      title: 'Chuleta: funciones y triggers',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'sql_function' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Funciones
\`\`\`
-- En SQL: el resultado de la última consulta
CREATE FUNCTION nombre(p_x integer) RETURNS numeric
LANGUAGE sql AS $$ SELECT … WHERE col = p_x $$;

-- Que devuelve filas
CREATE FUNCTION nombre(p_x integer)
RETURNS TABLE (id integer, importe numeric) LANGUAGE sql AS $$ SELECT … $$;

-- En PL/pgSQL: variables, IF, RETURN
CREATE FUNCTION nombre(p_x integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE v numeric;
BEGIN
  v := …;
  IF v < 10 THEN RETURN 'a'; ELSIF … THEN … ELSE RETURN 'c'; END IF;
END $$;
\`\`\`
Cambiarla: \`CREATE OR REPLACE FUNCTION\` (mismos parámetros y tipo de resultado).

## Triggers
\`\`\`
CREATE FUNCTION f() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  … OLD.col (antes) … NEW.col (después) …
  RETURN NEW;
END $$;

CREATE TRIGGER t BEFORE|AFTER INSERT OR UPDATE [OF col] ON tabla
FOR EACH ROW EXECUTE FUNCTION f();
\`\`\`
| | BEFORE | AFTER |
|---|---|---|
| Puede cambiar NEW | sí | no |
| Puede impedir la fila | sí (\`RAISE EXCEPTION\`) | sí (\`RAISE EXCEPTION\`) |
| Para | validar, completar | auditar, avisar |

Para parar con un error: \`RAISE EXCEPTION 'mensaje %', valor;\` (código P0001).`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: el cálculo que hoy repite cada equipo\nSELECT cliente_id, SUM(saldo) AS saldo_total\nFROM cuentas\nGROUP BY cliente_id\nORDER BY cliente_id;',
    retos: [
      {
        id: 'saldo_cliente',
        from: 'ines',
        title: 'saldo_cliente(cliente)',
        description: 'Crea la función **`saldo_cliente(p_cliente integer)`** que devuelve la **suma del saldo** de las cuentas del cliente, y **0** si no tiene cuentas.',
        hint: '`CREATE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric LANGUAGE sql AS $$ SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente $$;`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [FUNCION],
        state: [{ query: 'SELECT (saldo_cliente(1) = 2376.40 AND saldo_cliente(33) = 38158.85 AND saldo_cliente(38) = 0)::text', rows: [['true']] }],
      },
      {
        id: 'pagos_de',
        from: 'marta',
        title: 'pagos_de(tarjeta), como una tabla',
        description: 'Crea **`pagos_de(p_tarjeta integer)`**, que devuelve los pagos de esa tarjeta como una tabla con las columnas **`id`**, **`importe`** y **`pagado_en`**, para poder hacer `SELECT … FROM pagos_de(5)`.',
        hint: '`CREATE FUNCTION pagos_de(p_tarjeta integer) RETURNS TABLE (id integer, importe numeric, pagado_en timestamp) LANGUAGE sql AS $$ SELECT p.id, p.importe, p.pagado_en FROM pagos_tarjeta p WHERE p.tarjeta_id = p_tarjeta $$;`',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        requires: [FUNCION, exige(/\breturns\s+(table|setof)\b/i, 'Que devuelva filas: `RETURNS TABLE (id integer, importe numeric, pagado_en timestamp)`.')],
        state: [
          { query: 'SELECT COUNT(id), SUM(importe), MAX(pagado_en)::text FROM pagos_de(5)', rows: [['12', '4288.05', '2026-02-17 20:57:30']] },
          { query: 'SELECT COUNT(*) FROM pagos_de(999)', rows: [['0']] },
        ],
      },
      {
        id: 'nivel_riesgo',
        from: 'carmen',
        title: 'nivel_riesgo(cliente)',
        description: "Crea **`nivel_riesgo(p_cliente integer)`** en **PL/pgSQL** que devuelva `'alto'` si el saldo total del cliente es **menor de 1.000 €**, `'medio'` si es **menor de 10.000 €** y `'bajo'` en otro caso. Puedes usar `saldo_cliente`.",
        hint: "`DECLARE s numeric; BEGIN s := saldo_cliente(p_cliente); IF s < 1000 THEN RETURN 'alto'; ELSIF s < 10000 THEN RETURN 'medio'; ELSE RETURN 'bajo'; END IF; END`",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        requires: [FUNCION, exige(/\bplpgsql\b/i, 'Escríbela en PL/pgSQL: `LANGUAGE plpgsql`.')],
        state: [
          { query: 'SELECT nivel_riesgo(id), COUNT(*) FROM clientes GROUP BY 1 ORDER BY 1', rows: [['alto', '3'], ['bajo', '12'], ['medio', '25']] },
          { query: 'SELECT nivel_riesgo(38)', rows: [['alto']] },
        ],
      },
      {
        id: 'auditoria',
        from: 'nuria',
        title: 'Cada cambio de saldo, apuntado',
        description: 'Crea la tabla **`auditoria_saldos`** (`id serial`, `cuenta_id`, `saldo_anterior`, `saldo_nuevo`, `cambiado_en timestamp DEFAULT now()`) y un **trigger** que apunte una fila cada vez que **cambia el saldo** de una cuenta. Un cambio en otras columnas no se apunta.',
        hint: '`CREATE FUNCTION auditar_saldo() RETURNS trigger … INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo) VALUES (OLD.id, OLD.saldo, NEW.saldo); RETURN NEW; …` y `CREATE TRIGGER … AFTER UPDATE OF saldo ON cuentas FOR EACH ROW EXECUTE FUNCTION auditar_saldo();`',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        requires: [TRIGGER],
        state: [
          efecto(['UPDATE cuentas SET saldo = saldo + 0.37 WHERE id = 1'], 'SELECT COUNT(*) FROM auditoria_saldos WHERE cuenta_id = 1 AND saldo_nuevo - saldo_anterior = 0.37 AND cambiado_en IS NOT NULL', '1'),
          { query: "SELECT (qa.efecto(ARRAY['UPDATE cuentas SET estado = estado WHERE id = 1'], 'SELECT COUNT(*) FROM auditoria_saldos') = (SELECT COUNT(*) FROM auditoria_saldos)::text)::text", rows: [['true']] },
        ],
      },
      {
        id: 'ahorro_positivo',
        from: 'diego',
        title: 'Ninguna cuenta de ahorro en negativo',
        description: 'Crea un **trigger BEFORE** en `cuentas` que, al **insertar o cambiar** una cuenta de **ahorro** con saldo **negativo**, pare con un error (`RAISE EXCEPTION`). Las corrientes pueden quedar en negativo.',
        hint: "`IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION 'Saldo negativo en la cuenta de ahorro %', NEW.id; END IF; RETURN NEW;` y `CREATE TRIGGER … BEFORE INSERT OR UPDATE ON cuentas FOR EACH ROW …`",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        requires: [TRIGGER],
        state: [
          sonda('UPDATE cuentas SET saldo = -5 WHERE id = 4', 'P0001'),
          sonda('UPDATE cuentas SET saldo = -5 WHERE id = 1', 'ok'),
          sonda('UPDATE cuentas SET saldo = saldo + 5 WHERE id = 4', 'ok'),
          sonda("INSERT INTO cuentas VALUES (99, 1, 'ES00 PRUEBA', 'ahorro', -5, 'EUR', '2026-01-01', 'activa')", 'P0001'),
          efecto(["UPDATE cuentas SET saldo = 7.5 WHERE id = 4"], 'SELECT saldo FROM cuentas WHERE id = 4', '7.50'),
        ],
      },
      {
        id: 'actualizado_en',
        from: 'laura',
        title: 'La fecha de cambio de los comercios, sola',
        description: 'Añade a `comercios` la columna **`actualizado_en`** (timestamp) y un **trigger** que la ponga a la hora actual **cada vez que se cambia** un comercio, sin que nadie tenga que escribirla.',
        hint: '`ALTER TABLE comercios ADD COLUMN actualizado_en timestamp;` y un trigger **BEFORE UPDATE** cuya función haga `NEW.actualizado_en := now(); RETURN NEW;`',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        requires: [TRIGGER],
        state: [
          efecto(["UPDATE comercios SET ciudad = 'Toledo', actualizado_en = NULL WHERE id = 3"], "SELECT ciudad || ':' || (actualizado_en IS NOT NULL)::text FROM comercios WHERE id = 3", 'Toledo:true'),
        ],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El informe de Marta copia y pega la consulta de pagos en diez sitios', severity: 'low', explanation: 'Sin una función, cada informe repite (y cambia) la consulta.', technique: 'RETURNS TABLE y SELECT … FROM pagos_de(…).', preventedBy: 'reto.pagos_de' },
    { id: 'C-CARMEN', title: 'Riesgos y la app dan niveles de riesgo distintos al mismo cliente', severity: 'high', explanation: 'Cada uno calculaba el nivel con sus propios límites.', technique: 'Una función PL/pgSQL que usan todos.', preventedBy: 'reto.nivel_riesgo' },
    { id: 'C-NURIA', title: 'Un cliente reclama un cambio de saldo y nadie sabe cuándo pasó', severity: 'high', explanation: 'Los cambios de saldo no dejaban rastro.', technique: 'Trigger AFTER UPDATE OF saldo que apunta OLD y NEW.', preventedBy: 'reto.auditoria' },
    { id: 'C-DIEGO', title: 'Un script deja una cuenta de ahorro en negativo', severity: 'high', explanation: 'La regla solo estaba en la app.', technique: 'Trigger BEFORE con RAISE EXCEPTION.', preventedBy: 'reto.ahorro_positivo' },
    { id: 'C-LAURA', title: 'Los tests de regresión no saben qué comercios cambiaron', severity: 'low', explanation: 'Nadie rellenaba la fecha de cambio.', technique: 'Trigger BEFORE UPDATE con NEW.actualizado_en := now().', preventedBy: 'reto.actualizado_en' },
    { id: 'C-RETURN', title: 'Los cambios de comercios desaparecen sin error', severity: 'high', explanation: 'Un trigger BEFORE que devuelve NULL descarta la fila.', technique: 'RETURN NEW en los triggers BEFORE de fila.', preventedBy: 'practice.trigger_return' },
    { id: 'C-BUCLE', title: 'Cualquier cambio en cuentas da «stack depth limit exceeded»', severity: 'medium', explanation: 'Un trigger AFTER UPDATE hace un UPDATE de su propia tabla y se llama a sí mismo.', technique: 'Cambiar NEW en un BEFORE, o limitar con WHEN.', preventedBy: 'practice.trigger_loop' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con las funciones y triggers del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.pagos_de', label: 'Informes de Marta', explanation: 'Una función en vez de diez copias.' },
      { flag: 'reto.nivel_riesgo', label: 'Riesgo de Carmen', explanation: 'Un solo cálculo para todos.' },
      { flag: 'reto.auditoria', label: 'Reclamaciones de Nuria', explanation: 'Cada cambio de saldo, apuntado.' },
      { flag: 'reto.ahorro_positivo', label: 'Cuentas de Diego', explanation: 'Ahorro sin negativos.' },
      { flag: 'reto.actualizado_en', label: 'Regresión de Laura', explanation: 'Fecha de cambio automática.' },
      { flag: 'practice.trigger_return', label: 'RETURN NEW', explanation: 'Las filas no se pierden.' },
      { flag: 'practice.trigger_loop', label: 'Sin bucles', explanation: 'Ningún trigger se llama a sí mismo.' },
    ],
  },

  concepts: [
    { id: 'sql_function', title: 'Funciones en SQL', summary: 'CREATE FUNCTION … LANGUAGE sql: devuelve el resultado de la última consulta; se llama como cualquier función.' },
    { id: 'returns_table', title: 'RETURNS TABLE', summary: 'Una función que devuelve filas y se usa en el FROM como una tabla.' },
    { id: 'plpgsql', title: 'PL/pgSQL', summary: 'Variables (DECLARE), asignaciones (:=), IF/ELSIF/ELSE y RETURN.' },
    { id: 'trigger_after', title: 'Triggers AFTER', summary: 'Saltan después del cambio; con OLD y NEW se audita qué cambió.' },
    { id: 'trigger_before', title: 'Triggers BEFORE', summary: 'Saltan antes de guardar: pueden cambiar NEW o parar con RAISE EXCEPTION.' },
    { id: 'trigger_return', title: 'Qué devuelve un trigger', summary: 'Un BEFORE de fila devuelve NEW para guardarla; NULL la descarta sin error.' },
    { id: 'trigger_loop', title: 'Triggers que se llaman a sí mismos', summary: 'Un UPDATE de la misma tabla dentro del trigger lo vuelve a disparar.' },
  ],
  debriefConcepts: ['sql_function', 'returns_table', 'plpgsql', 'trigger_after', 'trigger_before', 'trigger_return', 'trigger_loop'],
  seniorTips: [
    'Lee la chuleta de funciones y triggers en la wiki.',
    'Inés: RETURNS numeric LANGUAGE sql AS $$ SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente $$.',
    'Marta: RETURNS TABLE (id integer, importe numeric, pagado_en timestamp) y un SELECT con alias p. para no chocar con los nombres.',
    "Carmen: LANGUAGE plpgsql, DECLARE s numeric; s := saldo_cliente(p_cliente); IF … ELSIF … ELSE … END IF.",
    'Nuria: CREATE TABLE auditoria_saldos (…), función que inserta OLD.id, OLD.saldo, NEW.saldo y CREATE TRIGGER … AFTER UPDATE OF saldo ON cuentas.',
    "Diego: BEFORE INSERT OR UPDATE ON cuentas; IF NEW.tipo = 'ahorro' AND NEW.saldo < 0 THEN RAISE EXCEPTION …; RETURN NEW.",
    'Laura: ADD COLUMN actualizado_en timestamp y BEFORE UPDATE con NEW.actualizado_en := now(); RETURN NEW.',
    'Con Inés: RETURN NEW en los BEFORE, y nunca un UPDATE de la propia tabla dentro de su trigger.',
  ],

  lessons: [
    {
      id: 'sql_function',
      question: '¿Cómo escribo una función en SQL?',
      conceptId: 'sql_function',
      cost: 5,
      body: `\`\`\`
CREATE FUNCTION saldo_cliente(p_cliente integer) RETURNS numeric
LANGUAGE sql AS $$
  SELECT COALESCE(SUM(saldo), 0) FROM cuentas WHERE cliente_id = p_cliente
$$;

SELECT id, nombre, saldo_cliente(id) FROM clientes;
\`\`\`

El cuerpo va entre \`$$\` (así no hay que escapar comillas). Devuelve el resultado de la última consulta. El prefijo \`p_\` evita confundir el parámetro con una columna. Para cambiarla, \`CREATE OR REPLACE FUNCTION\`.`,
    },
    {
      id: 'returns_table',
      question: '¿Cómo hago una función que devuelva filas?',
      conceptId: 'returns_table',
      cost: 5,
      body: `Con \`RETURNS TABLE\`, y se usa en el \`FROM\`:

\`\`\`
CREATE FUNCTION pagos_de(p_tarjeta integer)
RETURNS TABLE (id integer, importe numeric, pagado_en timestamp)
LANGUAGE sql AS $$
  SELECT p.id, p.importe, p.pagado_en FROM pagos_tarjeta p WHERE p.tarjeta_id = p_tarjeta
$$;

SELECT COUNT(*), SUM(importe) FROM pagos_de(5);
\`\`\`

Es como una vista con parámetros. Las columnas de \`RETURNS TABLE\` se llaman igual que las de la tabla: usa un alias (\`p.id\`) para que no haya ambigüedad.`,
    },
    {
      id: 'plpgsql',
      question: '¿Qué añade PL/pgSQL?',
      conceptId: 'plpgsql',
      cost: 5,
      body: `Variables, condiciones y bucles:

\`\`\`
CREATE FUNCTION nivel_riesgo(p_cliente integer) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE s numeric;
BEGIN
  s := saldo_cliente(p_cliente);
  IF s < 1000 THEN RETURN 'alto';
  ELSIF s < 10000 THEN RETURN 'medio';
  ELSE RETURN 'bajo';
  END IF;
END $$;
\`\`\`

Si cabe en una consulta (aquí, un \`CASE\`), \`LANGUAGE sql\` es más simple. PL/pgSQL compensa cuando hay pasos, variables o errores que lanzar.`,
    },
    {
      id: 'trigger_after',
      question: '¿Cómo apunto cada cambio de saldo?',
      conceptId: 'trigger_after',
      cost: 5,
      body: `Una función que devuelve \`trigger\` y un trigger que la llama:

\`\`\`
CREATE FUNCTION auditar_saldo() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO auditoria_saldos (cuenta_id, saldo_anterior, saldo_nuevo)
  VALUES (OLD.id, OLD.saldo, NEW.saldo);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_auditar_saldo AFTER UPDATE OF saldo ON cuentas
FOR EACH ROW EXECUTE FUNCTION auditar_saldo();
\`\`\`

\`OLD\` es la fila antes y \`NEW\` después. \`UPDATE OF saldo\` hace que solo salte si la sentencia cambia esa columna. Para saltar solo si el valor cambia de verdad: \`WHEN (OLD.saldo IS DISTINCT FROM NEW.saldo)\`.`,
    },
    {
      id: 'trigger_before',
      question: '¿Para qué sirve un trigger BEFORE?',
      conceptId: 'trigger_before',
      cost: 5,
      body: `Salta **antes** de guardar la fila, así que puede:

- **Completarla**: \`NEW.actualizado_en := now();\`
- **Pararla**: \`RAISE EXCEPTION 'Saldo negativo en la cuenta %', NEW.id;\` (error P0001, y la sentencia entera se deshace).

\`\`\`
CREATE TRIGGER trg_ahorro BEFORE INSERT OR UPDATE ON cuentas
FOR EACH ROW EXECUTE FUNCTION impedir_negativo();
\`\`\`

Una regla sencilla sobre la propia fila también cabe en un CHECK. El trigger compensa cuando hay que consultar otras tablas o dar un mensaje propio.`,
    },
    {
      id: 'trigger_return',
      question: '¿Qué tiene que devolver la función de un trigger?',
      conceptId: 'trigger_return',
      cost: 5,
      body: `En un trigger **BEFORE … FOR EACH ROW**, lo que devuelves es lo que se guarda:

| Devuelve | Pasa |
|---|---|
| \`NEW\` | se guarda la fila (con tus cambios) |
| \`NULL\` | la fila **no se guarda**, sin error («UPDATE 0») |
| nada | error: «control reached end of trigger procedure without RETURN» |

En un trigger AFTER el valor se ignora, pero hay que poner \`RETURN NEW\` (o \`NULL\`) igualmente.`,
    },
    {
      id: 'trigger_loop',
      question: '¿Por qué un trigger puede llamarse a sí mismo?',
      conceptId: 'trigger_loop',
      cost: 5,
      body: `Si la función de un trigger \`AFTER UPDATE ON cuentas\` hace un \`UPDATE cuentas …\`, ese UPDATE vuelve a disparar el trigger, que vuelve a hacer el UPDATE… hasta «stack depth limit exceeded».

Cómo evitarlo:

- Para cambiar la propia fila, un trigger **BEFORE** que modifica \`NEW\` (no un UPDATE).
- Limitar cuándo salta: \`UPDATE OF columna\` o \`WHEN (…)\`.
- Como último recurso, \`pg_trigger_depth()\` para no repetir.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a7pre_sql', conceptId: 'sql_function', question: '¿Qué devuelve una función `LANGUAGE sql`?', options: ['Siempre una tabla', 'El resultado de su última consulta', 'Nada', 'El número de filas'], correct: 1, explanation: 'Del tipo que diga RETURNS.' },
      { id: 'a7pre_table', conceptId: 'returns_table', question: '¿Cómo se usa una función con `RETURNS TABLE`?', options: ['SELECT pagos_de', 'SELECT … FROM pagos_de(5)', 'CALL pagos_de(5)', 'EXECUTE pagos_de'], correct: 1, explanation: 'En el FROM, como una tabla.' },
      { id: 'a7pre_plpgsql', conceptId: 'plpgsql', question: 'En PL/pgSQL, ¿cómo se asigna un valor a una variable?', options: ['s = 5', 's := 5', 'SET s 5', 'LET s = 5'], correct: 1, explanation: ':= (también vale = en versiones recientes, pero := es lo habitual).' },
      { id: 'a7pre_oldnew', conceptId: 'trigger_after', question: 'En un trigger de UPDATE, ¿qué son OLD y NEW?', options: ['Dos tablas', 'La fila antes y después del cambio', 'Dos funciones', 'El primer y el último trigger'], correct: 1, explanation: 'En INSERT solo hay NEW; en DELETE, solo OLD.' },
      { id: 'a7pre_before', conceptId: 'trigger_before', question: '¿Qué puede hacer un trigger BEFORE que uno AFTER no?', options: ['Leer OLD', 'Cambiar NEW antes de guardarla', 'Lanzar errores', 'Nada'], correct: 1, explanation: 'Lo que devuelve un BEFORE es lo que se guarda.' },
      { id: 'a7pre_raise', conceptId: 'trigger_before', question: '¿Qué hace `RAISE EXCEPTION` dentro de un trigger?', options: ['Escribe un aviso y sigue', 'Para la sentencia con un error y la deshace', 'Borra la fila', 'Reinicia el trigger'], correct: 1, explanation: 'Código P0001.' },
    ],
    post: [
      { id: 'a7post_null', conceptId: 'trigger_return', question: 'Un trigger BEFORE UPDATE devuelve NULL. ¿Qué pasa con el UPDATE?', options: ['Se guarda', 'La fila no se cambia, sin error', 'Error', 'Se borra la fila'], correct: 1, explanation: '«UPDATE 0» y nadie se entera.' },
      { id: 'a7post_noreturn', conceptId: 'trigger_return', question: 'La función del trigger acaba sin RETURN. ¿Qué pasa?', options: ['Devuelve NEW', 'Error al disparar el trigger', 'Devuelve NULL', 'Nada'], correct: 1, explanation: '«control reached end of trigger procedure without RETURN».' },
      { id: 'a7post_loop', conceptId: 'trigger_loop', question: 'Un trigger AFTER UPDATE ON cuentas hace `UPDATE cuentas …`. ¿Qué pasa?', options: ['Nada especial', 'Se vuelve a disparar sin fin hasta un error de pila', 'PostgreSQL lo detecta y lo ignora', 'Solo salta una vez'], correct: 1, explanation: 'Para cambiar la propia fila, BEFORE y NEW.' },
      { id: 'a7post_of', conceptId: 'trigger_after', question: '¿Qué hace `AFTER UPDATE OF saldo`?', options: ['Salta con cualquier UPDATE', 'Salta solo si la sentencia cambia la columna saldo', 'Salta solo si el saldo baja', 'Salta antes del UPDATE'], correct: 1, explanation: 'Para «si el valor cambia de verdad», WHEN (OLD.saldo IS DISTINCT FROM NEW.saldo).' },
      { id: 'a7post_table', conceptId: 'returns_table', question: 'En `RETURNS TABLE (id …)` y la consulta usa `id` de pagos_tarjeta. ¿Qué conviene?', options: ['Nada', 'Un alias en la tabla (p.id) para que no sea ambiguo', 'Quitar la columna id', 'Usar SELECT *'], correct: 1, explanation: 'Los nombres de RETURNS TABLE se comportan como variables.' },
      { id: 'a7post_plpgsql', conceptId: 'plpgsql', question: '¿Cuándo compensa PL/pgSQL frente a LANGUAGE sql?', options: ['Siempre', 'Cuando hay variables, pasos o errores que lanzar', 'Nunca', 'Solo en triggers'], correct: 1, explanation: 'Si cabe en una consulta, SQL es más simple.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Lógica donde están los datos',
      body: 'Buenos días.\n\nHoy metemos lógica **dentro** de la base de datos: funciones que cualquiera puede llamar desde una consulta y triggers que saltan solos cuando cambia un dato. Seguimos en la copia de pruebas.\n\nPara empezar, una función que todos los equipos acaban escribiendo a mano:\n\n- **`saldo_cliente(p_cliente integer)`**: la suma del saldo de las cuentas del cliente, y **0** si no tiene ninguna.\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'sql_function' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.saldo_cliente' },
      body: 'saldo_cliente(1) = 2.376,40 y saldo_cliente(38) = 0. Sin el COALESCE, el 38 daría NULL y cualquier cuenta que hicieran con él también.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_pagos',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Tengo la consulta de «pagos de una tarjeta» copiada en diez informes y cada uno ya es un poco distinto. ¿Me haces **`pagos_de(p_tarjeta integer)`** que devuelva los pagos como una tabla, con **`id`**, **`importe`** y **`pagado_en`**? Así hago `SELECT … FROM pagos_de(5)`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'returns_table' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.pagos_de' },
      body: 'Tarjeta 5: doce pagos y 4.288,05 €. Diez copias menos. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_riesgo',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: "Hola. Riesgos y la app calculan el **nivel de riesgo** de cada cliente con límites distintos. Quiero una sola fórmula, en la base de datos: **`nivel_riesgo(p_cliente integer)`** en **PL/pgSQL**, `'alto'` si su saldo total es menor de 1.000 €, `'medio'` si es menor de 10.000 € y `'bajo'` en otro caso.",
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'plpgsql' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.nivel_riesgo' },
      body: 'Tres en alto, veinticinco en medio y doce en bajo. Y ahora la app y nosotros usamos lo mismo. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_return',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «UPDATE 0»',
      body: '**Inés:** Rubén ha puesto un trigger para que los comercios tengan siempre la ciudad en mayúscula inicial:\n\n`… BEGIN NEW.ciudad := initcap(NEW.ciudad); RETURN NULL; END …` con `BEFORE UPDATE ON comercios FOR EACH ROW`.\n\nDesde entonces nadie consigue cambiar un comercio: la consola dice «UPDATE 0» y no da ningún error. ¿Qué pasa?',
      onDeliver: [],
      choices: [
        {
          id: 'new',
          text: 'Que en un trigger **BEFORE** de fila, lo que devuelve la función es lo que se guarda: con `RETURN NULL` la fila **se descarta** sin error. Tiene que ser `RETURN NEW`.',
          cost: 10,
          reply: 'Exacto. Es de los fallos más traicioneros: no hay error, solo cambios que no llegan.',
          effects: [
            { kind: 'flag', key: 'practice.trigger_return' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Un trigger BEFORE de fila devuelve NEW; NULL descarta la fila.' },
          ],
        },
        {
          id: 'after',
          text: 'Que lo cambie a AFTER y deje el RETURN NULL.',
          cost: 10,
          reply: 'Con AFTER la fila se guarda, pero el cambio en NEW ya no sirve de nada: el initcap no llegaría. Es un BEFORE con RETURN NEW.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiar a AFTER no arregla el trigger y rompe lo que quería hacer.' }],
        },
        {
          id: 'perm',
          text: 'Que es un problema de permisos en la tabla de comercios.',
          cost: 10,
          reply: 'Sin permisos habría un error. Aquí la fila llega al trigger y el trigger dice «no la guardes».',
          effects: [{ kind: 'note', tone: 'bad', text: 'Buscaste el fallo fuera del trigger.' }],
        },
      ],
    },
    {
      id: 'nuria_auditoria',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Cuando un cliente reclama que su saldo cambió, nadie sabe **cuándo ni de cuánto a cuánto**. ¿Puedes hacer que la base de datos lo apunte? Una tabla **`auditoria_saldos`** (`id serial`, `cuenta_id`, `saldo_anterior`, `saldo_nuevo`, `cambiado_en timestamp DEFAULT now()`) y una fila nueva cada vez que **cambia el saldo** de una cuenta. Si cambian otras cosas de la cuenta, no hace falta.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'trigger_after' }, { kind: 'unlock', conceptId: 'trigger_return' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.auditoria' },
      body: 'Probé a cambiar un saldo y quedó apuntado con el antes y el después. ¡Por fin! Gracias.',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_ahorro',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. La app no deja que una cuenta de **ahorro** quede en negativo, pero un script de cierre lo consiguió el mes pasado. Quiero que lo impida la base de datos: un **trigger BEFORE** en `cuentas` que, al **crear o cambiar** una cuenta de ahorro con saldo negativo, pare con un error. Las corrientes sí pueden quedar en negativo.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'trigger_before' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.ahorro_positivo' },
      body: 'Ahorro a -5: error. Corriente a -5: pasa. Y los cambios normales siguen funcionando. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_actualizado',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. Para los tests de regresión necesito saber **qué comercios han cambiado** y cuándo. ¿Añades a `comercios` una columna **`actualizado_en`** (timestamp) que se ponga **sola** a la hora actual cada vez que se cambia un comercio? Que no dependa de que la app se acuerde.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.actualizado_en' },
      body: 'Cambio un comercio y la fecha aparece sola. Ya puedo filtrar los que cambiaron desde la última regresión. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_bucle',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «stack depth limit exceeded»',
      body: '**Inés:** Diego quería marcar la fecha de último movimiento de cada cuenta y ha hecho esto:\n\n`CREATE TRIGGER trg_ultimo AFTER UPDATE ON cuentas FOR EACH ROW EXECUTE FUNCTION marcar_ultimo();`\n\ncon `marcar_ultimo()` haciendo `UPDATE cuentas SET ultimo_cambio = now() WHERE id = NEW.id`. Ahora cualquier cambio en cuentas da «stack depth limit exceeded». ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'before',
          text: 'Que el `UPDATE cuentas` de dentro **vuelve a disparar el mismo trigger**, que vuelve a hacer el UPDATE, sin fin. Para cambiar la propia fila: un trigger **BEFORE UPDATE** que haga `NEW.ultimo_cambio := now(); RETURN NEW;`, sin ningún UPDATE.',
          cost: 10,
          reply: 'Eso es. Dentro del trigger de una tabla, nunca un UPDATE de esa misma tabla. Si es la propia fila, se cambia NEW.',
          effects: [
            { kind: 'flag', key: 'practice.trigger_loop' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Para cambiar la propia fila, BEFORE y NEW; nunca un UPDATE de la misma tabla.' },
          ],
        },
        {
          id: 'stack',
          text: 'Que suba `max_stack_depth` para que quepa.',
          cost: 10,
          reply: 'Es un bucle infinito: con más pila tarda más en fallar, pero falla igual.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste más memoria a un bucle infinito.' }],
        },
        {
          id: 'statement',
          text: 'Que lo cambie a `FOR EACH STATEMENT`.',
          cost: 10,
          reply: 'Un trigger de sentencia que hace un UPDATE de su tabla también se vuelve a disparar. El problema es el UPDATE de dentro.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiaste el tipo de trigger sin quitar el bucle.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Funciones y triggers. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una función evita copiar el mismo cálculo en diez sitios (y RETURNS TABLE la usa como una tabla); que PL/pgSQL compensa cuando hay variables o errores; que un trigger AFTER sirve para auditar con OLD y NEW y uno BEFORE para completar o parar la fila; que un BEFORE devuelve NEW (NULL la descarta); y que un trigger nunca hace un UPDATE de su propia tabla.',
          reply: 'Muy bien. Mañana, que todo esto vaya rápido: índices y planes.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'everything',
          text: 'Que lo mejor es meter toda la lógica de la app en triggers.',
          reply: 'Y que nadie sepa por qué cambia un dato. Triggers para lo que tiene que pasar siempre; el resto, en la app. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con meterlo todo en triggers.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
