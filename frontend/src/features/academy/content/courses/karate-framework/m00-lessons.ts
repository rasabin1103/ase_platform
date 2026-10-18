import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 1). */
export const m00Lessons: Lesson[] = [
  {
    id: 'why_karate',
    question: '¿Por qué Karate y no Postman o RestAssured?',
    conceptId: 'api_automation',
    cost: 5,
    body: `- **Postman** es genial para explorar una API a mano, pero sus colecciones se quedan cortas para una suite grande y versionada con el código.
- **RestAssured** es potente, pero cada test es código Java: cuesta leerlo si no programas.
- **Karate** escribe los tests en un lenguaje casi natural (Gherkin), ya trae HTTP, JSON y aserciones, y se ejecuta con JUnit en el pipeline. No hay que programar *step definitions* como en Cucumber.

Lo importante no es la herramienta: es que los tests se ejecuten **solos en cada despliegue**.`,
  },
  {
    id: 'anatomy',
    question: '¿Cómo se lee un feature de Karate?',
    conceptId: 'feature_anatomy',
    cost: 5,
    body: `\`\`\`
Feature: lo que se prueba
  Scenario: un comportamiento
    Given url baseUrl
    And path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
\`\`\`
- **url** y **path** construyen la dirección (los segmentos de path se unen con «/»).
- **method** lanza la petición. Antes de él no ha pasado nada.
- La respuesta queda en la variable **response** (JSON ya parseado) y el código en **responseStatus**.
- **status** y **match** comprueban: si fallan, el escenario se para ahí.`,
  },
  {
    id: 'gwt',
    question: '¿Importa si pongo Given, When, Then o *?',
    conceptId: 'feature_anatomy',
    cost: 3,
    body: `No para Karate: **Given, When, Then, And, But y \`*\`** son equivalentes, solo ayudan a leer. La costumbre:
- **Given** para preparar (url, path, param, request).
- **When** para la acción (method).
- **Then / And** para las comprobaciones.
- **\`*\`** para pasos de apoyo (def, print, url en el Background).

Lo que sí importa: Karate distingue mayúsculas (**Given**, no *given*) y cada paso empieza por una palabra clave.`,
  },
  {
    id: 'match',
    question: '¿Qué hace exactamente match?',
    conceptId: 'assertions',
    cost: 5,
    body: `**match** compara un valor real con uno esperado y, si no coinciden, falla con un mensaje claro:
\`\`\`
match failed: EQUALS
  $ | not equal (STRING:STRING)
  'ACTIVE'
  'BLOCKED'
\`\`\`
Primero el valor **real**, después el **esperado**.

- \`match response.status == 'UP'\` compara un campo.
- \`match response == { ... }\` compara la respuesta entera (mañana lo verás a fondo).
- \`status 200\` solo mira el código HTTP: un 200 con datos erróneos lo pasaría. Por eso casi siempre van **status + match**.`,
  },
  {
    id: 'background',
    question: '¿Para qué sirve el Background?',
    conceptId: 'background',
    cost: 3,
    body: `Los pasos del **Background:** se ejecutan **antes de cada escenario** (no una vez por fichero). Es el sitio para lo que todos comparten, como \`* url baseUrl\`.

Ventajas: menos repetición y un único sitio para cambiar. Recuerda que cada escenario es **independiente**: no cuentes con que otro escenario se haya ejecutado antes.`,
  },
  {
    id: 'red',
    question: 'Mi test falla: ¿es el test o es la API?',
    conceptId: 'red_test',
    cost: 5,
    body: `Antes de culpar a nadie:
1. **Lee el mensaje** del informe y la **consola**: qué se envió y qué volvió.
2. Compara con la **especificación** (wiki): ¿qué debería responder la API?
3. Si tu test pide algo que la especificación no dice, el fallo es del test: corrígelo.
4. Si el test pide lo correcto y la API no lo cumple, es un **bug**: repórtalo con el escenario como evidencia, la respuesta esperada y la obtenida.

Un test que falla por un bug **no se cambia para que pase**: se queda en rojo hasta que lo arreglen.`,
  },
]
