import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 3). */
export const m03Lessons: Lesson[] = [
  {
    id: 'null',
    question: '¿Qué es exactamente NULL?',
    conceptId: 'null_meaning',
    cost: 5,
    body: `NULL significa **«no hay dato»** o «no se sabe». No es lo mismo que:

- \`0\`: un saldo de cero es un dato; un saldo NULL, no.
- \`''\`: un texto vacío es un texto; NULL no es nada.

En Kobalto hay NULL donde falta información: un cliente sin segmento, una incidencia sin fecha de cierre, una transferencia sin concepto o a otro banco (sin cuenta de destino).`,
  },
  {
    id: 'is_null',
    question: '¿Cómo busco las filas con un hueco?',
    conceptId: 'is_null',
    cost: 5,
    body: `Con \`IS NULL\`, y lo contrario con \`IS NOT NULL\`:

\`SELECT * FROM incidencias WHERE cerrada_en IS NULL;\`

\`= NULL\` **no funciona**: no da error, pero devuelve cero filas. Comparar cualquier cosa con NULL da «desconocido», nunca verdadero. Ni siquiera \`NULL = NULL\` es verdadero.`,
  },
  {
    id: 'logic',
    question: '¿Por qué <> no me devuelve los NULL?',
    conceptId: 'null_logic',
    cost: 5,
    body: `\`WHERE segmento <> 'premium'\` deja fuera a los que tienen segmento NULL: para PostgreSQL, «¿NULL es distinto de premium?» es **desconocido**, y WHERE solo deja pasar lo **verdadero**.

Si quieres incluirlos, dilo:

\`WHERE segmento <> 'premium' OR segmento IS NULL\`

Lo mismo pasa con \`NOT IN\`, \`>\`, \`<\`… Y NULL «contagia» las operaciones: \`'Ana (' || NULL || ')'\` da NULL, y \`100 + NULL\` también.`,
  },
  {
    id: 'coalesce',
    question: '¿Cómo pongo un valor cuando no hay dato?',
    conceptId: 'coalesce',
    cost: 5,
    body: `\`COALESCE\` devuelve el **primer valor que no es NULL** de la lista:

\`SELECT id, COALESCE(concepto, 'Sin concepto') AS concepto FROM transferencias;\`

Si \`concepto\` tiene valor, sale tal cual; si es NULL, sale «Sin concepto». Pon un alias: si no, la columna se llama «coalesce».`,
  },
  {
    id: 'case',
    question: '¿Cómo creo una columna con etiquetas según un valor?',
    conceptId: 'case_when',
    cost: 5,
    body: `Con \`CASE\`:

\`\`\`
SELECT id, saldo,
  CASE
    WHEN saldo < 0 THEN 'negativo'
    WHEN saldo < 1000 THEN 'bajo'
    ELSE 'normal'
  END AS nivel
FROM cuentas;
\`\`\`

Se evalúan **en orden** y gana la primera condición que se cumple: por eso \`saldo < 0\` va antes que \`saldo < 1000\`. Sin \`ELSE\`, lo que no cumple nada queda NULL. Termina con \`END\` y ponle un alias.`,
  },
]
