import type { AppEvent } from '../../engine/types'
import { formatEur } from '../kobalto/transferLogic'

/**
 * App bajo prueba de la misión 4: sección «Tarjetas» de la app de Kobalto en
 * beta (KOB-180). Los bugs solo aparecen en ciertas condiciones (dispositivo,
 * idioma, tipo de cuenta, secuencia o datos): el reto es reproducirlos,
 * aislar la condición y reportarlos de forma que el dev los reproduzca.
 */

export type Device = 'ios' | 'android' | 'web'
export type Lang = 'es' | 'en'
export type Profile = 'personal' | 'joven' | 'empresa'
export type Screen = 'card' | 'movements'

export interface Env {
  device: Device
  lang: Lang
  profile: Profile
}

export const DEVICE_LABEL: Record<Device, string> = { ios: 'iPhone 15 · iOS 18', android: 'Pixel 8 · Android 15', web: 'Web · Chrome' }
export const LANG_LABEL: Record<Lang, string> = { es: 'Español', en: 'English' }
export const PROFILE_LABEL: Record<Profile, string> = { personal: 'Personal', joven: 'Joven', empresa: 'Empresa' }
export const HOLDER: Record<Profile, string> = { personal: 'Lucía Gómez', joven: 'Álex Martín (21 años)', empresa: 'Talleres Ruiz, S. L.' }

export const CARD_BUGS = {
  androidFreeze: 'C1',
  secondFreeze: 'C1b',
  englishLimit: 'C2',
  youthLimit: 'C2b',
  exportLastDay: 'C3',
  typo: 'C4',
  businessExport: 'C5',
  /** Regresión: tras arreglar la congelación, en Android no se descongela. */
  androidUnfreeze: 'C-R1',
} as const

export const CARD_BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'freeze', options: ['C1', 'C1b'] },
  { slot: 'limit', options: ['C2', 'C2b'] },
  { slot: 'export', options: ['C3'] },
  { slot: 'typo', options: ['C4'] },
  { slot: 'business', options: ['C5'] },
]

export const LIMITS: Record<Profile, { min: number; max: number }> = {
  personal: { min: 100, max: 6000 },
  joven: { min: 100, max: 500 },
  empresa: { min: 100, max: 6000 },
}
export const EXPORT_MAX_DAYS = 731
export const SIM_TODAY = '2026-10-12'

export interface Movement {
  date: string
  merchant: string
  amount: number
  /** Retención temporal ya liberada (no es un cargo). */
  released?: string
}

export interface Account {
  /** Estado que ve el cliente y que dice la especificación. */
  frozen: boolean
  /** Estado real en el servidor (puede diferir por un bug). */
  frozenServer: boolean
  freezes: number
  limit: number
  specLimit: number
  spent: number
  movements: Movement[]
}

export interface CardsState {
  accounts: Record<Profile, Account>
}

const SEPT: Movement[] = [
  { date: '2026-09-02', merchant: 'Mercadona', amount: 54.2, released: '2026-09-05' },
  { date: '2026-09-02', merchant: 'Mercadona', amount: 52.87 },
  { date: '2026-09-07', merchant: 'Renfe', amount: 23.4 },
  { date: '2026-09-12', merchant: 'Zara', amount: 39.95 },
  { date: '2026-09-15', merchant: 'Repsol', amount: 60 },
  { date: '2026-09-21', merchant: 'Amazon', amount: 18.99 },
  { date: '2026-09-26', merchant: 'La Tasca', amount: 34.5 },
  { date: '2026-09-30', merchant: 'Cines Lumière', amount: 18 },
]

function businessHistory(): Movement[] {
  const out: Movement[] = []
  for (let y = 2025; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 9) break
      const mm = String(m).padStart(2, '0')
      out.push({ date: `${y}-${mm}-05`, merchant: 'Hierros del Norte', amount: 1240 })
      out.push({ date: `${y}-${mm}-20`, merchant: 'Gasóleo Ruta', amount: 310.5 })
    }
  }
  return out.reverse()
}

