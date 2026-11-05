import type { Mission } from '../../../engine/types'
import { kobaltoAvanzadaDbSql } from '../../../sql/kobaltoAvanzadaDb'
import { COMUN, exige } from './shared'

const RECURSIVA = exige(/\bwith\s+recursive\b/i, 'Este encargo se resuelve con una consulta recursiva: `WITH RECURSIVE …`.')

/**
 * Curso 7: SQL avanzado · Misión 0 — Quién depende de quién (demo abierta).
 * Plan: docs/academy/sql-avanzado/PLAN.md
 *
 * Consultas recursivas: bajar por una jerarquía con niveles, subir por la
 * cadena de mando, construir rutas, contar todo lo que cuelga de cada nodo y
 * detectar ciclos. Trampas: la recursiva sin fin (un ciclo en los datos) y la
 * unión al revés (subir en vez de bajar).
 */
export const m00Jerarquias: Mission = {
  ...COMUN,
  id: 'm00-jerarquias',
  number: 0,
  title: 'Quién depende de quién',
  subtitle: 'WITH RECURSIVE: jerarquías, cadenas de mando, rutas y ciclos.',
  dayLabel: 'Lunes · mes 3',
  verdicts: {
    good: {
      title: 'Árboles recorridos de punta a punta',
      body: 'Marta tiene su árbol de invitaciones, Carmen su cadena de aprobación, Nuria el organigrama con rutas, Diego los equipos completos y Laura el ciclo de la importación localizado. Y ninguna consulta se quedó dando vueltas.',
    },
    ok: {
      title: 'Recursivas, a medias',
      body: 'Ya recorres jerarquías, aunque algún encargo o alguna trampa se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'Jerarquías a mano, nivel a nivel',
      body: 'Varios encargos se quedaron sin hacer. Repite la misión con la chuleta de consultas recursivas a mano.',
    },
  },

  briefing: {
    title: 'Mes 3 · Quién depende de quién',
    paragraphs: [
      'Empieza tu tercer mes en Kobalto. Ya no basta con JOIN y ventanas: hoy los datos tienen forma de árbol. Empleados con su jefe, clientes que invitan a otros clientes.',
      'Un JOIN baja un nivel; para bajar todos los que haya, una consulta recursiva. Cada encargo se cumple cuando tu consulta, con `WITH RECURSIVE`, devuelve exactamente lo que se pide.',
    ],
    goals: [
      'Escribe una consulta recursiva: parte inicial, UNION ALL y parte recursiva.',
      'Baja por una jerarquía calculando el nivel de cada fila.',
      'Sube por la cadena de mando hasta la raíz.',
      'Construye la ruta completa de cada nodo.',
      'Cuenta todo lo que cuelga de cada nodo, no solo los directos.',
      'Protege la recursiva contra los ciclos.',
    ],
  },

  docs: [
    {
      id: 'chuleta_recursivas',
      title: 'Chuleta: consultas recursivas',
      updatedLabel: 'Inés Moreno · Datos',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'recursive_cte' }, { kind: 'flag', key: 'doc.read' }, { kind: 'score', key: 'rigor', add: 1 }],
      body: `## Tablas nuevas
- \`empleados\`: id, nombre, puesto, departamento, \`jefe_id\` (→ empleados.id; vacío en la CEO), salario, alta.
- \`invitaciones\`: \`cliente_id\` (el invitado), \`invitado_por\` (quien le invitó), invitado_en.

## Forma
\`\`\`
WITH RECURSIVE arbol AS (
  SELECT …                       -- 1. parte inicial: el punto de partida
  UNION ALL
  SELECT …                       -- 2. parte recursiva: une la tabla con «arbol»
  FROM empleados e JOIN arbol a ON e.jefe_id = a.id
)
SELECT … FROM arbol;
\`\`\`
PostgreSQL repite la parte 2 con las filas nuevas de la vuelta anterior hasta que no sale ninguna.

## Bajar o subir
| Quiero | Unión |
|---|---|
| Los que dependen de X (bajar) | \`e.jefe_id = a.id\` |
| Los jefes de X (subir) | \`e.id = a.jefe_id\` |

## Columnas que se arrastran
- Nivel: \`1\` en la inicial, \`a.nivel + 1\` en la recursiva.
- Ruta: \`nombre\` en la inicial, \`a.ruta || ' > ' || e.nombre\` en la recursiva.

## Ciclos
Si los datos tienen un ciclo, la recursiva no termina. Guarda los nodos visitados (\`ARRAY[id]\`, \`ruta || id\`, \`NOT id = ANY(ruta)\`) o usa \`CYCLE columna SET es_ciclo USING ruta\`.`,
    },
  ],

  sqlLab: {
    setup: kobaltoAvanzadaDbSql(),
    readOnly: true,
    runCost: 2,
    starter:
      '-- Los que dependen de Raúl (id 6), a cualquier nivel\nWITH RECURSIVE equipo AS (\n  SELECT id, nombre, 1 AS nivel\n  FROM empleados\n  WHERE jefe_id = 6\n  UNION ALL\n  SELECT e.id, e.nombre, q.nivel + 1\n  FROM empleados e\n  JOIN equipo q ON e.jefe_id = q.id\n)\nSELECT * FROM equipo;',
    retos: [
      {
        id: 'organigrama',
        from: 'ines',
        title: 'Todo el equipo de Raúl',
        description: '`id`, `nombre` y `nivel` de **todos** los empleados que dependen de Raúl Ortega (id 6), directa o indirectamente. `nivel` = 1 para los que le reportan directamente.',
        hint: 'Parte inicial: los de `jefe_id = 6` con `1 AS nivel`. Parte recursiva: `empleados e JOIN equipo q ON e.jefe_id = q.id` con `q.nivel + 1`.',
        visibleWhen: { kind: 'flag', key: 'encargo.ines' },
        solution: 'WITH RECURSIVE equipo AS (SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 6 UNION ALL SELECT e.id, e.nombre, q.nivel + 1 FROM empleados e JOIN equipo q ON e.jefe_id = q.id) SELECT id, nombre, nivel FROM equipo',
        columns: ['id', 'nombre', 'nivel'],
        requires: [RECURSIVA],
      },
      {
        id: 'arbol_invitaciones',
        from: 'marta',
        title: 'El árbol de invitaciones del cliente 1',
        description: '`cliente_id` y `generacion` de todos los clientes que llegaron **gracias al cliente 1**, directa o indirectamente (`generacion` = 1 para los que invitó él).',
        hint: 'Parte inicial: `invitaciones WHERE invitado_por = 1`. Parte recursiva: los invitados por alguien del árbol, `i.invitado_por = a.cliente_id`.',
        visibleWhen: { kind: 'flag', key: 'encargo.marta' },
        solution: 'WITH RECURSIVE arbol AS (SELECT cliente_id, 1 AS generacion FROM invitaciones WHERE invitado_por = 1 UNION ALL SELECT i.cliente_id, a.generacion + 1 FROM invitaciones i JOIN arbol a ON i.invitado_por = a.cliente_id) SELECT cliente_id, generacion FROM arbol',
        columns: ['cliente_id', 'generacion'],
        requires: [RECURSIVA],
      },
      {
        id: 'cadena_aprobacion',
        from: 'carmen',
        title: 'La cadena de aprobación de Víctor',
        description: '`nivel`, `id`, `nombre` y `puesto` de Víctor Peña (id 28) y de **todos sus jefes** hasta la CEO, **ordenados por `nivel`** (0 = Víctor, 1 = su jefe directo…).',
        hint: 'Esta vez se sube: parte inicial `WHERE id = 28` con `0 AS nivel`; parte recursiva `JOIN cadena c ON e.id = c.jefe_id` (arrastra `jefe_id`). Al final, `ORDER BY nivel`.',
        visibleWhen: { kind: 'flag', key: 'encargo.carmen' },
        solution: 'WITH RECURSIVE cadena AS (SELECT id, nombre, puesto, jefe_id, 0 AS nivel FROM empleados WHERE id = 28 UNION ALL SELECT e.id, e.nombre, e.puesto, e.jefe_id, c.nivel + 1 FROM empleados e JOIN cadena c ON e.id = c.jefe_id) SELECT nivel, id, nombre, puesto FROM cadena ORDER BY nivel',
        columns: ['nivel', 'id', 'nombre', 'puesto'],
        ordered: true,
        requires: [RECURSIVA],
      },
      {
        id: 'rutas',
        from: 'nuria',
        title: 'El organigrama con rutas',
        description: '`id` y `ruta` de **cada** empleado, con la ruta desde la CEO separada por ` > ` (por ejemplo, `Beatriz Sáez > Lucía Herrero > Nuria Vidal`).',
        hint: "Parte inicial: la CEO (`jefe_id IS NULL`) con `nombre AS ruta`. Parte recursiva: `r.ruta || ' > ' || e.nombre`, uniendo `e.jefe_id = r.id`.",
        visibleWhen: { kind: 'flag', key: 'encargo.nuria' },
        solution: "WITH RECURSIVE rutas AS (SELECT id, nombre AS ruta FROM empleados WHERE jefe_id IS NULL UNION ALL SELECT e.id, r.ruta || ' > ' || e.nombre FROM empleados e JOIN rutas r ON e.jefe_id = r.id) SELECT id, ruta FROM rutas",
        columns: ['id', 'ruta'],
        requires: [RECURSIVA],
      },
      {
        id: 'equipo_total',
        from: 'diego',
        title: 'Cuánta gente tiene cada jefe',
        description: '`id`, `nombre` y `equipo_total` de cada empleado que tiene a alguien por debajo: el número de personas que dependen de él **a cualquier nivel**.',
        hint: 'Una recursiva de parejas (jefe, persona): la inicial con cada `jefe_id` e `id`; la recursiva baja un nivel manteniendo el mismo jefe. Después, `GROUP BY` del jefe y `COUNT(*)`.',
        visibleWhen: { kind: 'flag', key: 'encargo.diego' },
        solution: 'WITH RECURSIVE bajo AS (SELECT jefe_id AS jefe, id AS persona FROM empleados WHERE jefe_id IS NOT NULL UNION ALL SELECT b.jefe, e.id FROM empleados e JOIN bajo b ON e.jefe_id = b.persona) SELECT e.id, e.nombre, COUNT(*) AS equipo_total FROM bajo b JOIN empleados e ON e.id = b.jefe GROUP BY e.id, e.nombre',
        columns: ['id', 'nombre', 'equipo_total'],
        requires: [RECURSIVA],
      },
      {
        id: 'ciclos',
        from: 'laura',
        title: 'Clientes atrapados en un ciclo',
        description: 'Una columna `cliente_id` con los clientes que, siguiendo quién les invitó, **vuelven a sí mismos** (un ciclo en `invitaciones`). La consulta tiene que terminar: protégela contra los ciclos.',
        hint: 'Arrastra la ruta: `ARRAY[cliente_id]` en la inicial y `ruta || i.cliente_id` en la recursiva, marca `i.cliente_id = ANY(ruta)` como ciclo y no sigas cuando ya lo es. O usa `CYCLE invitado_por SET es_ciclo USING ruta`.',
        visibleWhen: { kind: 'flag', key: 'encargo.laura' },
        solution: 'WITH RECURSIVE r AS (SELECT cliente_id AS origen, invitado_por AS actual, ARRAY[cliente_id] AS ruta, false AS ciclo FROM invitaciones UNION ALL SELECT r.origen, i.invitado_por, r.ruta || i.cliente_id, i.cliente_id = ANY(r.ruta) FROM r JOIN invitaciones i ON i.cliente_id = r.actual WHERE NOT r.ciclo) SELECT DISTINCT origen AS cliente_id FROM r WHERE ciclo',
        columns: ['cliente_id'],
        requires: [RECURSIVA],
      },
    ],
  },

  bugs: [
    { id: 'C-MARTA', title: 'El premio a los mejores embajadores se queda corto', severity: 'medium', explanation: 'Marta solo contó los invitados directos del cliente 1, no toda su descendencia.', technique: 'Recursiva hacia abajo con generación.', preventedBy: 'reto.arbol_invitaciones' },
    { id: 'C-CARMEN', title: 'Un gasto se aprueba sin pasar por toda la cadena', severity: 'high', explanation: 'Sin la cadena completa, la aprobación se quedó en el jefe directo.', technique: 'Recursiva hacia arriba hasta la raíz.', preventedBy: 'reto.cadena_aprobacion' },
    { id: 'C-NURIA', title: 'El organigrama de la intranet sale plano', severity: 'low', explanation: 'Nuria no tuvo la ruta de cada persona.', technique: 'Arrastrar una ruta de texto en la recursiva.', preventedBy: 'reto.rutas' },
    { id: 'C-DIEGO', title: 'Los permisos de jefe solo ven a sus directos', severity: 'medium', explanation: 'Diego contó los equipos con un JOIN de un nivel.', technique: 'Parejas (jefe, persona) a cualquier nivel.', preventedBy: 'reto.equipo_total' },
    { id: 'C-LAURA', title: 'El cálculo de comisiones de referidos se cuelga cada noche', severity: 'high', explanation: 'Nadie localizó el ciclo 36 ↔ 39 de la importación.', technique: 'Ruta de visitados o CYCLE.', preventedBy: 'reto.ciclos' },
    { id: 'C-CICLO', title: 'Un informe recursivo tumba la consola de datos', severity: 'high', explanation: 'Una recursiva sin protección entró en el ciclo y no terminó.', technique: 'Ruta de visitados, CYCLE o límite de profundidad.', preventedBy: 'practice.cycle_guard' },
    { id: 'C-DIRECCION', title: 'Un informe de equipo muestra a los jefes en vez de a los subordinados', severity: 'medium', explanation: 'La unión de la parte recursiva estaba al revés.', technique: 'Bajar: e.jefe_id = a.id; subir: e.id = a.jefe_id.', preventedBy: 'practice.direction' },
  ],

  prevention: {
    title: 'Al final del día',
    intro: 'Lo que pasó con los encargos del lunes.',
    preventedLabel: 'Problemas que no ocurrieron',
    appearedLabel: 'Problemas que llegaron',
    rules: [
      { flag: 'reto.arbol_invitaciones', label: 'Embajadores de Marta', explanation: 'Todo el árbol del cliente 1.' },
      { flag: 'reto.cadena_aprobacion', label: 'Aprobación de Carmen', explanation: 'La cadena completa hasta la CEO.' },
      { flag: 'reto.rutas', label: 'Organigrama de Nuria', explanation: 'Una ruta por persona.' },
      { flag: 'reto.equipo_total', label: 'Permisos de Diego', explanation: 'Equipos a cualquier nivel.' },
      { flag: 'reto.ciclos', label: 'Importación de Laura', explanation: 'El ciclo 36 ↔ 39, localizado.' },
      { flag: 'practice.cycle_guard', label: 'Recursivas que terminan', explanation: 'Protección contra ciclos.' },
      { flag: 'practice.direction', label: 'Recursivas en la dirección buena', explanation: 'Bajar o subir, a propósito.' },
    ],
  },

  concepts: [
    { id: 'recursive_cte', title: 'WITH RECURSIVE', summary: 'Parte inicial UNION ALL parte recursiva: se repite con las filas nuevas hasta que no sale ninguna.' },
    { id: 'recursive_levels', title: 'Niveles', summary: 'Una columna que empieza en 1 (o 0) y suma 1 en cada vuelta: la profundidad de cada fila.' },
    { id: 'recursive_up', title: 'Subir por la jerarquía', summary: 'Unir e.id = a.jefe_id lleva de cada nodo a su padre, hasta la raíz.' },
    { id: 'recursive_path', title: 'Rutas', summary: 'Arrastrar un texto o un array que crece en cada vuelta: la ruta desde la raíz.' },
    { id: 'recursive_aggregate', title: 'Contar todo lo que cuelga', summary: 'Parejas (jefe, persona) a cualquier nivel y después GROUP BY.' },
    { id: 'recursive_cycles', title: 'Ciclos', summary: 'Con un ciclo la recursiva no termina: ruta de visitados, CYCLE o límite de profundidad.' },
    { id: 'recursive_direction', title: 'La dirección de la unión', summary: 'Bajar: e.jefe_id = a.id. Subir: e.id = a.jefe_id. Al revés, sale otro árbol.' },
  ],
  debriefConcepts: ['recursive_cte', 'recursive_levels', 'recursive_up', 'recursive_path', 'recursive_aggregate', 'recursive_cycles', 'recursive_direction'],
  seniorTips: [
    'Lee la chuleta de consultas recursivas en la wiki.',
    'Inés: inicial jefe_id = 6 con 1 AS nivel; recursiva empleados e JOIN equipo q ON e.jefe_id = q.id con q.nivel + 1.',
    'Marta: inicial invitaciones WHERE invitado_por = 1; recursiva i.invitado_por = a.cliente_id con a.generacion + 1.',
    'Carmen: inicial WHERE id = 28 con 0 AS nivel, arrastrando jefe_id; recursiva e.id = c.jefe_id; ORDER BY nivel.',
    "Nuria: inicial la CEO con nombre AS ruta; recursiva r.ruta || ' > ' || e.nombre.",
    'Diego: parejas (jefe_id, id) y la recursiva baja manteniendo el jefe; GROUP BY jefe y COUNT(*).',
    'Laura: ARRAY[cliente_id] AS ruta, ruta || i.cliente_id, i.cliente_id = ANY(ruta) como ciclo y WHERE NOT ciclo.',
    'Con Inés: protege la recursiva contra los ciclos, y comprueba hacia dónde va la unión.',
  ],

  lessons: [
    {
      id: 'basic',
      question: '¿Qué es una consulta recursiva?',
      conceptId: 'recursive_cte',
      cost: 5,
      body: `Un \`WITH\` que se usa a sí mismo. Tiene dos partes unidas por \`UNION ALL\`:

\`\`\`
WITH RECURSIVE equipo AS (
  SELECT id, nombre FROM empleados WHERE jefe_id = 6     -- inicial
  UNION ALL
  SELECT e.id, e.nombre
  FROM empleados e JOIN equipo q ON e.jefe_id = q.id      -- recursiva
)
SELECT * FROM equipo;
\`\`\`

PostgreSQL ejecuta la inicial, después la recursiva con esas filas, después otra vez con las filas nuevas… hasta que una vuelta no devuelve nada. Un JOIN normal baja **un** nivel; la recursiva baja **todos** los que haya.`,
    },
    {
      id: 'levels',
      question: '¿Cómo sé a qué nivel está cada fila?',
      conceptId: 'recursive_levels',
      cost: 5,
      body: `Arrastra una columna que crece en cada vuelta:

\`\`\`
SELECT id, nombre, 1 AS nivel FROM empleados WHERE jefe_id = 6
UNION ALL
SELECT e.id, e.nombre, q.nivel + 1
FROM empleados e JOIN equipo q ON e.jefe_id = q.id
\`\`\`

Las columnas de las dos partes tienen que coincidir en número y tipo, como en cualquier UNION. Si una parte da \`integer\` y la otra \`bigint\`, o una \`varchar\` y la otra \`text\`, convierte la inicial (\`::text\`).`,
    },
    {
      id: 'up',
      question: '¿Y para subir hasta el jefe máximo?',
      conceptId: 'recursive_up',
      cost: 5,
      body: `Se da la vuelta a la unión: de cada fila, al empleado cuyo \`id\` es su \`jefe_id\`.

\`\`\`
WITH RECURSIVE cadena AS (
  SELECT id, nombre, jefe_id, 0 AS nivel FROM empleados WHERE id = 28
  UNION ALL
  SELECT e.id, e.nombre, e.jefe_id, c.nivel + 1
  FROM empleados e JOIN cadena c ON e.id = c.jefe_id
)
SELECT nivel, id, nombre FROM cadena ORDER BY nivel;
\`\`\`

Para unir con el jefe hay que **arrastrar** \`jefe_id\` en las dos partes. Termina sola en la CEO, que no tiene jefe.`,
    },
    {
      id: 'path',
      question: '¿Cómo construyo la ruta completa?',
      conceptId: 'recursive_path',
      cost: 5,
      body: `Igual que el nivel, pero con texto:

\`\`\`
SELECT id, nombre AS ruta FROM empleados WHERE jefe_id IS NULL
UNION ALL
SELECT e.id, r.ruta || ' > ' || e.nombre
FROM empleados e JOIN rutas r ON e.jefe_id = r.id
\`\`\`

Con un array (\`ARRAY[id]\` y \`r.ruta || e.id\`) la ruta sirve además para saber por dónde has pasado: es la base para detectar ciclos.`,
    },
    {
      id: 'aggregate',
      question: '¿Cómo cuento todos los que dependen de cada jefe?',
      conceptId: 'recursive_aggregate',
      cost: 5,
      body: `Genera todas las parejas (jefe, persona) a cualquier nivel y después agrupa:

\`\`\`
WITH RECURSIVE bajo AS (
  SELECT jefe_id AS jefe, id AS persona FROM empleados WHERE jefe_id IS NOT NULL
  UNION ALL
  SELECT b.jefe, e.id FROM empleados e JOIN bajo b ON e.jefe_id = b.persona
)
SELECT jefe, COUNT(*) AS equipo_total FROM bajo GROUP BY jefe;
\`\`\`

La recursiva baja desde cada persona, pero **mantiene el jefe** de la pareja inicial.`,
    },
    {
      id: 'cycles',
      question: '¿Qué pasa si hay un ciclo?',
      conceptId: 'recursive_cycles',
      cost: 5,
      body: `Si A apunta a B y B a A, cada vuelta encuentra filas nuevas y la recursiva **no termina**. Tres defensas:

- **Ruta de visitados**: arrastra \`ARRAY[id]\`, marca \`id = ANY(ruta)\` como ciclo y no sigas por ahí (\`WHERE NOT ciclo\`).
- **CYCLE** (PostgreSQL 14+): \`… ) CYCLE columna SET es_ciclo USING ruta\` hace lo mismo solo.
- **Límite de profundidad**: \`WHERE nivel < 20\` en la parte recursiva, como red de seguridad.

En la consola, una recursiva sin fin se corta sola en un par de segundos con un aviso.`,
    },
    {
      id: 'direction',
      question: '¿Cómo sé si estoy bajando o subiendo?',
      conceptId: 'recursive_direction',
      cost: 5,
      body: `Mira qué columna de la tabla une con qué columna del CTE:

| Unión | Va hacia |
|---|---|
| \`e.jefe_id = a.id\` | Los que dependen de las filas de \`a\` (abajo) |
| \`e.id = a.jefe_id\` | El jefe de cada fila de \`a\` (arriba) |

Si el resultado trae a quien no esperas (jefes en vez de subordinados), la unión está al revés. Comprueba con un caso conocido: los directos de Raúl son 4.`,
    },
  ],

  quiz: {
    pre: [
      { id: 'a0pre_basic', conceptId: 'recursive_cte', question: '¿Qué une las dos partes de una consulta recursiva?', options: ['JOIN', 'UNION ALL (o UNION)', 'WHERE', 'GROUP BY'], correct: 1, explanation: 'Parte inicial UNION ALL parte recursiva.' },
      { id: 'a0pre_end', conceptId: 'recursive_cte', question: '¿Cuándo termina una consulta recursiva?', options: ['Después de 10 vueltas', 'Cuando una vuelta no devuelve filas nuevas', 'Cuando llega a la tabla', 'Nunca'], correct: 1, explanation: 'Se repite mientras salgan filas.' },
      { id: 'a0pre_levels', conceptId: 'recursive_levels', question: 'Para saber la profundidad de cada fila…', options: ['ROW_NUMBER()', 'Una columna que empieza en 1 y suma 1 en la parte recursiva', 'COUNT(*)', 'No se puede'], correct: 1, explanation: 'Se arrastra en cada vuelta.' },
      { id: 'a0pre_up', conceptId: 'recursive_up', question: 'Para subir de un empleado a su jefe, la parte recursiva une…', options: ['e.jefe_id = c.id', 'e.id = c.jefe_id', 'e.id = c.id', 'e.jefe_id = c.jefe_id'], correct: 1, explanation: 'El jefe es el empleado cuyo id es el jefe_id de la fila.' },
      { id: 'a0pre_cycles', conceptId: 'recursive_cycles', question: 'El 36 invitó al 39 y el 39 al 36. ¿Qué hace una recursiva sin protección que sigue las invitaciones?', options: ['Devuelve dos filas', 'No termina', 'Da error de sintaxis', 'Ignora el ciclo'], correct: 1, explanation: 'Cada vuelta encuentra una fila nueva.' },
      { id: 'a0pre_path', conceptId: 'recursive_path', question: '¿Cómo se construye la ruta desde la raíz?', options: ["Arrastrando r.ruta || ' > ' || e.nombre", 'Con GROUP BY', 'Con ORDER BY', 'Con LAG'], correct: 0, explanation: 'La ruta crece en cada vuelta.' },
    ],
    post: [
      { id: 'a0post_basic', conceptId: 'recursive_cte', question: '¿Qué ventaja tiene la recursiva sobre encadenar JOIN?', options: ['Ninguna', 'Llega a todos los niveles sin saber cuántos hay', 'Es más corta siempre', 'No necesita tablas'], correct: 1, explanation: 'Con JOIN tendrías que escribir uno por nivel.' },
      { id: 'a0post_levels', conceptId: 'recursive_levels', question: 'La parte inicial da `1 AS nivel` (integer) y la recursiva `q.nivel + 1`. ¿Cuántas filas de nivel 1 hay si seleccionas los de jefe_id = 6?', options: ['Una', 'Las que reportan directamente a Raúl', 'Todas', 'Ninguna'], correct: 1, explanation: 'Nivel 1 = directos.' },
      { id: 'a0post_up', conceptId: 'recursive_up', question: 'Subiendo desde Víctor, ¿por qué termina la recursiva?', options: ['Por el ORDER BY', 'Porque la CEO no tiene jefe y la siguiente vuelta no encuentra filas', 'Por el LIMIT', 'Porque hay un ciclo'], correct: 1, explanation: 'jefe_id NULL no une con nadie.' },
      { id: 'a0post_aggregate', conceptId: 'recursive_aggregate', question: 'Para contar los dependientes de cada jefe a cualquier nivel…', options: ['COUNT por jefe_id', 'Parejas (jefe, persona) con una recursiva y GROUP BY jefe', 'Un CROSS JOIN', 'Una ventana'], correct: 1, explanation: 'COUNT por jefe_id solo cuenta los directos.' },
      { id: 'a0post_cycles', conceptId: 'recursive_cycles', question: '¿Cuál de estas protege una recursiva contra un ciclo?', options: ['ORDER BY', 'NOT id = ANY(ruta) arrastrando la ruta', 'DISTINCT en la consulta final', 'LIMIT al final'], correct: 1, explanation: 'O CYCLE, o un límite de profundidad.' },
      { id: 'a0post_direction', conceptId: 'recursive_direction', question: 'Querías los subordinados de Raúl y salen Jorge y Beatriz. ¿Qué pasa?', options: ['Faltan datos', 'La unión de la recursiva va hacia arriba: hay que unir e.jefe_id = q.id', 'Falta un DISTINCT', 'Hay un ciclo'], correct: 1, explanation: 'e.id = q.jefe_id sube.' },
    ],
  },

  scenes: [
    {
      id: 'mail_ines',
      channel: 'email',
      from: 'ines',
      at: 0,
      subject: 'Mes 3: datos con forma de árbol',
      body: '¡Bienvenida al tercer mes!\n\nHasta ahora, un JOIN te bastaba para unir una fila con su pareja. Pero hay datos que forman **árboles**: cada empleado tiene un jefe, que tiene otro jefe… En la réplica tienes dos tablas nuevas: **`empleados`** (con `jefe_id`) e **`invitaciones`** (quién invitó a quién en «invita a un amigo»).\n\nUn JOIN baja un nivel. Para bajar todos, una **consulta recursiva**: `WITH RECURSIVE`.\n\nPara empezar:\n\n- Todo el equipo de **Raúl Ortega** (id 6), a cualquier nivel: `id`, `nombre` y `nivel` (1 = le reporta directamente).\n\nInés',
      onDeliver: [{ kind: 'flag', key: 'encargo.ines' }, { kind: 'unlock', conceptId: 'recursive_cte' }, { kind: 'unlock', conceptId: 'recursive_levels' }],
    },
    {
      id: 'ines_ok',
      channel: 'chat',
      from: 'ines',
      when: { kind: 'flag', key: 'reto.organigrama' },
      body: 'Ocho personas: cuatro directas, tres en el nivel 2 y Víctor, el becario, en el 3. Con JOIN habrías tenido que escribir un JOIN por nivel… y saber cuántos niveles hay.',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'marta_invitaciones',
      channel: 'chat',
      from: 'marta',
      at: 30,
      body: '¡Hola! Vamos a premiar a los mejores embajadores de «invita a un amigo». Quiero **todos los clientes que llegaron gracias al cliente 1**: los que invitó él, los que invitaron esos, y así. `cliente_id` y `generacion` (1 = invitado directamente por el 1).',
      onDeliver: [{ kind: 'flag', key: 'encargo.marta' }],
    },
    {
      id: 'marta_thanks',
      channel: 'chat',
      from: 'marta',
      when: { kind: 'flag', key: 'reto.arbol_invitaciones' },
      body: '¡Quince clientes en cuatro generaciones! Yo solo veía a sus tres invitados directos. El cliente 1 se lleva el premio.',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }, { kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'carmen_cadena',
      channel: 'chat',
      from: 'carmen',
      at: 75,
      body: 'Hola. Compliance: un gasto de Víctor Peña (id 28) tiene que pasar por **todos sus jefes** hasta la CEO. Necesito la cadena: `nivel` (0 = Víctor, 1 = su jefe directo…), `id`, `nombre` y `puesto`, **ordenada por nivel**.',
      onDeliver: [{ kind: 'flag', key: 'encargo.carmen' }, { kind: 'unlock', conceptId: 'recursive_up' }],
    },
    {
      id: 'carmen_thanks',
      channel: 'chat',
      from: 'carmen',
      when: { kind: 'flag', key: 'reto.cadena_aprobacion' },
      body: 'Seis personas, de Víctor a Beatriz. La aprobación tenía que haber pasado por Laura y por Raúl: ahora lo puedo demostrar. Gracias.',
      onDeliver: [{ kind: 'score', key: 'risk', add: 1 }, { kind: 'score', key: 'rigor', add: 1 }],
    },
    {
      id: 'ines_ciclo',
      channel: 'meeting',
      from: 'ines',
      at: 120,
      subject: '11:00 · Inés: «La consola no termina»',
      body: '**Inés:** Diego quería ver la cadena de invitaciones del cliente 36 y ha escrito:\n\n`WITH RECURSIVE r AS (SELECT cliente_id, invitado_por, 1 AS n FROM invitaciones WHERE cliente_id = 36 UNION ALL SELECT r.cliente_id, i.invitado_por, n + 1 FROM r JOIN invitaciones i ON i.cliente_id = r.invitado_por) SELECT * FROM r;`\n\nLa consola se ha quedado pensando y al final ha cortado la consulta por «demasiadas filas intermedias». ¿Qué ha pasado?',
      onDeliver: [{ kind: 'unlock', conceptId: 'recursive_cycles' }],
      choices: [
        {
          id: 'guard',
          text: 'Hay un **ciclo**: el 36 fue invitado por el 39 y el 39 por el 36. Cada vuelta encuentra una fila «nueva» (con otro `n`) y la recursiva no termina nunca. Hay que protegerla: arrastrar la ruta de clientes visitados y no seguir cuando se repite uno (`NOT … = ANY(ruta)`), o usar `CYCLE`, y como red de seguridad un límite de profundidad.',
          cost: 10,
          reply: 'Exacto. En producción no hay quien la corte: se queda ocupando el servidor. Toda recursiva sobre datos que no controlas necesita protección contra ciclos.',
          effects: [
            { kind: 'flag', key: 'practice.cycle_guard' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'note', tone: 'good', text: 'Con datos que pueden tener ciclos, ruta de visitados, CYCLE o límite de profundidad.' },
          ],
        },
        {
          id: 'union',
          text: 'Que cambie `UNION ALL` por `UNION`, que quita los repetidos.',
          cost: 10,
          reply: 'Con la columna `n`, cada fila es distinta de la anterior: UNION no ve repetidos y sigue sin terminar. Ayudaría solo si las filas fueran idénticas.',
          effects: [{ kind: 'note', tone: 'bad', text: 'UNION no corta un ciclo si las filas llevan nivel o ruta.' }],
        },
        {
          id: 'console',
          text: 'Que la consola tiene un límite muy bajo: que pida más memoria.',
          cost: 10,
          reply: 'Con más memoria tardaría más en cortarse, nada más. La consulta no termina nunca porque los datos tienen un ciclo.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste al límite de una consulta que no podía terminar.' }],
        },
      ],
    },
    {
      id: 'nuria_rutas',
      channel: 'chat',
      from: 'nuria',
      at: 150,
      body: 'Hola. Para la intranet de atención al cliente quiero el **organigrama con rutas**: de **cada** empleado, su `id` y su `ruta` desde la CEO, con los nombres separados por ` > ` (como `Beatriz Sáez > Lucía Herrero > Nuria Vidal`).',
      onDeliver: [{ kind: 'flag', key: 'encargo.nuria' }, { kind: 'unlock', conceptId: 'recursive_path' }],
    },
    {
      id: 'nuria_thanks',
      channel: 'chat',
      from: 'nuria',
      when: { kind: 'flag', key: 'reto.rutas' },
      body: 'Veintiocho rutas. La más larga es la de Víctor, con seis nombres. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'communication', add: 1 }],
    },
    {
      id: 'diego_equipos',
      channel: 'chat',
      from: 'diego',
      at: 210,
      body: 'Ey. En la app interna un jefe tiene que poder ver las solicitudes de **toda** la gente que depende de él, no solo de sus directos. Para dimensionarlo: `id`, `nombre` y `equipo_total` de cada empleado que tiene a alguien por debajo.',
      onDeliver: [{ kind: 'flag', key: 'encargo.diego' }, { kind: 'unlock', conceptId: 'recursive_aggregate' }],
    },
    {
      id: 'diego_thanks',
      channel: 'chat',
      from: 'diego',
      when: { kind: 'flag', key: 'reto.equipo_total' },
      body: 'Doce jefes, y Beatriz con veintisiete por debajo. Yo había contado solo los directos: Raúl tenía cuatro y en realidad son ocho. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'efficiency', add: 1 }],
    },
    {
      id: 'laura_ciclos',
      channel: 'chat',
      from: 'laura',
      at: 270,
      body: 'Hola. El cálculo nocturno de comisiones de referidos se cuelga y sospecho de la última importación de `invitaciones`. ¿Hay clientes que, siguiendo quién les invitó, **vuelven a sí mismos**? Una columna `cliente_id`. Y que tu consulta termine, por favor.',
      onDeliver: [{ kind: 'flag', key: 'encargo.laura' }],
    },
    {
      id: 'laura_thanks',
      channel: 'chat',
      from: 'laura',
      when: { kind: 'flag', key: 'reto.ciclos' },
      body: 'El 36 y el 39, invitándose el uno al otro. Abro un bug para la importación y otro para que la tabla no admita ciclos. ¡Gracias!',
      onDeliver: [{ kind: 'score', key: 'rigor', add: 1 }, { kind: 'score', key: 'risk', add: 1 }],
    },
    {
      id: 'ines_direccion',
      channel: 'meeting',
      from: 'ines',
      at: 360,
      subject: '15:00 · Inés: «¿Raúl tiene a la CEO en su equipo?»',
      body: '**Inés:** Diego ha preparado otra versión del equipo de Raúl:\n\n`WITH RECURSIVE equipo AS (SELECT id, nombre FROM empleados WHERE id = 6 UNION ALL SELECT e.id, e.nombre, e.jefe_id … JOIN equipo q ON e.id = q.jefe_id) …`\n\nY le salen Raúl, Jorge y Beatriz. ¿Qué le dices?',
      onDeliver: [{ kind: 'unlock', conceptId: 'recursive_direction' }],
      choices: [
        {
          id: 'direction',
          text: 'Que la unión va **hacia arriba**: `e.id = q.jefe_id` busca al jefe de cada fila, así que sube de Raúl a Jorge y a Beatriz. Para bajar hay que unir `e.jefe_id = q.id` (los empleados cuyo jefe está ya en el equipo). Y que lo compruebe con algo que sabe: Raúl tiene cuatro directos.',
          cost: 10,
          reply: 'Eso es. La recursiva hace exactamente lo que le dices, en la dirección que le dices. Siempre conviene contrastar con un caso que conoces.',
          effects: [
            { kind: 'flag', key: 'practice.direction' },
            { kind: 'score', key: 'rigor', add: 1 },
            { kind: 'score', key: 'risk', add: 1 },
            { kind: 'note', tone: 'good', text: 'Bajar: e.jefe_id = a.id. Subir: e.id = a.jefe_id. Y contrastar con un caso conocido.' },
          ],
        },
        {
          id: 'data',
          text: 'Que los `jefe_id` de la tabla estarán mal cargados.',
          cost: 10,
          reply: 'Los datos están bien: el organigrama de Raúl salió perfecto esta mañana. Lo que cambia es la unión.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Culpaste a los datos de una unión al revés.' }],
        },
        {
          id: 'filter',
          text: 'Que filtre fuera a Jorge y a Beatriz con un `WHERE id NOT IN (1, 2)`.',
          cost: 10,
          reply: 'Quitaría esas dos filas, pero seguiría sin salir ninguno de sus subordinados. El problema es la dirección.',
          effects: [{ kind: 'note', tone: 'bad', text: 'Parcheaste el resultado en vez de arreglar la consulta.' }],
        },
      ],
    },
    {
      id: 'closing',
      channel: 'meeting',
      from: 'ines',
      at: 480,
      subject: '17:00 · Cierre del día con Inés',
      body: '**Inés:** Hoy has recorrido árboles. ¿Qué te llevas?',
      onDeliver: [{ kind: 'preventBugs' }],
      choices: [
        {
          id: 'lesson',
          text: 'Que una consulta recursiva tiene una parte inicial y una recursiva unidas por `UNION ALL`; que arrastrando columnas saco el nivel o la ruta; que la dirección de la unión decide si bajo o subo; que para contar todo lo que cuelga genero parejas; y que con datos que pueden tener ciclos hay que protegerla.',
          reply: 'Muy bien. Mañana, las funciones de ventana que no viste el mes pasado: marcos, primero, último y enésimo.',
          effects: [{ kind: 'score', key: 'efficiency', add: 1 }, { kind: 'endMission' }],
        },
        {
          id: 'joins',
          text: 'Que con tres o cuatro JOIN seguidos se llega a casi todos los niveles.',
          reply: 'Hasta que alguien añade un nivel más al organigrama. Mira el debrief.',
          effects: [{ kind: 'note', tone: 'neutral', text: 'Te quedaste con encadenar JOIN en vez de una recursiva.' }, { kind: 'endMission' }],
        },
      ],
    },
  ],
}
