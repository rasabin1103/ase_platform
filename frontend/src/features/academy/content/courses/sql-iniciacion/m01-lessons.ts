import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 1). */
export const m01Lessons: Lesson[] = [
  {
    id: 'where',
    question: '¿Cómo me quedo solo con algunas filas?',
    conceptId: 'where_basic',
    cost: 5,
    body: `Con \`WHERE\` y una condición, después del \`FROM\`:

\`SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Madrid';\`

Solo salen las filas en las que la condición es verdadera. El orden de las partes es siempre el mismo: \`SELECT\` → \`FROM\` → \`WHERE\` (y \`LIMIT\` al final).`,
  },
  {
    id: 'operators',
    question: '¿Qué comparaciones puedo hacer?',
    conceptId: 'comparison_ops',
    cost: 5,
    body: `- \`=\` igual
- \`<>\` (o \`!=\`) distinto
- \`>\` mayor · \`<\` menor
- \`>=\` mayor o igual · \`<=\` menor o igual

Los números van sin comillas y con punto decimal: \`saldo > 10000\`, \`importe <= 99.90\`. Nada de \`10.000\` con punto de miles.`,
  },
  {
    id: 'quotes',
    question: '¿Por qué mi texto «no existe» o no encuentra nada?',
    conceptId: 'text_quotes',
    cost: 5,
    body: `- Los **textos** y las **fechas** van entre **comillas simples**: \`ciudad = 'Madrid'\`, \`fecha_alta >= '2025-01-01'\`.
- Sin comillas, PostgreSQL cree que \`madrid\` es una **columna**. Con comillas **dobles** también: las dobles son para nombres de columnas.
- \`=\` compara el texto **exacto**: \`'madrid'\` no es \`'Madrid'\`, y un espacio de más tampoco coincide.

Cero filas no es un error: es un resultado. Si te sorprende, revisa la condición.`,
  },
  {
    id: 'and_or',
    question: '¿Cómo combino varias condiciones?',
    conceptId: 'and_or',
    cost: 5,
    body: `- \`AND\`: se tienen que cumplir **las dos**. \`ciudad = 'Madrid' AND segmento = 'joven'\`.
- \`OR\`: basta con **una**. \`ciudad = 'Sevilla' OR ciudad = 'Málaga'\`.
- \`NOT\` niega una condición.

**Cuidado:** \`AND\` se evalúa antes que \`OR\`. Si mezclas los dos, usa paréntesis:

\`WHERE (ciudad = 'Madrid' OR ciudad = 'Barcelona') AND segmento = 'joven'\``,
  },
  {
    id: 'in',
    question: '¿Hay algo más corto que muchos OR?',
    conceptId: 'in_list',
    cost: 5,
    body: `\`IN\` con una lista de valores:

\`WHERE ciudad IN ('Sevilla', 'Málaga', 'Bilbao')\`

Es lo mismo que tres \`OR\`, pero más corto y sin problemas de paréntesis. \`NOT IN\` hace lo contrario.

Un error típico: \`WHERE ciudad = 'Sevilla' OR 'Málaga'\`. Cada parte del \`OR\` tiene que ser una condición completa.`,
  },
  {
    id: 'between',
    question: '¿Cómo filtro un rango de fechas?',
    conceptId: 'between_dates',
    cost: 5,
    body: `\`BETWEEN a AND b\` incluye los dos extremos: \`saldo BETWEEN 1000 AND 5000\`.

Con **fechas con hora** (\`timestamp\`, como \`creada_en\`) hay trampa: \`'2026-01-25'\` significa el 25 **a las 00:00**. Así que

\`creada_en BETWEEN '2026-01-19' AND '2026-01-25'\`

deja fuera todo lo que pasó el día 25. Lo seguro es usar el día **siguiente** sin incluirlo:

\`creada_en >= '2026-01-19' AND creada_en < '2026-01-26'\``,
  },
]
