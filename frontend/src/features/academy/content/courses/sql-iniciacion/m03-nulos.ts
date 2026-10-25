import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Scenes } from './m03-scenes'

/**
 * Curso 5: SQL desde cero · Misión 3 — Los huecos.
 * Guion legible: docs/academy/sql-iniciacion/missions/m03-nulos.md
 *
 * NULL: IS NULL, NULL en las comparaciones, COALESCE y CASE, con encargos de
 * Inés, Nuria, Diego, Marta, Laura y Carmen.
 */
export const m03Nulos: Mission = {
  id: 'm03-nulos',
  courseKey: 'sql-iniciacion',
  number: 3,
  title: 'Los huecos',
  subtitle: 'NULL, IS NULL, COALESCE y CASE.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Jueves · semana 1',
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
      title: 'Ningún hueco se te escapa',
      body: 'Nuria tiene sus incidencias abiertas, Marta no se deja a nadie fuera de la campaña, Laura sabe qué esperar del PDF y Carmen tiene su informe de riesgo.',
    },
    ok: {
      title: 'Algún NULL se coló',
      body: 'Ya distingues NULL, pero algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Los huecos ganaron',
      body: 'Varios encargos se quedaron sin hacer o con filas de menos. Repite la misión: IS NULL, COALESCE y CASE.',
    },
  },

  briefing: {
    title: 'Semana 1 · Los huecos',
    paragraphs: [
      'Cuarto día en Kobalto. Hoy los encargos tienen algo en común: datos que faltan. Clientes sin segmento, incidencias sin cerrar, transferencias sin concepto.',
      'En SQL, «no hay dato» se llama NULL y no se comporta como un valor normal. Hoy aprendes a encontrarlo, a no perderlo por el camino y a sustituirlo.',
    ],
    goals: [
      'Encuentra los huecos con IS NULL e IS NOT NULL.',
      'Ten en cuenta los NULL cuando filtras con <>.',
      'Sustituye NULL por un valor con COALESCE.',
      'Etiqueta filas con CASE.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m03Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_null',
      title: 'Chuleta: NULL, COALESCE y CASE',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'null_meaning' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Qué es NULL
«No hay dato». No es 0 ni ''.

## Dónde hay NULL en Kobalto
- \`clientes.segmento\`: cliente sin segmento asignado.
- \`incidencias.cerrada_en\`: incidencia todavía abierta.
- \`transferencias.cuenta_destino_id\`: transferencia a otro banco.
- \`transferencias.concepto\`: transferencia sin concepto.

## Reglas
- Se busca con \`IS NULL\` / \`IS NOT NULL\`. **Nunca** con \`= NULL\`.
- \`<>\`, \`NOT IN\`, \`>\`… dejan fuera los NULL. Si los quieres: \`OR columna IS NULL\`.
- Una operación con NULL da NULL.
- \`COALESCE(columna, 'valor por defecto')\`.

## CASE
\`CASE WHEN condición THEN valor WHEN … ELSE valor END AS nombre\` — gana la primera que se cumple.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Busca los huecos con IS NULL\nSELECT id, nombre, apellidos\nFROM clientes\nWHERE segmento IS NULL;',
    retos: [
      {
        id: 'sin_segmento',
        from: 'ines',
        title: 'Clientes sin segmento',
        description: '`id`, `nombre` y `apellidos` de los clientes que **no tienen segmento**.',
        hint: '`= NULL` no funciona nunca. Usa `WHERE segmento IS NULL`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT id, nombre, apellidos FROM clientes WHERE segmento IS NULL',
      },
      {
        id: 'abiertas',
        from: 'nuria',
        title: 'Incidencias sin cerrar',
        description: '`id`, `cliente_id`, `motivo` y `abierta_en` de las incidencias que **no tienen fecha de cierre**.',
        hint: 'Una incidencia abierta tiene `cerrada_en` vacío: `IS NULL`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT id, cliente_id, motivo, abierta_en FROM incidencias WHERE cerrada_en IS NULL',
      },
      {
        id: 'externas',
        from: 'diego',
        title: 'Transferencias a otros bancos',
        description: '`id`, `importe` y `estado` de las transferencias **sin cuenta de destino** en Kobalto.',
        hint: '`cuenta_destino_id IS NULL`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT id, importe, estado FROM transferencias WHERE cuenta_destino_id IS NULL',
      },
      {
        id: 'no_premium',
        from: 'marta',
        title: 'Todos los que no son premium',
        description: '`id`, `nombre` y `segmento` de los clientes que **no son premium**, incluidos los que **no tienen segmento**.',
        hint: "`segmento <> 'premium'` deja fuera los NULL. Añádelos con `OR segmento IS NULL`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT id, nombre, segmento FROM clientes WHERE segmento <> 'premium' OR segmento IS NULL",
      },
      {
        id: 'sin_concepto',
        from: 'laura',
        title: 'Concepto o «Sin concepto»',
        description: '`id` y `concepto` de **todas** las transferencias; si no hay concepto, el texto **Sin concepto**. La columna se llama `concepto`.',
        hint: "`COALESCE(concepto, 'Sin concepto') AS concepto`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT id, COALESCE(concepto, 'Sin concepto') AS concepto FROM transferencias",
        columns: ['id', 'concepto'],
      },
      {
        id: 'nivel',
        from: 'carmen',
        title: 'Nivel de saldo',
        description: '`id`, `saldo` y `nivel` de cada cuenta: **negativo** (< 0), **bajo** (< 1.000), **medio** (< 10.000) o **alto** (el resto).',
        hint: "`CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' … ELSE 'alto' END AS nivel`. El orden de los WHEN importa.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT id, saldo, CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 10000 THEN 'medio' ELSE 'alto' END AS nivel FROM cuentas",
        columns: ['id', 'saldo', 'nivel'],
      },
    ],
  },

  bugs: [
    { id: 'C-NURIA', title: 'Ocho incidencias abiertas siguen esperando', severity: 'high', explanation: 'Nuria no recibió la lista de incidencias sin cerrar.', technique: 'IS NULL.', preventedBy: 'reto.abiertas' },
    { id: 'C-DIEGO', title: 'El conector con otros bancos se prueba sin datos reales', severity: 'medium', explanation: 'Diego no recibió las transferencias sin cuenta de destino.', technique: 'IS NULL en la clave que falta.', preventedBy: 'reto.externas' },
    { id: 'C-PREMIUM', title: 'La campaña premium se olvida de los clientes sin segmento', severity: 'medium', explanation: '<> deja fuera los NULL: el borrador decía 31 en vez de 33.', technique: "<> 'premium' OR IS NULL.", preventedBy: 'reto.no_premium' },
    { id: 'C-PDF', title: 'El extracto en PDF sale con celdas en blanco', severity: 'medium', explanation: 'Laura no tenía con qué comparar las transferencias sin concepto.', technique: 'COALESCE con un valor por defecto.', preventedBy: 'reto.sin_concepto' },
    { id: 'C-RIESGO', title: 'El informe de riesgo sale sin etiquetas', severity: 'medium', explanation: 'Carmen no recibió el nivel de cada cuenta.', technique: 'CASE WHEN … END.', preventedBy: 'reto.nivel' },
    { id: 'C-ISNULL', title: 'Atención al cliente informa de que no hay incidencias abiertas', severity: 'high', explanation: '= NULL devuelve cero filas sin dar error.', technique: 'IS NULL, nunca = NULL.', preventedBy: 'practice.isnull' },
    { id: 'C-ETIQUETA', title: 'Dos clientes aparecen en la app sin nombre', severity: 'medium', explanation: 'Concatenar con un NULL da NULL.', technique: 'COALESCE antes de operar.', preventedBy: 'practice.nullprop' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los encargos del jueves.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.abiertas', label: 'Incidencias abiertas', explanation: 'cerrada_en IS NULL.' },
      { flag: 'reto.externas', label: 'Pruebas del conector', explanation: 'Transferencias sin cuenta de destino.' },
      { flag: 'reto.no_premium', label: 'Campaña premium completa', explanation: 'Incluidos los clientes sin segmento.' },
      { flag: 'reto.sin_concepto', label: 'Extracto sin huecos', explanation: 'COALESCE con «Sin concepto».' },
      { flag: 'reto.nivel', label: 'Informe de riesgo', explanation: 'Nivel de cada cuenta con CASE.' },
      { flag: 'practice.isnull', label: 'IS NULL, no = NULL', explanation: 'Cero filas revisadas.' },
      { flag: 'practice.nullprop', label: 'Etiquetas completas', explanation: 'COALESCE antes de concatenar.' },
    ],
  },

  concepts: [
    { id: 'null_meaning', title: 'Qué es NULL', summary: '«No hay dato»: ni 0 ni texto vacío.' },
    { id: 'is_null', title: 'IS NULL', summary: 'Los huecos se buscan con IS NULL / IS NOT NULL; = NULL nunca es verdadero.' },
    { id: 'null_logic', title: 'NULL en comparaciones y operaciones', summary: '<> y compañía dejan fuera los NULL, y una operación con NULL da NULL.' },
    { id: 'coalesce', title: 'COALESCE', summary: 'Devuelve el primer valor que no es NULL: un valor por defecto.' },
    { id: 'case_when', title: 'CASE', summary: 'Crea una columna según condiciones; gana la primera que se cumple.' },
  ],
  debriefConcepts: ['null_meaning', 'is_null', 'null_logic', 'coalesce', 'case_when'],
  seniorTips: [
    'Lee la chuleta de NULL en la wiki.',
    'Inés: SELECT id, nombre, apellidos FROM clientes WHERE segmento IS NULL.',
    'Nuria: … FROM incidencias WHERE cerrada_en IS NULL.',
    'Diego: SELECT id, importe, estado FROM transferencias WHERE cuenta_destino_id IS NULL.',
    "Marta: … WHERE segmento <> 'premium' OR segmento IS NULL.",
    "Laura: SELECT id, COALESCE(concepto, 'Sin concepto') AS concepto FROM transferencias.",
    "Carmen: CASE WHEN saldo < 0 THEN 'negativo' WHEN saldo < 1000 THEN 'bajo' WHEN saldo < 10000 THEN 'medio' ELSE 'alto' END AS nivel.",
    'Con Inés: IS NULL en vez de = NULL; NULL contagia: COALESCE.',
  ],
}
