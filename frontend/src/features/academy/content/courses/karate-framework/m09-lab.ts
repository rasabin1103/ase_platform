import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, QA_CLIENT_ID, QA_CLIENT_SECRET, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { duplicatedScenarios } from '../../../apps/karate-ide/ideLogic'
import { M05_SOLUTION_LOGIN } from './m05-lab'
import { M08_SOLUTION_NIGHTLY } from './m08-lab'
import { KARATE_CONFIG, correct } from './shared'

const ROOT = 'src/test/java/'
const DIR = `${ROOT}openapi`
export const M09_CONFIG_PATH = `${ROOT}karate-config.js`
export const M09_PATHS = {
  accounts: `${DIR}/accounts.feature`,
  balances: `${DIR}/balances.feature`,
  cards: `${DIR}/cards.feature`,
  errors: `${DIR}/errors.feature`,
  health: `${DIR}/health.feature`,
  transfers: `${DIR}/transfers.feature`,
  login: `${DIR}/auth/login.feature`,
  nightly: `${DIR}/OpenApiRunner.java`,
  smoke: `${DIR}/SmokeRunner.java`,
}
/** Escenarios que debe tener la suite final del nocturno. */
export const FINAL_MIN_SCENARIOS = 15

const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    clientId: '${QA_CLIENT_ID}',
    clientSecret: '${QA_CLIENT_SECRET}'
  };
  return config;
}
`

const AUTH = `  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const HEALTH = `Feature: Kobalto Open API · salud

${AUTH}

  @smoke
  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response == { status: 'UP', service: 'kobalto-open-api', version: '#string' }
`

const ACCOUNTS = `Feature: Kobalto Open API · cuentas

${AUTH}

  @smoke
  Scenario: detalle de una cuenta
    Given path 'accounts', accountId
    When method get
    Then status 200
    And match response contains { id: '#(accountId)', status: 'ACTIVE' }

  Scenario: lista de cuentas activas
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items contains { status: 'ACTIVE' }

  Scenario: paginación
    Given path 'accounts'
    And params { page: 1, size: 2 }
    When method get
    Then status 200
    And match response.items == '#[2]'
`

const BALANCES = `Feature: Kobalto Open API · saldos

${AUTH}

  Scenario: una cuenta nueva tiene el saldo con el que se crea
    Given path 'sandbox', 'accounts'
    And request { balance: 250.5, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    Given path 'accounts', cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 250.5

  Scenario: el saldo baja al confirmar
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

const ERRORS = `Feature: Kobalto Open API · errores

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
      | id con formato no válido  | 'accounts', 'cuenta-1'  | 400    | INVALID_ACCOUNT_ID |
      | cuenta inexistente        | 'accounts', 'ACC-9999'  | 404    | ACCOUNT_NOT_FOUND  |
      | transferencia inexistente | 'transfers', 'TRF-9999' | 404    | TRANSFER_NOT_FOUND |
`

const TRANSFERS = `Feature: Kobalto Open API · transferencias

${AUTH}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transferencia <caso>
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
      | caso         | iban                     | amount |
      | a Kobalto    | ES9121000418450200051333 | 25.5   |
      | a otro banco | ES1420805801101234567891 | 40     |

  Scenario: dos pendientes no pueden gastar el mismo saldo
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

/** La PR de Iker: funciona «en su máquina». */
const CARDS = `Feature: tarjetas

${AUTH}

  Scenario: tarjeta CRD-1001
    Given url 'https://api.kobalto.test/v1/cards/CRD-1001'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: tarjeta CRD-1002
    Given url 'https://api.kobalto.test/v1/cards/CRD-1002'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: tarjeta CRD-1003
    Given url 'https://api.kobalto.test/v1/cards/CRD-1003'
    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f1d2c'
    When method get
    Then status 200
    * print response

  Scenario: tarjetas de una cuenta
    Given url 'https://api.kobalto.test/v1/cards?accountId=ACC-1001'
    When method get
    Then status 200
`

const SMOKE = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

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

// ------------------------------------------------- Comprobaciones
const TOKEN = '/v1/auth/token'
const authorized = (sc: ScenarioResult) => sc.requests.some((r) => r.path !== TOKEN && Object.entries(r.headers).some(([k, v]) => k.toLowerCase() === 'authorization' && /^Bearer\s/.test(v)))
const featureFiles = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.feature'))
const base = (p: string) => p.split('/').pop()!
/** ¿El fichero se lee (read) desde este feature? */
const reads = (content: string, path: string) => new RegExp(`read\\(\\s*['"](classpath:)?[^'"]*${base(path).replace(/[.]/g, '\\.')}['"]`).test(content)
const isCards = (sc: ScenarioResult) => sc.file === M09_PATHS.cards

