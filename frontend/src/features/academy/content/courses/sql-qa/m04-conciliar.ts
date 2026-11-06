import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

const FEB = "p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'"

/**
 * Curso 8: SQL para QA · Misión 4 — Conciliar dos fuentes.
 *
 * Los pagos aceptados de febrero según Kobalto frente a la liquidación del
 * procesador de tarjetas: lo que falta, lo que sobra, importes distintos con
 * tolerancia, duplicados, lo que no debía liquidarse y los totales por día con
 * FULL OUTER JOIN. Trampas: totales que cuadran porque los errores se
 * compensan y un JOIN que esconde lo que solo está en un lado.
 */
export const m04Conciliar: Mission = {
  ...COMUN,
  id: 'm04-conciliar',
  number: 4,
  title: 'Conciliar dos fuentes',
  subtitle: 'Lo que falta, lo que sobra y lo que no coincide entre dos fuentes que deberían decir lo mismo.',
  dayLabel: 'Viernes · mes 4',
  verdicts: {
    good: {
      title: 'Las dos fuentes, fila a fila',
      body: 'Dos pagos sin liquidar, un pago que no existe, un importe con 10 € de más (y un céntimo que no era un error), un pago liquidado dos veces, uno devuelto que se cobró igual y los cinco días que no cuadran. Y el día 6, que cuadraba al céntimo, tenía dos errores.',
    },
    ok: {
      title: 'Conciliación a medias',
      body: 'Ya comparas dos fuentes, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'El cierre de mes no cuadra',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de conciliación a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Conciliar dos fuentes',
    paragraphs: [
      'Viernes, cierre de febrero. El procesador de tarjetas ha mandado su **liquidación** (`liquidaciones`): lo que dice que cobró por cada pago. Tiene que coincidir con los pagos **aceptados** de febrero en `pagos_tarjeta`.',
      'Hoy concilias las dos fuentes. Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Encuentra lo que está en una fuente y falta en la otra, en los dos sentidos.',
      'Compara importes con una tolerancia.',
      'Encuentra lo que está repetido en una fuente.',
      'Encuentra lo que no debería estar.',
      'Compara totales por día con FULL OUTER JOIN.',
      'Sabe por qué un total que cuadra no prueba nada.',
    ],
  },

  docs: [
    {
      id: 'chuleta_conciliar',
      title: 'Chuleta: conciliar dos fuentes',
      updatedLabel: 'Laura Méndez · QA',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'conciliar' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Las dos fuentes
| Kobalto | Procesador |
|---|---|
| \`pagos_tarjeta\` (aceptados, febrero de 2026) | \`liquidaciones(lote, pago_id, fecha_operacion, importe)\` |

## Qué buscar
| Diferencia | Cómo |
|---|---|
| Falta en la liquidación | \`NOT EXISTS\` desde los pagos |
| Sobra en la liquidación | \`NOT EXISTS\` desde la liquidación |
| Importe distinto | \`JOIN\` y \`abs(a - b) > tolerancia\` |
| Repetido | \`GROUP BY … HAVING COUNT(*) > 1\` |
| No debía estar | \`JOIN\` con el estado |
| Totales por día | agregar cada lado y \`FULL OUTER JOIN\` con \`COALESCE(…, 0)\` |

## Tolerancia acordada con el procesador
Diferencias de **hasta 1 céntimo** por pago son redondeos suyos y **no** cuentan.`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: "-- Lo que dice el procesador\nSELECT lote, pago_id, fecha_operacion, importe\nFROM liquidaciones\nORDER BY fecha_operacion, pago_id\nLIMIT 15;",
    retos: [
      {
        id: 'faltan',
        from: 'laura',
        title: 'Pagos sin liquidar',
        description: 'Los pagos **aceptados de febrero de 2026** que **no aparecen** en `liquidaciones`: una columna `id`.',
        hint: `\`WHERE ${FEB} AND NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id)\`.`,
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: `SELECT p.id FROM pagos_tarjeta p WHERE ${FEB} AND NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id)`,
        columns: ['id'],
      },
      {
        id: 'sobran',
        from: 'marta',
        title: 'Liquidaciones de pagos que no existen',
        description: 'Las filas de `liquidaciones` cuyo `pago_id` **no existe** en `pagos_tarjeta`: `pago_id` e `importe`.',
        hint: '`FROM liquidaciones l WHERE NOT EXISTS (SELECT 1 FROM pagos_tarjeta p WHERE p.id = l.pago_id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'SELECT l.pago_id, l.importe FROM liquidaciones l WHERE NOT EXISTS (SELECT 1 FROM pagos_tarjeta p WHERE p.id = l.pago_id)',
        columns: ['pago_id', 'importe'],
      },
      {
        id: 'importes_distintos',
        from: 'carmen',
        title: 'Importes que no coinciden',
        description: 'Los pagos liquidados con un importe que se diferencia del de Kobalto en **más de 1 céntimo** (la tolerancia acordada): `pago_id`, `importe_app` e `importe_liquidado`.',
        hint: '`JOIN liquidaciones l ON l.pago_id = p.id WHERE abs(l.importe - p.importe) > 0.01`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'SELECT p.id AS pago_id, p.importe AS importe_app, l.importe AS importe_liquidado FROM pagos_tarjeta p JOIN liquidaciones l ON l.pago_id = p.id WHERE abs(l.importe - p.importe) > 0.01',
        columns: ['pago_id', 'importe_app', 'importe_liquidado'],
      },
      {
        id: 'duplicados',
        from: 'nuria',
        title: 'Pagos liquidados más de una vez',
        description: 'Los `pago_id` que aparecen **más de una vez** en `liquidaciones`: `pago_id` y `veces`.',
        hint: '`GROUP BY pago_id HAVING COUNT(*) > 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: 'SELECT pago_id, COUNT(*) AS veces FROM liquidaciones GROUP BY pago_id HAVING COUNT(*) > 1',
        columns: ['pago_id', 'veces'],
      },
      {
        id: 'no_aceptados',
        from: 'diego',
        title: 'Liquidado, pero no aceptado',
        description: 'Los pagos que el procesador ha liquidado y que en Kobalto **no** están **aceptados**: `pago_id` y `estado`.',
        hint: "`FROM liquidaciones l JOIN pagos_tarjeta p ON p.id = l.pago_id WHERE p.estado <> 'aceptado'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: "SELECT l.pago_id, p.estado FROM liquidaciones l JOIN pagos_tarjeta p ON p.id = l.pago_id WHERE p.estado <> 'aceptado'",
        columns: ['pago_id', 'estado'],
      },
      {
        id: 'dias_descuadrados',
        from: 'ines',
        title: 'Los días que no cuadran',
        description: 'Por día: el total de los pagos **aceptados de febrero** según Kobalto (por la fecha del pago) y el total liquidado (por `fecha_operacion`). Solo los días en que **no coinciden**, también si un día solo existe en un lado: `fecha`, `total_app` y `total_liquidado` (0 si no hay nada).',
        hint: 'Agrega cada lado por fecha en un WITH y únelos con `FULL OUTER JOIN … ON l.fecha = a.fecha`, con `COALESCE(…, 0)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: `WITH app AS (SELECT p.pagado_en::date AS fecha, SUM(p.importe) AS total FROM pagos_tarjeta p WHERE ${FEB} GROUP BY 1), liq AS (SELECT fecha_operacion AS fecha, SUM(importe) AS total FROM liquidaciones GROUP BY 1) SELECT COALESCE(a.fecha, l.fecha) AS fecha, COALESCE(a.total, 0) AS total_app, COALESCE(l.total, 0) AS total_liquidado FROM app a FULL OUTER JOIN liq l ON l.fecha = a.fecha WHERE COALESCE(a.total, 0) <> COALESCE(l.total, 0)`,
        columns: ['fecha', 'total_app', 'total_liquidado'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Kobalto paga a un comercio por un pago que nunca existió', severity: 'high', explanation: 'La liquidación traía un pago_id que no está en Kobalto.', technique: 'NOT EXISTS desde la liquidación.', preventedBy: 'reto.sobran' },
    { id: 'C-CARMEN', title: 'Un comercio cobra 10 € de más en un pago', severity: 'medium', explanation: 'Nadie comparó los importes pago a pago.', technique: 'JOIN y diferencia con tolerancia.', preventedBy: 'reto.importes_distintos' },
    { id: 'C-NURIA', title: 'Un cliente ve el mismo pago cobrado dos veces en el extracto del banco', severity: 'high', explanation: 'El procesador liquidó el pago dos veces.', technique: 'GROUP BY … HAVING COUNT(*) > 1.', preventedBy: 'reto.duplicados' },
    { id: 'C-DIEGO', title: 'Se liquida al comercio un pago que ya se había devuelto al cliente', severity: 'high', explanation: 'El estado de Kobalto no se cruzó con la liquidación.', technique: 'JOIN con el estado del pago.', preventedBy: 'reto.no_aceptados' },
    { id: 'C-INES', title: 'El cierre de febrero se firma con cinco días descuadrados', severity: 'medium', explanation: 'Solo se miró el total del mes.', technique: 'Totales por día con FULL OUTER JOIN.', preventedBy: 'reto.dias_descuadrados' },
    { id: 'C-COMPENSA', title: 'El día 6 «cuadra» y tiene un pago sin liquidar y otro que no existe', severity: 'high', explanation: 'Dos errores del mismo importe se anularon en el total.', technique: 'Conciliar fila a fila; los totales solo como resumen.', preventedBy: 'practice.fila_a_fila' },
    { id: 'C-JOIN', title: 'La conciliación automática dice «todo correcto» y faltan pagos', severity: 'high', explanation: 'Un JOIN normal solo compara lo que está en los dos lados.', technique: 'FULL OUTER JOIN o EXCEPT en los dos sentidos.', preventedBy: 'practice.dos_lados' },
  ],

  prevention: {
    title: 'Al final de la semana',
    intro: 'Lo que pasó con el cierre de febrero.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.sobran', label: 'Pagos de Marta', explanation: 'Nada que no exista.' },
      { flag: 'reto.importes_distintos', label: 'Importes de Carmen', explanation: 'Con tolerancia de 1 céntimo.' },
      { flag: 'reto.duplicados', label: 'Clientes de Nuria', explanation: 'Una liquidación por pago.' },
      { flag: 'reto.no_aceptados', label: 'Devoluciones de Diego', explanation: 'Solo pagos aceptados.' },
      { flag: 'reto.dias_descuadrados', label: 'Cierre de Inés', explanation: 'Día a día.' },
      { flag: 'practice.fila_a_fila', label: 'Fila a fila', explanation: 'Los totales esconden.' },
      { flag: 'practice.dos_lados', label: 'Los dos lados', explanation: 'Lo que solo está en uno.' },
    ],
  },

  concepts: [
    { id: 'conciliar', title: 'Conciliar', summary: 'Comparar dos fuentes que deberían decir lo mismo y explicar cada diferencia.' },
    { id: 'faltan_sobran', title: 'Lo que falta y lo que sobra', summary: 'NOT EXISTS (o EXCEPT) en los dos sentidos: de A a B y de B a A.' },
    { id: 'tolerancia', title: 'Tolerancia', summary: 'abs(a − b) > margen: diferencias acordadas (redondeos) no son errores.' },
    { id: 'repetidos', title: 'Repetidos en una fuente', summary: 'GROUP BY clave HAVING COUNT(*) > 1 antes de comparar.' },
    { id: 'estado_cruce', title: 'Cruzar con el estado', summary: 'Que esté en las dos fuentes no basta: tiene que estar en el estado correcto.' },
    { id: 'full_join', title: 'FULL OUTER JOIN', summary: 'Une los dos lados y conserva lo que solo está en uno; COALESCE pone 0 a lo que falta.' },
    { id: 'compensacion', title: 'Errores que se compensan', summary: 'Un total igual puede esconder un pago de menos y otro de más del mismo importe.' },
  ],
  debriefConcepts: ['conciliar', 'faltan_sobran', 'tolerancia', 'repetidos', 'estado_cruce', 'full_join', 'compensacion'],
  seniorTips: [
    'Lee la chuleta de conciliar dos fuentes en la wiki.',
    'Laura: pagos aceptados de febrero con NOT EXISTS en liquidaciones.',
    'Marta: liquidaciones con NOT EXISTS en pagos_tarjeta.',
    'Carmen: JOIN y abs(l.importe − p.importe) > 0.01.',
    'Nuria: GROUP BY pago_id HAVING COUNT(*) > 1.',
    "Diego: JOIN con pagos_tarjeta y p.estado <> 'aceptado'.",
    'Inés: dos agregados por fecha, FULL OUTER JOIN y COALESCE(…, 0).',
    'Con Laura: fila a fila y en los dos sentidos.',
  ],

  lessons: [
    {
      id: 'conciliar',
      question: '¿Qué es conciliar?',
      conceptId: 'conciliar',
      cost: 5,
      body: `Comparar dos fuentes que deberían contar la misma historia (Kobalto y el procesador, la app y el informe, el origen y el destino de una carga) y **explicar cada diferencia**.

Las diferencias siempre son de alguno de estos tipos:

1. Está en A y **falta** en B.
2. Está en B y **sobra** (no está en A).
3. Está en los dos con **valores distintos**.
4. Está **repetido** en uno.
5. Está en los dos, pero **no debería** (estado incorrecto).`,
    },
    {
      id: 'faltan_sobran',
      question: '¿Por qué hay que mirar en los dos sentidos?',
      conceptId: 'faltan_sobran',
      cost: 5,
      body: `«Todos mis pagos están liquidados» no dice nada de lo que el procesador liquidó y no es tuyo.

\`\`\`
-- Faltan: en Kobalto y no en la liquidación
SELECT p.id FROM pagos_tarjeta p WHERE … AND NOT EXISTS (SELECT 1 FROM liquidaciones l WHERE l.pago_id = p.id);
-- Sobran: en la liquidación y no en Kobalto
SELECT l.pago_id FROM liquidaciones l WHERE NOT EXISTS (SELECT 1 FROM pagos_tarjeta p WHERE p.id = l.pago_id);
\`\`\`

Con \`EXCEPT\` también se puede: \`SELECT id FROM … EXCEPT SELECT pago_id FROM …\`, en los dos órdenes.`,
    },
    {
      id: 'tolerancia',
      question: '¿Por qué una tolerancia?',
      conceptId: 'tolerancia',
      cost: 5,
      body: `Porque algunas diferencias son **esperadas**: el procesador redondea a su manera y puede irse un céntimo. Si las cuentas como errores, la conciliación se llena de ruido y nadie la mira.

\`\`\`
WHERE abs(l.importe - p.importe) > 0.01
\`\`\`

La tolerancia no se inventa: se **acuerda** y se escribe. Y se mide en valor absoluto: un céntimo de más o de menos es lo mismo.`,
    },
    {
      id: 'repetidos',
      question: '¿Qué pasa si una fuente tiene repetidos?',
      conceptId: 'repetidos',
      cost: 5,
      body: `Que un JOIN los multiplica y una comparación por existencia no los ve (el pago «está»). Hay que buscarlos aparte:

\`\`\`
SELECT pago_id, COUNT(*) AS veces
FROM liquidaciones
GROUP BY pago_id
HAVING COUNT(*) > 1;
\`\`\`

Una liquidación repetida es dinero cobrado dos veces.`,
    },
    {
      id: 'estado_cruce',
      question: '¿Basta con que el pago esté en las dos fuentes?',
      conceptId: 'estado_cruce',
      cost: 5,
      body: `No. Tiene que estar en el **estado** correcto. Un pago **devuelto** al cliente no debería liquidarse al comercio:

\`\`\`
SELECT l.pago_id, p.estado
FROM liquidaciones l
JOIN pagos_tarjeta p ON p.id = l.pago_id
WHERE p.estado <> 'aceptado';
\`\`\`

Una conciliación que solo mira ids e importes no lo ve.`,
    },
    {
      id: 'full_join',
      question: '¿Cómo comparo totales cuando un día solo existe en un lado?',
      conceptId: 'full_join',
      cost: 5,
      body: `Agrega cada lado y únelos con **FULL OUTER JOIN**, que conserva las filas de los dos aunque no tengan pareja:

\`\`\`
WITH app AS (SELECT pagado_en::date AS fecha, SUM(importe) AS total FROM … GROUP BY 1),
     liq AS (SELECT fecha_operacion AS fecha, SUM(importe) AS total FROM liquidaciones GROUP BY 1)
SELECT COALESCE(a.fecha, l.fecha) AS fecha,
       COALESCE(a.total, 0) AS total_app,
       COALESCE(l.total, 0) AS total_liquidado
FROM app a FULL OUTER JOIN liq l ON l.fecha = a.fecha
WHERE COALESCE(a.total, 0) <> COALESCE(l.total, 0);
\`\`\`

Agregar **antes** de unir evita que las filas de un lado multipliquen las del otro.`,
    },
    {
      id: 'compensacion',
      question: 'Si el total cuadra, ¿está todo bien?',
      conceptId: 'compensacion',
      cost: 5,
      body: `No. Un pago sin liquidar de 54,78 € y una liquidación de 54,78 € de un pago que no existe dan **el mismo total**. Dos errores, cero diferencia.

Los totales sirven como **resumen** y para encontrar rápido dónde mirar. Pero la conciliación de verdad es **fila a fila**: faltan, sobran, distintos, repetidos.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q4pre_conc', conceptId: 'conciliar', question: '¿Qué es conciliar dos fuentes?', options: ['Copiar una en otra', 'Compararlas y explicar cada diferencia', 'Sumar las dos', 'Borrar los duplicados'], correct: 1, explanation: 'Faltan, sobran, distintos, repetidos…' },
      { id: 'q4pre_sentido', conceptId: 'faltan_sobran', question: 'Has comprobado que todos tus pagos están en la liquidación. ¿Qué te falta?', options: ['Nada', 'Comprobar que la liquidación no tiene pagos que no son tuyos', 'Ordenar', 'Contar'], correct: 1, explanation: 'Los dos sentidos.' },
      { id: 'q4pre_tol', conceptId: 'tolerancia', question: 'El procesador redondea y a veces se va un céntimo. ¿Cómo comparas?', options: ['l.importe <> p.importe', 'abs(l.importe - p.importe) > 0.01', 'ROUND(l.importe) = ROUND(p.importe)', 'No se compara'], correct: 1, explanation: 'Con la tolerancia acordada.' },
      { id: 'q4pre_rep', conceptId: 'repetidos', question: '¿Cómo encuentras pagos liquidados dos veces?', options: ['DISTINCT', 'GROUP BY pago_id HAVING COUNT(*) > 1', 'NOT EXISTS', 'ORDER BY'], correct: 1, explanation: 'Antes de compararlos con nada.' },
      { id: 'q4pre_full', conceptId: 'full_join', question: '¿Qué JOIN conserva las filas de los dos lados aunque no tengan pareja?', options: ['JOIN', 'LEFT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN'], correct: 2, explanation: 'Con COALESCE para los vacíos.' },
      { id: 'q4pre_comp', conceptId: 'compensacion', question: 'El total del mes coincide al céntimo. ¿Qué puedes concluir?', options: ['Que no hay diferencias', 'Que puede haber errores que se compensan', 'Que la liquidación es correcta', 'Que falta un día'], correct: 1, explanation: 'Hay que bajar a las filas.' },
    ],
    post: [
      { id: 'q4post_inner', conceptId: 'full_join', question: 'Comparas los totales por día con un JOIN normal. ¿Qué día se pierde?', options: ['Ninguno', 'Uno que solo tenga liquidaciones (o solo pagos)', 'El primero', 'El último'], correct: 1, explanation: 'El JOIN solo devuelve los días con pareja.' },
      { id: 'q4post_estado', conceptId: 'estado_cruce', question: 'Un pago devuelto aparece en la liquidación con su importe correcto. ¿Es un problema?', options: ['No', 'Sí: no debería liquidarse', 'Solo si el importe es distinto', 'Solo si está repetido'], correct: 1, explanation: 'Importa el estado.' },
      { id: 'q4post_except', conceptId: 'faltan_sobran', question: '¿Qué devuelve `SELECT pago_id FROM liquidaciones EXCEPT SELECT id FROM pagos_tarjeta`?', options: ['Los que faltan', 'Los liquidados que no existen en Kobalto', 'Los repetidos', 'Todos'], correct: 1, explanation: 'Lo que sobra en la liquidación.' },
      { id: 'q4post_tol', conceptId: 'tolerancia', question: '¿De dónde sale la tolerancia de una conciliación?', options: ['De lo que salga en la prueba', 'De un acuerdo escrito con la otra parte', 'Del tamaño de la tabla', 'Siempre es 0'], correct: 1, explanation: 'No se inventa.' },
      { id: 'q4post_comp', conceptId: 'compensacion', question: 'El día 6 cuadra. ¿Cómo encuentras que tiene un pago sin liquidar y otro que sobra?', options: ['Mirando el total', 'Conciliando fila a fila', 'No se puede', 'Con un índice'], correct: 1, explanation: 'Los totales esconden.' },
      { id: 'q4post_agg', conceptId: 'full_join', question: '¿Por qué agregar cada lado antes del FULL JOIN?', options: ['Por estética', 'Para que las filas de un lado no multipliquen las del otro', 'Porque FULL JOIN no admite SUM', 'Da igual'], correct: 1, explanation: 'Un día con 3 pagos y 3 liquidaciones daría 9 filas.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'Cierre de febrero',
      body: 'Buenos días, último día de la semana.\n\nEl procesador de tarjetas ha mandado la **liquidación de febrero** (`liquidaciones`): lo que dice que cobró por cada pago. Tiene que coincidir con nuestros pagos **aceptados** de febrero. Hoy toca **conciliar**.\n\nPrimero:\n\n- Los pagos aceptados de febrero de 2026 que **no** aparecen en la liquidación: una columna `id`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'conciliar' }, { kind: 'unlock', conceptId: 'faltan_sobran' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.faltan' },
      body: 'La 406 y la 418 sin liquidar. Ahora mira el otro sentido: ¿hay algo en la liquidación que no sea nuestro?',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_sobran',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Laura me pide que mire el otro lado: ¿hay filas de `liquidaciones` con un `pago_id` que **no existe** en nuestros pagos? `pago_id` e `importe`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.sobran' },
      body: 'Un pago 999 de 54,78 € que no existe. Se lo reclamo al procesador. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_importes',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Ahora los importes: pagos liquidados con un importe distinto del nuestro en **más de 1 céntimo** (es la tolerancia que tenemos firmada por sus redondeos). `pago_id`, `importe_app` e `importe_liquidado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'tolerancia' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.importes_distintos' },
      body: 'El 415: 28,95 € nuestros y 38,95 liquidados. El 410 se va un céntimo, pero eso entra en lo firmado. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_totales',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «el día 6 cuadra al céntimo»',
      body: '**Laura:** Rubén ha conciliado por totales diarios y dice que el **día 6** cuadra al céntimo, así que ese día «no hay que mirarlo». Pero la 406, que no está liquidada, es del día 6. ¿Cómo puede cuadrar?',
      onDeliver: [],
      choices: [
        {
          id: 'fila',
          text: 'Porque ese mismo día el procesador liquidó el pago **999**, que no existe, por **el mismo importe** (54,78 €). Un pago de menos y uno de más: los errores **se compensan** en el total. Los totales sirven para resumir, pero la conciliación tiene que ser fila a fila.',
          cost: 10,
          reply: 'Exacto. Un total que cuadra no prueba que no haya errores; solo que, si los hay, suman cero.',
          effects: [
            { kind: 'flag', key: 'practice.fila_a_fila' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Conciliar fila a fila: los totales esconden errores que se compensan.' },
          ],
        },
        {
          id: 'tarde',
          text: 'Porque la 406 se liquidará otro día.',
          cost: 10,
          reply: 'Podría ser… pero entonces no cuadraría el día 6, que es justo lo raro. Hay algo más ese día.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Explicaste una diferencia sin mirar las filas.' }],
        },
        {
          id: 'ok',
          text: 'Si el total cuadra, el día está bien: no hace falta mirarlo.',
          cost: 10,
          reply: 'Ese día tiene un pago sin liquidar y otro que no existe. Dos errores que suman cero.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Diste por bueno un día porque el total cuadraba.' }],
        },
      ],
    },
    {
      id: 'nuria_duplicados',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Un cliente dice que en el extracto de su banco le sale un pago dos veces. ¿Hay pagos **liquidados más de una vez**? `pago_id` y `veces`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'repetidos' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.duplicados' },
      body: 'El 420, dos veces. Es justo el del cliente. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_estados',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Si un pago se **devuelve** al cliente, el procesador no debería liquidarlo al comercio. ¿Hay pagos liquidados que en Kobalto **no** están aceptados? `pago_id` y `estado`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'estado_cruce' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.no_aceptados' },
      body: 'El 413, devuelto y liquidado. Lo pagamos dos veces: al cliente y al comercio. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_dias',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. Para el informe del cierre quiero los **días que no cuadran**: el total de los pagos aceptados de febrero por la fecha del pago y el total liquidado por `fecha_operacion`. Solo los días distintos, también si un día solo existe en un lado. `fecha`, `total_app` y `total_liquidado` (0 si no hay nada).',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'full_join' }, { kind: 'unlock', conceptId: 'compensacion' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.dias_descuadrados' },
      body: 'Cinco días, y cada uno con su explicación de esta mañana. El 6 no sale: ahí los dos errores se compensan. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_join',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «la conciliación automática dice que todo está bien»',
      body: '**Laura:** Rubén ha automatizado la conciliación:\n\n`SELECT … FROM pagos_tarjeta p JOIN liquidaciones l ON l.pago_id = p.id WHERE l.importe <> p.importe`\n\nSi devuelve cero filas, da el día por bueno. ¿Qué no ve?',
      onDeliver: [],
      choices: [
        {
          id: 'lados',
          text: 'Todo lo que solo está en **un lado**: el JOIN se queda con los pagos que están en las dos fuentes. Los dos sin liquidar y el 999 desaparecen sin avisar. Hay que mirar los dos sentidos (NOT EXISTS o EXCEPT) o un FULL OUTER JOIN. Y le falta la tolerancia: el 410 saldría como error.',
          cost: 10,
          reply: 'Eso es. La conciliación más peligrosa es la que dice «cero diferencias» porque no mira dónde están.',
          effects: [
            { kind: 'flag', key: 'practice.dos_lados' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Una conciliación mira los dos lados, no solo lo que coincide.' },
          ],
        },
        {
          id: 'left',
          text: 'Que cambie el JOIN por un LEFT JOIN desde pagos.',
          cost: 10,
          reply: 'Así vería los pagos sin liquidar, pero seguiría sin ver lo que sobra en la liquidación, como el 999.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Arreglaste un sentido y te olvidaste del otro.' }],
        },
        {
          id: 'ok',
          text: 'Nada: si no hay importes distintos, está conciliado.',
          cost: 10,
          reply: 'Faltan dos pagos y sobra uno, y su consulta no los ve. Cero filas no es lo mismo que cero diferencias.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Confiaste en una conciliación que solo mira lo que coincide.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre de la semana con Laura',
      body: '**Laura:** Semana cerrada: verificar, bordes, datos de prueba, aserciones y hoy conciliar. ¿Qué te llevas de hoy?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que conciliar es explicar cada diferencia: lo que falta y lo que sobra (en los dos sentidos), importes con una tolerancia acordada, repetidos, lo que está en un estado incorrecto, y totales por día con FULL OUTER JOIN. Y que un total que cuadra no prueba nada: hay que ir fila a fila.',
          reply: 'Muy bien. La semana que viene, una migración: lo mismo, pero con una tabla entera que cambia de forma.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'totales',
          text: 'Que basta con comparar los totales del mes.',
          reply: 'Hoy el día 6 cuadraba con dos errores dentro. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con conciliar por totales.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
