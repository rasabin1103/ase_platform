/**
 * Kobalto Open API (sandbox) — API simulada del curso de Karate.
 *
 * Base: https://api.kobalto.test/v1. Datos deterministas. Los bugs sembrados
 * solo cambian la respuesta cuando están activos y marcan la respuesta con su
 * id, para que el ejecutor pueda saber qué escenarios los revelan.
 *
 * Contrato documentado en la wiki de la misión (docs de cada misión).
 */
import { jsonResponse, type HttpHandler, type HttpRequest, type HttpResponse, type ServerFactory } from '../http'

export const KOBALTO_API_HOST = 'api.kobalto.test'
export const KOBALTO_API_BASE = `https://${KOBALTO_API_HOST}/v1`
/** Preproducción: mismos endpoints, otros datos y clave obligatoria (x-api-key). */
export const KOBALTO_PRE_HOST = 'api.pre.kobalto.test'
export const KOBALTO_PRE_BASE = `https://${KOBALTO_PRE_HOST}/v1`
/** Clave de preproducción (en CI llega como -Dkobalto.apiKey). */
export const KOBALTO_PRE_KEY = 'pre-7f3a9c2e'

export type ApiVersion = '1.4' | '1.5'

export interface Account {
  id: string
  iban: string
  holder: string
  type: 'PERSONAL' | 'BUSINESS'
  currency: 'EUR' | 'USD'
  balance: number
  status: 'ACTIVE' | 'BLOCKED' | 'CLOSED'
  createdAt: string
  /** Desde la 1.5: alias opcional que el cliente pone a su cuenta. */
  alias?: string | null
}

export const ACCOUNTS: Account[] = [
  { id: 'ACC-1001', iban: 'ES7621000418450200051332', holder: 'Lucía Martín Ortega', type: 'PERSONAL', currency: 'EUR', balance: 1520.35, status: 'ACTIVE', createdAt: '2025-03-02T10:15:00Z', alias: 'Nómina' },
  { id: 'ACC-1002', iban: 'ES1000492352082414205416', holder: 'Hugo Benítez Sola', type: 'PERSONAL', currency: 'EUR', balance: 0, status: 'ACTIVE', createdAt: '2025-06-18T08:40:00Z', alias: null },
  { id: 'ACC-1003', iban: 'ES6000491500051234567892', holder: 'Grupo Almendra SL', type: 'BUSINESS', currency: 'EUR', balance: 98250.1, status: 'BLOCKED', createdAt: '2024-11-05T12:00:00Z', alias: null },
  { id: 'ACC-1004', iban: 'ES9121000418450200051333', holder: 'Irene Castro Vidal', type: 'PERSONAL', currency: 'USD', balance: 310, status: 'ACTIVE', createdAt: '2025-09-30T16:20:00Z', alias: 'Viajes' },
  { id: 'ACC-1005', iban: 'ES8023100001180000012345', holder: 'Mateo Ruiz Prieto', type: 'PERSONAL', currency: 'EUR', balance: 45.2, status: 'CLOSED', createdAt: '2023-01-12T09:05:00Z', alias: null },
]

/** Datos de preproducción (otro entorno, otros datos). */
export const PRE_ACCOUNTS: Account[] = [
  { id: 'ACC-2001', iban: 'ES2100810200250001234567', holder: 'Carla Domínguez Ríos', type: 'PERSONAL', currency: 'EUR', balance: 2310.5, status: 'ACTIVE', createdAt: '2026-02-11T09:30:00Z', alias: 'Casa' },
  { id: 'ACC-2002', iban: 'ES4400491500052718293746', holder: 'Talleres Ebro SL', type: 'BUSINESS', currency: 'EUR', balance: 15400, status: 'ACTIVE', createdAt: '2025-12-01T11:00:00Z', alias: null },
  { id: 'ACC-2003', iban: 'ES6621000418401234567891', holder: 'Pablo Ferrer Gil', type: 'PERSONAL', currency: 'USD', balance: 0, status: 'ACTIVE', createdAt: '2026-05-20T14:45:00Z', alias: null },
  { id: 'ACC-2004', iban: 'ES5800491500091234567893', holder: 'Comercial Duero SA', type: 'BUSINESS', currency: 'EUR', balance: 7300.2, status: 'BLOCKED', createdAt: '2025-08-08T08:08:00Z', alias: null },
]

