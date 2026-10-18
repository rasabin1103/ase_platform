import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { KARATE_CONFIG, RUNNER_JAVA, correct } from './shared'

export const M04_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M04_FEATURE_PATH = 'src/test/java/openapi/rules.feature'
export const M04_PAYLOAD_PATH = 'src/test/java/openapi/payloads/transfer.json'
export const M04_DATA_PATH = 'src/test/java/openapi/data/negativos.json'

const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001'
  };
  return config;
}
`

const FEATURE = `Feature: Kobalto Open API · reglas de las transferencias

  # Las reglas están en la wiki: «Transferencias · reglas para partners».
  # Hoy: un escenario, muchos datos.

  Background:
    * url baseUrl

  Scenario: transferencia de 500 €
    * def amount = 500
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status 201
`

const PAYLOAD = `{
  "fromAccount": "#(accountId)",
  "toIban": "ES9121000418450200051333",
  "amount": "#(amount)",
  "currency": "EUR",
  "concept": "Prueba QA"
}
`

const DATA = `[
  { "name": "IBAN no válido", "patch": { "toIban": "ES12" }, "status": 400, "code": "INVALID_IBAN" }
]
`

const POST = (sc: ScenarioResult) => sc.requests.find((r) => r.method === 'POST' && r.path === '/v1/transfers')
const features = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.feature')).map(([, c]) => c)
/** Filas ejecutadas de cada esquema (por fichero y línea). */
function outlineGroups(scs: ScenarioResult[]): ScenarioResult[][] {
  const groups = new Map<string, ScenarioResult[]>()
  for (const sc of scs) {
    if (!sc.outline) continue
    const key = `${sc.file}:${sc.line}`
    groups.set(key, [...(groups.get(key) ?? []), sc])
  }
  return Array.from(groups.values())
}
const amountOf = (sc: ScenarioResult) => {
  const b = POST(sc)?.body as Record<string, unknown> | undefined
  return b?.amount
}

/** IDE de la misión 5: Scenario Outline, Examples tipados y desde JSON, valores límite. */
export const m04Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', limits: true }),
  config: KARATE_CONFIG,
  configFile: M04_CONFIG_PATH,
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M04_FEATURE_PATH, content: FEATURE },
    { path: M04_PAYLOAD_PATH, content: PAYLOAD },
    { path: M04_DATA_PATH, content: DATA },
    { path: M04_CONFIG_PATH, content: CONFIG, readOnly: true },
    RUNNER_JAVA,
  ],
  snippets: [
    { label: 'Scenario Outline', code: "Scenario Outline: importe <amount> → <status>\n  * def body = read('payloads/transfer.json')\n  Given path 'transfers'\n  And request body\n  When method post\n  Then status <status>\n\n  Examples:\n    | amount! | status |\n    | 500     | 201    |" },
    { label: 'Examples', code: 'Examples:\n  | amount! | status |\n  | 0.01    | 201    |' },
    { label: '| read() |', code: "Examples:\n  | read('data/negativos.json') |" },
    { label: 'karate.merge', code: "* def body = karate.merge(read('payloads/transfer.json'), patch)" },
    { label: "'x'.repeat(n)", code: "* set body.concept = 'x'.repeat(len)" },
    { label: 'match code', code: 'And match response.code == code' },
  ],
  retos: [
    {
      id: 'outline',
      title: 'Un escenario, muchos datos',
      description: 'Convierte el escenario en un `Scenario Outline` con una tabla `Examples:` de al menos **3 importes**. Cada fila es un test independiente en el informe.',
      hint: 'Cambia `Scenario:` por `Scenario Outline:`, usa `<amount>` donde va el dato y añade la tabla. Ojo: una columna normal llega como **texto**; con `amount!` llega como número.',
      check: (scs) => outlineGroups(scs).some((g) => g.length >= 3 && g.every((sc) => !!POST(sc) && correct(sc))),
    },
    {
      id: 'limites',
      title: 'Los bordes',
      description: 'Las reglas dicen: mínimo **0,01 €**, máximo **1.000 €** por transferencia en cuentas personales. Prueba justo a cada lado de cada borde: `0.01`, `1000` y `1000.01` (y si quieres, `0`).',
      hint: 'Un valor dentro y otro fuera de cada límite (análisis de valores límite). Los importes como números: columna `amount!`. Y el resultado esperado de cada fila en otra columna (`status`).',
      check: (scs) => {
        const rows = outlineGroups(scs).flat().filter((sc) => typeof amountOf(sc) === 'number')
        const need = [0.01, 1000, 1000.01]
        return need.every((v) => rows.some((sc) => amountOf(sc) === v && correct(sc)))
      },
    },
    {
      id: 'codigos',
      title: 'Lo esperado, en la tabla',
      description: 'Cada fila dice qué debe pasar: el `status` (y si quieres, el código de error) sale de una columna. Una misma tabla con filas que esperan **201** y filas que esperan un error.',
      hint: '`Then status <status>` con una columna `status`. Para comprobar el error: una columna `code` y `And match response.code == code` (o con `<code>` entre comillas).',
      check: (scs, _f, ctx) =>
        features(ctx.files).some((c) => /status\s+<\w+!?>/.test(c)) &&
        outlineGroups(scs).some((g) => new Set(g.flatMap((sc) => sc.statusChecks)).size >= 2 && g.every((sc) => correct(sc))),
    },
    {
      id: 'negativos',
      title: 'La matriz de errores',
      description: 'Cubre al menos **4 errores distintos** de la especificación: IBAN no válido, divisa distinta, cuenta bloqueada, sin saldo, por encima del límite…',
      hint: 'Datos del sandbox: ACC-1004 está en dólares, ACC-1003 bloqueada y ACC-1002 tiene saldo 0. Con `karate.merge(body, patch)` cambias solo el campo de cada caso.',
      check: (scs) => {
        const codes = new Set<string>()
        for (const sc of scs) {
          if (!correct(sc)) continue
          for (const r of sc.requests) {
            const code = (r.responseBody as Record<string, unknown> | null)?.code
            if (r.method === 'POST' && r.path === '/v1/transfers' && r.status >= 400 && typeof code === 'string') codes.add(code)
          }
        }
        return codes.size >= 4
      },
    },
    {
      id: 'json',
      title: 'Los datos, fuera del feature',
      description: 'Pasa la matriz de errores a `data/negativos.json` y úsala como **Examples dinámicos**: `| read(\'data/negativos.json\') |`. Cada objeto es una fila, con sus tipos.',
      hint: "Debajo de `Examples:` una sola celda: `| read('data/negativos.json') |`. Cada clave del objeto es una variable (`patch`, `status`, `code`…) y `<name>` sirve en el título.",
      check: (scs, _f, ctx) =>
        features(ctx.files).some((c) => /Examples:\s*\n\s*\|\s*read\(/.test(c)) &&
        outlineGroups(scs).some((g) => g.length >= 3 && g.every((sc) => correct(sc)) && g.some((sc) => !!POST(sc))),
    },
    {
      id: 'concepto',
      title: 'El concepto de 140',
      description: 'Carmen recuerda que el concepto de una transferencia SEPA admite hasta **140 caracteres**. Prueba 140 (se acepta) y 141 (se rechaza).',
      hint: "Una tabla con `len!` y `* set body.concept = 'x'.repeat(len)`: genera un texto de esa longitud sin escribirlo.",
      visibleWhen: { kind: 'flag', key: 'carmen.concept' },
      check: (scs) => {
        const lens = scs
          .filter((sc) => correct(sc, KOBALTO_API_BUGS.concepto) || sc.status === 'passed')
          .map((sc) => (POST(sc)?.body as Record<string, unknown> | undefined)?.concept)
          .filter((c): c is string => typeof c === 'string')
          .map((c) => c.length)
        return lens.includes(140) && lens.includes(141)
      },
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M04_SOLUTION_FEATURE = `Feature: Kobalto Open API · reglas de las transferencias

  Background:
    * url baseUrl

  Scenario Outline: importe <amount> → <status>
    * def body = read('payloads/transfer.json')
    Given path 'transfers'
    And request body
    When method post
    Then status <status>

    Examples:
      | amount! | status |
      | 0       | 400    |
      | 0.01    | 201    |
      | 500     | 201    |
      | 1000    | 201    |
      | 1000.01 | 422    |

  Scenario Outline: <name>
    * def amount = 10
    * def body = karate.merge(read('payloads/transfer.json'), patch)
    Given path 'transfers'
    And request body
    When method post
    Then status <status>
    And match response.code == code

    Examples:
      | read('data/negativos.json') |

  Scenario Outline: concepto de <len> caracteres → <status>
    * def amount = 10
    * def body = read('payloads/transfer.json')
    * set body.concept = 'x'.repeat(len)
    Given path 'transfers'
    And request body
    When method post
    Then status <status>

    Examples:
      | len! | status |
      | 140  | 201    |
      | 141  | 400    |
`

export const M04_SOLUTION_DATA = `[
  { "name": "IBAN no válido", "patch": { "toIban": "ES12" }, "status": 400, "code": "INVALID_IBAN" },
  { "name": "divisa distinta de la cuenta", "patch": { "fromAccount": "ACC-1004" }, "status": 422, "code": "CURRENCY_MISMATCH" },
  { "name": "cuenta bloqueada", "patch": { "fromAccount": "ACC-1003" }, "status": 422, "code": "ACCOUNT_NOT_OPERATIVE" },
  { "name": "sin saldo", "patch": { "fromAccount": "ACC-1002" }, "status": 422, "code": "INSUFFICIENT_FUNDS" },
  { "name": "por encima del límite", "patch": { "amount": 1500 }, "status": 422, "code": "LIMIT_EXCEEDED" }
]
`
