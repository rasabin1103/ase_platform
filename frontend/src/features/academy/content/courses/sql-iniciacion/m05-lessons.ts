import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 5). */
export const m05Lessons: Lesson[] = [
  {
    id: 'group_by',
    question: '¿Cómo saco una cifra por grupo?',
    conceptId: 'group_by',
    cost: 5,
    body: `Con \`GROUP BY\` y la columna que define los grupos:

\`SELECT ciudad, COUNT(*) AS clientes FROM clientes GROUP BY ciudad;\`

PostgreSQL junta las filas con la misma ciudad y calcula el \`COUNT(*)\` de cada grupo. Resultado: **una fila por ciudad**.`,
  },
  {
    id: 'select',
    question: '¿Qué columnas puedo poner en el SELECT?',
    conceptId: 'group_select',
    cost: 5,
    body: `Solo dos cosas:

- las columnas que están en el \`GROUP BY\`;
- agregados (\`COUNT\`, \`SUM\`, \`AVG\`, \`MIN\`, \`MAX\`).

\`SELECT ciudad, nombre, COUNT(*) … GROUP BY ciudad\` da error: en un grupo hay muchos nombres. Puedes agrupar por varias columnas: \`GROUP BY ciudad, segmento\` da una fila por cada combinación.`,
  },
  {
    id: 'having',
    question: '¿Cómo me quedo solo con algunos grupos?',
    conceptId: 'having',
    cost: 5,
    body: `Con \`HAVING\`, después del \`GROUP BY\`:

\`SELECT ciudad, COUNT(*) FROM clientes GROUP BY ciudad HAVING COUNT(*) > 4;\`

\`HAVING\` es como un \`WHERE\` para grupos: puede usar agregados.`,
  },
  {
    id: 'where_having',
    question: '¿WHERE o HAVING?',
    conceptId: 'where_vs_having',
    cost: 5,
    body: `- \`WHERE\` filtra **filas**, antes de agrupar. No puede usar agregados.
- \`HAVING\` filtra **grupos**, después de agrupar.

Se pueden combinar:

\`\`\`
SELECT motivo, COUNT(*) AS abiertas
FROM incidencias
WHERE cerrada_en IS NULL      -- solo filas abiertas
GROUP BY motivo
HAVING COUNT(*) > 1;          -- solo motivos con más de una
\`\`\`

Orden: \`SELECT\` → \`FROM\` → \`WHERE\` → \`GROUP BY\` → \`HAVING\` → \`ORDER BY\` → \`LIMIT\`.`,
  },
  {
    id: 'null_group',
    question: '¿Qué pasa con los NULL al agrupar?',
    conceptId: 'group_null',
    cost: 5,
    body: `Todos los NULL de la columna forman **un grupo propio**. En el resultado sale una fila con la celda vacía.

No lo escondas sin pensar: son filas reales. Etiquétalo:

\`SELECT COALESCE(segmento, 'sin segmento') AS segmento, COUNT(*) FROM clientes GROUP BY segmento;\``,
  },
]