/** Bugs que conoce esta API. */
export const KOBALTO_API_BUGS = {
  /** M1 · ACC-1003 bloqueada por Compliance aparece como ACTIVE (caché obsoleta). */
  bloqueada: 'KA-BLOQ',
  /** M1 · La cuenta en dólares ACC-1004 se sirve con currency EUR. */
  divisa: 'KA-DIVISA',
  /** M2 · El filtro status=ACTIVE también devuelve cuentas cerradas. */
  filtro: 'KA-FILTRO',
  /** M2 · Los saldos a cero se serializan como string ("0.00"). */
  tipo: 'KA-TIPO',
  /** M2 · La 1.5 renombra holder → holderName sin avisar (cambio incompatible). */
  contrato: 'KA-CONTRATO',
  /** M3 · Pre devuelve el detalle de una cuenta sin x-api-key (debería ser 401). */
  clave: 'KA-KEY',
  /** M3 · Pre no devuelve la cabecera x-correlation-id que recibe. */
  correlacion: 'KA-CORR',
  /** M4 · Las transferencias guardan el importe sin decimales (GET devuelve 150 en vez de 150.75). */
  importe: 'KA-IMPORTE',
  /** M4 · Confirmar dos veces la misma transferencia la cobra dos veces (debería ser 409). */
  doble: 'KA-DOBLE',
  /** M4 · Se aceptan transferencias por encima del saldo disponible (debería ser 422). */
  fondos: 'KA-FONDOS',
  /** M5 · El límite de 1.000 € por transferencia rechaza también 1.000,00 € justos. */
  limite: 'KA-LIMITE',
  /** M5 · Se rechazan importes por debajo de 1 € (el mínimo es 0,01 €). */
  centimos: 'KA-CENT',
  /** M5 · Se rechaza un concepto de 140 caracteres justos (el máximo es 140). */
  concepto: 'KA-CONCEPTO',
  /** M6 · Un token sin el scope transfers:write puede crear transferencias (debería ser 403). */
  scope: 'KA-SCOPE',
  /** M6 · Un token revocado sigue funcionando (debería ser 401 TOKEN_REVOKED). */
  revoke: 'KA-REVOKE',
  /** M6 · Credenciales incorrectas devuelven 500 con traza en lugar de 401. */
  auth500: 'KA-AUTH500',
  /** M7 · El 404 de una transferencia inexistente sale con el formato de error del framework, no con { code, message, traceId }. */
  formatoError: 'KA-ERRFMT',
  /** M7 · Las transferencias a otros bancos se quedan en PROCESSING para siempre. */
  asincrona: 'KA-ASYNC',
  /** M7 · Un importe enviado como texto provoca un 500 en lugar de 400 VALIDATION_ERROR. */
  parseo: 'KA-PARSE',
  /** M9 · Los ids de transferencia salen del reloj: dos creadas a la vez (en paralelo) comparten id y una pisa a la otra. */
  secuencia: 'KA-SEQ',
  /** M9 · El saldo solo se comprueba al crear: confirmar varias pendientes deja la cuenta en negativo. */
  reserva: 'KA-RESERVA',
  /** M10 · El detalle de una tarjeta incluye el número completo (pan), no solo last4. */
  pan: 'KA-PAN',
  /** M10 · GET /cards?accountId= ignora el filtro y devuelve las tarjetas de todos los clientes. */
  filtroTarjetas: 'KA-CARDFILTER',
  /** Examen · Se acepta la frecuencia en minúsculas («monthly»): debería ser 400. */
  frecuencia: 'KA-FRECUENCIA',
  /** Examen · Una orden que empieza hoy se rechaza (el mínimo es hoy, no mañana). */
  hoy: 'KA-HOY',
  /** Examen · Cancelar responde 204 pero la orden sigue ACTIVE. */
  cancelar: 'KA-CANCELAR',
  /** Examen · Un token de solo lectura puede cancelar órdenes (DELETE sin comprobar el scope). */
  scopeDelete: 'KA-SCOPE-DEL',
} as const

/** Fecha fija del sandbox para las órdenes periódicas (examen práctico). */
export const SANDBOX_TODAY = '2026-10-23'
/** Órdenes periódicas activas como máximo por cuenta. */
export const MAX_ACTIVE_ORDERS = 3
export const ORDER_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY']

/** Tarjetas de la Open API (opción cards). El pan nunca debe salir de la API. */
export const OPEN_API_CARDS = [
  { id: 'CRD-1001', accountId: 'ACC-1001', pan: '4000001234561001', last4: '1001', brand: 'VISA', status: 'ACTIVE', expiry: '2029-04' },
  { id: 'CRD-1002', accountId: 'ACC-1002', pan: '4000001234561002', last4: '1002', brand: 'VISA', status: 'BLOCKED', expiry: '2028-11' },
  { id: 'CRD-1003', accountId: 'ACC-1004', pan: '5500001234561003', last4: '1003', brand: 'MASTERCARD', status: 'EXPIRED', expiry: '2026-08' },
  { id: 'CRD-1004', accountId: 'ACC-1001', pan: '4000001234561004', last4: '1004', brand: 'VISA', status: 'ACTIVE', expiry: '2030-01' },
]

/** IBAN de cuentas de Kobalto (el resto son de otros bancos). */
export const KOBALTO_IBANS = new Set([...ACCOUNTS, ...PRE_ACCOUNTS].map((a) => a.iban))
/** Tiempo de procesamiento de una transferencia confirmada (opción async). */
export const TRANSFER_PROCESSING_MS = 8000
/** Fallos que simula el sandbox con la cabecera x-sandbox-fault (opción faults). */
export const SANDBOX_FAULTS = ['500', '503', '504']

/** Credenciales del cliente de QA en el sandbox (no son secretas: solo sandbox). */
export const QA_CLIENT_ID = 'qa-suite'
export const QA_CLIENT_SECRET = 'qa-sandbox-secret'
/** Peticiones de token permitidas por ejecución (límite de la API: «por minuto»). */
export const TOKEN_RATE_LIMIT = 5
const ALL_SCOPES = ['accounts:read', 'transfers:write']

/** Límite por transferencia de las cuentas personales (con la opción limits). */
export const PERSONAL_TRANSFER_LIMIT = 1000

