import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 7). */
export const m07Lessons: Lesson[] = [
  {
    id: 'left',
    question: '¿Qué hace LEFT JOIN?',
    conceptId: 'left_join',
    cost: 5,
    body: `Devuelve **todas** las filas de la tabla de la izquierda (la del \`FROM\`), tengan pareja o no. Las que no tienen pareja salen con las columnas de la derecha a **NULL**:

\`\`\`
SELECT c.id, c.nombre, a.iban
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id;
\`\`\`

El cliente sin cuentas aparece con \`iban\` NULL. El orden importa: \`clientes LEFT JOIN cuentas\` conserva los clientes.`,
  },
  {
    id: 'anti',
    question: '¿Cómo encuentro lo que no tiene pareja?',
    conceptId: 'anti_join',
    cost: 5,
    body: `LEFT JOIN y quedarte con las filas en las que la derecha es NULL:

\`\`\`
SELECT c.id, c.nombre
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id
WHERE a.id IS NULL;
\`\`\`

Pregunta por una columna que **nunca** es NULL cuando hay pareja (su \`id\`). Se llama *anti-join*.`,
  },
  {
    id: 'exists',
    question: '¿Qué es EXISTS?',
    conceptId: 'exists',
    cost: 5,
    body: `Pregunta si una subconsulta devuelve **alguna** fila:

\`\`\`
SELECT c.id, c.nombre
FROM clientes c
WHERE EXISTS (
  SELECT 1 FROM incidencias i
  WHERE i.cliente_id = c.id AND i.cerrada_en IS NULL
);
\`\`\`

Cada cliente sale **una sola vez**, aunque tenga varias incidencias (un JOIN lo repetiría). \`NOT EXISTS\` es lo contrario: los que no tienen ninguna.`,
  },
  {
    id: 'on_where',
    question: '¿La condición va en el ON o en el WHERE?',
    conceptId: 'left_on_where',
    cost: 5,
    body: `En un \`LEFT JOIN\`:

- En el **ON**: decide qué filas de la derecha cuentan como pareja. Las de la izquierda se conservan siempre.
- En el **WHERE**: filtra el resultado **después** de unir. Una condición sobre la tabla de la derecha (\`a.estado = 'activa'\`) elimina las filas sin pareja (porque ahí \`a.estado\` es NULL), y el LEFT se convierte en INNER.

Regla práctica: lo de la tabla de la derecha, al ON.`,
  },
  {
    id: 'count',
    question: '¿Cómo cuento con LEFT JOIN sin que salgan unos falsos?',
    conceptId: 'left_count',
    cost: 5,
    body: `Con \`COUNT(columna_de_la_derecha)\`, no con \`COUNT(*)\`:

\`\`\`
SELECT c.id, c.nombre, COUNT(a.id) AS cuentas
FROM clientes c
LEFT JOIN cuentas a ON a.cliente_id = c.id
GROUP BY c.id, c.nombre;
\`\`\`

El cliente sin cuentas tiene una fila (con NULL): \`COUNT(*)\` la cuenta y da 1; \`COUNT(a.id)\` no cuenta el NULL y da 0.`,
  },
  {
    id: 'not_in',
    question: '¿Por qué NOT IN me devuelve cero filas?',
    conceptId: 'not_in_null',
    cost: 5,
    body: `Si la lista o la subconsulta contiene **un solo NULL**, \`x NOT IN (…)\` nunca es verdadero: «¿x es distinto de NULL?» es desconocido.

\`WHERE id NOT IN (SELECT cuenta_destino_id FROM transferencias)\` → 0 filas, porque hay transferencias con destino NULL.

Soluciones: \`NOT EXISTS\` (recomendado), un anti-join con LEFT JOIN, o filtrar los NULL en la subconsulta (\`WHERE cuenta_destino_id IS NOT NULL\`).`,
  },
]
