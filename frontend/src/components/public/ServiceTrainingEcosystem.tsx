import { useMemo } from 'react'
import type { Service } from '../../types/service.types'
import { localizedServiceCopy } from '../../i18n/localizedService'
import { tStringArray, useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'

const STEP_KEYS = ['workshops', 'mentoring', 'enterprise', 'labs'] as const

type Props = {
  service?: Service | null
}

export function ServiceTrainingEcosystem({ service }: Props) {
  const { t } = useI18n()

  const loc = useMemo(() => (service ? localizedServiceCopy(t, service) : null), [t, service])
  const bandBody = loc?.description || service?.description

  const steps = useMemo(
    () => STEP_KEYS.map((k) => t(`servicesPage.training.items.${k}`) as string),
    [t],
  )

  const stepBodies = useMemo(() => tStringArray(t, 'servicesPage.training.stepBodies'), [t])

  return (
    <section className="relative border-t border-white/[0.06] py-20 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-x-0 top-24 h-64 bg-gradient-to-b from-ase-accent/10 to-transparent blur-3xl" />
      <div className="relative mx-auto w-full max-w-[min(100%,1400px)] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="info" className="border-white/10 bg-white/[0.04]">
              {t('servicesPage.training.badge')}
            </Badge>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('servicesPage.training.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('servicesPage.training.subtitle')}</p>
            {bandBody ? (
              <p className="mt-4 text-sm leading-relaxed text-ase-text2 sm:text-base">{bandBody}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-6 sm:p-10">
          <div className="relative">
            <div className="absolute left-[1.25rem] top-2 bottom-2 w-px bg-gradient-to-b from-ase-accent/50 via-white/10 to-transparent sm:left-8" />
            <ol className="space-y-8 sm:space-y-10">
              {steps.map((step, idx) => (
                <li key={STEP_KEYS[idx]} className="relative flex gap-6 sm:gap-10">
                  <div className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ase-accent/30 bg-ase-bg2 text-sm font-extrabold text-ase-accent shadow-[0_0_24px_rgba(34,211,238,0.18)] sm:h-12 sm:w-12 sm:text-base">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.07] bg-ase-surface/50 px-5 py-4 sm:px-6 sm:py-5">
                    <div className="text-sm font-semibold text-ase-text sm:text-base">{step}</div>
                    <p className="mt-2 text-sm leading-relaxed text-ase-text2">{stepBodies[idx] ?? ''}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
