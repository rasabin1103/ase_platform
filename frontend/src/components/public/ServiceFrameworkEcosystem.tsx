import { useMemo } from 'react'
import type { Service } from '../../types/service.types'
import { localizedServiceCopy } from '../../i18n/localizedService'
import { useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/cn'

const NODE_KEYS = ['karate', 'playwright', 'pytest', 'wdio', 'apiTesting', 'reporting'] as const

type Props = {
  service?: Service | null
}

export function ServiceFrameworkEcosystem({ service }: Props) {
  const { t } = useI18n()

  const loc = useMemo(() => (service ? localizedServiceCopy(t, service) : null), [t, service])
  const bandIntro = loc?.shortDescription || service?.short_description

  const nodes = useMemo(
    () => NODE_KEYS.map((k) => t(`servicesPage.frameworks.items.${k}`) as string),
    [t],
  )

  const pills = useMemo(
    () =>
      (['repositories', 'parallelRuns', 'artifacts', 'flakeTriage'] as const).map((k) => ({
        id: k,
        label: t(`servicesPage.frameworks.pills.${k}`) as string,
      })),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="relative mx-auto w-full max-w-[min(100%,1400px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Badge variant="info" className="border-ase-primary/25 bg-ase-primary/10 text-ase-primary">
            {t('servicesPage.frameworks.badge')}
          </Badge>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('servicesPage.frameworks.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('servicesPage.frameworks.subtitle')}</p>
          {bandIntro ? <p className="mt-3 text-sm text-ase-text2 sm:text-base">{bandIntro}</p> : null}
        </div>

        <div className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ase-primary/[0.06] blur-3xl" />

          <div className="relative z-[1] mx-auto max-w-5xl">
            <div className="flex flex-col items-center">
              <div className="rounded-3xl border border-ase-primary/30 bg-ase-primary/10 px-6 py-3 text-sm font-semibold text-ase-primary shadow-[0_0_40px_rgba(56,189,248,0.15)]">
                {t('servicesPage.frameworks.ribbon')}
              </div>
              <div className="mt-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {nodes.map((n, i) => (
                  <div
                    key={NODE_KEYS[i]}
                    className={cn(
                      'relative rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-4 text-center text-xs font-semibold text-ase-text2 backdrop-blur-sm sm:text-sm',
                      i % 2 === 0 ? 'lg:translate-y-3' : 'lg:-translate-y-1',
                    )}
                  >
                    <div className="absolute -top-px left-1/2 h-8 w-px -translate-x-1/2 bg-gradient-to-b from-ase-primary/40 to-transparent" />
                    {n}
                  </div>
                ))}
              </div>
              <div className="mt-10 flex w-full max-w-3xl flex-wrap justify-center gap-3 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                {pills.map((pill) => (
                  <span key={pill.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
                    {pill.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