function account(movements: Movement[], limit: number, spent: number): Account {
  return { frozen: false, frozenServer: false, freezes: 0, limit, specLimit: limit, spent, movements }
}

export const INITIAL_CARDS: CardsState = {
  accounts: {
    personal: account(SEPT, 1500, 0),
    joven: account(SEPT.slice(2, 6), 300, 0),
    empresa: account(businessHistory(), 6000, 0),
  },
}

export interface CardBuild {
  active?: string[]
  fixed?: string[]
  regressions?: string[]
}

function liveBugs(build: CardBuild): (b: string) => boolean {
  const active = new Set(build.active ?? CARD_BUG_SLOTS.map((s) => s.options[0]))
  const fixed = new Set(build.fixed ?? [])
  const regs = new Set((build.regressions ?? []).filter((r) => !fixed.has(r)))
  return (b) => (active.has(b) && !fixed.has(b)) || regs.has(b)
}

const envTag = (env: Env) => `${DEVICE_LABEL[env.device]} · ${env.lang} · cuenta ${PROFILE_LABEL[env.profile]}`

export function freezeLabel(env: Env, frozen: boolean, build: CardBuild): string {
  if (env.lang === 'en') return frozen ? 'Unfreeze card' : 'Freeze card'
  if (frozen) return 'Descongelar tarjeta'
  return liveBugs(build)(CARD_BUGS.typo) ? 'Conjelar tarjeta' : 'Congelar tarjeta'
}

export interface CardResult {
  ok: boolean
  message: string
  state: CardsState
  event: AppEvent
}

function withAccount(state: CardsState, profile: Profile, acc: Account): CardsState {
  return { accounts: { ...state.accounts, [profile]: acc } }
}

function ev(action: string, env: Env, summary: string, technical: string, status: 'ok' | 'error', bugs: string[]): AppEvent {
  return { app: 'kobalto-cards', action, summary: `[${envTag(env)}] ${summary}`, technical, status, bugs }
}

/** Congelar o descongelar la tarjeta. */
export function toggleFreeze(state: CardsState, env: Env, build: CardBuild = {}): CardResult {
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const next: Account = { ...acc }
  if (!acc.frozen) {
    next.frozen = true
    next.freezes = acc.freezes + 1
    const ignored = (env.device === 'android' && has(CARD_BUGS.androidFreeze)) || (next.freezes >= 2 && has(CARD_BUGS.secondFreeze))
    next.frozenServer = ignored ? acc.frozenServer : true
    const body = env.device === 'android' && has(CARD_BUGS.androidFreeze) ? '{"blocked":true}' : '{"status":"frozen"}'
    return {
      ok: true,
      message: env.lang === 'en' ? 'Card frozen' : 'Tarjeta congelada',
      state: withAccount(state, env.profile, next),
      event: ev('freeze', env, `Congelar tarjeta → la app muestra «Tarjeta congelada» (congelación nº ${next.freezes})`, `PATCH /api/v1/cards/me ${body} → 200`, 'ok', []),
    }
  }
  next.frozen = false
  const stuck = env.device === 'android' && has(CARD_BUGS.androidUnfreeze)
  next.frozenServer = stuck ? acc.frozenServer : false
  return {
    ok: true,
    message: env.lang === 'en' ? 'Card active' : 'Tarjeta activa',
    state: withAccount(state, env.profile, next),
    event: ev('unfreeze', env, 'Descongelar tarjeta → la app muestra «Tarjeta activa»', `PATCH /api/v1/cards/me {"status":"active"} → 200`, 'ok', []),
  }
}

/** Interpreta un importe entero de euros según el idioma de la app. */
export function parseLimit(raw: string, lang: Lang): number {
  const s = raw.trim().replace(/\s|€/g, '')
  const thousands = lang === 'es' ? '.' : ','
  // Solo euros enteros, con o sin separador de miles del idioma.
  const re = new RegExp(`^\\d{1,3}(\\${thousands}\\d{3})+$|^\\d+$`)
  return re.test(s) ? Number(s.split(thousands).join('')) : NaN
}

