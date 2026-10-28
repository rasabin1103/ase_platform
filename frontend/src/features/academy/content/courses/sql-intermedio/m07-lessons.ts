import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 7). */
export const m07Lessons: Lesson[] = [
  {
    id: 'twice',
    question: '¿Cómo uno la misma tabla dos veces?',
    conceptId: 'same_table_twice',
    cost: 5,
    body: `Con **un alias por papel**. Una transferencia tiene cuenta de origen y de destino:

\`\`\`
SELECT t.id, co.nombre AS emisor, cd.nombre AS receptor
FROM transferencias t
JOIN cuentas  ao ON ao.id = t.cuenta_origen_id
JOIN clientes co ON co.id = ao.cliente_id
LEFT JOIN cuentas  ad ON ad.id = t.cuenta_destino_id
LEFT JOIN clientes cd ON cd.id = ad.cliente_id;
\`\`\`

\`ao\`/\`co\` = origen, \`ad\`/\`cd\` = destino. El destino va con \`LEFT JOIN\` porque puede ser de otro banco (NULL).`,
  },
  {
    id: 'self',
    question: '¿Y unir una tabla consigo misma?',
    conceptId: 'self_join',
    cost: 5,
    body: `Es lo mismo: un *self-join*. Sirve para comparar filas de la misma tabla entre sí. Por ejemplo, parejas de clientes de la misma ciudad:

\`\`\`
SELECT a.id, b.id
FROM clientes a
JOIN clientes b ON b.ciudad = a.ciudad AND b.id > a.id;
\`\`\`

El \`b.id > a.id\` evita emparejar a alguien consigo mismo y que cada pareja salga dos veces.`,
  },
  {
    id: 'full',
    question: '¿Qué es un FULL OUTER JOIN?',
    conceptId: 'full_outer_join',
    cost: 5,
    body: `Une dos tablas y conserva **lo que solo está en una de las dos**, en los dos lados:

\`\`\`
SELECT COALESCE(e.comercio_id, f.comercio_id) AS comercio_id,
       COALESCE(e.n, 0) AS enero, COALESCE(f.n, 0) AS febrero
FROM enero e
FULL OUTER JOIN febrero f ON f.comercio_id = e.comercio_id;
\`\`\`

Con LEFT JOIN perderías los que solo están en febrero. Fíjate en el \`COALESCE\` del id: puede venir de cualquiera de los dos lados.`,
  },
  {
    id: 'cross',
    question: '¿Para qué sirve un CROSS JOIN?',
    conceptId: 'cross_join',
    cost: 5,
    body: `Combina **cada fila de una tabla con cada fila de la otra**: 2 tipos de tarjeta × 8 categorías = 16 combinaciones. No lleva \`ON\`.

Útil para fabricar «todas las combinaciones posibles» y luego unir los datos reales con \`LEFT JOIN\`, para que salgan también las que no tienen datos (con 0).

Cuidado: 10.000 × 10.000 son 100 millones de filas.`,
  },
  {
    id: 'series',
    question: '¿Cómo genero un calendario?',
    conceptId: 'calendar_series',
    cost: 5,
    body: `\`generate_series(inicio, fin, paso)\` devuelve una fila por valor:

\`\`\`
SELECT generate_series(TIMESTAMP '2025-01-01', TIMESTAMP '2026-02-01', INTERVAL '1 month') AS mes;
\`\`\`

14 filas, una por mes. Después, \`LEFT JOIN\` con los datos agregados por mes y \`COALESCE(total, 0)\`: los meses sin datos aparecen con 0. Para días, \`INTERVAL '1 day'\`. \`::date\` lo deja como fecha.`,
  },
  {
    id: 'on_where',
    question: '¿El filtro va en el ON o en el WHERE?',
    conceptId: 'on_vs_where',
    cost: 5,
    body: `En un \`JOIN\` normal da igual. En un \`LEFT JOIN\`, **no**:

- En el **ON**: decide qué filas de la derecha se unen. Las de la izquierda salen siempre.
- En el **WHERE**: se aplica después. Si la condición es sobre la tabla de la derecha, las filas sin pareja (con NULL) no la cumplen y desaparecen: el LEFT JOIN se queda en un JOIN normal.

Regla: los filtros de la tabla de la derecha, en el ON (o en un paso previo).`,
  },
]
