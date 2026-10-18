import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, QA_CLIENT_ID, QA_CLIENT_SECRET, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { M05_SOLUTION_LOGIN } from './m05-lab'
import { KARATE_CONFIG, correct } from './shared'

const DIR = 'src/test/java/openapi'
export const M08_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M08_ACCOUNTS_PATH = `${DIR}/accounts.feature`
export const M08_ERRORS_PATH = `${DIR}/errors.feature`
export const M08_TRANSFERS_PATH = `${DIR}/transfers.feature`
export const M08_LOGIN_PATH = `${DIR}/auth/login.feature`
export const M08_NIGHTLY_PATH = `${DIR}/OpenApiRunner.java`
export const M08_SMOKE_PATH = `${DIR}/SmokeRunner.java`
/** Lo que tarda como mucho el job de smoke de cada PR (ms). */
export const SMOKE_BUDGET_MS = 3000

const CONFIG = `function fn() {
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    clientId: '${QA_CLIENT_ID}',
    clientSecret: '${QA_CLIENT_SECRET}'
  };
  return config;
}
`

const AUTH = `    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const ACCOUNTS = `Feature: Kobalto Open API · cuentas

  Background:
${AUTH}

  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'

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
`

const ERRORS = `Feature: Kobalto Open API · errores

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
      | id con formato no válido  | 'accounts', 'cuenta-1'  | 400    | INVALID_ACCOUNT_ID |
      | cuenta inexistente        | 'accounts', 'ACC-9999'  | 404    | ACCOUNT_NOT_FOUND  |
      | transferencia inexistente | 'transfers', 'TRF-9999' | 404    | TRANSFER_NOT_FOUND |
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

const TRANSFERS = `Feature: Kobalto Open API · transferencias

  Background:
${AUTH}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transferencia <caso>
${TRANSFER_STEPS}

    Examples:
      | caso              | iban                     | amount | concepto |
      | a Kobalto         | ES9121000418450200051333 | 25.5   | Cena     |
      | a otro banco      | ES1420805801101234567891 | 40     | Alquiler |
      | con céntimos      | ES9121000418450200051333 | 0.99   | Café     |
      | importe redondo   | ES1420805801101234567891 | 100    | Regalo   |

  Scenario: el saldo baja al confirmar
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
    # Comprobado en local: 1520.35 − 25.5 − 40 − 0.99 − 100 − 10
    And match response.available == 1343.86
`

const NIGHTLY = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

// Job nocturno: toda la regresión, en paralelo.
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

// Job de cada pull request: solo lo imprescindible, en segundos.
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

const PATH = (re: RegExp) => (sc: ScenarioResult) => sc.requests.some((r) => re.test(r.path))
const createsSandboxAccount = PATH(/^\/v1\/sandbox\/accounts$/)
/** Id de las cuentas de prueba creadas en el escenario. */
const sandboxIds = (sc: ScenarioResult) =>
  sc.requests.filter((r) => r.path === '/v1/sandbox/accounts' && r.status === 201).map((r) => String((r.responseBody as Record<string, unknown> | null)?.id ?? ''))
const confirms = (sc: ScenarioResult) => sc.requests.filter((r) => r.method === 'POST' && /^\/v1\/transfers\/[^/]+\/confirm$/.test(r.path))

