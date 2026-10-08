import { usePlanFilledCopy } from '../../../hooks/usePlanNames'
import { useI18n } from '../../../i18n'
import { includedPageEn, includedPageEs } from '../../../i18n/includedPage.locale'

/** Copy tipado de «Qué incluye» según el idioma activo. */
export function useIncludedCopy() {
  const { language } = useI18n()
  return usePlanFilledCopy(language === 'en' ? includedPageEn : includedPageEs)
}
