import type { CodeLabModel } from '../../../karate/types'
import { KOBALTO_API_BUGS, KOBALTO_PRE_KEY, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import { KARATE_CONFIG, RUNNER_JAVA, correct } from './shared'

export const M02_CONFIG_PATH = 'src/test/java/karate-config.js'
export const M02_FEATURE_PATH = 'src/test/java/openapi/accounts.feature'

const CONFIG = `function fn() {
  // Se ejecuta antes de CADA escenario. Lo que devuelve son variables
  // globales para todos los features.
  var env = karate.env || 'sandbox';
  karate.log('karate.env =', env);

  var config = {
    baseUrl: 'https://api.kobalto.test/v1'
  };

  // TODO: preproducción (api.pre.kobalto.test) — ver la wiki «Entornos».

  return config;
}
`

const FEATURE = `Feature: Kobalto Open API · cuentas

  # La suite de ayer. Hoy tiene que correr igual en sandbox y en pre.

  Background:
    * url baseUrl
    * def account = { id: '#regex ACC-\\\\d{4}', iban: '#regex ES\\\\d{22}', holder: '#string', type: '#string', currency: '#string', balance: '#number? _ >= 0', status: '#string', createdAt: '#string', alias: '##string' }

  @smoke
  Scenario: la API está levantada
    Given path 'health'
    When method get
    Then status 200
    And match response.status == 'UP'

  Scenario: contrato del detalle de una cuenta
    Given path 'accounts', 'ACC-1001'
    When method get
    Then status 200
    And match response == account

  Scenario: cuenta inexistente
    Given path 'accounts', 'ACC-9999'
    When method get
    Then status 404
    And match response.code == 'ACCOUNT_NOT_FOUND'

  Scenario: contrato de la lista
    Given path 'accounts'
    When method get
    Then status 200
    And match each response.items == account
`

const PRE = 'https://api.pre.kobalto.test'
const hasKey = (h: Record<string, string>) => Object.keys(h).some((k) => k.toLowerCase() === 'x-api-key')
const keyValue = (h: Record<string, string>) => Object.entries(h).find(([k]) => k.toLowerCase() === 'x-api-key')?.[1]
const features = (files: Record<string, string>) => Object.entries(files).filter(([p]) => p.endsWith('.feature')).map(([, c]) => c)

/** IDE de la misión 3: karate-config.js, entornos, cabeceras comunes y secretos. */
export const m02Lab: CodeLabModel = {
  server: () => kobaltoOpenApi({ version: '1.5', pre: true }),
  config: KARATE_CONFIG,
  configFile: M02_CONFIG_PATH,
  envs: [
    { id: 'sandbox', label: 'sandbox · api.kobalto.test' },
    { id: 'pre', label: 'preproducción · api.pre.kobalto.test · -Dkobalto.apiKey=***', properties: { 'kobalto.apiKey': KOBALTO_PRE_KEY } },
  ],
  runCost: 3,
  scenarioCost: 1,
  files: [
    { path: M02_FEATURE_PATH, content: FEATURE },
    { path: M02_CONFIG_PATH, content: CONFIG },
    RUNNER_JAVA,
  ],
  snippets: [
    { label: "if (env == 'pre')", code: "if (env == 'pre') {\n  config.baseUrl = 'https://api.pre.kobalto.test/v1';\n}" },
    { label: 'karate.properties', code: "karate.properties['kobalto.apiKey']" },
    { label: 'configure headers', code: "karate.configure('headers', { 'x-api-key': config.apiKey });" },
    { label: 'accountId', code: "Given path 'accounts', accountId" },
    { label: 'responseHeaders', code: "And match responseHeaders['x-correlation-id'][0] == correlationId" },
    { label: 'header = null', code: 'And header x-api-key = null' },
    { label: 'karate.abort', code: "* if (karate.env != 'pre') karate.abort()" },
  ],
  retos: [
    {
      id: 'entornos',
      title: 'La misma suite, en pre',
      description: 'Haz que `karate-config.js` elija la `baseUrl` según `karate.env` y ejecuta con `-Dkarate.env=pre` (selector de arriba): las peticiones tienen que ir a **api.pre.kobalto.test**.',
      hint: "Dentro de la función: `if (env == 'pre') { config.baseUrl = 'https://api.pre.kobalto.test/v1'; }`. Luego cambia el selector a `pre` y ejecuta.",
      check: (scs, _f, ctx) => ctx.env === 'pre' && /karate\.env/.test(ctx.files[M02_CONFIG_PATH] ?? '') && scs.some((sc) => sc.requests.some((r) => r.url.startsWith(PRE))),
    },
    {
      id: 'clave',
      title: 'La clave, una sola vez',
      description: 'Pre exige la cabecera `x-api-key` en todo menos `/health`. Añádela a **todas** las peticiones con `karate.configure(\'headers\', …)` en la config, no escenario a escenario.',
      hint: "En la rama de pre: `karate.configure('headers', { 'x-api-key': … });`. Con `configure headers` la cabecera va en cada petición sin tocar los features.",
      check: (scs, _f, ctx) =>
        ctx.env === 'pre' &&
        !features(ctx.files).some((c) => /header\s+x-api-key\s*=(?!\s*null\b)/i.test(c)) &&
        scs.filter((sc) => sc.requests.some((r) => r.url.startsWith(PRE) && r.path !== '/v1/health' && hasKey(r.headers) && r.status !== 401)).length >= 2,
    },
    {
      id: 'secreto',
      title: 'Ningún secreto en el código',
      description: 'La clave no puede estar escrita en el repositorio. En CI llega como propiedad del sistema: léela con `karate.properties[\'kobalto.apiKey\']`.',
      hint: "`var apiKey = karate.properties['kobalto.apiKey'];`. El IDE la pasa en pre como haría el pipeline (`-Dkobalto.apiKey=…`).",
      check: (scs, _f, ctx) =>
        ctx.env === 'pre' &&
        !Object.values(ctx.files).some((c) => c.includes(KOBALTO_PRE_KEY)) &&
        /karate\.properties/.test(ctx.files[M02_CONFIG_PATH] ?? '') &&
        scs.some((sc) => sc.requests.some((r) => keyValue(r.headers) === KOBALTO_PRE_KEY)),
    },
    {
      id: 'datos',
      title: 'Datos de cada entorno',
      description: 'En pre no existe ACC-1001: sus cuentas son otras. Saca el id a la config (`accountId`) y consigue la suite en verde en **los dos** entornos sin tocar los features entre una ejecución y otra.',
      hint: "En la config: `accountId: 'ACC-1001'` y, en pre, `config.accountId = 'ACC-2001'`. En el feature: `Given path 'accounts', accountId`. Ejecuta en sandbox y en pre.",
      check: (_scs, flags, ctx) =>
        ctx.green &&
        !features(ctx.files).some((c) => c.includes("'ACC-1001'") || c.includes('"ACC-1001"')) &&
        (ctx.env === 'pre' ? !!flags['ide.green.sandbox'] : ctx.env === 'sandbox' && !!flags['ide.green.pre']),
    },
    {
      id: 'sinclave',
      title: 'Sin clave, 401',
      description: 'Carmen quiere la prueba: en pre, el detalle de una cuenta **sin** `x-api-key` responde 401 `MISSING_API_KEY`. Que el escenario no rompa la suite en sandbox (que no pide clave).',
      hint: "`And header x-api-key = null` quita la cabecera configurada. Para saltarte el escenario fuera de pre: `* if (karate.env != 'pre') karate.abort()` como primer paso.",
      visibleWhen: { kind: 'flag', key: 'carmen.key' },
      check: (scs, _f, ctx) =>
        ctx.env === 'pre' &&
        scs.some(
          (sc) =>
            sc.requests.some((r) => r.url.startsWith(PRE) && /^\/v1\/accounts\/ACC-\d{4}$/.test(r.path) && !hasKey(r.headers)) &&
            sc.statusChecks.includes(401) &&
            correct(sc, KOBALTO_API_BUGS.clave),
        ),
    },
    {
      id: 'correlacion',
      title: 'Trazas con los partners',
      description: 'Envía `x-correlation-id` en **todas** las peticiones (configúralo) y comprueba que la API lo devuelve: `responseHeaders[\'x-correlation-id\'][0]`. Ejecútalo en los dos entornos.',
      hint: "Añade `correlationId` a la config y a las cabeceras configuradas. En un escenario: `And match responseHeaders['x-correlation-id'][0] == correlationId`.",
      visibleWhen: { kind: 'flag', key: 'alba.corr' },
      check: (scs) =>
        scs.some((sc) => sc.matches.some((m) => /responseHeaders/.test(m.lhs) && /correlation/i.test(m.lhs)) && correct(sc, KOBALTO_API_BUGS.correlacion)) &&
        scs.every((sc) => sc.requests.every((r) => Object.keys(r.headers).some((k) => k.toLowerCase() === 'x-correlation-id'))),
    },
  ],
}

/** Solución de referencia (tests y guion). */
export const M02_SOLUTION_CONFIG = `function fn() {
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1',
    accountId: 'ACC-1001',
    correlationId: 'qa-' + env + '-001'
  };
  var headers = { 'x-correlation-id': config.correlationId };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
    config.accountId = 'ACC-2001';
    headers['x-api-key'] = karate.properties['kobalto.apiKey'];
  }
  karate.configure('headers', headers);
  return config;
}
`

export const M02_SOLUTION_FEATURE = FEATURE.replace("Given path 'accounts', 'ACC-1001'", "Given path 'accounts', accountId")
  .replace('# La suite de ayer. Hoy tiene que correr igual en sandbox y en pre.\n\n', '')
  .concat(`
  Scenario: el id de correlación vuelve en la respuesta
    Given path 'health'
    When method get
    Then status 200
    And match responseHeaders['x-correlation-id'][0] == correlationId

  Scenario: sin clave no hay datos
    * if (karate.env != 'pre') karate.abort()
    Given path 'accounts', accountId
    And header x-api-key = null
    When method get
    Then status 401
    And match response.code == 'MISSING_API_KEY'
`)
