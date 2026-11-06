import type { Mission } from '../../../engine/types'
import { kobaltoQaDbSql } from '../../../sql/kobaltoQaDb'
import { COMUN } from './shared'

const ORACULO = "SELECT c.id AS comercio_id, COUNT(p.id) AS pagos, COALESCE(SUM(p.importe), 0) AS total FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01' GROUP BY c.id"

/**
 * Curso 8: SQL para QA · Misión 6 — Probar un informe.
 *
 * La vista `informe_comercios_febrero` tiene cuatro errores (cuenta pagos
 * devueltos, corta el 28 a las 00:00, repite un comercio con dos categorías y
 * pierde los comercios sin pagos o sin categoría). El alumno escribe el
 * oráculo a partir de la especificación, compara y aísla cada causa. Trampas:
 * un oráculo copiado del propio informe y probar con pocos casos «normales».
 */
export const m06Informe: Mission = {
  ...COMUN,
  id: 'm06-informe',
  number: 6,
  title: 'Probar un informe',
  subtitle: 'Un oráculo independiente, las diferencias con el informe y la causa de cada una.',
  dayLabel: 'Martes · mes 4, semana 2',
  verdicts: {
    good: {
      title: 'El informe, desmontado',
      body: 'Escribiste el informe correcto desde la especificación, encontraste los seis comercios que no cuadran y la causa de cada diferencia: devoluciones contadas, cuatro pagos del día 28 fuera, un comercio duplicado por sus categorías y otro que ni aparece.',
    },
    ok: {
      title: 'Informe probado a medias',
      body: 'Ya pruebas informes, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'El informe sale como estaba',
      body: 'Varios encargos se quedaron sin hacer y el informe llegó a Dirección con sus errores. Repite la misión con la chuleta a mano.',
    },
  },

  briefing: {
    title: 'Mes 4 · Probar un informe',
    paragraphs: [
      'Martes. Diego ha hecho la vista `informe_comercios_febrero` para el comité del jueves: por comercio, cuántos pagos y cuánto se cobró en febrero. Antes de que llegue a Dirección, QA tiene que probarla.',
      'La especificación y el SQL de la vista están en la wiki. Cada encargo se cumple cuando la consulta devuelve exactamente las filas y columnas pedidas.',
    ],
    goals: [
      'Escribe el resultado correcto (el oráculo) desde la especificación, no desde el informe.',
      'Compara el informe con el oráculo y encuentra las diferencias.',
      'Aísla la causa de cada diferencia con una consulta.',
      'Prueba los estados, los días frontera y las filas que pueden faltar.',
      'Comprueba la cardinalidad de los JOIN del informe.',
      'Diseña casos de prueba que cubran cada tipo de error.',
    ],
  },

  docs: [
    {
      id: 'chuleta_informe',
      title: 'Informe de comercios: especificación y SQL',
      updatedLabel: 'Diego Ruiz · Backend',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'oraculo' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Especificación (de Producto)
Para **cada comercio** (todos, también los que no tienen pagos):
- \`pagos\`: número de pagos **aceptados** en **febrero de 2026** (del 1 al 28, todo el día).
- \`total\`: suma de su importe (0 si no hay).

## Lo que hay ahora
\`\`\`
CREATE VIEW informe_comercios_febrero AS
SELECT c.id AS comercio_id, c.nombre, COUNT(*) AS pagos, SUM(p.importe) AS total
FROM pagos_tarjeta p
JOIN comercios c ON c.id = p.comercio_id
JOIN comercio_categorias cc ON cc.comercio_id = c.id
WHERE p.estado <> 'rechazado'
  AND p.pagado_en BETWEEN '2026-02-01' AND '2026-02-28'
GROUP BY c.id, c.nombre;
\`\`\`

## Datos útiles
- Estados de \`pagos_tarjeta\`: aceptado, rechazado, devuelto.
- \`comercio_categorias(comercio_id, categoria)\`: una fila por categoría del comercio.`,
    },
  ],

  sqlLab: {
    setup: kobaltoQaDbSql(),
    readOnly: true,
    runCost: 2,
    starter: '-- Lo que dice el informe hoy\nSELECT *\nFROM informe_comercios_febrero\nORDER BY comercio_id;',
    retos: [
      {
        id: 'oraculo',
        from: 'laura',
        title: 'El informe correcto',
        description: 'Escribe tú el informe según la **especificación**, sin mirar la vista: para **cada comercio**, `comercio_id`, `pagos` (aceptados de febrero de 2026, el 28 entero) y `total` (0 si no hay).',
        hint: "`FROM comercios c LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id AND p.estado = 'aceptado' AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'`, `COUNT(p.id)` y `COALESCE(SUM(p.importe), 0)`.",
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: ORACULO,
        columns: ['comercio_id', 'pagos', 'total'],
      },
      {
        id: 'diferencias',
        from: 'marta',
        title: 'Los comercios que no cuadran',
        description: 'Los comercios en los que el informe **no coincide** con el correcto (en pagos o en total), **también** los que el informe no trae: `comercio_id`, `pagos_informe`, `pagos_correcto`, `total_informe` y `total_correcto`.',
        hint: 'El oráculo en un WITH, `LEFT JOIN informe_comercios_febrero i` y `WHERE i.pagos IS DISTINCT FROM ok.pagos OR i.total IS DISTINCT FROM ok.total`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: `WITH ok AS (${ORACULO}) SELECT ok.comercio_id, i.pagos AS pagos_informe, ok.pagos AS pagos_correcto, i.total AS total_informe, ok.total AS total_correcto FROM ok LEFT JOIN informe_comercios_febrero i ON i.comercio_id = ok.comercio_id WHERE i.pagos IS DISTINCT FROM ok.pagos OR i.total IS DISTINCT FROM ok.total`,
        columns: ['comercio_id', 'pagos_informe', 'pagos_correcto', 'total_informe', 'total_correcto'],
      },
      {
        id: 'contados_de_mas',
        from: 'carmen',
        title: 'Pagos que el informe cuenta y no debería',
        description: "Los pagos que entran en el filtro del informe (`estado <> 'rechazado'` y `BETWEEN '2026-02-01' AND '2026-02-28'`) pero **no** están **aceptados**: `id` y `estado`.",
        hint: "`WHERE estado NOT IN ('aceptado', 'rechazado') AND pagado_en BETWEEN '2026-02-01' AND '2026-02-28'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: "SELECT id, estado FROM pagos_tarjeta WHERE estado NOT IN ('aceptado', 'rechazado') AND pagado_en BETWEEN '2026-02-01' AND '2026-02-28'",
        columns: ['id', 'estado'],
      },
      {
        id: 'fuera_por_fecha',
        from: 'nuria',
        title: 'Pagos del 28 que se quedan fuera',
        description: 'Los pagos **aceptados de febrero** que el informe **deja fuera** por su filtro de fechas: `id` y `pagado_en`.',
        hint: "Los del 28 después de las 00:00: `pagado_en > '2026-02-28' AND pagado_en < '2026-03-01'`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "SELECT id, pagado_en FROM pagos_tarjeta WHERE estado = 'aceptado' AND pagado_en > '2026-02-28' AND pagado_en < '2026-03-01'",
        columns: ['id', 'pagado_en'],
      },
      {
        id: 'categorias_repetidas',
        from: 'diego',
        title: 'Comercios que el JOIN duplica',
        description: 'Los comercios con **más de una** fila en `comercio_categorias` (el JOIN del informe repite sus pagos): `comercio_id` y `categorias`.',
        hint: '`GROUP BY comercio_id HAVING COUNT(*) > 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'SELECT comercio_id, COUNT(*) AS categorias FROM comercio_categorias GROUP BY comercio_id HAVING COUNT(*) > 1',
        columns: ['comercio_id', 'categorias'],
      },
      {
        id: 'ausentes',
        from: 'ines',
        title: 'Comercios que no salen en el informe',
        description: 'Los comercios que **no aparecen** en el informe: `comercio_id` y `nombre`.',
        hint: '`FROM comercios c WHERE NOT EXISTS (SELECT 1 FROM informe_comercios_febrero i WHERE i.comercio_id = c.id)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'SELECT c.id AS comercio_id, c.nombre FROM comercios c WHERE NOT EXISTS (SELECT 1 FROM informe_comercios_febrero i WHERE i.comercio_id = c.id)',
        columns: ['comercio_id', 'nombre'],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'Dirección decide con un informe que no cuadra en seis comercios', severity: 'high', explanation: 'Nadie comparó el informe con un resultado independiente.', technique: 'Oráculo + IS DISTINCT FROM comercio a comercio.', preventedBy: 'reto.diferencias' },
    { id: 'C-CARMEN', title: 'Los comercios con devoluciones parecen vender más de lo que venden', severity: 'medium', explanation: "El filtro «<> 'rechazado'» deja pasar los devueltos.", technique: 'Probar cada estado, no solo el normal.', preventedBy: 'reto.contados_de_mas' },
    { id: 'C-NURIA', title: 'Cuatro pagos del último día no aparecen en el informe', severity: 'medium', explanation: 'BETWEEN con fechas corta el 28 a las 00:00.', technique: 'Casos en el último instante del periodo.', preventedBy: 'reto.fuera_por_fecha' },
    { id: 'C-DIEGO', title: 'Electrónica Voltio aparece con el doble de lo que vendió', severity: 'medium', explanation: 'Tiene dos categorías y el JOIN repite sus pagos.', technique: 'Comprobar la cardinalidad de cada JOIN.', preventedBy: 'reto.categorias_repetidas' },
    { id: 'C-INES', title: 'La floristería desaparece del informe del comité', severity: 'low', explanation: 'Sin pagos en febrero y sin categoría, el JOIN la deja fuera.', technique: 'Filas que tienen que salir aunque estén a cero.', preventedBy: 'reto.ausentes' },
    { id: 'C-COPIA', title: 'Las pruebas del informe pasan siempre, con sus errores dentro', severity: 'high', explanation: 'El resultado esperado se calculó con la misma consulta que el informe.', technique: 'Oráculo independiente, escrito desde la especificación.', preventedBy: 'practice.oraculo' },
    { id: 'C-CASOS', title: 'Un informe «probado» falla en cuanto cambian los datos', severity: 'medium', explanation: 'Se probó con tres comercios sin devoluciones, sin pagos el día 28 y con una categoría.', technique: 'Un caso de prueba por cada clase de dato que puede romperlo.', preventedBy: 'practice.casos' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con el informe de comercios.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.diferencias', label: 'Comité de Marta', explanation: 'Informe comparado con el oráculo.' },
      { flag: 'reto.contados_de_mas', label: 'Devoluciones de Carmen', explanation: 'Solo los aceptados.' },
      { flag: 'reto.fuera_por_fecha', label: 'Día 28 de Nuria', explanation: 'El último día entero.' },
      { flag: 'reto.categorias_repetidas', label: 'JOIN de Diego', explanation: 'Sin filas repetidas.' },
      { flag: 'reto.ausentes', label: 'Comercios de Inés', explanation: 'Todos, aunque sea a cero.' },
      { flag: 'practice.oraculo', label: 'Oráculo independiente', explanation: 'Desde la especificación.' },
      { flag: 'practice.casos', label: 'Casos que rompen', explanation: 'Una clase de dato, un caso.' },
    ],
  },

  concepts: [
    { id: 'oraculo', title: 'El oráculo', summary: 'El resultado correcto, calculado de forma independiente a partir de la especificación.' },
    { id: 'diferencias', title: 'Comparar informe y oráculo', summary: 'LEFT/FULL JOIN por la clave y IS DISTINCT FROM en cada columna; también las filas que faltan.' },
    { id: 'aislar_causa', title: 'Aislar la causa', summary: 'Para cada diferencia, una consulta que enseña las filas que la producen.' },
    { id: 'clases', title: 'Clases de datos', summary: 'Cada estado, cada tipo de fila: un caso de prueba por cada clase que el informe trata distinto.' },
    { id: 'frontera_informe', title: 'Fronteras del periodo', summary: 'El primer y el último instante del periodo son casos de prueba obligatorios.' },
    { id: 'cardinalidad', title: 'Cardinalidad de los JOIN', summary: 'Si una tabla unida tiene varias filas por clave, el informe repite y suma de más.' },
    { id: 'filas_cero', title: 'Filas a cero', summary: 'Un INNER JOIN pierde lo que no tiene pareja; lo que tiene que salir a cero necesita un LEFT JOIN.' },
  ],
  debriefConcepts: ['oraculo', 'diferencias', 'aislar_causa', 'clases', 'frontera_informe', 'cardinalidad', 'filas_cero'],
  seniorTips: [
    'Lee la especificación y el SQL del informe en la wiki.',
    "Laura: comercios LEFT JOIN pagos con las condiciones en el ON, COUNT(p.id) y COALESCE(SUM(p.importe), 0).",
    'Marta: el oráculo en un WITH, LEFT JOIN al informe e IS DISTINCT FROM en pagos y total.',
    "Carmen: estado NOT IN ('aceptado', 'rechazado') con el mismo BETWEEN del informe.",
    "Nuria: aceptados con pagado_en > '2026-02-28' AND < '2026-03-01'.",
    'Diego: comercio_categorias GROUP BY comercio_id HAVING COUNT(*) > 1.',
    'Inés: comercios NOT EXISTS en el informe.',
    'Con Laura: un oráculo que no copie el informe y casos que cubran cada tipo de dato.',
  ],

  lessons: [
    {
      id: 'oraculo',
      question: '¿Qué es un oráculo y de dónde sale?',
      conceptId: 'oraculo',
      cost: 5,
      body: `El **oráculo** es el resultado correcto contra el que comparas. En un informe, una consulta que escribes tú **desde la especificación**, no desde el SQL del informe:

\`\`\`
SELECT c.id AS comercio_id, COUNT(p.id) AS pagos, COALESCE(SUM(p.importe), 0) AS total
FROM comercios c
LEFT JOIN pagos_tarjeta p ON p.comercio_id = c.id
  AND p.estado = 'aceptado'
  AND p.pagado_en >= '2026-02-01' AND p.pagado_en < '2026-03-01'
GROUP BY c.id;
\`\`\`

Si lo copias del informe, copias sus errores y la prueba siempre pasa.`,
    },
    {
      id: 'diferencias',
      question: '¿Cómo comparo el informe con el oráculo?',
      conceptId: 'diferencias',
      cost: 5,
      body: `Por la clave, desde el oráculo (que tiene todas las filas) y con IS DISTINCT FROM:

\`\`\`
WITH ok AS (…oráculo…)
SELECT ok.comercio_id, i.pagos, ok.pagos, i.total, ok.total
FROM ok LEFT JOIN informe_comercios_febrero i ON i.comercio_id = ok.comercio_id
WHERE i.pagos IS DISTINCT FROM ok.pagos OR i.total IS DISTINCT FROM ok.total;
\`\`\`

Así salen también los comercios que el informe no trae (todo NULL en su lado). Si el informe pudiera traer filas de más, hace falta un FULL JOIN.`,
    },
    {
      id: 'aislar_causa',
      question: 'Ya sé qué comercios fallan. ¿Ahora qué?',
      conceptId: 'aislar_causa',
      cost: 5,
      body: `Ahora la **causa**. Lee el SQL del informe y, para cada condición sospechosa, escribe la consulta que enseña las filas afectadas:

- \`estado <> 'rechazado'\` → ¿qué pagos no rechazados tampoco están aceptados?
- \`BETWEEN … '2026-02-28'\` → ¿qué pagos del 28 quedan fuera?
- \`JOIN comercio_categorias\` → ¿qué comercios tienen varias filas?
- \`JOIN\` en general → ¿qué comercios no tienen pareja?

Un defecto con su causa y sus filas se arregla en una tarde. «El informe no cuadra», en una semana.`,
    },
    {
      id: 'clases',
      question: '¿Qué casos de prueba necesita un informe?',
      conceptId: 'clases',
      cost: 5,
      body: `Uno por cada **clase** de dato que el informe trata distinto:

| Clase | Caso |
|---|---|
| Cada estado | un aceptado, un rechazado, un devuelto |
| Periodo | el primer y el último instante, uno justo fuera |
| Relaciones | un comercio sin pagos, uno con una categoría, uno con dos, uno sin categoría |

Probar con «tres comercios normales» solo prueba la clase normal. Los errores viven en las otras.`,
    },
    {
      id: 'frontera_informe',
      question: '¿Qué fechas pruebo en un informe mensual?',
      conceptId: 'frontera_informe',
      cost: 5,
      body: `Las fronteras:

- El **primer instante** del mes (\`2026-02-01 00:00\`).
- El **último instante** (\`2026-02-28 23:59\`).
- Justo fuera, a cada lado (\`2026-01-31 23:59\` y \`2026-03-01 00:00\`).

Un \`BETWEEN '2026-02-01' AND '2026-02-28'\` pasa todos los casos menos el del día 28 por la tarde, que es justo el que falta en los datos de prueba «normales».`,
    },
    {
      id: 'cardinalidad',
      question: '¿Por qué un JOIN puede duplicar un comercio?',
      conceptId: 'cardinalidad',
      cost: 5,
      body: `El informe une los pagos con \`comercio_categorias\`. Si un comercio tiene **dos** categorías, cada pago sale **dos veces**: \`COUNT\` y \`SUM\` se duplican.

Antes de dar por bueno un JOIN, pregunta cuántas filas hay por clave en la tabla unida:

\`\`\`
SELECT comercio_id, COUNT(*) FROM comercio_categorias
GROUP BY comercio_id HAVING COUNT(*) > 1;
\`\`\`

Y si el informe no usa nada de esa tabla, el JOIN sobra.`,
    },
    {
      id: 'filas_cero',
      question: '¿Por qué desaparecen comercios del informe?',
      conceptId: 'filas_cero',
      cost: 5,
      body: `Porque el informe empieza en \`pagos_tarjeta\` y hace JOIN: un comercio **sin pagos** en febrero no tiene filas de las que salir. Y el JOIN con categorías elimina además a los que no tienen categoría.

Si la especificación dice «todos los comercios», el informe tiene que **empezar por comercios** y unir los pagos con LEFT JOIN, con las condiciones de los pagos en el \`ON\` (en el WHERE convertirían el LEFT JOIN en un JOIN normal).`,
    },
  ],

  quiz: {
    pre: [
      { id: 'q6pre_oraculo', conceptId: 'oraculo', question: '¿De dónde sacas el resultado esperado de un informe?', options: ['Del propio informe', 'De la especificación, con una consulta independiente', 'Del informe del mes anterior', 'De lo que diga Producto en la reunión'], correct: 1, explanation: 'Si copias el informe, copias sus errores.' },
      { id: 'q6pre_dif', conceptId: 'diferencias', question: 'Para comparar informe y oráculo por comercio, ¿qué comparación usas?', options: ['<>', 'IS DISTINCT FROM', '=', 'LIKE'], correct: 1, explanation: 'Un comercio ausente da NULL en el informe.' },
      { id: 'q6pre_clases', conceptId: 'clases', question: '¿Qué casos necesita un informe de pagos aceptados?', options: ['Solo pagos aceptados', 'Un pago de cada estado: aceptado, rechazado, devuelto', 'Muchos pagos aceptados', 'Ninguno'], correct: 1, explanation: 'Cada estado es una clase.' },
      { id: 'q6pre_card', conceptId: 'cardinalidad', question: 'Un comercio tiene dos categorías y el informe une con categorías. ¿Qué pasa con sus pagos?', options: ['Nada', 'Salen dos veces', 'Desaparecen', 'Se suman a otro comercio'], correct: 1, explanation: 'Y COUNT y SUM se duplican.' },
      { id: 'q6pre_cero', conceptId: 'filas_cero', question: 'El informe empieza en pagos con JOIN a comercios. ¿Qué comercios no salen?', options: ['Ninguno', 'Los que no tienen pagos en el periodo', 'Los que más venden', 'Los de Madrid'], correct: 1, explanation: 'Hay que empezar por comercios.' },
      { id: 'q6pre_front', conceptId: 'frontera_informe', question: '¿Qué caso de fecha es obligatorio en un informe de febrero?', options: ['El 15 de febrero', 'El 28 de febrero a última hora', 'El 1 de enero', 'Ninguno'], correct: 1, explanation: 'El último instante del periodo.' },
    ],
    post: [
      { id: 'q6post_on', conceptId: 'filas_cero', question: "En un LEFT JOIN de comercios a pagos, ¿dónde va `p.estado = 'aceptado'`?", options: ['En el WHERE', 'En el ON', 'En el GROUP BY', 'Da igual'], correct: 1, explanation: 'En el WHERE eliminaría los comercios sin pagos.' },
      { id: 'q6post_copia', conceptId: 'oraculo', question: 'La prueba de Rubén compara el informe con la misma consulta del informe. ¿Qué encuentra?', options: ['Todos los errores', 'Ninguno: siempre coinciden', 'Solo los de fechas', 'Solo los de estados'], correct: 1, explanation: 'Oráculo independiente.' },
      { id: 'q6post_estado', conceptId: 'aislar_causa', question: "`WHERE estado <> 'rechazado'` en un informe de pagos aceptados. ¿Qué deja pasar?", options: ['Nada', 'Los devueltos', 'Los rechazados', 'Los de otro mes'], correct: 1, explanation: 'Mejor decir lo que sí: estado = aceptado.' },
      { id: 'q6post_count', conceptId: 'filas_cero', question: '¿Por qué `COUNT(p.id)` y no `COUNT(*)` en el oráculo?', options: ['Es más rápido', 'Para que un comercio sin pagos cuente 0 y no 1', 'Da igual', 'COUNT(*) no existe'], correct: 1, explanation: 'Con LEFT JOIN, el comercio sin pagos tiene una fila con p.id NULL.' },
      { id: 'q6post_casos', conceptId: 'clases', question: 'El informe se probó con tres comercios que solo tienen pagos aceptados a mitad de mes. ¿Qué no se ha probado?', options: ['Nada', 'Devoluciones, el último día, comercios sin pagos o con varias categorías', 'El total', 'Los nombres'], correct: 1, explanation: 'Solo la clase normal.' },
      { id: 'q6post_card', conceptId: 'cardinalidad', question: '¿Cómo detectas que un JOIN del informe puede duplicar filas?', options: ['Mirando el total', 'Contando filas por clave en la tabla unida', 'Con EXPLAIN', 'No se puede'], correct: 1, explanation: 'GROUP BY clave HAVING COUNT(*) > 1.' },
    ],
  },

  scenes: [
    {
      id: 'mail_laura',
      channel: 'email',
      from: 'laura',
      at: 0,
      subject: 'El informe del comité',
      body: 'Buenos días.\n\nEl jueves Dirección decide con el informe de comercios de febrero que ha hecho Diego (`informe_comercios_febrero`). Antes, lo probamos nosotros. La especificación y el SQL de la vista están en la wiki.\n\nLo primero es tener contra qué comparar:\n\n- Escribe **tú** el informe según la especificación, **sin copiar la vista**: para cada comercio, `comercio_id`, `pagos` y `total`.\n\nLaura',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }, { kind: 'unlock', conceptId: 'oraculo' }, { kind: 'unlock', conceptId: 'filas_cero' }],
    },
    {
      id: 'laura_ok',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.oraculo' },
      body: 'Veintidós comercios, la floristería a cero incluida. Ese es el oráculo. Ahora, a compararlo con la vista.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_diferencias',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Necesito saber qué comercios **no cuadran** entre el informe de Diego y el correcto, también los que el informe ni trae: `comercio_id`, `pagos_informe`, `pagos_correcto`, `total_informe` y `total_correcto`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }, { kind: 'unlock', conceptId: 'diferencias' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.diferencias' },
      body: 'Seis comercios de veintidós. Si esto llega al comité, decidimos mal. ¿Sabéis por qué falla cada uno?',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_devueltos',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: "Hola. El informe filtra con `estado <> 'rechazado'`. Me huele mal: ¿qué pagos entran por ese filtro (y el de fechas del informe) y **no** están aceptados? `id` y `estado`.",
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'aislar_causa' }, { kind: 'unlock', conceptId: 'clases' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.contados_de_mas' },
      body: 'Tres devoluciones contadas como ventas: la 403, la 413 y la 423. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'laura_copia',
      channel: 'meeting',
      from: 'laura',
      at: 120,
      subject: '11:00 · Laura: «la prueba automática del informe pasa»',
      body: '**Laura:** Rubén ya tenía una prueba automática para este informe: calcula el resultado esperado con… el mismo SQL de la vista, «para no equivocarse al escribirlo». Y pasa siempre. ¿Qué le dices?',
      onDeliver: [],
      choices: [
        {
          id: 'independiente',
          text: 'Que un oráculo copiado del informe tiene **los mismos errores** que el informe, así que siempre coinciden: la prueba no puede fallar nunca. El esperado se escribe **desde la especificación**, de forma independiente, aunque cueste más.',
          cost: 10,
          reply: 'Exacto. Una prueba que no puede fallar no prueba nada.',
          effects: [
            { kind: 'flag', key: 'practice.oraculo' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'El oráculo se escribe desde la especificación, no desde el código.' },
          ],
        },
        {
          id: 'ok',
          text: 'Que está bien: así la prueba nunca da falsas alarmas.',
          cost: 10,
          reply: 'Tampoco da alarmas de verdad. Hoy el informe tiene cuatro errores y su prueba está en verde.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Aceptaste un oráculo que copia el código.' }],
        },
        {
          id: 'manual',
          text: 'Que mejor lo revise a ojo cada mes.',
          cost: 10,
          reply: 'A ojo no se ve un 28 por la tarde ni una categoría repetida. Hace falta un oráculo, pero independiente.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Cambiaste una mala prueba automática por una revisión a ojo.' }],
        },
      ],
    },
    {
      id: 'nuria_fecha',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Varios comercios se han quejado de que sus ventas del último día no salen. ¿Qué pagos **aceptados de febrero** deja fuera el filtro de fechas del informe? `id` y `pagado_en`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'frontera_informe' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.fuera_por_fecha' },
      body: 'Cuatro pagos del día 28, de cuatro comercios. Ya les puedo contestar. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_categorias',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. Electrónica Voltio sale con más pagos de los que tuvo, y sospecho de mi JOIN con `comercio_categorias`. ¿Qué comercios tienen **más de una** categoría? `comercio_id` y `categorias`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'cardinalidad' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.categorias_repetidas' },
      body: 'El 14, con dos. Y el JOIN ni siquiera usa la categoría para nada: lo quito. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'ines_ausentes',
      channel: 'chat',
      from: 'ines',
      at: 270,
      body: 'Hola. La especificación dice **todos** los comercios, aunque estén a cero. ¿Cuáles **no aparecen** en el informe? `comercio_id` y `nombre`.',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }],
    },
    {
      id: 'ines_thanks',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.ausentes' },
      body: 'La floristería: sin pagos en febrero y, además, sin categoría. El informe la pierde por las dos cosas. Gracias.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_casos',
      channel: 'meeting',
      from: 'laura',
      at: 360,
      subject: '15:00 · Laura: «lo probé con tres comercios»',
      body: '**Laura:** Diego dice que, antes de entregarlo, probó el informe a mano con tres comercios (el 1, el 8 y el 12) y cuadraban. Y es verdad, cuadran. ¿Por qué no vio nada?',
      onDeliver: [],
      choices: [
        {
          id: 'casos',
          text: 'Porque los tres son de la **clase normal**: solo pagos aceptados, ninguno el día 28 por la tarde, una sola categoría y con pagos. Cada error del informe vive en otra clase (devueltos, último día, varias categorías, sin pagos o sin categoría). Hace falta un caso de prueba por cada clase que el informe trata distinto.',
          cost: 10,
          reply: 'Eso es. Tres casos de la misma clase son un caso repetido tres veces.',
          effects: [
            { kind: 'flag', key: 'practice.casos' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Un caso de prueba por cada clase de dato.' },
          ],
        },
        {
          id: 'mas',
          text: 'Porque tres son pocos: que pruebe con diez al azar.',
          cost: 10,
          reply: 'Diez al azar pueden seguir siendo todos normales. No es cuántos, es cuáles.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Confiaste en la cantidad en vez de en elegir los casos.' }],
        },
        {
          id: 'mala_suerte',
          text: 'Mala suerte: le tocaron justo los que estaban bien.',
          cost: 10,
          reply: 'No es suerte: los casos normales casi siempre están bien. Por eso hay que elegir los que no lo son.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Achacaste a la suerte un mal diseño de casos.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'laura',
      at: 480,
      subject: '17:00 · Cierre del día con Laura',
      body: '**Laura:** Un informe, seis comercios mal, cuatro causas. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que un informe se prueba contra un oráculo independiente, escrito desde la especificación; que se compara fila a fila con IS DISTINCT FROM, también las que faltan; que cada diferencia tiene una causa que se aísla con una consulta; y que los casos de prueba se eligen por clases: cada estado, las fronteras del periodo, los JOIN que multiplican y las filas a cero.',
          reply: 'Muy bien. Mañana, cosas que cambian de estado: órdenes con su historial.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'total',
          text: 'Que basta con comprobar que el total del informe coincide con el de la base de datos.',
          reply: 'El total no coincidía… y aunque coincidiera, podría esconder errores que se compensan. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con comprobar solo el total.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
