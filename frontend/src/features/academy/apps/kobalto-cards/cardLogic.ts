import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'
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

const PROFILE_LABELS: Record<AcademyLang, Record<Profile, string>> = {
  es: PROFILE_LABEL,
  en: { personal: 'Personal', joven: 'Youth', empresa: 'Business' },
}
const HOLDERS: Record<AcademyLang, Record<Profile, string>> = {
  es: HOLDER,
  en: { personal: 'Lucía Gómez', joven: 'Álex Martín (age 21)', empresa: 'Talleres Ruiz, S. L.' },
}

/** Nombres de los tipos de cuenta en el idioma de la misión. */
export function profileLabelFor(lang: AcademyLang = 'es'): Record<Profile, string> {
  return PROFILE_LABELS[lang]
}

/** Titulares de las cuentas de prueba en el idioma de la misión. */
export function holderFor(lang: AcademyLang = 'es'): Record<Profile, string> {
  return HOLDERS[lang]
}

/**
 * Bug C4 (errata en el botón de congelar). Aparece solo con la app en el
 * idioma de la misión: «Conjelar tarjeta» en las misiones en español y
 * «Freese card» en las misiones en inglés. El otro idioma sale bien escrito.
 */
export const TYPO_LABEL: Record<AcademyLang, string> = { es: 'Conjelar tarjeta', en: 'Freese card' }

/** Textos de la consola y de los eventos (en el idioma de la misión). */
const MESSAGES = {
  es: {
    account: 'cuenta',
    freezeSummary: (n: number) => `Congelar tarjeta → la app muestra «Tarjeta congelada» (congelación nº ${n})`,
    unfreezeSummary: 'Descongelar tarjeta → la app muestra «Tarjeta activa»',
    limitInvalid: (min: string, max: string) => `Límite no válido: de ${min} a ${max}, en euros enteros`,
    limitSummaryError: (raw: string, msg: string) => `Límite mensual «${raw}» → ${msg}`,
    limitSaved: (v: string) => `Límite mensual: ${v}`,
    limitSummaryOk: (raw: string, v: string) => `Límite mensual «${raw}» → guardado ${v}`,
    invalidAmount: 'Importe no válido',
    purchaseInvalidSummary: (raw: string) => `Compra de prueba «${raw}» → importe no válido`,
    deniedFrozen: 'denegada: tarjeta congelada',
    deniedLimit: 'denegada: límite mensual superado',
    purchaseDenied: (reason: string) => `Compra ${reason}`,
    cardState: (frozen: boolean) => (frozen ? 'congelada' : 'activa'),
    purchaseSummary: (amount: string, cardState: string, outcome: string) => `Compra de prueba de ${amount} (tarjeta ${cardState} en la app) → ${outcome}`,
    approvedUpper: 'APROBADA',
    purchaseOk: (amount: string) => `Compra aprobada: ${amount}`,
    testMerchant: 'Comercio de pruebas',
    invalidRange: 'Rango de fechas no válido',
    maxRange: 'El rango máximo es de 24 meses',
    exportSummaryError: (from: string, to: string, msg: string) => `Exportar CSV ${from} → ${to}: ${msg}`,
    export500: 'Error 500 · No se ha podido generar el archivo',
    export500Summary: (from: string, to: string, days: number) => `Exportar CSV ${from} → ${to} (${days} días) → error 500, sin archivo`,
    span: (first: string, last: string) => `del ${first} al ${last}`,
    noRows: 'sin filas',
    csvOk: (n: number) => `CSV generado: ${n} movimientos`,
    exportSummaryOk: (from: string, to: string, n: number, span: string) => `Exportar CSV ${from} → ${to} → ${n} movimientos (${span})`,
    shotCard: (state: string, label: string, limit: string) => `Captura de «Tarjeta»: estado «${state}», botón «${label}», límite ${limit}`,
    frozenCap: (frozen: boolean) => (frozen ? 'Congelada' : 'Activa'),
    shotMovements: (n: number, last: string) => `Captura de «Movimientos»: ${n} movimientos, el último del ${last}`,
  },
  en: {
    account: 'account',
    freezeSummary: (n: number) => `Freeze card → the app shows “Card frozen” (freeze #${n})`,
    unfreezeSummary: 'Unfreeze card → the app shows “Card active”',
    limitInvalid: (min: string, max: string) => `Invalid limit: ${min} to ${max}, in whole euros`,
    limitSummaryError: (raw: string, msg: string) => `Monthly limit “${raw}” → ${msg}`,
    limitSaved: (v: string) => `Monthly limit: ${v}`,
    limitSummaryOk: (raw: string, v: string) => `Monthly limit “${raw}” → saved ${v}`,
    invalidAmount: 'Invalid amount',
    purchaseInvalidSummary: (raw: string) => `Test purchase “${raw}” → invalid amount`,
    deniedFrozen: 'declined: card frozen',
    deniedLimit: 'declined: monthly limit exceeded',
    purchaseDenied: (reason: string) => `Purchase ${reason}`,
    cardState: (frozen: boolean) => (frozen ? 'frozen' : 'active'),
    purchaseSummary: (amount: string, cardState: string, outcome: string) => `Test purchase of ${amount} (card ${cardState} in the app) → ${outcome}`,
    approvedUpper: 'APPROVED',
    purchaseOk: (amount: string) => `Purchase approved: ${amount}`,
    testMerchant: 'Test merchant',
    invalidRange: 'Invalid date range',
    maxRange: 'The maximum range is 24 months',
    exportSummaryError: (from: string, to: string, msg: string) => `Export CSV ${from} → ${to}: ${msg}`,
    export500: 'Error 500 · The file could not be generated',
    export500Summary: (from: string, to: string, days: number) => `Export CSV ${from} → ${to} (${days} days) → error 500, no file`,
    span: (first: string, last: string) => `from ${first} to ${last}`,
    noRows: 'no rows',
    csvOk: (n: number) => `CSV generated: ${n} transactions`,
    exportSummaryOk: (from: string, to: string, n: number, span: string) => `Export CSV ${from} → ${to} → ${n} transactions (${span})`,
    shotCard: (state: string, label: string, limit: string) => `Screenshot of “Card”: status “${state}”, button “${label}”, limit ${limit}`,
    frozenCap: (frozen: boolean) => (frozen ? 'Frozen' : 'Active'),
    shotMovements: (n: number, last: string) => `Screenshot of “Transactions”: ${n} transactions, latest on ${last}`,
  },
}

