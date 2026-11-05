import { useI18n } from '../../../i18n'
import { consultingPageEn, consultingPageEs, type ConsultingCopy } from '../../../i18n/consultingPage.locale'

/** Copy tipado de «Servicios» según el idioma activo. */
export function useConsultingCopy(): ConsultingCopy {
  const { language } = useI18n()
  return language === 'en' ? consultingPageEn : consultingPageEs
}
