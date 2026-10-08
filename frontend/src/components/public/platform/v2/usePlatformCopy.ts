import { usePlanFilledCopy } from '../../../../hooks/usePlanNames'
import { useI18n } from '../../../../i18n'
import { platformV2En, platformV2Es } from '../../../../i18n/platformV2.locale'

/** Copy tipado de «Plataforma» según el idioma activo. */
export function usePlatformCopy() {
  const { language } = useI18n()
  return usePlanFilledCopy(language === 'en' ? platformV2En : platformV2Es)
}
