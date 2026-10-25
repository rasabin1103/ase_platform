import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Scenes } from './m05-scenes'

/**
 * Curso 5: SQL desde cero · Misión 5 — Agrupar.
 * Guion legible: docs/academy/sql-iniciacion/missions/m05-agrupar.md
 *
 * GROUP BY, HAVING, WHERE frente a HAVING y el grupo de los NULL, con encargos
 * de Inés, Diego, Marta, Nuria y Carmen. Cierra la parte de una sola tabla.
 */
export const m05Agrupar: Mission = {
  id: 'm05-agrupar',
  courseKey: 'sql-iniciacion',
  number: 5,
  title: 'Agrupar',
  subtitle: 'GROUP BY y HAVING: una cifra por grupo.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Lunes · semana 2',
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
  lessons: m05Lessons,
  mentor: 'ines',
  quiz: m05Quiz,
  verdicts: {
    good: {
      title: 'Informes por grupos',
      body: 'Diego tiene su panel, Marta sus cifras por tipo y sus oficinas, Nuria sus motivos y Carmen su control de titularidades. Y el informe de segmentos cuadra con los 40 clientes.',
    },
    ok: {
      title: 'Agrupas, pero se escapó algo',
      body: 'Ya usas GROUP BY, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Grupos sin hacer',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión: GROUP BY, HAVING y WHERE antes de agrupar.',
    },
  },

  briefing: {
    title: 'Semana 2 · Agrupar',
    paragraphs: [
      'Lunes de la segunda semana. El viernes dabas una cifra para toda la tabla; hoy el equipo quiere una cifra por grupo: por ciudad, por estado, por tipo, por motivo.',
      'Los encargos comparan filas, así que el orden da igual salvo que se pida. Las columnas, en el orden en que se piden.',
    ],
    goals: [
      'Agrupa con GROUP BY y combina con COUNT, SUM y AVG.',
      'Pon en el SELECT solo columnas agrupadas y agregados.',
      'Filtra filas con WHERE antes de agrupar y grupos con HAVING después.',
      'No escondas el grupo de los NULL.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m05Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_grupos',
      title: 'Chuleta: GROUP BY y HAVING',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'group_by' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Forma
\`\`\`
SELECT columna_del_grupo, AGREGADO(...)
FROM tabla
WHERE condición_sobre_filas
GROUP BY columna_del_grupo
HAVING condición_sobre_grupos
ORDER BY ...;
\`\`\`

## Reglas
- En el SELECT: columnas del GROUP BY y agregados. Nada más.
- WHERE filtra filas **antes**; HAVING filtra grupos **después** (y puede usar agregados).
- Los NULL forman su propio grupo.
- Varias columnas en el GROUP BY = un grupo por combinación.`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Una fila por grupo\nSELECT ciudad, COUNT(*) AS clientes\nFROM clientes\nGROUP BY ciudad;',
    retos: [
      {
        id: 'por_ciudad',
        from: 'ines',
        title: 'Clientes por ciudad',
        description: 'Cuántos clientes hay **en cada ciudad**. Columnas `ciudad` y `clientes`.',
        hint: '`SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad',
        columns: ['ciudad', 'clientes'],
      },
      {
        id: 'por_estado',
        from: 'diego',
        title: 'Transferencias por estado',
        description: 'Por cada estado: el `estado`, **cuántas** transferencias hay y el **importe total**. Tres columnas, en ese orden.',
        hint: '`SELECT estado, COUNT(*), SUM(importe) FROM transferencias GROUP BY estado`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT estado, COUNT(*), SUM(importe) FROM transferencias GROUP BY estado',
      },
      {
        id: 'por_tipo',
        from: 'marta',
        title: 'Cuentas por tipo',
        description: 'Por tipo de cuenta: el `tipo`, el **número de cuentas** y el **saldo medio** redondeado a 2 decimales.',
        hint: '`COUNT(*)` y `ROUND(AVG(saldo), 2)`, agrupando por `tipo`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT tipo, COUNT(*), ROUND(AVG(saldo), 2) FROM cuentas GROUP BY tipo',
      },
      {
        id: 'abiertas_motivo',
        from: 'nuria',
        title: 'Incidencias abiertas por motivo',
        description: 'Solo las incidencias **abiertas**, agrupadas **por motivo**: `motivo` y cuántas hay.',
        hint: 'Primero quédate con las filas abiertas (`WHERE cerrada_en IS NULL`) y después agrupa por `motivo`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT motivo, COUNT(*) FROM incidencias WHERE cerrada_en IS NULL GROUP BY motivo',
      },
      {
        id: 'ciudades_grandes',
        from: 'marta',
        title: 'Ciudades con más de 4 clientes',
        description: '`ciudad` y número de `clientes` de las ciudades con **más de 4 clientes**.',
        hint: 'Agrupa por ciudad y filtra los grupos con `HAVING COUNT(*) > 4`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta2' },
        solution: 'SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad HAVING COUNT(*) > 4',
      },
      {
        id: 'multicuenta',
        from: 'carmen',
        title: 'Clientes con más de una cuenta',
        description: '`cliente_id` y **cuántas cuentas** tiene, solo para los clientes con **más de una**.',
        hint: 'En la tabla `cuentas`: agrupa por `cliente_id` y usa `HAVING COUNT(*) > 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT cliente_id, COUNT(*) FROM cuentas GROUP BY cliente_id HAVING COUNT(*) > 1',
      },
    ],
  },

  bugs: [
    { id: 'C-PANEL', title: 'El panel de transferencias sale vacío', severity: 'medium', explanation: 'Diego no recibió las cifras por estado.', technique: 'GROUP BY con COUNT y SUM.', preventedBy: 'reto.por_estado' },
    { id: 'C-CAMPANA', title: 'La campaña de ahorro se diseña sin cifras por tipo', severity: 'medium', explanation: 'Marta no recibió el número de cuentas ni el saldo medio por tipo.', technique: 'GROUP BY con ROUND(AVG(…)).', preventedBy: 'reto.por_tipo' },
    { id: 'C-NURIA', title: 'Atención al cliente no sabe qué motivo atacar primero', severity: 'medium', explanation: 'Nuria no recibió las incidencias abiertas por motivo.', technique: 'WHERE antes de GROUP BY.', preventedBy: 'reto.abiertas_motivo' },
    { id: 'C-OFICINAS', title: 'Las oficinas se planifican sin saber dónde hay clientes', severity: 'high', explanation: 'Marta no recibió las ciudades con más de 4 clientes.', technique: 'HAVING sobre COUNT(*).', preventedBy: 'reto.ciudades_grandes' },
    { id: 'C-TITULARES', title: 'El control de titularidades se queda sin hacer', severity: 'medium', explanation: 'Carmen no recibió los clientes con varias cuentas.', technique: 'GROUP BY cliente_id HAVING COUNT(*) > 1.', preventedBy: 'reto.multicuenta' },
    { id: 'C-HAVING', title: 'Diego filtra grupos a mano en una hoja de cálculo', severity: 'low', explanation: 'Sin HAVING, los grupos se filtran fuera de la base de datos.', technique: 'HAVING para grupos, WHERE para filas.', preventedBy: 'practice.having' },
    { id: 'C-SEGMENTOS', title: 'El informe de segmentos suma 38 clientes en vez de 40', severity: 'high', explanation: 'El grupo de los NULL se escondió o se tomó por un fallo.', technique: 'Etiquetar el grupo NULL con COALESCE.', preventedBy: 'practice.nullgroup' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los informes del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.por_estado', label: 'Panel de Diego', explanation: 'Cifras por estado.' },
      { flag: 'reto.por_tipo', label: 'Cifras por tipo', explanation: 'Número y saldo medio.' },
      { flag: 'reto.abiertas_motivo', label: 'Motivos de Nuria', explanation: 'WHERE y luego GROUP BY.' },
      { flag: 'reto.ciudades_grandes', label: 'Nuevas oficinas', explanation: 'HAVING COUNT(*) > 4.' },
      { flag: 'reto.multicuenta', label: 'Titularidades', explanation: 'Clientes con varias cuentas.' },
      { flag: 'practice.having', label: 'HAVING en la consulta', explanation: 'Sin filtrar a mano.' },
      { flag: 'practice.nullgroup', label: 'Segmentos completos', explanation: 'El grupo NULL, etiquetado.' },
    ],
  },

  concepts: [
    { id: 'group_by', title: 'GROUP BY', summary: 'Junta las filas con el mismo valor y calcula los agregados de cada grupo.' },
    { id: 'group_select', title: 'Qué va en el SELECT', summary: 'Columnas del GROUP BY y agregados; nada más.' },
    { id: 'having', title: 'HAVING', summary: 'Filtra grupos después de agrupar; puede usar agregados.' },
    { id: 'where_vs_having', title: 'WHERE frente a HAVING', summary: 'WHERE filtra filas antes de agrupar; HAVING, grupos después.' },
    { id: 'group_null', title: 'El grupo de los NULL', summary: 'Los NULL forman su propio grupo: etiquétalo en vez de esconderlo.' },
  ],
  debriefConcepts: ['group_by', 'group_select', 'having', 'where_vs_having', 'group_null'],
  seniorTips: [
    'Lee la chuleta de GROUP BY en la wiki.',
    'Inés: SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad.',
    'Diego: SELECT estado, COUNT(*), SUM(importe) FROM transferencias GROUP BY estado.',
    'Marta: SELECT tipo, COUNT(*), ROUND(AVG(saldo), 2) FROM cuentas GROUP BY tipo.',
    'Nuria: … FROM incidencias WHERE cerrada_en IS NULL GROUP BY motivo.',
    'Marta: … GROUP BY ciudad HAVING COUNT(*) > 4.',
    'Carmen: SELECT cliente_id, COUNT(*) FROM cuentas GROUP BY cliente_id HAVING COUNT(*) > 1.',
    'Con Inés: HAVING para grupos; el grupo NULL se etiqueta, no se esconde.',
  ],
}
