import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 4). */
export const m04Lessons: Lesson[] = [
  {
    id: 'count',
    question: '¿Cómo cuento filas?',
    conceptId: 'count_rows',
    cost: 5,
    body: `\`SELECT COUNT(*) FROM clientes;\`

Devuelve **una fila con una cifra**. Se combina con \`WHERE\` para contar solo algunas:

\`SELECT COUNT(*) FROM clientes WHERE ciudad = 'Madrid';\`

Ponle un alias para que la columna no se llame «count»: \`COUNT(*) AS clientes\`.`,
  },
  {
    id: 'count_column',
    question: '¿COUNT(*) y COUNT(columna) son lo mismo?',
    conceptId: 'count_column',
    cost: 5,
    body: `No:

- \`COUNT(*)\` cuenta **filas**.
- \`COUNT(concepto)\` cuenta las filas en las que \`concepto\` **no es NULL**.
- \`COUNT(DISTINCT ciudad)\` cuenta los **valores distintos** (sin NULL).

Por eso \`COUNT(*) - COUNT(concepto)\` te dice cuántas transferencias no tienen concepto.`,
  },
  {
    id: 'sum_avg',
    question: '¿Cómo sumo o hago la media?',
    conceptId: 'sum_avg',
    cost: 5,
    body: `- \`SUM(saldo)\`: suma.
- \`AVG(importe)\`: media.

\`SELECT SUM(saldo) AS total FROM cuentas WHERE estado = 'activa';\`

El \`WHERE\` se aplica **antes** de sumar: solo entran las filas que lo cumplen. Las dos funciones **ignoran los NULL**: no cuentan como cero.`,
  },
  {
    id: 'round',
    question: '¿Cómo quito tantos decimales?',
    conceptId: 'round',
    cost: 5,
    body: `\`ROUND(valor, decimales)\`:

\`SELECT ROUND(AVG(importe), 2) AS media FROM transferencias;\`

Sin el segundo número redondea a entero. Redondea **al final**, sobre el resultado: si redondeas cada fila antes de sumar, el total puede no cuadrar.`,
  },
  {
    id: 'min_max',
    question: '¿Cómo saco el valor más pequeño y el más grande?',
    conceptId: 'min_max',
    cost: 5,
    body: `\`SELECT MIN(importe) AS minimo, MAX(importe) AS maximo FROM transferencias;\`

Funcionan con números, fechas (la más antigua y la más reciente) y textos (el primero y el último en orden alfabético). Puedes poner varios agregados en el mismo \`SELECT\`.`,
  },
  {
    id: 'one_row',
    question: '¿Por qué no puedo pedir nombre y COUNT(*) a la vez?',
    conceptId: 'aggregate_rows',
    cost: 5,
    body: `Sin \`GROUP BY\`, una consulta con agregados devuelve **una sola fila** que resume todas. Una columna suelta como \`nombre\` tiene muchos valores, y no cabe en una fila:

\`SELECT nombre, COUNT(*) FROM clientes;\` → error.

O todo lo del \`SELECT\` está agregado, o agrupas con \`GROUP BY\` (la próxima misión).`,
  },
  {
    id: 'outliers',
    question: '¿Me puedo fiar siempre de la media?',
    conceptId: 'average_outliers',
    cost: 5,
    body: `La media es muy sensible a los **valores extremos**: cuatro transferencias de 12.000 € suben la media de todas de unos 430 € a 893 €.

Antes de dar una media:

- mira \`MIN\` y \`MAX\`;
- compara con la media sin los extremos (con un \`WHERE\`);
- si buscas «lo típico», la **mediana** suele describirlo mejor. En PostgreSQL: \`percentile_cont(0.5) WITHIN GROUP (ORDER BY importe)\`.`,
  },
]