/** Mensajes de la app de tarjetas en el idioma de la misión. */
export function cardMessages(lang: AcademyLang = 'es') {
  return MESSAGES[lang]
}

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

const envTag = (env: Env, lang: AcademyLang = 'es') =>
  `${DEVICE_LABEL[env.device]} · ${env.lang} · ${MESSAGES[lang].account} ${PROFILE_LABELS[lang][env.profile]}`

/** ¿Se ve la errata C4? Solo con la app en el idioma de la misión y la tarjeta sin congelar. */
function typoShown(env: Env, frozen: boolean, build: CardBuild, lang: AcademyLang): boolean {
  return !frozen && env.lang === lang && liveBugs(build)(CARD_BUGS.typo)
}

/**
 * Texto del botón de congelar (en el idioma de la app del dispositivo).
 * `lang` es el idioma de la misión: decide en qué idioma está la errata C4.
 */
export function freezeLabel(env: Env, frozen: boolean, build: CardBuild, lang: AcademyLang = 'es'): string {
  if (typoShown(env, frozen, build, lang)) return TYPO_LABEL[lang]
  if (env.lang === 'en') return frozen ? 'Unfreeze card' : 'Freeze card'
  return frozen ? 'Descongelar tarjeta' : 'Congelar tarjeta'
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

function ev(action: string, env: Env, summary: string, technical: string, status: 'ok' | 'error', bugs: string[], lang: AcademyLang = 'es'): AppEvent {
  return { app: 'kobalto-cards', action, summary: `[${envTag(env, lang)}] ${summary}`, technical, status, bugs }
}

/** Congelar o descongelar la tarjeta. */
export function toggleFreeze(state: CardsState, env: Env, build: CardBuild = {}, lang: AcademyLang = 'es'): CardResult {
  const M = MESSAGES[lang]
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
      event: ev('freeze', env, M.freezeSummary(next.freezes), `PATCH /api/v1/cards/me ${body} → 200`, 'ok', [], lang),
    }
  }
  next.frozen = false
  const stuck = env.device === 'android' && has(CARD_BUGS.androidUnfreeze)
  next.frozenServer = stuck ? acc.frozenServer : false
  return {
    ok: true,
    message: env.lang === 'en' ? 'Card active' : 'Tarjeta activa',
    state: withAccount(state, env.profile, next),
    event: ev('unfreeze', env, M.unfreezeSummary, `PATCH /api/v1/cards/me {"status":"active"} → 200`, 'ok', [], lang),
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

export function setLimit(state: CardsState, env: Env, raw: string, build: CardBuild = {}, lang: AcademyLang = 'es'): CardResult {
  const M = MESSAGES[lang]
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
    const msg = M.limitInvalid(formatEur(range.min, lang), formatEur(range.max, lang))
    return { ok: false, message: msg, state, event: ev('limit', env, M.limitSummaryError(raw.trim(), msg), `${tech} → 422`, 'error', bugs, lang) }
  }
  const next = { ...acc, limit: actualValue, specLimit: specOk ? specValue : acc.specLimit }
  return {
    ok: true,
    message: M.limitSaved(formatEur(actualValue, lang)),
    state: withAccount(state, env.profile, next),
    event: ev('limit', env, M.limitSummaryOk(raw.trim(), formatEur(actualValue, lang)), `${tech} → 200 {"limit":${actualValue}}`, 'ok', bugs, lang),
  }
}

