import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 10). */
export const m09Lessons: Lesson[] = [
  {
    id: 'callsingle',
    question: '¿callonce o callSingle?',
    conceptId: 'callsingle',
    cost: 5,
    body: `- **callonce**: una vez **por feature**. Seis features, seis ejecuciones.
- **karate.callSingle**: una vez **por ejecución**, para todos los features y todos los hilos.

Lo normal es usarlo en \`karate-config.js\` y pasarle lo que necesita, porque el llamado no ve la configuración:
\`\`\`
var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);
karate.configure('headers', { Authorization: 'Bearer ' + auth.token });
\`\`\`
Así ningún feature tiene que acordarse del login.`,
  },
  {
    id: 'estructura',
    question: '¿Cómo organizo los ficheros de la suite?',
    conceptId: 'estructura',
    cost: 5,
    body: `Una estructura que cualquiera entienda a la primera:
\`\`\`
src/test/java/
  karate-config.js        ← entorno, login (callSingle), cabeceras
  common/                 ← utilidades reutilizables (@ignore)
  openapi/
    accounts.feature …    ← un feature por recurso
    auth/login.feature    ← @ignore
    schemas/*.json        ← contratos reutilizables
    OpenApiRunner.java
\`\`\`
Un esquema JSON se lee con \`read('schemas/error.json')\` (ruta relativa al feature) o \`read('classpath:openapi/schemas/error.json')\`.`,
  },
  {
    id: 'utilidades',
    question: '¿Cómo hago una utilidad reutilizable?',
    conceptId: 'estructura',
    cost: 3,
    body: `Un feature con \`@ignore\` que hace una sola cosa y recibe argumentos:
\`\`\`
@ignore
Feature: utilidad · crear una cuenta de prueba
  Scenario:
    * def saldo = karate.get('balance', 100)
    Given url baseUrl
    And path 'sandbox', 'accounts'
    …
    * def cuenta = response
\`\`\`
Se usa con \`* def r = call read('classpath:common/cuenta-prueba.feature') { balance: 250 }\` y \`r.cuenta.id\`. Si mañana cambia cómo se crean las cuentas, se toca un solo fichero.`,
  },
  {
    id: 'revision',
    question: '¿Qué miro al revisar los tests de otro?',
    conceptId: 'revision',
    cost: 5,
    body: `No basta con que pasen. Pregúntate **qué fallaría si la API se rompiera**:
- ¿Comprueba el **cuerpo** o solo el status? \`print\` no comprueba nada.
- ¿Hay URLs, tokens o datos **pegados** que caducan o cambian por entorno?
- ¿Escenarios **copiados** que deberían ser un Outline?
- ¿Depende de datos que otros tests cambian?

Un test que siempre pasa no protege nada. Y explica el porqué de cada comentario: quien escribe la PR también aprende.`,
  },
  {
    id: 'convenciones',
    question: '¿Para qué sirven unas convenciones?',
    conceptId: 'convenciones',
    cost: 3,
    body: `Para que la suite parezca escrita por una sola persona y las revisiones vayan a lo importante. Pocas, escritas y comprobables:
- Todo escenario con \`@smoke\` o \`@regression\` (los jobs dependen de ello).
- Nada de URLs completas ni secretos en los features.
- Datos propios por escenario.
- Contratos en \`schemas/\`, utilidades en \`common/\`.`,
  },
]
