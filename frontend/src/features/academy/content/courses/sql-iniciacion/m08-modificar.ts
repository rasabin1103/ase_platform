import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m08Lessons } from './m08-lessons'
import { m08Quiz } from './m08-quiz'
import { m08Scenes } from './m08-scenes'

/**
 * Curso 5: SQL desde cero · Misión 8 — Cambiar datos con cuidado.
 * Guion legible: docs/academy/sql-iniciacion/missions/m08-modificar.md
 *
 * Primer día en el entorno de pruebas (base de datos modificable con botón de
 * restaurar): INSERT, UPDATE, DELETE, BEGIN/COMMIT/ROLLBACK, SELECT antes de
 * modificar, orden de borrado por claves foráneas y borrado lógico.
 * Los encargos se comprueban por el estado en que queda la base de datos.
 */
export const m08Modificar: Mission = {
  id: 'm08-modificar',
  courseKey: 'sql-iniciacion',
  number: 8,
  title: 'Cambiar datos con cuidado',
  subtitle: 'INSERT, UPDATE, DELETE y transacciones en el entorno de pruebas.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · semana 2',
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
  lessons: m08Lessons,
  mentor: 'ines',
  quiz: m08Quiz,
  verdicts: {
    good: {
      title: 'Cambios limpios',
      body: 'Laura tuvo sus datos de prueba y los recogiste al acabar, las tarjetas caducadas están bloqueadas, los clientes sin segmento tienen el suyo y nadie ha bloqueado 52 cuentas por error.',
    },
    ok: {
      title: 'Cambios con algún susto',
      body: 'Ya modificas datos, pero algún encargo o algún hábito se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Cambios a medias',
      body: 'Varios encargos se quedaron sin hacer o el entorno no quedó como debía. Repite la misión: SELECT primero, BEGIN, y COMMIT o ROLLBACK.',
    },
  },

  briefing: {
    title: 'Semana 2 · Cambiar datos con cuidado',
    paragraphs: [
      'Jueves de la semana 2. Hoy trabajas en el entorno de pruebas: una copia de la base de datos en la que sí puedes modificar datos.',
      'Los encargos se comprueban mirando cómo queda la base de datos después de cada ejecución. Si la estropeas, «Restaurar la base de datos» la deja como al principio (cuesta minutos de la jornada, y deshace también lo que hubieras hecho bien).',
    ],
    goals: [
      'Añade filas con INSERT respetando las claves foráneas.',
      'Cambia solo las filas que tocan con UPDATE … WHERE.',
      'Borra con DELETE en el orden correcto.',
      'Ensaya dentro de BEGIN y decide con COMMIT o ROLLBACK.',
      'Comprueba con un SELECT antes de modificar.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m08Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_cambios',
      title: 'Chuleta: modificar datos sin sustos',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'where_first' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Sentencias
- \`INSERT INTO tabla (col1, col2) VALUES (v1, v2);\`
- \`UPDATE tabla SET col = valor WHERE condición;\`
- \`DELETE FROM tabla WHERE condición;\`

## El ritual
1. \`SELECT … WHERE condición;\` → ¿son estas filas? ¿cuántas?
2. \`BEGIN;\`
3. \`UPDATE … WHERE condición;\` (el **mismo** WHERE) → mira «UPDATE n».
4. \`SELECT\` para comprobar.
5. \`COMMIT;\` si cuadra · \`ROLLBACK;\` si no.

## Reglas
- Sin WHERE se cambia o se borra **todo**.
- Claves foráneas: se crea primero lo referenciado (cliente) y se borra primero lo que referencia (cuenta).
- Si algo falla dentro de una transacción: \`ROLLBACK;\`.
- Lo que tiene historia se marca (estado), no se borra.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: false,
    runCost: 2,
    restoreCost: 5,
    starter: "-- Entorno de pruebas: aquí sí puedes modificar datos.\n-- Antes de cambiar nada, mira qué filas vas a tocar:\nSELECT id, tipo, limite_diario\nFROM tarjetas\nWHERE tipo = 'debito';",
    retos: [
      {
        id: 'ensayo',
        from: 'ines',
        title: 'Ensayo con red',
        description: 'En **una sola ejecución**: `BEGIN`, sube un 10 % el `limite_diario` de las tarjetas de **débito**, compruébalo con un `SELECT` y deshazlo con `ROLLBACK`. Los límites tienen que quedar como estaban.',
        hint: "`BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT id, limite_diario FROM tarjetas WHERE tipo = 'debito'; ROLLBACK;`",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        requires: [{ pattern: /\b(begin|start\s+transaction)\b/i }, { pattern: /\bupdate\b/i }, { pattern: /\brollback\b/i }],
        state: [{ query: 'SELECT SUM(limite_diario) FROM tarjetas', rows: [['20100.00']] }],
      },
      {
        id: 'alta_cliente',
        from: 'laura',
        title: 'Cliente de prueba',
        description: 'Crea el cliente **41**: Prueba · QA Kobalto · qa.prueba@kobalto.test · Madrid · alta 2026-01-15 · segmento estandar.',
        hint: "`INSERT INTO clientes (id, nombre, apellidos, email, ciudad, fecha_alta, segmento) VALUES (41, 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar');`",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        state: [
          { query: 'SELECT id, nombre, apellidos, email, ciudad, fecha_alta, segmento FROM clientes WHERE id = 41', rows: [['41', 'Prueba', 'QA Kobalto', 'qa.prueba@kobalto.test', 'Madrid', '2026-01-15', 'estandar']] },
          { query: 'SELECT COUNT(*) FROM clientes', rows: [['41']] },
        ],
      },
      {
        id: 'cuenta_prueba',
        from: 'laura',
        title: 'Cuenta de prueba',
        description: 'Crea la cuenta **53** del cliente 41: IBAN ES76 2100 9999 0000 0053 · corriente · saldo 100 · abierta 2026-01-15 · activa.',
        hint: 'Primero tiene que existir el cliente 41 (clave foránea). La `moneda` no hace falta: su valor por defecto es EUR.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        state: [
          { query: 'SELECT id, cliente_id, iban, tipo, saldo, moneda, abierta_en, estado FROM cuentas WHERE id = 53', rows: [['53', '41', 'ES76 2100 9999 0000 0053', 'corriente', '100.00', 'EUR', '2026-01-15', 'activa']] },
          { query: 'SELECT COUNT(*) FROM cuentas', rows: [['53']] },
        ],
      },
      {
        id: 'bloquear_caducadas',
        from: 'laura',
        title: 'Bloquear las caducadas',
        description: 'Pon en estado **bloqueada** las tarjetas **activas** que caducaron **antes del 1 de enero de 2026**. Ninguna otra.',
        hint: "Primero el SELECT con el WHERE; después `UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura2' },
        state: [
          { query: "SELECT id FROM tarjetas WHERE estado = 'bloqueada' ORDER BY id", rows: [['12'], ['18'], ['28']] },
          { query: 'SELECT COUNT(*) FROM tarjetas', rows: [['32']] },
        ],
      },
      {
        id: 'segmento',
        from: 'marta',
        title: 'Segmento para los que no tienen',
        description: 'Pon el segmento **estandar** a los clientes que **no tienen segmento**. Solo a ellos.',
        hint: "`UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL` (con `= NULL` no cambiaría nada).",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        state: [
          { query: 'SELECT COUNT(*) FROM clientes WHERE segmento IS NULL', rows: [['0']] },
          { query: "SELECT segmento, COUNT(*) FROM clientes WHERE id <= 40 GROUP BY segmento ORDER BY segmento", rows: [['estandar', '26'], ['joven', '7'], ['premium', '7']] },
        ],
      },
      {
        id: 'borrar_prueba',
        from: 'laura',
        title: 'Limpiar los datos de prueba',
        description: 'Borra la cuenta **53** y el cliente **41**. Nada más.',
        hint: 'Primero la cuenta (`DELETE FROM cuentas WHERE id = 53`) y después el cliente: al revés, la clave foránea no te deja.',
        visibleWhen: { kind: 'all', of: [{ kind: 'flag', key: 'encargo.laura3' }, { kind: 'flag', key: 'reto.alta_cliente' }] },
        requires: [{ pattern: /\bdelete\b/i }],
        state: [
          { query: 'SELECT COUNT(*) FROM clientes WHERE id = 41', rows: [['0']] },
          { query: 'SELECT COUNT(*) FROM cuentas WHERE id = 53', rows: [['0']] },
          { query: 'SELECT (SELECT COUNT(*) FROM clientes), (SELECT COUNT(*) FROM cuentas)', rows: [['40', '52']] },
        ],
      },
    ],
  },

  bugs: [
    { id: 'C-TESTS', title: 'Laura no puede probar el alta de cuentas', severity: 'medium', explanation: 'Faltaron el cliente o la cuenta de prueba.', technique: 'INSERT respetando las claves foráneas.', preventedBy: 'reto.cuenta_prueba' },
    { id: 'C-CADUCADAS', title: 'Las tarjetas caducadas siguen activas', severity: 'critical', explanation: 'Los datos viejos no se corrigieron.', technique: 'UPDATE con el WHERE comprobado antes.', preventedBy: 'reto.bloquear_caducadas' },
    { id: 'C-SEGMENTO', title: 'Siguen quedando clientes sin segmento', severity: 'medium', explanation: 'El encargo de Marta se quedó sin hacer.', technique: 'UPDATE … WHERE segmento IS NULL.', preventedBy: 'reto.segmento' },
    { id: 'C-BASURA', title: 'Los datos de prueba se quedan en el entorno', severity: 'medium', explanation: 'El cliente y la cuenta de prueba siguen ahí y ensucian los informes.', technique: 'DELETE en orden: cuenta y después cliente.', preventedBy: 'reto.borrar_prueba' },
    { id: 'C-SIN-WHERE', title: 'Un UPDATE sin WHERE bloquea todas las cuentas', severity: 'critical', explanation: 'Sin SELECT previo ni transacción, nadie vio «UPDATE 52» a tiempo.', technique: 'SELECT con el mismo WHERE, BEGIN y revisar las filas afectadas.', preventedBy: 'practice.where_first' },
    { id: 'C-HISTORIAL', title: 'Se borra una cuenta con historial en producción', severity: 'high', explanation: 'Borrar datos con historia rompe auditorías y referencias.', technique: 'Borrado lógico: marcar, no borrar.', preventedBy: 'practice.softdelete' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Cómo quedó el entorno de pruebas el jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.cuenta_prueba', label: 'Datos de prueba', explanation: 'Cliente y cuenta creados.' },
      { flag: 'reto.bloquear_caducadas', label: 'Tarjetas caducadas', explanation: 'Bloqueadas solo las que tocaba.' },
      { flag: 'reto.segmento', label: 'Segmentos completos', explanation: 'IS NULL en el WHERE.' },
      { flag: 'reto.borrar_prueba', label: 'Entorno limpio', explanation: 'DELETE en orden.' },
      { flag: 'practice.where_first', label: 'El ritual', explanation: 'SELECT, BEGIN, revisar, COMMIT o ROLLBACK.' },
      { flag: 'practice.softdelete', label: 'Historial intacto', explanation: 'Borrado lógico.' },
    ],
  },

  concepts: [
    { id: 'insert', title: 'INSERT', summary: 'Añade filas: columnas y valores en el mismo orden; las omitidas toman su valor por defecto.' },
    { id: 'update', title: 'UPDATE', summary: 'Cambia columnas de las filas que cumplen el WHERE; sin WHERE, de todas.' },
    { id: 'delete', title: 'DELETE', summary: 'Borra las filas que cumplen el WHERE; sin WHERE, todas.' },
    { id: 'where_first', title: 'SELECT antes de modificar', summary: 'Comprobar con el mismo WHERE qué filas y cuántas se van a tocar.' },
    { id: 'transactions', title: 'Transacciones', summary: 'BEGIN agrupa cambios; COMMIT los confirma y ROLLBACK los deshace.' },
    { id: 'fk_order', title: 'Claves foráneas y orden', summary: 'Se crea primero lo referenciado y se borra primero lo que referencia.' },
    { id: 'soft_delete', title: 'Borrado lógico', summary: 'Lo que tiene historia se marca (estado, fecha de baja), no se borra.' },
  ],
  debriefConcepts: ['insert', 'update', 'delete', 'where_first', 'transactions', 'fk_order', 'soft_delete'],
  seniorTips: [
    'Lee la chuleta de modificar datos en la wiki.',
    "Inés: BEGIN; UPDATE tarjetas SET limite_diario = limite_diario * 1.10 WHERE tipo = 'debito'; SELECT …; ROLLBACK;",
    "Laura: INSERT INTO clientes (…) VALUES (41, 'Prueba', 'QA Kobalto', …); después INSERT INTO cuentas (…) VALUES (53, 41, …).",
    "Laura: UPDATE tarjetas SET estado = 'bloqueada' WHERE estado = 'activa' AND caduca_en < '2026-01-01'.",
    "Marta: UPDATE clientes SET segmento = 'estandar' WHERE segmento IS NULL.",
    'Laura: DELETE FROM cuentas WHERE id = 53; DELETE FROM clientes WHERE id = 41;',
    'Con Inés: SELECT antes, BEGIN y revisar las filas afectadas; lo que tiene historia no se borra.',
  ],
}
