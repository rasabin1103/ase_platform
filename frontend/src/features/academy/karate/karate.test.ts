import { describe, expect, it } from 'vitest'
import { Interpreter, Scope } from './js'
import { runMatch } from './match'
import { parseFeature } from './parser'
import { jsonPath, runProject, splitMatch } from './runner'
import { KOBALTO_API_BASE, KOBALTO_API_BUGS, KOBALTO_PRE_KEY, kobaltoOpenApi } from './apis/kobaltoOpenApi'
import { PAYMENTS_BASE, PAYMENTS_BUGS, kobaltoPayments } from './apis/kobaltoPayments'

const js = (src: string) => {
  const i = new Interpreter()
  return i.runProgram(src, new Scope(i.globals))
}
const noEval = () => {
  throw new Error('no')
}

describe('karate · subconjunto de JavaScript', () => {
  it('expresiones, precedencia y objetos', () => {
    expect(js('1 + 2 * 3 ** 2')).toBe(19)
    expect(js('2 ** 3 ** 2')).toBe(512)
    expect(js("var a = { b: [1, 2, { c: 'x' }] }; a.b[2].c + a.b.length")).toBe('x3')
    expect(js('null ?? 4')).toBe(4)
    expect(js('var o = null; o?.x')).toBeUndefined()
    expect(js("typeof nada === 'undefined'")).toBe(true)
    expect(js('`total: ${1 + 1}`')).toBe('total: 2')
  })

  it('funciones, flechas, bucles y métodos permitidos', () => {
    expect(js('function f(x) { return x * 2 } f(21)')).toBe(42)
    expect(js('[1, 2, 3].map(x => x * 10).filter(x => x > 10).reduce((a, b) => a + b, 0)')).toBe(50)
    expect(js('var s = 0; for (var i = 0; i < 5; i++) { if (i == 2) continue; s += i } s')).toBe(8)
    expect(js("var t = ''; for (const k in { a: 1, b: 2 }) t += k; t")).toBe('ab')
    expect(js("'ES76 2100'.replaceAll(' ', '').toLowerCase()")).toBe('es762100')
    expect(js('Math.max(1, 7, 3) + (1.005).toFixed(1).length')).toBe(10)
  })

  it('no deja salir del sandbox ni colgar el navegador', () => {
    expect(() => js('window')).toThrow(/no está definido/)
    expect(() => js("({}).constructor")).toThrow(/no está permitida/)
    expect(() => js("'x'['__proto__']")).toThrow(/no está permitida/)
    expect(() => js('while (true) {}')).toThrow(/límite de pasos/)
  })
})

describe('karate · match', () => {
  it('igualdad con marcadores difusos', () => {
    const a = { id: 'ACC-1', n: 3, tags: ['a', 'b'], x: null }
    expect(runMatch('==', a, { id: '#string', n: '#number', tags: '#[2] #string', x: '#null' }, noEval).pass).toBe(true)
    const r = runMatch('==', a, { id: '#string', n: '#string', tags: '#array', x: '#null' }, noEval)
    expect(r.pass).toBe(false)
    expect(r.message).toContain('$.n | not a string')
  })

  it('claves de más, opcionales y #notpresent', () => {
    expect(runMatch('==', { a: 1, b: 2 }, { a: 1 }, noEval).message).toContain('more key')
    expect(runMatch('==', { a: 1 }, { a: 1, b: '##string' }, noEval).pass).toBe(true)
    expect(runMatch('==', { a: 1, b: null }, { a: 1, b: '##string' }, noEval).pass).toBe(true)
    expect(runMatch('==', { a: 1, b: 2 }, { a: 1, b: '##string' }, noEval).pass).toBe(false)
    expect(runMatch('==', { a: 1 }, { a: 1, b: '#notpresent' }, noEval).pass).toBe(true)
    expect(runMatch('==', { a: 1, b: 2 }, { a: 1, b: '#ignore' }, noEval).pass).toBe(true)
  })

  it('contains, each, regex y predicados', () => {
    expect(runMatch('contains', { a: 1, b: 2 }, { b: 2 }, noEval).pass).toBe(true)
    expect(runMatch('contains', [1, 2, 3], [3, 1], noEval).pass).toBe(true)
    expect(runMatch('!contains', [1, 2, 3], 4, noEval).pass).toBe(true)
    expect(runMatch('contains only', [1, 2], [2, 1], noEval).pass).toBe(true)
    expect(runMatch('contains any', [1, 2], [9, 2], noEval).pass).toBe(true)
    expect(runMatch('==', 'ES7621000418450200051332', '#regex ES\\d{22}', noEval).pass).toBe(true)
    const each = runMatch('contains', [{ s: 'A' }, { s: 'B' }], { s: 'A' }, noEval, true)
    expect(each.pass).toBe(false)
    expect(each.message).toContain('$[1]')
    const i = new Interpreter()
    const ev = (src: string, b: Record<string, unknown>) => {
      const s = new Scope(i.globals)
      for (const [k, v] of Object.entries(b)) s.declare(k, v)
      return i.evalExpression(src, s)
    }
    expect(runMatch('==', 5, '#number? _ > 0', ev).pass).toBe(true)
    expect(runMatch('==', -1, '#? _ >= 0', ev).pass).toBe(false)
  })

  it('separa el operador respetando comillas y llaves', () => {
    expect(splitMatch("response.name == 'a == b'")).toEqual({ lhs: 'response.name', op: '==', rhs: "'a == b'" })
    expect(splitMatch('response.items contains only deep [{ a: 1 }]')?.op).toBe('contains only deep')
    expect(splitMatch("response contains { s: 'x' }")?.op).toBe('contains')
  })

  it('jsonPath reducido', () => {
    const o = { items: [{ id: 1, s: { id: 9 } }, { id: 2 }] }
    expect(jsonPath(o, '$.items[*].id')).toEqual([1, 2])
    expect(jsonPath(o, '$.items[1].id')).toBe(2)
    expect(jsonPath(o, '$..id')).toEqual([1, 9, 2])
  })
})

