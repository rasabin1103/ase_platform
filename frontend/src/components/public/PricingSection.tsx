import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { listPlansCatalog } from '../../api/plansCatalog.api'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'
import { buildTierViewModels, type PricingTier } from './pricingFromPlans'

type Billing = 'monthly' | 'yearly'

type TierTone = 'basic' | 'pro' | 'robust' | 'premium'

const TIER_TONE: Record<PricingTier, TierTone> = {
  free: 'basic',
  pro: 'pro',
  business: 'robust',
  enterprise: 'premium',
}

const TIER_HREF: Record<PricingTier, string> = {
  free: '/contact',
  pro: '/contact',
  business: '/contact',
  enterprise: '/contact',
}

export function PricingSection({ compact }: { compact?: boolean }) {
  const { t } = useI18n()
  const [billing, setBilling] = useState<Billing>('monthly')

  const plansQuery = useQuery({
    queryKey: ['plans', 'public-catalog'],
    queryFn: listPlansCatalog,
    staleTime: 60_000,
  })

  const rows = useMemo(() => {
    if (!plansQuery.data) return []
    return buildTierViewModels(
      plansQuery.data,
      billing,
      t('pricing.perMonth') as string,
      t('pricing.perYear') as string,
      t('pricing.customPrice') as string,
    )
  }, [plansQuery.data, billing, t])

  const gridColsClass =
    rows.length <= 1
      ? 'lg:grid-cols-1'
      : rows.length === 2
        ? 'lg:grid-cols-2'
        : rows.length === 3
          ? 'lg:grid-cols-3'
          : 'lg:grid-cols-4'

  return (
    <section className={cn('relative border-t border-white/5', compact ? 'py-0' : '')}>
      <div className={cn('mx-auto w-full max-w-[1440px] px-6 sm:px-8', compact ? 'py-16' : 'py-28')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="info" className="w-fit">
              {t('pricing.badge')}
            </Badge>
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

        {plansQuery.isLoading ? (
          <div className={cn('mt-12 grid grid-cols-1 gap-6', 'lg:grid-cols-4')}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/40 p-7 backdrop-blur"
              >
                <div className="h-4 w-24 animate-pulse rounded-lg bg-white/10" />
                <div className="mt-4 h-16 w-full animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="mt-6 h-12 w-full animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-[85%] animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-[70%] animate-pulse rounded bg-white/[0.06]" />
                </div>
                <p className="sr-only">{t('pricing.loadingHint')}</p>
              </Card>
            ))}
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && rows.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
            <p className="text-sm text-ase-text2">{t('pricing.empty')}</p>
            <Button type="button" variant="secondary" className="mt-4" onClick={() => plansQuery.refetch()}>
              {t('pricing.retry')}
            </Button>
          </div>
        ) : null}

        {!plansQuery.isLoading && !plansQuery.isError && rows.length > 0 ? (
          <div className={cn('mt-12 grid grid-cols-1 gap-6', gridColsClass)}>
            {rows.map((row) => {
              const tone = TIER_TONE[row.tier]
              const meta = tierCardCopy(t, row.tier)
              return (
                <Card
                  key={row.tier}
                  interactive
                  className={cn(
                    'relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/60 p-7 backdrop-blur',
                    tone === 'pro' &&
                      'border-ase-primary/35 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.12),transparent_55%)]',
                    tone === 'premium' && 'bg-white/[0.02]',
                  )}
                >
                  {tone === 'pro' ? (
                    <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/14 blur-3xl" />
                  ) : null}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-ase-text">{meta.name}</div>
                      {meta.badge ? (
                        <div className="mt-2 inline-flex rounded-full border border-ase-primary/30 bg-ase-primary/10 px-2.5 py-0.5 text-xs font-semibold text-ase-primary">
                          {meta.badge}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 text-sm leading-relaxed text-ase-text2">{meta.desc}</div>

                  <div className="mt-6 flex items-end gap-2">
                    <div className="text-4xl font-extrabold tracking-tight text-ase-text">{row.priceLabel}</div>
                    {row.suffix ? <div className="pb-1 text-sm text-ase-text2">{row.suffix}</div> : null}
                  </div>

                  <div className="mt-6">
                    <Link to={TIER_HREF[row.tier]}>
                      <Button
                        size="lg"
                        variant={tone === 'pro' ? 'primary' : tone === 'robust' ? 'outline' : 'secondary'}
                        className="w-full"
                      >
                        {meta.cta}
                      </Button>
                    </Link>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {meta.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm text-ase-text2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-accent/70 shadow-[0_0_12px_rgba(34,211,238,0.20)]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function tierCardCopy(
  t: (key: string) => string,
  tier: PricingTier,
): { name: string; badge?: string; desc: string; features: string[]; cta: string } {
  const base = `pricing.plans.${tier}`
  return {
    name: t(`${base}.name`) as string,
    badge: tier === 'pro' ? (t('pricing.plans.pro.badge') as string) : undefined,
    desc: t(`${base}.desc`) as string,
    features: t(`${base}.features`) as unknown as string[],
    cta: t(`${base}.cta`) as string,
  }
}
