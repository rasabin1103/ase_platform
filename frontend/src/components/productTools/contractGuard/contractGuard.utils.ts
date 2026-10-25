import { isAxiosError } from 'axios'
import type { CgFinding, CgOverallResult, CgSeverity } from '../../../api/contractGuard.api'

/** De más a menos grave: es el orden en que se muestran y se cuentan. */
export const SEVERITY_ORDER: CgSeverity[] = ['breaking', 'potentially_breaking', 'non_breaking', 'informational']

type Tone = 'error' | 'warning' | 'success' | 'info'

export const SEVERITY_TONE: Record<CgSeverity, Tone> = {
  breaking: 'error',
  potentially_breaking: 'warning',
  non_breaking: 'success',
  informational: 'info',
}

export const OVERALL_TONE: Record<CgOverallResult, Tone> = {
  breaking: 'error',
  review_required: 'warning',
  compatible: 'success',
}

/** Clases de borde/fondo/texto por tono, compartidas por tarjetas y chips. */
export const TONE_CLASSES: Record<Tone, string> = {
  error: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  warning: 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  success: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  info: 'border-sky-400/35 bg-sky-500/10 text-sky-200',
}

const SEVERITY_RANK = new Map(SEVERITY_ORDER.map((s, i) => [s, i]))

/** Orden estable: gravedad, luego ubicación y regla. Una severidad nueva
 * que el servicio añada en el futuro va al final, sin romper la lista. */
export function sortFindings(findings: CgFinding[]): CgFinding[] {
  const rank = (s: string) => SEVERITY_RANK.get(s as CgSeverity) ?? SEVERITY_ORDER.length
  return [...findings].sort(
    (a, b) =>
      rank(a.severity) - rank(b.severity) ||
      a.location.localeCompare(b.location) ||
      a.rule_id.localeCompare(b.rule_id) ||
      a.id.localeCompare(b.id),
  )
}

export type FindingFilter = { severities: ReadonlySet<string>; category: string | null; query: string }

export function filterFindings(findings: CgFinding[], filter: FindingFilter): CgFinding[] {
  const q = filter.query.trim().toLowerCase()
  return findings.filter((f) => {
    if (filter.severities.size > 0 && !filter.severities.has(f.severity)) return false
    if (filter.category && f.category !== filter.category) return false
    if (!q) return true
    return [f.location, f.description, f.rule_id, f.recommendation].some((v) => v.toLowerCase().includes(q))
  })
}

export function countByCategory(findings: CgFinding[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const f of findings) counts.set(f.category, (counts.get(f.category) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

/** Valor anterior/posterior de un hallazgo como texto legible y acotado. */
export function formatValue(value: unknown, max = 600): string {
  if (value === null || value === undefined) return '—'
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return text.length > max ? `${text.slice(0, max)}…` : text
}

/** El servicio genera las fechas en UTC y SQLite puede devolverlas sin zona:
 * se tratan como UTC cuando falta el sufijo. */
export function parseUtcDate(iso: string): Date {
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(iso)
  return new Date(hasZone ? iso : `${iso}Z`)
}

export function formatDateTime(iso: string, locale: string): string {
  const d = parseUtcDate(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

export type JsonParse = { ok: true; value: unknown } | { ok: false; error: string }

/** Parsea el JSON que escribe el usuario. Vacío no es JSON válido: `null`
 * hay que escribirlo, para que no se confunda con «no he pegado nada». */
export function parseJsonInput(text: string): JsonParse {
  if (!text.trim()) return { ok: false, error: 'empty' }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'invalid' }
  }
}

/** Métodos y códigos cuyo cuerpo está prohibido: el visor propone «sin cuerpo». */
export function statusForbidsBody(method: string, status: number): boolean {
  return method.toUpperCase() === 'HEAD' || (status >= 100 && status < 200) || [204, 205, 304].includes(status)
}

export type CgErrorInfo = {
  status: number | null
  code: string | null
  message: string
  details: { location: string; message: string }[]
}

/** Errores de la pasarela: {detail: {code, message, details?}}. Un 5xx sin
 * ese formato (proxy, caída) cae al mensaje genérico recibido. */
export function cgErrorInfo(error: unknown, fallback: string): CgErrorInfo {
  if (!isAxiosError(error)) return { status: null, code: null, message: fallback, details: [] }
  const status = error.response?.status ?? null
  const detail = error.response?.data?.detail
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const rawDetails: unknown[] = Array.isArray(detail.details) ? detail.details : []
    return {
      status,
      code: typeof detail.code === 'string' ? detail.code : null,
      message: typeof detail.message === 'string' && detail.message ? detail.message : fallback,
      details: rawDetails.map((d) => {
        const item = d as { location?: unknown; message?: unknown }
        return {
          location: Array.isArray(item.location) ? item.location.filter((p) => p !== 'body').join('.') : '',
          message: typeof item.message === 'string' ? item.message : '',
        }
      }),
    }
  }
  if (typeof detail === 'string' && detail.trim()) return { status, code: null, message: detail, details: [] }
  return { status, code: null, message: fallback, details: [] }
}
