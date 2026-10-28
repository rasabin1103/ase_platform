import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 1). */
export const m01Lessons: Lesson[] = [
  {
    id: 'basic',
    question: '¿Qué es un WITH?',
    conceptId: 'cte_basic',
    cost: 5,
    body: `Una forma de **ponerle nombre a un paso** de la consulta (se llama CTE, *common table expression*). Después, la consulta final lo usa como si fuera una tabla:

\`\`\`
WITH saldos AS (
  SELECT cliente_id, SUM(saldo) AS saldo_total
  FROM cuentas
  GROUP BY cliente_id
)
SELECT c.id, c.nombre, s.saldo_total
FROM clientes c
JOIN saldos s ON s.cliente_id = c.id
WHERE s.saldo_total > 20000;
\`\`\`

Hace lo mismo que una subconsulta en el \`FROM\`, pero se lee en orden: primero el paso, luego lo que se hace con él.`,
  },
  {
    id: 'chain',
    question: '¿Puedo encadenar varios pasos?',
    conceptId: 'cte_chain',
    cost: 5,
    body: `Sí: separados por **comas**, con un solo \`WITH\` al principio. Cada paso puede usar los de antes:

\`\`\`
WITH saldos AS (
  SELECT c.id, c.nombre, c.ciudad, SUM(a.saldo) AS saldo_total
  FROM clientes c JOIN cuentas a ON a.cliente_id = c.id
  GROUP BY c.id, c.nombre, c.ciudad
),
medias AS (
  SELECT ciudad, AVG(saldo_total) AS media
  FROM saldos
  GROUP BY ciudad
)
SELECT s.id, s.nombre, s.ciudad, s.saldo_total
FROM saldos s JOIN medias m ON m.ciudad = s.ciudad
WHERE s.saldo_total > m.media;
\`\`\`

Error típico: escribir \`WITH\` delante de cada paso. Solo va una vez.`,
  },
  {
    id: 'reuse',
    question: '¿Puedo usar el mismo paso dos veces?',
    conceptId: 'cte_reuse',
    cost: 5,
    body: `Sí, tantas como quieras dentro de la misma consulta:

\`\`\`
WITH saldos AS (
  SELECT cliente_id, SUM(saldo) AS saldo_total
  FROM cuentas GROUP BY cliente_id
)
SELECT cliente_id, saldo_total
FROM saldos
WHERE saldo_total > (SELECT AVG(saldo_total) FROM saldos);
\`\`\`

El cálculo se escribe **una vez**. Si mañana cambia la definición de saldo, se toca en un solo sitio.`,
  },
  {
    id: 'scope',
    question: '¿Cuánto dura un WITH?',
    conceptId: 'cte_scope',
    cost: 5,
    body: `Lo que dura **su consulta**: hasta el \`;\`. No crea ninguna tabla ni se guarda en la base de datos.

- ¿Lo necesitas en otra consulta? Repite el \`WITH\`.
- ¿Lo vais a usar siempre? Guárdalo como **vista** (\`CREATE VIEW\`, al final del curso).
- No copies los datos en una tabla: se queda desactualizada en cuanto cambian.`,
  },
  {
    id: 'grain',
    question: '¿Media por cuenta o por cliente?',
    conceptId: 'cte_grain',
    cost: 5,
    body: `Antes de agregar, pregúntate **«¿una fila de qué?»** (la *granularidad*).

\`AVG(a.saldo)\` sobre \`clientes JOIN cuentas\` es una media **por cuenta**: el cliente con dos cuentas cuenta dos veces, con el saldo partido. Si quieres la media **por cliente**:

1. Un paso que deje **una fila por cliente** con su total.
2. La media de esos totales.

Con \`WITH\` los dos pasos se ven a simple vista.`,
  },
  {
    id: 'vs',
    question: '¿WITH o subconsulta?',
    conceptId: 'cte_vs_subquery',
    cost: 5,
    body: `Hacen lo mismo y PostgreSQL las ejecuta de forma parecida. Elige por legibilidad:

- **Subconsulta**: un valor o una lista sencilla (\`WHERE x > (SELECT AVG…)\`).
- **WITH**: varios pasos, un paso que se usa más de una vez o una consulta que otra persona va a revisar.

Regla práctica: si necesitas más de un nivel de paréntesis para entenderla, pásala a \`WITH\`.`,
  },
]
