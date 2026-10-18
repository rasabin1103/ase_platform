import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 4). */
export const m03Lessons: Lesson[] = [
  {
    id: 'request',
    question: '¿Cómo envío un cuerpo JSON?',
    conceptId: 'payloads',
    cost: 3,
    body: `Con **request** antes de \`method post\` (o put/patch):
\`\`\`
Given path 'transfers'
And request { fromAccount: 'ACC-1001', amount: 25, currency: 'EUR' }
When method post
Then status 201
\`\`\`
Karate pone \`Content-Type: application/json\` solo. Como \`path\`, el cuerpo se reinicia después de cada petición.`,
  },
  {
    id: 'read',
    question: '¿Cómo saco el cuerpo a un fichero?',
    conceptId: 'payloads',
    cost: 5,
    body: `\`read()\` lee un fichero relativo al feature (o con \`classpath:\`):
\`\`\`
* def amount = 150.75
* def body = read('payloads/transfer.json')
\`\`\`
Dentro del JSON, las **expresiones embebidas** \`"#(amount)"\` se sustituyen al leerlo por el valor de la variable (con su tipo: número, no texto). Por eso las variables se definen **antes** del \`read\`.

Con \`##(variable)\` la clave desaparece si la variable es null: útil para campos opcionales.`,
  },
  {
    id: 'chain',
    question: '¿Cómo uso lo que devuelve una petición en la siguiente?',
    conceptId: 'chaining',
    cost: 5,
    body: `Guardándolo con **def** antes de la siguiente petición (después, \`response\` será otra):
\`\`\`
* def transferId = response.id
Given path 'transfers', transferId
When method get
Then status 200
And match response.amount == amount
\`\`\`
Nunca escribas a mano un id que crea el propio test: cada ejecución genera uno nuevo. La cabecera **Location** (\`responseHeaders['Location'][0]\`) también indica dónde está lo creado.`,
  },
  {
    id: 'set',
    question: '¿Cómo cambio un campo del cuerpo para otro caso?',
    conceptId: 'payloads',
    cost: 3,
    body: `- \`* set body.amount = 999999\` cambia un campo.
- \`* remove body.concept\` lo quita (para probar campos obligatorios).
- \`* copy otro = body\` hace una copia independiente (si modificas \`otro\`, \`body\` no cambia).

Así un mismo fichero sirve para el caso feliz y para los negativos.`,
  },
  {
    id: 'effect',
    question: '¿Qué hay que comprobar después de un POST?',
    conceptId: 'chaining',
    cost: 5,
    body: `Por capas:
1. **La respuesta**: 201 y lo que devuelve (\`id\`, \`status\`).
2. **Lo que se guardó**: un GET del recurso creado. La respuesta del POST puede repetir lo que mandaste aunque se haya guardado otra cosa.
3. **El efecto**: lo que cambia en otro sitio (el saldo tras confirmar).
4. **Las reglas**: repetir la operación (idempotencia, 409), límites (sin saldo, 422), datos no válidos (400).`,
  },
  {
    id: 'codes',
    question: '¿Qué significan 201, 400, 409 y 422?',
    conceptId: 'http_codes',
    cost: 3,
    body: `- **201 Created**: recurso creado (suele traer \`Location\`).
- **400 Bad Request**: la petición está mal formada o le faltan campos.
- **404 Not Found**: lo que pides no existe.
- **409 Conflict**: choca con el estado actual (confirmar algo ya confirmado).
- **422 Unprocessable Entity**: la petición es correcta, pero la regla de negocio no lo permite (sin saldo).

Comprobar el **código exacto** importa: los partners programan su app según él.`,
  },
]
