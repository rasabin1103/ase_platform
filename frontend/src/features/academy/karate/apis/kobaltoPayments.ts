/**
 * Servicio de pagos con tarjeta de Kobalto, arrancado en local para pruebas
 * de componente (misión 8 del curso de Karate).
 *
 * http://localhost:8080/v1 · Para autorizar cada pago llama al procesador de
 * tarjetas Paynexo en PROCESSOR_URL = http://localhost:8090 (donde el alumno
 * arranca su mock con karate.start). Sin nada escuchando ahí, la conexión se
 * rechaza, como pasaría de verdad.
 */
import { jsonResponse, type HttpHandler, type HttpRequest, type HttpResponse, type ServerFactory } from '../http'
import { unreachable } from './kobaltoOpenApi'

export const PAYMENTS_HOST = 'localhost:8080'
export const PAYMENTS_BASE = `http://${PAYMENTS_HOST}/v1`
export const PROCESSOR_PORT = 8090
export const PROCESSOR_URL = `http://localhost:${PROCESSOR_PORT}`
export const PROCESSOR_AUTH_PATH = '/v2/authorizations'
/** Tiempo máximo que el servicio espera al procesador (ms). */
export const PROCESSOR_TIMEOUT_MS = 3000

export const PAYMENTS_BUGS = {
  /** Si el procesador no responde a tiempo, el pago se da por APROBADO (sin authCode). */
  timeout: 'KA-TIMEOUT',
  /** El motivo de la denegación del procesador se pierde (llega «UNKNOWN»). */
  motivo: 'KA-MOTIVO',
  /** Se envía el importe en euros a Paynexo, que espera céntimos enteros. */
  unidades: 'KA-UNIDADES',
} as const

export interface Card {
  id: string
  accountId: string
  last4: string
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED'
  expiry: string
  /** Token de la tarjeta en Paynexo (nunca se expone el número). */
  token: string
}

