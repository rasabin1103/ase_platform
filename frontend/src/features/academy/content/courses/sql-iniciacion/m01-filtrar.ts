import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m01Lessons } from './m01-lessons'
import { m01Quiz } from './m01-quiz'
import { m01Scenes } from './m01-scenes'

/**
 * Curso 5: SQL desde cero · Misión 1 — Solo lo que importa.
 * Guion legible: docs/academy/sql-iniciacion/missions/m01-filtrar.md
 *
 * WHERE con comparaciones, textos, AND/OR, IN y rangos de fechas, con
 * encargos de Inés, Marta, Carmen, Nuria y Diego.
 */
export const m01Filtrar: Mission = {
  id: 'm01-filtrar',
  courseKey: 'sql-iniciacion',
  number: 1,
  title: 'Solo lo que importa',
  subtitle: 'WHERE: comparaciones, textos, AND/OR, IN y rangos de fechas.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Martes · semana 1',
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
  lessons: m01Lessons,
  mentor: 'ines',
  quiz: m01Quiz,
  verdicts: {
    good: {
      title: 'Cada uno con sus filas',
      body: 'Marta tiene sus campañas bien dirigidas, Carmen su auditoría completa, Nuria sus invitaciones y Diego ya sabe por qué le faltaba el domingo.',
    },
    ok: {
      title: 'Filtras, pero se escapó algo',
      body: 'Ya usas WHERE, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Demasiadas filas (o ninguna)',
      body: 'Varios encargos se quedaron sin hacer o con el filtro equivocado. Repite la misión con la chuleta de WHERE a mano.',
    },
  },

  briefing: {
    title: 'Semana 1 · Solo lo que importa',
    paragraphs: [
      'Segundo día en Kobalto. Ya sabes sacar columnas; hoy el equipo quiere filas concretas: las de una ciudad, las que superan un importe, las de una semana.',
      'Cada encargo se cumple cuando tu consulta devuelve exactamente las filas que se piden: ni una de más ni una de menos.',
    ],
    goals: [
      'Filtra con WHERE y los operadores de comparación.',
      'Escribe bien los textos: comillas simples y mayúsculas exactas.',
      'Combina condiciones con AND, OR e IN.',
      'Filtra un rango de fechas sin perder el último día.',
      'Comprueba siempre que el número de filas tiene sentido.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m01Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_where',
      title: 'Chuleta: filtrar con WHERE',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'where_basic' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma
\`SELECT columnas FROM tabla WHERE condición;\`

## Comparar
- \`=\` · \`<>\` · \`>\` · \`<\` · \`>=\` · \`<=\`
- Números sin comillas: \`saldo > 10000\`.
- Textos y fechas con comillas simples: \`ciudad = 'Madrid'\`, \`fecha_alta >= '2025-01-01'\`.

## Combinar
- \`AND\`: las dos. \`OR\`: una de ellas. \`NOT\`: lo contrario.
- \`IN ('a', 'b')\`: cualquiera de la lista.
- \`BETWEEN x AND y\`: entre los dos, incluidos.
- AND va antes que OR: al mezclarlos, **paréntesis**.

## Valores que hay en Kobalto
- \`clientes.segmento\`: estandar, premium, joven.
- \`cuentas.estado\`: activa, bloqueada, cerrada. \`cuentas.tipo\`: corriente, ahorro.
- \`transferencias.estado\`: completada, pendiente, rechazada.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Filtra filas con WHERE\nSELECT *\nFROM clientes\nWHERE ciudad = 'Madrid';",
    retos: [
      {
        id: 'madrid',
        from: 'ines',
        title: 'Los clientes de Madrid',
        description: 'Todas las columnas de los clientes cuya `ciudad` es **Madrid**.',
        hint: "Después del `FROM`, `WHERE ciudad = 'Madrid'`. El texto, entre comillas simples y con la «M» mayúscula.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT * FROM clientes WHERE ciudad = 'Madrid'",
      },
      {
        id: 'saldo_alto',
        from: 'marta',
        title: 'Cuentas con mucho saldo',
        description: 'El `iban`, el `tipo` y el `saldo` de las cuentas con un saldo **mayor que 10.000 €**.',
        hint: 'Los números van sin comillas y sin punto de miles: `saldo > 10000`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT iban, tipo, saldo FROM cuentas WHERE saldo > 10000',
      },
      {
        id: 'no_activas',
        from: 'carmen',
        title: 'Cuentas que no están activas',
        description: 'El `id`, el `iban` y el `estado` de todas las cuentas cuyo estado **no** es «activa».',
        hint: 'Hay más de un estado que no es «activa». En vez de nombrarlos todos, usa «distinto de»: `<>`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT id, iban, estado FROM cuentas WHERE estado <> 'activa'",
      },
      {
        id: 'sur',
        from: 'nuria',
        title: 'Clientes de Sevilla o Málaga',
        description: 'El `nombre`, los `apellidos` y la `ciudad` de los clientes de **Sevilla o Málaga**.',
        hint: "`ciudad IN ('Sevilla', 'Málaga')`, o dos condiciones completas unidas con `OR`. Ojo con la tilde de Málaga.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT nombre, apellidos, ciudad FROM clientes WHERE ciudad IN ('Sevilla', 'Málaga')",
      },
      {
        id: 'jovenes_madrid',
        from: 'marta',
        title: 'Jóvenes de Madrid',
        description: 'El `nombre` y el `email` de los clientes del segmento **joven** que viven en **Madrid**.',
        hint: "Se tienen que cumplir las dos condiciones a la vez: `AND`. Los valores de segmento están en minúsculas y sin tilde.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta2' },
        solution: "SELECT nombre, email FROM clientes WHERE ciudad = 'Madrid' AND segmento = 'joven'",
      },
      {
        id: 'semana',
        from: 'diego',
        title: 'Una semana de transferencias',
        description: '`id`, `importe`, `estado` y `creada_en` de las transferencias del **lunes 19 al domingo 25 de enero de 2026**, los dos días incluidos.',
        hint: "`creada_en` tiene hora: `'2026-01-25'` es ese día a las 00:00. Pide desde el 19 (incluido) hasta el 26 (sin incluir): `>=` y `<`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT id, importe, estado, creada_en FROM transferencias WHERE creada_en >= '2026-01-19' AND creada_en < '2026-01-26'",
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'La campaña de ahorro sale sin lista de cuentas', severity: 'high', explanation: 'El encargo de Marta se quedó sin hacer.', technique: 'Comparar números con > en el WHERE.', preventedBy: 'reto.saldo_alto' },
    { id: 'C-CARMEN', title: 'La auditoría se queda sin las cuentas bloqueadas y cerradas', severity: 'high', explanation: 'Carmen no recibió las cuentas que no están activas.', technique: 'Distinto de: <>.', preventedBy: 'reto.no_activas' },
    { id: 'C-NURIA', title: 'Nadie invita a los clientes de Sevilla y Málaga al evento', severity: 'medium', explanation: 'Nuria se quedó sin el listado de Andalucía.', technique: 'IN o condiciones completas con OR.', preventedBy: 'reto.sur' },
    { id: 'C-CAMPANA', title: 'La tarjeta joven se ofrece a clientes que no son jóvenes', severity: 'medium', explanation: 'Sin el listado filtrado, Marta escribe a todos los clientes de Madrid.', technique: 'Dos condiciones con AND.', preventedBy: 'reto.jovenes_madrid' },
    { id: 'C-SEMANA', title: 'El informe semanal de Diego pierde las transferencias del domingo', severity: 'medium', explanation: 'BETWEEN con fechas sin hora corta el último día a las 00:00.', technique: 'Rango >= inicio AND < día siguiente.', preventedBy: 'reto.semana' },
    { id: 'C-COMILLAS', title: 'Nuria cuenta en una reunión que no hay clientes en Madrid', severity: 'high', explanation: "Con 'madrid' en minúscula salen cero filas, y cero filas parecen una respuesta.", technique: 'Comillas simples, texto exacto y revisar los resultados sorprendentes.', preventedBy: 'practice.quotes' },
    { id: 'C-PRECEDENCIA', title: 'Un listado de jóvenes incluye a todos los clientes de Madrid', severity: 'medium', explanation: 'Mezclar AND y OR sin paréntesis cambia lo que pide la consulta.', technique: 'Paréntesis o IN al combinar AND y OR.', preventedBy: 'practice.parens' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los encargos del martes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.saldo_alto', label: 'Campaña de ahorro', explanation: 'Cuentas con más de 10.000 €.' },
      { flag: 'reto.no_activas', label: 'Auditoría de Carmen', explanation: 'Todas las cuentas no activas.' },
      { flag: 'reto.sur', label: 'Evento en Andalucía', explanation: 'Clientes de Sevilla o Málaga.' },
      { flag: 'reto.jovenes_madrid', label: 'Tarjeta joven', explanation: 'Jóvenes y de Madrid, a la vez.' },
      { flag: 'reto.semana', label: 'Informe de Diego', explanation: 'La semana entera, domingo incluido.' },
      { flag: 'practice.quotes', label: 'Cero filas revisadas', explanation: 'Comillas simples y mayúsculas exactas.' },
      { flag: 'practice.parens', label: 'AND y OR bien agrupados', explanation: 'Paréntesis al mezclarlos.' },
    ],
  },

  concepts: [
    { id: 'where_basic', title: 'WHERE', summary: 'Filtra las filas: solo salen las que cumplen la condición.' },
    { id: 'comparison_ops', title: 'Operadores de comparación', summary: '=, <>, >, <, >= y <=; los números sin comillas.' },
    { id: 'text_quotes', title: 'Textos entre comillas simples', summary: 'Comillas simples para textos y fechas; la comparación es exacta, con mayúsculas.' },
    { id: 'and_or', title: 'AND, OR y NOT', summary: 'AND exige las dos condiciones; OR basta con una.' },
    { id: 'in_list', title: 'IN', summary: 'Cualquiera de una lista de valores: más corto y seguro que varios OR.' },
    { id: 'between_dates', title: 'BETWEEN y rangos de fechas', summary: 'BETWEEN incluye los extremos; con fecha y hora, mejor >= inicio y < día siguiente.' },
    { id: 'precedence', title: 'AND antes que OR', summary: 'Al mezclar AND y OR, paréntesis para decir exactamente qué se quiere.' },
  ],
  debriefConcepts: ['where_basic', 'comparison_ops', 'text_quotes', 'and_or', 'in_list', 'between_dates', 'precedence'],
  seniorTips: [
    'Lee la chuleta de WHERE en la wiki.',
    "Inés: SELECT * FROM clientes WHERE ciudad = 'Madrid'.",
    'Marta: SELECT iban, tipo, saldo FROM cuentas WHERE saldo > 10000.',
    "Carmen: SELECT id, iban, estado FROM cuentas WHERE estado <> 'activa'.",
    "Nuria: SELECT nombre, apellidos, ciudad FROM clientes WHERE ciudad IN ('Sevilla', 'Málaga').",
    "Marta: SELECT nombre, email FROM clientes WHERE ciudad = 'Madrid' AND segmento = 'joven'.",
    "Diego: … WHERE creada_en >= '2026-01-19' AND creada_en < '2026-01-26'.",
    'Con Inés: comillas simples y mayúsculas exactas; AND va antes que OR.',
  ],
}
