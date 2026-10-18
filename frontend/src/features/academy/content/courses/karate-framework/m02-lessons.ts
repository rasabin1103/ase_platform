import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 3). */
export const m02Lessons: Lesson[] = [
  {
    id: 'config',
    question: '¿Qué es karate-config.js?',
    conceptId: 'config',
    cost: 5,
    body: `Un fichero en la raíz de los tests con **una función** que Karate ejecuta **antes de cada escenario**. Lo que devuelve son variables globales para todos los features.
\`\`\`
function fn() {
  var env = karate.env || 'sandbox';
  var config = { baseUrl: 'https://api.kobalto.test/v1' };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
  }
  return config;
}
\`\`\`
Los features usan \`baseUrl\` sin saber de dónde sale. Un error aquí hace fallar **todos** los escenarios: si todo se pone en rojo de golpe, mira la config.`,
  },
  {
    id: 'env',
    question: '¿Cómo elijo el entorno al ejecutar?',
    conceptId: 'config',
    cost: 3,
    body: `Con la propiedad del sistema **karate.env**:
\`\`\`
mvn test -Dkarate.env=pre
\`\`\`
Dentro de la config la lees con \`karate.env\` (vale \`null\` si no se indica, de ahí el \`|| 'sandbox'\`). En el IDE, el selector \`-Dkarate.env=\` de arriba hace lo mismo.`,
  },
  {
    id: 'headers',
    question: '¿Cómo mando una cabecera en todas las peticiones?',
    conceptId: 'headers',
    cost: 5,
    body: `- **header** \`x-api-key = 'abc'\`: solo para la siguiente petición.
- **configure headers**: para todas. En la config: \`karate.configure('headers', { 'x-api-key': key })\`. En un feature: \`* configure headers = { … }\`.
- También admite una **función** que se evalúa en cada petición (útil para tokens que cambian).
- Para quitar una cabecera configurada en un escenario concreto: \`header x-api-key = null\`.`,
  },
  {
    id: 'secrets',
    question: '¿Dónde pongo la clave de la API?',
    conceptId: 'secrets',
    cost: 5,
    body: `**Nunca en el código.** Lo que entra en Git lo lee cualquiera con acceso y queda en el historial aunque lo borres.

El pipeline la guarda en su gestor de secretos y la pasa al ejecutar:
\`\`\`
mvn test -Dkarate.env=pre -Dkobalto.apiKey=$KOBALTO_PRE_KEY
\`\`\`
En la config: \`karate.properties['kobalto.apiKey']\`. Si una clave llega a publicarse, se **rota** (se cambia) inmediatamente.`,
  },
  {
    id: 'env_data',
    question: '¿Y los datos que cambian de un entorno a otro?',
    conceptId: 'env_data',
    cost: 3,
    body: `Cada entorno tiene sus datos: ACC-1001 existe en sandbox pero no en pre. Lo que dependa del entorno va a la config:
\`\`\`
config.accountId = env == 'pre' ? 'ACC-2001' : 'ACC-1001';
\`\`\`
y el feature usa \`Given path 'accounts', accountId\`.

Para un escenario que solo tiene sentido en un entorno: \`* if (karate.env != 'pre') karate.abort()\` como primer paso (termina el escenario sin fallo), o un tag como \`@pre\` y filtrar por tags en el pipeline.`,
  },
  {
    id: 'response_headers',
    question: '¿Cómo compruebo una cabecera de la respuesta?',
    conceptId: 'headers',
    cost: 3,
    body: `Las cabeceras de la respuesta están en **responseHeaders**, y cada una es una **lista** (una cabecera puede repetirse):
\`\`\`
And match responseHeaders['x-correlation-id'][0] == correlationId
\`\`\`
Si la cabecera no llega, \`responseHeaders['x-correlation-id']\` no existe y el paso falla al leer \`[0]\`: la consola te enseña qué cabeceras volvieron (\`1 < …\`).`,
  },
]