export const CARDS: Card[] = [
  { id: 'CRD-1001', accountId: 'ACC-1001', last4: '4242', status: 'ACTIVE', expiry: '2029-04', token: 'tok_7Hq2Lm' },
  { id: 'CRD-1002', accountId: 'ACC-1002', last4: '1881', status: 'BLOCKED', expiry: '2028-11', token: 'tok_9Zx1Pa' },
  { id: 'CRD-1003', accountId: 'ACC-1004', last4: '0005', status: 'EXPIRED', expiry: '2026-08', token: 'tok_3Rt8Vc' },
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function uuid(seed: string): string {
  const hex = Array.from({ length: 4 }, (_, i) => hash(seed + i).toString(16).padStart(8, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

function latency(req: HttpRequest): number {
  return 12 + (hash(req.method + req.path + JSON.stringify(req.body ?? null)) % 25)
}

export function kobaltoPayments(): ServerFactory {
  return (activeBugs: string[]): HttpHandler => {
    const on = (b: string) => activeBugs.includes(b)
    let seq = 0

    const error = (req: HttpRequest, status: number, code: string, message: string, extra: Record<string, unknown> = {}, bugs: string[] = [], ms = latency(req)): HttpResponse =>
      jsonResponse(status, { code, message, ...extra, traceId: uuid(req.path + code + seq) }, ms, { 'x-request-id': uuid('rid' + req.path + seq) }, bugs)

    const pay = (req: HttpRequest, card: Card): HttpResponse => {
      const b = req.body
      if (!b || typeof b !== 'object' || Array.isArray(b)) return error(req, 400, 'VALIDATION_ERROR', 'Request body must be a JSON object', { field: 'body' })
      const body = b as Record<string, unknown>
      const { amount, currency, merchant } = body
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return error(req, 400, 'VALIDATION_ERROR', 'amount must be a number greater than 0', { field: 'amount' })
      if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) return error(req, 400, 'VALIDATION_ERROR', 'amount must have at most 2 decimals', { field: 'amount' })
      if (currency !== 'EUR') return error(req, 400, 'VALIDATION_ERROR', 'currency must be EUR', { field: 'currency' })
      if (typeof merchant !== 'string' || merchant.trim() === '' || merchant.length > 60) return error(req, 400, 'VALIDATION_ERROR', 'merchant must be a string of 1 to 60 characters', { field: 'merchant' })
      if (card.status === 'BLOCKED') return error(req, 422, 'CARD_BLOCKED', `Card ${card.id} is blocked`)
      if (card.status === 'EXPIRED') return error(req, 422, 'CARD_EXPIRED', `Card ${card.id} expired on ${card.expiry}`)

      seq++
      const id = `PAY-${5000 + seq}`
      const cents = Math.round(amount * 100)
      const used: string[] = []
      if (on(PAYMENTS_BUGS.unidades)) used.push(PAYMENTS_BUGS.unidades)
      const out: HttpRequest = {
        method: 'POST',
        url: PROCESSOR_URL + PROCESSOR_AUTH_PATH,
        host: `localhost:${PROCESSOR_PORT}`,
        path: PROCESSOR_AUTH_PATH,
        query: {},
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': uuid('idem' + id), 'X-Merchant-Id': 'KOBALTO' },
        body: { amount: on(PAYMENTS_BUGS.unidades) ? amount : cents, currency, merchant, cardToken: card.token, reference: id },
      }
      const pr = req.net ? req.net(out) : unreachable(out)
      const own = latency(req)
      if (pr.status === 0) return error(req, 503, 'PROCESSOR_UNAVAILABLE', 'Card processor is not reachable', {}, used, own + pr.ms)
      if (pr.ms > PROCESSOR_TIMEOUT_MS) {
        const ms = PROCESSOR_TIMEOUT_MS + own
        if (on(PAYMENTS_BUGS.timeout)) {
          return jsonResponse(201, { id, status: 'APPROVED', authCode: null, amount, currency, merchant, cardId: card.id }, ms, { Location: `/v1/payments/${id}` }, [...used, PAYMENTS_BUGS.timeout])
        }
        return error(req, 504, 'PROCESSOR_TIMEOUT', `Card processor did not respond in ${PROCESSOR_TIMEOUT_MS} ms`, {}, used, ms)
      }
      const ms = own + pr.ms
      if (pr.status >= 400) return error(req, 502, 'PROCESSOR_ERROR', `Card processor responded ${pr.status}`, {}, used, ms)
      const r = (pr.body && typeof pr.body === 'object' ? pr.body : {}) as Record<string, unknown>
      if (pr.status < 300 && r.result === 'APPROVED' && typeof r.authCode === 'string' && r.authCode !== '') {
        return jsonResponse(201, { id, status: 'APPROVED', authCode: r.authCode, amount, currency, merchant, cardId: card.id }, ms, { Location: `/v1/payments/${id}`, 'x-request-id': uuid('rid' + id) }, used)
      }
      if (pr.status < 300 && r.result === 'DECLINED') {
        const reason = typeof r.reason === 'string' && r.reason ? r.reason : 'UNKNOWN'
        if (on(PAYMENTS_BUGS.motivo) && reason !== 'UNKNOWN') return error(req, 422, 'PAYMENT_DECLINED', 'Payment declined by the card processor', { reason: 'UNKNOWN' }, [...used, PAYMENTS_BUGS.motivo], ms)
        return error(req, 422, 'PAYMENT_DECLINED', 'Payment declined by the card processor', { reason }, used, ms)
      }
      return error(req, 502, 'PROCESSOR_ERROR', 'Card processor returned an invalid response', {}, used, ms)
    }

    const handle = (req: HttpRequest): HttpResponse => {
      const path = req.path.replace(/\/+$/, '') || '/'
      if (!path.startsWith('/v1/')) return error(req, 404, 'NOT_FOUND', `No route for ${req.method} ${path} (¿falta /v1 en la url?)`)
      const rest = path.slice(3)
      if (rest === '/health') {
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on /health`)
        return jsonResponse(200, { status: 'UP', service: 'kobalto-payments', processorUrl: PROCESSOR_URL }, latency(req))
      }
      const m = /^\/cards\/([^/]+)(\/payments)?$/.exec(rest)
      if (m) {
        const id = decodeURIComponent(m[1])
        if (!/^CRD-\d{4}$/.test(id)) return error(req, 400, 'INVALID_CARD_ID', `Card id must match CRD-0000, got '${id}'`)
        const card = CARDS.find((c) => c.id === id)
        if (!card) return error(req, 404, 'CARD_NOT_FOUND', `Card ${id} not found`)
        if (m[2]) {
          if (req.method !== 'POST') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
          return pay(req, card)
        }
        if (req.method !== 'GET') return error(req, 405, 'METHOD_NOT_ALLOWED', `${req.method} not allowed on ${path}`)
        return jsonResponse(200, { id: card.id, accountId: card.accountId, last4: card.last4, status: card.status, expiry: card.expiry }, latency(req))
      }
      return error(req, 404, 'NOT_FOUND', `No route for ${req.method} ${path}`)
    }

    return (req: HttpRequest): HttpResponse => {
      if (req.host !== PAYMENTS_HOST && req.host !== '127.0.0.1:8080') return unreachable(req)
      return handle(req)
    }
  }
}
