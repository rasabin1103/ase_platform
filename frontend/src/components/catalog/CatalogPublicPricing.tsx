import type { PublicPricingPlan, PricingPlanType } from '../../types/catalog.types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

function formatPrice(price: string | number, currency: string, freeLabel: string, onRequest: string, planType: PricingPlanType) {
  if (planType === 'request_quote') return onRequest
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function intervalSuffix(plan: PublicPricingPlan, t: (k: string) => string) {
  if (plan.planType !== 'subscription') return ''
  if (plan.billingInterval === 'monthly') return ` / ${t('catalogPricing.interval.monthly').toLowerCase()}`
  if (plan.billingInterval === 'yearly') return ` / ${t('catalogPricing.interval.yearly').toLowerCase()}`
  if (plan.billingInterval === 'quarterly') return ` / ${t('catalogPricing.interval.quarterly').toLowerCase()}`
  return ''
}

type Props = {
  plans: PublicPricingPlan[]
  onCta?: (plan: PublicPricingPlan) => void
  disabled?: boolean
}

export function CatalogPublicPricing({ plans, onCta, disabled }: Props) {
  const { t } = useI18n()

  if (!plans.length) {
    return (
      <Card className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="text-lg font-medium text-ase-text">{t('catalogPricing.public.noPlans')}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/80">{t('catalogPricing.public.title')}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'flex flex-col rounded-2xl border p-6 transition',
              plan.isDefault
                ? 'border-cyan-300/35 bg-gradient-to-b from-cyan-400/10 to-ase-surface/80 shadow-[0_20px_60px_rgba(34,211,238,0.12)]'
                : 'border-white/10 bg-ase-surface/60',
            )}
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{t(`catalogPricing.planType.${plan.planType}`)}</Badge>
              {plan.isDefault ? <Badge variant="warning">{t('catalogPricing.badge.default')}</Badge> : null}
              {plan.billingInterval !== 'none' ? (
                <Badge variant="default">{t(`catalogPricing.interval.${plan.billingInterval}`)}</Badge>
              ) : null}
            </div>
            <h3 className="mt-4 text-xl font-bold text-ase-text">{plan.name}</h3>
            {plan.description ? <p className="mt-2 text-sm text-ase-text2">{plan.description}</p> : null}
            <p className="mt-4 text-3xl font-bold text-ase-text">
              {formatPrice(
                plan.price,
                plan.currency,
                t('catalog.free'),
                t('catalogPricing.public.priceOnRequest'),
                plan.planType,
              )}
              <span className="text-base font-normal text-ase-muted">{intervalSuffix(plan, t)}</span>
            </p>
            {plan.trialDays ? (
              <p className="text-xs text-cyan-300/90">
                {t('catalogPricing.badge.trial').replace('{days}', String(plan.trialDays))}
              </p>
            ) : null}
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ase-text2">
              {(plan.features ?? []).map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-cyan-300">✦</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-6 w-full"
              variant={plan.isDefault ? 'primary' : 'secondary'}
              disabled={disabled}
              onClick={() => onCta?.(plan)}
            >
              {t(`catalogPricing.public.cta.${plan.planType}`)}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
