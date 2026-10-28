import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 0). */
export const m00Lessons: Lesson[] = [
  {
    id: 'scalar',
    question: '¿Qué es una subconsulta?',
    conceptId: 'subquery_scalar',
    cost: 5,
    body: `Una consulta **entre paréntesis** dentro de otra. La más sencilla devuelve **un solo valor** y se usa como si fuera un número:

\`\`\`
SELECT id, importe
FROM transferencias
WHERE importe > (SELECT AVG(importe) FROM transferencias);
\`\`\`

PostgreSQL calcula primero la media y luego compara cada fila con ella. Nada de copiar la cifra a mano: si cambian los datos, la consulta sigue siendo correcta.`,
  },
  {
    id: 'in',
    question: '¿Y si la subconsulta devuelve una lista?',
    conceptId: 'subquery_in',
    cost: 5,
    body: `Se compara con \`IN\`:

\`\`\`
SELECT id, nombre, apellidos
FROM clientes
WHERE id IN (SELECT cliente_id FROM cuentas WHERE tipo = 'ahorro');
\`\`\`

La subconsulta da la lista de \`cliente_id\` con ahorro y la consulta de fuera se queda con esos clientes, **una vez cada uno** aunque tengan varias cuentas. \`NOT IN\` hace lo contrario (cuidado si la lista puede tener NULL; en ese caso, \`NOT EXISTS\`).`,
  },
  {
    id: 'correlated',
    question: '¿Puede la subconsulta depender de cada fila?',
    conceptId: 'subquery_correlated',
    cost: 5,
    body: `Sí: es una subconsulta **correlacionada**. Usa una columna de la consulta de fuera:

\`\`\`
SELECT t.id, t.estado, t.importe
FROM transferencias t
WHERE t.importe = (SELECT MAX(t2.importe)
                   FROM transferencias t2
                   WHERE t2.estado = t.estado);
\`\`\`

Para cada transferencia \`t\`, la subconsulta calcula el máximo **de su estado**. Los alias (\`t\`, \`t2\`) son imprescindibles para saber qué columna es de cuál.`,
  },
  {
    id: 'from',
    question: '¿Puedo usar el resultado de una consulta como si fuera una tabla?',
    conceptId: 'subquery_from',
    cost: 5,
    body: `Sí, en el \`FROM\` (se llama *tabla derivada*). Ponle siempre un **alias** (\`AS envios\`): en PostgreSQL 16 o posterior es opcional, pero en versiones anteriores y en otras bases de datos es obligatorio, y te deja nombrar sus columnas:

\`\`\`
SELECT ROUND(AVG(n), 2)
FROM (SELECT cuenta_origen_id, COUNT(*) AS n
      FROM transferencias
      GROUP BY cuenta_origen_id) AS envios;
\`\`\`

Primero se cuenta por cuenta; después se hace la media de esos recuentos. Es la forma de **agregar un agregado**: \`AVG(COUNT(*))\` directamente da error.`,
  },
  {
    id: 'select',
    question: '¿Y una subconsulta como columna?',
    conceptId: 'subquery_select',
    cost: 5,
    body: `En el \`SELECT\`, una subconsulta correlacionada que devuelve un valor por fila:

\`\`\`
SELECT c.id, c.nombre,
       (SELECT COUNT(*) FROM incidencias i WHERE i.cliente_id = c.id) AS incidencias
FROM clientes c;
\`\`\`

Cada cliente sale una vez, con su recuento (0 si no tiene ninguna). Es una alternativa al \`LEFT JOIN … GROUP BY\`: con pocas filas, muy legible.`,
  },
  {
    id: 'multirow',
    question: '«La subconsulta devuelve más de una fila»: ¿qué hago?',
    conceptId: 'subquery_multirow',
    cost: 5,
    body: `Con \`=\`, \`>\`, \`<\`… la subconsulta tiene que devolver **un valor**. Si devuelve varias filas:

- si querías comparar con una lista, usa **\`IN\`**;
- si querías un valor, la subconsulta tiene que garantizarlo: un agregado (\`MAX\`, \`COUNT\`…) o una condición por clave.

No lo tapes con \`LIMIT 1\`: dejaría de dar error y devolvería un resultado cualquiera.`,
  },
  {
    id: 'semijoin',
    question: '¿JOIN o IN/EXISTS?',
    conceptId: 'semijoin_duplicates',
    cost: 5,
    body: `Responden preguntas distintas:

- **JOIN**: «dame cada pareja cliente–cuenta». Un cliente con dos cuentas sale **dos veces**.
- **IN / EXISTS**: «dame los clientes que tienen alguna». Cada cliente sale **una vez**.

Si con un JOIN te salen más filas de las esperadas, probablemente querías IN o EXISTS (o \`COUNT(DISTINCT …)\`).`,
  },
]
