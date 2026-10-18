import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 2). */
export const m01Lessons: Lesson[] = [
  {
    id: 'fuzzy',
    question: '¿Qué son los marcadores difusos?',
    conceptId: 'fuzzy',
    cost: 5,
    body: `Strings especiales en el lado **esperado** de un match que comprueban la forma en vez del valor:
- \`#string\`, \`#number\`, \`#boolean\`, \`#array\`, \`#object\`
- \`#null\` (presente y null), \`#notnull\`, \`#present\`, \`#notpresent\`
- \`#ignore\`: me da igual lo que venga
- \`#uuid\`, \`#regex EXPRESIÓN\`
- \`#? expresión\`: \`_\` es el valor. Ej.: \`'#? _ > 0'\` o \`'#number? _ >= 0'\`
- Con dos almohadillas es **opcional**: \`##string\` acepta string, null o que la clave no esté.

\`\`\`
match response == { id: '#string', balance: '#number', alias: '##string' }
\`\`\``,
  },
  {
    id: 'eq_contains',
    question: '¿== o contains?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `- **==** exige que el objeto tenga **exactamente** esas claves: si la API añade o quita una, falla. Es lo que quieres en un **contrato**.
- **contains** solo mira las claves que pones e ignora el resto. Útil para comprobar un par de valores (\`match response contains { status: 'ACTIVE' }\`).
- En listas, \`contains\` busca elementos: \`match [1, 2, 3] contains 2\`.
- También existen \`!contains\`, \`contains only\` (mismos elementos en cualquier orden) y \`contains any\`.`,
  },
  {
    id: 'each',
    question: '¿Cómo valido todos los elementos de una lista?',
    conceptId: 'each',
    cost: 3,
    body: `Con **match each**: aplica la comparación a cada elemento.
\`\`\`
And match each response.items == account
And match each response.items contains { status: 'ACTIVE' }
\`\`\`
Si falla, el mensaje dice cuál: \`$[1].balance | not a number\` es el campo balance del **segundo** elemento (se cuenta desde 0).`,
  },
  {
    id: 'reuse',
    question: '¿Dónde guardo el esquema para no repetirlo?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `Con **def** en el **Background**: queda disponible en todos los escenarios del fichero.
\`\`\`
Background:
  * url baseUrl
  * def account = { id: '#string', iban: '#regex ES\\\\d{22}', ... }
\`\`\`
Luego \`match response == account\` o \`match each response.items == account\`. Cuando el contrato cambie, se cambia en **un** sitio. En misiones siguientes lo sacarás a un fichero JSON con \`read()\`.`,
  },
  {
    id: 'regex',
    question: '¿Cómo escribo una expresión regular en Karate?',
    conceptId: 'fuzzy',
    cost: 3,
    body: `\`'#regex ES\\\\d{22}'\`: la expresión tiene que encajar con el valor **entero**.

Dentro de un string, la barra invertida se escribe **doble** (\`\\\\d\` es «un dígito»). Así, ES seguido de 22 dígitos es \`'#regex ES\\\\d{22}'\`.

Para condiciones que no son regex, el predicado: \`'#number? _ >= 0'\` (número y mayor o igual que cero).`,
  },
  {
    id: 'compat',
    question: '¿Qué cambios de una API rompen a quien la usa?',
    conceptId: 'compat',
    cost: 5,
    body: `**Compatibles** (no rompen a un cliente bien hecho):
- Añadir un campo nuevo **opcional**.
- Añadir un endpoint o un parámetro opcional.

**Incompatibles** (rompen):
- Quitar o **renombrar** un campo.
- Cambiar el **tipo** (número → texto) o el formato.
- Hacer obligatorio algo que era opcional.

Un contrato estricto (\`==\`) falla en los dos casos. Tu trabajo es leer el changelog y decidir: si es compatible, actualizas el esquema; si no, es un bug (o una versión nueva anunciada con tiempo).`,
  },
]
