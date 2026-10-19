import type { CodeLabModel } from '../../../../karate/types'
import { QA_CLIENT_ID, QA_CLIENT_SECRET } from '../../../../karate/apis/kobaltoOpenApi'
import { M05_CONFIG_PATH, M05_FEATURE_PATH, M05_LOGIN_PATH, m05Lab } from '../m05-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** English translation of ../m05-lab.ts: same lab, only the text changes. */

const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    // QA OAuth client in the sandbox (in pre and prod it would come from karate.properties).
    clientId: '${QA_CLIENT_ID}',
    clientSecret: '${QA_CLIENT_SECRET}'
  };
  return config;
}
`

const LOGIN = `Feature: reusable login

  # The login goes here, so other features can call it with call.

  Scenario: get a token
    # ...
`

const block = (name: string, path: string) => `  Scenario: ${name}
    Given path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)' }
    When method post
    Then status 200
    * def token = response.access_token
    Given path ${path}
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 200
`

const FEATURE = `Feature: Kobalto Open API · accounts with a token

  # Since 1.6 the API requires an OAuth2 token (client credentials).
  # Each scenario requests its own… copied and pasted.

  Background:
    * url baseUrl

${block('account details', "'accounts', accountId")}
${block('account list', "'accounts'")}
${block('account balance', "'accounts', accountId, 'balance'")}`

export const m05LabEn: CodeLabModel = {
  ...m05Lab,
  files: filesEn(m05Lab.files, {
    [M05_FEATURE_PATH]: FEATURE,
    [M05_LOGIN_PATH]: LOGIN,
    [M05_CONFIG_PATH]: CONFIG,
    'src/test/java/openapi/OpenApiTest.java': RUNNER_JAVA_EN,
  }),
  snippets: [
    { label: 'login', code: "Given url baseUrl\nAnd path 'auth', 'token'\nAnd request { clientId: '#(clientId)', clientSecret: '#(clientSecret)' }\nWhen method post\nThen status 200\n* def token = response.access_token" },
    { label: '@ignore', code: '@ignore' },
    { label: 'call', code: "* def auth = call read('auth/login.feature')" },
    { label: 'callonce', code: "* def auth = callonce read('auth/login.feature')" },
    { label: 'call with args', code: "* def ro = call read('auth/login.feature') { scope: 'accounts:read' }" },
    { label: 'configure headers', code: "* configure headers = { Authorization: '#(\"Bearer \" + auth.token)' }" },
    { label: 'karate.get', code: "* def scope = karate.get('scope', 'accounts:read transfers:write')" },
  ],
  retos: retosEn(m05Lab.retos, {
    login: {
      title: 'A reusable login',
      description: 'In `auth/login.feature`, write a scenario that requests the token (`POST /auth/token`) and stores it in a `token` variable.',
      hint: 'Put `Given url baseUrl` inside the scenario (this feature has no Background) and finish with `* def token = response.access_token`.',
    },
    call: {
      title: 'Call the login',
      description: 'Remove the login copied into each scenario and call it with `call read(\'auth/login.feature\')`. The token comes back in what the call returns.',
      hint: "In the Background: `* def auth = call read('auth/login.feature')` and then `* configure headers = { Authorization: '#(\"Bearer \" + auth.token)' }`. That way every request carries the token.",
    },
    ignore: {
      title: 'Don’t let it run alone',
      description: 'The login isn’t a test: it’s a piece other features call. Tag it with `@ignore` so it doesn’t run on its own in the suite.',
      hint: 'Put `@ignore` on the line before `Feature:` in login.feature. It will still work with call.',
    },
    callonce: {
      title: 'One token, not twenty',
      description: 'The API only gives **5 tokens per minute** to each client. With at least **3 authenticated scenarios**, the suite can’t request more than 3 tokens: use `callonce`.',
      hint: "`callonce` runs the login once per feature and reuses the result: `* def auth = callonce read('auth/login.feature')` in the Background.",
    },
    scope: {
      title: 'Least privilege',
      description: 'Carmen: a token with only `accounts:read` must **not** be able to create transfers. Request a token with that scope (passing arguments to the login) and try a `POST /transfers`: **403** `INSUFFICIENT_SCOPE`.',
      hint: "In the login: `* def scope = karate.get('scope', 'accounts:read transfers:write')` and `scope: '#(scope)'` in the body. In the test: `* def ro = call read('auth/login.feature') { scope: 'accounts:read' }`.",
    },
    revoke: {
      title: 'Disconnect',
      description: 'Alba: when a customer disconnects their account from Finvo, Finvo revokes the token (`POST /auth/revoke`). After that, the token must get **401** `TOKEN_REVOKED`.',
      hint: "You need a token of your own (not the shared one): `* call read('auth/login.feature')` leaves `token` in the scenario. Revoke it with `request { token: '#(token)' }` and use that same token afterwards.",
    },
  }),
}