/** Lectura del código de staging: siempre con formato español (bug C2 en inglés). */
function parseLimitBuggy(raw: string): number {
  const s = raw.trim().replace(/\s|€/g, '').replace(/\./g, '').replace(',', '.')
  return /^\d+(\.\d+)?$/.test(s) ? Math.floor(Number(s)) : NaN
}

export function setLimit(state: CardsState, env: Env, raw: string, build: CardBuild = {}): CardResult {
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const range = LIMITS[env.profile]
  const specValue = parseLimit(raw, env.lang)
  const specOk = !Number.isNaN(specValue) && specValue >= range.min && specValue <= range.max
  let actualValue = specValue
  if (env.lang === 'en' && has(CARD_BUGS.englishLimit)) actualValue = parseLimitBuggy(raw)
  let actualOk = specOk
  if (env.lang === 'en' && has(CARD_BUGS.englishLimit)) actualOk = specOk && !Number.isNaN(actualValue)
  if (env.profile === 'joven' && has(CARD_BUGS.youthLimit)) actualOk = !Number.isNaN(specValue) && specValue >= range.min && specValue <= LIMITS.personal.max
  const bugs: string[] = []
  if (actualOk !== specOk && env.profile === 'joven') bugs.push(CARD_BUGS.youthLimit)
  if (actualOk && specOk && actualValue !== specValue) bugs.push(CARD_BUGS.englishLimit)
  const tech = `PUT /api/v1/cards/me/limit {"raw":"${raw.trim()}","lang":"${env.lang}"}`
  if (!actualOk) {
    const msg = `Límite no válido: de ${formatEur(range.min)} a ${formatEur(range.max)}, en euros enteros`
    return { ok: false, message: msg, state, event: ev('limit', env, `Límite mensual «${raw.trim()}» → ${msg}`, `${tech} → 422`, 'error', bugs) }
  }
  const next = { ...acc, limit: actualValue, specLimit: specOk ? specValue : acc.specLimit }
  return {
    ok: true,
    message: `Límite mensual: ${formatEur(actualValue)}`,
    state: withAccount(state, env.profile, next),
    event: ev('limit', env, `Límite mensual «${raw.trim()}» → guardado ${formatEur(actualValue)}`, `${tech} → 200 {"limit":${actualValue}}`, 'ok', bugs),
  }
}

/** Compra simulada en un comercio de pruebas (staging). */
export function purchase(state: CardsState, env: Env, raw: string, build: CardBuild = {}): CardResult {
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const amount = Number(raw.trim().replace(',', '.'))
  const tech = `POST /test-acquirer/purchases {"amount":"${raw.trim()}"}`
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Importe no válido', state, event: ev('purchase', env, `Compra de prueba «${raw}» → importe no válido`, `${tech} → 422`, 'error', []) }
  }
  const decide = (frozen: boolean, limit: number) => (frozen ? 'frozen' : acc.spent + amount > limit ? 'limit' : 'ok')
  const spec = decide(acc.frozen, acc.specLimit)
  const actual = decide(acc.frozenServer, acc.limit)
  const bugs: string[] = []
  if (spec !== actual) {
    if (acc.limit !== acc.specLimit && (spec === 'limit' || actual === 'limit')) bugs.push(CARD_BUGS.englishLimit)
    else if (actual === 'ok' && spec === 'frozen') {
      if (has(CARD_BUGS.androidFreeze) || build.fixed?.includes(CARD_BUGS.androidFreeze)) bugs.push(CARD_BUGS.androidFreeze)
      else bugs.push(CARD_BUGS.secondFreeze)
    } else if (actual === 'frozen' && spec !== 'frozen') bugs.push(CARD_BUGS.androidUnfreeze)
  }
  const fmt = formatEur(amount)
  if (actual !== 'ok') {
    const reason = actual === 'frozen' ? 'denegada: tarjeta congelada' : 'denegada: límite mensual superado'
    return {
      ok: false,
      message: `Compra ${reason}`,
      state,
      event: ev('purchase', env, `Compra de prueba de ${fmt} (tarjeta ${acc.frozen ? 'congelada' : 'activa'} en la app) → ${reason}`, `${tech} → 402 {"reason":"${actual}"}`, 'error', bugs),
    }
  }
  const next = { ...acc, spent: Math.round((acc.spent + amount) * 100) / 100, movements: [{ date: SIM_TODAY, merchant: 'Comercio de pruebas', amount }, ...acc.movements] }
  return {
    ok: true,
    message: `Compra aprobada: ${fmt}`,
    state: withAccount(state, env.profile, next),
    event: ev('purchase', env, `Compra de prueba de ${fmt} (tarjeta ${acc.frozen ? 'congelada' : 'activa'} en la app) → APROBADA`, `${tech} → 200 {"approved":true}`, 'ok', bugs),
  }
}

