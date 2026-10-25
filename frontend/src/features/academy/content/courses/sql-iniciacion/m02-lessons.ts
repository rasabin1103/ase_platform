import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 2). */
export const m02Lessons: Lesson[] = [
  {
    id: 'order',
    question: '¿Cómo ordeno el resultado?',
    conceptId: 'order_by',
    cost: 5,
    body: `Con \`ORDER BY\` y la columna, casi al final de la consulta:

\`SELECT iban, saldo FROM cuentas ORDER BY saldo;\`

- Por defecto es **ascendente**: de menor a mayor, de la A a la Z, de la fecha más antigua a la más reciente.
- Sin \`ORDER BY\`, PostgreSQL **no garantiza ningún orden**, aunque parezca que sí.
- Orden de las partes: \`SELECT\` → \`FROM\` → \`WHERE\` → \`ORDER BY\` → \`LIMIT\`.`,
  },
  {
    id: 'desc',
    question: '¿Y de mayor a menor? ¿Y «los 10 primeros»?',
    conceptId: 'order_desc',
    cost: 5,
    body: `\`DESC\` invierte el orden:

\`SELECT id, importe FROM transferencias ORDER BY importe DESC LIMIT 10;\`

Con \`ORDER BY ... DESC LIMIT n\` tienes «los n más altos». Sin \`DESC\` tendrías los n más **bajos**, y sin \`ORDER BY\` unos n cualesquiera.`,
  },
  {
    id: 'multi',
    question: '¿Puedo ordenar por varias columnas?',
    conceptId: 'order_multi',
    cost: 5,
    body: `Sí, separadas por comas. La segunda solo decide cuando la primera empata:

\`ORDER BY ciudad, fecha_alta DESC\`

Primero por ciudad (A→Z) y, dentro de cada ciudad, del alta más reciente a la más antigua. Cada columna lleva su propio \`ASC\` o \`DESC\`: el \`DESC\` del final **no** se aplica a \`ciudad\`.`,
  },
  {
    id: 'like',
    question: '¿Cómo busco un trozo de texto?',
    conceptId: 'like_patterns',
    cost: 5,
    body: `Con \`LIKE\` y comodines:

- \`%\` = cualquier cosa (también nada). \`_\` = exactamente un carácter.
- \`'Serrano%'\` empieza por Serrano · \`'%Serrano'\` termina · \`'%Serrano%'\` contiene.
- \`'%@correo.es'\` = emails de ese dominio.

Sin \`%\`, \`LIKE 'Serrano'\` es igual que \`= 'Serrano'\`: solo el texto exacto.`,
  },
  {
    id: 'ilike',
    question: '¿Y si no sé cómo están escritas las mayúsculas?',
    conceptId: 'ilike_case',
    cost: 5,
    body: `\`LIKE\` distingue mayúsculas: \`'%serrano%'\` no encuentra «Serrano».

En PostgreSQL tienes \`ILIKE\`, que no las distingue:

\`WHERE apellidos ILIKE '%serrano%'\`

En otras bases de datos se hace con \`LOWER(apellidos) LIKE '%serrano%'\`. Las tildes sí cuentan: «Martin» no encuentra «Martín».`,
  },
  {
    id: 'distinct',
    question: '¿Cómo quito los repetidos?',
    conceptId: 'distinct',
    cost: 5,
    body: `\`SELECT DISTINCT ciudad FROM clientes;\`

\`DISTINCT\` quita las **filas** repetidas, mirando **todas** las columnas del \`SELECT\`. \`SELECT DISTINCT ciudad, nombre\` quita solo las parejas ciudad-nombre repetidas, así que la ciudad seguirá apareciendo muchas veces.

Combínalo con \`ORDER BY\` para tener una lista limpia y ordenada.`,
  },
]
