import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, QA_CLIENT_ID, QA_CLIENT_SECRET, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { KARATE_CONFIG, RUNNER_JAVA, correct } from './shared'

export const M05_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M05_FEATURE_PATH = 'src/test/java/openapi/accounts.feature'
export const M05_LOGIN_PATH = 'src/test/java/openapi/auth/login.feature'

const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    // Cliente OAuth de QA en el sandbox (en pre y prod vendría de karate.properties).
    clientId: '${QA_CLIENT_ID}',
    clientSecret: '${QA_CLIENT_SECRET}'
  };
  return config;
}
`

const LOGIN = `Feature: login reutilizable

  # Aquí va el login, para llamarlo desde otros features con call.

  Scenario: obtener un token
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

const FEATURE = `Feature: Kobalto Open API · cuentas con token

  # Desde la 1.6 la API exige un token OAuth2 (client credentials).
  # Cada escenario pide el suyo… copiado y pegado.

  Background:
    * url baseUrl

${block('detalle de una cuenta', "'accounts', accountId")}
${block('lista de cuentas', "'accounts'")}
${block('saldo de una cuenta', "'accounts', accountId, 'balance'")}`

const TOKEN = '/v1/auth/token'
const isLogin = (path: string) => /login\.feature$/.test(path)
const authorized = (sc: ScenarioResult) => sc.requests.some((r) => !r.path.startsWith('/v1/auth') && /^Bearer\s/.test(Object.entries(r.headers).find(([k]) => k.toLowerCase() === 'authorization')?.[1] ?? ''))
const features = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.feature') && !isLogin(p)).map(([, c]) => c)