describe('karate · parser', () => {
  it('lee background, esquemas, tags y docstrings', () => {
    const f = parseFeature(`@api
Feature: Cuentas
  Descripción libre

  Background:
    * url baseUrl

  @smoke
  Scenario: salud
    Given path 'health'
    When method get
    Then status 200

  Scenario Outline: cuenta <id>
    * def body =
      """
      { "a": 1 }
      """
    Examples:
      | id       | code |
      | ACC-1001 | 200  |
      | ACC-9999 | 404  |
`)
    expect(f.tags).toEqual(['api'])
    expect(f.description).toBe('Descripción libre')
    expect(f.background?.steps).toHaveLength(1)
    expect(f.scenarios[0].tags).toEqual(['smoke'])
    expect(f.scenarios[1].examples?.[0].rows).toHaveLength(2)
    expect(f.scenarios[1].steps[0].docString).toBe('{ "a": 1 }')
  })

  it('da errores con línea y pista', () => {
    expect(() => parseFeature('Feature: x\n  Scenario: y\n    given path "a"')).toThrow(/mayúscula/)
    expect(() => parseFeature('Feature: x\n  Scenario: y\n    method get')).toThrow(/falta la palabra clave/)
    expect(() => parseFeature('Scenario: y')).toThrow(/Feature/)
  })
})

const api = kobaltoOpenApi()
const run = (feature: string, bugs: string[] = [], server = api) =>
  runProject({ files: { 'features/accounts.feature': feature }, config: { baseUrl: KOBALTO_API_BASE } }, server, bugs)

describe('karate · ejecución contra la Kobalto Open API', () => {
  it('pasa un smoke test y registra peticiones, matches y log', () => {
    const r = run(`Feature: smoke
  Background:
    * url baseUrl
  Scenario: salud
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'
    And match response == { status: 'UP', service: '#string', version: '#regex \\\\d+\\\\.\\\\d+\\\\.\\\\d+' }
`)
    const sc = r.features[0].scenarios[0]
    expect(sc.error?.message).toBeUndefined()
    expect(sc.status).toBe('passed')
    expect(sc.requests[0]).toMatchObject({ method: 'GET', path: '/v1/health', status: 200 })
    expect(sc.matches[1]).toMatchObject({ wholeResponse: true, rhsKind: 'object' })
    expect(sc.logs[0]).toBe('1 > GET https://api.kobalto.test/v1/health')
  })

  it('un test correcto revela el bug de la cuenta bloqueada; uno incorrecto no', () => {
    const feature = (expected: string) => `Feature: cuentas
  Background:
    * url baseUrl
  Scenario: bloqueada
    Given path 'accounts', 'ACC-1003'
    When method get
    Then status 200
    And match response.status == '${expected}'
`
    const good = run(feature('BLOCKED'), [KOBALTO_API_BUGS.bloqueada]).features[0].scenarios[0]
    expect(good.status).toBe('failed')
    expect(good.error?.message).toContain("$ | not equal (STRING:STRING)\n  'ACTIVE'\n  'BLOCKED'")
    expect(good.revealed).toEqual([KOBALTO_API_BUGS.bloqueada])
    const wrong = run(feature('CLOSED'), [KOBALTO_API_BUGS.bloqueada]).features[0].scenarios[0]
    expect(wrong.status).toBe('failed')
    expect(wrong.revealed).toEqual([])
  })

  it('esquemas, params, each y 404', () => {
    const r = run(
      `Feature: lista
  Background:
    * url baseUrl
    * def account = { id: '#regex ACC-\\\\d{4}', iban: '#string', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string' }
  Scenario: activas
    Given path 'accounts'
    And param status = 'ACTIVE'
    When method get
    Then status 200
    And match each response.items == account
    And match each response.items contains { status: 'ACTIVE' }
  Scenario Outline: cuenta <id>
    Given path 'accounts', '<id>'
    When method get
    Then status <code>
    Examples:
      | id       | code |
      | ACC-1001 | 200  |
      | ACC-9999 | 404  |
      | 12       | 400  |
`,
      [KOBALTO_API_BUGS.filtro, KOBALTO_API_BUGS.tipo],
    )
    const [lista, ...rows] = r.features[0].scenarios
    expect(lista.status).toBe('failed')
    // Falla por los dos bugs a la vez (tipos y filtro): quitar uno solo no basta.
    expect(lista.revealed).toEqual([KOBALTO_API_BUGS.filtro, KOBALTO_API_BUGS.tipo])
    expect(lista.defs[0]).toMatchObject({ name: 'account', kind: 'object', background: true })
    expect(lista.matches[0].rhsFromVar).toBe('account')
    expect(rows.map((s) => s.status)).toEqual(['passed', 'passed', 'passed'])
    expect(rows[1].name).toBe('cuenta ACC-9999')
  })

  it('detecta malos olores y errores típicos de principiante', () => {
    const r = run(`Feature: x
  Scenario: sin aserciones
    * url 'https://api.kobalto.test/v1/accounts/ACC-1001'
    * method get
    * print response
  Scenario: host equivocado
    * url 'https://api.kobalto.com/v1'
    * path 'health'
    * method get
  Scenario: sin url
    * path 'health'
    * method get
`)
    const [a, b, c] = r.features[0].scenarios
    expect(a.status).toBe('passed')
    expect(a.smells).toEqual(expect.arrayContaining(['no-assertions', 'hardcoded-url', 'print-no-match']))
    expect(b.error?.message).toContain('UnknownHostException')
    expect(c.error?.message).toContain('url not set')
  })

  it('la versión 1.5 añade alias y, con el bug, renombra holder', () => {
    const v15 = kobaltoOpenApi({ version: '1.5' })
    const feature = `Feature: contrato
  Scenario: esquema
    * url baseUrl
    * path 'accounts', 'ACC-1002'
    * method get
    * match response == { id: '#string', iban: '#string', holder: '#string', type: '#string', currency: '#string', balance: '#number', status: '#string', createdAt: '#string', alias: '##string' }
`
    expect(run(feature, [], v15).features[0].scenarios[0].status).toBe('passed')
    const broken = run(feature, [KOBALTO_API_BUGS.contrato], v15).features[0].scenarios[0]
    expect(broken.status).toBe('failed')
    expect(broken.revealed).toEqual([KOBALTO_API_BUGS.contrato])
    // Sin «alias» en el esquema, el fallo es por un cambio compatible y documentado: no es un bug.
    const strict = run(feature.replace(", alias: '##string'", ''), [], v15).features[0].scenarios[0]
    expect(strict.status).toBe('failed')
    expect(strict.revealed).toEqual([])
  })
})

