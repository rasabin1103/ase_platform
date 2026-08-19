import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '../../api/billing.api'
import { listPlansCatalog } from '../../api/plansCatalog.api'
import { Eyebrow } from '../ui/Eyebrow'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'
import type { Plan } from '../../types/plan.types'
import {
  catalogPlansForBilling,
  localizedPlanText,
  planFeatureLines,
  planPriceView,
  tierFromPlanCode,
} from './pricingFromPlans'

type Billing = 'monthly' | 'yearly'

type TierTone = 'basic' | 'pro' | 'robust' | 'premium'

function planMarketingDescription(
  t: (key: string) => unknown,
  plan: Plan,
  language: 'en' | 'es',
): string {
  // Whatever the admin actually typed for this plan always wins — the
  // generic per-tier paragraphs below are only a fallback for plans that
  // were never given a custom description, so editing a plan's description
  // in the admin panel is guaranteed to show up here.
  const es = plan.short_description || plan.description
  const en = plan.short_description_en || plan.description_en
  if (es || en) {
    return localizedPlanText(language, es, en)
  }
  const tier = tierFromPlanCode(plan.code)
  if (tier === 'free') return t('pricing.starterPara') as string
  if (tier === 'enterprise') return t('pricing.enterprisePara') as string
  if (tier === 'pro' || tier === 'business') return t('pricing.professionalPara') as string
  return ''
}

function cardTone(plan: Plan): TierTone {
  const tier = tierFromPlanCode(plan.code)
  if (tier === 'pro') return 'pro'
  if (tier === 'business') return 'robust'
  if (tier === 'enterprise') return 'premium'
  if (plan.is_recommended) return 'pro'
  return 'basic'
}

