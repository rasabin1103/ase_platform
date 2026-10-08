import { usePlanFilledCopy } from '../../../hooks/usePlanNames'
import { useI18n } from '../../../i18n'
import { homePageEn, homePageEs } from '../../../i18n/homePage.locale'

/** Copy tipado de la home según el idioma activo (evita `t()` con objetos anidados). */
export function useHomeCopy() {
  const { language } = useI18n()
  return usePlanFilledCopy(language === 'en' ? homePageEn : homePageEs)
}