describe('karate · karate-config.js y entornos', () => {
  const pre = kobaltoOpenApi({ version: '1.5', pre: true })
  const CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = { baseUrl: 'https://api.kobalto.test/v1', accountId: 'ACC-1001', correlationId: 'qa-1' };
  var headers = { 'x-correlation-id': config.correlationId };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
    config.accountId = 'ACC-2001';
    headers['x-api-key'] = karate.properties['kobalto.apiKey'];
  }
  karate.configure('headers', headers);
  return config;
}`
  const FEATURE = `Feature: x
  Background:
    * url baseUrl
  Scenario: detalle
    Given path 'accounts', accountId
    When method get
    Then status 200
    And match responseHeaders['x-correlation-id'][0] == correlationId
  Scenario: sin clave
    * if (karate.env != 'pre') karate.abort()
    Given path 'accounts', accountId
    And header x-api-key = null
    When method get
    Then status 401
`
  const runEnv = (env: string, bugs: string[] = [], config = CONFIG) =>
    runProject({ files: { 'a.feature': FEATURE }, config: {}, configSource: config, env, properties: env === 'pre' ? { 'kobalto.apiKey': KOBALTO_PRE_KEY } : {} }, pre, bugs).features[0].scenarios

  it('la misma suite pasa en sandbox y en pre con la config por entorno', () => {
    const sb = runEnv('sandbox')
    expect(sb.map((s) => s.status)).toEqual(['passed', 'passed'])
    expect(sb[1].requests).toHaveLength(0) // abortado fuera de pre
    const p = runEnv('pre')
    expect(p.map((s) => s.error?.message ?? s.status)).toEqual(['passed', 'passed'])
    expect(p[0].requests[0].url).toBe('https://api.pre.kobalto.test/v1/accounts/ACC-2001')
    expect(p[0].requests[0].headers['x-api-key']).toBe(KOBALTO_PRE_KEY)
    expect(p[1].requests[0].headers['x-api-key']).toBeUndefined()
  })

  it('los bugs de pre se revelan con la prueba negativa y la cabecera de correlación', () => {
    const p = runEnv('pre', [KOBALTO_API_BUGS.clave, KOBALTO_API_BUGS.correlacion])
    expect(p[0].revealed).toEqual([KOBALTO_API_BUGS.correlacion])
    expect(p[1].revealed).toEqual([KOBALTO_API_BUGS.clave])
  })

  it('un error en la config falla todos los escenarios con un mensaje claro', () => {
    const sc = runEnv('sandbox', [], 'function fn() { return config }')
    expect(sc.every((s) => s.status === 'failed')).toBe(true)
    expect(sc[0].error?.message).toContain('karate-config.js')
  })
})

describe('karate · POST, read() y encadenar', () => {
  const api15 = kobaltoOpenApi({ version: '1.5' })
  const files = {
    'f/transfers.feature': `Feature: t
  Background:
    * url baseUrl
  Scenario: crear, leer y confirmar
    * def fromAccount = 'ACC-1001'
    * def amount = 150.75
    * def body = read('payloads/transfer.json')
    * set body.concept = 'Alquiler octubre'
    Given path 'transfers'
    And request body
    When method post
    Then status 201
    And match response contains { id: '#string', status: 'PENDING', amount: 150.75 }
    * def transferId = response.id
    Given path 'transfers', transferId
    When method get
    Then status 200
    And match response.amount == amount
    Given path 'transfers', transferId, 'confirm'
    When method post
    Then status 200
    Given path 'transfers', transferId, 'confirm'
    When method post
    Then status 409
  Scenario: sin saldo
    * def body = { fromAccount: 'ACC-1002', toIban: 'ES9121000418450200051333', amount: 10, currency: 'EUR' }
    * copy otro = body
    * remove otro.currency
    Given path 'transfers'
    And request otro
    When method post
    Then status 400
    And match response.field == 'currency'
    Given path 'transfers'
    And request body
    When method post
    Then status 422
    And match response.code == 'INSUFFICIENT_FUNDS'
