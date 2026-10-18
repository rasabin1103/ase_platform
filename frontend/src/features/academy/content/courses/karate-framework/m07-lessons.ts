import type { Lesson } from '../../../engine/types'

/** Microlecciones de Sergio (curso de Karate · misión 8). */
export const m07Lessons: Lesson[] = [
  {
    id: 'mock',
    question: '¿Cómo se escribe un mock en Karate?',
    conceptId: 'mock',
    cost: 5,
    body: `Es un \`.feature\` en el que **cada Scenario es una condición** sobre la petición que llega:
\`\`\`
Scenario: pathMatches('/v2/authorizations') && methodIs('post')
  * def response = { result: 'APPROVED', authCode: 'A1B2C3' }
\`\`\`
Gana **el primero que se cumple**. Dentro tienes \`request\`, \`requestHeaders\`, \`pathParams\`… y respondes con \`response\`, \`responseStatus\` (200 por defecto), \`responseHeaders\` y \`responseDelay\`.

Un \`Scenario:\` sin condición, al final, recoge todo lo demás. Y \`@ignore\` en el mock, para que el runner no lo ejecute como un test.`,
  },
  {
    id: 'start',
    question: '¿Cómo arranco el mock desde un test?',
    conceptId: 'mock',
    cost: 3,
    body: `Con **karate.start**:
\`\`\`
* def mock = karate.start({ mock: 'mocks/paynexo.feature', port: 8090 })
\`\`\`
Sin \`port\`, elige uno libre (\`mock.port\`). Con puerto fijo —el que espera el servicio que pruebas— solo se puede arrancar **una vez**: si lo pones tal cual en el Background, el segundo escenario falla con *BindException*. Por eso se envuelve en una función y se llama con \`callonce\`.`,
  },
  {
    id: 'casos',
    question: '¿Cómo provoco cada respuesta del tercero?',
    conceptId: 'mock',
    cost: 5,
    body: `Elige un dato de la petición que tú controlas desde el test (el comercio, el importe, una cabecera) y haz una condición por caso:
\`\`\`
Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'
  * def responseStatus = 503
Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'
  * def responseDelay = 5000
\`\`\`
Así un \`Scenario Outline\` recorre todos los caminos: aprobado, denegado, error, lentitud.`,
  },
  {
    id: 'contrato',
    question: '¿Por qué validar la petición en el mock?',
    conceptId: 'dobles',
    cost: 5,
    body: `Un mock que lo aprueba todo esconde los errores de **lo que enviamos**. Si el tercero real rechazaría la petición, tu mock también debe hacerlo:
\`\`\`
Background:
  * def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', … }
Scenario: pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass
  * def responseStatus = 400
\`\`\`
\`karate.match(actual, esperado)\` devuelve \`{ pass, message }\`: el mismo match de siempre, sin hacer fallar nada.`,
  },
  {
    id: 'dobles',
    question: '¿Un mock sustituye al servicio real?',
    conceptId: 'dobles',
    cost: 3,
    body: `No. El mock responde **lo que tú crees** que hace el tercero. Sirve para lo que el real no te deja: casos raros a voluntad, rapidez, independencia de su disponibilidad.

Pero hay que contrastarlo: una prueba corta contra el sandbox real (o un contrato compartido) confirma que el mock dice la verdad. Sin eso, puedes tener una suite verde contra un Paynexo imaginario.`,
  },
]
