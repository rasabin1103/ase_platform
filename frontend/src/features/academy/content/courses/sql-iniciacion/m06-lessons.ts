import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 6). */
export const m06Lessons: Lesson[] = [
  {
    id: 'keys',
    question: '¿Cómo se relacionan las tablas?',
    conceptId: 'foreign_keys',
    cost: 5,
    body: `Con **claves**:

- \`clientes.id\` identifica a cada cliente (clave primaria).
- \`cuentas.cliente_id\` dice de qué cliente es cada cuenta (clave foránea).
- \`tarjetas.cuenta_id\` → \`cuentas.id\`.
- \`transferencias.cuenta_origen_id\` y \`cuenta_destino_id\` → \`cuentas.id\`.
- \`incidencias.cliente_id\` → \`clientes.id\`.

En vez de repetir el nombre del cliente en cada cuenta, se guarda su \`id\`. Para juntar los datos hace falta unir las tablas.`,
  },
  {
    id: 'join',
    question: '¿Cómo uno dos tablas?',
    conceptId: 'inner_join',
    cost: 5,
    body: `\`\`\`
SELECT cuentas.iban, clientes.nombre
FROM cuentas
JOIN clientes ON cuentas.cliente_id = clientes.id;
\`\`\`

\`ON\` dice qué fila va con qué fila: la cuenta con el cliente cuyo \`id\` es su \`cliente_id\`. \`JOIN\` y \`INNER JOIN\` son lo mismo.`,
  },
  {
    id: 'on',
    question: '¿Y si me olvido del ON?',
    conceptId: 'join_condition',
    cost: 5,
    body: `\`FROM cuentas, clientes\` (o un \`JOIN\` con una condición que no relaciona nada) combina **cada fila de una tabla con cada fila de la otra**: el **producto cartesiano**. 52 cuentas × 40 clientes = 2.080 filas sin sentido.

Señal de alarma: si el resultado tiene muchas más filas de las que esperabas, revisa los \`ON\`.`,
  },
  {
    id: 'alias',
    question: '¿Hay que escribir el nombre de la tabla cada vez?',
    conceptId: 'table_alias',
    cost: 5,
    body: `Usa **alias de tabla**:

\`\`\`
SELECT t.id, t.importe, a.iban
FROM transferencias t
JOIN cuentas a ON t.cuenta_origen_id = a.id
WHERE t.estado = 'rechazada';
\`\`\`

Además evitan el error «la columna id existe en varias tablas»: \`id\`, \`estado\` o \`tipo\` están en más de una tabla, así que hay que decir de cuál (\`t.id\`).`,
  },
  {
    id: 'multi',
    question: '¿Puedo unir tres tablas?',
    conceptId: 'multi_join',
    cost: 5,
    body: `Sí, encadenando \`JOIN\`. De tarjetas a clientes se pasa por cuentas:

\`\`\`
SELECT c.email, t.tipo, t.caduca_en
FROM tarjetas t
JOIN cuentas a  ON t.cuenta_id = a.id
JOIN clientes c ON a.cliente_id = c.id
WHERE c.email = 'cliente@mail.com';
\`\`\`

Cada \`JOIN\` lleva su \`ON\`. Puedes añadir \`WHERE\`, \`GROUP BY\` y \`ORDER BY\` como siempre.`,
  },
  {
    id: 'inner',
    question: '¿Por qué me faltan filas después de un JOIN?',
    conceptId: 'inner_drops',
    cost: 5,
    body: `\`INNER JOIN\` solo devuelve las filas que tienen **pareja en las dos tablas**. Un cliente sin cuentas no aparece en \`clientes JOIN cuentas\`; una transferencia a otro banco (sin cuenta de destino) no aparece si unes por \`cuenta_destino_id\`.

No es un fallo, pero cambia lo que cuentas. Para no perder a nadie está \`LEFT JOIN\` (próxima misión).`,
  },
]
