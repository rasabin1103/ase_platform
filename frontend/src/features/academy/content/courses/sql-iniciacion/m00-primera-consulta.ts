import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m00Lessons } from './m00-lessons'
import { m00Quiz } from './m00-quiz'
import { m00Scenes } from './m00-scenes'

const TRANSFERENCIAS_COLS = 'id,cuenta_origen_id,cuenta_destino_id,importe,concepto,estado,creada_en'

/**
 * Curso 5: SQL desde cero · Misión 0 — Tu primera consulta (gratis).
 * Guion legible: docs/academy/sql-iniciacion/missions/m00-primera-consulta.md
 *
 * Primer día como QA junior con acceso de solo lectura a la réplica. SELECT,
 * columnas, alias y LIMIT contra PostgreSQL real, con encargos de Inés, Marta,
 * Nuria y Diego.
 */
export const m00PrimeraConsulta: Mission = {
  id: 'm00-primera-consulta',
  courseKey: 'sql-iniciacion',
  number: 0,
  title: 'Tu primera consulta',
  subtitle: 'SELECT, columnas, alias y LIMIT contra una base de datos PostgreSQL de verdad.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · semana 1',
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
  lessons: m00Lessons,
  mentor: 'ines',
  quiz: m00Quiz,
  verdicts: {
    good: {
      title: 'Primer día, primeros datos',
      body: 'Marta llevó sus cifras a la reunión, Nuria pegó su listado tal cual y Diego ya sabe cómo son las transferencias. Y todo con SELECT y FROM.',
    },
    ok: {
      title: 'Buen comienzo',
      body: 'Ya consultas datos, pero algún encargo se quedó por el camino. Mira en el debrief cuál.',
    },
    bad: {
      title: 'Un primer día a medias',
      body: 'El equipo se quedó esperando. Repite la misión: con SELECT, FROM, AS y LIMIT se resuelve todo.',
    },
  },

  briefing: {
    title: 'Semana 1 · Tu primera consulta',
    paragraphs: [
      'Empiezas como QA junior en Kobalto, un neobanco. Inés, del equipo de datos, te ha dado acceso a la base de datos.',
      'Hoy te llegarán peticiones de varias personas. Cada una se cumple cuando tu consulta devuelve el resultado correcto.',
      'La base de datos es PostgreSQL de verdad. Es una réplica de solo lectura: experimenta todo lo que quieras.',
    ],
    goals: [
      'Lee en la wiki cómo es la base de datos.',
      'Haz tu primera consulta a la tabla clientes.',
      'Saca solo las columnas que te pidan.',
      'Da nombres claros a las columnas con AS.',
      'Explora una tabla con unas pocas filas (LIMIT).',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m00Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'db_kobalto',
      title: 'Cómo es la base de datos de Kobalto',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'select_from' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas
- **clientes**: una fila por cliente (nombre, apellidos, email, ciudad, fecha de alta y segmento).
- **cuentas**: las cuentas de cada cliente (\`cliente_id\` apunta a clientes). IBAN, tipo (corriente o ahorro), saldo, estado.
- **tarjetas**: las tarjetas de cada cuenta (\`cuenta_id\`), con su límite diario y fecha de caducidad.
- **transferencias**: cada transferencia, con la cuenta de origen, la de destino (vacía si es a otro banco), el importe y el estado.
- **incidencias**: lo que los clientes reportan a atención al cliente.

## Cómo consultar
- \`SELECT columnas FROM tabla;\`
- Los nombres van en minúsculas y sin tildes: \`fecha_alta\`, no «Fecha de alta».
- Los textos, entre comillas simples: \`'Madrid'\`.

## Normas
- Es una réplica de **solo lectura**.
- En tablas grandes, explora con \`LIMIT\`.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Escribe aquí tu consulta y pulsa «Ejecutar» (Ctrl/Cmd + Enter)\nSELECT * FROM clientes;',
    retos: [
      {
        id: 'clientes',
        from: 'ines',
        title: 'Tu primera consulta',
        description: 'Muestra **todas las columnas** de la tabla `clientes`.',
        hint: 'Después de `SELECT` van las columnas; `*` significa «todas». Después de `FROM`, la tabla.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT * FROM clientes',
      },
      {
        id: 'contacto',
        from: 'ines',
        title: 'Solo lo que necesitas',
        description: 'Muestra solo el `nombre`, los `apellidos` y el `email` de los clientes, en ese orden.',
        hint: 'Escribe las columnas separadas por comas, en el orden en que las quieres: `SELECT col1, col2, col3 FROM ...`',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT nombre, apellidos, email FROM clientes',
      },
      {
        id: 'cuentas',
        from: 'marta',
        title: 'Las cuentas para la reunión',
        description: 'Marta quiere el `iban`, el `tipo` y el `saldo` de **todas** las cuentas.',
        hint: 'Mira en el explorador cómo se llama la tabla de cuentas y sus columnas.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT iban, tipo, saldo FROM cuentas',
      },
      {
        id: 'alias',
        from: 'nuria',
        title: 'Columnas con nombre claro',
        description: 'Para el informe de Nuria: el nombre del cliente como `cliente`, su `ciudad` y la fecha de alta como `alta`, en ese orden.',
        hint: 'Cada columna puede llevar un alias: `columna AS nombre_nuevo`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes',
        columns: ['cliente', 'ciudad', 'alta'],
      },
      {
        id: 'vistazo',
        from: 'diego',
        title: 'Un vistazo a las transferencias',
        description: 'Diego quiere **solo 5 filas** de `transferencias`, con todas sus columnas.',
        hint: 'Al final de la consulta, `LIMIT` y el número de filas que quieres.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        check: (r) => r.rowCount === 5 && r.columns.join(',') === TRANSFERENCIAS_COLS,
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Marta va a la reunión sin las cifras de las cuentas', severity: 'high', explanation: 'El encargo de Marta se quedó sin hacer.', technique: 'SELECT con las columnas que te piden.', preventedBy: 'reto.cuentas' },
    { id: 'C-NURIA', title: 'El informe de Nuria sale con columnas que nadie entiende', severity: 'medium', explanation: 'Sin alias, el informe muestra los nombres técnicos de las columnas.', technique: 'Alias con AS.', preventedBy: 'reto.alias' },
    { id: 'C-DIEGO', title: 'Diego programa a ciegas sin ver cómo son las transferencias', severity: 'medium', explanation: 'Diego no recibió las filas de ejemplo.', technique: 'Explorar con LIMIT.', preventedBy: 'reto.vistazo' },
    { id: 'C-REPLICA', title: 'Un SELECT * de 40 millones de filas deja la réplica sin aire', severity: 'high', explanation: 'Pedir una tabla enorme entera para «ver cómo es» frena a todo el equipo.', technique: 'Pocas filas con LIMIT y solo las columnas necesarias.', preventedBy: 'practice.limit' },
    { id: 'C-COMA', title: 'Un informe sale con nombres en la columna «email»', severity: 'medium', explanation: 'Una coma olvidada convierte una columna en el alias de otra, sin dar error.', technique: 'Comprobar que el resultado tiene las columnas que pediste.', preventedBy: 'practice.comma' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con cada encargo del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.cuentas', label: 'Cifras para Marta', explanation: 'IBAN, tipo y saldo de todas las cuentas.' },
      { flag: 'reto.alias', label: 'Informe de Nuria', explanation: 'Columnas renombradas con AS.' },
      { flag: 'reto.vistazo', label: 'Ejemplo para Diego', explanation: 'Cinco filas con LIMIT.' },
      { flag: 'practice.limit', label: 'Explorar sin saturar', explanation: 'LIMIT en tablas grandes.' },
      { flag: 'practice.comma', label: 'Revisar el resultado', explanation: 'Detectar la coma que falta.' },
    ],
  },

  concepts: [
    { id: 'select_from', title: 'SELECT y FROM', summary: 'SELECT con las columnas (o * para todas) y FROM con la tabla.' },
    { id: 'select_columns', title: 'Elegir columnas', summary: 'Pedir solo las columnas necesarias, en el orden en que se quieren.' },
    { id: 'column_alias', title: 'Alias de columna', summary: 'AS cambia el nombre de una columna en el resultado, no en la tabla.' },
    { id: 'limit_rows', title: 'LIMIT', summary: 'Devuelve solo unas pocas filas: la forma segura de explorar tablas grandes.' },
    { id: 'sql_errors', title: 'Leer errores (y lo que no da error)', summary: 'Leer el mensaje, revisar nombres, comas y comillas, y comprobar las columnas del resultado.' },
    { id: 'readonly_replica', title: 'Réplica de solo lectura', summary: 'Copia de producción para consultar sin cargarla ni modificar datos.' },
  ],
  debriefConcepts: ['select_from', 'select_columns', 'column_alias', 'limit_rows', 'sql_errors', 'readonly_replica'],
  seniorTips: [
    'Lee en la wiki cómo es la base de datos antes de empezar.',
    'Clientes: SELECT * FROM clientes. Contacto: SELECT nombre, apellidos, email FROM clientes.',
    'Marta: SELECT iban, tipo, saldo FROM cuentas.',
    'Nuria: SELECT nombre AS cliente, ciudad, fecha_alta AS alta FROM clientes.',
    'Diego: SELECT * FROM transferencias LIMIT 5.',
    'Con Inés: LIMIT para explorar; y la coma que falta convierte email en un alias.',
  ],
}