function days(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)
}

export function exportCsv(state: CardsState, env: Env, from: string, to: string, build: CardBuild = {}): CardResult & { rows?: Movement[] } {
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const tech = `GET /api/v1/cards/me/movements.csv?from=${from}&to=${to}`
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to
  if (!valid || days(from, to) > EXPORT_MAX_DAYS) {
    const msg = !valid ? 'Rango de fechas no válido' : 'El rango máximo es de 24 meses'
    return { ok: false, message: msg, state, event: ev('export', env, `Exportar CSV ${from} → ${to}: ${msg}`, `${tech} → 422`, 'error', []) }
  }
  if (env.profile === 'empresa' && days(from, to) > 365 && has(CARD_BUGS.businessExport)) {
    return {
      ok: false,
      message: 'Error 500 · No se ha podido generar el archivo',
      state,
      event: ev('export', env, `Exportar CSV ${from} → ${to} (${days(from, to) + 1} días) → error 500, sin archivo`, `${tech} → 500 Internal Server Error (timeout 30 s)`, 'error', [CARD_BUGS.businessExport]),
    }
  }
  const inRange = acc.movements.filter((m) => m.date >= from && m.date <= to)
  const rows = has(CARD_BUGS.exportLastDay) ? inRange.filter((m) => m.date < to) : inRange
  const bugs = rows.length !== inRange.length ? [CARD_BUGS.exportLastDay] : []
  const dates = rows.map((r) => r.date)
  const span = dates.length ? `del ${dates[dates.length - 1]} al ${dates[0]}` : 'sin filas'
  return {
    ok: true,
    message: `CSV generado: ${rows.length} movimientos`,
    rows,
    state,
    event: ev('export', env, `Exportar CSV ${from} → ${to} → ${rows.length} movimientos (${span})`, `${tech} → 200 text/csv (${rows.length} filas)`, 'ok', bugs),
  }
}

/** Captura de pantalla del dispositivo (evidencia visual). */
export function screenshot(state: CardsState, env: Env, screen: Screen, build: CardBuild = {}): AppEvent {
  const acc = state.accounts[env.profile]
  if (screen === 'card') {
    const label = freezeLabel(env, acc.frozen, build)
    const bugs = label === 'Conjelar tarjeta' ? [CARD_BUGS.typo] : []
    return ev('screenshot', env, `Captura de «Tarjeta»: estado «${acc.frozen ? 'Congelada' : 'Activa'}», botón «${label}», límite ${formatEur(acc.limit)}`, 'screenshot card.png', 'ok', bugs)
  }
  return ev('screenshot', env, `Captura de «Movimientos»: ${acc.movements.length} movimientos, el último del ${acc.movements[0]?.date ?? '—'}`, 'screenshot movements.png', 'ok', [])
}
