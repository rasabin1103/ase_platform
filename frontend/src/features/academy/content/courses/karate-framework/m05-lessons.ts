import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 6). */
export const m05Lessons: Lesson[] = [
  {
    id: 'call',
    question: '¿Cómo reutilizo un feature desde otro?',
    conceptId: 'call',
    cost: 5,
    body: `Con **call** y \`read()\` del feature:
\`\`\`
* def auth = call read('auth/login.feature')
* print auth.token
\`\`\`
Karate ejecuta el feature llamado y devuelve **todas sus variables** en un objeto (\`auth.token\`, \`auth.response\`…). El llamado ve las variables del que llama (\`baseUrl\`, \`clientId\`…).

Si lo llamas sin asignar (\`* call read('auth/login.feature')\`), sus variables —y sus \`configure headers\`— pasan directamente al escenario que llama.`,
  },
  {
    id: 'args',
    question: '¿Cómo le paso datos al feature que llamo?',
    conceptId: 'call',
    cost: 3,
    body: `Con un objeto JSON después de la llamada:
\`\`\`
* def ro = call read('auth/login.feature') { scope: 'accounts:read' }
\`\`\`
Dentro del llamado, cada clave es una variable (\`scope\`) y el objeto entero está en \`__arg\`. Para un valor por defecto si no lo pasan: \`* def scope = karate.get('scope', 'accounts:read transfers:write')\`.`,
  },
  {
    id: 'callonce',
    question: '¿Cuándo uso callonce en lugar de call?',
    conceptId: 'callonce',
    cost: 5,
    body: `**callonce** ejecuta el llamado **una sola vez por feature** y guarda el resultado; las siguientes veces lo reutiliza.
\`\`\`
Background:
  * def auth = callonce read('auth/login.feature')
\`\`\`
Úsalo para lo caro o limitado (pedir un token, crear datos de base). Ojo: lo que devuelve es compartido; si un escenario necesita un token propio (para revocarlo, por ejemplo), usa \`call\` en ese escenario.`,
  },
  {
    id: 'ignore',
    question: '¿Por qué @ignore en el login?',
    conceptId: 'call',
    cost: 3,
    body: `El runner ejecuta **todos** los features de la carpeta. Un feature pensado para ser llamado (login, crear datos) no es un test por sí solo: ejecutado suelto puede fallar o ensuciar el informe.

\`@ignore\` encima de \`Feature:\` lo excluye de la ejecución normal, pero \`call\` lo sigue ejecutando.`,
  },
  {
    id: 'oauth',
    question: '¿Qué hay que probar de la autenticación?',
    conceptId: 'auth',
    cost: 5,
    body: `Además de que el login funciona:
- **Sin token** o con uno inventado: 401.
- **Scopes** (mínimo privilegio): un token sin permiso para algo recibe 403, aunque sea válido.
- **Revocación**: un token revocado deja de funcionar al momento (401).
- **Credenciales incorrectas**: 401 limpio, nunca un 500 con trazas internas.

Son pruebas negativas que no ve nadie que solo use la app: por eso tienen que estar en la suite.`,
  },
]
