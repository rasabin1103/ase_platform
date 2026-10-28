import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 3). */
export const m03Lessons: Lesson[] = [
  {
    id: 'union',
    question: '¿Qué hace UNION?',
    conceptId: 'union_distinct',
    cost: 5,
    body: `Pone los resultados de dos consultas **uno debajo del otro** y quita las filas repetidas:

\`\`\`
SELECT cuenta_origen_id AS cuenta_id FROM transferencias
UNION
SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL;
\`\`\`

Una cuenta que ha enviado y recibido sale **una vez**. Es la forma de decir «los que están en una lista **o** en la otra».`,
  },
  {
    id: 'union_all',
    question: '¿Y UNION ALL?',
    conceptId: 'union_all',
    cost: 5,
    body: `Igual, pero **sin quitar repetidos**: devuelve todas las filas de las dos consultas. Es más rápido (no tiene que buscar duplicados) y es lo que quieres para juntar movimientos y luego sumarlos o contarlos.

\`\`\`
SELECT 'transferencia' AS tipo, id, importe, creada_en AS fecha FROM transferencias WHERE …
UNION ALL
SELECT 'tarjeta', id, importe, pagado_en FROM pagos_tarjeta WHERE …;
\`\`\`

La columna fija \`'transferencia'\`/\`'tarjeta'\` dice de dónde viene cada fila.`,
  },
  {
    id: 'intersect',
    question: '¿Cómo saco lo que está en las dos listas?',
    conceptId: 'intersect_op',
    cost: 5,
    body: `Con \`INTERSECT\`: solo las filas que devuelven **las dos** consultas (sin repetir).

\`\`\`
SELECT comercio_id FROM pagos_tarjeta WHERE pagado_en < '2026-01-01'
INTERSECT
SELECT comercio_id FROM pagos_tarjeta WHERE pagado_en >= '2026-01-01';
\`\`\`

Se podría hacer con \`IN\` o \`EXISTS\`, pero con INTERSECT se lee tal cual: «esta lista **y** esta otra».`,
  },
  {
    id: 'except',
    question: '¿Y lo que está en una y no en la otra?',
    conceptId: 'except_op',
    cost: 5,
    body: `\`EXCEPT\`: las filas de la **primera** consulta que **no** están en la segunda. El orden importa: \`A EXCEPT B\` no es \`B EXCEPT A\`.

\`\`\`
SELECT cuenta_destino_id FROM transferencias WHERE cuenta_destino_id IS NOT NULL
EXCEPT
SELECT id FROM cuentas;
\`\`\`

Es una herramienta de QA estupenda: «lo que debería existir y no existe». Alternativa: \`NOT EXISTS\`.`,
  },
  {
    id: 'columns',
    question: '¿Qué reglas tienen las columnas?',
    conceptId: 'setop_columns',
    cost: 5,
    body: `Las consultas se juntan **por posición**:

- Mismo **número** de columnas (si no, error).
- Tipos **compatibles** en cada posición (texto con texto, números con números).
- Mismo **orden**: si cambias dos columnas del mismo tipo, no hay error… y el resultado es basura.
- Los **nombres** los pone la primera consulta.
- Un \`ORDER BY\` va **al final** y ordena el resultado completo.`,
  },
  {
    id: 'vs_join',
    question: '¿UNION o JOIN?',
    conceptId: 'setop_vs_join',
    cost: 5,
    body: `Hacen cosas distintas:

- **JOIN** pone columnas **al lado**: una fila con datos del cliente y de su cuenta.
- **UNION / INTERSECT / EXCEPT** ponen filas **debajo**, o comparan listas: mismas columnas, filas de dos sitios.

Si tu resultado tiene las columnas de las dos tablas, es un JOIN. Si son las mismas columnas venidas de dos consultas, es una operación de conjuntos.`,
  },
]