/** IDE de la misión 6: login reutilizable con call/callonce, tokens, scopes y tags. */
export const m05Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', auth: true }),
  config: KARATE_CONFIG,
  configFile: M05_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M05_FEATURE_PATH, content: FEATURE },
    { path: M05_LOGIN_PATH, content: LOGIN },
    { path: M05_CONFIG_PATH, content: CONFIG, readOnly: true },
    RUNNER_JAVA,
  ],
  snippets: [
    { label: 'login', code: "Given url baseUrl\nAnd path 'auth', 'token'\nAnd request { clientId: '#(clientId)', clientSecret: '#(clientSecret)' }\nWhen method post\nThen status 200\n* def token = response.access_token" },
    { label: '@ignore', code: '@ignore' },
    { label: 'call', code: "* def auth = call read('auth/login.feature')" },
    { label: 'callonce', code: "* def auth = callonce read('auth/login.feature')" },
    { label: 'call con args', code: "* def ro = call read('auth/login.feature') { scope: 'accounts:read' }" },
    { label: 'configure headers', code: "* configure headers = { Authorization: '#(\"Bearer \" + auth.token)' }" },
    { label: "karate.get", code: "* def scope = karate.get('scope', 'accounts:read transfers:write')" },
  ],
  retos: [
    {
      id: 'login',
      title: 'Un login reutilizable',
      description: 'Escribe en `auth/login.feature` un escenario que pida el token (`POST /auth/token`) y lo deje en una variable `token`.',
      hint: "Pon `Given url baseUrl` dentro del escenario (este feature no tiene Background) y al final `* def token = response.access_token`.",
      check: (scs, _f, ctx) => {
        const login = Object.entries(ctx.files).find(([p]) => isLogin(p))?.[1] ?? ''
        return /auth/.test(login) && /token\s*=\s*response\.access_token/.test(login) && scs.some((sc) => sc.requests.some((r) => r.method === 'POST' && r.path === TOKEN && r.status === 200) && correct(sc))
      },
    },
    {
      id: 'call',
      title: 'Llamar al login',
      description: 'Quita el login copiado de cada escenario y llámalo con `call read(\'auth/login.feature\')`. El token llega en lo que devuelve la llamada.',
      hint: "En el Background: `* def auth = call read('auth/login.feature')` y luego `* configure headers = { Authorization: '#(\"Bearer \" + auth.token)' }`. Así cada petición lleva el token.",
      check: (scs, _f, ctx) =>
        features(ctx.files).some((c) => /call(once)?\s+read\(\s*['"][^'"]*login\.feature/.test(c) && !/path\s+'auth',\s*'token'/.test(c)) &&
        scs.filter((sc) => !isLogin(sc.file) && authorized(sc) && correct(sc)).length >= 2,
    },
    {
      id: 'ignore',
      title: 'Que no corra solo',
      description: 'El login no es un test: es una pieza que llaman otros. Márcalo con `@ignore` para que no se ejecute suelto en la suite.',
      hint: 'Pon `@ignore` en la línea de antes de `Feature:` en login.feature. Seguirá funcionando con call.',
      check: (scs, _f, ctx) =>
        /@ignore/.test(Object.entries(ctx.files).find(([p]) => isLogin(p))?.[1] ?? '') && !scs.some((sc) => isLogin(sc.file)) && scs.some((sc) => sc.requests.some((r) => r.path === TOKEN)),
    },
    {
      id: 'callonce',
      title: 'Un token, no veinte',
      description: 'La API solo da **5 tokens por minuto** a cada cliente. Con al menos **3 escenarios** autenticados, la suite no puede pedir más de 3 tokens: usa `callonce`.',
      hint: "`callonce` ejecuta el login una vez por feature y reutiliza el resultado: `* def auth = callonce read('auth/login.feature')` en el Background.",
      check: (scs, _f, ctx) => {
        const tokens = scs.flatMap((sc) => sc.requests).filter((r) => r.path === TOKEN)
        return features(ctx.files).some((c) => /callonce\s+read\(/.test(c)) && scs.filter((sc) => authorized(sc) && correct(sc)).length >= 3 && tokens.length <= 3 && !tokens.some((r) => r.status === 429)
      },
    },
    {
      id: 'scope',
      title: 'Mínimo privilegio',
      description: 'Carmen: un token con solo `accounts:read` **no** puede crear transferencias. Pide un token con ese scope (pasando argumentos al login) e intenta un `POST /transfers`: **403** `INSUFFICIENT_SCOPE`.',
      hint: "En el login: `* def scope = karate.get('scope', 'accounts:read transfers:write')` y `scope: '#(scope)'` en el cuerpo. En el test: `* def ro = call read('auth/login.feature') { scope: 'accounts:read' }`.",
      visibleWhen: { kind: 'flag', key: 'carmen.scope' },
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.requests.some((r) => r.path === TOKEN && (r.body as Record<string, unknown> | undefined)?.scope === 'accounts:read') &&
            sc.requests.some((r) => r.method === 'POST' && r.path === '/v1/transfers') &&
            sc.statusChecks.includes(403) &&
            correct(sc, KOBALTO_API_BUGS.scope),
        ),
    },
    {
      id: 'revoke',
      title: 'Desconectar',
      description: 'Alba: cuando un cliente desconecta su cuenta de Finvo, Finvo revoca el token (`POST /auth/revoke`). Después, ese token debe dar **401** `TOKEN_REVOKED`.',
      hint: "Necesitas un token propio (no el compartido): `* call read('auth/login.feature')` deja `token` en el escenario. Revoca con `request { token: '#(token)' }` y usa ese mismo token después.",
      visibleWhen: { kind: 'flag', key: 'alba.revoke' },
      check: (scs) =>
        scs.some((sc) => {
          const i = sc.requests.findIndex((r) => r.path === '/v1/auth/revoke' && r.status === 200)
          return i >= 0 && sc.requests.slice(i + 1).some((r) => !r.path.startsWith('/v1/auth')) && sc.statusChecks.includes(401) && correct(sc, KOBALTO_API_BUGS.revoke)
        }),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M05_SOLUTION_LOGIN = `@ignore
Feature: login reutilizable

  Scenario: obtener un token
    * def scope = karate.get('scope', 'accounts:read transfers:write')
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)', scope: '#(scope)' }
    When method post
    Then status 200
    * def token = response.access_token
`

export const M05_SOLUTION_FEATURE = `Feature: Kobalto Open API · cuentas con token

  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }

  Scenario: detalle de una cuenta
    Given path 'accounts', accountId
    When method get
    Then status 200

  Scenario: lista de cuentas
    Given path 'accounts'
    When method get
    Then status 200

  Scenario: saldo de una cuenta
    Given path 'accounts', accountId, 'balance'
    When method get
    Then status 200

  Scenario: un token de solo lectura no puede transferir
    * def ro = call read('auth/login.feature') { scope: 'accounts:read' }
    Given path 'transfers'
    And header Authorization = 'Bearer ' + ro.token
    And request { fromAccount: '#(accountId)', toIban: 'ES9121000418450200051333', amount: 5, currency: 'EUR' }
    When method post
    Then status 403
    And match response.code == 'INSUFFICIENT_SCOPE'

  Scenario: un token revocado deja de funcionar
    * call read('auth/login.feature')
    Given path 'auth', 'revoke'
    And request { token: '#(token)' }
    When method post
    Then status 200
    Given path 'accounts', accountId
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 401
    And match response.code == 'TOKEN_REVOKED'
`
