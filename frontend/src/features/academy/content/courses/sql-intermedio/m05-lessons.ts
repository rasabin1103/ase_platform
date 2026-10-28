import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 5). */
export const m05Lessons: Lesson[] = [
  {
    id: 'basics',
    question: '¿Qué es una función de ventana?',
    conceptId: 'window_basics',
    cost: 5,
    body: `Un cálculo sobre un grupo de filas que **no las junta**: cada fila se queda y gana una columna.

\`\`\`
SELECT comercio_id,
       SUM(importe) AS total,
       RANK() OVER (ORDER BY SUM(importe) DESC) AS puesto
FROM pagos_tarjeta
WHERE estado = 'aceptado'
GROUP BY comercio_id;
\`\`\`

Lo que va dentro de \`OVER (…)\` define la ventana: en qué orden se miran las filas y en qué grupos. Las ventanas se calculan al final, después del \`WHERE\`, el \`GROUP BY\` y el \`HAVING\`: por eso pueden usar \`SUM(importe)\`.`,
  },
  {
    id: 'partition',
    question: '¿Cómo hago un ranking dentro de cada grupo?',
    conceptId: 'partition_by',
    cost: 5,
    body: `Con \`PARTITION BY\`: la ventana se reinicia en cada grupo.

\`\`\`
ROW_NUMBER() OVER (PARTITION BY ciudad ORDER BY total DESC)
\`\`\`

Numera 1, 2, 3… los comercios de Madrid, vuelve a empezar en 1 con los de Barcelona, etc. Es como un \`GROUP BY\`, pero sin juntar las filas.`,
  },
  {
    id: 'rank',
    question: '¿ROW_NUMBER, RANK o DENSE_RANK?',
    conceptId: 'rank_functions',
    cost: 5,
    body: `Solo se diferencian en los **empates**. Con importes 100, 100, 80:

| Función | Resultado |
|---|---|
| \`ROW_NUMBER()\` | 1, 2, 3 (desempata al azar) |
| \`RANK()\` | 1, 1, 3 (deja un hueco) |
| \`DENSE_RANK()\` | 1, 1, 2 (sin huecos) |

Si no puede haber empates (una columna única en el ORDER BY), las tres dan lo mismo.`,
  },
  {
    id: 'top_n',
    question: '¿Cómo saco los N primeros de cada grupo?',
    conceptId: 'top_n_per_group',
    cost: 5,
    body: `En dos pasos: numerar y filtrar.

\`\`\`
WITH numerados AS (
  SELECT tarjeta_id, id, importe, pagado_en,
         ROW_NUMBER() OVER (PARTITION BY tarjeta_id ORDER BY pagado_en DESC) AS n
  FROM pagos_tarjeta
)
SELECT tarjeta_id, id, importe, pagado_en
FROM numerados
WHERE n = 1;
\`\`\`

\`n = 1\` es «el último de cada tarjeta»; \`n <= 3\`, «los tres últimos».`,
  },
  {
    id: 'filter',
    question: '¿Por qué no puedo poner la ventana en el WHERE?',
    conceptId: 'window_filter',
    cost: 5,
    body: `Por el orden en que PostgreSQL ejecuta la consulta:

1. \`FROM\` y \`JOIN\` → 2. \`WHERE\` → 3. \`GROUP BY\` → 4. \`HAVING\` → 5. **ventanas** → 6. \`ORDER BY\` → 7. \`LIMIT\`.

Cuando se evalúa el \`WHERE\`, la ventana todavía no existe. Solución: calcularla en un \`WITH\` (o una subconsulta en el \`FROM\`) y filtrar fuera.`,
  },
  {
    id: 'ntile',
    question: '¿Cómo reparto filas en grupos iguales?',
    conceptId: 'ntile',
    cost: 5,
    body: `\`NTILE(n)\` reparte las filas, en el orden indicado, en \`n\` grupos lo más iguales posible:

\`\`\`
NTILE(4) OVER (ORDER BY saldo_total DESC) AS cuartil
\`\`\`

39 clientes en 4 grupos: 10, 10, 10 y 9. Útil para cuartiles, deciles o repartir trabajo en lotes.`,
  },
]