/** IDE de la misión 9: runners JUnit 5, tags, paralelo, datos propios y pipeline. */
export const m08Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', auth: true, async: true, sandboxData: true }),
  config: KARATE_CONFIG,
  configFile: M08_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  pipeline: {
    cost: 10,
    jobs: [
      { id: 'nightly', label: 'Nocturno · regresión', trigger: 'cada noche (02:00)', runner: M08_NIGHTLY_PATH },
      { id: 'pr', label: 'PR · smoke', trigger: 'en cada pull request', runner: M08_SMOKE_PATH },
    ],
  },
  files: [
    { path: M08_ACCOUNTS_PATH, content: ACCOUNTS },
    { path: M08_ERRORS_PATH, content: ERRORS },
    { path: M08_TRANSFERS_PATH, content: TRANSFERS },
    { path: M08_LOGIN_PATH, content: M05_SOLUTION_LOGIN },
    { path: M08_NIGHTLY_PATH, content: NIGHTLY },
    { path: M08_SMOKE_PATH, content: SMOKE },
    { path: M08_CONFIG_PATH, content: CONFIG, readOnly: true },
  ],
  snippets: [
    { label: 'assertEquals', code: 'assertEquals(0, results.getFailCount(), results.getErrorMessages());' },
    { label: 'import Assertions', code: 'import static org.junit.jupiter.api.Assertions.*;' },
    { label: '@smoke', code: '@smoke' },
    { label: 'cuenta propia', code: "Given path 'sandbox', 'accounts'\nAnd request { balance: 100, currency: 'EUR' }\nWhen method post\nThen status 201\n* def cuenta = response" },
    { label: 'informe JSON', code: '.outputCucumberJson(true)' },
  ],
  retos: [
    {
      id: 'assert',
      title: 'Que el rojo sea rojo',
      description: 'El nocturno salió **verde** con escenarios fallidos: el runner imprime los fallos, pero no hace fallar el test. Haz que `OpenApiRunner` **rompa el build** si hay fallos y lánzalo en el pipeline.',
      hint: 'Añade `import static org.junit.jupiter.api.Assertions.*;` y, al final del método, `assertEquals(0, results.getFailCount(), results.getErrorMessages());`.',
      check: (_s, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'nightly' && ctx.pipeline.spec.asserts && ctx.pipeline.spec.errors.length === 0,
    },
    {
      id: 'smoke',
      title: 'Smoke en cada PR',
      description: `El job de cada pull request ejecuta solo lo marcado con \`@smoke\`. Marca **al menos 3** escenarios rápidos e imprescindibles para que el job pase en **menos de ${SMOKE_BUDGET_MS / 1000} s**.`,
      hint: 'Pon `@smoke` en la línea de antes de `Scenario:` (salud de la API, detalle de una cuenta, un error 404…). Las transferencias esperan segundos: no son smoke.',
      check: (scs, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'pr' && ctx.pipeline.build === 'SUCCESS' && ctx.pipeline.spec.asserts && scs.length >= 3 && scs.every((sc) => sc.status === 'passed') && ctx.pipeline.wallMs < SMOKE_BUDGET_MS,
    },
    {
      id: 'aislado',
      title: 'Datos propios',
      description: 'El test del saldo da por hecho que nadie más usa ACC-1001: en paralelo, otras transferencias cambian el saldo a la vez. Haz que cree **su propia cuenta** (`POST /sandbox/accounts`), transfiera desde ella y compruebe su saldo.',
      hint: "`Given path 'sandbox', 'accounts'` con `request { balance: 100, currency: 'EUR' }` → `* def cuenta = response`. Transfiere 10 desde `cuenta.id` y espera `available == 90`.",
      check: (scs) =>
        scs.some((sc) => {
          const ids = sandboxIds(sc)
          return (
            sc.status === 'passed' &&
            ids.length > 0 &&
            confirms(sc).length > 0 &&
            sc.requests.some((r) => r.method === 'POST' && r.path === '/v1/transfers' && ids.includes(String((r.body as Record<string, unknown> | undefined)?.fromAccount))) &&
            sc.requests.some((r) => ids.some((id) => r.path === `/v1/accounts/${id}/balance`))
          )
        }),
    },
    {
      id: 'estable',
      title: 'Tres noches seguidas',
      description: 'Un test que unas veces pasa y otras no es peor que no tenerlo. Lanza el **nocturno** (con al menos 2 hilos) **3 veces seguidas** sin que nada falle por culpa de los tests. Lo que falle por un bug real de la API, cuenta como correcto.',
      hint: 'Cada ejecución del pipeline reparte los escenarios en otro orden. Si algo falla solo a veces, mira si depende de datos que otro escenario cambia… o si el fallo es de la API.',
      check: (_s, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'nightly' && ctx.pipeline.spec.threads >= 2 && ctx.pipeline.streak >= 3,
    },
    {
      id: 'reserva',
      title: 'Dos pendientes, un saldo',
      description: 'Carmen: con una cuenta propia de **100 €**, crea **dos** transferencias de 80 € y confírmalas. La segunda confirmación debe recibir **422** `INSUFFICIENT_FUNDS`: el saldo ya no llega.',
      hint: 'Las dos se crean bien (201): el saldo se comprueba otra vez al confirmar. Confirma la primera (202) y la segunda (422).',
      visibleWhen: { kind: 'flag', key: 'carmen.reserva' },
      check: (scs) => scs.some((sc) => createsSandboxAccount(sc) && confirms(sc).length >= 2 && sc.statusChecks.includes(422) && correct(sc, KOBALTO_API_BUGS.reserva)),
    },
    {
      id: 'informe',
      title: 'Resultados en el gestor de pruebas',
      description: 'Alba quiere ver los resultados de cada noche en el gestor de pruebas (Xray), que importa el **JSON de Cucumber**. Haz que el runner nocturno lo genere y lánzalo.',
      hint: 'En la cadena del Runner, antes de `.parallel(…)`: `.outputCucumberJson(true)`. Karate lo deja en target/karate-reports.',
      visibleWhen: { kind: 'flag', key: 'alba.informe' },
      check: (_s, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'nightly' && ctx.pipeline.spec.reports.includes('cucumber-json'),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M08_SOLUTION_NIGHTLY = `package openapi;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// Job nocturno: toda la regresión, en paralelo.
class OpenApiRunner {

    @Test
    void regression() {
        Results results = Runner.path("classpath:openapi")
                .tags("~@ignore")
                .outputCucumberJson(true)
                .parallel(4);
        assertEquals(0, results.getFailCount(), results.getErrorMessages());
    }
}
`

export const M08_SOLUTION_ACCOUNTS = ACCOUNTS.replace(/\n {2}Scenario: /g, '\n  @smoke\n  Scenario: ')

export const M08_SOLUTION_TRANSFERS = `Feature: Kobalto Open API · transferencias

  Background:
${AUTH}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transferencia <caso>
${TRANSFER_STEPS}

    Examples:
      | caso              | iban                     | amount | concepto |
      | a Kobalto         | ES9121000418450200051333 | 25.5   | Cena     |
      | a otro banco      | ES1420805801101234567891 | 40     | Alquiler |
      | con céntimos      | ES9121000418450200051333 | 0.99   | Café     |
      | importe redondo   | ES1420805801101234567891 | 100    | Regalo   |

  Scenario: el saldo baja al confirmar (cuenta propia)
    Given path 'sandbox', 'accounts'
    And request { balance: 100, currency: 'EUR' }
    When method post
    Then status 201
    * def cuenta = response
    Given path 'transfers'
    And request { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR', concept: 'Saldo' }
    When method post
    Then status 201
    Given path 'transfers', response.id, 'confirm'
    When method post
    Then status 202
    Given path 'accounts', cuenta.id, 'balance'
    When method get
    Then status 200
    And match response.available == 90

  Scenario: dos pendientes no pueden gastar el mismo saldo
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
    And match response.code == 'INSUFFICIENT_FUNDS'
`
