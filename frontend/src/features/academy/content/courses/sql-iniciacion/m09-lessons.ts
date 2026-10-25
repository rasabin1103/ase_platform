import type { Lesson } from '../../../engine/types'

/** Microlecciones de Inés (curso 5 · misión 9). */
export const m09Lessons: Lesson[] = [
  {
    id: 'create',
    question: '¿Cómo creo una tabla?',
    conceptId: 'create_table',
    cost: 5,
    body: `\`\`\`
CREATE TABLE etiquetas (
  id     integer PRIMARY KEY,
  nombre text NOT NULL
);
\`\`\`

Cada columna lleva **nombre**, **tipo** y, opcionalmente, **reglas**. Separadas por comas (la última, sin coma).`,
  },
  {
    id: 'types',
    question: '¿Qué tipo elijo?',
    conceptId: 'data_types',
    cost: 5,
    body: `Los más habituales:

- \`integer\`: números enteros (ids, cantidades).
- \`numeric(12,2)\`: importes con decimales exactos.
- \`text\`: textos.
- \`date\`: fechas · \`timestamp\`: fecha y hora.
- \`boolean\`: verdadero o falso.

El tipo ya es una regla: en una columna \`date\` no entra «31/02», y \`numeric\` se puede sumar y ordenar bien.`,
  },
  {
    id: 'pk',
    question: '¿Qué es la clave primaria?',
    conceptId: 'primary_key',
    cost: 5,
    body: `La columna que **identifica cada fila**: no se puede repetir ni estar vacía.

\`id integer PRIMARY KEY\`

Es a lo que apuntan las claves foráneas de otras tablas.`,
  },
  {
    id: 'not_null',
    question: '¿Cómo hago una columna obligatoria? ¿Y un valor por defecto?',
    conceptId: 'not_null_default',
    cost: 5,
    body: `- \`NOT NULL\`: la columna no puede quedar vacía.
- \`DEFAULT valor\`: lo que se guarda si el INSERT no la menciona.

\`estado text NOT NULL DEFAULT 'pendiente'\`

Juntas: siempre hay estado, y si no lo dices, «pendiente».`,
  },
  {
    id: 'check',
    question: '¿Cómo limito los valores permitidos?',
    conceptId: 'check_constraint',
    cost: 5,
    body: `Con \`CHECK\` y una condición:

\`prioridad text NOT NULL CHECK (prioridad IN ('alta', 'media', 'baja'))\`

Si la tabla ya existe, se añade con \`ALTER TABLE\`:

\`ALTER TABLE casos_prueba ADD CHECK (prioridad IN ('alta', 'media', 'baja'));\`

(Si ya hubiera filas que no cumplen la regla, no te dejaría añadirla.)`,
  },
  {
    id: 'fk',
    question: '¿Cómo hago que una columna apunte a otra tabla?',
    conceptId: 'foreign_key',
    cost: 5,
    body: `Con una **clave foránea**:

\`caso_id integer NOT NULL REFERENCES casos_prueba(id)\`

PostgreSQL no deja guardar un \`caso_id\` que no exista en \`casos_prueba\`, ni borrar un caso que tenga ejecuciones. Es lo que faltaba en \`transferencias.cuenta_destino_id\`.`,
  },
  {
    id: 'unique',
    question: '¿Cómo evito duplicados en una columna que no es la clave?',
    conceptId: 'unique',
    cost: 5,
    body: `Con \`UNIQUE\`:

\`cliente_id integer NOT NULL UNIQUE REFERENCES clientes(id)\`

Un mismo cliente no puede aparecer dos veces. Es lo que habría evitado el email duplicado de los clientes 12 y 27.`,
  },
  {
    id: 'why',
    question: '¿Para qué reglas en la base de datos si la app ya valida?',
    conceptId: 'constraints_why',
    cost: 5,
    body: `Porque la app no es la única que escribe: también scripts, migraciones, otras aplicaciones y personas con una consola. Las reglas de la tabla protegen los datos **siempre**.

Y se **prueban** como cualquier otra cosa: intenta meter un valor no permitido, un vacío, un duplicado o una referencia que no existe, y comprueba que la base de datos lo rechaza.`,
  },
  {
    id: 'drop',
    question: '¿Cómo cambio o borro una tabla?',
    conceptId: 'drop_alter',
    cost: 5,
    body: `- \`ALTER TABLE t ADD COLUMN c text;\` · \`ALTER TABLE t ADD CHECK (…);\`
- \`DROP TABLE t;\`: borra la tabla **con todos sus datos**. Sin papelera ni ROLLBACK si no estabas en una transacción.

Si otra tabla la referencia con una clave foránea, PostgreSQL no te deja borrarla.`,
  },
]