/** Compra simulada en un comercio de pruebas (staging). */
export function purchase(state: CardsState, env: Env, raw: string, build: CardBuild = {}, lang: AcademyLang = 'es'): CardResult {
  const M = MESSAGES[lang]
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const amount = Number(raw.trim().replace(',', '.'))
  const tech = `POST /test-acquirer/purchases {"amount":"${raw.trim()}"}`
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: M.invalidAmount, state, event: ev('purchase', env, M.purchaseInvalidSummary(raw), `${tech} → 422`, 'error', [], lang) }
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
  const fmt = formatEur(amount, lang)
  if (actual !== 'ok') {
    const reason = actual === 'frozen' ? M.deniedFrozen : M.deniedLimit
    return {
      ok: false,
      message: M.purchaseDenied(reason),
      state,
      event: ev('purchase', env, M.purchaseSummary(fmt, M.cardState(acc.frozen), reason), `${tech} → 402 {"reason":"${actual}"}`, 'error', bugs, lang),
    }
  }
  const next = { ...acc, spent: Math.round((acc.spent + amount) * 100) / 100, movements: [{ date: SIM_TODAY, merchant: M.testMerchant, amount }, ...acc.movements] }
  return {
    ok: true,
    message: M.purchaseOk(fmt),
    state: withAccount(state, env.profile, next),
    event: ev('purchase', env, M.purchaseSummary(fmt, M.cardState(acc.frozen), M.approvedUpper), `${tech} → 200 {"approved":true}`, 'ok', bugs, lang),
  }
}

function days(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)
}

export function exportCsv(
  state: CardsState,
  env: Env,
  from: string,
  to: string,
  build: CardBuild = {},
  lang: AcademyLang = 'es',
): CardResult & { rows?: Movement[] } {
  const M = MESSAGES[lang]
  const has = liveBugs(build)
  const acc = state.accounts[env.profile]
  const tech = `GET /api/v1/cards/me/movements.csv?from=${from}&to=${to}`
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to
  if (!valid || days(from, to) > EXPORT_MAX_DAYS) {
    const msg = !valid ? M.invalidRange : M.maxRange
    return { ok: false, message: msg, state, event: ev('export', env, M.exportSummaryError(from, to, msg), `${tech} → 422`, 'error', [], lang) }
  }
  if (env.profile === 'empresa' && days(from, to) > 365 && has(CARD_BUGS.businessExport)) {
    return {
      ok: false,
      message: M.export500,
      state,
      event: ev('export', env, M.export500Summary(from, to, days(from, to) + 1), `${tech} → 500 Internal Server Error (timeout 30 s)`, 'error', [CARD_BUGS.businessExport], lang),
    }
  }
  const inRange = acc.movements.filter((m) => m.date >= from && m.date <= to)
  const rows = has(CARD_BUGS.exportLastDay) ? inRange.filter((m) => m.date < to) : inRange
  const bugs = rows.length !== inRange.length ? [CARD_BUGS.exportLastDay] : []
  const dates = rows.map((r) => r.date)
  const span = dates.length ? M.span(dates[dates.length - 1], dates[0]) : M.noRows
  return {
    ok: true,
    message: M.csvOk(rows.length),
    rows,
    state,
    event: ev('export', env, M.exportSummaryOk(from, to, rows.length, span), `${tech} → 200 text/csv (${rows.length} filas)`, 'ok', bugs, lang),
  }
}

/** Captura de pantalla del dispositivo (evidencia visual). */
export function screenshot(state: CardsState, env: Env, screen: Screen, build: CardBuild = {}, lang: AcademyLang = 'es'): AppEvent {
  const M = MESSAGES[lang]
  const acc = state.accounts[env.profile]
  if (screen === 'card') {
    const label = freezeLabel(env, acc.frozen, build, lang)
    const bugs = typoShown(env, acc.frozen, build, lang) ? [CARD_BUGS.typo] : []
    return ev('screenshot', env, M.shotCard(M.frozenCap(acc.frozen), label, formatEur(acc.limit, lang)), 'screenshot card.png', 'ok', bugs, lang)
  }
  return ev('screenshot', env, M.shotMovements(acc.movements.length, acc.movements[0]?.date ?? '—'), 'screenshot movements.png', 'ok', [], lang)
}
