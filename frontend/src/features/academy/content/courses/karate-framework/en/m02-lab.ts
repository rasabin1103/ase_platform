import type { CodeLabModel } from '../../../../karate/types'
import { M02_CONFIG_PATH, M02_FEATURE_PATH, m02Lab } from '../m02-lab'
import { RUNNER_JAVA_EN, filesEn, retosEn } from './shared'

/** Replaces each Spanish fragment with its English text; fails loudly if a fragment is missing. */
function tr(content: string, pairs: [string, string][]): string {
  return pairs.reduce((acc, [es, en]) => {
    if (!acc.includes(es)) throw new Error(`m02-lab (en): fragment not found: ${es}`)
    return acc.replace(es, en)
  }, content)
}

const source = (path: string) => m02Lab.files.find((f) => f.path === path)?.content ?? ''

const CONFIG_EN = tr(source(M02_CONFIG_PATH), [
  ['// Se ejecuta antes de CADA escenario. Lo que devuelve son variables\n  // globales para todos los features.', '// Runs before EACH scenario. What it returns becomes global\n  // variables for every feature.'],
  ['// TODO: preproducción (api.pre.kobalto.test) — ver la wiki «Entornos».', '// TODO: pre-production (api.pre.kobalto.test) — see the “Open API environments” wiki page.'],
])

const FEATURE_EN = tr(source(M02_FEATURE_PATH), [
  ['Feature: Kobalto Open API · cuentas', 'Feature: Kobalto Open API · accounts'],
  ['# La suite de ayer. Hoy tiene que correr igual en sandbox y en pre.', '# Yesterday’s suite. Today it has to run the same way in sandbox and in pre.'],
  ['Scenario: la API está levantada', 'Scenario: the API is up'],
  ['Scenario: contrato del detalle de una cuenta', 'Scenario: account detail contract'],
  ['Scenario: cuenta inexistente', 'Scenario: account that does not exist'],
  ['Scenario: contrato de la lista', 'Scenario: list contract'],
])

/** English translation of ../m02-lab.ts: same checks, server and paths; only the text changes. */
export const m02LabEn: CodeLabModel = {
  ...m02Lab,
  envs: m02Lab.envs?.map((e) => (e.id === 'pre' ? { ...e, label: 'pre-production · api.pre.kobalto.test · -Dkobalto.apiKey=***' } : e)),
  files: filesEn(m02Lab.files, {
    [M02_FEATURE_PATH]: FEATURE_EN,
    [M02_CONFIG_PATH]: CONFIG_EN,
    [RUNNER_JAVA_EN.path]: RUNNER_JAVA_EN,
  }),
  retos: retosEn(m02Lab.retos, {
    entornos: {
      title: 'The same suite, in pre',
      description: 'Make `karate-config.js` pick the `baseUrl` from `karate.env` and run with `-Dkarate.env=pre` (selector at the top): the requests must go to **api.pre.kobalto.test**.',
      hint: "Inside the function: `if (env == 'pre') { config.baseUrl = 'https://api.pre.kobalto.test/v1'; }`. Then switch the selector to `pre` and run.",
    },
    clave: {
      title: 'The key, just once',
      description: 'Pre requires the `x-api-key` header on everything except `/health`. Add it to **every** request with `karate.configure(\'headers\', …)` in the config, not scenario by scenario.',
      hint: "In the pre branch: `karate.configure('headers', { 'x-api-key': … });`. With `configure headers` the header goes on every request without touching the features.",
    },
    secreto: {
      title: 'No secrets in the code',
      description: 'The key cannot be written in the repository. In CI it arrives as a system property: read it with `karate.properties[\'kobalto.apiKey\']`.',
      hint: "`var apiKey = karate.properties['kobalto.apiKey'];`. In pre the IDE passes it just as the pipeline would (`-Dkobalto.apiKey=…`).",
    },
    datos: {
      title: 'Each environment’s data',
      description: 'ACC-1001 does not exist in pre: its accounts are different. Move the id to the config (`accountId`) and get the suite green in **both** environments without touching the features between runs.',
      hint: "In the config: `accountId: 'ACC-1001'` and, in pre, `config.accountId = 'ACC-2001'`. In the feature: `Given path 'accounts', accountId`. Run in sandbox and in pre.",
    },
    sinclave: {
      title: 'No key, 401',
      description: 'Carmen wants proof: in pre, the detail of an account **without** `x-api-key` returns 401 `MISSING_API_KEY`. Make sure the scenario does not break the suite in sandbox (which needs no key).',
      hint: "`And header x-api-key = null` removes the configured header. To skip the scenario outside pre: `* if (karate.env != 'pre') karate.abort()` as the first step.",
    },
    correlacion: {
      title: 'Tracing with the partners',
      description: 'Send `x-correlation-id` on **every** request (configure it) and check that the API returns it: `responseHeaders[\'x-correlation-id\'][0]`. Run it in both environments.',
      hint: "Add `correlationId` to the config and to the configured headers. In a scenario: `And match responseHeaders['x-correlation-id'][0] == correlationId`.",
    },
  }),
}
