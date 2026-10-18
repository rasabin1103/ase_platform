import type { CodeLabModel } from '../../../karate/types'
import { KOBALTO_API_BUGS } from '../../../karate/apis/kobaltoOpenApi'
import { BASIC_SNIPPETS, KARATE_CONFIG, KARATE_CONFIG_JS, RUNNER_JAVA, accountRequested, correct, openApiServer, requested } from './shared'

const FEATURE = `Feature: Kobalto Open API · smoke de cuentas

  # Cada «Scenario» es un test independiente.
  # baseUrl viene de karate-config.js: https://api.kobalto.test/v1
  # Ejecuta con «Ejecutar» o Ctrl/Cmd + Enter y mira la consola.

  Scenario: la API está levantada
    * url baseUrl
    # Escribe aquí la ruta, el método y las comprobaciones.
`

/** IDE de la misión 1: primer feature contra la Kobalto Open API. */
export const m00Lab: CodeLabModel = {
  server: openApiServer,
  config: KARATE_CONFIG,
  env: 'sandbox',
  runCost: 3,
  scenarioCost: 1,
  files: [{ path: 'src/test/java/openapi/accounts.feature', content: FEATURE }, KARATE_CONFIG_JS, RUNNER_JAVA],
  snippets: BASIC_SNIPPETS,
  retos: [
    {
      id: 'smoke',
      title: 'Smoke de salud',
      description: 'Un escenario que haga `GET /health`, compruebe `status 200` y que `response.status` sea `\'UP\'`.',
      hint: "Debajo de `* url baseUrl`: `Given path 'health'`, `When method get`, `Then status 200` y `And match response.status == 'UP'`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.status === 'passed' &&
            requested(sc, 'GET', '/v1/health', 200) &&
            sc.statusChecks.includes(200) &&
            sc.matches.some((m) => m.pass && (/\bstatus\b/.test(m.lhs) || (m.wholeResponse && m.rhsKeys.includes('status')))),
        ),
    },
    {
      id: 'cuenta',
      title: 'Detalle de una cuenta',
      description: '`GET /accounts/ACC-1001` responde 200. Comprueba con `match` que es la cuenta pedida (`id`) y que está en euros (`currency`).',
      hint: "`Given path 'accounts', 'ACC-1001'` construye /accounts/ACC-1001. Después: `match response.id == 'ACC-1001'` y `match response.currency == 'EUR'`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.status === 'passed' &&
            accountRequested(sc, 'ACC-1001', 200) &&
            sc.matches.some((m) => m.pass && /\bid\b|'ACC-1001'/.test(m.text)) &&
            sc.matches.some((m) => m.pass && /currency|'EUR'/.test(m.text)),
        ),
    },
    {
      id: 'noexiste',
      title: 'Una cuenta que no existe',
      description: 'Pide una cuenta con formato válido que no exista (p. ej. `ACC-9999`): 404 y `code` igual a `ACCOUNT_NOT_FOUND`.',
      hint: "Los casos de error también se prueban: `Then status 404` y `And match response.code == 'ACCOUNT_NOT_FOUND'`.",
      check: (scs) =>
        scs.some(
          (sc) =>
            sc.status === 'passed' &&
            sc.requests.some((r) => /^\/v1\/accounts\/ACC-\d{4}$/.test(r.path) && r.status === 404) &&
            sc.statusChecks.includes(404) &&
            sc.matches.some((m) => m.pass && m.text.includes('ACCOUNT_NOT_FOUND')),
        ),
    },
    {
      id: 'background',
      title: 'Sin repetirse: Background',
      description: 'Con dos o más escenarios, mueve `* url baseUrl` a un `Background:` (se ejecuta antes de cada escenario) y quítalo de los escenarios.',
      hint: 'Justo debajo de `Feature:`, añade `Background:` con `* url baseUrl` dentro, y borra esa línea de cada escenario. Ninguna URL completa en los escenarios.',
      check: (scs) =>
        scs.length >= 2 &&
        scs.every((sc) => sc.steps.some((st) => st.background && /^url\s/.test(st.text)) && !sc.steps.some((st) => !st.background && /^url\s/.test(st.text)) && !sc.smells.includes('hardcoded-url')),
    },
    {
      id: 'bloqueada',
      title: 'La cuenta bloqueada',
      description: 'Compliance necesita que `ACC-1003` salga con `status` `\'BLOCKED\'`. Escribe el escenario. Si falla, decide: ¿es tu test o es la API?',
      hint: "Mismo patrón que el detalle de cuenta, con `match response.status == 'BLOCKED'`. Si el test es correcto y falla, la evidencia del bug es ese escenario: repórtalo en el Tablero.",
      visibleWhen: { kind: 'flag', key: 'carmen.asked' },
      check: (scs) => scs.some((sc) => accountRequested(sc, 'ACC-1003') && sc.matches.some((m) => m.text.includes("'BLOCKED'") || m.text.includes('"BLOCKED"')) && correct(sc, KOBALTO_API_BUGS.bloqueada)),
    },
  ],
}
