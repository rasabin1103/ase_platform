import { PricingSection } from '../../components/public/PricingSection'
import { PurchaseVsSubscriptionFaq } from '../../components/public/PurchaseVsSubscriptionFaq'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'

export function PricingPage() {
  const { t } = useI18n()
  usePageTitle(t('pricing.title') as string, t('pricing.subtitle') as string)
  return (
    <div>
      <PricingSection />
      <PurchaseVsSubscriptionFaq />
    </div>
  )
}

