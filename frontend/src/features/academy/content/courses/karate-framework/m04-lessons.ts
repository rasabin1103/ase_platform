import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 5). */
export const m04Lessons: Lesson[] = [
  {
    id: 'outline',
    question: '¿Cómo funciona un Scenario Outline?',
    conceptId: 'outline',
    cost: 5,
    body: `Es una plantilla: los pasos con huecos \`<columna>\` y una tabla **Examples** con una fila por caso. Karate genera un escenario por fila.
\`\`\`
Scenario Outline: importe <amount> → <status>
  * def body = read('payloads/transfer.json')
  Given path 'transfers'
  And request body
  When method post
  Then status <status>

  Examples:
    | amount! | status |
    | 0.01    | 201    |
    | 1000.01 | 422    |
\`\`\`
Cada columna es también una **variable** (\`amount\`, \`status\`). Pon los datos en el título para reconocer la fila en el informe.`,
  },
  {
    id: 'types',
    question: '¿Por qué mi importe llega como texto?',
    conceptId: 'outline',
    cost: 3,
    body: `Las celdas de una tabla son **texto**: \`| 500 |\` es \`"500"\`. Si lo mandas en un JSON, la API recibe un string y responde 400.

Con **!** al final del nombre de la columna (\`amount!\`), Karate evalúa la celda: \`500\` es un número, \`true\` un booleano y \`{ a: 1 }\` un objeto. En \`<amount>\` el nombre va sin la exclamación.`,
  },
  {
    id: 'boundaries',
    question: '¿Qué datos pongo en la tabla?',
    conceptId: 'boundaries',
    cost: 5,
    body: `**Análisis de valores límite**: para cada regla con un rango, el valor justo dentro y justo fuera de cada borde.
- Mínimo 0,01 €: **0** (fuera) y **0,01** (dentro).
- Máximo 1.000 €: **1.000** (dentro) y **1.000,01** (fuera).
- Texto de hasta 140: **140** y **141** caracteres.

Un valor del medio (500) solo comprueba lo fácil. Los errores típicos (\`>\` en vez de \`>=\`) solo se ven en el borde exacto.`,
  },
  {
    id: 'dynamic',
    question: '¿Puedo tener los datos en un fichero?',
    conceptId: 'outline',
    cost: 5,
    body: `Sí: **Examples dinámicos**. Una sola celda con una expresión que devuelve una lista de objetos:
\`\`\`
Examples:
  | read('data/negativos.json') |
\`\`\`
Cada objeto es una fila y cada clave una variable **con su tipo** (números, objetos…), sin \`!\`. Así los datos los puede mantener alguien que no toca el feature, y crecen sin tocar los pasos.`,
  },
  {
    id: 'merge',
    question: '¿Cómo cambio solo un campo del cuerpo en cada fila?',
    conceptId: 'outline',
    cost: 3,
    body: `Con **karate.merge**: mezcla objetos y el último gana.
\`\`\`
* def body = karate.merge(read('payloads/transfer.json'), patch)
\`\`\`
con \`"patch": { "fromAccount": "ACC-1004" }\` en la fila. O con \`* set body.campo = valor\`.

Para textos largos, \`'x'.repeat(140)\` genera 140 caracteres sin escribirlos.`,
  },
]
