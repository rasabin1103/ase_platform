import type { Mission } from '../../../engine/types'
import { kobaltoDbSql } from '../../../sql/kobaltoDb'
import { kobaltoDataWorld } from '../../worlds/kobaltoData'
import { m02Lessons } from './m02-lessons'
import { m02Quiz } from './m02-quiz'
import { m02Scenes } from './m02-scenes'

/**
 * Curso 5: SQL desde cero · Misión 2 — Ordenar y buscar.
 * Guion legible: docs/academy/sql-iniciacion/missions/m02-ordenar.md
 *
 * ORDER BY (ASC/DESC, varias columnas, con LIMIT), LIKE/ILIKE y DISTINCT, con
 * encargos de Inés, Carmen, Nuria, Marta y Laura.
 */
export const m02Ordenar: Mission = {
  id: 'm02-ordenar',
  courseKey: 'sql-iniciacion',
  number: 2,
  title: 'Ordenar y buscar',
  subtitle: 'ORDER BY, LIKE e ILIKE, y DISTINCT para quitar repetidos.',
  world: kobaltoDataWorld({ marta: 'Product Owner · Pagos', diego: 'Backend developer · Transferencias', nuria: 'Atención al cliente', laura: 'QA Lead' }),
  playerRole: 'QA junior · Kobalto',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles · semana 1',
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
  lessons: m02Lessons,
  mentor: 'ines',
  quiz: m02Quiz,
  verdicts: {
    good: {
      title: 'Todo en su sitio',
      body: 'Carmen revisa las transferencias que importan, Nuria encontró al cliente, Laura tiene sus emails y Marta sus listas. Y de paso has destapado un saldo negativo y un email duplicado.',
    },
    ok: {
      title: 'Ordenas, pero no todo',
      body: 'Ya usas ORDER BY y LIKE, aunque algún encargo o alguna trampa se te escapó. Mira el debrief.',
    },
    bad: {
      title: 'Listas desordenadas',
      body: 'Varios encargos se quedaron sin hacer o en el orden equivocado. Repite la misión: ORDER BY, DESC, LIKE con % y DISTINCT.',
    },
  },

  briefing: {
    title: 'Semana 1 · Ordenar y buscar',
    paragraphs: [
      'Tercer día en Kobalto. El equipo ya no quiere solo filas: las quiere en orden («las 10 más altas», «de la A a la Z») y quiere buscar textos que no recuerda enteros.',
      'Cuando un encargo pide un orden, el orden cuenta: las mismas filas desordenadas no lo cumplen.',
    ],
    goals: [
      'Ordena con ORDER BY, ascendente y descendente.',
      'Saca «los N primeros» con ORDER BY y LIMIT.',
      'Ordena por varias columnas.',
      'Busca textos con LIKE e ILIKE.',
      'Quita repetidos con DISTINCT.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'app' }, { tool: 'wiki' }],

  scenes: m02Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'chuleta_orden',
      title: 'Chuleta: ordenar y buscar',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'order_by' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Orden de las partes
\`SELECT … FROM … WHERE … ORDER BY … LIMIT …;\`

## Ordenar
- \`ORDER BY saldo\` → de menor a mayor (ASC, por defecto).
- \`ORDER BY saldo DESC\` → de mayor a menor.
- \`ORDER BY ciudad, fecha_alta DESC\` → por ciudad y, si empata, por fecha descendente.
- Sin ORDER BY no hay orden garantizado.

## Buscar texto
- \`LIKE 'Ana%'\` empieza · \`'%ez'\` termina · \`'%serra%'\` contiene. \`_\` = un carácter.
- \`ILIKE\`: igual, sin distinguir mayúsculas.

## Sin repetidos
- \`SELECT DISTINCT ciudad FROM clientes;\` (DISTINCT mira la fila entera).`,
    },
  ],

  tickets: [],

  sqlLab: {
    setup: kobaltoDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Ordena con ORDER BY (ASC o DESC)\nSELECT iban, saldo\nFROM cuentas\nORDER BY saldo;',
    retos: [
      {
        id: 'saldos',
        from: 'ines',
        title: 'De menor a mayor saldo',
        description: 'El `iban` y el `saldo` de todas las cuentas, **de menor a mayor saldo**.',
        hint: '`ORDER BY saldo` al final. Ascendente es el orden por defecto.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT iban, saldo FROM cuentas ORDER BY saldo',
        ordered: true,
      },
      {
        id: 'top10',
        from: 'carmen',
        title: 'Las 10 transferencias más altas',
        description: '`id`, `importe`, `estado` y `creada_en` de las **10 transferencias de mayor importe**, de la más alta a la más baja.',
        hint: 'Ordena por importe de mayor a menor (`DESC`) y quédate con 10 filas (`LIMIT`).',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT id, importe, estado, creada_en FROM transferencias ORDER BY importe DESC LIMIT 10',
        ordered: true,
      },
      {
        id: 'serrano',
        from: 'nuria',
        title: 'Buscar a un Serrano',
        description: '`id`, `nombre`, `apellidos` y `email` de los clientes con **Serrano** en los apellidos, sea el primero o el segundo.',
        hint: "LIKE con `%` a los dos lados significa «contiene»: `apellidos LIKE '%Serrano%'`. Con ILIKE te olvidas de las mayúsculas.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos ILIKE '%serrano%'",
      },
      {
        id: 'ciudades',
        from: 'marta',
        title: 'Ciudades sin repetir',
        description: 'Las **ciudades** donde hay clientes, cada una **una sola vez** y en **orden alfabético**. Una sola columna.',
        hint: '`SELECT DISTINCT ciudad` quita los repetidos; después, `ORDER BY ciudad`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad',
        ordered: true,
      },
      {
        id: 'dominio',
        from: 'laura',
        title: 'Emails de correo.es',
        description: 'El `id` y el `email` de los clientes cuyo email **termina en `@correo.es`**.',
        hint: "`%` delante significa «cualquier cosa antes»: `email LIKE '%@correo.es'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT id, email FROM clientes WHERE email LIKE '%@correo.es'",
      },
      {
        id: 'por_ciudad',
        from: 'marta',
        title: 'Por ciudad y por alta',
        description: '`nombre`, `apellidos`, `ciudad` y `fecha_alta` de todos los clientes, ordenados por **ciudad (A→Z)** y, dentro de cada ciudad, **del alta más reciente a la más antigua**.',
        hint: 'Dos columnas en el ORDER BY, separadas por coma. Cada una con su orden: `ORDER BY ciudad, fecha_alta DESC`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta2' },
        solution: 'SELECT nombre, apellidos, ciudad, fecha_alta FROM clientes ORDER BY ciudad, fecha_alta DESC',
        ordered: true,
      },
    ],
  },

  bugs: [
    { id: 'C-CARMEN', title: 'Carmen revisa transferencias pequeñas y se le pasan las de 12.000 €', severity: 'high', explanation: 'Sin el top 10, el control de operaciones grandes no ve las cuatro más altas.', technique: 'ORDER BY … DESC LIMIT 10.', preventedBy: 'reto.top10' },
    { id: 'C-NURIA', title: 'Nuria no encuentra al cliente que la llama', severity: 'medium', explanation: 'Sin la búsqueda por apellido, Nuria no puede identificarlo.', technique: "LIKE '%Serrano%' o ILIKE.", preventedBy: 'reto.serrano' },
    { id: 'C-CIUDADES', title: 'La diapositiva de Marta repite ciudades', severity: 'low', explanation: 'La lista de ciudades llegó sin quitar repetidos.', technique: 'SELECT DISTINCT … ORDER BY.', preventedBy: 'reto.ciudades' },
    { id: 'C-LAURA', title: 'El arreglo de los correos se prueba sin los clientes afectados', severity: 'medium', explanation: 'Laura no recibió los emails de correo.es.', technique: "LIKE '%@correo.es'.", preventedBy: 'reto.dominio' },
    { id: 'C-ORDEN', title: 'El informe de oficinas sale desordenado', severity: 'medium', explanation: 'Sin el orden por ciudad y fecha, no se ve quién es nuevo en cada ciudad.', technique: 'ORDER BY con dos columnas.', preventedBy: 'reto.por_ciudad' },
    { id: 'C-LIKE', title: 'Una búsqueda «no encuentra» a clientes que sí existen', severity: 'high', explanation: 'LIKE sin % busca el texto exacto y distingue mayúsculas.', technique: 'Comodines % e ILIKE.', preventedBy: 'practice.like' },
    { id: 'C-DISTINCT', title: 'Un informe dice que hay 40 ciudades', severity: 'medium', explanation: 'DISTINCT con más columnas no quita la ciudad repetida.', technique: 'DISTINCT mira la fila entera.', preventedBy: 'practice.distinct' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con los encargos del miércoles.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.top10', label: 'Control de Carmen', explanation: 'Las 10 transferencias más altas.' },
      { flag: 'reto.serrano', label: 'Llamada de Nuria', explanation: 'Serrano como primer o segundo apellido.' },
      { flag: 'reto.ciudades', label: 'Diapositiva de Marta', explanation: 'Ciudades sin repetir.' },
      { flag: 'reto.dominio', label: 'Pruebas de Laura', explanation: 'Emails de correo.es.' },
      { flag: 'reto.por_ciudad', label: 'Informe de oficinas', explanation: 'Ciudad y fecha de alta.' },
      { flag: 'practice.like', label: 'Búsquedas que encuentran', explanation: '% e ILIKE.' },
      { flag: 'practice.distinct', label: 'DISTINCT bien usado', explanation: 'Solo las columnas que no se deben repetir.' },
    ],
  },

  concepts: [
    { id: 'order_by', title: 'ORDER BY', summary: 'Ordena el resultado; sin él no hay orden garantizado.' },
    { id: 'order_desc', title: 'DESC y los N primeros', summary: 'DESC invierte el orden; con LIMIT da «los N más altos».' },
    { id: 'order_multi', title: 'Ordenar por varias columnas', summary: 'La segunda columna desempata; cada una con su ASC o DESC.' },
    { id: 'like_patterns', title: 'LIKE y comodines', summary: '% es cualquier cosa y _ un carácter; sin % es una comparación exacta.' },
    { id: 'ilike_case', title: 'ILIKE y mayúsculas', summary: 'LIKE distingue mayúsculas; ILIKE no.' },
    { id: 'distinct', title: 'DISTINCT', summary: 'Quita filas repetidas, comparando todas las columnas del SELECT.' },
  ],
  debriefConcepts: ['order_by', 'order_desc', 'order_multi', 'like_patterns', 'ilike_case', 'distinct'],
  seniorTips: [
    'Lee la chuleta de ordenar y buscar en la wiki.',
    'Inés: SELECT iban, saldo FROM cuentas ORDER BY saldo.',
    'Carmen: SELECT id, importe, estado, creada_en FROM transferencias ORDER BY importe DESC LIMIT 10.',
    "Nuria: SELECT id, nombre, apellidos, email FROM clientes WHERE apellidos ILIKE '%serrano%'.",
    'Marta: SELECT DISTINCT ciudad FROM clientes ORDER BY ciudad.',
    "Laura: SELECT id, email FROM clientes WHERE email LIKE '%@correo.es'.",
    'Marta: … ORDER BY ciudad, fecha_alta DESC.',
    'Con Inés: LIKE necesita % y distingue mayúsculas; DISTINCT mira la fila entera.',
  ],
}
