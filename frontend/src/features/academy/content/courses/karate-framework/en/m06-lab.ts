import type { CodeLabModel } from '../../../../karate/types'
import { M06_ERRORS_PATH, M06_LOGIN_PATH, M06_TRANSFERS_PATH, m06Lab } from '../m06-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** English translation of ../m06-lab.ts: same server, checks and paths; only the text changes. */

const AUTH_BACKGROUND = `  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const TRANSFERS = `Feature: Kobalto Open API · transfers

  # Written for 1.6. Version 1.7 was deployed last night.

${AUTH_BACKGROUND}

  Scenario: create and confirm a transfer
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: 'ES9121000418450200051333', amount: 25.5, currency: 'EUR', concept: 'Cena' }
    When method post
    Then status 201
    * def id = response.id
    Given path 'transfers', id, 'confirm'
    When method post
    Then status 200
    And match response.status == 'COMPLETED'
`

const ERRORS = `Feature: Kobalto Open API · errors

${AUTH_BACKGROUND}

  Scenario: an account that does not exist
    Given path 'accounts', 'ACC-9999'
    When method get
    Then status 404
`

const LOGIN = `@ignore
Feature: reusable login

  Scenario: get a token
    * def scope = karate.get('scope', 'accounts:read transfers:write')
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)', scope: '#(scope)' }
    When method post
    Then status 200
    * def token = response.access_token
`

export const m06LabEn: CodeLabModel = {
  ...m06Lab,
  files: filesEn(m06Lab.files, {
    [M06_TRANSFERS_PATH]: TRANSFERS,
    [M06_ERRORS_PATH]: ERRORS,
    [M06_LOGIN_PATH]: LOGIN,
    'src/test/java/openapi/OpenApiTest.java': RUNNER_JAVA_EN,
  }),
  snippets: [
    { label: 'error schema', code: "* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }" },
    { label: 'match schema', code: 'And match response == errorSchema' },
    {
      label: 'error table',
      code: "Scenario Outline: <case> → <status> <code>\n  Given path <route>\n  When method get\n  Then status <status>\n  And match response.code == '<code>'\n\n  Examples:\n    | case              | route                  | status | code              |\n    | missing account   | 'accounts', 'ACC-9999' | 404    | ACCOUNT_NOT_FOUND |",
    },
    { label: 'configure retry', code: '* configure retry = { count: 10, interval: 1000 }' },
    { label: 'retry until', code: "Given path 'transfers', id\nAnd retry until response.status == 'COMPLETED'\nWhen method get" },
    { label: 'x-sandbox-fault', code: "And header x-sandbox-fault = '503'" },
    { label: 'responseHeaders', code: "And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'" },
  ],
  retos: retosEn(m06Lab.retos, {
    esquema: {
      title: 'One schema for every error',
      description: 'Every API error shares a format: `{ code, message, traceId }` (plus `field` in validations). Define the schema **once** with `def` and use it with `match response == …` in scenarios for at least **2 different error codes**.',
      hint: "In the Background: `* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }`. `##string` is optional: only validations include it.",
    },
    negativos: {
      title: 'The error table',
      description: 'A `Scenario Outline` with at least **4 error rows** that check the `status` and the `code` of each one, with at least **3 different HTTP codes** (400, 404, 405…). The error guide in the Wiki has the catalogue.',
      hint: "Columns `case`, `route`, `status` and `code`; in the step: `Given path <route>` (the cell can be `'accounts', 'ACC-9999'`). Ideas: badly formatted id (400), missing account or transfer (404), GET on /transfers (405).",
    },
    asincrona: {
      title: 'Wait without sleeping',
      description: 'In 1.7, confirming returns **202** with `status: PROCESSING` and the transfer completes a few seconds later. Fix the scenario: confirm, check the 202 and poll with `retry until` until it is **COMPLETED**.',
      hint: "`Given path 'transfers', id` · `And retry until response.status == 'COMPLETED'` · `When method get`. If you see “too many retry attempts: 3”, check in the guide how long processing takes and adjust `configure retry = { count: …, interval: … }`.",
    },
    basura: {
      title: 'Garbage in, clean response out',
      description: 'Partners send all sorts of things. An amount as text (`amount: \'10,50\'`) must get **400** `VALIDATION_ERROR` with `field: amount`, never a 500.',
      hint: "Copy the POST to /transfers with `amount: '10,50'` and expect `status 400` and `match response.field == 'amount'`.",
    },
    caida: {
      title: 'When the server goes down',
      description: 'Carmen: if the API is down, partners must get **503** with the error format and the **Retry-After** header (when to retry). The sandbox simulates it with the `x-sandbox-fault: 503` header.',
      hint: "`And header x-sandbox-fault = '503'` before `method`. Then: `match responseHeaders['Retry-After'][0] == '#regex [0-9]+'`.",
    },
    externa: {
      title: 'To another bank',
      description: 'Alba: most of Finvo’s transfers go to **other banks**. Also test a transfer to an IBAN outside Kobalto: it must complete just the same (PROCESSING → COMPLETED).',
      hint: 'Turn the scenario into a `Scenario Outline` with an `iban` column: one from Kobalto (ES9121000418450200051333) and one from outside (for example ES1420805801101234567891).',
    },
  }),
}
