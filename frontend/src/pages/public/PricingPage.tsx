import { PricingSection } from '../../components/public/PricingSection'
import { PurchaseVsSubscriptionFaq } from '../../components/public/PurchaseVsSubscriptionFaq'
import { SubscriptionPolicyFaq } from '../../components/public/SubscriptionPolicyFaq'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'

export function PricingPage() {
  const { t } = useI18n()
  usePageTitle(t('pricing.title') as string, t('pricing.subtitle') as string)
  return (
    <div>
      <PricingSection />
      <section className="border-t border-white/5">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <PurchaseVsSubscriptionFaq />
          <SubscriptionPolicyFaq />
        </div>
      </section>
    </div>
  )
}

