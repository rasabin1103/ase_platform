import type { PublicCatalogPricingPlan, PublicPricingPlan } from '../../types/catalog.types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import {
  formatPrice,
  isEnterprisePlan,
  orderPlansForDisplay,
  planDisplayPrice,
} from '../../lib/formatPrice'
import {
  parsePlanFeatureSections,
  shouldShowCatalogLabel,
  type PlanFeatureSection,
} from '../../lib/planContent'
import type { PublicBillingFilter } from './catalogPricingFilters'

type Plan = PublicCatalogPricingPlan | PublicPricingPlan

type Props = {
  plans: Plan[]
  billing: PublicBillingFilter
  onCta?: (plan: Plan) => void
  showCatalogItem?: boolean
  disabled?: boolean
}

function isCatalogPlan(plan: Plan): plan is PublicCatalogPricingPlan {
  return 'catalogItemTitle' in plan
}

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 ring-1 ring-cyan-400/25">
      <svg className="h-3 w-3 text-cyan-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.414L8.5 11.586l6.543-6.543a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}

function PlanFeatures({ tagline, sections }: { tagline?: string; sections: PlanFeatureSection[] }) {
  if (sections.length === 0 && !tagline) return null

  return (
    <div className="mt-6 flex-1 space-y-5">
      {tagline ? <p className="text-sm leading-relaxed text-ase-text2/90">{tagline}</p> : null}
      {sections.map((section, idx) => (
        <div key={section.title ?? `section-${idx}`} className="space-y-3">
          {section.title ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/60">
              {section.title}
            </p>
          ) : null}
          <ul
            className={cn(
              'space-y-2.5',
              section.title?.toLowerCase().includes('limitacion') ? 'opacity-80' : '',
            )}
          >
            {section.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-snug text-ase-text2">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function PremiumPricingGrid({ plans, billing, onCta, showCatalogItem, disabled }: Props) {
  const { t } = useI18n()
  const ordered = orderPlansForDisplay(plans)

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 xl:items-stretch xl:gap-8">
      {ordered.map((plan) => {
        const enterprise = isEnterprisePlan(plan)
        const popular = plan.isPopular
        const planName = plan.displayName || plan.name
        const pricing = planDisplayPrice(plan, billing)
        const priceLabel =
          plan.planType === 'request_quote'
            ? t('pricing.customPrice')
            : plan.planType === 'free' && Number(plan.price) === 0
              ? t('catalog.free')
              : pricing.amount
        const subscriptionPeriod =
          pricing.periodLabel === 'year' ? t('pricing.perYear') : t('pricing.perMonth')
        const monthlyEquiv =
          billing === 'yearly' && plan.monthlyPrice != null
            ? formatPrice(plan.monthlyPrice, plan.currency)
            : null
        const { tagline, sections } = parsePlanFeatureSections(plan.features, plan.description)
        const showDescriptionSeparately =
          Boolean(plan.description?.trim()) && sections.length === 0 && !tagline

        return (
          <article
            key={plan.id}
            className={cn(
              'group relative flex flex-col rounded-3xl border p-6 sm:p-8 transition-all duration-300',
              'bg-gradient-to-b from-white/[0.06] to-ase-surface/40 backdrop-blur-md',
              popular
                ? 'border-cyan-400/40 shadow-[0_0_40px_rgba(56,189,248,0.15)] xl:scale-[1.03] xl:z-10'
                : 'border-white/10 hover:border-violet-400/25 hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)] hover:-translate-y-1',
            )}
          >
            {popular ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="warning" className="shadow-lg">
                  {t('pricing.mostPopular')}
                </Badge>
              </div>
            ) : null}

            {showCatalogItem &&
            isCatalogPlan(plan) &&
            shouldShowCatalogLabel(plan.catalogItemTitle, planName) ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/60">
                {plan.catalogItemTitle}
              </p>
            ) : null}

            <h3 className="mt-2 text-xl font-bold tracking-tight text-ase-text sm:text-2xl">{planName}</h3>

            {showDescriptionSeparately ? (
              <p className="mt-2 text-sm leading-relaxed text-ase-text2/90">{plan.description}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
              <span className="text-4xl font-extrabold tracking-tight text-ase-text tabular-nums">
                {priceLabel}
              </span>
              {plan.planType !== 'request_quote' ? (
                <span className="text-sm font-medium text-ase-muted">{subscriptionPeriod}</span>
              ) : null}
            </div>

            {billing === 'yearly' && pricing.savings ? (
              <p className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="info">{t('pricing.saveTen')}</Badge>
                <span className="text-xs text-emerald-300">
                  {t('pricing.saveAmount').replace('{amount}', pricing.savings)}
                </span>
              </p>
            ) : null}

            {billing === 'yearly' && monthlyEquiv ? (
              <p className="mt-1 text-xs text-ase-muted">
                {t('pricing.monthlyEquivalent').replace('{price}', monthlyEquiv)}
              </p>
            ) : null}

            {plan.trialDays ? (
              <p className="mt-3 text-xs font-medium text-cyan-300/90">
                {t('pricing.trialDays').replace('{days}', String(plan.trialDays))}
              </p>
            ) : null}

            <PlanFeatures tagline={tagline} sections={sections} />

            {enterprise ? (
              <ul className="mt-5 space-y-2.5 border-t border-white/5 pt-5">
                {[
                  t('pricing.enterpriseFeatures.integrations'),
                  t('pricing.enterpriseFeatures.support'),
                  t('pricing.enterpriseFeatures.solutions'),
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm leading-snug text-ase-text2">
                    <CheckIcon />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              className={cn(
                'mt-8 w-full transition-transform group-hover:scale-[1.02]',
                popular ? 'shadow-[0_0_24px_rgba(56,189,248,0.25)]' : '',
              )}
              variant={popular ? 'primary' : enterprise ? 'outline' : 'secondary'}
              disabled={disabled}
              onClick={() => onCta?.(plan)}
            >
              {enterprise
                ? t('pricing.cta.contactSales')
                : plan.planType === 'free'
                  ? t('pricing.cta.startFree')
                  : plan.trialDays
                    ? t('pricing.cta.startTrial')
                    : t('pricing.cta.getStarted')}
            </Button>
          </article>
        )
      })}
    </div>
  )
}
