import type { CodeLabModel } from '../../../../karate/types'
import { M08_ACCOUNTS_PATH, M08_ERRORS_PATH, M08_LOGIN_PATH, M08_NIGHTLY_PATH, M08_SMOKE_PATH, M08_TRANSFERS_PATH, SMOKE_BUDGET_MS, m08Lab } from '../m08-lab'
import { filesEn, retosEn } from './shared'

/** English translation of ../m08-lab.ts: same files, checks and pipeline; only the text changes. */

const AUTH = `    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const ACCOUNTS = `Feature: Kobalto Open API · accounts

  Background:
${AUTH}

  Scenario: the API is up
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'

  Scenario: account details
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
`

const ERRORS = `Feature: Kobalto Open API · errors

  Background:
${AUTH}
    * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }

  Scenario Outline: <caso> → <status> <code>
    Given path <ruta>
    When method get
    Then status <status>
    And match response == errorSchema
    And match response.code == '<code>'

    Examples:
      | caso                      | ruta                    | status | code               |
      | id with an invalid format | 'accounts', 'cuenta-1'  | 400    | INVALID_ACCOUNT_ID |
      | account does not exist    | 'accounts', 'ACC-9999'  | 404    | ACCOUNT_NOT_FOUND  |
      | transfer does not exist   | 'transfers', 'TRF-9999' | 404    | TRANSFER_NOT_FOUND |
`

const TRANSFER_STEPS = `    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: '<iban>', amount: <amount>, currency: 'EUR', concept: '<concepto>' }
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
    And match response contains { id: '#(id)', amount: <amount>, toIban: '<iban>' }`

const TRANSFERS = `Feature: Kobalto Open API · transfers

  Background:
${AUTH}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transfer <caso>
${TRANSFER_STEPS}

    Examples:
      | caso              | iban                     | amount | concepto |
      | to Kobalto        | ES9121000418450200051333 | 25.5   | Cena     |
      | to another bank   | ES1420805801101234567891 | 40     | Alquiler |
      | with cents        | ES9121000418450200051333 | 0.99   | Café     |
      | round amount      | ES1420805801101234567891 | 100    | Regalo   |

  Scenario: the balance goes down on confirm
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR', concept: 'Saldo' }
    When method post
    Then status 201
    Given path 'transfers', response.id, 'confirm'
    When method post
    Then status 202
    Given path 'accounts', accountId, 'balance'
    When method get
    Then status 200
    # Checked locally: 1520.35 − 25.5 − 40 − 0.99 − 100 − 10
    And match response.available == 1343.86
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

const NIGHTLY = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

// Nightly job: the whole regression suite, in parallel.
class OpenApiRunner {

    @Test
    void regression() {
        Results results = Runner.path("classpath:openapi")
                .tags("~@ignore")
                .parallel(4);
        System.out.println("Escenarios fallidos: " + results.getFailCount());
    }
}
`

const SMOKE = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// Job for every pull request: only the essentials, in seconds.
class SmokeRunner {

    @Test
    void smoke() {
        Results results = Runner.path("classpath:openapi")
                .tags("@smoke")
                .parallel(1);
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
`

/** Mission 9 IDE: JUnit 5 runners, tags, parallel runs, own data and pipeline. */
export const m08LabEn: CodeLabModel = {
  ...m08Lab,
  pipeline: m08Lab.pipeline && {
    ...m08Lab.pipeline,
    jobs: m08Lab.pipeline.jobs.map((j) =>
      j.id === 'nightly' ? { ...j, label: 'Nightly · regression', trigger: 'every night (02:00)' } : j.id === 'pr' ? { ...j, label: 'PR · smoke', trigger: 'on every pull request' } : j,
    ),
  },
  files: filesEn(m08Lab.files, {
    [M08_ACCOUNTS_PATH]: ACCOUNTS,
    [M08_ERRORS_PATH]: ERRORS,
    [M08_TRANSFERS_PATH]: TRANSFERS,
    [M08_LOGIN_PATH]: LOGIN,
    [M08_NIGHTLY_PATH]: NIGHTLY,
    [M08_SMOKE_PATH]: SMOKE,
  }),
  snippets: [
    { label: 'assertEquals', code: 'assertEquals(0, results.getFailCount(), results.getErrorMessages());' },
    { label: 'import Assertions', code: 'import static org.junit.jupiter.api.Assertions.*;' },
    { label: '@smoke', code: '@smoke' },
    { label: 'own account', code: "Given path 'sandbox', 'accounts'\nAnd request { balance: 100, currency: 'EUR' }\nWhen method post\nThen status 201\n* def account = response" },
    { label: 'JSON report', code: '.outputCucumberJson(true)' },
  ],
  retos: retosEn(m08Lab.retos, {
    assert: {
      title: 'Make red mean red',
      description: 'The nightly job came out **green** with failed scenarios: the runner prints the failures but does not fail the test. Make `OpenApiRunner` **break the build** when there are failures and launch it in the pipeline.',
      hint: 'Add `import static org.junit.jupiter.api.Assertions.*;` and, at the end of the method, `assertEquals(0, results.getFailCount(), results.getErrorMessages());`.',
    },
    smoke: {
      title: 'Smoke on every PR',
      description: `The job for every pull request runs only what is tagged \`@smoke\`. Tag **at least 3** fast, essential scenarios so the job passes in **under ${SMOKE_BUDGET_MS / 1000} s**.`,
      hint: 'Put `@smoke` on the line before `Scenario:` (API health, account details, a 404 error…). Transfers wait for seconds: they are not smoke.',
    },
    aislado: {
      title: 'Your own data',
      description: 'The balance test assumes nobody else uses ACC-1001: in parallel, other transfers change the balance at the same time. Make it create **its own account** (`POST /sandbox/accounts`), transfer from it and check its balance.',
      hint: "`Given path 'sandbox', 'accounts'` with `request { balance: 100, currency: 'EUR' }` → `* def account = response`. Transfer 10 from `account.id` and expect `available == 90`.",
    },
    estable: {
      title: 'Three nights in a row',
      description: 'A test that sometimes passes and sometimes fails is worse than no test. Launch the **nightly** job (with at least 2 threads) **3 times in a row** with nothing failing because of the tests. Failures caused by a real API bug count as correct.',
      hint: 'Each pipeline run spreads the scenarios in a different order. If something fails only sometimes, check whether it depends on data another scenario changes… or whether the failure is in the API.',
    },
    reserva: {
      title: 'Two pending, one balance',
      description: 'Carmen: with your own account of **€100**, create **two** €80 transfers and confirm both. The second confirmation must get **422** `INSUFFICIENT_FUNDS`: the balance is no longer enough.',
      hint: 'Both are created fine (201): the balance is checked again on confirm. Confirm the first one (202) and the second one (422).',
    },
    informe: {
      title: 'Results in the test management tool',
      description: 'Alba wants to see the results of every night in the test management tool (Xray), which imports the **Cucumber JSON**. Make the nightly runner generate it and launch it.',
      hint: 'In the Runner chain, before `.parallel(…)`: `.outputCucumberJson(true)`. Karate leaves it in target/karate-reports.',
    },
  }),
}