`,
    'f/payloads/transfer.json': `{
  "fromAccount": "#(fromAccount)",
  "toIban": "ES9121000418450200051333",
  "amount": "#(amount)",
  "currency": "EUR",
  "concept": "Prueba"
}`,
  }
  const go = (bugs: string[] = []) => runProject({ files, config: { baseUrl: KOBALTO_API_BASE } }, api15, bugs).features[0].scenarios

  it('el flujo completo pasa con la API sin bugs', () => {
    const [a, b] = go()
    expect(a.error?.message).toBeUndefined()
    expect(b.error?.message).toBeUndefined()
    expect(a.requests[0].body).toMatchObject({ fromAccount: 'ACC-1001', amount: 150.75, concept: 'Alquiler octubre' })
  })

  it('cada bug lo revela su paso', () => {
    expect(go([KOBALTO_API_BUGS.importe])[0].revealed).toEqual([KOBALTO_API_BUGS.importe])
    expect(go([KOBALTO_API_BUGS.doble])[0].revealed).toEqual([KOBALTO_API_BUGS.doble])
    expect(go([KOBALTO_API_BUGS.fondos])[1].revealed).toEqual([KOBALTO_API_BUGS.fondos])
  })
})

describe('karate · esquemas dirigidos por datos', () => {
  const api = kobaltoOpenApi({ version: '1.5', limits: true })
  const PAYLOAD = `{ "fromAccount": "#(accountId)", "toIban": "ES9121000418450200051333", "amount": "#(amount)", "currency": "EUR", "concept": "Prueba QA" }`
  const FEATURE = `Feature: reglas
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
  Scenario Outline: concepto de <len> caracteres
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
  const NEG = `[
  { "name": "IBAN no válido", "patch": { "toIban": "ES12" }, "status": 400, "code": "INVALID_IBAN" },
  { "name": "cuenta en dólares", "patch": { "fromAccount": "ACC-1004" }, "status": 422, "code": "CURRENCY_MISMATCH" },
  { "name": "cuenta bloqueada", "patch": { "fromAccount": "ACC-1003" }, "status": 422, "code": "ACCOUNT_NOT_OPERATIVE" },
  { "name": "sin saldo", "patch": { "fromAccount": "ACC-1002" }, "status": 422, "code": "INSUFFICIENT_FUNDS" }
]`
  const go = (bugs: string[] = []) =>
    runProject(
      { files: { 'f/limits.feature': FEATURE, 'f/payloads/transfer.json': PAYLOAD, 'f/data/negativos.json': NEG }, config: { baseUrl: KOBALTO_API_BASE, accountId: 'ACC-1001' } },
      api,
      bugs,
    ).features[0].scenarios

  it('expande tablas con columnas tipadas y Examples desde JSON', () => {
    const scs = go()
    expect(scs).toHaveLength(10)
    expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(Array(10).fill('ok'))
    expect(scs[1].requests[0].body).toMatchObject({ amount: 0.01 })
    expect(scs[4].name).toBe('IBAN no válido')
    expect(scs[8].requests[0].body).toMatchObject({ concept: 'x'.repeat(140) })
  })

  it('cada bug de límites lo revela la fila de su borde', () => {
    const scs = go([KOBALTO_API_BUGS.limite, KOBALTO_API_BUGS.centimos, KOBALTO_API_BUGS.concepto])
    const revealedBy = scs.filter((s) => s.revealed.length).map((s) => `${s.name}:${s.revealed.join()}`)
    expect(revealedBy).toEqual(['importe 0.01 → 201:KA-CENT', 'importe 1000 → 201:KA-LIMITE', 'concepto de 140 caracteres:KA-CONCEPTO'])
  })

  it('un error en los Examples dinámicos se muestra en el escenario', () => {
    const scs = runProject({ files: { 'f/a.feature': FEATURE.replace("read('data/negativos.json')", "read('data/no.json')") }, config: { baseUrl: KOBALTO_API_BASE, accountId: 'ACC-1001' } }, api, []).features[0].scenarios
    const bad = scs.find((s) => s.error?.message.startsWith('Examples'))
    expect(bad?.error?.message).toContain('no se encuentra el fichero')
  })
})

