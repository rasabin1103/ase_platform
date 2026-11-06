import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

/**
 * Curso 8: SQL para QA · Misión 9 — Regresiones de rendimiento.
 *
 * El registro de consultas de dos versiones (1.8 y 1.9) en `log_consultas`,
 * los planes capturados y los índices que debería haber. Defectos: Q2 tarda
 * 12 veces más por llamada y Q5 un 60 % más, Q3 y Q8 se llaman decenas de
 * veces por petición (N+1), Q7 y Q8 son nuevas, faltan dos índices y tres
 * planes estiman muy mal. Trampas: comparar tiempo total en vez de tiempo por
 * llamada y medir con una base de datos de juguete.
 */
export const m09Rendimiento: Mission = {
  ...COMUN,
  id: 'm09-rendimiento',
  number: 9,
  title: 'Regresiones de rendimiento',
  subtitle: 'Dos versiones cara a cara: tiempo por llamada, llamadas por petición, índices y estimaciones.',
  dayLabel: 'Viernes · mes 4, semana 2',
  verdicts: {
    good: {
      title: 'La 1.9, medida',
      body: 'Encontraste las dos consultas que van más lentas por llamada, las dos que se llaman decenas de veces por petición, las dos nuevas, a dónde se va el tiempo, los dos índices que faltan y los planes que estiman mal. Y sin confundir «más tiempo total» con «más lenta».',
    },
    ok: {
      title: 'Rendimiento medido a medias',
      body: 'Ya comparas versiones con SQL, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'La 1.9 sale como está',
      body: 'Varios encargos se quedaron sin hacer y la versión nueva llega a producción más lenta. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Regresiones de rendimiento',
    paragraphs: [
      'Viernes. La versión 1.9 de la app sale el lunes. En el entorno de rendimiento se ha lanzado la misma prueba de carga con la **1.8** y con la **1.9**, y cada consulta ha quedado registrada en `log_consultas`. Hoy QA dice si la 1.9 va más lenta, y por qué.',
      'Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Compara el tiempo medio por llamada entre versiones.',
      'Normaliza por petición para encontrar consultas que se llaman de más (N+1).',
      'Encuentra las consultas nuevas de la versión.',
      'Calcula qué parte del tiempo total se lleva cada consulta.',
      'Comprueba en el catálogo que existen los índices esperados.',
      'Detecta planes que estiman mal las filas.',
    ],
  },

  docs: [
    {
      id: 'chuleta_rendimiento',
      title: 'Prueba de carga: qué hay y cómo leerlo',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'media' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas
- \`log_consultas(version, consulta_id, texto, llamadas, tiempo_total_ms, peticiones)\`: por versión y consulta, cuántas veces se ejecutó y cuánto tiempo sumó. \`peticiones\` es el número de peticiones HTTP de la prueba (no es igual en las dos versiones).
- \`planes_capturados(version, consulta_id, filas_estimadas, filas_reales)\`: lo que el planificador esperaba y lo que salió.
- \`indices_esperados(tabla, indice)\`: los índices que deberían existir.
- \`pg_indexes\`: los índices que **existen** (catálogo de PostgreSQL; \`schemaname = 'public'\`).

## Cómo leerlo
| Medida | Fórmula | Qué dice |
|---|---|---|
| Media por llamada | \`tiempo_total_ms / llamadas\` | si la **consulta** va más lenta |
| Llamadas por petición | \`llamadas / peticiones\` | si el **código** la llama de más |
| Peso | \`tiempo_total_ms / SUM(…)\` | a dónde se va el tiempo |

Ojo: \`llamadas / peticiones\` son enteros. Pásalo a numeric (\`llamadas::numeric\`) o la división trunca.

## Criterios de la 1.9
- Regresión: media por llamada **más de un 50 %** peor que en la 1.8.
- N+1: **más de 10** llamadas por petición.
- Estimación mala: real y estimado se diferencian **10 veces o más** (en cualquier sentido).`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Las dos versiones, consulta a consulta\nSELECT *\nFROM log_consultas\nORDER BY consulta_id, version;",
    retos: [
      {
        id: 'regresiones',
        from: 'laura',
        title: 'Consultas más lentas por llamada',
        description: 'Las consultas cuya **media por llamada** en la 1.9 es **más de un 50 %** mayor que en la 1.8: `consulta_id`, `media_18` y `media_19` (ms por llamada, redondeados a 2 decimales).',
        hint: "Une `log_consultas` consigo misma (`a.version = '1.8'`, `b.version = '1.9'`, misma `consulta_id`) y `WHERE b.tiempo_total_ms / b.llamadas > 1.5 * a.tiempo_total_ms / a.llamadas`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: "SELECT a.consulta_id, ROUND(a.tiempo_total_ms / a.llamadas, 2) AS media_18, ROUND(b.tiempo_total_ms / b.llamadas, 2) AS media_19 FROM log_consultas a JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9' WHERE a.version = '1.8' AND b.tiempo_total_ms / b.llamadas > 1.5 * a.tiempo_total_ms / a.llamadas",
        columns: ['consulta_id', 'media_18', 'media_19'],
      },
      {
        id: 'n_mas_1',
        from: 'marta',
        title: 'Consultas que se llaman de más',
        description: 'Las consultas que en la 1.9 se ejecutan **más de 10 veces por petición**: `consulta_id` y `llamadas_por_peticion` (redondeado a 1 decimal).',
        hint: "`ROUND(llamadas::numeric / peticiones, 1)` y `WHERE version = '1.9' AND llamadas::numeric / peticiones > 10`.",
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: "SELECT consulta_id, ROUND(llamadas::numeric / peticiones, 1) AS llamadas_por_peticion FROM log_consultas WHERE version = '1.9' AND llamadas::numeric / peticiones > 10",
        columns: ['consulta_id', 'llamadas_por_peticion'],
      },
      {
        id: 'nuevas',
        from: 'carmen',
        title: 'Consultas nuevas en la 1.9',
        description: 'Las consultas que aparecen en la **1.9** y **no** en la 1.8: `consulta_id` y `texto`.',
        hint: "`WHERE version = '1.9' AND NOT EXISTS (SELECT 1 FROM log_consultas v WHERE v.version = '1.8' AND v.consulta_id = n.consulta_id)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT consulta_id, texto FROM log_consultas n WHERE version = '1.9' AND NOT EXISTS (SELECT 1 FROM log_consultas v WHERE v.version = '1.8' AND v.consulta_id = n.consulta_id)",
        columns: ['consulta_id', 'texto'],
      },
      {
        id: 'peso',
        from: 'nuria',
        title: 'A dónde se va el tiempo',
        description: 'Las **3** consultas de la 1.9 que más **tiempo total** suman, de más a menos: `consulta_id`, `total_ms` y `porcentaje` (del tiempo total de **todas** las consultas de la 1.9, redondeado a 1 decimal).',
        hint: "`ROUND(100 * tiempo_total_ms / SUM(tiempo_total_ms) OVER (), 1)`, `ORDER BY tiempo_total_ms DESC LIMIT 3`. La ventana se calcula antes del LIMIT.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT consulta_id, tiempo_total_ms AS total_ms, ROUND(100 * tiempo_total_ms / SUM(tiempo_total_ms) OVER (), 1) AS porcentaje FROM log_consultas WHERE version = '1.9' ORDER BY tiempo_total_ms DESC LIMIT 3",
        columns: ['consulta_id', 'total_ms', 'porcentaje'],
        ordered: true,
      },
      {
        id: 'indices',
        from: 'diego',
        title: 'Índices que faltan',
        description: 'Los índices de `indices_esperados` que **no existen** en la base de datos: `tabla` e `indice`.',
        hint: "`FROM indices_esperados e WHERE NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname = 'public' AND i.tablename = e.tabla AND i.indexname = e.indice)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT e.tabla, e.indice FROM indices_esperados e WHERE NOT EXISTS (SELECT 1 FROM pg_indexes i WHERE i.schemaname = 'public' AND i.tablename = e.tabla AND i.indexname = e.indice)",
        columns: ['tabla', 'indice'],
      },
      {
        id: 'estimaciones',
        from: 'ines',
        title: 'Planes que estiman mal',
        description: 'Los planes de la **1.9** en los que filas estimadas y reales se diferencian **10 veces o más**, por arriba o por abajo: `consulta_id`, `filas_estimadas` y `filas_reales`.',
        hint: "`WHERE version = '1.9' AND GREATEST(filas_estimadas, filas_reales) >= 10 * LEAST(filas_estimadas, filas_reales)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: "SELECT consulta_id, filas_estimadas, filas_reales FROM planes_capturados WHERE version = '1.9' AND GREATEST(filas_estimadas, filas_reales) >= 10 * LEAST(filas_estimadas, filas_reales)",
        columns: ['consulta_id', 'filas_estimadas', 'filas_reales'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Abrir una tarjeta en la app hace 60 consultas', severity: 'high', explanation: 'Q3 se llama una vez por cada movimiento (N+1) y nadie miró las llamadas por petición.', technique: 'llamadas / peticiones entre versiones.', preventedBy: 'reto.n_mas_1' },
    { id: 'C-CARMEN', title: 'Una consulta nueva recorre todos los clientes de una ciudad', severity: 'medium', explanation: 'Q7 llegó con la 1.9 y nadie la había medido.', technique: 'Consultas de la versión nueva que no estaban en la anterior.', preventedBy: 'reto.nuevas' },
    { id: 'C-NURIA', title: 'Atención recibe quejas de lentitud y nadie sabe por dónde empezar', severity: 'medium', explanation: 'Nadie calculó que Q2 se lleva el 86 % del tiempo.', technique: 'Peso de cada consulta sobre el total.', preventedBy: 'reto.peso' },
    { id: 'C-DIEGO', title: 'El listado de movimientos tarda 24 ms por llamada', severity: 'high', explanation: 'Falta el índice de transferencias por cuenta de origen.', technique: 'Comparar los índices esperados con pg_indexes.', preventedBy: 'reto.indices' },
    { id: 'C-INES', title: 'El planificador elige mal en tres consultas de la 1.9', severity: 'medium', explanation: 'Estimaba 3 filas donde había 60, 1 donde había 400 y 250 donde había 20.', technique: 'Filas estimadas frente a reales, en los dos sentidos.', preventedBy: 'reto.estimaciones' },
    { id: 'C-TOTAL', title: 'Se optimiza una consulta que ya era rápida', severity: 'medium', explanation: 'Q3 sumaba 30 veces más tiempo, pero cada llamada tardaba lo mismo: el problema era el número de llamadas.', technique: 'Media por llamada y llamadas por petición, por separado.', preventedBy: 'practice.media' },
    { id: 'C-JUGUETE', title: 'La 1.9 pasa la prueba de rendimiento y en producción va lenta', severity: 'high', explanation: 'Se midió con 50 filas, donde todo cabe en memoria y cualquier plan es rápido.', technique: 'Medir con un volumen de datos como el de producción.', preventedBy: 'practice.volumen' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con la versión 1.9.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.n_mas_1', label: 'App de Marta', explanation: 'Sin N+1.' },
      { flag: 'reto.nuevas', label: 'Consultas de Carmen', explanation: 'Las nuevas, medidas.' },
      { flag: 'reto.peso', label: 'Quejas de Nuria', explanation: 'Sabemos a dónde va el tiempo.' },
      { flag: 'reto.indices', label: 'Índices de Diego', explanation: 'Los que faltan, creados.' },
      { flag: 'reto.estimaciones', label: 'Planes de Inés', explanation: 'Estimaciones revisadas.' },
      { flag: 'practice.media', label: 'Por llamada', explanation: 'No por total.' },
      { flag: 'practice.volumen', label: 'Volumen real', explanation: 'Nada de bases de juguete.' },
    ],
  },

  concepts: [
    { id: 'media', title: 'Media por llamada', summary: 'tiempo_total / llamadas: lo que tarda la consulta cada vez. Es lo que se compara entre versiones.' },
    { id: 'n_mas_1', title: 'N+1', summary: 'Una consulta que el código lanza una vez por cada elemento de una lista: se ve en llamadas por petición.' },
    { id: 'nuevas', title: 'Consultas nuevas', summary: 'Lo que la versión nueva ejecuta y la anterior no: no tiene con qué compararse y hay que medirlo.' },
    { id: 'peso', title: 'Peso sobre el total', summary: 'SUM(…) OVER (): qué porcentaje del tiempo se lleva cada consulta, para empezar por donde más se gana.' },
    { id: 'catalogo_indices', title: 'Índices en el catálogo', summary: 'pg_indexes dice qué índices existen; se compara con los que deberían existir.' },
    { id: 'estimaciones', title: 'Filas estimadas y reales', summary: 'Si el planificador se equivoca 10 veces o más, puede elegir un plan malo.' },
    { id: 'volumen', title: 'Volumen de datos', summary: 'El rendimiento se mide con datos del tamaño de producción: con pocas filas, todo es rápido.' },
  ],
  debriefConcepts: ['media', 'n_mas_1', 'nuevas', 'peso', 'catalogo_indices', 'estimaciones', 'volumen'],
  seniorTips: [
    'Lee cómo leer la prueba de carga en la wiki.',
    'Laura: log_consultas consigo misma por consulta_id y la media 1.9 > 1.5 × la media 1.8.',
    'Marta: llamadas::numeric / peticiones > 10 en la 1.9.',
    "Carmen: 1.9 NOT EXISTS en la 1.8.",
    'Nuria: SUM(tiempo_total_ms) OVER () para el porcentaje y LIMIT 3.',
    "Diego: indices_esperados NOT EXISTS en pg_indexes (schemaname = 'public').",
    'Inés: GREATEST y LEAST para comparar en los dos sentidos.',
    'Con Laura: media por llamada, no total; y volumen como el de producción.',
  ],

  lessons: [
    {
      id: 'media',
      question: '¿Cómo sé si una consulta va más lenta?',
      conceptId: 'media',
      cost: 5,
      body: `Comparando su **media por llamada** entre versiones, no su tiempo total:

\`\`\`
SELECT a.consulta_id,
       a.tiempo_total_ms / a.llamadas AS media_18,
       b.tiempo_total_ms / b.llamadas AS media_19
FROM log_consultas a
JOIN log_consultas b ON b.consulta_id = a.consulta_id AND b.version = '1.9'
WHERE a.version = '1.8';
\`\`\`

El tiempo total sube también si la consulta se llama más veces, o si la prueba hizo más peticiones. La media por llamada dice si **la consulta** empeoró.`,
    },
    {
      id: 'n_mas_1',
      question: '¿Qué es un N+1 y cómo lo veo?',
      conceptId: 'n_mas_1',
      cost: 5,
      body: `El código pide una lista (1 consulta) y luego, por cada elemento, otra consulta (N). Cada una es rápida; juntas, no.

Se ve en las **llamadas por petición**:

\`\`\`
SELECT consulta_id, version, ROUND(llamadas::numeric / peticiones, 1)
FROM log_consultas ORDER BY consulta_id, version;
\`\`\`

Q3 pasa de 2 a 60 por petición con la misma media por llamada: la consulta está bien, el código la llama de más. Se arregla en el código (un JOIN o un \`IN\`), no con un índice.`,
    },
    {
      id: 'nuevas',
      question: '¿Por qué miro las consultas nuevas aparte?',
      conceptId: 'nuevas',
      cost: 5,
      body: `Porque una comparación entre versiones con JOIN solo ve las consultas que están **en las dos**. Las nuevas no tienen contra qué compararse y se escapan:

\`\`\`
SELECT consulta_id, texto FROM log_consultas n
WHERE version = '1.9'
  AND NOT EXISTS (SELECT 1 FROM log_consultas v
                  WHERE v.version = '1.8' AND v.consulta_id = n.consulta_id);
\`\`\`

Cada consulta nueva se revisa: su plan, sus llamadas por petición, sus índices.`,
    },
    {
      id: 'peso',
      question: '¿Por dónde empiezo a mejorar?',
      conceptId: 'peso',
      cost: 5,
      body: `Por la consulta que más tiempo **total** se lleva. Con una ventana sobre toda la versión:

\`\`\`
SELECT consulta_id, tiempo_total_ms,
       ROUND(100 * tiempo_total_ms / SUM(tiempo_total_ms) OVER (), 1) AS porcentaje
FROM log_consultas WHERE version = '1.9'
ORDER BY tiempo_total_ms DESC LIMIT 3;
\`\`\`

La ventana se calcula antes del LIMIT, así que el porcentaje es sobre todas. Mejorar en un 50 % una consulta que pesa el 1 % no se nota; una que pesa el 86 %, sí.`,
    },
    {
      id: 'catalogo_indices',
      question: '¿Cómo compruebo que están los índices?',
      conceptId: 'catalogo_indices',
      cost: 5,
      body: `En el catálogo: \`pg_indexes\` tiene una fila por índice que **existe**.

\`\`\`
SELECT e.tabla, e.indice
FROM indices_esperados e
WHERE NOT EXISTS (SELECT 1 FROM pg_indexes i
                  WHERE i.schemaname = 'public'
                    AND i.tablename = e.tabla AND i.indexname = e.indice);
\`\`\`

Una migración que no creó un índice no da ningún error: solo hace la consulta más lenta. Esta prueba lo encuentra antes.`,
    },
    {
      id: 'estimaciones',
      question: '¿Qué me dicen las filas estimadas?',
      conceptId: 'estimaciones',
      cost: 5,
      body: `Lo que el planificador **creía** que iba a encontrar. Con eso elige el plan: un índice para pocas filas, un recorrido para muchas.

Si se equivoca 10 veces o más, el plan puede ser malo. En **los dos sentidos**:

\`\`\`
WHERE GREATEST(filas_estimadas, filas_reales) >= 10 * LEAST(filas_estimadas, filas_reales)
\`\`\`

Estimar 1 y encontrar 400 es tan malo como estimar 250 y encontrar 20. Suele arreglarse con estadísticas al día (\`ANALYZE\`).`,
    },
    {
      id: 'volumen',
      question: '¿Con qué datos se mide el rendimiento?',
      conceptId: 'volumen',
      cost: 5,
      body: `Con un **volumen como el de producción**. Con 50 filas todo cabe en memoria, cualquier plan tarda 1 ms y un índice que falta no se nota.

Los planes cambian con el tamaño de las tablas: lo que con poco es un recorrido rápido, con millones es un desastre. Una prueba de rendimiento con datos de juguete solo prueba que con datos de juguete va rápido.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q9pre_media', conceptId: 'media', question: 'Para saber si una consulta va más lenta en la versión nueva, ¿qué comparas?', options: ['El tiempo total', 'El tiempo medio por llamada', 'El número de llamadas', 'El texto'], correct: 1, explanation: 'El total depende también de cuántas veces se llama.' },
      { id: 'q9pre_n1', conceptId: 'n_mas_1', question: 'Una consulta pasa de 2 a 60 llamadas por petición con la misma media. ¿Qué es?', options: ['Una consulta lenta', 'Un N+1 en el código', 'Un índice que falta', 'Nada'], correct: 1, explanation: 'Se arregla en el código.' },
      { id: 'q9pre_div', conceptId: 'n_mas_1', question: '`90000 / 1500` con dos integer en PostgreSQL. ¿Y `5 / 2`?', options: ['60 y 2.5', '60 y 2', '60.0 y 2.5', 'Error'], correct: 1, explanation: 'Entre enteros, la división trunca.' },
      { id: 'q9pre_nuevas', conceptId: 'nuevas', question: 'Un JOIN entre las consultas de la 1.8 y la 1.9. ¿Qué consultas no salen?', options: ['Ninguna', 'Las nuevas de la 1.9', 'Las más lentas', 'Las de la 1.8'], correct: 1, explanation: 'No tienen pareja.' },
      { id: 'q9pre_idx', conceptId: 'catalogo_indices', question: '¿Dónde miras si existe un índice?', options: ['En log_consultas', 'En pg_indexes', 'En la app', 'En EXPLAIN'], correct: 1, explanation: 'El catálogo.' },
      { id: 'q9pre_vol', conceptId: 'volumen', question: 'Una prueba de rendimiento con 50 filas por tabla. ¿Qué detecta?', options: ['Todo', 'Casi nada: con pocas filas todo es rápido', 'Los N+1', 'Los índices que faltan'], correct: 1, explanation: 'Hacen falta datos como los de producción.' },
    ],
    post: [
      { id: 'q9post_total', conceptId: 'media', question: 'Q3 pasa de 300 a 9000 ms totales y su media sigue en 0,1 ms. ¿Qué haces?', options: ['Añadir un índice a Q3', 'Buscar por qué se llama 30 veces más', 'Nada', 'Reescribir Q3'], correct: 1, explanation: 'El problema es el número de llamadas.' },
      { id: 'q9post_over', conceptId: 'peso', question: '¿Qué calcula `SUM(tiempo_total_ms) OVER ()`?', options: ['Una suma por grupo', 'La suma de todas las filas, repetida en cada fila', 'Un error sin GROUP BY', 'Un acumulado'], correct: 1, explanation: 'Una ventana sin particiones.' },
      { id: 'q9post_limit', conceptId: 'peso', question: 'Con `… OVER () … LIMIT 3`, ¿sobre qué filas se calcula el porcentaje?', options: ['Sobre las 3', 'Sobre todas', 'Sobre la primera', 'Depende'], correct: 1, explanation: 'La ventana va antes del LIMIT.' },
      { id: 'q9post_est', conceptId: 'estimaciones', question: 'Estimadas 250, reales 20. ¿Es una mala estimación con el criterio de 10 veces?', options: ['No, sobran filas', 'Sí: se equivoca 12,5 veces', 'Solo si fuera al revés', 'No se puede saber'], correct: 1, explanation: 'Los dos sentidos cuentan.' },
      { id: 'q9post_nuevas', conceptId: 'nuevas', question: 'Q7 es nueva en la 1.9 y no tiene índice. ¿La detecta la comparación de medias entre versiones?', options: ['Sí', 'No: no está en la 1.8', 'Solo si es lenta', 'Solo con EXPLAIN'], correct: 1, explanation: 'Hay que buscar las nuevas aparte.' },
      { id: 'q9post_peticiones', conceptId: 'media', question: 'La prueba de la 1.9 hizo 1500 peticiones y la de la 1.8, 1400. ¿Comparas tiempos totales?', options: ['Sí', 'No: hay que normalizar (por llamada o por petición)', 'Solo si son parecidos', 'Da igual'], correct: 1, explanation: 'Más carga, más tiempo total.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'La 1.9 sale el lunes',
      body: 'Buenos días.\n\nÚltimo día de la semana y de mes: la 1.9 sale el lunes. Tenemos la prueba de carga de la 1.8 y la 1.9 en `log_consultas`; cómo leerla está en la wiki.\n\nLo primero:\n\n- Las consultas cuya **media por llamada** en la 1.9 es **más de un 50 %** mayor que en la 1.8: `consulta_id`, `media_18` y `media_19` (ms, 2 decimales).\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'media' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.regresiones' },
      body: 'Q2 pasa de 2 a 24 ms por llamada: doce veces más. Q5, de 20 a 32. Esas dos van más lentas de verdad.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_n1',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! En la 1.9 la ficha de tarjeta muestra los movimientos con más detalle. ¿Hay consultas que se ejecuten **más de 10 veces por petición**? `consulta_id` y `llamadas_por_peticion` (1 decimal).',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'n_mas_1' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.n_mas_1' },
      body: 'Q3, 60 por petición: una por cada movimiento de la ficha. Y Q8, 20,5: el nombre del comercio, uno a uno. Se lo paso a Diego. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_nuevas',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Para Riesgos, toda consulta nueva sobre clientes se revisa. ¿Qué consultas aparecen en la **1.9** y **no** en la 1.8? `consulta_id` y `texto`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'nuevas' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.nuevas' },
      body: 'Q7, clientes por ciudad con sus cuentas, y Q8, comercios. La Q7 la quiero revisar. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_total',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «Q3 es 30 veces más lenta»',
      body: '**Laura:** Rubén ha comparado el **tiempo total** de cada consulta entre versiones y dice que Q3 «es 30 veces más lenta» (de 300 a 9000 ms) y que hay que ponerle un índice. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'media',
          text: 'Que Q3 **no** es más lenta: tarda 0,1 ms por llamada en las dos versiones. Lo que ha cambiado es **cuántas veces se llama** (de 2 a 60 por petición): un N+1 en el código. Un índice no lo arregla. Hay que mirar la **media por llamada** y las **llamadas por petición** por separado, y el total solo para saber a dónde se va el tiempo.',
          cost: 10,
          reply: 'Exacto. El total mezcla dos problemas distintos con dos arreglos distintos.',
          effects: [
            { kind: 'flag', key: 'practice.media' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Media por llamada y llamadas por petición, por separado.' },
          ],
        },
        {
          id: 'indice',
          text: 'Que tiene razón: un índice en tarjetas lo arreglará.',
          cost: 10,
          reply: 'Q3 ya busca por clave primaria. Ese índice existe y la consulta es rápida: se llama 30 veces más.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste optimizar una consulta que ya era rápida.' }],
        },
        {
          id: 'carga',
          text: 'Que será la carga: la 1.9 tuvo más peticiones.',
          cost: 10,
          reply: 'Tuvo un 7 % más, no treinta veces más. Normaliza y lo verás.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Achacaste a la carga lo que era un N+1.' }],
        },
      ],
    },
    {
      id: 'nuria_peso',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Los clientes de la beta de la 1.9 dicen que «todo va lento». ¿Por dónde se va el tiempo? Las **3** consultas que más tiempo total suman en la 1.9: `consulta_id`, `total_ms` y `porcentaje` del total (1 decimal).',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'peso' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.peso' },
      body: 'Q2 se lleva el 86,5 % del tiempo: el listado de movimientos. Ya sé qué contestar. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_indices',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Lo de Q2 me suena a índice. Tenemos la lista de los que debería haber en `indices_esperados`. ¿Cuáles **no existen**? `tabla` e `indice`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'catalogo_indices' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.indices' },
      body: 'Faltan `transferencias_origen_idx` (Q2) y `cuentas_cliente_idx` (Q7). La migración de la 1.9 los borró y no los volvió a crear. Los añado. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_estimaciones',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. Tengo los planes capturados de la prueba. ¿En cuáles de la **1.9** se diferencian filas estimadas y reales **10 veces o más**, en cualquier sentido? `consulta_id`, `filas_estimadas` y `filas_reales`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'estimaciones' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.estimaciones' },
      body: 'Q2 estima de más, Q4 y Q7 de menos. Las estadísticas no se recalcularon después de la carga: un ANALYZE y lo vuelvo a capturar. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_volumen',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «en mi entorno va todo a 1 ms»',
      body: '**Laura:** Rubén dice que ha repetido la prueba en su entorno local, con la base de datos de pruebas de 50 filas por tabla, y que **todas** las consultas de la 1.9 tardan 1 ms. «No hay regresión.» ¿Qué le contestas?',
      onDeliver: [],
      choices: [
        {
          id: 'volumen',
          text: 'Que con 50 filas **todo** es rápido: todo cabe en memoria, cualquier plan sirve y un índice que falta no se nota. El rendimiento se mide con un **volumen como el de producción**, que es donde los planes cambian. Su prueba solo dice que con datos de juguete va rápido.',
          cost: 10,
          reply: 'Eso es. Una prueba de rendimiento tiene que poder fallar.',
          effects: [
            { kind: 'flag', key: 'practice.volumen' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Rendimiento medido con volumen de producción.' },
          ],
        },
        {
          id: 'local',
          text: 'Que perfecto: si en local va bien, irá bien.',
          cost: 10,
          reply: 'En local también iba bien la 1.8 sin el índice de Q2. Con 50 filas no se ve nada.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por buena una prueba de rendimiento con datos de juguete.' }],
        },
        {
          id: 'produccion',
          text: 'Que la probemos directamente en producción y veamos.',
          cost: 10,
          reply: 'Eso es que los clientes hagan la prueba por nosotros. Hace falta un entorno con volumen real, antes.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Propusiste medir el rendimiento con los clientes.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre de la semana con Laura',
      body: '**Laura:** Dos consultas más lentas, dos N+1, dos nuevas, dos índices que faltan y tres planes que estiman mal. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que entre versiones se compara la media por llamada (si la consulta empeora) y las llamadas por petición (si el código la llama de más), normalizando siempre; que las consultas nuevas se miran aparte; que el peso dice por dónde empezar; que los índices se comprueban en el catálogo y las estimaciones en los dos sentidos; y que todo eso se mide con volumen de producción.',
          reply: 'Muy bien. Con esto tienes el mes completo. El lunes, el examen práctico: diez encargos, uno de cada día.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'total',
          text: 'Que basta con comparar el tiempo total de la prueba entre versiones.',
          reply: 'El total subió, sí, pero no te dice por qué ni dónde. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con el tiempo total.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
