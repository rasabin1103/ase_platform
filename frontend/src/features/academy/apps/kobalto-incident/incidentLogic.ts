import type { AppEvent } from '../../engine/types'

/**
 * App de la misión 7: consola de observabilidad durante un incidente en
 * producción. El jugador desglosa la tasa de errores por dimensiones hasta
 * aislar la causa, mitiga (flag o rollback), la reproduce en staging y
 * participa en el postmortem.
 */

export type Dim = 'endpoint' | 'os' | 'version' | 'amount' | 'account'
export type Filters = Partial<Record<Dim, string>>

export const DIM_LABEL: Record<Dim, string> = {
  endpoint: 'Operación',
  os: 'Sistema',
  version: 'Versión de la app',
  amount: 'Importe',
  account: 'Antigüedad de la cuenta',
}

export const VALUES: Record<Dim, { id: string; label: string; weight: number }[]> = {
  endpoint: [
    { id: 'instant', label: 'Transferencia instantánea', weight: 0.25 },
    { id: 'ordinary', label: 'Transferencia ordinaria', weight: 0.2 },
    { id: 'split', label: 'Dividir un gasto', weight: 0.1 },
    { id: 'cards', label: 'Tarjetas', weight: 0.25 },
    { id: 'login', label: 'Acceso', weight: 0.2 },
  ],
  os: [
    { id: 'android', label: 'Android', weight: 0.5 },
    { id: 'ios', label: 'iOS', weight: 0.4 },
    { id: 'web', label: 'Web', weight: 0.1 },
  ],
  version: [
    { id: '5.1.0', label: '5.1.0', weight: 0.65 },
    { id: '5.0.3', label: '5.0.3', weight: 0.35 },
  ],
  amount: [
    { id: 'low', label: 'Hasta 1.000 €', weight: 0.85 },
    { id: 'high', label: 'Más de 1.000 €', weight: 0.15 },
  ],
  account: [
    { id: 'new', label: 'Abierta desde 2024', weight: 0.6 },
    { id: 'old', label: 'Abierta antes de 2024', weight: 0.4 },
  ],
}

export const INCIDENT_BUGS = { androidHighAmount: 'I1', legacyAccounts: 'I1b' } as const
export const INCIDENT_BUG_SLOTS: { slot: string; options: string[] }[] = [{ slot: 'cause', options: ['I1', 'I1b'] }]

const CAUSE: Record<string, (c: Record<Dim, string>) => boolean> = {
  I1: (c) => c.endpoint === 'instant' && c.os === 'android' && c.version === '5.1.0' && c.amount === 'high',
  I1b: (c) => c.endpoint === 'instant' && c.account === 'old' && c.os !== 'web',
}

const ERROR_TEXT: Record<string, string> = {
  I1: 'HTTP 500 · NumberFormatException: For input string "1.250,00" (la app Android 5.1 envía el importe con formato local)',
  I1b: 'HTTP 500 · NullPointerException en InstantFeeEngine: el campo iban_country es nulo en cuentas antiguas',
}

/** Peticiones por hora en producción (para que los números parezcan reales). */
const TOTAL = 120000
const BASE_ERROR = 0.003

export interface Row {
  id: string
  label: string
  requests: number
  errors: number
  rate: number
}

export interface IncidentState {
  lastQuery?: { by: Dim; filters: Filters; rows: Row[] }
  /** Flags de funcionalidad desactivados. */
  flagsOff: string[]
  rolledBack: boolean
  mitigatedAt?: number
  reproductions: number
}
export const INITIAL_INCIDENT: IncidentState = { flagsOff: [], rolledBack: false, reproductions: 0 }

export const FEATURE_FLAGS: { id: string; label: string; endpoint: string }[] = [
  { id: 'instant_fees_v2', label: 'instant_fees_v2 · motor nuevo de instantáneas', endpoint: 'instant' },
  { id: 'split_payments', label: 'split_payments · Dividir un gasto', endpoint: 'split' },
  { id: 'new_onboarding', label: 'new_onboarding · textos del onboarding', endpoint: 'none' },
]

/** Clientes afectados por minuto mientras el incidente no está mitigado. */
export const AFFECTED_PER_MIN: Record<string, number> = { I1: 6, I1b: 14 }

function isMitigated(state: IncidentState): boolean {
  return state.rolledBack || state.flagsOff.includes('instant_fees_v2')
}

function combos(): { c: Record<Dim, string>; w: number }[] {
  const out: { c: Record<Dim, string>; w: number }[] = []
  for (const e of VALUES.endpoint)
    for (const o of VALUES.os)
      for (const v of VALUES.version)
        for (const a of VALUES.amount)
          for (const ac of VALUES.account)
            out.push({ c: { endpoint: e.id, os: o.id, version: v.id, amount: a.id, account: ac.id }, w: e.weight * o.weight * v.weight * a.weight * ac.weight })
  return out
}

export function breakdown(by: Dim, filters: Filters, cause: string, mitigated: boolean): Row[] {
  const all = combos().filter(({ c }) => (Object.keys(filters) as Dim[]).every((d) => c[d] === filters[d]))
  return VALUES[by].map((v) => {
    const part = all.filter(({ c }) => c[by] === v.id)
    let requests = 0
    let errors = 0
    for (const { c, w } of part) {
      const n = TOTAL * w
      requests += n
      errors += n * (!mitigated && CAUSE[cause]?.(c) ? 0.97 : BASE_ERROR)
    }
    const r = Math.round(requests)
    const e = Math.round(errors)
    return { id: v.id, label: v.label, requests: r, errors: e, rate: r ? Math.round((e / r) * 1000) / 10 : 0 }
  })
}

