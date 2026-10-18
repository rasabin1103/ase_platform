import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { KARATE_CONFIG, RUNNER_JAVA, correct } from './shared'

export const M03_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M03_FEATURE_PATH = 'src/test/java/openapi/transfers.feature'
export const M03_PAYLOAD_PATH = 'src/test/java/openapi/payloads/transfer.json'

const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001'
  };
  return config;
}
`

const FEATURE = `Feature: Kobalto Open API · transferencias

  # Hoy: crear (POST), leer (GET) y confirmar una transferencia.
  # La especificación está en la wiki: «Transferencias (beta)».

  Background:
    * url baseUrl

  Scenario: crear una transferencia
    Given path 'transfers'
    And request { fromAccount: 'ACC-1001', toIban: 'ES9121000418450200051333', amount: 25, currency: 'EUR', concept: 'Prueba QA' }
    When method post
    # Comprueba aquí el código y la respuesta.
`

const PAYLOAD = `{
  "fromAccount": "ACC-1001",
  "toIban": "ES9121000418450200051333",
  "amount": 25,
  "currency": "EUR",
  "concept": "Prueba QA"
}
`

const TRANSFER = /^\/v1\/transfers\/TRF-\d+$/
const CONFIRM = /^\/v1\/transfers\/TRF-\d+\/confirm$/
const features = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.feature')).map(([, c]) => c)
const created = (sc: ScenarioResult) => sc.requests.findIndex((r) => r.method === 'POST' && r.path === '/v1/transfers' && r.status === 201)

/** IDE de la misión 4: POST, payloads en ficheros, expresiones embebidas y encadenar peticiones. */
export const m03Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5' }),
  config: KARATE_CONFIG,
  configFile: M03_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M03_FEATURE_PATH, content: FEATURE },
    { path: M03_PAYLOAD_PATH, content: PAYLOAD },
    { path: M03_CONFIG_PATH, content: CONFIG, readOnly: true },
    RUNNER_JAVA,
  ],
  snippets: [
    { label: 'request', code: "And request { fromAccount: accountId, toIban: 'ES9121000418450200051333', amount: 25, currency: 'EUR' }" },
    { label: 'method post', code: 'When method post' },
    { label: 'status 201', code: 'Then status 201' },
    { label: 'read()', code: "* def body = read('payloads/transfer.json')" },
    { label: '#(var)', code: '"#(amount)"' },
    { label: 'def id', code: '* def transferId = response.id' },
    { label: 'path id', code: "Given path 'transfers', transferId" },
    { label: 'set', code: "* set body.amount = 150.75" },
  ],
  retos: [
    {
      id: 'crear',
      title: 'Crear una transferencia',
      description: '`POST /transfers` con un cuerpo JSON (`request`): comprueba que responde **201** y que la transferencia nace con `status` `PENDING` y un `id`.',
      hint: "Después de `When method post`: `Then status 201` y `And match response contains { id: '#string', status: 'PENDING' }`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            correct(sc) &&
            created(sc) >= 0 &&
            sc.statusChecks.includes(201) &&
            sc.matches.some((m) => m.pass && (/PENDING/.test(m.text) || m.rhsKeys.includes('status'))),
        ),
    },
    {
      id: 'fichero',
      title: 'El cuerpo en un fichero',
      description: 'Mueve el cuerpo a `payloads/transfer.json` y léelo con `read()`. Para que sirva en cualquier test, pon **expresiones embebidas** (`"#(amount)"`) en lugar de valores fijos.',
      hint: "En el JSON: `\"amount\": \"#(amount)\"`. En el escenario, antes de leerlo: `* def amount = 25` y luego `* def body = read('payloads/transfer.json')` y `And request body`.",
      check: (scs, _f, ctx) =>
        features(ctx.files).some((c) => /read\(\s*['"][^'"]+\.json['"]\s*\)/.test(c)) &&
        Object.entries(ctx.files).some(([p, c]) => p.endsWith('.json') && c.includes('#(')) &&
        scs.some((sc) => created(sc) >= 0 && correct(sc)),
    },
    {
      id: 'encadenar',
      title: 'Crear y leer: encadenar',
      description: 'Un 201 dice que se creó, no qué se guardó. Guarda el `id` de la respuesta (`def`) y léela con `GET /transfers/{id}`: el `amount` tiene que ser **exactamente** el que enviaste. Prueba con decimales (150.75).',
      hint: '`* def transferId = response.id`, luego `Given path \'transfers\', transferId` · `When method get` · `Then status 200` · `And match response.amount == amount`. Nada de ids escritos a mano: cada ejecución crea uno nuevo.',
      check: (scs, _f, ctx) =>
        !features(ctx.files).some((c) => /TRF-\d+/.test(c)) &&
        scs.some((sc) => {
          const i = created(sc)
          return i >= 0 && sc.requests.slice(i + 1).some((r) => r.method === 'GET' && TRANSFER.test(r.path)) && sc.matches.some((m) => /amount/.test(m.text)) && correct(sc, KOBALTO_API_BUGS.importe)
        }),
    },
    {
      id: 'confirmar',
      title: 'Confirmar y ver el efecto',
      description: 'Confirma la transferencia (`POST /transfers/{id}/confirm` → `COMPLETED`) y comprueba el **efecto**: el saldo disponible de la cuenta (`GET /accounts/{id}/balance`) baja exactamente el importe.',
      hint: "Lee el saldo antes (`* def before = response.available`), crea y confirma, y vuelve a leerlo: `And match response.available == before - amount`.",
      check: (scs) =>
        scs.some((sc) => {
          const conf = sc.requests.findIndex((r) => r.method === 'POST' && CONFIRM.test(r.path) && r.status === 200)
          const balanceBefore = sc.requests.findIndex((r) => r.method === 'GET' && /\/balance$/.test(r.path))
          const balanceAfter = sc.requests.findIndex((r, i) => i > conf && r.method === 'GET' && /\/balance$/.test(r.path))
          return conf >= 0 && balanceBefore >= 0 && balanceBefore < conf && balanceAfter > conf && sc.matches.some((m) => /available/.test(m.text)) && correct(sc)
        }),
    },
    {
      id: 'doble',
      title: 'Confirmar dos veces',
      description: 'Carmen pregunta qué pasa si un partner reintenta la confirmación. Según la especificación, la segunda confirmación responde **409** `TRANSFER_ALREADY_COMPLETED` y no vuelve a cobrar.',
      hint: 'En el mismo escenario: crea, confirma (200) y vuelve a confirmar el mismo `transferId`: `Then status 409` y `match response.code == \'TRANSFER_ALREADY_COMPLETED\'`.',
      visibleWhen: { kind: 'flag', key: 'carmen.double' },
      check: (scs) =>
        scs.some((sc) => {
          const confirms = sc.requests.filter((r) => r.method === 'POST' && CONFIRM.test(r.path))
          return confirms.length >= 2 && confirms[0].path === confirms[1].path && sc.statusChecks.includes(409) && correct(sc, KOBALTO_API_BUGS.doble)
        }),
    },
    {
      id: 'fondos',
      title: 'Sin saldo',
      description: 'Un partner pregunta qué devolvemos si el cliente no tiene dinero suficiente. Prueba una transferencia por **más** del saldo disponible: **422** `INSUFFICIENT_FUNDS`.',
      hint: "Con `set` cambias un campo del cuerpo: `* set body.amount = 999999`. O usa ACC-1002, que tiene saldo 0.",
      visibleWhen: { kind: 'flag', key: 'alba.funds' },
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.requests.some((r) => r.method === 'POST' && r.path === '/v1/transfers') &&
            sc.statusChecks.includes(422) &&
            // El match puede no llegar a ejecutarse si el status ya falla: se mira el paso escrito.
            sc.steps.some((st) => st.text.startsWith('match') && st.text.includes('INSUFFICIENT_FUNDS')) &&
            correct(sc, KOBALTO_API_BUGS.fondos),
        ),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M03_SOLUTION_PAYLOAD = `{
  "fromAccount": "#(accountId)",
  "toIban": "ES9121000418450200051333",
  "amount": "#(amount)",
  "currency": "EUR",
  "concept": "Prueba QA"
}
`

export const M03_SOLUTION_FEATURE = `Feature: Kobalto Open API · transferencias

  Background:
    * url baseUrl

  Scenario: crear y leer una transferencia
    * def amount = 150.75
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status 201
    And match response contains { id: '#string', status: 'PENDING' }
    * def transferId = response.id
    Given path 'transfers', transferId
    When method get
    Then status 200
    And match response.amount == amount

  Scenario: confirmar descuenta el saldo y no se cobra dos veces
    Given path 'accounts', accountId, 'balance'
    When method get
    * def before = response.available
    * def amount = 40
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status 201
    * def transferId = response.id
    Given path 'transfers', transferId, 'confirm'
    When method post
    Then status 200
    And match response.status == 'COMPLETED'
    Given path 'accounts', accountId, 'balance'
    When method get
    And match response.available == before - amount
    Given path 'transfers', transferId, 'confirm'
    When method post
    Then status 409
    And match response.code == 'TRANSFER_ALREADY_COMPLETED'

  Scenario: sin saldo suficiente
    * def amount = 25
    * def body = read('payloads/transfer.json')
    * set body.amount = 999999
    Given path 'transfers'
    And request body
    When method post
    Then status 422
    And match response.code == 'INSUFFICIENT_FUNDS'
`
