import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { PAYMENTS_BASE, PAYMENTS_BUGS, PROCESSOR_AUTH_PATH, PROCESSOR_TIMEOUT_MS, kobaltoPayments } from '../../../karate/apis/kobaltoPayments'
import { RUNNER_JAVA, correct } from './shared'

export const M07_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M07_PAYMENTS_PATH = 'src/test/java/payments/payments.feature'
export const M07_MOCK_PATH = 'src/test/java/payments/mocks/paynexo.feature'

const CONFIG = `function fn() {
  // Servicio de pagos arrancado en local (mvn spring-boot:run -Plocal).
  // Llama a Paynexo en PROCESSOR_URL=http://localhost:8090.
  var config = {
    baseUrl: '${PAYMENTS_BASE}'
  };
  return config;
}
`

const PAYMENTS = `Feature: pagos con tarjeta (servicio de pagos en local)

  Background:
    * url baseUrl
    # El servicio llama a Paynexo en localhost:8090: ahí arrancamos el mock.
    # Una sola vez por feature (callonce): el puerto no se puede ocupar dos veces.
    * def startMock = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }
    * def mock = callonce startMock

  Scenario: pago aprobado
    Given path 'cards', 'CRD-1001', 'payments'
    And request { amount: 25.5, currency: 'EUR', merchant: 'Café Central' }
    When method post
    Then status 201
    And match response.status == 'APPROVED'
`

const MOCK = `@ignore
Feature: mock de Paynexo (procesador de tarjetas)

  # Cada Scenario es una condición sobre la petición que llega al mock.
  # Gana el PRIMERO que se cumple. Responde con response, responseStatus,
  # responseHeaders y responseDelay (ms).
  # El de abajo, sin condición, recoge todo lo demás.

  Background:
    * print 'mock de Paynexo arrancado'

  Scenario:
    * def responseStatus = 501
    * def response = { error: 'not_implemented', detail: 'el mock todavía no sabe responder a esto' }
`

const PAY_PATH = /^\/v1\/cards\/[^/]+\/payments$/
const payments = (sc: ScenarioResult) => sc.requests.filter((r) => r.method === 'POST' && PAY_PATH.test(r.path))
const body = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const authCalls = (sc: ScenarioResult) => sc.mockCalls.filter((c) => c.path === PROCESSOR_AUTH_PATH)
const mockSources = (files: Record<string, string>) => Object.entries(files).filter(([p, c]) => p.endsWith('.feature') && /pathMatches|methodIs|^\s*Scenario:\s*$/m.test(c)).map(([, c]) => c)

