import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, KOBALTO_IBANS, QA_CLIENT_ID, QA_CLIENT_SECRET, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { M05_SOLUTION_LOGIN } from './m05-lab'
import { KARATE_CONFIG, RUNNER_JAVA, correct } from './shared'

export const M06_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M06_TRANSFERS_PATH = 'src/test/java/openapi/transfers.feature'
export const M06_ERRORS_PATH = 'src/test/java/openapi/errors.feature'
export const M06_LOGIN_PATH = 'src/test/java/openapi/auth/login.feature'

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

const AUTH_BACKGROUND = `  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }`

const TRANSFERS = `Feature: Kobalto Open API · transferencias

  # Escrito para la 1.6. Anoche se desplegó la 1.7.

${AUTH_BACKGROUND}

  Scenario: crear y confirmar una transferencia
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

const ERRORS = `Feature: Kobalto Open API · errores

${AUTH_BACKGROUND}

  Scenario: una cuenta que no existe
    Given path 'accounts', 'ACC-9999'
    When method get
    Then status 404
`

const TRANSFER_PATH = /^\/v1\/transfers\/([^/]+)$/
const hasStep = (sc: ScenarioResult, re: RegExp) => sc.steps.some((st) => re.test(st.text))
const errorScenario = (sc: ScenarioResult) => sc.statusChecks.some((s) => s >= 400)

/** El escenario confirma (202) y espera con retry until hasta ver la transferencia completada. */
function waitsForCompletion(sc: ScenarioResult): boolean {
  if (!hasStep(sc, /^retry\s+until\b/) || !sc.statusChecks.includes(202)) return false
  return sc.requests.some((r) => r.method === 'POST' && /\/confirm$/.test(r.path) && r.status === 202)
}

/** IDE de la misión 7: casos negativos, esquema de error, retry until y fallos simulados. */
export const m06Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', auth: true, async: true, faults: true }),
  config: KARATE_CONFIG,
  configFile: M06_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M06_TRANSFERS_PATH, content: TRANSFERS },
    { path: M06_ERRORS_PATH, content: ERRORS },
    { path: M06_LOGIN_PATH, content: M05_SOLUTION_LOGIN },
    { path: M06_CONFIG_PATH, content: CONFIG, readOnly: true },
    RUNNER_JAVA,
  ],
  snippets: [
    { label: 'esquema de error', code: "* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }" },
    { label: 'match esquema', code: 'And match response == errorSchema' },
    {
      label: 'tabla de errores',
      code: "Scenario Outline: <caso> → <status> <code>\n  Given path <ruta>\n  When method get\n  Then status <status>\n  And match response.code == '<code>'\n\n  Examples:\n    | caso               | ruta                   | status | code              |\n    | cuenta inexistente | 'accounts', 'ACC-9999' | 404    | ACCOUNT_NOT_FOUND |",
    },
    { label: 'configure retry', code: '* configure retry = { count: 10, interval: 1000 }' },
    { label: 'retry until', code: "Given path 'transfers', id\nAnd retry until response.status == 'COMPLETED'\nWhen method get" },
    { label: 'x-sandbox-fault', code: "And header x-sandbox-fault = '503'" },
    { label: 'responseHeaders', code: "And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'" },
  ],
  retos: [
    {
      id: 'esquema',
      title: 'Un esquema para todos los errores',
      description: 'Todos los errores de la API comparten formato: `{ code, message, traceId }` (y `field` en las validaciones). Define el esquema **una vez** con `def` y úsalo con `match response == …` en escenarios de al menos **2 códigos de error distintos**.',
      hint: "En el Background: `* def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }`. `##string` es opcional: solo lo traen las validaciones.",
      check: (scs) => {
        const statuses = new Set<number>()
        for (const sc of scs) {
          if (!errorScenario(sc) || !correct(sc)) continue
          if (!sc.matches.some((m) => m.wholeResponse && m.rhsFromVar && sc.defs.concat(scs.flatMap((x) => x.defs)).some((d) => d.name === m.rhsFromVar && d.kind === 'object' && d.markers >= 3))) continue
          for (const s of sc.statusChecks) if (s >= 400) statuses.add(s)
        }
        return statuses.size >= 2
      },
    },
    {
      id: 'negativos',
      title: 'La tabla de errores',
      description: 'Un `Scenario Outline` con al menos **4 filas** de error que comprueben el `status` y el `code` de cada una, con **3 códigos HTTP distintos** como mínimo (400, 404, 405…). La guía de errores de la wiki tiene el catálogo.',
      hint: "Columnas `caso`, `ruta`, `status` y `code`; en el paso: `Given path <ruta>` (la celda puede ser `'accounts', 'ACC-9999'`). Ideas: id con formato malo (400), cuenta o transferencia inexistente (404), GET sobre /transfers (405).",
      check: (scs) => {
        const rows = scs.filter((sc) => sc.outline && errorScenario(sc) && correct(sc) && sc.matches.some((m) => /\.code\b/.test(m.lhs) || m.rhsKeys.includes('code')))
        const statuses = new Set(rows.flatMap((sc) => sc.statusChecks.filter((s) => s >= 400)))
        return rows.length >= 4 && statuses.size >= 3
      },
    },
    {
      id: 'asincrona',
      title: 'Esperar sin dormir',
      description: 'En la 1.7, confirmar devuelve **202** con `status: PROCESSING` y la transferencia se completa unos segundos después. Arregla el escenario: confirma, comprueba el 202 y consulta con `retry until` hasta que esté **COMPLETED**.',
      hint: "`Given path 'transfers', id` · `And retry until response.status == 'COMPLETED'` · `When method get`. Si ves «too many retry attempts: 3», mira en la guía cuánto tarda y ajusta `configure retry = { count: …, interval: … }`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.status === 'passed' &&
            waitsForCompletion(sc) &&
            sc.requests.some((r) => r.method === 'GET' && TRANSFER_PATH.test(r.path) && (r.responseBody as { status?: string } | null)?.status === 'COMPLETED'),
        ),
    },
    {
      id: 'basura',
      title: 'Entrada basura, respuesta limpia',
      description: 'Los partners mandan de todo. Un importe como texto (`amount: \'10,50\'`) debe recibir **400** `VALIDATION_ERROR` con `field: amount`, nunca un 500.',
      hint: "Copia el POST de /transfers con `amount: '10,50'` y espera `status 400` y `match response.field == 'amount'`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.requests.some((r) => r.method === 'POST' && r.path === '/v1/transfers' && typeof (r.body as Record<string, unknown> | undefined)?.amount === 'string') &&
            sc.statusChecks.includes(400) &&
            correct(sc, KOBALTO_API_BUGS.parseo),
        ),
    },
    {
      id: 'caida',
      title: 'Cuando el servidor cae',
      description: 'Carmen: si la API está caída, los partners deben recibir **503** con el formato de error y la cabecera **Retry-After** (cuándo reintentar). El sandbox lo simula con la cabecera `x-sandbox-fault: 503`.',
      hint: "`And header x-sandbox-fault = '503'` antes de `method`. Después: `match responseHeaders['Retry-After'][0] == '#regex [0-9]+'`.",
      visibleWhen: { kind: 'flag', key: 'carmen.fault' },
      check: (scs) =>
        scs.some(
          (sc) =>
            correct(sc) &&
            sc.statusChecks.includes(503) &&
            sc.requests.some((r) => r.status === 503 && Object.keys(r.headers).some((h) => h.toLowerCase() === 'x-sandbox-fault')) &&
            (sc.matches.some((m) => /responseHeaders/.test(m.lhs)) || hasStep(sc, /^assert\b.*responseHeaders/)),
        ),
    },
    {
      id: 'externa',
      title: 'A otro banco',
      description: 'Alba: la mayoría de transferencias de Finvo van a **otros bancos**. Prueba también una transferencia a un IBAN que no sea de Kobalto: debe completarse igual (PROCESSING → COMPLETED).',
      hint: 'Convierte el escenario en un `Scenario Outline` con una columna `iban`: uno de Kobalto (ES9121000418450200051333) y otro de fuera (por ejemplo ES1420805801101234567891).',
      visibleWhen: { kind: 'flag', key: 'alba.externa' },
      check: (scs) =>
        scs.some(
          (sc) =>
            waitsForCompletion(sc) &&
            sc.requests.some((r) => r.method === 'POST' && r.path === '/v1/transfers' && r.status === 201 && !KOBALTO_IBANS.has(String((r.body as Record<string, unknown> | undefined)?.toIban ?? ''))) &&
            correct(sc, KOBALTO_API_BUGS.asincrona),
        ),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M06_SOLUTION_TRANSFERS = `Feature: Kobalto Open API · transferencias

${AUTH_BACKGROUND}
    * configure retry = { count: 10, interval: 1000 }

  Scenario Outline: transferencia <destino>: se confirma y se completa
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: '<iban>', amount: 25.5, currency: 'EUR', concept: 'Cena' }
    When method post
    Then status 201
    * def id = response.id
    Given path 'transfers', id, 'confirm'
    When method post
    Then status 202
    And match response.status == 'PROCESSING'
    Given path 'transfers', id
    And retry until response.status == 'COMPLETED'
    When method get
    Then status 200
    And match response.completedAt == '#string'

    Examples:
      | destino      | iban                     |
      | en Kobalto   | ES9121000418450200051333 |
      | a otro banco | ES1420805801101234567891 |
`

export const M06_SOLUTION_ERRORS = `Feature: Kobalto Open API · errores

${AUTH_BACKGROUND}
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
      | GET sobre /transfers      | 'transfers'             | 405    | METHOD_NOT_ALLOWED |

  Scenario: importe como texto → 400, no 500
    Given path 'transfers'
    And request { fromAccount: '#(accountId)', toIban: 'ES9121000418450200051333', amount: '10,50', currency: 'EUR' }
    When method post
    Then status 400
    And match response == errorSchema
    And match response contains { code: 'VALIDATION_ERROR', field: 'amount' }

  Scenario: el servicio cae → 503 con Retry-After
    Given path 'accounts', accountId
    And header x-sandbox-fault = '503'
    When method get
    Then status 503
    And match response == errorSchema
    And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'
`