describe('karate · call, callonce y tokens', () => {
  const api = kobaltoOpenApi({ version: '1.5', auth: true })
  const LOGIN = `@ignore
Feature: login
  Scenario: token
    * def scope = karate.get('scope', 'accounts:read transfers:write')
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)', scope: '#(scope)' }
    When method post
    Then status 200
    * def token = response.access_token
`
  const ACCOUNTS = `Feature: cuentas
  Background:
    * url baseUrl
    * def auth = callonce read('auth/login.feature')
    * configure headers = { Authorization: '#("Bearer " + auth.token)' }
  Scenario: detalle
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
  Scenario: lista
    Given path 'accounts'
    When method get
    Then status 200
  Scenario: saldo
    Given path 'accounts', 'ACC-1001', 'balance'
    When method get
    Then status 200
  Scenario: solo lectura no puede transferir
    * def ro = call read('auth/login.feature') { scope: 'accounts:read' }
    Given path 'transfers'
    And header Authorization = 'Bearer ' + ro.token
    And request { fromAccount: 'ACC-1001', toIban: 'ES9121000418450200051333', amount: 5, currency: 'EUR' }
    When method post
    Then status 403
  Scenario: token revocado
    * call read('auth/login.feature')
    Given path 'auth', 'revoke'
    And request { token: '#(token)' }
    When method post
    Then status 200
    Given path 'accounts', 'ACC-1001'
    And header Authorization = 'Bearer ' + token
    When method get
    Then status 401
`
  const files = { 'o/accounts.feature': ACCOUNTS, 'o/auth/login.feature': LOGIN }
  const cfg = { baseUrl: KOBALTO_API_BASE, clientId: 'qa-suite', clientSecret: 'qa-sandbox-secret' }
  const go = (bugs: string[] = [], f: Record<string, string> = files) => runProject({ files: f, config: cfg }, api, bugs)

  it('callonce pide un solo token para todo el feature; @ignore no ejecuta el login suelto', () => {
    const r = go()
    expect(r.features.map((f) => f.file)).toEqual(['o/accounts.feature', 'o/auth/login.feature'])
    expect(r.features[1].scenarios).toHaveLength(0)
    const scs = r.features[0].scenarios
    expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(Array(5).fill('ok'))
    const tokenCalls = scs.flatMap((s) => s.requests).filter((q) => q.path === '/v1/auth/token')
    expect(tokenCalls).toHaveLength(3)
    expect(scs[1].requests[0].headers.Authorization).toMatch(/^Bearer kbt_/)
  })

  it('con call en lugar de callonce se agota el límite de tokens', () => {
    const r = go([], { ...files, 'o/accounts.feature': ACCOUNTS.replace('callonce read', 'call read') + ACCOUNTS.split('  Scenario: detalle')[1].replace(/^/, '  Scenario: detalle 2') })
    expect(r.features[0].scenarios.some((s) => s.error?.message.includes('429'))).toBe(true)
  })

  it('los bugs de scope y revocación los revelan sus escenarios', () => {
    const scs = go([KOBALTO_API_BUGS.scope, KOBALTO_API_BUGS.revoke]).features[0].scenarios
    expect(scs[3].revealed).toEqual([KOBALTO_API_BUGS.scope])
    expect(scs[4].revealed).toEqual([KOBALTO_API_BUGS.revoke])
  })
})

describe('karate · retry until, errores y fallos simulados', () => {
  const api = kobaltoOpenApi({ version: '1.5', async: true, faults: true })
  const cfg = { baseUrl: KOBALTO_API_BASE }
  const transfer = (iban: string, retry = '') => `Feature: t
  Background:
    * url baseUrl
    ${retry}
  Scenario: async
    Given path 'transfers'
    And request { fromAccount: 'ACC-1001', toIban: '${iban}', amount: 25.5, currency: 'EUR' }
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
`
  const go = (feature: string, bugs: string[] = []) => runProject({ files: { 'o/t.feature': feature }, config: cfg }, api, bugs).features[0]

  it('con los valores por defecto (3 intentos cada 3 s) no le da tiempo a completarse', () => {
    const sc = go(transfer('ES9121000418450200051333')).scenarios[0]
    expect(sc.error?.message).toMatch(/^too many retry attempts: 3/)
    expect(sc.requests.filter((r) => r.method === 'GET')).toHaveLength(3)
    expect(sc.logs.some((l) => l.includes('sleeping before retry #2'))).toBe(true)
  })

  it('configure retry con más intentos espera hasta COMPLETED', () => {
    const sc = go(transfer('ES9121000418450200051333', '* configure retry = { count: 10, interval: 1000 }')).scenarios[0]
    expect(sc.error?.message ?? 'ok').toBe('ok')
    const gets = sc.requests.filter((r) => r.method === 'GET')
    expect(gets.length).toBeGreaterThan(5)
    expect((gets[gets.length - 1].responseBody as { status: string }).status).toBe('COMPLETED')
  })

  it('karate.configure(\'retry\') también vale y valida las claves', () => {
    expect(go(transfer('ES9121000418450200051333', "* karate.configure('retry', { count: 5, interval: 2000 })")).scenarios[0].status).toBe('passed')
    expect(go(transfer('ES9121000418450200051333', '* configure retry = { veces: 5 }')).scenarios[0].error?.message).toMatch(/clave no soportada/)
  })

  it('KA-ASYNC: a otro banco se queda en PROCESSING y lo revela el reintento', () => {
    const f = transfer('ES1420805801101234567891', '* configure retry = { count: 10, interval: 1000 }')
    expect(go(f).scenarios[0].status).toBe('passed')
    const sc = go(f, [KOBALTO_API_BUGS.asincrona]).scenarios[0]
    expect(sc.error?.message).toMatch(/too many retry attempts: 10/)
    expect(sc.revealed).toEqual([KOBALTO_API_BUGS.asincrona])
  })

  it('confirmar dos veces da 409 en la 1.7', () => {
    const f = transfer('ES9121000418450200051333').split('    Given path \'transfers\', id\n')[0] + "    Given path 'transfers', id, 'confirm'\n    When method post\n    Then status 409\n"
    expect(go(f).scenarios[0].status).toBe('passed')
  })

  it('KA-ERRFMT y KA-PARSE los revelan pruebas negativas con esquema', () => {
    const f = `Feature: e
  Background:
    * url baseUrl
    * def errorSchema = { code: '#string', message: '#string', traceId: '#uuid', field: '##string' }
  Scenario: transferencia inexistente
    Given path 'transfers', 'TRF-9999'
    When method get
    Then status 404
    And match response == errorSchema
  Scenario: importe como texto
    Given path 'transfers'
    And request { fromAccount: 'ACC-1001', toIban: 'ES9121000418450200051333', amount: '10,50', currency: 'EUR' }
    When method post
    Then status 400
    And match response == errorSchema
    And match response.field == 'amount'
`
    expect(go(f).scenarios.map((s) => s.status)).toEqual(['passed', 'passed'])
    const scs = go(f, [KOBALTO_API_BUGS.formatoError, KOBALTO_API_BUGS.parseo]).scenarios
    expect(scs.map((s) => s.revealed)).toEqual([[KOBALTO_API_BUGS.formatoError], [KOBALTO_API_BUGS.parseo]])
  })

  it('x-sandbox-fault simula una caída con Retry-After', () => {
    const f = `Feature: f
  Scenario: caída
    Given url baseUrl
    And path 'accounts', 'ACC-1001'
    And header x-sandbox-fault = '503'
    When method get
    Then status 503
    And match response.code == 'SERVICE_UNAVAILABLE'
    And match responseHeaders['Retry-After'][0] == '#regex [0-9]+'
`
    expect(go(f).scenarios[0].error?.message ?? 'ok').toBe('ok')
  })
})