/** Transferencia guardada por la API simulada. */
interface Transfer {
  id: string
  fromAccount: string
  toIban: string
  amount: number
  /** Lo que se guardó de verdad (con el bug de importes, sin decimales). */
  storedAmount: number
  currency: string
  concept: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED'
  /** Momento (reloj simulado) en que se confirmó (opción async). */
  confirmedAt?: number
  createdAt: string
  completedAt: string | null
  confirmations: number
  /** Pisó a otra transferencia con el mismo id (bug KA-SEQ). */
  collided?: boolean
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function fakeUuid(seed: string): string {
  const hex = Array.from({ length: 4 }, (_, i) => hash(seed + i).toString(16).padStart(8, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function latency(req: HttpRequest): number {
  return 18 + (hash(req.method + req.path + JSON.stringify(req.query)) % 40)
}

function error(req: HttpRequest, status: number, code: string, message: string): HttpResponse {
  return jsonResponse(status, { code, message, traceId: fakeUuid(req.path + code) }, latency(req), { 'x-request-id': fakeUuid('rid' + req.path) })
}

interface Options {
  version?: ApiVersion
  /** Activa el host de preproducción (api.pre.kobalto.test). */
  pre?: boolean
  /** Reglas de límites de la misión 5 (máximo 1.000 € por transferencia en cuentas personales). */
  limits?: boolean
  /** OAuth2 (misión 6): /accounts y /transfers exigen «Authorization: Bearer» con scopes. */
  auth?: boolean
  /**
   * Open API 1.7 (misión 7): confirmar devuelve 202 PROCESSING y la transferencia
   * se completa unos segundos después (se consulta con GET).
   */
  async?: boolean
  /** Fallos simulados con la cabecera x-sandbox-fault (500, 503, 504). */
  faults?: boolean
  /**
   * Datos propios (misión 9): POST /sandbox/accounts crea cuentas de prueba
   * y confirmar comprueba el saldo disponible en ese momento.
   */
  sandboxData?: boolean
  /** Tarjetas (misión 10): GET /cards?accountId= y GET /cards/{id}, con token. */
  cards?: boolean
  /** Órdenes periódicas (examen práctico): /standing-orders. */
  standingOrders?: boolean
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function header(req: HttpRequest, name: string): string | undefined {
  const k = Object.keys(req.headers).find((h) => h.toLowerCase() === name.toLowerCase())
  return k === undefined ? undefined : req.headers[k]
}

/** Host al que no se puede llamar: localhost sin servicio → conexión rechazada; otro → host desconocido. */
export function unreachable(req: HttpRequest): HttpResponse {
  const local = /^(localhost|127\.0\.0\.1)(?::(\d+))?$/.exec(req.host)
  const body = local ? `java.net.ConnectException: Connection refused: ${req.host}` : `java.net.UnknownHostException: ${req.host}`
  return { status: 0, headers: {}, body, ms: local ? 1 : 0 }
}

export function kobaltoOpenApi(options: Options = {}): ServerFactory {
  const version = options.version ?? '1.4'
  return (activeBugs: string[]): HttpHandler => {
    const on = (b: string) => activeBugs.includes(b)
    // Estado de esta ejecución: saldos y transferencias (como un servidor real).
    const balances = new Map<string, number>([...ACCOUNTS, ...PRE_ACCOUNTS].map((a) => [a.id, a.balance]))
    const transfers = new Map<string, Transfer>()
    let seq = 0
    const tokens = new Map<string, { scopes: string[]; revoked: boolean }>()
    /** Cuentas de prueba creadas en esta ejecución (POST /sandbox/accounts). */
    const created: Account[] = []
    /** Órdenes periódicas de esta ejecución. */
    const orders = new Map<string, Record<string, unknown>>()
    let tokenRequests = 0

    /** Representación pública de una cuenta según versión y bugs. */
    const present = (a: Account, used: Set<string>): Record<string, unknown> => {
      let status: string = a.status
      let currency: string = a.currency
      let balance: number | string = balances.get(a.id) ?? a.balance
      if (a.id === 'ACC-1003' && on(KOBALTO_API_BUGS.bloqueada)) {
        status = 'ACTIVE'
        used.add(KOBALTO_API_BUGS.bloqueada)
      }
      if (a.id === 'ACC-1004' && on(KOBALTO_API_BUGS.divisa)) {
        currency = 'EUR'
        used.add(KOBALTO_API_BUGS.divisa)
      }
      if (balance === 0 && on(KOBALTO_API_BUGS.tipo)) {
        balance = '0.00'
        used.add(KOBALTO_API_BUGS.tipo)
      }
      const out: Record<string, unknown> = { id: a.id, iban: a.iban }
      if (version === '1.5' && on(KOBALTO_API_BUGS.contrato)) {
        out.holderName = a.holder
        used.add(KOBALTO_API_BUGS.contrato)
      } else out.holder = a.holder
      Object.assign(out, { type: a.type, currency, balance, status, createdAt: a.createdAt })
      if (version === '1.5') out.alias = a.alias ?? null
      return out
    }

    const ok = (req: HttpRequest, body: unknown, used: Set<string>): HttpResponse =>
      jsonResponse(200, body, latency(req), { 'x-request-id': fakeUuid('rid' + req.path + JSON.stringify(req.query)), 'x-api-version': version === '1.5' ? '1.5.0' : '1.4.2' }, Array.from(used))

    const handle = (req: HttpRequest, env: 'sandbox' | 'pre'): HttpResponse => {
      const accounts = env === 'pre' ? PRE_ACCOUNTS : created.length ? [...ACCOUNTS, ...created] : ACCOUNTS
      const path = req.path.replace(/\/+$/, '') || '/'
      if (!path.startsWith('/v1/') && path !== '/v1') return error(req, 404, 'NOT_FOUND', `No route for ${req.method} ${path} (¿falta /v1 en la url?)`)
      const rest = path.slice(3)
      const used = new Set<string>()

      // Pre exige la clave en todo lo que no es /health.
      if (env === 'pre' && rest !== '/health') {
        const key = header(req, 'x-api-key')
        if (key === undefined || key === '') {
          const detail = /^\/accounts\/[^/]+$/.test(rest)
          if (!(detail && on(KOBALTO_API_BUGS.clave))) return error(req, 401, 'MISSING_API_KEY', 'x-api-key header is required')
          used.add(KOBALTO_API_BUGS.clave)
        } else if (key !== KOBALTO_PRE_KEY) return error(req, 401, 'INVALID_API_KEY', 'x-api-key is not valid')
      }

      if (options.faults && rest !== '/health' && !rest.startsWith('/auth')) {
        const fault = header(req, 'x-sandbox-fault')
        if (fault !== undefined) {
          if (fault === '503') return { ...error(req, 503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable, retry later'), headers: { 'Content-Type': 'application/json', 'Retry-After': '2' } }
          if (fault === '504') return { ...error(req, 504, 'GATEWAY_TIMEOUT', 'Upstream did not respond in time'), ms: 10000 }
          if (fault === '500') return error(req, 500, 'INTERNAL_ERROR', 'Unexpected error')
          return error(req, 400, 'INVALID_FAULT', `x-sandbox-fault must be one of ${SANDBOX_FAULTS.join(', ')}`)
        }
      }

      if (options.auth && rest === '/auth/token') {
        if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /auth/token`)
        tokenRequests++
        if (tokenRequests > TOKEN_RATE_LIMIT) {
          return { ...error(req, 429, 'TOO_MANY_REQUESTS', `Token endpoint rate limit: ${TOKEN_RATE_LIMIT} requests per minute per client`), headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
        }
        const b = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
        if (b.clientId !== QA_CLIENT_ID || b.clientSecret !== QA_CLIENT_SECRET) {
          if (on(KOBALTO_API_BUGS.auth500)) {
            return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'java.lang.NullPointerException at ClientRepository.findBySecret(ClientRepository.java:42)' }, latency(req), {}, [KOBALTO_API_BUGS.auth500])
          }
          return error(req, 401, 'INVALID_CLIENT', 'clientId or clientSecret are not valid')
        }
        const requested = typeof b.scope === 'string' && b.scope.trim() ? b.scope.trim().split(/\s+/) : ALL_SCOPES
        const unknown = requested.filter((x) => !ALL_SCOPES.includes(x))
        if (unknown.length) return error(req, 400, 'INVALID_SCOPE', `Unknown scope: ${unknown.join(' ')}`)
        const token = `kbt_${fakeUuid('tok' + tokenRequests + requested.join()).replace(/-/g, '').slice(0, 24)}`
        tokens.set(token, { scopes: requested, revoked: false })
        return ok(req, { access_token: token, token_type: 'Bearer', expires_in: 300, scope: requested.join(' ') }, used)
      }
      if (options.auth && rest === '/auth/revoke') {
        if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /auth/revoke`)
        const b = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>
        const t = typeof b.token === 'string' ? tokens.get(b.token) : undefined
        if (!t) return error(req, 400, 'INVALID_TOKEN', 'token is not valid')
        t.revoked = true
        return ok(req, { revoked: true }, used)
      }
      const isOrders = !!options.standingOrders && (rest === '/standing-orders' || rest.startsWith('/standing-orders/'))
      if (options.auth && (rest.startsWith('/accounts') || rest.startsWith('/transfers') || (options.cards && rest.startsWith('/cards')) || isOrders)) {
        const authz = header(req, 'Authorization') ?? ''
        const m = /^Bearer\s+(\S+)$/.exec(authz)
        if (!m) return error(req, 401, 'UNAUTHORIZED', 'Authorization: Bearer <token> is required')
        const t = tokens.get(m[1])
        if (!t) return error(req, 401, 'INVALID_TOKEN', 'token is not valid')
        if (t.revoked) {
          if (!on(KOBALTO_API_BUGS.revoke)) return error(req, 401, 'TOKEN_REVOKED', 'token has been revoked')
          used.add(KOBALTO_API_BUGS.revoke)
        }
        const need = (rest.startsWith('/transfers') || isOrders) && req.method !== 'GET' ? 'transfers:write' : 'accounts:read'
        // KA-SCOPE-DEL: cancelar una orden no comprueba el scope.
        const skip = isOrders && req.method === 'DELETE' && on(KOBALTO_API_BUGS.scopeDelete)
        if (skip && !t.scopes.includes(need)) used.add(KOBALTO_API_BUGS.scopeDelete)
        else if (!t.scopes.includes(need)) {
          if (!on(KOBALTO_API_BUGS.scope)) return error(req, 403, 'INSUFFICIENT_SCOPE', `scope ${need} is required`)
          used.add(KOBALTO_API_BUGS.scope)
        }
      }

      if (options.sandboxData && rest === '/sandbox/accounts') {
        if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /sandbox/accounts`)
        const b = (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}) as Record<string, unknown>
        const balance = b.balance === undefined ? 1000 : b.balance
        if (typeof balance !== 'number' || balance < 0 || Math.abs(Math.round(balance * 100) - balance * 100) > 1e-6) return validation(req, 'balance', 'balance must be a number >= 0 with at most 2 decimals')
        const currency = b.currency === undefined ? 'EUR' : b.currency
        if (currency !== 'EUR' && currency !== 'USD') return validation(req, 'currency', 'currency must be EUR or USD')
        const n = 9001 + created.length
        const a: Account = { id: `ACC-${n}`, iban: `ES00${String(n).padStart(20, '0')}`, holder: 'Cuenta de pruebas', type: 'PERSONAL', currency, balance, status: 'ACTIVE', createdAt: '2026-10-22T08:00:00Z', alias: null }
        created.push(a)
        balances.set(a.id, balance)
        return { ...ok(req, present(a, used), used), status: 201, headers: { 'Content-Type': 'application/json', Location: `/v1/accounts/${a.id}` } }
      }

      if (isOrders) return standingOrders(req, rest, path, env === 'pre' ? PRE_ACCOUNTS : created.length ? [...ACCOUNTS, ...created] : ACCOUNTS, used)

      if (options.cards && (rest === '/cards' || rest.startsWith('/cards/'))) {
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
        const show = (c: (typeof OPEN_API_CARDS)[number], withPan: boolean) => {
          const out: Record<string, unknown> = { id: c.id, accountId: c.accountId, brand: c.brand, last4: c.last4, status: c.status, expiry: c.expiry }
          if (withPan) out.pan = c.pan
          return out
        }
        if (rest === '/cards') {
          const accountId = req.query.accountId?.[0]
          if (!accountId) return validation(req, 'accountId', 'accountId is required')
          const own = OPEN_API_CARDS.filter((c) => c.accountId === accountId)
          let list = own
          if (on(KOBALTO_API_BUGS.filtroTarjetas)) {
            list = OPEN_API_CARDS
            if (list.length !== own.length) used.add(KOBALTO_API_BUGS.filtroTarjetas)
          }
          return ok(req, { items: list.map((c) => show(c, false)), total: list.length }, used)
        }
        const id = decodeURIComponent(rest.slice('/cards/'.length))
        if (!/^CRD-\d{4}$/.test(id)) return error(req, 400, 'INVALID_CARD_ID', `Card id must match CRD-0000, got '${id}'`)
        const card = OPEN_API_CARDS.find((c) => c.id === id)
        if (!card) return error(req, 404, 'CARD_NOT_FOUND', `Card ${id} not found`)
        if (on(KOBALTO_API_BUGS.pan)) used.add(KOBALTO_API_BUGS.pan)
        return ok(req, show(card, on(KOBALTO_API_BUGS.pan)), used)
      }

      if (rest === '/health') {
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /health`)
        return ok(req, { status: 'UP', service: 'kobalto-open-api', version: version === '1.5' ? '1.5.0' : '1.4.2' }, used)
      }

      if (rest === '/accounts') {
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /accounts`)
        const statusFilter = req.query.status?.[0]
        if (statusFilter && !['ACTIVE', 'BLOCKED', 'CLOSED'].includes(statusFilter)) return error(req, 400, 'INVALID_STATUS', `status must be one of ACTIVE, BLOCKED, CLOSED`)
        const page = Number(req.query.page?.[0] ?? '1')
        const size = Number(req.query.size?.[0] ?? '20')
        if (!Number.isInteger(page) || page < 1) return error(req, 400, 'INVALID_PAGE', 'page must be an integer >= 1')
        if (!Number.isInteger(size) || size < 1 || size > 100) return error(req, 400, 'INVALID_SIZE', 'size must be an integer between 1 and 100')
        let list = accounts
        if (statusFilter) {
          list = accounts.filter((a) => {
            const shown = a.id === 'ACC-1003' && on(KOBALTO_API_BUGS.bloqueada) ? 'ACTIVE' : a.status
            if (statusFilter === 'ACTIVE' && on(KOBALTO_API_BUGS.filtro) && a.status === 'CLOSED') {
              used.add(KOBALTO_API_BUGS.filtro)
              return true
            }
            return shown === statusFilter
          })
        }
        const items = list.slice((page - 1) * size, page * size).map((a) => present(a, used))
        return ok(req, { items, page, size, total: list.length }, used)
      }

      const acc = /^\/accounts\/([^/]+)(\/balance)?$/.exec(rest)
      if (acc) {
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
        const id = decodeURIComponent(acc[1])
        if (!/^ACC-\d{4}$/.test(id)) return error(req, 400, 'INVALID_ACCOUNT_ID', `Account id must match ACC-0000, got '${id}'`)
        const a = accounts.find((x) => x.id === id)
        if (!a) return error(req, 404, 'ACCOUNT_NOT_FOUND', `Account ${id} not found`)
        if (acc[2]) {
          const p = present(a, used)
          return ok(req, { accountId: a.id, available: p.balance, currency: p.currency, updatedAt: '2026-10-19T08:59:12Z' }, used)
        }
        return ok(req, present(a, used), used)
      }

      if (rest === '/transfers') {
        if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /transfers`)
        return createTransfer(req, accounts, used)
      }
      const trf = /^\/transfers\/([^/]+)(\/confirm)?$/.exec(rest)
      if (trf) {
        const t = transfers.get(decodeURIComponent(trf[1]))
        if (t?.collided) used.add(KOBALTO_API_BUGS.secuencia)
        const tagged = (r: HttpResponse): HttpResponse => (used.size ? { ...r, bugs: Array.from(new Set([...(r.bugs ?? []), ...used])) } : r)
        if (trf[2] && t && t.status === 'PENDING' && options.sandboxData) {
          const available = balances.get(t.fromAccount) ?? 0
          if (t.amount > available) {
            if (!on(KOBALTO_API_BUGS.reserva)) return tagged(error(req, 422, 'INSUFFICIENT_FUNDS', `Available balance is ${available}`))
            used.add(KOBALTO_API_BUGS.reserva)
          }
        }
        if (trf[2]) {
          if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
          if (!t) return error(req, 404, 'TRANSFER_NOT_FOUND', `Transfer ${trf[1]} not found`)
          if (options.async) {
            if (t.status !== 'PENDING') return tagged(error(req, 409, 'TRANSFER_ALREADY_CONFIRMED', `Transfer ${t.id} is already ${t.status}`))
            t.status = 'PROCESSING'
            t.confirmedAt = req.now ?? 0
            t.confirmations++
            balances.set(t.fromAccount, round2((balances.get(t.fromAccount) ?? 0) - t.amount))
            return { ...ok(req, presentTransfer(t, used), used), status: 202, headers: { 'Content-Type': 'application/json', Location: `/v1/transfers/${t.id}`, 'x-request-id': fakeUuid('rid' + t.id + 'c') } }
          }
          if (t.status === 'COMPLETED') {
            if (!on(KOBALTO_API_BUGS.doble)) return error(req, 409, 'TRANSFER_ALREADY_COMPLETED', `Transfer ${t.id} is already completed`)
            used.add(KOBALTO_API_BUGS.doble)
          }
          t.status = 'COMPLETED'
          t.completedAt = t.completedAt ?? '2026-10-22T10:00:00Z'
          t.confirmations++
          balances.set(t.fromAccount, round2((balances.get(t.fromAccount) ?? 0) - t.amount))
          return ok(req, presentTransfer(t, used), used)
        }
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
        if (!t) {
          if (on(KOBALTO_API_BUGS.formatoError)) {
            // Error por defecto del framework: sin code ni traceId.
            return jsonResponse(404, { timestamp: '2026-10-20T09:14:03.512+00:00', status: 404, error: 'Not Found', path }, latency(req), {}, [KOBALTO_API_BUGS.formatoError])
          }
          return error(req, 404, 'TRANSFER_NOT_FOUND', `Transfer ${trf[1]} not found`)
        }
        if (t.status === 'PROCESSING' && (req.now ?? 0) - (t.confirmedAt ?? 0) >= TRANSFER_PROCESSING_MS) {
          if (!KOBALTO_IBANS.has(t.toIban) && on(KOBALTO_API_BUGS.asincrona)) used.add(KOBALTO_API_BUGS.asincrona)
          else {
            t.status = 'COMPLETED'
            t.completedAt = '2026-10-20T10:00:08Z'
          }
        }
        return ok(req, presentTransfer(t, used), used)
      }

      return error(req, 404, 'NOT_FOUND', `No route for ${req.method} ${path}`)
    }

    const presentTransfer = (t: Transfer, used: Set<string>): Record<string, unknown> => {
      if (t.storedAmount !== t.amount) used.add(KOBALTO_API_BUGS.importe)
      return {
        id: t.id,
        fromAccount: t.fromAccount,
        toIban: t.toIban,
        amount: t.storedAmount,
        currency: t.currency,
        concept: t.concept,
        status: t.status,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      }
    }

    const createTransfer = (req: HttpRequest, accounts: Account[], used: Set<string>): HttpResponse => {
      const b = req.body
      if (!b || typeof b !== 'object' || Array.isArray(b)) return error(req, 400, 'INVALID_BODY', 'Request body must be a JSON object (¿falta request?)')
      const body = b as Record<string, unknown>
      for (const f of ['fromAccount', 'toIban', 'amount', 'currency']) {
        if (body[f] === undefined || body[f] === null || body[f] === '') return validation(req, f, `${f} is required`)
      }
      const amount = body.amount
      if (typeof amount === 'string' && on(KOBALTO_API_BUGS.parseo)) {
        return jsonResponse(500, { code: 'INTERNAL_ERROR', message: `Cannot deserialize value of type \`java.math.BigDecimal\` from String "${amount}": not a valid representation`, traceId: fakeUuid(req.path + 'parse') }, latency(req), {}, [KOBALTO_API_BUGS.parseo])
      }
      if (typeof amount !== 'number' || !Number.isFinite(amount)) return validation(req, 'amount', 'amount must be a number')
      if (amount <= 0) return validation(req, 'amount', 'amount must be greater than 0')
      if (options.limits && amount < 1 && on(KOBALTO_API_BUGS.centimos)) {
        return { ...validation(req, 'amount', 'amount must be at least 1.00'), bugs: [KOBALTO_API_BUGS.centimos] }
      }
      if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) return validation(req, 'amount', 'amount must have at most 2 decimals')
      if (typeof body.toIban !== 'string' || !/^ES\d{22}$/.test(body.toIban)) return error(req, 400, 'INVALID_IBAN', 'toIban must be a Spanish IBAN without spaces (ES + 22 digits)')
      if (body.concept !== undefined && body.concept !== null && (typeof body.concept !== 'string' || body.concept.length > 140)) return validation(req, 'concept', 'concept must be a string of up to 140 characters')
      if (options.limits && typeof body.concept === 'string' && body.concept.length === 140 && on(KOBALTO_API_BUGS.concepto)) {
        return { ...validation(req, 'concept', 'concept must be a string of up to 140 characters'), bugs: [KOBALTO_API_BUGS.concepto] }
      }
      const from = accounts.find((a) => a.id === body.fromAccount)
      if (!from) return error(req, 404, 'ACCOUNT_NOT_FOUND', `Account ${String(body.fromAccount)} not found`)
      if (from.status !== 'ACTIVE') return error(req, 422, 'ACCOUNT_NOT_OPERATIVE', `Account ${from.id} is ${from.status}`)
      if (body.currency !== from.currency) return error(req, 422, 'CURRENCY_MISMATCH', `Account ${from.id} operates in ${from.currency}`)
      if (options.limits && from.type === 'PERSONAL') {
        const over = amount > PERSONAL_TRANSFER_LIMIT
        if (over || (amount === PERSONAL_TRANSFER_LIMIT && on(KOBALTO_API_BUGS.limite))) {
          const res = error(req, 422, 'LIMIT_EXCEEDED', `Personal accounts can transfer up to ${PERSONAL_TRANSFER_LIMIT} per transfer`)
          return over ? res : { ...res, bugs: [KOBALTO_API_BUGS.limite] }
        }
      }
      const available = balances.get(from.id) ?? from.balance
      if (amount > available) {
        if (!on(KOBALTO_API_BUGS.fondos)) return error(req, 422, 'INSUFFICIENT_FUNDS', `Available balance is ${available}`)
        used.add(KOBALTO_API_BUGS.fondos)
      }
      seq++
      // Con KA-SEQ el id sale del reloj (ms / 25): dos creaciones casi simultáneas chocan.
      const id = on(KOBALTO_API_BUGS.secuencia) ? `TRF-${4100 + Math.floor((req.now ?? 0) / 25)}` : `TRF-${String(4100 + seq)}`
      const clash = transfers.has(id)
      const t: Transfer = {
        id,
        fromAccount: from.id,
        toIban: body.toIban,
        amount,
        storedAmount: on(KOBALTO_API_BUGS.importe) ? Math.trunc(amount) : amount,
        currency: String(body.currency),
        concept: typeof body.concept === 'string' ? body.concept : null,
        status: 'PENDING',
        createdAt: `2026-10-22T09:${String(10 + seq).padStart(2, '0')}:00Z`,
        completedAt: null,
        confirmations: 0,
      }
      if (clash) {
        t.collided = true
        used.add(KOBALTO_API_BUGS.secuencia)
      }
      transfers.set(id, t)
      // La respuesta del POST devuelve lo que se recibió: el bug de importes solo se ve al leerla.
      const res = jsonResponse(
        201,
        { ...presentTransfer({ ...t, storedAmount: t.amount }, used) },
        latency(req),
        { Location: `/v1/transfers/${id}`, 'x-request-id': fakeUuid('rid' + id), 'x-api-version': version === '1.5' ? '1.5.0' : '1.4.2' },
        Array.from(used),
      )
      return res
    }

    /** Órdenes periódicas (examen práctico). Contrato en la wiki del examen. */
    const standingOrders = (req: HttpRequest, rest: string, path: string, accounts: Account[], used: Set<string>): HttpResponse => {
      const tagged = (r: HttpResponse): HttpResponse => (used.size ? { ...r, bugs: Array.from(new Set([...(r.bugs ?? []), ...used])) } : r)
      const visible = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'cancelBug' && k !== 'cancelled'))
      if (rest === '/standing-orders') {
        if (req.method === 'GET') {
          const accountId = req.query.accountId?.[0]
          if (!accountId) return validation(req, 'accountId', 'accountId is required')
          const mine = Array.from(orders.values()).filter((o) => o.fromAccount === accountId)
          if (mine.some((o) => o.cancelBug)) used.add(KOBALTO_API_BUGS.cancelar)
          return ok(req, { items: mine.map(visible), total: mine.length }, used)
        }
        if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /standing-orders`)
        const b = req.body
        if (!b || typeof b !== 'object' || Array.isArray(b)) return validation(req, 'body', 'Request body must be a JSON object')
        const body = b as Record<string, unknown>
        for (const f of ['fromAccount', 'toIban', 'amount', 'currency', 'frequency', 'startDate']) {
          if (body[f] === undefined || body[f] === null || body[f] === '') return validation(req, f, `${f} is required`)
        }
        const amount = body.amount
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return validation(req, 'amount', 'amount must be a number greater than 0')
        if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) return validation(req, 'amount', 'amount must have at most 2 decimals')
        let frequency = body.frequency
        if (typeof frequency !== 'string' || !ORDER_FREQUENCIES.includes(frequency)) {
          const lower = typeof frequency === 'string' && ORDER_FREQUENCIES.includes(frequency.toUpperCase())
          if (!(lower && on(KOBALTO_API_BUGS.frecuencia))) return validation(req, 'frequency', `frequency must be one of ${ORDER_FREQUENCIES.join(', ')}`)
          used.add(KOBALTO_API_BUGS.frecuencia)
          frequency = String(frequency)
        }
        const startDate = body.startDate
        if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return validation(req, 'startDate', 'startDate must be a date YYYY-MM-DD')
        if (startDate < SANDBOX_TODAY) return validation(req, 'startDate', `startDate cannot be in the past (today is ${SANDBOX_TODAY})`)
        if (startDate === SANDBOX_TODAY && on(KOBALTO_API_BUGS.hoy)) {
          return { ...validation(req, 'startDate', `startDate must be after ${SANDBOX_TODAY}`), bugs: [KOBALTO_API_BUGS.hoy] }
        }
        if (typeof body.toIban !== 'string' || !/^ES\d{22}$/.test(body.toIban)) return error(req, 400, 'INVALID_IBAN', 'toIban must be a Spanish IBAN without spaces (ES + 22 digits)')
        const from = accounts.find((a) => a.id === body.fromAccount)
        if (!from) return error(req, 404, 'ACCOUNT_NOT_FOUND', `Account ${String(body.fromAccount)} not found`)
        if (from.status !== 'ACTIVE') return error(req, 422, 'ACCOUNT_NOT_OPERATIVE', `Account ${from.id} is ${from.status}`)
        if (body.currency !== from.currency) return error(req, 422, 'CURRENCY_MISMATCH', `Account ${from.id} operates in ${from.currency}`)
        if (from.type === 'PERSONAL' && amount > PERSONAL_TRANSFER_LIMIT) return error(req, 422, 'LIMIT_EXCEEDED', `Personal accounts can schedule up to ${PERSONAL_TRANSFER_LIMIT} per order`)
        const active = Array.from(orders.values()).filter((o) => o.fromAccount === from.id && o.status === 'ACTIVE').length
        if (active >= MAX_ACTIVE_ORDERS) return error(req, 422, 'TOO_MANY_ORDERS', `Account ${from.id} already has ${MAX_ACTIVE_ORDERS} active standing orders`)
        const id = `SO-${7001 + orders.size}`
        const order: Record<string, unknown> = {
          id,
          fromAccount: from.id,
          toIban: body.toIban,
          amount,
          currency: from.currency,
          frequency,
          startDate,
          nextExecution: startDate,
          concept: typeof body.concept === 'string' ? body.concept : null,
          status: 'ACTIVE',
          createdAt: `${SANDBOX_TODAY}T09:00:00Z`,
        }
        orders.set(id, order)
        return { ...ok(req, { ...order }, used), status: 201, headers: { 'Content-Type': 'application/json', Location: `/v1/standing-orders/${id}` } }
      }
      const id = decodeURIComponent(rest.slice('/standing-orders/'.length))
      if (!/^SO-\d{4}$/.test(id)) return tagged(error(req, 400, 'INVALID_ORDER_ID', `Standing order id must match SO-0000, got '${id}'`))
      const order = orders.get(id)
      if (!order) return tagged(error(req, 404, 'STANDING_ORDER_NOT_FOUND', `Standing order ${id} not found`))
      if (order.cancelBug) used.add(KOBALTO_API_BUGS.cancelar)
      if (req.method === 'GET') return ok(req, visible(order), used)
      if (req.method !== 'DELETE') return tagged(error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`))
      if (order.status === 'CANCELLED' || order.cancelled) return tagged(error(req, 409, 'ALREADY_CANCELLED', `Standing order ${id} is already cancelled`))
      if (on(KOBALTO_API_BUGS.cancelar)) {
        // KA-CANCELAR: se marca como cancelada para no repetir, pero el estado no cambia.
        order.cancelled = true
        order.cancelBug = true
        used.add(KOBALTO_API_BUGS.cancelar)
      } else {
        order.status = 'CANCELLED'
        order.nextExecution = null
      }
      return { status: 204, headers: { 'x-request-id': fakeUuid('rid' + id + 'del') }, body: '', ms: latency(req), bugs: Array.from(used) }
    }

    const validation = (req: HttpRequest, field: string, message: string): HttpResponse =>
      jsonResponse(400, { code: 'VALIDATION_ERROR', field, message, traceId: fakeUuid(req.path + field) }, latency(req))

    return (req: HttpRequest): HttpResponse => {
      const env = req.host === KOBALTO_API_HOST ? 'sandbox' : options.pre && req.host === KOBALTO_PRE_HOST ? 'pre' : null
      if (!env) return unreachable(req)
      const res = handle(req, env)
      // La API devuelve el id de correlación que recibe (trazas con los partners).
      const corr = header(req, 'x-correlation-id')
      if (corr) {
        if (env === 'pre' && on(KOBALTO_API_BUGS.correlacion)) res.bugs = [...(res.bugs ?? []), KOBALTO_API_BUGS.correlacion]
        else res.headers = { ...res.headers, 'x-correlation-id': corr }
      }
      return res
    }
  }
}
