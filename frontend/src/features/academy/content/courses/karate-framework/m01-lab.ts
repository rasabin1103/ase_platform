import type { CodeLabModel } from '../../../karate/types'
import type { MatchRecord, ScenarioResult } from '../../../karate/runner'
import { KOBALTO_API_BUGS } from '../../../karate/apis/kobaltoOpenApi'
import { KARATE_CONFIG, KARATE_CONFIG_JS, RUNNER_JAVA, accountRequested, correct, openApiServer, requested } from './shared'

const FEATURE = `Feature: Kobalto Open API · contrato de cuentas

  # Ayer: smoke. Hoy: contrato. Un test de contrato valida la FORMA de la
  # respuesta (campos, tipos y formatos), no unos datos concretos.

  Background:
    * url baseUrl

  Scenario: detalle de una cuenta
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response.id == 'ACC-1001'
    # Valida aquí el contrato completo con marcadores difusos:
    # And match response == { id: '#string', ... }
`

const ACCOUNT_FIELDS = ['id', 'iban', 'holder', 'type', 'currency', 'balance', 'status', 'createdAt']

/** match == de la respuesta entera (o de cada elemento) contra un objeto con todos los campos. */
function fullSchema(m: MatchRecord): boolean {
  return m.op === '==' && m.rhsKind === 'object' && ACCOUNT_FIELDS.every((f) => m.rhsKeys.includes(f)) && m.markers.filter((x) => x.startsWith('#')).length >= 4
}

const detailSchema = (sc: ScenarioResult) => accountRequested(sc) && sc.matches.some((m) => !m.each && m.wholeResponse && fullSchema(m))

/** IDE de la misión 2: contratos con match y marcadores difusos. */
export const m01Lab: CodeLabModel = {
  server: openApiServer,
  config: KARATE_CONFIG,
  env: 'sandbox',
  runCost: 3,
  scenarioCost: 1,
  files: [{ path: 'src/test/java/openapi/accounts.feature', content: FEATURE }, KARATE_CONFIG_JS, RUNNER_JAVA],
  snippets: [
    { label: 'esquema', code: "And match response == { id: '#string', iban: '#string', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string' }" },
    { label: 'def esquema', code: "* def account = { id: '#string', iban: '#regex ES\\\\d{22}', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string' }" },
    { label: 'param', code: "And param status = 'ACTIVE'" },
    { label: 'match each', code: 'And match each response.items == account' },
    { label: 'contains', code: "And match each response.items contains { status: 'ACTIVE' }" },
    { label: '#regex', code: "'#regex ES\\\\d{22}'" },
    { label: '#?', code: "'#number? _ >= 0'" },
    { label: '##string', code: "'##string'" },
  ],
  retos: [
    {
      id: 'esquema',
      title: 'El contrato de una cuenta',
      description: '`match response == { … }` sobre el detalle de una cuenta, con **todos** los campos de la referencia y marcadores difusos (`#string`, `#number`…) en lugar de valores concretos.',
      hint: "Los ocho campos: id, iban, holder, type, currency, balance, status y createdAt. `balance: '#number'`, el resto `'#string'` de momento. Con `==`, una clave de más o de menos hace fallar el match.",
      check: (scs) => scs.some((sc) => detailSchema(sc) && correct(sc, KOBALTO_API_BUGS.contrato)),
    },
    {
      id: 'reutiliza',
      title: 'Un esquema, muchos tests',
      description: 'Guarda el esquema en una variable con `def` (mejor en el `Background`) y úsalo en el `match`: `match response == account`.',
      hint: "En el Background: `* def account = { id: '#string', … }`. En el escenario: `And match response == account`.",
      check: (scs) => scs.some((sc) => sc.defs.some((d) => d.kind === 'object' && d.markers >= 4) && sc.matches.some((m) => !!m.rhsFromVar && sc.defs.some((d) => d.name === m.rhsFromVar && d.markers >= 4))),
    },
    {
      id: 'formato',
      title: 'Más que tipos: formatos',
      description: 'Afina el esquema: `#regex` para el IBAN (ES y 22 dígitos) y un predicado para el saldo (`#number? _ >= 0`). Tiene que seguir pasando.',
      hint: "`iban: '#regex ES\\\\d{22}'` (en un string de Karate la barra se escribe doble) y `balance: '#number? _ >= 0'`.",
      check: (scs) => scs.some((sc) => sc.matches.some((m) => fullSchema(m) && m.markers.some((x) => x.startsWith('#regex')) && m.markers.some((x) => x.includes('?'))) && correct(sc, KOBALTO_API_BUGS.contrato)),
    },
    {
      id: 'lista',
      title: 'El filtro de cuentas activas',
      description: '`GET /accounts` con `param status = \'ACTIVE\'`: comprueba que **todas** las cuentas de `response.items` están activas con `match each`.',
      hint: "`And match each response.items contains { status: 'ACTIVE' }`. `contains` compara solo las claves que pones.",
      check: (scs) =>
        scs.some(
          (sc) =>
            requested(sc, 'GET', '/v1/accounts') &&
            sc.requests.some((r) => r.query.status?.includes('ACTIVE')) &&
            sc.matches.some((m) => m.each && /items/.test(m.lhs) && (m.rhsKeys.includes('status') || /ACTIVE/.test(m.text))) &&
            correct(sc, KOBALTO_API_BUGS.filtro),
        ),
    },
    {
      id: 'tipos',
      title: 'El contrato de cada elemento',
      description: 'Los elementos de `response.items` son cuentas: valida cada uno con el esquema (`match each response.items == account`).',
      hint: 'Reutiliza la variable del Background. Si algo falla, lee el mensaje: `$[1].balance | not a number` te dice el elemento y el campo.',
      check: (scs) =>
        scs.some(
          (sc) =>
            requested(sc, 'GET', '/v1/accounts') &&
            sc.matches.some((m) => m.each && /items/.test(m.lhs) && m.op === '==' && (fullSchema(m) || (!!m.rhsFromVar && sc.defs.some((d) => d.name === m.rhsFromVar && d.markers >= 4)))) &&
            correct(sc),
        ),
    },
    {
      id: 'evolucion',
      title: 'La versión 1.5',
      description: 'Nico ha desplegado la 1.5. Según el changelog, añade el campo opcional `alias`. Adapta el esquema (`##string`: puede faltar o ser null) y vuelve a ejecutar. Lo que siga fallando, ¿es un cambio compatible o un bug?',
      hint: "`alias: '##string'` en el esquema. Un campo nuevo, opcional y documentado es compatible. Que desaparezca un campo que los partners usan, no.",
      visibleWhen: { kind: 'flag', key: 'api.v15' },
      check: (scs, flags) => !!flags['api.v15'] && scs.some((sc) => detailSchema(sc) && sc.matches.some((m) => m.rhsKeys.includes('alias') || m.markers.some((x) => x.startsWith('##'))) && correct(sc, KOBALTO_API_BUGS.contrato)),
    },
  ],
}

/** Para tests: un escenario sin cambios del proyecto inicial. */
export const M01_STARTER = FEATURE