describe('karate · mocks (karate.start) y el servicio de pagos', () => {
  const MOCK = `@ignore
Feature: mock de Paynexo

  Background:
    * def authRequest = { amount: '#? _ > 0 && _ % 1 == 0', currency: '#regex [A-Z]{3}', merchant: '#string', cardToken: '#string', reference: '#string' }
    * def received = []

  Scenario: pathMatches('/v2/authorizations') && methodIs('post') && !karate.match(request, authRequest).pass
    * def responseStatus = 400
    * def response = { error: 'invalid_request' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'DENEGADO'
    * def response = { result: 'DECLINED', reason: 'INSUFFICIENT_FUNDS' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'CAIDO'
    * def responseStatus = 503
    * def response = { error: 'service_unavailable' }

  Scenario: pathMatches('/v2/authorizations') && request.merchant == 'LENTO'
    * def responseDelay = 5000
    * def response = { result: 'APPROVED', authCode: 'A1B2C3' }

  Scenario: pathMatches('/v2/authorizations')
    * received.push(request.reference)
    * def response = { result: 'APPROVED', authCode: 'A1B2C3' }

  Scenario: pathMatches('/__received')
    * def response = { count: received.length }

  Scenario:
    * def responseStatus = 404
`
  const pay = (merchant: string, amount: number, status: number, extra = '') => `
  Scenario: ${merchant}
    Given path 'cards', 'CRD-1001', 'payments'
    And request { amount: ${amount}, currency: 'EUR', merchant: '${merchant}' }
    When method post
    Then status ${status}
${extra}`
  const BG = `Feature: pagos
  Background:
    * url baseUrl
    * def start = function() { return karate.start({ mock: 'mocks/paynexo.feature', port: 8090 }) }
    * def mock = callonce start
`
  const go = (feature: string, bugs: string[] = [], mock = MOCK) =>
    runProject({ files: { 'o/payments.feature': feature, 'o/mocks/paynexo.feature': mock }, config: { baseUrl: PAYMENTS_BASE } }, kobaltoPayments(), bugs).features.find((f) => f.file === 'o/payments.feature')!.scenarios

  it('el mock responde según sus condiciones y el servicio traduce cada caso', () => {
    const scs = go(BG + pay('Café', 25.5, 201, "    And match response.authCode == 'A1B2C3'") + pay('DENEGADO', 10, 422, "    And match response.reason == 'INSUFFICIENT_FUNDS'") + pay('CAIDO', 10, 502) + pay('LENTO', 10, 504))
    expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(scs[0].mockCalls[0]).toMatchObject({ port: 8090, path: '/v2/authorizations', status: 200 })
    expect((scs[0].mockCalls[0].body as { amount: number }).amount).toBe(2550)
    expect(scs[3].mockCalls[0].delay).toBe(5000)
    expect(scs[0].logs.some((l) => l.includes('[mock :8090] POST /v2/authorizations → 200'))).toBe(true)
  })

  it('el estado del mock se mantiene entre peticiones y se puede consultar desde el test', () => {
    const scs = go(BG + pay('A', 1, 201) + pay('B', 2, 201) + `
  Scenario: consultar el mock
    Given url 'http://localhost:' + mock.port
    And path '__received'
    When method get
    Then match response.count == 2
`)
    expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(['ok', 'ok', 'ok'])
  })

  it('arrancar dos veces en el mismo puerto falla (por eso callonce)', () => {
    const scs = go(BG.replace('callonce start', 'call start') + pay('A', 1, 201) + pay('B', 2, 201))
    expect(scs[0].status).toBe('passed')
    expect(scs[1].error?.message).toMatch(/BindException/)
  })

  it('sin mock arrancado, el servicio no llega al procesador (503)', () => {
    const scs = go(`Feature: x
  Background:
    * url baseUrl
` + pay('A', 1, 503))
    expect(scs[0].status).toBe('passed')
  })

  it('los bugs del servicio de pagos solo se ven con el mock adecuado', () => {
    const f = BG + pay('Café', 25.5, 201) + pay('DENEGADO', 10, 422, "    And match response.reason == 'INSUFFICIENT_FUNDS'") + pay('LENTO', 10, 504)
    const scs = go(f, Object.values(PAYMENTS_BUGS))
    expect(scs.map((s) => s.revealed)).toEqual([[PAYMENTS_BUGS.unidades], [PAYMENTS_BUGS.motivo], [PAYMENTS_BUGS.timeout]])
    // Un mock que lo aprueba todo no valida el contrato: el importe en euros pasa.
    const lax = go(BG + pay('Café', 25.5, 201), [PAYMENTS_BUGS.unidades], MOCK.replace(/ {2}Scenario: pathMatches\('\/v2\/authorizations'\) && methodIs[^\n]*\n[^\n]*\n[^\n]*\n/, ''))
    expect(lax[0].status).toBe('passed')
  })

  it('una asignación JavaScript como paso', () => {
    const r = runProject({ files: { 'a.feature': "Feature: a\n  Scenario: s\n    * def o = { a: 1 }\n    * o.b = o.a + 1\n    * o['c'] = 3\n    * match o == { a: 1, b: 2, c: 3 }\n" }, config: {} }, kobaltoPayments(), [])
    expect(r.features[0].scenarios[0].error?.message ?? 'ok').toBe('ok')
  })
})

