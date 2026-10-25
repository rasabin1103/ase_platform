import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { PROBE_SQL, probe } from '../../../sql/probe'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m09Lessons } from './m09-lessons'
import { m09Quiz } from './m09-quiz'
import { m09Scenes } from './m09-scenes'

/** Columnas de una tabla del esquema público: nombre, tipo y si admite NULL, en orden. */
const columns = (table: string) =>
  `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' ORDER BY ordinal_position`

/**
 * Curso 5: SQL desde cero · Misión 9 — Tu propia tabla.
 * Guion legible: docs/academy/sql-iniciacion/missions/m09-crear-tabla.md
 *
 * CREATE TABLE, tipos, PRIMARY KEY, NOT NULL, DEFAULT, CHECK (también con
 * ALTER TABLE), FOREIGN KEY, UNIQUE y DROP TABLE. Los encargos se comprueban
 * con el esquema (information_schema) y con sondas que intentan meter datos
 * malos en una subtransacción que se deshace (qa.probar).
 */
export const m09CrearTabla: Mission = {
  id: 'm09-crear-tabla',
  courseKey: 'sql-iniciacion',
  number: 9,
  title: 'Tu propia tabla',
  subtitle: 'CREATE TABLE con tipos y reglas: PRIMARY KEY, NOT NULL, DEFAULT, CHECK, UNIQUE y FOREIGN KEY.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Viernes · semana 2',
  duration: 480,
  appActionCost: 2,
  reportCost: 10,
  reportReviewer: 'ines',
  ticketPrefix: 'DAT',
  appId: 'sql-console',
  appLabel: 'Consola SQL',
  hideBugList: true,
  wikiLabel: 'Wiki · Datos',
  initialMetrics: {},
  lessons: m09Lessons,
  mentor: 'ines',
  quiz: m09Quiz,
  verdicts: {
    good: {
      title: 'Tablas con reglas',
      body: 'Laura deja la hoja de cálculo, Diego guarda sus ejecuciones sin huérfanos, Carmen tiene una lista sin duplicados y nadie va a guardar importes como texto. Listo para el examen práctico.',
    },
    ok: {
      title: 'Tablas con algún agujero',
      body: 'Ya creas tablas, pero alguna regla o algún encargo se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Tablas sin reglas',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión: CREATE TABLE con PRIMARY KEY, NOT NULL, CHECK, UNIQUE y REFERENCES.',
    },
  },

  briefing: {
    title: 'Semana 2 · Tu propia tabla',
    paragraphs: [
      'Viernes de la semana 2, último día del curso. Hoy creas tablas nuevas en el entorno de pruebas y les pones reglas para que no entren datos malos.',
      'Los encargos se comprueban como lo haría QA: mirando la definición de la tabla e intentando meter datos que no deberían entrar (sin dejar rastro). Si las reglas los rechazan, el encargo está hecho.',
    ],
    goals: [
      'Crea tablas con CREATE TABLE y el tipo adecuado para cada columna.',
      'Pon clave primaria, columnas obligatorias y valores por defecto.',
      'Limita valores con CHECK y añade reglas con ALTER TABLE.',
      'Relaciona tablas con claves foráneas y evita duplicados con UNIQUE.',
      'Borra una tabla con DROP TABLE, sabiendo lo que implica.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m09Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_tablas',
      title: 'Chuleta: crear tablas con reglas',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'create_table' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma
\`\`\`
CREATE TABLE ejemplo (
  id         integer PRIMARY KEY,
  nombre     text NOT NULL,
  tipo       text NOT NULL CHECK (tipo IN ('a', 'b')),
  estado     text NOT NULL DEFAULT 'nuevo',
  cliente_id integer UNIQUE REFERENCES clientes(id),
  importe    numeric(12,2),
  creado_en  date NOT NULL
);
\`\`\`

## Reglas
- \`PRIMARY KEY\`: única y obligatoria.
- \`NOT NULL\`: obligatoria · \`DEFAULT\`: valor si no se indica.
- \`CHECK (condición)\`: valores permitidos.
- \`UNIQUE\`: sin repetidos.
- \`REFERENCES tabla(columna)\`: tiene que existir en la otra tabla.

## Cambiar y borrar
- \`ALTER TABLE t ADD CHECK (…);\` · \`ALTER TABLE t ADD COLUMN c text;\`
- \`DROP TABLE t;\` — sin vuelta atrás.

## Tipos
\`integer\`, \`numeric(12,2)\`, \`text\`, \`date\`, \`timestamp\`, \`boolean\`.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql() + PROBE_SQL,
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: '-- Entorno de pruebas: crea tus tablas\nCREATE TABLE etiquetas (\n  id integer PRIMARY KEY,\n  nombre text NOT NULL\n);',
    retos: [
      {
        id: 'etiquetas',
        from: 'ines',
        title: 'Tabla etiquetas',
        description: 'Crea **etiquetas**: `id` (integer, clave primaria) y `nombre` (text, obligatorio).',
        hint: '`CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL);`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        state: [
          { query: columns('etiquetas'), rows: [['id', 'integer', 'NO'], ['nombre', 'text', 'NO']] },
          { query: probe("INSERT INTO etiquetas (id, nombre) VALUES (1, 'smoke')"), rows: [['ok']] },
          { query: probe("INSERT INTO etiquetas (id, nombre) VALUES (1, 'a')", "INSERT INTO etiquetas (id, nombre) VALUES (1, 'b')"), rows: [['23505']] },
        ],
      },
      {
        id: 'casos_prueba',
        from: 'laura',
        title: 'Tabla casos_prueba',
        description: 'Crea **casos_prueba**: `id` (integer, clave primaria), `titulo` (text, obligatorio), `prioridad` (text, obligatoria) y `estado` (text, obligatorio, por defecto **pendiente**).',
        hint: "`estado text NOT NULL DEFAULT 'pendiente'`. Las columnas, en ese orden.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        state: [
          { query: columns('casos_prueba'), rows: [['id', 'integer', 'NO'], ['titulo', 'text', 'NO'], ['prioridad', 'text', 'NO'], ['estado', 'text', 'NO']] },
          { query: "SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'casos_prueba' AND column_name = 'estado'", rows: [["'pendiente'::text"]] },
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'alta')", "INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Otra', 'baja')"), rows: [['23505']] },
        ],
      },
      {
        id: 'prioridad',
        from: 'laura',
        title: 'Solo alta, media o baja',
        description: 'Haz que `casos_prueba.prioridad` solo admita **alta**, **media** o **baja**.',
        hint: "`ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));`",
        visibleWhen: { kind: 'flag', key: 'encargo.laura2' },
        state: [
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'media')"), rows: [['ok']] },
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'urgente')"), rows: [['23514']] },
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'Alta')"), rows: [['23514']] },
        ],
      },
      {
        id: 'ejecuciones',
        from: 'diego',
        title: 'Tabla ejecuciones',
        description: 'Crea **ejecuciones**: `id` (integer, clave primaria), `caso_id` (integer, obligatorio, referencia a `casos_prueba(id)`), `resultado` (text, obligatorio, solo **ok** o **fallo**) y `ejecutada_en` (date, obligatoria).',
        hint: "`caso_id integer NOT NULL REFERENCES casos_prueba(id)` y `resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo'))`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        state: [
          { query: columns('ejecuciones'), rows: [['id', 'integer', 'NO'], ['caso_id', 'integer', 'NO'], ['resultado', 'text', 'NO'], ['ejecutada_en', 'date', 'NO']] },
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'alta')", "INSERT INTO ejecuciones (id, caso_id, resultado, ejecutada_en) VALUES (900, 900, 'ok', '2026-01-20')"), rows: [['ok']] },
          { query: probe("INSERT INTO ejecuciones (id, caso_id, resultado, ejecutada_en) VALUES (900, 99999, 'ok', '2026-01-20')"), rows: [['23503']] },
          { query: probe("INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (900, 'Prueba', 'alta')", "INSERT INTO ejecuciones (id, caso_id, resultado, ejecutada_en) VALUES (900, 900, 'quizas', '2026-01-20')"), rows: [['23514']] },
        ],
      },
      {
        id: 'vigilancia',
        from: 'carmen',
        title: 'Tabla lista_vigilancia',
        description: 'Crea **lista_vigilancia**: `id` (integer, clave primaria), `cliente_id` (integer, obligatorio, referencia a `clientes(id)`, **sin repetirse**) y `motivo` (text, obligatorio).',
        hint: '`cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        state: [
          { query: columns('lista_vigilancia'), rows: [['id', 'integer', 'NO'], ['cliente_id', 'integer', 'NO'], ['motivo', 'text', 'NO']] },
          { query: probe("INSERT INTO lista_vigilancia (id, cliente_id, motivo) VALUES (900, 5, 'Prueba')"), rows: [['ok']] },
          { query: probe("INSERT INTO lista_vigilancia (id, cliente_id, motivo) VALUES (900, 99999, 'Prueba')"), rows: [['23503']] },
          { query: probe("INSERT INTO lista_vigilancia (id, cliente_id, motivo) VALUES (900, 5, 'Prueba')", "INSERT INTO lista_vigilancia (id, cliente_id, motivo) VALUES (901, 5, 'Otra')"), rows: [['23505']] },
        ],
      },
      {
        id: 'poblar',
        from: 'laura',
        title: 'Los tres primeros casos',
        description: 'Inserta en **casos_prueba** los casos 1 «Login con usuario válido» (alta), 2 «Transferencia sin saldo» (alta) y 3 «Cambiar idioma» (baja), **sin indicar el estado**.',
        hint: "`INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, 'Login con usuario válido', 'alta'), (2, …), (3, …);`",
        visibleWhen: { kind: 'flag', key: 'encargo.laura3' },
        state: [
          {
            query: 'SELECT id, titulo, prioridad, estado FROM casos_prueba ORDER BY id',
            rows: [
              ['1', 'Login con usuario válido', 'alta', 'pendiente'],
              ['2', 'Transferencia sin saldo', 'alta', 'pendiente'],
              ['3', 'Cambiar idioma', 'baja', 'pendiente'],
            ],
          },
        ],
      },
      {
        id: 'drop',
        from: 'ines',
        title: 'Borrar la tabla de ensayo',
        description: 'Borra la tabla **etiquetas** con `DROP TABLE`.',
        hint: '`DROP TABLE etiquetas;`',
        visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'encargo.drop' }, { kind: 'flag', key: 'reto.etiquetas' }] },
        requires: [{ pattern: /\bdrop\s+table\b/i }],
        state: [{ query: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'etiquetas'", rows: [['0']] }],
      },
    ],
  },

  bugs: [
    { id: 'C-HOJA', title: 'Laura sigue con los casos de prueba en una hoja de cálculo', severity: 'medium', explanation: 'La tabla casos_prueba no se creó como se pidió.', technique: 'CREATE TABLE con NOT NULL y DEFAULT.', preventedBy: 'reto.casos_prueba' },
    { id: 'C-PRIORIDADES', title: 'Entran prioridades como «urgente» o «Alta»', severity: 'medium', explanation: 'Sin CHECK, cada uno escribe la prioridad a su manera.', technique: 'CHECK (prioridad IN (…)), también con ALTER TABLE.', preventedBy: 'reto.prioridad' },
    { id: 'C-HUERFANAS', title: 'Se guardan ejecuciones de casos que no existen', severity: 'high', explanation: 'Sin clave foránea, nada impide resultados huérfanos.', technique: 'REFERENCES casos_prueba(id).', preventedBy: 'reto.ejecuciones' },
    { id: 'C-VIGILANCIA', title: 'La lista de vigilancia admite clientes inventados y repetidos', severity: 'high', explanation: 'Sin UNIQUE ni clave foránea, la lista no es fiable.', technique: 'UNIQUE + REFERENCES.', preventedBy: 'reto.vigilancia' },
    { id: 'C-SIN-CASOS', title: 'El lunes la tabla de casos está vacía', severity: 'low', explanation: 'Laura no tiene sus tres primeros casos.', technique: 'INSERT apoyándose en el DEFAULT.', preventedBy: 'reto.poblar' },
    { id: 'C-SOLO-APP', title: 'Un script mete datos inválidos que la app habría rechazado', severity: 'high', explanation: 'Las reglas solo estaban en la app.', technique: 'Reglas en la base de datos como última línea de defensa.', preventedBy: 'practice.constraints' },
    { id: 'C-TEXTO', title: 'Importes y fechas guardados como texto que no se pueden sumar ni ordenar', severity: 'medium', explanation: 'Un tipo text acepta cualquier cosa.', technique: 'numeric y date.', preventedBy: 'practice.types' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Cómo quedaron las tablas del viernes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.casos_prueba', label: 'Casos de prueba en tabla', explanation: 'NOT NULL y DEFAULT.' },
      { flag: 'reto.prioridad', label: 'Prioridades limpias', explanation: 'CHECK.' },
      { flag: 'reto.ejecuciones', label: 'Ejecuciones sin huérfanos', explanation: 'Clave foránea.' },
      { flag: 'reto.vigilancia', label: 'Lista fiable', explanation: 'UNIQUE y clave foránea.' },
      { flag: 'reto.poblar', label: 'Primeros casos', explanation: 'INSERT con DEFAULT.' },
      { flag: 'practice.constraints', label: 'Reglas en la base de datos', explanation: 'No solo en la app.' },
      { flag: 'practice.types', label: 'Tipos correctos', explanation: 'numeric y date, no text.' },
    ],
  },

  concepts: [
    { id: 'create_table', title: 'CREATE TABLE', summary: 'Define una tabla: columnas, tipos y reglas.' },
    { id: 'data_types', title: 'Tipos de datos', summary: 'integer, numeric, text, date…: el tipo ya valida, ordena y calcula.' },
    { id: 'primary_key', title: 'PRIMARY KEY', summary: 'Identifica cada fila: única y obligatoria.' },
    { id: 'not_null_default', title: 'NOT NULL y DEFAULT', summary: 'Columna obligatoria y valor por defecto si no se indica.' },
    { id: 'check_constraint', title: 'CHECK', summary: 'Limita los valores permitidos; se puede añadir con ALTER TABLE.' },
    { id: 'foreign_key', title: 'FOREIGN KEY', summary: 'REFERENCES: el valor tiene que existir en la otra tabla.' },
    { id: 'unique', title: 'UNIQUE', summary: 'Impide valores repetidos en una columna que no es la clave.' },
    { id: 'constraints_why', title: 'Por qué reglas en la base de datos', summary: 'Protegen los datos venga de donde venga el cambio; se prueban con datos malos.' },
    { id: 'drop_alter', title: 'ALTER TABLE y DROP TABLE', summary: 'Cambiar la definición de una tabla o borrarla entera (sin vuelta atrás).' },
  ],
  debriefConcepts: ['create_table', 'data_types', 'primary_key', 'not_null_default', 'check_constraint', 'foreign_key', 'unique', 'constraints_why', 'drop_alter'],
  seniorTips: [
    'Lee la chuleta de crear tablas en la wiki.',
    'Inés: CREATE TABLE etiquetas (id integer PRIMARY KEY, nombre text NOT NULL);',
    "Laura: CREATE TABLE casos_prueba (id integer PRIMARY KEY, titulo text NOT NULL, prioridad text NOT NULL, estado text NOT NULL DEFAULT 'pendiente');",
    "Laura: ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));",
    "Diego: … caso_id integer NOT NULL REFERENCES casos_prueba(id), resultado text NOT NULL CHECK (resultado IN ('ok', 'fallo')), ejecutada_en date NOT NULL.",
    'Carmen: … cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id), motivo text NOT NULL.',
    "Laura: INSERT INTO casos_prueba (id, titulo, prioridad) VALUES (1, …), (2, …), (3, …);",
    'Inés: DROP TABLE etiquetas;',
    'Con Inés: reglas en la base de datos, no solo en la app; numeric y date, no text.',
  ],
}
