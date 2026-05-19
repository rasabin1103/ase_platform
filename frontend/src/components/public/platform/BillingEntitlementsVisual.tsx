import { useMemo, useState } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type PlanId = 'starter' | 'team' | 'enterprise'
const PLANS: PlanId[] = ['starter', 'team', 'enterprise']

type FlowId = 'products' | 'plans' | 'entitlements' | 'upgrades'
const FLOW: FlowId[] = ['products', 'plans', 'entitlements', 'upgrades']

export function BillingEntitlementsVisual() {
  const { t } = useI18n()
  const [active, setActive] = useState<PlanId>('team')

  const flow = useMemo(
    () =>
      FLOW.map((id) => ({
        id,
        title: t(`platformPage.billing.flow.${id}.title`) as string,
        description: t(`platformPage.billing.flow.${id}.description`) as string,
      })),
    [t],
  )

  const plans = useMemo(
    () =>
      PLANS.map((id) => ({
        id,
        name: t(`platformPage.billing.planNames.${id}`) as string,
        bullets: tStringArray(t, `platformPage.billing.planBullets.${id}`),
      })),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,rgba(56,189,248,0.10),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('platformPage.billing.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('platformPage.billing.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.billing.subtitle')}</p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/8 blur-3xl" />

              <div className="relative z-[1] space-y-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  {flow.map((f, idx) => (
                    <div key={f.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{f.title}</div>
                        <span className={cn('h-2 w-2 rounded-full', idx % 2 === 0 ? 'bg-ase-primary/80' : 'bg-ase-accent/70')} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ase-text2">{f.description}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={cn(
                        'relative overflow-hidden rounded-2xl border bg-white/[0.04] p-5 text-left transition',
                        active === p.id
                          ? 'border-ase-primary/30 ring-1 ring-ase-primary/20'
                          : 'border-white/[0.08] hover:border-white/15',
                      )}
                      onClick={() => setActive(p.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-ase-text">{p.name}</div>
                        {p.id === active ? (
                          <span className="rounded-full border border-ase-primary/25 bg-ase-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ase-primary">
                            {t('platformPage.billing.planBadges.current')}
                          </span>
                        ) : p.id === 'enterprise' ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ase-muted">
                            {t('platformPage.billing.planBadges.recommended')}
                          </span>
                        ) : null}
                      </div>
                      <ul className="mt-4 space-y-2">
                        {p.bullets.map((b, i) => (
                          <li key={`${p.id}-${i}`} className="flex gap-2 text-xs text-ase-text2">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ase-accent/80" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pointer-events-none absolute -inset-10 opacity-0 transition duration-300 hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