/** IDE de la misión 8: mocks de Karate para el procesador de tarjetas. */
export const m07Lab: CodeLabModel = {
  server: () => kobaltoPayments(),
  config: { baseUrl: PAYMENTS_BASE },
  env: 'local',
  configFile: M07_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M07_PAYMENTS_PATH, content: PAYMENTS },
    { path: M07_MOCK_PATH, content: MOCK },
    { path: M07_CONFIG_PATH, content: CONFIG, readOnly: true },
    { ...RUNNER_JAVA, path: 'src/test/java/payments/PaymentsTest.java', content: RUNNER_JAVA.content.replace('package openapi;', 'package payments;').replace('class OpenApiTest', 'class PaymentsTest').replace('-Dtest=OpenApiTest', '-Dtest=PaymentsTest') },
  ],
  snippets: [
    { label: 'aprobar', code: "Scenario: pathMatches('/v2/authorizations') && methodIs('post')\n  * def response = { result: 'APPROVED', authCode: 'A1B2C3' }" },
    { label: 'denegar', code: "Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'\n  * def response = { result: 'DECLINED', reason: 'INSUFFICIENT_FUNDS' }" },
    { label: 'responseStatus', code: '* def responseStatus = 503' },
    { label: 'responseDelay', code: '* def responseDelay = 5000' },
    { label: 'validar petición', code: "Scenario: pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass\n  * def responseStatus = 400\n  * def response = { error: 'invalid_request' }" },
    { label: 'karate.start', code: "* def startMock = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }\n* def mock = callonce startMock" },
  ],
  retos: [
    {
      id: 'mock',
      title: 'Tu primer mock',
      description: 'Enseña al mock a **aprobar**: un `Scenario` para `POST /v2/authorizations` que responda `{ result: \'APPROVED\', authCode: … }`. El pago de la tarjeta CRD-1001 debe salir **201 APPROVED** con ese authCode.',
      hint: "Encima del escenario sin condición: `Scenario: pathMatches('/v2/authorizations') && methodIs('post')` y dentro `* def response = { result: 'APPROVED', authCode: 'A1B2C3' }`. El orden importa: gana el primero que se cumple.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.statusChecks.includes(201) &&
            authCalls(sc).length > 0 &&
            // Pasa con el aprobado, o falla solo por un bug real del servicio.
            ((sc.status === 'passed' && payments(sc).some((r) => r.status === 201 && body(r.responseBody).status === 'APPROVED')) || sc.revealed.length > 0),
        ),
    },
    {
      id: 'denegado',
      title: 'Pago denegado',
      description: 'Paynexo deniega con `{ result: \'DECLINED\', reason: … }`. Haz que el mock deniegue (por ejemplo, según el comercio) y comprueba que Kobalto responde **422** `PAYMENT_DECLINED` con el **mismo motivo** (`reason`).',
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'` con `reason: 'INSUFFICIENT_FUNDS'`. En el test: `match response.reason == 'INSUFFICIENT_FUNDS'`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            payments(sc).some((r) => r.status === 422 && body(r.responseBody).code === 'PAYMENT_DECLINED') &&
            sc.statusChecks.includes(422) &&
            sc.matches.some((m) => /reason/.test(m.lhs) || m.rhsKeys.includes('reason')) &&
            correct(sc, PAYMENTS_BUGS.motivo),
        ),
    },
    {
      id: 'caida',
      title: 'Paynexo falla',
      description: 'Si Paynexo responde con un **5xx**, Kobalto debe devolver **502** `PROCESSOR_ERROR`. Simúlalo con `responseStatus` en el mock.',
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'` con `* def responseStatus = 503`. En el test: `status 502` y `match response.code == 'PROCESSOR_ERROR'`.",
      check: (scs) =>
        scs.some((sc) => correct(sc) && sc.statusChecks.includes(502) && authCalls(sc).some((c) => c.status >= 500) && payments(sc).some((r) => r.status === 502)),
    },
    {
      id: 'tabla',
      title: 'Un comercio por caso',
      description: 'Junta los casos en un `Scenario Outline`: al menos **4 filas** que lleven al mock por caminos distintos y **3 códigos** de Kobalto diferentes (201, 422, 502…).',
      hint: 'Columnas `merchant`, `status` (y lo que necesites). En el mock, una condición por comercio (`request.merchant == …`).',
      check: (scs) => {
        const rows = scs.filter((sc) => sc.outline && correct(sc) && payments(sc).length > 0 && authCalls(sc).length > 0)
        const statuses = new Set(rows.flatMap((sc) => payments(sc).map((r) => r.status)))
        return rows.length >= 4 && statuses.size >= 3
      },
    },
    {
      id: 'lento',
      title: 'Paynexo tarda',
      description: `Carmen: el servicio espera a Paynexo **${PROCESSOR_TIMEOUT_MS / 1000} s** como mucho. Si tarda más, el pago debe fallar con **504** \`PROCESSOR_TIMEOUT\`, nunca aprobarse. Simula la lentitud con \`responseDelay\`.`,
      hint: "`Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'` con `* def responseDelay = 5000` y una respuesta de aprobado. En el test: `status 504`.",
      visibleWhen: { kind: 'flag', key: 'carmen.timeout' },
      check: (scs) => scs.some((sc) => authCalls(sc).some((c) => c.delay > PROCESSOR_TIMEOUT_MS) && sc.statusChecks.includes(504) && correct(sc, PAYMENTS_BUGS.timeout)),
    },
    {
      id: 'contrato',
      title: 'El mock vigila el contrato',
      description: 'Nico: Paynexo v2 recibe el importe en **céntimos enteros** (25,50 € → 2550) y rechaza con **400** lo demás. Haz que tu mock valide la petición con un esquema y responda 400 si no lo cumple; después, un pago **con decimales** debe seguir saliendo 201.',
      hint: "Background: `* def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', merchant: '#string', cardToken: '#string', reference: '#string' }`. Primer escenario: `pathMatches('/v2/authorizations') && !karate.match(request, authRequest).pass` → `responseStatus = 400`.",
      visibleWhen: { kind: 'flag', key: 'nico.centimos' },
      check: (scs, _f, ctx) =>
        mockSources(ctx.files).some((c) => /responseStatus\s*=\s*400/.test(c) && /karate\.match|#\?|%\s*1/.test(c)) &&
        scs.some(
          (sc) =>
            payments(sc).some((r) => {
              const a = body(r.body).amount
              return typeof a === 'number' && Math.abs(a % 1) > 1e-9
            }) &&
            authCalls(sc).length > 0 &&
            sc.statusChecks.includes(201) &&
            correct(sc, PAYMENTS_BUGS.unidades),
        ),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M07_SOLUTION_MOCK = `@ignore
Feature: mock de Paynexo (procesador de tarjetas)

  Background:
    * def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', merchant: '#string', cardToken: '#string', reference: '#string' }

  Scenario: pathMatches('/v2/authorizations') && methodIs('post') && !karate.match(request, authRequest).pass
    * def responseStatus = 400
    * def response = { error: 'invalid_request', detail: 'request does not match the v2 schema' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'
    * def response = { result: 'DECLINED', reason: 'INSUFFICIENT_FUNDS' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'
    * def responseStatus = 503
    * def response = { error: 'service_unavailable' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'
    * def responseDelay = 5000
    * def response = { result: 'APPROVED', authCode: 'L3NT00' }

  Scenario: pathMatches('/v2/authorizations') && methodIs('post')
    * def response = { result: 'APPROVED', authCode: 'A1B2C3' }

  Scenario:
    * def responseStatus = 501
    * def response = { error: 'not_implemented' }
`

export const M07_SOLUTION_PAYMENTS = `Feature: pagos con tarjeta (servicio de pagos en local)

  Background:
    * url baseUrl
    * def startMock = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }
    * def mock = callonce startMock

  Scenario Outline: Paynexo responde «<caso>» → <status>
    Given path 'cards', 'CRD-1001', 'payments'
    And request { amount: <amount>, currency: 'EUR', merchant: '<merchant>' }
    When method post
    Then status <status>
    And match response contains <esperado>

    Examples:
      | caso      | merchant     | amount | status | esperado!                                                       |
      | aprobado  | Café Central | 25.5   | 201    | { status: 'APPROVED', authCode: 'A1B2C3' }                      |
      | denegado  | DENEGADO     | 10     | 422    | { code: 'PAYMENT_DECLINED', reason: 'INSUFFICIENT_FUNDS' }      |
      | caído     | CAIDO        | 10     | 502    | { code: 'PROCESSOR_ERROR' }                                     |
      | lento     | LENTO        | 10     | 504    | { code: 'PROCESSOR_TIMEOUT' }                                   |
`
