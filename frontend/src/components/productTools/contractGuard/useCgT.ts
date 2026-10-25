import { useCallback } from 'react'
import { useI18n } from '../../../i18n'

/** Traducciones del visor: `tt('result.breaking')` → contractGuard.result.breaking.
 * Admite marcadores {{nombre}}. Si la clave no existe devuelve la propia clave. */
export function useCgT() {
  const { t, language } = useI18n()
  const tt = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = String(t(`contractGuard.${key}`))
      if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{{${k}}}`, String(v))
      return text
    },
    [t],
  )
  const has = useCallback((key: string) => String(t(`contractGuard.${key}`)) !== `contractGuard.${key}`, [t])
  return { tt, has, language, locale: language === 'es' ? 'es-ES' : 'en-GB' }
}