export function globalRate(cause: string, mitigated: boolean): number {
  const rows = breakdown('endpoint', {}, cause, mitigated)
  const req = rows.reduce((n, r) => n + r.requests, 0)
  const err = rows.reduce((n, r) => n + r.errors, 0)
  return Math.round((err / req) * 1000) / 10
}

function causeOf(active: string[], fixed: string[]): string {
  return INCIDENT_BUG_SLOTS[0].options.find((b) => active.includes(b) && !fixed.includes(b)) ?? 'none'
}

const pct = (n: number) => `${n.toString().replace('.', ',')} %`
const filtersText = (f: Filters) =>
  (Object.keys(f) as Dim[]).map((d) => `${DIM_LABEL[d]} = ${VALUES[d].find((v) => v.id === f[d])?.label}`).join(', ') || 'sin filtros'

export function query(state: IncidentState, by: Dim, filters: Filters, active: string[], fixed: string[] = []): { state: IncidentState; event: AppEvent } {
  const rows = breakdown(by, filters, causeOf(active, fixed), isMitigated(state))
  return {
    state: { ...state, lastQuery: { by, filters, rows } },
    event: {
      app: 'kobalto-incident',
      action: 'query',
      summary: `Errores por ${DIM_LABEL[by].toLowerCase()} (${filtersText(filters)}): ${rows.map((r) => `${r.label} ${pct(r.rate)}`).join(' · ')}`,
      technical: `observability.query errors_by(${by}) where ${JSON.stringify(filters)}`,
      status: 'ok',
      bugs: [],
      cost: 3,
    },
  }
}

export function disableFlag(state: IncidentState, flagId: string, clock: number, active: string[], fixed: string[] = []): { state: IncidentState; event: AppEvent } {
  const already = isMitigated(state)
  const next: IncidentState = { ...state, flagsOff: state.flagsOff.includes(flagId) ? state.flagsOff : [...state.flagsOff, flagId] }
  const nowMitigated = isMitigated(next) && causeOf(active, fixed) !== 'none'
  if (nowMitigated && !already) next.mitigatedAt = clock + 5
  const flags = [`flag.off.${flagId}`]
  if (flagId === 'instant_fees_v2') flags.push('mitigated', 'mitigated.flag')
  else flags.push('flag.wrong')
  if (nowMitigated && !already && clock + 5 <= 60) flags.push('mitigated.fast')
  const rate = globalRate(causeOf(active, fixed), isMitigated(next))
  return {
    state: next,
    event: {
      app: 'kobalto-incident',
      action: 'flag_off',
      summary: `Flag ${flagId} desactivado en producción → tasa de error global ${pct(rate)}${flagId === 'instant_fees_v2' ? ' (las instantáneas vuelven al motor anterior)' : ' (sin cambios)'}`,
      technical: `flags.set(${flagId}, false) · error_rate=${rate}%`,
      status: 'ok',
      bugs: [],
      cost: 5,
      flags,
    },
  }
}

export function rollback(state: IncidentState, clock: number): { state: IncidentState; event: AppEvent } {
  const already = isMitigated(state)
  const next: IncidentState = { ...state, rolledBack: true }
  if (!already) next.mitigatedAt = clock + 40
  const flags = ['mitigated', 'mitigated.rollback']
  if (!already && clock + 40 <= 60) flags.push('mitigated.fast')
  return {
    state: next,
    event: {
      app: 'kobalto-incident',
      action: 'rollback',
      summary: 'Rollback del backend a 5.0.3 → tasa de error 0,3 %; se pierden también el TIN nuevo, el fix de tarjetas y el motor de instantáneas',
      technical: 'deploy.rollback(payments-api, 5.0.3) · 40 min',
      status: 'ok',
      bugs: [],
      cost: 40,
      flags,
    },
  }
}

export interface ReproInput {
  endpoint: string
  os: string
  version: string
  amount: string
  account: string
}

/** Reproduce una combinación en staging (donde el flag sigue activo). */
export function reproduce(state: IncidentState, input: ReproInput, active: string[], fixed: string[] = []): { state: IncidentState; event: AppEvent } {
  const cause = causeOf(active, fixed)
  const c = input as unknown as Record<Dim, string>
  const fails = cause !== 'none' && CAUSE[cause](c)
  const desc = (Object.keys(DIM_LABEL) as Dim[]).map((d) => VALUES[d].find((v) => v.id === c[d])?.label).join(' · ')
  return {
    state: { ...state, reproductions: state.reproductions + 1 },
    event: {
      app: 'kobalto-incident',
      action: 'reproduce',
      summary: fails ? `Staging (flag activo): ${desc} → FALLA: ${ERROR_TEXT[cause]}` : `Staging (flag activo): ${desc} → OK`,
      technical: `staging.replay ${JSON.stringify(input)} → ${fails ? '500' : '200'}`,
      status: fails ? 'error' : 'ok',
      bugs: fails ? [cause] : [],
      cost: 5,
    },
  }
}

export function affected(state: IncidentState, clock: number, active: string[]): number {
  const cause = causeOf(active, [])
  const until = state.mitigatedAt ?? clock
  return Math.max(0, Math.round(until * (AFFECTED_PER_MIN[cause] ?? 0)))
}
