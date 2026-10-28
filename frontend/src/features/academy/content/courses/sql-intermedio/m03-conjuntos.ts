import type { Mission } from '../../../engine/types'
import { kobaltoPagosDbSql } from '../../../sql/kobaltoPagosDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Scenes } from './m03-scenes'

const op = (word: 'union' | 'intersect' | 'except') => ({
  pattern: new RegExp(`\\b${word}\\b`, 'i'),
  message: `Este encargo se resuelve juntando dos consultas con \`${word.toUpperCase()}\`.`,
})

/**
 * Curso 6: SQL intermedio · Misión 3 — Juntar resultados.
 * Guion legible: docs/academy/sql-intermedio/missions/m03-conjuntos.md
 *
 * UNION, UNION ALL, INTERSECT y EXCEPT sobre Kobalto ampliada; trampas: UNION
 * que se come filas al sumar y columnas emparejadas por posición.
 */
export const m03Conjuntos: Mission = {
  id: 'm03-conjuntos',
  courseKey: 'sql-intermedio',
  number: 3,
  title: 'Juntar resultados',
  subtitle: 'UNION, UNION ALL, INTERSECT y EXCEPT: listas que se suman, se cruzan y se restan.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA · Datos · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · mes 2',
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
  lessons: m03Lessons,
  mentor: 'ines',
  quiz: m03Quiz,
  verdicts: {
    good: {
      title: 'Listas que cuadran',
      body: 'Marta tiene su informe de enero completo, Carmen sus dos clientes para revisar, Nuria su tutorial, Diego la cuenta 999 localizada antes de migrar y Laura sus comercios con historial.',
    },
    ok: {
      title: 'Juntas listas, a medias',
      body: 'Ya usas UNION, INTERSECT y EXCEPT, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Listas cruzadas a mano',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de operaciones de conjuntos a mano.',
    },
  },

  briefing: {
    title: 'Mes 2 · Juntar resultados',
    paragraphs: [
      'Jueves. Hoy las respuestas salen de juntar dos consultas: los que están en una lista o en otra, en las dos, o en una y no en la otra.',
      'Cada encargo dice cómo se juntan las listas: tu consulta tiene que usar ese operador y devolver exactamente lo que se pide.',
    ],
    goals: [
      'Junta dos listas sin repetidos con UNION.',
      'Junta movimientos con UNION ALL, sin perder filas.',
      'Cruza dos listas con INTERSECT.',
      'Resta una lista a otra con EXCEPT.',
      'Mantén las columnas en el mismo número, orden y tipo.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m03Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_conjuntos',
      title: 'Chuleta: juntar resultados',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'union_distinct' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Operadores
| Operador | Devuelve |
|---|---|
| \`A UNION B\` | Lo que está en A o en B, sin repetir |
| \`A UNION ALL B\` | Todas las filas de A y de B |
| \`A INTERSECT B\` | Lo que está en A y en B |
| \`A EXCEPT B\` | Lo que está en A y no en B |

## Reglas
- Mismo número de columnas, mismo orden, tipos compatibles: se emparejan **por posición**.
- Los nombres de las columnas los pone la primera consulta.
- Un solo \`ORDER BY\`, al final.
- Una columna fija (\`'tarjeta' AS tipo\`) dice de dónde viene cada fila.

## Para no equivocarte
- ¿Vas a sumar o contar? \`UNION ALL\`.
- ¿Quieres una lista de valores distintos? \`UNION\`.
- \`EXCEPT\` no es simétrico.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoPagosDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Dos consultas, una lista\nSELECT cuenta_origen_id AS cuenta_id FROM transferencias\nUNION\nSELECT cuenta_destino_id FROM transferencias\nWHERE cuenta_destino_id IS NOT NULL;',
    retos: [
      {
        id: 'cuentas_movidas',
        from: 'ines',
        title: 'Cuentas con alguna transferencia',
        description: 'Las cuentas que han participado en alguna transferencia, como **origen o destino**, sin repetir y sin las vacías: una columna `cuenta_id`.',
        hint: '`cuenta_origen_id` de una consulta, `UNION`, `cuenta_destino_id` (no nula) de otra.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT cuenta_origen_id AS cuenta_id FROM transferencias UNION SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL',
        columns: ['cuenta_id'],
        requires: [op('union')],
      },
      {
        id: 'movimientos_enero',
        from: 'marta',
        title: 'Movimientos de enero de 2026',
        description: "Transferencias **completadas** y pagos con tarjeta **aceptados** de **enero de 2026**, en una lista: `tipo` ('transferencia' o 'tarjeta'), `id`, `importe` y `fecha`.",
        hint: "`SELECT 'transferencia' AS tipo, id, importe, creada_en AS fecha FROM transferencias WHERE …` `UNION ALL` `SELECT 'tarjeta', id, importe, pagado_en FROM pagos_tarjeta WHERE …`. Enero, con un rango de fechas.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT 'transferencia' AS tipo, id, importe, creada_en AS fecha FROM transferencias WHERE estado = 'completada' AND creada_en >= '2026-01-01' AND creada_en < '2026-02-01' UNION ALL SELECT 'tarjeta', id, importe, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-01-01' AND pagado_en < '2026-02-01'",
        columns: ['tipo', 'id', 'importe', 'fecha'],
        requires: [op('union')],
      },
      {
        id: 'rechazo_e_incidencia',
        from: 'carmen',
        title: 'Pago rechazado e incidencia por tarjeta bloqueada',
        description: '`cliente_id` de los clientes con **algún pago con tarjeta rechazado** que **también** tienen una incidencia con motivo **«Tarjeta bloqueada»**.',
        hint: 'Primera lista: `pagos_tarjeta` → `tarjetas` → `cuentas` (para llegar al `cliente_id`), solo rechazados. `INTERSECT`. Segunda: `cliente_id` de `incidencias` con ese motivo.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT a.cliente_id FROM pagos_tarjeta p JOIN tarjetas t ON t.id = p.tarjeta_id JOIN cuentas a ON a.id = t.cuenta_id WHERE p.estado = 'rechazado' INTERSECT SELECT cliente_id FROM incidencias WHERE motivo = 'Tarjeta bloqueada'",
        requires: [op('intersect')],
      },
      {
        id: 'sin_pagos',
        from: 'nuria',
        title: 'Clientes que nunca han pagado con tarjeta',
        description: '`id` y `nombre` de los clientes que **no tienen ningún pago** con tarjeta.',
        hint: '`SELECT id, nombre FROM clientes` `EXCEPT` los `c.id, c.nombre` de clientes unidos a cuentas, tarjetas y pagos.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT id, nombre FROM clientes EXCEPT SELECT c.id, c.nombre FROM clientes c JOIN cuentas a ON a.cliente_id = c.id JOIN tarjetas t ON t.cuenta_id = a.id JOIN pagos_tarjeta p ON p.tarjeta_id = t.id',
        requires: [op('except')],
      },
      {
        id: 'destinos_inexistentes',
        from: 'diego',
        title: 'Cuentas de destino que no existen',
        description: 'Las `cuenta_destino_id` (no vacías) de `transferencias` que **no existen** en `cuentas`. Una columna.',
        hint: '`SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL` `EXCEPT` `SELECT id FROM cuentas`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL EXCEPT SELECT id FROM cuentas',
        requires: [op('except')],
      },
      {
        id: 'comercios_dos_anios',
        from: 'laura',
        title: 'Comercios con pagos en los dos años',
        description: '`comercio_id` de los comercios con pagos **aceptados** en **2025** y **también** en **2026**.',
        hint: 'Dos consultas sobre `pagos_tarjeta` con rangos de fecha distintos, unidas con `INTERSECT`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT comercio_id FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2025-01-01' AND pagado_en < '2026-01-01' INTERSECT SELECT comercio_id FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en >= '2026-01-01'",
        requires: [op('intersect')],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El informe de enero sale sin movimientos', severity: 'medium', explanation: 'Marta no recibió la lista conjunta de transferencias y pagos.', technique: 'UNION ALL con una columna de tipo.', preventedBy: 'reto.movimientos_enero' },
    { id: 'C-CARMEN', title: 'Dos clientes siguen con la tarjeta bloqueada por error', severity: 'high', explanation: 'Carmen no cruzó pagos rechazados con incidencias.', technique: 'INTERSECT.', preventedBy: 'reto.rechazo_e_incidencia' },
    { id: 'C-NURIA', title: 'El tutorial de pagos llega a todos los clientes', severity: 'low', explanation: 'Sin la lista de clientes sin pagos, Nuria lo envió a todo el mundo.', technique: 'EXCEPT.', preventedBy: 'reto.sin_pagos' },
    { id: 'C-DIEGO', title: 'La migración de transferencias falla en producción', severity: 'high', explanation: 'Nadie detectó la cuenta de destino 999, que no existe.', technique: 'EXCEPT como comprobación de integridad.', preventedBy: 'reto.destinos_inexistentes' },
    { id: 'C-LAURA', title: 'Los tests de regresión usan comercios sin historial', severity: 'low', explanation: 'Laura no tuvo los comercios con pagos en los dos años.', technique: 'INTERSECT.', preventedBy: 'reto.comercios_dos_anios' },
    { id: 'C-UNION', title: 'El informe de enero se queda corto en 17,55 €', severity: 'medium', explanation: 'UNION quitó un movimiento con el mismo importe que otro.', technique: 'UNION ALL para sumar o contar.', preventedBy: 'practice.union_all' },
    { id: 'C-COLUMNAS', title: 'Un listado mezcla importes con identificadores', severity: 'high', explanation: 'UNION emparejó columnas cambiadas de orden sin dar error.', technique: 'Mismas columnas, en el mismo orden.', preventedBy: 'practice.union_columns' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.movimientos_enero', label: 'Informe de enero', explanation: 'Transferencias y pagos juntos.' },
      { flag: 'reto.rechazo_e_incidencia', label: 'Revisión de Carmen', explanation: 'Clientes en las dos listas.' },
      { flag: 'reto.sin_pagos', label: 'Tutorial de Nuria', explanation: 'Clientes sin pagos.' },
      { flag: 'reto.destinos_inexistentes', label: 'Migración de Diego', explanation: 'La cuenta 999, localizada.' },
      { flag: 'reto.comercios_dos_anios', label: 'Regresión de Laura', explanation: 'Comercios con dos años de datos.' },
      { flag: 'practice.union_all', label: 'Sumas completas', explanation: 'UNION ALL para movimientos.' },
      { flag: 'practice.union_columns', label: 'Columnas en su sitio', explanation: 'Mismo orden en las dos consultas.' },
    ],
  },

  concepts: [
    { id: 'union_distinct', title: 'UNION', summary: 'Lo que está en una lista o en la otra, sin repetir.' },
    { id: 'union_all', title: 'UNION ALL', summary: 'Todas las filas de las dos consultas: para sumar o contar movimientos.' },
    { id: 'intersect_op', title: 'INTERSECT', summary: 'Lo que está en las dos listas.' },
    { id: 'except_op', title: 'EXCEPT', summary: 'Lo que está en la primera lista y no en la segunda; no es simétrico.' },
    { id: 'setop_columns', title: 'Columnas por posición', summary: 'Mismo número, orden y tipos; nombres de la primera consulta; ORDER BY al final.' },
    { id: 'setop_vs_join', title: 'Conjuntos o JOIN', summary: 'JOIN pone columnas al lado; UNION y compañía, filas debajo o listas comparadas.' },
  ],
  debriefConcepts: ['union_distinct', 'union_all', 'intersect_op', 'except_op', 'setop_columns', 'setop_vs_join'],
  seniorTips: [
    'Lee la chuleta de juntar resultados en la wiki.',
    'Inés: cuenta_origen_id AS cuenta_id … UNION … cuenta_destino_id … WHERE cuenta_destino_id IS NOT NULL.',
    "Marta: 'transferencia' AS tipo, id, importe, creada_en AS fecha … UNION ALL 'tarjeta', id, importe, pagado_en …, enero con rango.",
    "Carmen: cliente_id de pagos rechazados (pagos → tarjetas → cuentas) INTERSECT cliente_id de incidencias 'Tarjeta bloqueada'.",
    'Nuria: SELECT id, nombre FROM clientes EXCEPT c.id, c.nombre de clientes con pagos.',
    'Diego: cuenta_destino_id no nula EXCEPT SELECT id FROM cuentas.',
    'Laura: comercio_id aceptados en 2025 INTERSECT comercio_id aceptados en 2026.',
    'Con Inés: para sumar, UNION ALL; y las columnas se emparejan por posición.',
  ],
}
