import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 0). */
export const m00Lessons: Lesson[] = [
  {
    id: 'select',
    question: '¿Cómo se lee una consulta SELECT?',
    conceptId: 'select_from',
    cost: 5,
    body: `Una consulta dice **qué columnas** quieres y **de qué tabla**:

\`SELECT nombre, email FROM clientes;\`

- \`SELECT\` va seguido de las columnas, separadas por comas.
- \`*\` significa «todas las columnas».
- \`FROM\` indica la tabla.
- El \`;\` final marca el fin de la sentencia.

Las mayúsculas no importan (\`select\` también vale), pero escribir las palabras clave en mayúsculas ayuda a leer.`,
  },
  {
    id: 'columns',
    question: '¿Por qué no usar siempre SELECT *?',
    conceptId: 'select_columns',
    cost: 5,
    body: `\`SELECT *\` está bien para **explorar** una tabla pequeña. Para todo lo demás, pide las columnas que necesitas:

- es más rápido (la base de datos manda menos datos);
- el resultado se entiende mejor;
- si mañana añaden columnas a la tabla, tu consulta sigue devolviendo lo mismo.

Las columnas salen **en el orden en que las escribes**.`,
  },
  {
    id: 'alias',
    question: '¿Cómo cambio el nombre de una columna en el resultado?',
    conceptId: 'column_alias',
    cost: 5,
    body: `Con \`AS\`:

\`SELECT nombre AS cliente, fecha_alta AS alta FROM clientes;\`

El alias solo cambia el nombre **en el resultado**, no en la tabla. Si quieres un alias con espacios o mayúsculas, va entre comillas dobles: \`AS "Fecha de alta"\`.`,
  },
  {
    id: 'limit',
    question: '¿Cómo veo solo unas pocas filas?',
    conceptId: 'limit_rows',
    cost: 5,
    body: `Con \`LIMIT\` al final:

\`SELECT * FROM transferencias LIMIT 5;\`

Es la forma segura de **explorar** una tabla grande. Ojo: sin un \`ORDER BY\` (lo verás en la misión 2), PostgreSQL no garantiza **cuáles** cinco filas te devuelve.`,
  },
  {
    id: 'errors',
    question: '¿Qué hago cuando una consulta da error (o no lo da)?',
    conceptId: 'sql_errors',
    cost: 5,
    body: `- **Lee el mensaje**: suele decir qué falta y dónde («la columna «emial» no existe»).
- Revisa **nombres** en el explorador de tablas, **comas** entre columnas y **comillas** simples para los textos.
- Cuidado con lo que **no** da error: \`SELECT nombre email\` (sin coma) devuelve la columna nombre con el alias «email». Comprueba siempre que el resultado tiene las columnas que pediste.`,
  },
  {
    id: 'replica',
    question: '¿Qué es una réplica de solo lectura?',
    conceptId: 'readonly_replica',
    cost: 5,
    body: `Una **copia** de la base de datos de producción que se actualiza sola y en la que **solo se puede consultar**. Sirve para que análisis, informes y QA no carguen la base de datos principal ni puedan modificar datos por error.

Si intentas un \`UPDATE\` o un \`DELETE\` aquí, la consola te dirá que es de solo lectura. Modificar datos lo harás más adelante, en el entorno de pruebas.`,
  },
]
