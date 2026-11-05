import { useCallback } from 'react'
import { useI18n } from '../../i18n'

/** Traducciones: `ft('tabs.invoices')` → freelance.tabs.invoices. Admite {{marcadores}}. */
export function useFt() {
  const { t, language } = useI18n()
  const ft = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = String(t(`freelance.${key}`))
      if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{{${k}}}`, String(v))
      return text
    },
    [t],
  )
  const locale = language === 'es' ? 'es-ES' : 'en-GB'
  const eur = useCallback(
    (cents: number | null | undefined) =>
      cents == null ? '—' : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100),
    [locale],
  )
  return { ft, eur, locale }
}

/** Mensaje del error de la API: usa el `code` traducido si existe. */
export function useFlError() {
  const { ft } = useFt()
  return (error: unknown): string => {
    const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    if (detail && typeof detail === 'object') {
      const d = detail as { code?: string; message?: string }
      if (d.code) {
        const key = `errors.${d.code}`
        const text = ft(key)
        if (text !== `freelance.${key}`) return text
      }
      if (d.message) return d.message
    }
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    return ft('common.error')
  }
}

export const todayIso = () => new Date().toISOString().slice(0, 10)
export const num = (v: string) => (v.trim() === '' ? 0 : Number(v.replace(',', '.')))
