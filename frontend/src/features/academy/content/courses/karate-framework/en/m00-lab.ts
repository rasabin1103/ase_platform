import type { CodeLabModel } from '../../../../karate/types'
import { m00Lab } from '../m00-lab'
import { BASIC_SNIPPETS_EN, KARATE_CONFIG_JS_EN, RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

const FEATURE = `Feature: Kobalto Open API · accounts smoke

  # Each “Scenario” is an independent test.
  # baseUrl comes from karate-config.js: https://api.kobalto.test/v1
  # Run with “Run” or Ctrl/Cmd + Enter and look at the console.

  Scenario: the API is up
    * url baseUrl
    # Write the path, the method and the checks here.
`

/** IDE for mission 1: first feature against the Kobalto Open API. English translation of ../m00-lab.ts. */
export const m00LabEn: CodeLabModel = {
  ...m00Lab,
  files: filesEn(m00Lab.files, {
    'src/test/java/openapi/accounts.feature': FEATURE,
    'src/test/java/karate-config.js': KARATE_CONFIG_JS_EN,
    'src/test/java/openapi/OpenApiTest.java': RUNNER_JAVA_EN,
  }),
  snippets: BASIC_SNIPPETS_EN,
  retos: retosEn(m00Lab.retos, {
    smoke: {
      title: 'Health smoke',
      description: 'A scenario that does `GET /health`, checks `status 200` and that `response.status` is `\'UP\'`.',
      hint: "Below `* url baseUrl`: `Given path 'health'`, `When method get`, `Then status 200` and `And match response.status == 'UP'`.",
    },
    cuenta: {
      title: 'Account details',
      description: '`GET /accounts/ACC-1001` responds 200. Use `match` to check it is the requested account (`id`) and that it is in euros (`currency`).',
      hint: "`Given path 'accounts', 'ACC-1001'` builds /accounts/ACC-1001. Then: `match response.id == 'ACC-1001'` and `match response.currency == 'EUR'`.",
    },
    noexiste: {
      title: 'An account that does not exist',
      description: 'Request an account with a valid format that does not exist (e.g. `ACC-9999`): 404 and `code` equal to `ACCOUNT_NOT_FOUND`.',
      hint: "Error cases get tested too: `Then status 404` and `And match response.code == 'ACCOUNT_NOT_FOUND'`.",
    },
    background: {
      title: 'No repetition: Background',
      description: 'With two or more scenarios, move `* url baseUrl` into a `Background:` (it runs before each scenario) and remove it from the scenarios.',
      hint: 'Right below `Feature:`, add `Background:` with `* url baseUrl` inside, and delete that line from every scenario. No full URLs in the scenarios.',
    },
    bloqueada: {
      title: 'The blocked account',
      description: 'Compliance needs `ACC-1003` to come back with `status` `\'BLOCKED\'`. Write the scenario. If it fails, decide: is it your test or the API?',
      hint: "Same pattern as the account details, with `match response.status == 'BLOCKED'`. If the test is correct and fails, that scenario is the evidence of the bug: report it on the Board.",
    },
  }),
}
