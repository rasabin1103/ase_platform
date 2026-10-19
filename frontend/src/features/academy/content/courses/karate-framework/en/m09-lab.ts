import type { CodeLabModel } from '../../../../karate/types'
import { M09_PATHS, FINAL_MIN_SCENARIOS, m09Lab } from '../m09-lab'
import { filesEn, retosEn } from './shared'

const AUTH = `  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const HEALTH = `Feature: Kobalto Open API · health

${AUTH}

  @smoke
  Scenario: the API is up
    Given path 'health'
    When method get
    Then status 200
    And match response == { status: 'UP', service: 'kobalto-open-api', version: '#string' }
`

const ACCOUNTS = `Feature: Kobalto Open API · accounts

${AUTH}

  @smoke
  Scenario: account detail
    Given path 'accounts', accountId
    When method get
    Then status 200
    And match response contains { id: '#(accountId)', status: 'ACTIVE' }

  Scenario: list of active accounts
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items contains { status: 'ACTIVE' }

  Scenario: pagination
    Given path 'accounts'
    And params { page: 1, size: 2 }
    When method get
    Then status 200
    And match response.items == '#[2]'
`

const BALANCES = `Feature: Kobalto Open API · balances

${AUTH}

  Scenario: a new account has the balance it is created with
    Given path 'sandbox', 'accounts'
    And request { balance: 250.5, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    Given path 'accounts', cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 250.5

  Scenario: the balance goes down on confirm
    Given path 'sandbox', 'accounts'
    And request { balance: 100, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    Given path 'transfers'
    And request { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR' }
    When method post
    Then status 201
    Given path 'transfers', response.id, 'confirm'
    When method post
    Then status 202
    Given path 'accounts', cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 90
`

const ERRORS = `Feature: Kobalto Open API · errors

${AUTH}
    * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }

  Scenario Outline: <caso> → <status> <code>
    Given path <ruta>
    When method get
    Then status <status>
    And match response == errorSchema
    And match response.code == '<code>'

    Examples:
      | caso                   | ruta                    | status | code               |
      | id with invalid format | 'accounts', 'cuenta-1'  | 400    | INVALID_ACCOUNT_ID |
      | nonexistent account    | 'accounts', 'ACC-9999'  | 404    | ACCOUNT_NOT_FOUND  |
      | nonexistent transfer   | 'transfers', 'TRF-9999' | 404    | TRANSFER_NOT_FOUND |
`

const TRANSFERS = `Feature: Kobalto Open API · transfers

${AUTH}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transfer <caso>
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: '<iban>', amount: <amount>, currency: 'EUR' }
    When method post
    Then status 201
    * def id = response.id
    Given path 'transfers', id, 'confirm'
    When method post
    Then status 202
    Given path 'transfers', id
    And retry until response.status == 'COMPLETED'
    When method get
    Then status 200

    Examples:
      | caso             | iban                     | amount |
      | to Kobalto       | ES9121000418450200051333 | 25.5   |
      | to another bank  | ES1420805801101234567891 | 40     |

  Scenario: two pending transfers cannot spend the same balance
    * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }
    Given path 'sandbox', 'accounts'
    And request { balance: 100, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    * def pago = { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 80, currency: 'EUR' }
    Given path 'transfers'
    And request pago
    When method post
    Then status 201
    * def primera = response.id
    Given path 'transfers'
    And request pago
    When method post
    Then status 201
    * def segunda = response.id
    Given path 'transfers', primera, 'confirm'
    When method post
    Then status 202
    Given path 'transfers', segunda, 'confirm'
    When method post
    Then status 422
    And match response == errorSchema
`

/** Iker's PR: it works "on his machine". */
const CARDS = `Feature: cards

${AUTH}

  Scenario: card CRD-1001
    Given url 'https://api.kobalto.test/v1/cards/CRD-1001'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: card CRD-1002
    Given url 'https://api.kobalto.test/v1/cards/CRD-1002'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: card CRD-1003
    Given url 'https://api.kobalto.test/v1/cards/CRD-1003'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: cards of an account
    Given url 'https://api.kobalto.test/v1/cards?accountId=ACC-1001'
    When method get
    Then status 200
`

const LOGIN = (es: string) =>
  es.replace('Feature: login reutilizable', 'Feature: reusable login').replace('Scenario: obtener un token', 'Scenario: get a token')

const NIGHTLY = (es: string) => es.replace('// Job nocturno: toda la regresión, en paralelo.', '// Nightly job: the whole regression, in parallel.')

const original = (path: string) => m09Lab.files.find((f) => f.path === path)!.content

/** IDE for mission 10: the suite's framework (structure, utilities, conventions and review). English text only. */
export const m09LabEn: CodeLabModel = {
  ...m09Lab,
  pipeline: {
    ...m09Lab.pipeline!,
    jobs: m09Lab.pipeline!.jobs.map((j) =>
      j.id === 'nightly' ? { ...j, label: 'Nightly · regression', trigger: 'every night (02:00)' } : { ...j, label: 'PR · smoke', trigger: 'on every pull request' },
    ),
  },
  files: filesEn(m09Lab.files, {
    [M09_PATHS.accounts]: ACCOUNTS,
    [M09_PATHS.balances]: BALANCES,
    [M09_PATHS.cards]: CARDS,
    [M09_PATHS.errors]: ERRORS,
    [M09_PATHS.health]: HEALTH,
    [M09_PATHS.transfers]: TRANSFERS,
    [M09_PATHS.login]: LOGIN(original(M09_PATHS.login)),
    [M09_PATHS.nightly]: NIGHTLY(original(M09_PATHS.nightly)),
  }),
  snippets: [
    { label: 'callSingle', code: "var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);\nkarate.configure('headers', { Authorization: 'Bearer ' + auth.token });" },
    { label: 'read schema', code: "* def errorSchema = read('schemas/error.json')" },
    { label: 'call utility', code: "* def cuenta = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }" },
    { label: '@regression', code: '@regression' },
    { label: '@smoke', code: '@smoke' },
    { label: 'match each', code: "And match each response.items contains { accountId: '#(accountId)' }" },
  ],
  retos: retosEn(m09Lab.retos, {
    callsingle: {
      title: 'One token for the whole suite',
      description: 'With six features and a `callonce` in each one, the suite asks for six tokens… and the API gives five per minute. Request the token **only once per run** with `karate.callSingle` in `karate-config.js` and remove the login from the Backgrounds.',
      hint: "In karate-config.js, before `return config`: `var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);` and `karate.configure('headers', { Authorization: 'Bearer ' + auth.token });`. Then delete the `auth` and `configure headers` lines from every Background.",
    },
    revision: {
      title: 'Iker’s PR',
      description: 'Review `cards.feature` before it goes into the nightly run: no hard-coded URLs or tokens, no copied scenarios, and checking **the body** of every response (the card contract, and that the list only returns cards of the requested account).',
      hint: "`path 'cards', <id>` instead of the URL; no `header Authorization` (the configuration already sets it); a `Scenario Outline` per card with `match response == cardSchema`; and in the list, `param accountId` and `match each response.items contains { accountId: … }`.",
    },
    esquemas: {
      title: 'Schemas in their place',
      description: 'The error schema is copied into several features. Move it to a JSON file in a `schemas/` folder (with **New file**) and load it with `read()` from **at least 2 features**.',
      hint: "Create `openapi/schemas/error.json` with `{ \"code\": \"#string\", \"message\": \"#string\", \"traceId\": \"#uuid\", \"field\": \"##string\" }`. In each feature: `* def errorSchema = read('schemas/error.json')`.",
    },
    utilidades: {
      title: 'A utility for the test data',
      description: 'Creating a test account is copied into several scenarios. Turn it into a reusable feature (`@ignore`) that takes the balance as an argument, and call it from **at least 2 features**.',
      hint: "Create `common/cuenta-prueba.feature` with `@ignore`, `* def saldo = karate.get('balance', 100)`, `Given url baseUrl`, the POST to `sandbox/accounts` and `* def cuenta = response`. Use it with `* def r = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }` and `r.cuenta.id`.",
    },
    convenciones: {
      title: 'The team’s conventions',
      description: 'Iván has published the conventions in the wiki: **every scenario** has `@smoke` or `@regression` (on the `Feature` counts too), and no feature has full URLs or tokens. Apply them to the whole suite.',
      hint: 'One `@regression` above `Feature:` covers all its scenarios; `@smoke` on the essential ones. Remember that Iker’s scenarios count too.',
    },
    final: {
      title: 'The final suite',
      description: `Launch the **nightly** run with the full suite (at least **${FINAL_MIN_SCENARIOS} scenarios**, in parallel and with the build checking for failures) without anything failing because of the tests.`,
      hint: 'Pipeline → “Nightly · regression”. Whatever fails because of a real API bug counts as correct (and report it).',
    },
  }),
}
