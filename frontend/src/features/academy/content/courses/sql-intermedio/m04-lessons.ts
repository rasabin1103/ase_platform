import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 4). */
export const m04Lessons: Lesson[] = [
  {
    id: 'filter',
    question: '¿Cómo pongo varios recuentos en columnas?',
    conceptId: 'filter_clause',
    cost: 5,
    body: `Con \`FILTER\`: cada agregado cuenta solo las filas que cumplen su condición.

\`\`\`
SELECT COALESCE(c.categoria, 'sin categoría') AS categoria,
       COUNT(*) FILTER (WHERE p.estado = 'aceptado')  AS aceptados,
       COUNT(*) FILTER (WHERE p.estado = 'rechazado') AS rechazados,
       COUNT(*) FILTER (WHERE p.estado = 'devuelto')  AS devueltos
FROM pagos_tarjeta p
JOIN comercios c ON c.id = p.comercio_id
GROUP BY COALESCE(c.categoria, 'sin categoría');
\`\`\`

Vale con cualquier agregado: \`SUM(importe) FILTER (WHERE …)\`, \`AVG(…) FILTER (…)\`.`,
  },
  {
    id: 'case',
    question: '¿Y sin FILTER?',
    conceptId: 'case_aggregate',
    cost: 5,
    body: `\`FILTER\` es de PostgreSQL. La forma que funciona en cualquier base de datos es meter un \`CASE\` dentro del agregado:

\`\`\`
SUM(CASE WHEN estado = 'rechazado' THEN 1 ELSE 0 END)   -- suma unos
COUNT(CASE WHEN estado = 'rechazado' THEN 1 END)         -- cuenta no nulos
\`\`\`

Cuidado: \`COUNT(CASE … THEN 1 ELSE 0 END)\` cuenta **todas** las filas, porque el 0 no es NULL.`,
  },
  {
    id: 'pivot',
    question: '¿Qué es una tabla dinámica en SQL?',
    conceptId: 'pivot',
    cost: 5,
    body: `Pasar valores de filas a **columnas** (*pivot*): una columna por año, por estado o por canal.

\`\`\`
SELECT c.categoria,
       SUM(p.importe) FILTER (WHERE p.pagado_en <  '2026-01-01') AS total_2025,
       SUM(p.importe) FILTER (WHERE p.pagado_en >= '2026-01-01') AS total_2026
FROM pagos_tarjeta p JOIN comercios c ON c.id = p.comercio_id
WHERE p.estado = 'aceptado' AND c.categoria IS NOT NULL
GROUP BY c.categoria;
\`\`\`

Las columnas se escriben a mano: si mañana aparece 2027, hay que añadir otra. Un \`SUM … FILTER\` sin filas da NULL: \`COALESCE(…, 0)\` si quieres un cero.`,
  },
  {
    id: 'pct',
    question: '¿Cómo calculo un porcentaje?',
    conceptId: 'percentages',
    cost: 5,
    body: `Parte entre total, por 100, con un decimal **antes de dividir**:

\`\`\`
SELECT estado,
       COUNT(*) AS pagos,
       ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM pagos_tarjeta), 1) AS porcentaje
FROM pagos_tarjeta
GROUP BY estado;
\`\`\`

- Sobre el total: el total en una subconsulta.
- Sobre el grupo: \`100.0 * COUNT(*) FILTER (WHERE …) / COUNT(*)\`.
- Al redondear, la suma puede dar 99,9 o 100,1: es normal.`,
  },
  {
    id: 'int_div',
    question: '¿Por qué mi porcentaje no tiene decimales?',
    conceptId: 'integer_division',
    cost: 5,
    body: `Porque en PostgreSQL **entero entre entero da entero** (se tiran los decimales): \`2900 / 306\` = \`9\`, \`7 / 2\` = \`3\`.

\`COUNT(*)\` es entero y \`100\` también. Soluciones:

- \`100.0 * COUNT(*) / total\` (el 100.0 ya es decimal);
- \`COUNT(*)::numeric / total\`.

Y el \`ROUND\` siempre al final: no recupera lo que la división ya ha perdido.`,
  },
  {
    id: 'kpis',
    question: '¿Puedo sacar varias cifras en una fila?',
    conceptId: 'kpi_row',
    cost: 5,
    body: `Sí: sin \`GROUP BY\`, todos los agregados resumen la tabla entera en **una fila**:

\`\`\`
SELECT COUNT(*) AS total,
       COUNT(segmento) AS con_segmento,
       COUNT(*) FILTER (WHERE segmento IS NULL) AS sin_segmento,
       COUNT(*) FILTER (WHERE segmento = 'premium') AS premium
FROM clientes;
\`\`\`

Es la consulta típica de un panel de indicadores: una fila, muchas columnas.`,
  },
]