describe('karate · runners Java, tags y ejecución en paralelo', () => {
  it('lee ruta, tags, hilos, aserciones e informes del runner', async () => {
    const { parseRunner } = await import('./pipeline')
    const ok = parseRunner(
      'src/test/java/openapi/OpenApiRunner.java',
      `package openapi;
import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import static org.junit.jupiter.api.Assertions.*;
class OpenApiRunner {
  @Test
  void t() {
    // .tags("@nada")
    Results results = Runner.path("classpath:openapi").tags("@smoke,@regression", "~@slow").outputCucumberJson(true).parallel(4);
    assertEquals(0, results.getFailCount(), results.getErrorMessages());
  }
}`,
    )
    expect(ok).toMatchObject({ className: 'OpenApiRunner', root: 'src/test/java/openapi/', tagGroups: [['smoke', 'regression'], ['~slow']], threads: 4, asserts: true, reports: ['cucumber-json'], errors: [] })
    const bad = parseRunner('x/R.java', 'class R { void t() { Results results = Runner.path("classpath:x").parallel(2) assertEquals(0, results.getFailCount()); }')
    expect(bad.errors.join(' | ')).toMatch(/falta cerrar|«;»|Assertions/)
    expect(parseRunner('x/R.java', 'class R { void t() { Results results = Runner.path("classpath:x").parallel(2); System.out.println(results.getFailCount()); } }').asserts).toBe(false)
  })

  const F = (name: string, n: number) =>
    `Feature: ${name}\n` +
    Array.from({ length: n }, (_, i) => `  ${i === 0 ? '@smoke\n  ' : ''}Scenario: ${name} ${i}\n    Given url baseUrl\n    And path 'accounts', 'ACC-1001'\n    When method get\n    Then status 200\n`).join('')
  const files = { 'src/test/java/openapi/a.feature': F('a', 3), 'src/test/java/openapi/b.feature': F('b', 3), 'src/test/java/otros/c.feature': F('c', 2) }
  const api = kobaltoOpenApi()

  it('en paralelo reparte entre hilos y la duración es la del hilo más lento', () => {
    const seq = runProject({ files, config: { baseUrl: KOBALTO_API_BASE } }, api, [])
    const par = runProject({ files, config: { baseUrl: KOBALTO_API_BASE }, parallel: { threads: 4, seed: 1 } }, api, [])
    expect(par.passed).toBe(seq.passed)
    expect(par.wallMs!).toBeLessThan(seq.wallMs! / 2)
    expect(par.features.flatMap((f) => f.scenarios).some((s) => s.logs[0] === '[hilo 4]')).toBe(true)
  })

  it('tagGroups y root filtran como Runner.path(...).tags(...)', () => {
    const r = runProject({ files, config: { baseUrl: KOBALTO_API_BASE }, root: 'src/test/java/openapi/', tagGroups: [['smoke']] }, api, [])
    expect(r.features.flatMap((f) => f.scenarios).map((s) => s.name)).toEqual(['a 0', 'b 0'])
    const r2 = runProject({ files, config: { baseUrl: KOBALTO_API_BASE }, tagGroups: [['~smoke']] }, api, [])
    expect(r2.passed).toBe(5)
  })
})