/** IDE de la misión 10: el framework de la suite (estructura, utilidades, convenciones y revisión). */
export const m09Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', auth: true, async: true, sandboxData: true, cards: true }),
  config: KARATE_CONFIG,
  configFile: M09_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  newFiles: { root: ROOT },
  pipeline: {
    cost: 10,
    jobs: [
      { id: 'nightly', label: 'Nocturno · regresión', trigger: 'cada noche (02:00)', runner: M09_PATHS.nightly },
      { id: 'pr', label: 'PR · smoke', trigger: 'en cada pull request', runner: M09_PATHS.smoke },
    ],
  },
  files: [
    { path: M09_PATHS.accounts, content: ACCOUNTS },
    { path: M09_PATHS.balances, content: BALANCES },
    { path: M09_PATHS.cards, content: CARDS },
    { path: M09_PATHS.errors, content: ERRORS },
    { path: M09_PATHS.health, content: HEALTH },
    { path: M09_PATHS.transfers, content: TRANSFERS },
    { path: M09_PATHS.login, content: M05_SOLUTION_LOGIN },
    { path: M09_PATHS.nightly, content: M08_SOLUTION_NIGHTLY },
    { path: M09_PATHS.smoke, content: SMOKE },
    { path: M09_CONFIG_PATH, content: CONFIG },
  ],
  snippets: [
    { label: 'callSingle', code: "var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);\nkarate.configure('headers', { Authorization: 'Bearer ' + auth.token });" },
    { label: 'read esquema', code: "* def errorSchema = read('schemas/error.json')" },
    { label: 'call utilidad', code: "* def cuenta = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }" },
    { label: '@regression', code: '@regression' },
    { label: '@smoke', code: '@smoke' },
    { label: 'match each', code: "And match each response.items contains { accountId: '#(accountId)' }" },
  ],
  retos: [
    {
      id: 'callsingle',
      title: 'Un token para toda la suite',
      description: 'Con seis features y un `callonce` en cada uno, la suite pide seis tokens… y la API da cinco por minuto. Pide el token **una sola vez por ejecución** con `karate.callSingle` en `karate-config.js` y quita el login de los Background.',
      hint: "En karate-config.js, antes de `return config`: `var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);` y `karate.configure('headers', { Authorization: 'Bearer ' + auth.token });`. Después, borra las líneas de `auth` y `configure headers` de cada Background.",
      check: (scs, _f, ctx) => {
        const tokens = scs.flatMap((sc) => sc.requests).filter((r) => r.path === TOKEN)
        const files = new Set(scs.filter(authorized).map((sc) => sc.file))
        return /karate\.callSingle\s*\(/.test(ctx.files[M09_CONFIG_PATH] ?? '') && tokens.length === 1 && !tokens.some((r) => r.status === 429) && files.size >= 5
      },
    },
    {
      id: 'revision',
      title: 'La PR de Iker',
      description: 'Revisa `cards.feature` antes de que entre en el nocturno: sin URLs ni tokens pegados, sin escenarios copiados y comprobando **el cuerpo** de cada respuesta (el contrato de la tarjeta y que la lista solo trae tarjetas de la cuenta pedida).',
      hint: "`path 'cards', <id>` en lugar de la URL; nada de `header Authorization` (ya lo pone la configuración); un `Scenario Outline` por tarjeta con `match response == cardSchema`; y en la lista, `param accountId` y `match each response.items contains { accountId: … }`.",
      visibleWhen: { kind: 'flag', key: 'iker.pr' },
      check: (scs, _f, ctx) => {
        const cards = scs.filter(isCards)
        const src = ctx.files[M09_PATHS.cards] ?? ''
        return (
          cards.length >= 3 &&
          !/Bearer\s+kbt_/.test(src) &&
          !/https?:\/\//.test(src) &&
          !duplicatedScenarios(cards) &&
          cards.every((sc) => sc.smells.length === 0 && sc.matches.length > 0 && correct(sc)) &&
          cards.some((sc) => sc.requests.some((r) => r.path === '/v1/cards' && r.query.accountId)) &&
          cards.some((sc) => sc.requests.some((r) => /^\/v1\/cards\/CRD-\d{4}$/.test(r.path)))
        )
      },
    },
    {
      id: 'esquemas',
      title: 'Esquemas en su sitio',
      description: 'El esquema de error está copiado en varios features. Sácalo a un fichero JSON en una carpeta `schemas/` (con **Nuevo fichero**) y léelo con `read()` desde **al menos 2 features**.',
      hint: "Crea `openapi/schemas/error.json` con `{ \"code\": \"#string\", \"message\": \"#string\", \"traceId\": \"#uuid\", \"field\": \"##string\" }`. En cada feature: `* def errorSchema = read('schemas/error.json')`.",
      check: (scs, _f, ctx) => {
        if (!ctx.green || scs.length === 0) return false
        const schemas = Object.entries(ctx.files).filter(([p, c]) => /\/schemas\/[^/]+\.json$/.test(p) && (c.match(/"##?[a-z?(]/gi) ?? []).length >= 2)
        return schemas.some(([p]) => featureFiles(ctx.files).filter(([, c]) => reads(c, p)).length >= 2)
      },
    },
    {
      id: 'utilidades',
      title: 'Una utilidad para los datos',
      description: 'Crear una cuenta de prueba está copiado en varios escenarios. Conviértelo en un feature reutilizable (`@ignore`) que reciba el saldo como argumento y llámalo desde **al menos 2 features**.',
      hint: "Crea `common/cuenta-prueba.feature` con `@ignore`, `* def saldo = karate.get('balance', 100)`, `Given url baseUrl`, el POST a `sandbox/accounts` y `* def cuenta = response`. Úsalo con `* def r = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }` y `r.cuenta.id`.",
      check: (scs, _f, ctx) => {
        if (!ctx.green) return false
        const utils = featureFiles(ctx.files).filter(([p, c]) => p !== M09_PATHS.login && /^\s*@ignore\b/m.test(c) && /sandbox['"]?\s*,\s*['"]accounts|sandbox\/accounts/.test(c))
        const used = utils.some(([p]) => featureFiles(ctx.files).filter(([q, c]) => q !== p && /call(once)?\s+read\(/.test(c) && reads(c, p)).length >= 2)
        return used && scs.some((sc) => sc.status === 'passed' && sc.requests.some((r) => r.path === '/v1/sandbox/accounts' && r.status === 201))
      },
    },
    {
      id: 'convenciones',
      title: 'Las convenciones del equipo',
      description: 'Iván ha publicado las convenciones en la wiki: **todo escenario** lleva `@smoke` o `@regression` (vale en el `Feature`), y ningún feature tiene URLs completas ni tokens. Cúmplelas en toda la suite.',
      hint: 'Un `@regression` encima de `Feature:` cubre todos sus escenarios; `@smoke` en los imprescindibles. Recuerda que también cuentan los escenarios de Iker.',
      visibleWhen: { kind: 'flag', key: 'ivan.convenciones' },
      check: (scs, _f, ctx) =>
        ctx.green &&
        scs.length >= 10 &&
        scs.every((sc) => sc.tags.includes('smoke') || sc.tags.includes('regression')) &&
        featureFiles(ctx.files).every(([, c]) => !/https?:\/\//.test(c) && !/Bearer\s+kbt_/.test(c)),
    },
    {
      id: 'final',
      title: 'La suite final',
      description: `Lanza el **nocturno** con la suite completa (al menos **${FINAL_MIN_SCENARIOS} escenarios**, en paralelo y con el build comprobando los fallos) sin que nada falle por culpa de los tests.`,
      hint: 'Pipeline → «Nocturno · regresión». Lo que falle por un bug real de la API cuenta como correcto (y repórtalo).',
      visibleWhen: { kind: 'flag', key: 'sergio.final' },
      check: (scs, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'nightly' && ctx.pipeline.spec.asserts && ctx.pipeline.spec.threads >= 2 && ctx.pipeline.streak >= 1 && scs.length >= FINAL_MIN_SCENARIOS,
    },
  ],
}

// ------------------------------------------------- Solución de referencia
export const M09_SOLUTION_CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    clientId: '${QA_CLIENT_ID}',
    clientSecret: '${QA_CLIENT_SECRET}'
  };
  // Un token para toda la ejecución (todos los features y todos los hilos).
  var auth = karate.callSingle('classpath:openapi/auth/login.feature', config);
  karate.configure('headers', { Authorization: 'Bearer ' + auth.token });
  return config;
}
`

export const M09_SOLUTION_ERROR_SCHEMA_PATH = `${DIR}/schemas/error.json`
export const M09_SOLUTION_CARD_SCHEMA_PATH = `${DIR}/schemas/card.json`
export const M09_SOLUTION_UTIL_PATH = `${ROOT}common/cuenta-prueba.feature`

export const M09_SOLUTION_ERROR_SCHEMA = `{ "code": "#string", "message": "#string", "traceId": "#uuid", "field": "##string" }
`
export const M09_SOLUTION_CARD_SCHEMA = `{ "id": "#regex CRD-[0-9]{4}", "accountId": "#regex ACC-[0-9]{4}", "brand": "#string", "last4": "#regex [0-9]{4}", "status": "#string", "expiry": "#regex [0-9]{4}-[0-9]{2}" }
`

export const M09_SOLUTION_UTIL = `@ignore
Feature: utilidad · crear una cuenta de prueba

  Scenario: cuenta de prueba
    * def saldo = karate.get('balance', 100)
    Given url baseUrl
    And path 'sandbox', 'accounts'
    And request { balance: '#(saldo)', currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
`

const BG = `  Background:
    * url baseUrl`

export const M09_SOLUTION = {
  [M09_PATHS.health]: HEALTH.replace(AUTH, BG).replace('Feature:', '@regression\nFeature:'),
  [M09_PATHS.accounts]: ACCOUNTS.replace(AUTH, BG).replace('Feature:', '@regression\nFeature:'),
  [M09_PATHS.balances]: `@regression
Feature: Kobalto Open API · saldos

${BG}

  Scenario: una cuenta nueva tiene el saldo con el que se crea
    * def r = call read('classpath:common/cuenta-prueba.feature') { balance: 250.5 }
    Given path 'accounts', r.cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 250.5

  Scenario: el saldo baja al confirmar
    * def r = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }
    Given path 'transfers'
    And request { fromAccount: '#(r.cuenta.id)', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR' }
    When method post
    Then status 201
    Given path 'transfers', response.id, 'confirm'
    When method post
    Then status 202
    Given path 'accounts', r.cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 90
`,
  [M09_PATHS.errors]: ERRORS.replace(AUTH, BG).replace("    * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }", "    * def errorSchema = read('schemas/error.json')").replace('Feature:', '@regression\nFeature:'),
  [M09_PATHS.transfers]: `@regression
Feature: Kobalto Open API · transferencias

${BG}
    * configure retry = { count: 10, interval: 1000 }
    * def errorSchema = read('schemas/error.json')

  Scenario Outline: transferencia <caso>
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
      | caso         | iban                     | amount |
      | a Kobalto    | ES9121000418450200051333 | 25.5   |
      | a otro banco | ES1420805801101234567891 | 40     |

  Scenario: dos pendientes no pueden gastar el mismo saldo
    * def r = call read('classpath:common/cuenta-prueba.feature') { balance: 100 }
    * def pago = { fromAccount: '#(r.cuenta.id)', toIban: 'ES9121000418450200051333', amount: 80, currency: 'EUR' }
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
`,
  [M09_PATHS.cards]: `@regression
Feature: Kobalto Open API · tarjetas

${BG}
    * def cardSchema = read('schemas/card.json')

  Scenario Outline: tarjeta <id> (<estado>)
    Given path 'cards', '<id>'
    When method get
    Then status 200
    And match response == cardSchema
    And match response contains { id: '<id>', status: '<estado>' }

    Examples:
      | id       | estado  |
      | CRD-1001 | ACTIVE  |
      | CRD-1002 | BLOCKED |
      | CRD-1003 | EXPIRED |

  Scenario: tarjetas de una cuenta
    Given path 'cards'
    And param accountId = accountId
    When method get
    Then status 200
    And match each response.items == cardSchema
    And match each response.items contains { accountId: '#(accountId)' }
`,
  [M09_CONFIG_PATH]: M09_SOLUTION_CONFIG,
  [M09_SOLUTION_ERROR_SCHEMA_PATH]: M09_SOLUTION_ERROR_SCHEMA,
  [M09_SOLUTION_CARD_SCHEMA_PATH]: M09_SOLUTION_CARD_SCHEMA,
  [M09_SOLUTION_UTIL_PATH]: M09_SOLUTION_UTIL,
}

/** Bugs que destapa la solución de referencia. */
export const M09_EXPECTED_BUGS = [KOBALTO_API_BUGS.pan, KOBALTO_API_BUGS.filtroTarjetas]
