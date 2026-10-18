import type { Doc } from '../../../engine/types'
import { KOBALTO_API_BASE, kobaltoOpenApi } from '../../../karate/apis/kobaltoOpenApi'
import type { CodeLabFile } from '../../../karate/types'
import type { ScenarioResult } from '../../../karate/runner'

/** Piezas comunes de las misiones del curso de Karate. */

export const KARATE_CONFIG = { baseUrl: KOBALTO_API_BASE }

/** La API que ve el alumno: 1.4 hasta que se despliega la 1.5 (flag api.v15). */
export const openApiServer = (flags: Record<string, boolean>) => kobaltoOpenApi({ version: flags['api.v15'] ? '1.5' : '1.4' })

export const KARATE_CONFIG_JS: CodeLabFile = {
  path: 'src/test/java/karate-config.js',
  readOnly: true,
  content: `function fn() {
  // Configuración común a todos los features.
  // karate.env decide el entorno (sandbox por defecto).
  var env = karate.env || 'sandbox';
  var config = {
    baseUrl: 'https://api.kobalto.test/v1'
  };
  if (env == 'pre') {
    config.baseUrl = 'https://api.pre.kobalto.test/v1';
  }
  return config;
}
`,
}

export const RUNNER_JAVA: CodeLabFile = {
  path: 'src/test/java/openapi/OpenApiTest.java',
  readOnly: true,
  content: `package openapi;

import com.intuit.karate.junit5.Karate;

// Runner JUnit 5: ejecuta los .feature de esta carpeta.
// En tu máquina: mvn test -Dtest=OpenApiTest
class OpenApiTest {

    @Karate.Test
    Karate testAll() {
        return Karate.run().relativeTo(getClass());
    }
}
`,
}

export const API_REFERENCE_DOC: Doc = {
  id: 'api_v1',
  title: 'Kobalto Open API v1 · Referencia (sandbox)',
  updatedLabel: 'Mantenida por Nicolás Prado',
  readCost: 5,
  onRead: [{ kind: 'flag', key: 'doc.api' }],
  body: `## Base
- URL del sandbox: **https://api.kobalto.test/v1** (en los tests, la variable **baseUrl**).
- Todas las respuestas son JSON.

## Endpoints
- **GET /health** → 200 con { status: "UP", service, version }.
- **GET /accounts** → 200 con { items, page, size, total }. Filtros: **status** (ACTIVE, BLOCKED, CLOSED), **page** (desde 1), **size** (1–100).
- **GET /accounts/{id}** → 200 con la cuenta. El id tiene el formato ACC-0000.
- **GET /accounts/{id}/balance** → 200 con { accountId, available, currency, updatedAt }.

## Cuenta
- **id** (string, ACC-0000) · **iban** (string, ES + 22 dígitos, sin espacios) · **holder** (string, titular)
- **type** (PERSONAL o BUSINESS) · **currency** (EUR o USD) · **balance** (número, nunca texto)
- **status** (ACTIVE, BLOCKED o CLOSED) · **createdAt** (fecha ISO 8601)
- Una cuenta **BLOCKED** no admite operaciones: los partners deben verla bloqueada.

## Errores
- Formato común: { code, message, traceId }.
- **400 INVALID_ACCOUNT_ID**: el id no tiene el formato ACC-0000.
- **404 ACCOUNT_NOT_FOUND**: la cuenta no existe.
- **400 INVALID_STATUS / INVALID_PAGE / INVALID_SIZE**: filtros no válidos.

## Datos del sandbox
- **ACC-1001** · Lucía Martín Ortega · EUR · ACTIVE
- **ACC-1002** · Hugo Benítez Sola · EUR · ACTIVE (saldo 0)
- **ACC-1003** · Grupo Almendra SL · EUR · **BLOCKED** (Compliance)
- **ACC-1004** · Irene Castro Vidal · **USD** · ACTIVE
- **ACC-1005** · Mateo Ruiz Prieto · EUR · CLOSED`,
}

// ------------------------------------------------- Ayudas para los retos
const ACCOUNT_PATH = /^\/v1\/accounts\/(ACC-\d{4})$/

export function requested(sc: ScenarioResult, method: string, path: RegExp | string, status?: number): boolean {
  return sc.requests.some((r) => r.method === method && (typeof path === 'string' ? r.path === path : path.test(r.path)) && (status === undefined || r.status === status))
}

export function accountRequested(sc: ScenarioResult, id?: string, status?: number): boolean {
  return sc.requests.some((r) => {
    const m = ACCOUNT_PATH.exec(r.path)
    return r.method === 'GET' && !!m && (!id || m[1] === id) && (status === undefined || r.status === status)
  })
}

/**
 * El escenario es correcto: pasa, o falla solo por un bug real de la API
 * (el indicado o, sin indicar, cualquiera).
 */
export function correct(sc: ScenarioResult, bug?: string): boolean {
  return sc.status === 'passed' || (bug ? sc.revealed.includes(bug) : sc.revealed.length > 0)
}

export const BASIC_SNIPPETS = [
  { label: 'Scenario', code: "Scenario: qué debe pasar\n  Given path 'health'\n  When method get\n  Then status 200" },
  { label: 'path', code: "Given path 'accounts', 'ACC-1001'" },
  { label: 'method get', code: 'When method get' },
  { label: 'status', code: 'Then status 200' },
  { label: 'match', code: "And match response.id == 'ACC-1001'" },
  { label: 'Background', code: 'Background:\n  * url baseUrl' },
  { label: 'print', code: '* print response' },
]
