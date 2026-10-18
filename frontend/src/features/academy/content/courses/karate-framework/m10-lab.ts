import type { CodeLabModel } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { M05_SOLUTION_LOGIN } from './m05-lab'
import { M08_SOLUTION_NIGHTLY } from './m08-lab'
import { M09_SOLUTION_CONFIG, M09_SOLUTION_ERROR_SCHEMA, M09_SOLUTION_UTIL } from './m09-lab'
import { KARATE_CONFIG, correct } from './shared'

const ROOT = 'src/test/java/'
const DIR = `${ROOT}openapi`
export const M10_PATHS = {
  config: `${ROOT}karate-config.js`,
  orders: `${DIR}/standing-orders.feature`,
  login: `${DIR}/auth/login.feature`,
  errorSchema: `${DIR}/schemas/error.json`,
  util: `${ROOT}common/cuenta-prueba.feature`,
  nightly: `${DIR}/OpenApiRunner.java`,
}
/** Escenarios mínimos del nocturno para el reto del pipeline. */
export const EXAM_MIN_SCENARIOS = 8

const ORDERS = `@regression
Feature: Kobalto Open API · órdenes periódicas

  Background:
    * url baseUrl

  # El contrato está en la wiki: «Órdenes periódicas (examen)».
  # Escribe aquí tus escenarios (o crea más features con «Nuevo fichero»).
`

const ORD = '/v1/standing-orders'
const ORD_ID = /^\/v1\/standing-orders\/(SO-\d{4})$/
const body = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const posts = (sc: ScenarioResult) => sc.requests.filter((r) => r.method === 'POST' && r.path === ORD)
const createdIds = (sc: ScenarioResult) => posts(sc).filter((r) => r.status === 201).map((r) => String(body(r.responseBody).id ?? ''))
const touchesOrders = (sc: ScenarioResult) => sc.requests.some((r) => r.path === ORD || ORD_ID.test(r.path))

/** IDE del examen práctico: órdenes periódicas, sin pistas. */
export const m10Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', auth: true, sandboxData: true, standingOrders: true }),
  config: KARATE_CONFIG,
  configFile: M10_PATHS.config,
  runCost: 3,
  scenarioCost: 1,
  exam: true,
  newFiles: { root: ROOT },
  pipeline: {
    cost: 10,
    jobs: [{ id: 'nightly', label: 'Nocturno · regresión', trigger: 'cada noche (02:00)', runner: M10_PATHS.nightly }],
  },
  files: [
    { path: M10_PATHS.orders, content: ORDERS },
    { path: M10_PATHS.login, content: M05_SOLUTION_LOGIN },
    { path: M10_PATHS.errorSchema, content: M09_SOLUTION_ERROR_SCHEMA },
    { path: M10_PATHS.util, content: M09_SOLUTION_UTIL },
    { path: M10_PATHS.nightly, content: M08_SOLUTION_NIGHTLY },
    { path: M10_PATHS.config, content: M09_SOLUTION_CONFIG },
  ],
  snippets: [],
  retos: [
    {
      id: 'contrato',
      title: 'Contrato de una orden',
      description: 'Valida la respuesta completa de una orden periódica (crear o consultar) contra su contrato: **todos** sus campos, con marcadores donde el valor no sea fijo.',
      hint: '',
      check: (scs) =>
        scs.some((sc) => touchesOrders(sc) && correct(sc) && sc.matches.some((m) => m.wholeResponse && m.op === '==' && (m.rhsKeys.length >= 6 || (m.rhsFromVar !== undefined && m.markers.length >= 4)))),
    },
    {
      id: 'encadenar',
      title: 'Crear y consultar',
      description: 'Crea una orden y consúltala después por su id, comprobando que lo guardado es lo que enviaste.',
      hint: '',
      check: (scs) =>
        scs.some((sc) => {
          const ids = createdIds(sc)
          return sc.status === 'passed' && ids.length > 0 && sc.requests.some((r) => r.method === 'GET' && ids.some((id) => r.path === `${ORD}/${id}`) && r.status === 200) && sc.matches.length > 0
        }),
    },
    {
      id: 'limites',
      title: 'Valores límite',
      description: 'Un `Scenario Outline` de al menos **4 filas** que pruebe los bordes de las reglas al crear (importe, fecha de inicio…), con filas que se aceptan y filas que se rechazan.',
      hint: '',
      check: (scs) => {
        const rows = scs.filter((sc) => sc.outline && posts(sc).length > 0 && correct(sc))
        const codes = new Set(rows.flatMap((sc) => sc.statusChecks))
        return rows.length >= 4 && codes.has(201) && [...codes].some((c) => c >= 400)
      },
    },
    {
      id: 'negativos',
      title: 'Entradas no válidas',
      description: 'Al menos **3** casos de creación con datos no válidos que esperen **400** y comprueben qué campo falla, sobre **2 campos distintos** como mínimo.',
      hint: '',
      check: (scs) => {
        const neg = scs.filter((sc) => posts(sc).length > 0 && sc.statusChecks.includes(400) && sc.matches.some((m) => /field|code/.test(m.lhs) || m.rhsKeys.includes('field')) && correct(sc))
        const fields = new Set(neg.flatMap((sc) => posts(sc).filter((r) => r.status === 400).map((r) => String(body(r.responseBody).field ?? ''))).filter(Boolean))
        return neg.length >= 3 && fields.size >= 2
      },
    },
    {
      id: 'cancelar',
      title: 'Cancelar',
      description: 'Cancela una orden (`DELETE`) y comprueba que, después, aparece como **CANCELLED**.',
      hint: '',
      check: (scs) =>
        scs.some((sc) => {
          const del = sc.requests.findIndex((r) => r.method === 'DELETE' && ORD_ID.test(r.path))
          return del >= 0 && sc.statusChecks.includes(204) && sc.requests.slice(del + 1).some((r) => r.method === 'GET' && ORD_ID.test(r.path)) && sc.matches.some((m) => /status/.test(m.lhs) || m.rhsKeys.includes('status')) && correct(sc, KOBALTO_API_BUGS.cancelar)
        }),
    },
    {
      id: 'permisos',
      title: 'Permisos',
      description: 'Demuestra que un token de **solo lectura** (`accounts:read`) **no puede cancelar** una orden.',
      hint: '',
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.requests.some((r) => r.path === '/v1/auth/token' && body(r.body).scope === 'accounts:read') &&
            sc.requests.some((r) => r.method === 'DELETE' && ORD_ID.test(r.path)) &&
            sc.statusChecks.includes(403) &&
            correct(sc, KOBALTO_API_BUGS.scopeDelete),
        ),
    },
    {
      id: 'datos',
      title: 'Datos propios',
      description: 'Cada cuenta admite pocas órdenes activas. Que **todas** las órdenes que crea la suite salgan de **cuentas de prueba** creadas por los propios escenarios, en al menos 3 escenarios.',
      hint: '',
      check: (scs) => {
        const all = scs.flatMap(posts)
        const fromSandbox = (r: { body?: unknown }) => /^ACC-9\d{3}$/.test(String(body(r.body).fromAccount ?? ''))
        return all.length > 0 && all.every(fromSandbox) && scs.filter((sc) => posts(sc).length > 0 && correct(sc)).length >= 3
      },
    },
    {
      id: 'pipeline',
      title: 'En el nocturno',
      description: `Lanza el **nocturno** (en paralelo y rompiendo el build si algo falla) con al menos **${EXAM_MIN_SCENARIOS} escenarios** y sin fallos achacables a los tests.`,
      hint: '',
      check: (scs, _f, ctx) => !!ctx.pipeline && ctx.pipeline.job === 'nightly' && ctx.pipeline.spec.asserts && ctx.pipeline.spec.threads >= 2 && ctx.pipeline.streak >= 1 && scs.length >= EXAM_MIN_SCENARIOS,
    },
  ],
}