export function PricingSection({ compact }: { compact?: boolean }) {
  const { t, language } = useI18n()
  const auth = useAuth()
  const navigate = useNavigate()
  const [billing, setBilling] = useState<Billing>('monthly')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: (planId: number) => createCheckoutSession(planId),
    onSuccess: (checkoutUrl) => {
      window.location.href = checkoutUrl
    },
    onError: () => {
      setCheckoutError(t('pricing.checkoutError') as string)
    },
  })

  const plansQuery = useQuery({
    queryKey: ['plans', 'public-catalog'],
    queryFn: listPlansCatalog,
    staleTime: 60_000,
  })

  const plans = useMemo(() => {
    if (!plansQuery.data) return []
    return catalogPlansForBilling(
      plansQuery.data,
      billing,
    )
  }, [plansQuery.data, billing])

  const gridColsClass =
    plans.length <= 1
      ? 'lg:grid-cols-1'
      : plans.length === 2
        ? 'lg:grid-cols-2'
        : plans.length === 3
          ? 'lg:grid-cols-3'
          : 'lg:grid-cols-4'

  return (
    <section className={cn('relative border-t border-white/5', compact ? 'py-0' : '')}>
      <div className={cn('mx-auto w-full max-w-[1440px] px-6 sm:px-8', compact ? 'py-16' : 'py-28')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>{t('pricing.badge')}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('pricing.title')}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="inline-flex w-full items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              disabled={plansQuery.isLoading}
              className={cn(
                'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none',
                billing === 'monthly' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                plansQuery.isLoading && 'pointer-events-none opacity-60',
              )}
            >
              {t('pricing.monthly')}
            </button>
            <button
              type="button"
              onClick={() => setBilling('yearly')}
              disabled={plansQuery.isLoading}
              className={cn(
                'flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition sm:flex-none',
                billing === 'yearly' ? 'bg-white/[0.06] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
                plansQuery.isLoading && 'pointer-events-none opacity-60',
              )}
            >
              {t('pricing.yearly')}
              <span className="ml-2 hidden rounded-full border border-ase-primary/30 bg-ase-primary/10 px-2 py-0.5 text-xs text-ase-primary sm:inline">
                {t('pricing.save')}
              </span>
            </button>
          </div>
        </div>

        {plansQuery.isError ? (
          <div className="mt-12 rounded-3xl border border-ase-error/25 bg-ase-error/5 px-6 py-8 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.loadError')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {checkoutError ? (
          <div className="mt-8 rounded-2xl border border-ase-error/25 bg-ase-error/5 px-5 py-4 text-center text-sm text-ase-error">
            {checkoutError}
          </div>
        ) : null}

        {plansQuery.isLoading ? (
          <div className={cn('mt-12 grid grid-cols-1 gap-6', 'lg:grid-cols-3')} aria-busy="true" aria-live="polite">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-7">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-white/10" />
                <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-white/[0.06]" />
                <p className="sr-only">{t('pricing.loadingHint')}</p>
              </Card>
            ))}
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-ase-surface px-6 py-12 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.empty')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && plans.length > 0 ? (
          <div className={cn('mt-12 grid grid-cols-1 gap-6', gridColsClass)}>
            {plans.map((plan) => {
              const tone = cardTone(plan)
              const { priceLabel, suffix } = planPriceView(
                plan,
                t('pricing.customPrice') as string,
                t('pricing.perMonth') as string,
                t('pricing.perYear') as string,
                billing,
              )
              const features = planFeatureLines(plan)
              const description = planMarketingDescription(t, plan, language)
              const planName = localizedPlanText(language, plan.name, plan.name_en)
              const cta = localizedPlanText(language, plan.cta_label, plan.cta_label_en) || (t('pricing.plans.pro.cta') as string)
              const planTier = tierFromPlanCode(plan.code)
              const isSelfServeTier = planTier === 'free' || planTier === 'pro' || planTier === 'business'
              const isPaidCheckoutTier = planTier === 'pro' || planTier === 'business'
              const canCheckout = isPaidCheckoutTier && auth.isAuthenticated && Boolean(plan.stripe_price_id)
              const ctaHref = isSelfServeTier ? (auth.isAuthenticated ? '/dashboard' : '/register') : '/contact'
              const isCheckingOutThisPlan = checkoutMutation.isPending && checkoutMutation.variables === plan.id

              return (
                <Card
                  key={plan.id}
                  interactive
                  className={cn(
                    // flex-col + each section below carries a fixed min-height (badge
                    // slot, description, price row) so name/description length never
                    // shifts where the price or button land — every card in the grid
                    // reads at the same height for the same section, regardless of
                    // how short or long that plan's own copy is.
                    'relative flex flex-col overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-7 shadow-soft',
                    tone === 'pro' && 'border-ase-gold/35',
                    tone === 'premium' && 'border-white/15',
                  )}
                >
                  <div className="flex min-h-[64px] items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-extrabold tracking-tight text-ase-text">{planName}</div>
                      {plan.is_recommended ? (
                        <div className="mt-2 inline-flex rounded-full border border-ase-gold/35 bg-ase-gold/10 px-2.5 py-0.5 text-xs font-semibold text-ase-gold">
                          {t('pricing.plans.pro.badge')}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 line-clamp-4 min-h-[84px] text-sm leading-relaxed text-ase-text2">
                    {description}
                  </div>

                  <div className="mt-6 flex min-h-[52px] items-end gap-2">
                    <div className="text-4xl font-extrabold tracking-tight text-ase-text">{priceLabel}</div>
                    {suffix ? <div className="pb-1 text-sm text-ase-text2">{suffix}</div> : null}
                  </div>

                  <div className="mt-6">
                    {canCheckout ? (
                      <Button
                        size="lg"
                        variant={tone === 'pro' ? 'primary' : tone === 'robust' ? 'outline' : 'secondary'}
                        className="w-full"
                        disabled={checkoutMutation.isPending}
                        onClick={() => {
                          setCheckoutError(null)
                          checkoutMutation.mutate(plan.id)
                        }}
                      >
                        {isCheckingOutThisPlan ? (t('pricing.checkoutLoading') as string) : cta}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={tone === 'pro' ? 'primary' : tone === 'robust' ? 'outline' : 'secondary'}
                        className="w-full"
                        onClick={() => navigate(ctaHref)}
                      >
                        {cta}
                      </Button>
                    )}
                  </div>

                  {features.length > 0 ? (
                    <ul className="mt-6 space-y-3">
                      {features.map((f) => (
                        <li key={f} className="flex gap-3 text-sm text-ase-text2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-brand/80" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              )
            })}
          </div>
        ) : null}

        {!compact && !plansQuery.isLoading && !plansQuery.isError && plans.length > 0 ? (
          <div className="mt-16 rounded-3xl border border-white/10 bg-black/60 px-6 py-10 sm:px-10">
            <h3 className="text-xl font-extrabold tracking-tight text-ase-text sm:text-2xl">
              {t('pricing.guarantee.title')}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ase-text2 sm:text-base">
              {t('pricing.guarantee.text')}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
              {(['item1', 'item2', 'item3'] as const).map((key) => (
                <div key={key} className="inline-flex items-center gap-2 text-sm text-ase-text2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ase-brand/30 bg-ase-brand/10 text-[11px] font-bold text-ase-brand"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{t(`pricing.guarantee.${key}`)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
