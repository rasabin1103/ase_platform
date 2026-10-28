import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 6 · misión 8). */
export const m08Lessons: Lesson[] = [
  {
    id: 'rules',
    question: '¿Cómo compruebo una regla de negocio con SQL?',
    conceptId: 'rules_as_queries',
    cost: 5,
    body: `Escribe la consulta que encuentra **los casos que la incumplen**. Si la regla se cumple, devuelve **cero filas**.

Regla: «una tarjeta bloqueada no puede tener pagos aceptados».

\`\`\`
SELECT p.id, p.tarjeta_id, p.importe
FROM pagos_tarjeta p
JOIN tarjetas t ON t.id = p.tarjeta_id
WHERE t.estado = 'bloqueada' AND p.estado = 'aceptado';
\`\`\`

Cada fila es un bug con nombre y apellidos.`,
  },
  {
    id: 'dups',
    question: '¿Cómo encuentro duplicados?',
    conceptId: 'find_duplicates',
    cost: 5,
    body: `Primero define **qué es igual** (aquí: tarjeta, comercio, importe y momento; el id siempre es distinto). Después:

- Para saber cuántos: \`GROUP BY esas columnas HAVING COUNT(*) > 1\`.
- Para saber **qué filas sobran**:

\`\`\`
WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (
           PARTITION BY tarjeta_id, comercio_id, importe, pagado_en
           ORDER BY id) AS n
  FROM pagos_tarjeta
)
SELECT id FROM numerados WHERE n > 1;
\`\`\``,
  },
  {
    id: 'keep',
    question: '¿Cómo se limpian los duplicados sin perder datos?',
    conceptId: 'keep_one',
    cost: 5,
    body: `Se borran **las copias** (\`n > 1\`) y se **conserva una** (\`n = 1\`, la de id más bajo).

Error clásico: borrar \`WHERE id IN (los que tienen COUNT > 1)\`, que se lleva también el original.

Y siempre:
1. ensaya el \`DELETE\` como \`SELECT\` con la misma condición y cuenta las filas;
2. hazlo dentro de una transacción y comprueba antes del \`COMMIT\`.`,
  },
  {
    id: 'distinct_on',
    question: '¿Qué es DISTINCT ON?',
    conceptId: 'distinct_on',
    cost: 5,
    body: `Un atajo de PostgreSQL para «**una fila por grupo**, la primera según un orden»:

\`\`\`
SELECT DISTINCT ON (comercio_id) comercio_id, id, importe
FROM pagos_tarjeta
ORDER BY comercio_id, importe DESC;
\`\`\`

El \`ORDER BY\` tiene que empezar por las columnas del \`DISTINCT ON\`; lo que va después decide cuál se queda (aquí, el importe más alto). Hace lo mismo que \`ROW_NUMBER … WHERE n = 1\`, más corto, pero solo existe en PostgreSQL.`,
  },
  {
    id: 'dashboard',
    question: '¿Cómo vigilo varias reglas a la vez?',
    conceptId: 'quality_dashboard',
    cost: 5,
    body: `Una consulta de **una fila**, una columna por regla, con una subconsulta escalar en cada una:

\`\`\`
SELECT
  (SELECT COUNT(*) FROM …regla 1…) AS duplicados,
  (SELECT COUNT(*) FROM …regla 2…) AS tarjeta_bloqueada,
  …;
\`\`\`

Se ejecuta cada noche en el pipeline: si alguna columna no es 0, salta una alerta. Es un test automático de los datos.`,
  },
  {
    id: 'source',
    question: '¿Y si encuentro datos sucios?',
    conceptId: 'fix_at_source',
    cost: 5,
    body: `No los escondas en tu consulta (\`DISTINCT\`, un filtro, un \`COALESCE\`): el resto de informes los seguirá contando y nadie sabrá que existen.

1. **Repórtalo** como bug, con la consulta que lo demuestra.
2. Que se busque la **causa** (¿por qué se duplican pagos?).
3. Que se **limpien** los datos con un proceso controlado.
4. Deja la consulta como **regla** que avise si vuelve a pasar.`,
  },
]
