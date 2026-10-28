import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 6). */
export const m06Lessons: Lesson[] = [
  {
    id: 'running',
    question: '¿Cómo hago un acumulado?',
    conceptId: 'running_total',
    cost: 5,
    body: `Con \`SUM\` como ventana y un \`ORDER BY\` dentro del \`OVER\`:

\`\`\`
WITH mensual AS (
  SELECT DATE_TRUNC('month', pagado_en) AS mes, SUM(importe) AS total
  FROM pagos_tarjeta WHERE estado = 'aceptado'
  GROUP BY DATE_TRUNC('month', pagado_en)
)
SELECT mes, total,
       SUM(total) OVER (ORDER BY mes) AS acumulado
FROM mensual;
\`\`\`

Cada fila suma su total y el de todas las anteriores. Comprobación: la última fila da el total general.`,
  },
  {
    id: 'partition_reset',
    question: '¿Y si el acumulado tiene que empezar de cero cada año?',
    conceptId: 'running_total',
    cost: 5,
    body: `Se añade un \`PARTITION BY\`:

\`\`\`
SUM(total) OVER (PARTITION BY DATE_TRUNC('year', mes) ORDER BY mes) AS acumulado_anio
\`\`\`

En cada año la ventana vuelve a empezar. Lo mismo sirve para «acumulado por cliente», «por tarjeta», etc.`,
  },
  {
    id: 'lag',
    question: '¿Cómo comparo con el mes anterior?',
    conceptId: 'lag_lead',
    cost: 5,
    body: `\`LAG(columna)\` trae el valor de la **fila anterior** (según el \`ORDER BY\` del OVER); \`LEAD\`, el de la siguiente.

\`\`\`
SELECT mes, total,
       LAG(total) OVER (ORDER BY mes) AS anterior,
       total - LAG(total) OVER (ORDER BY mes) AS variacion
FROM mensual;
\`\`\`

La primera fila no tiene anterior: \`NULL\`. \`LAG(total, 12)\` sería el mismo mes del año anterior (si no faltan meses).`,
  },
  {
    id: 'frame',
    question: '¿Cómo hago una media móvil?',
    conceptId: 'window_frame',
    cost: 5,
    body: `Diciendo qué filas entran en la ventana (el *marco*):

\`\`\`
ROUND(AVG(total) OVER (ORDER BY mes
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS media_3m
\`\`\`

La fila actual y las dos anteriores. Los primeros meses usan las que haya (enero, solo él; febrero, dos). Otros marcos: \`UNBOUNDED PRECEDING\` (desde el principio), \`1 FOLLOWING\` (la siguiente).`,
  },
  {
    id: 'share',
    question: '¿Cómo calculo el porcentaje sobre el total sin otra consulta?',
    conceptId: 'share_of_total',
    cost: 5,
    body: `Con una ventana vacía, \`OVER ()\`: cada fila ve el total de todas.

\`\`\`
SELECT categoria, SUM(importe) AS total,
       ROUND(100.0 * SUM(importe) / SUM(SUM(importe)) OVER (), 1) AS porcentaje
FROM …
GROUP BY categoria;
\`\`\`

\`SUM(SUM(importe)) OVER ()\`: el SUM de dentro es el del GROUP BY (por categoría); el de fuera suma todas las categorías.`,
  },
  {
    id: 'gaps',
    question: '¿LAG da el mes anterior?',
    conceptId: 'lag_gaps',
    cost: 5,
    body: `No: da la **fila anterior**. Si un mes no tiene datos, no hay fila, y LAG se salta ese mes sin avisar.

Antes de fiarte:
- saca también \`LAG(mes) OVER (ORDER BY mes)\` y comprueba que es justo un mes antes;
- o genera todos los meses con un calendario (\`generate_series\`) y únelo con LEFT JOIN, con 0 donde no haya datos.`,
  },
]