describe('karate · callSingle, tarjetas y tokens pegados', () => {
  const api = kobaltoOpenApi({ version: '1.5', auth: true, cards: true })
  const LOGIN = `@ignore
Feature: login
  Scenario: token
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)' }
    When method post
    Then status 200
    * def token = response.access_token
`
  const CONFIG = `function fn() {
  var config = { baseUrl: '${KOBALTO_API_BASE}', clientId: 'qa-suite', clientSecret: 'qa-sandbox-secret' };
  var auth = karate.callSingle('classpath:o/auth/login.feature', config);
  karate.configure('headers', { Authorization: 'Bearer ' + auth.token });
  return config;
}`
  const feat = (n: number) => `Feature: f${n}\n  Background:\n    * url baseUrl\n  Scenario: tarjeta\n    Given path 'cards', 'CRD-1001'\n    When method get\n    Then status 200\n    And match response == { id: '#string', accountId: '#string', brand: '#string', last4: '#regex [0-9]{4}', status: '#string', expiry: '#string' }\n`
  const files: Record<string, string> = { 'o/auth/login.feature': LOGIN }
  for (let i = 1; i <= 7; i++) files[`o/f${i}.feature`] = feat(i)

  it('callSingle pide un solo token para toda la ejecución, también en paralelo', () => {
    for (const parallel of [undefined, { threads: 4, seed: 3 }]) {
      const r = runProject({ files, config: {}, configSource: CONFIG, parallel }, api, [])
      const scs = r.features.flatMap((f) => f.scenarios)
      expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(Array(7).fill('ok'))
      expect(scs.flatMap((s) => s.requests).filter((q) => q.path === '/v1/auth/token')).toHaveLength(1)
    }
  })

  it('el esquema completo de la tarjeta destapa KA-PAN y el filtro KA-CARDFILTER', () => {
    const list = `Feature: l\n  Scenario: lista\n    Given url baseUrl\n    And path 'cards'\n    And param accountId = 'ACC-1001'\n    When method get\n    Then status 200\n    And match each response.items contains { accountId: 'ACC-1001' }\n`
    const r = runProject({ files: { ...files, 'o/l.feature': list }, config: {}, configSource: CONFIG }, api, [KOBALTO_API_BUGS.pan, KOBALTO_API_BUGS.filtroTarjetas])
    const scs = r.features.flatMap((f) => f.scenarios)
    expect(scs[0].revealed).toEqual([KOBALTO_API_BUGS.pan])
    expect(scs.find((s) => s.name === 'lista')!.revealed).toEqual([KOBALTO_API_BUGS.filtroTarjetas])
  })

  it('un token pegado en el feature es un mal olor', () => {
    const f = `Feature: t\n  Scenario: s\n    Given url baseUrl\n    And path 'cards', 'CRD-1001'\n    And header Authorization = 'Bearer kbt_3f9a1c77d2e04b6a8e5f'\n    When method get\n    Then status 401\n`
    const sc = runProject({ files: { 'a.feature': f }, config: { baseUrl: KOBALTO_API_BASE } }, api, []).features[0].scenarios[0]
    expect(sc.smells).toContain('hardcoded-token')
  })
})

describe('karate · órdenes periódicas (examen práctico)', () => {
  const api = kobaltoOpenApi({ version: '1.5', auth: true, sandboxData: true, standingOrders: true })
  const CONFIG = `function fn() {
  var config = { baseUrl: '${KOBALTO_API_BASE}', clientId: 'qa-suite', clientSecret: 'qa-sandbox-secret' };
  var auth = karate.callSingle('classpath:auth/login.feature', config);
  karate.configure('headers', { Authorization: 'Bearer ' + auth.token });
  return config;
}`
  const LOGIN = `@ignore
Feature: login
  Scenario: token
    * def scope = karate.get('scope', 'accounts:read transfers:write')
    Given url baseUrl
    And path 'auth', 'token'
    And request { clientId: '#(clientId)', clientSecret: '#(clientSecret)', scope: '#(scope)' }
    When method post
    Then status 200
    * def token = response.access_token
`
  const BG = `Feature: o
  Background:
    * url baseUrl
    Given path 'sandbox', 'accounts'
    And request { balance: 500 }
    When method post
    * def cuenta = response
    * def orden = { fromAccount: '#(cuenta.id)', toIban: 'ES9121000418450200051333', amount: 50, currency: 'EUR', frequency: 'MONTHLY', startDate: '2026-11-01' }
`
  const go = (f: string, bugs: string[] = []) =>
    runProject({ files: { 'auth/login.feature': LOGIN, 'o.feature': BG + f }, config: {}, configSource: CONFIG }, api, bugs).features.find((x) => x.file === 'o.feature')!.scenarios

  it('crear, consultar, cancelar y los límites del contrato', () => {
    const scs = go(`
  Scenario: crear y cancelar
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    And match response contains { status: 'ACTIVE', nextExecution: '2026-11-01' }
    * def id = response.id
    Given path 'standing-orders', id
    When method delete
    Then status 204
    Given path 'standing-orders', id
    When method get
    Then match response.status == 'CANCELLED'
  Scenario: empieza hoy
    * set orden.startDate = '2026-10-23'
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
  Scenario: frecuencia en minúsculas
    * set orden.frequency = 'monthly'
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 400
    And match response.field == 'frequency'
  Scenario: tres como mucho
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 422
    And match response.code == 'TOO_MANY_ORDERS'
  Scenario: solo lectura no cancela
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
    * def id = response.id
    * def ro = call read('classpath:auth/login.feature') { scope: 'accounts:read' }
    Given path 'standing-orders', id
    And header Authorization = 'Bearer ' + ro.token
    When method delete
    Then status 403
`)
    expect(scs.map((s) => s.error?.message ?? 'ok')).toEqual(Array(5).fill('ok'))
    const bugged = go(scs.length ? `
  Scenario: crear y cancelar
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
    Then match response.status == 'CANCELLED'
  Scenario: empieza hoy
    * set orden.startDate = '2026-10-23'
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 201
  Scenario: frecuencia en minúsculas
    * set orden.frequency = 'monthly'
    Given path 'standing-orders'
    And request orden
    When method post
    Then status 400
` : '', [KOBALTO_API_BUGS.cancelar, KOBALTO_API_BUGS.hoy, KOBALTO_API_BUGS.frecuencia])
    expect(bugged.map((s) => s.revealed)).toEqual([[KOBALTO_API_BUGS.cancelar], [KOBALTO_API_BUGS.hoy], [KOBALTO_API_BUGS.frecuencia]])
  })
})
