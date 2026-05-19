import { useMemo } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type LaneId = 'triggers' | 'actions' | 'integrations' | 'ai'
const LANES: LaneId[] = ['triggers', 'actions', 'integrations', 'ai']

export function AutomationWorkflowVisual() {
  const { t } = useI18n()

  const lanes = useMemo(
    () =>
      LANES.map((id) => ({
        id,
        title: t(`platformPage.workflows.pipeline.${id}.title`) as string,
        items: tStringArray(t, `platformPage.workflows.pipeline.${id}.items`),
      })),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(56,189,248,0.10),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('platformPage.workflows.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('platformPage.workflows.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.workflows.subtitle')}</p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

              <div className="relative z-[1] grid gap-4 lg:grid-cols-4">
                {lanes.map((lane, idx) => (
                  <div key={lane.id} className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{lane.title}</div>
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          idx === 0 ? 'bg-ase-primary/80' : idx === 3 ? 'bg-ase-accent/80' : 'bg-white/30',
                        )}
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      {lane.items.map((it, i) => (
                        <div
                          key={`${lane.id}-${i}`}
                          className="rounded-xl border border-white/[0.07] bg-ase-bg2/35 px-3 py-2 text-xs font-semibold text-ase-text2"
                        >
                          {it}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pointer-events-none mt-6 hidden lg:block">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