/** Solución de referencia (tests). */
export const M10_SOLUTION_SCHEMA_PATH = `${DIR}/schemas/standing-order.json`
export const M10_SOLUTION_SCHEMA = `{
  "id": "#regex SO-[0-9]{4}",
  "fromAccount": "#regex ACC-[0-9]{4}",
  "toIban": "#regex ES[0-9]{22}",
  "amount": "#number",
  "currency": "#regex EUR|USD",
  "frequency": "#regex WEEKLY|MONTHLY|QUARTERLY",
  "startDate": "#regex [0-9]{4}-[0-9]{2}-[0-9]{2}",
  "nextExecution": "##string",
  "concept": "##string",
  "status": "#regex ACTIVE|CANCELLED",
  "createdAt": "#string"
}
`

export const M10_SOLUTION_ORDERS = `@regression
Feature: Kobalto Open API · órdenes periódicas

  Background:
    * url baseUrl
    * def r = call read('classpath:common/cuenta-prueba.feature') { balance: 500 }
    * def orden = { fromAccount: '#(r.cuenta.id)', toIban: 'ES9121000418450200051333', amount: 50, currency: 'EUR', frequency: 'MONTHLY', startDate: '2026-11-01' }
    * def orderSchema = read('schemas/standing-order.json')
    * def errorSchema = read('schemas/error.json')

  Scenario: crear una orden cumple el contrato y se puede consultar
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    And match response == orderSchema
    * def id = response.id
    Given path 'standing-orders', id
    When method get
    Then status 200
    And match response contains { amount: 50, frequency: 'MONTHLY', status: 'ACTIVE', nextExecution: '2026-11-01' }

  Scenario Outline: límites al crear · <caso>
    * set orden.amount = <amount>
    * set orden.startDate = '<fecha>'
    Given path 'standing-orders'
    And request orden
    When method post
    Then status <status>

    Examples:
      | caso                  | amount  | fecha      | status |
      | importe mínimo        | 0.01    | 2026-11-01 | 201    |
      | importe máximo        | 1000    | 2026-11-01 | 201    |
      | por encima del máximo | 1000.01 | 2026-11-01 | 422    |
      | empieza hoy           | 50      | 2026-10-23 | 201    |
      | empieza ayer          | 50      | 2026-10-22 | 400    |

  Scenario Outline: entrada no válida · <campo>
    * set orden.<campo> = <valor>
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 400
    And match response == errorSchema
    And match response.field == '<campo>'

    Examples:
      | campo     | valor     |
      | frequency | 'monthly' |
      | frequency | 'DAILY'   |
      | amount    | 0         |
      | startDate | '1/11/26' |

  Scenario: cancelar una orden
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    * def id = response.id
    Given path 'standing-orders', id
    When method delete
    Then status 204
    Given path 'standing-orders', id
    When method get
    Then status 200
    And match response.status == 'CANCELLED'

  Scenario: un token de solo lectura no puede cancelar
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    * def id = response.id
    * def ro = call read('classpath:openapi/auth/login.feature') { scope: 'accounts:read' }
    Given path 'standing-orders', id
    And header Authorization = 'Bearer ' + ro.token
    When method delete
    Then status 403
    And match response.code == 'INSUFFICIENT_SCOPE'
`

export const M10_SOLUTION = {
  [M10_PATHS.orders]: M10_SOLUTION_ORDERS,
  [M10_SOLUTION_SCHEMA_PATH]: M10_SOLUTION_SCHEMA,
}
