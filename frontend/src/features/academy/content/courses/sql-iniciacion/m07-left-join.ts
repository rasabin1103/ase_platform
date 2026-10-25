import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m07Lessons } from './m07-lessons'
import { m07Quiz } from './m07-quiz'
import { m07Scenes } from './m07-scenes'

/**
 * Curso 5: SQL desde cero · Misión 7 — Lo que falta.
 * Guion legible: docs/academy/sql-iniciacion/missions/m07-left-join.md
 *
 * LEFT JOIN, anti-join (IS NULL), EXISTS / NOT EXISTS, condiciones en el ON,
 * COUNT con LEFT JOIN y la trampa de NOT IN con NULL.
 */
export const m07LeftJoin: Mission = {
  id: 'm07-left-join',
  courseKey: 'sql-iniciacion',
  number: 7,
  title: 'Lo que falta',
  subtitle: 'LEFT JOIN, anti-join y EXISTS para encontrar lo que no tiene pareja.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles · semana 2',
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
  lessons: m07Lessons,
  mentor: 'ines',
  quiz: m07Quiz,
  verdicts: {
    good: {
      title: 'Nada se esconde',
      body: 'Marta tiene a su cliente sin cuenta, Diego su referencia rota, Nuria sus llamadas y Carmen sus tres cuentas sin uso. Y ya sabes por qué a Diego le salían cero.',
    },
    ok: {
      title: 'Casi todo a la vista',
      body: 'Ya usas LEFT JOIN, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Lo que falta sigue faltando',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión: LEFT JOIN, IS NULL y NOT EXISTS.',
    },
  },

  briefing: {
    title: 'Semana 2 · Lo que falta',
    paragraphs: [
      'Miércoles de la semana 2. Ayer el JOIN se tragó a un cliente sin cuentas. Hoy los encargos van justo de eso: encontrar lo que no tiene pareja.',
      'Clientes sin cuenta, cuentas que nunca han recibido nada, transferencias que apuntan a una cuenta que no existe: datos que faltan o referencias rotas, el pan de cada día de QA.',
    ],
    goals: [
      'Conserva todas las filas con LEFT JOIN.',
      'Encuentra lo que no tiene pareja con LEFT JOIN … IS NULL o NOT EXISTS.',
      'Usa EXISTS para no repetir filas.',
      'Pon en el ON las condiciones de la tabla de la derecha.',
      'Cuenta con COUNT(columna) para que los ceros sean ceros.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m07Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_left',
      title: 'Chuleta: LEFT JOIN y EXISTS',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'left_join' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Conservar todo
\`FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id\`: todos los clientes; sin cuenta → columnas de \`a\` a NULL.

## Lo que no tiene pareja (anti-join)
\`… LEFT JOIN cuentas a ON … WHERE a.id IS NULL\`
o
\`WHERE NOT EXISTS (SELECT 1 FROM cuentas a WHERE a.cliente_id = c.id)\`

## Alguno sí (sin repetir)
\`WHERE EXISTS (SELECT 1 FROM … WHERE … = c.id)\`

## Cuidado
- Condiciones de la tabla de la derecha: en el **ON**, no en el WHERE.
- Contar: \`COUNT(a.id)\`, no \`COUNT(*)\`.
- \`NOT IN (subconsulta)\` con un NULL dentro no devuelve nada: usa NOT EXISTS.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- LEFT JOIN conserva todas las filas de la izquierda\nSELECT c.id, c.nombre, a.iban\nFROM clientes c\nLEFT JOIN cuentas a ON a.cliente_id = c.id;',
    retos: [
      {
        id: 'clientes_cuentas',
        from: 'ines',
        title: 'Todos los clientes con sus cuentas',
        description: '`id` y `nombre` del cliente e `iban` de cada cuenta, **también para los clientes sin ninguna cuenta**.',
        hint: '`FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT c.id, c.nombre, a.iban FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id',
      },
      {
        id: 'sin_cuenta',
        from: 'marta',
        title: 'Clientes sin cuenta',
        description: '`id`, `nombre` y `apellidos` de los clientes que **no tienen ninguna cuenta**.',
        hint: 'LEFT JOIN con cuentas y `WHERE a.id IS NULL`, o `WHERE NOT EXISTS (…)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT c.id, c.nombre, c.apellidos FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.id IS NULL',
      },
      {
        id: 'destino_inexistente',
        from: 'diego',
        title: 'Destinos que no existen',
        description: '`id`, `cuenta_destino_id` e `importe` de las transferencias que **tienen** cuenta de destino, pero esa cuenta **no existe** en `cuentas`.',
        hint: 'LEFT JOIN de transferencias con cuentas por `cuenta_destino_id`; quédate con las que tienen destino (`IS NOT NULL`) y no tienen pareja (`a.id IS NULL`).',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT t.id, t.cuenta_destino_id, t.importe FROM transferencias t LEFT JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE t.cuenta_destino_id IS NOT NULL AND a.id IS NULL',
      },
      {
        id: 'con_incidencia',
        from: 'nuria',
        title: 'Clientes con incidencias abiertas',
        description: '`id`, `nombre` y `email` de los clientes con **alguna incidencia abierta**, una vez cada uno.',
        hint: '`WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT c.id, c.nombre, c.email FROM clientes c WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL)',
      },
      {
        id: 'nunca_recibida',
        from: 'carmen',
        title: 'Cuentas que nunca han recibido',
        description: '`id` e `iban` de las cuentas que **nunca han recibido** una transferencia.',
        hint: '`WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)`. Con `NOT IN` cuidado: hay destinos NULL.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT a.id, a.iban FROM cuentas a WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id)',
      },
      {
        id: 'cuentas_por_cliente',
        from: 'marta',
        title: 'Cuentas de cada cliente',
        description: '`id`, `nombre` y **número de cuentas** de **todos** los clientes, también los que tienen 0.',
        hint: 'LEFT JOIN, `GROUP BY c.id, c.nombre` y `COUNT(a.id)` (con `COUNT(*)` el que no tiene cuentas saldría con 1).',
        visibleWhen: { kind: 'flag', key: 'encargo.marta2' },
        solution: 'SELECT c.id, c.nombre, COUNT(a.id) FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id GROUP BY c.id, c.nombre',
      },
    ],
  },

  bugs: [
    { id: 'C-BIENVENIDA', title: 'El cliente que nunca abrió cuenta no recibe ningún mensaje', severity: 'medium', explanation: 'Marta no recibió el cliente sin cuentas.', technique: 'Anti-join: LEFT JOIN … IS NULL.', preventedBy: 'reto.sin_cuenta' },
    { id: 'C-HUERFANA', title: 'Una transferencia a una cuenta inexistente sigue sin detectar', severity: 'critical', explanation: 'La transferencia 77 apunta a la cuenta 999, que no existe: falta una validación.', technique: 'LEFT JOIN con la referencia y IS NULL.', preventedBy: 'reto.destino_inexistente' },
    { id: 'C-LLAMADAS', title: 'Ocho clientes con incidencias abiertas esperan una llamada', severity: 'medium', explanation: 'Nuria no recibió la lista.', technique: 'EXISTS.', preventedBy: 'reto.con_incidencia' },
    { id: 'C-SIN-USO', title: 'Riesgos cree que no hay cuentas sin uso', severity: 'medium', explanation: 'Carmen se quedó con el cero de Diego.', technique: 'NOT EXISTS.', preventedBy: 'reto.nunca_recibida' },
    { id: 'C-RECUENTO', title: 'El informe dice que todos los clientes tienen al menos una cuenta', severity: 'medium', explanation: 'Sin el recuento con LEFT JOIN y COUNT(a.id), el cero no aparece.', technique: 'LEFT JOIN + COUNT(columna de la derecha).', preventedBy: 'reto.cuentas_por_cliente' },
    { id: 'C-LEFT-WHERE', title: 'Un listado de «todos los clientes» pierde clientes', severity: 'medium', explanation: 'El filtro de la tabla de la derecha en el WHERE convierte el LEFT JOIN en INNER.', technique: 'Condiciones de la derecha en el ON.', preventedBy: 'practice.left_on' },
    { id: 'C-NOT-IN', title: 'Un NOT IN con NULL vuelve a dar cero en otro informe', severity: 'high', explanation: 'NOT IN con un NULL en la subconsulta no devuelve nada.', technique: 'NOT EXISTS.', preventedBy: 'practice.notin' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con lo que faltaba el miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.sin_cuenta', label: 'Cliente sin cuenta', explanation: 'Anti-join.' },
      { flag: 'reto.destino_inexistente', label: 'Referencia rota', explanation: 'La transferencia 77.' },
      { flag: 'reto.con_incidencia', label: 'Llamadas de Nuria', explanation: 'EXISTS.' },
      { flag: 'reto.nunca_recibida', label: 'Cuentas sin uso', explanation: 'NOT EXISTS.' },
      { flag: 'reto.cuentas_por_cliente', label: 'Recuento con ceros', explanation: 'COUNT(a.id).' },
      { flag: 'practice.left_on', label: 'LEFT JOIN que conserva', explanation: 'Condiciones en el ON.' },
      { flag: 'practice.notin', label: 'Sin trampas de NOT IN', explanation: 'NOT EXISTS.' },
    ],
  },

  concepts: [
    { id: 'left_join', title: 'LEFT JOIN', summary: 'Conserva todas las filas de la izquierda; sin pareja, las de la derecha salen a NULL.' },
    { id: 'anti_join', title: 'Anti-join', summary: 'LEFT JOIN … WHERE derecha.id IS NULL: lo que no tiene pareja.' },
    { id: 'exists', title: 'EXISTS y NOT EXISTS', summary: 'Comprueba si una subconsulta devuelve alguna fila, sin repetir la fila principal.' },
    { id: 'left_on_where', title: 'ON frente a WHERE en un LEFT JOIN', summary: 'Filtrar la tabla de la derecha en el WHERE elimina las filas sin pareja.' },
    { id: 'left_count', title: 'Contar con LEFT JOIN', summary: 'COUNT(columna de la derecha) da 0 a quien no tiene pareja; COUNT(*) da 1.' },
    { id: 'not_in_null', title: 'NOT IN y NULL', summary: 'Un NULL en la lista hace que NOT IN no devuelva nada.' },
  ],
  debriefConcepts: ['left_join', 'anti_join', 'exists', 'left_on_where', 'left_count', 'not_in_null'],
  seniorTips: [
    'Lee la chuleta de LEFT JOIN en la wiki.',
    'Inés: SELECT c.id, c.nombre, a.iban FROM clientes c LEFT JOIN cuentas a ON a.cliente_id = c.id.',
    'Marta: … LEFT JOIN cuentas a ON a.cliente_id = c.id WHERE a.id IS NULL.',
    'Diego: … LEFT JOIN cuentas a ON t.cuenta_destino_id = a.id WHERE t.cuenta_destino_id IS NOT NULL AND a.id IS NULL.',
    'Nuria: … WHERE EXISTS (SELECT 1 FROM incidencias i WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL).',
    'Carmen: … WHERE NOT EXISTS (SELECT 1 FROM transferencias t WHERE t.cuenta_destino_id = a.id).',
    'Marta: LEFT JOIN + GROUP BY c.id, c.nombre + COUNT(a.id).',
    'Con Inés: lo de la derecha, al ON; NOT IN con NULL no devuelve nada.',
  ],
}
