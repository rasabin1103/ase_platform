import { Eyebrow } from '../ui/Eyebrow'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

export function PlatformModulesMap() {
  const { t } = useI18n()
  type ModuleCardContent = { title: string; desc: string }
  const modules: ModuleCardContent[] = [
    t<ModuleCardContent>('modules.cards.auth'),
    t<ModuleCardContent>('modules.cards.orgs'),
    t<ModuleCardContent>('modules.cards.roles'),
    t<ModuleCardContent>('modules.cards.plans'),
    t<ModuleCardContent>('modules.cards.products'),
    t<ModuleCardContent>('modules.cards.courses'),
    t<ModuleCardContent>('modules.cards.blog'),
    t<ModuleCardContent>('modules.cards.reviews'),
    t<ModuleCardContent>('modules.cards.audit'),
  ]

  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Eyebrow>{t('modules.badge')}</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('modules.title')}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('modules.subtitle')}
            </p>
          </div>
        </div>

        <div className="relative mt-14">
          {/* connector lines */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="absolute left-1/2 top-1/2 h-[78%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-px w-[82%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-[44px] border border-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-7">
            <div className="grid grid-cols-1 gap-5">
              <ModuleCard title={modules[0].title} desc={modules[0].desc} />
              <ModuleCard title={modules[1].title} desc={modules[1].desc} />
              <ModuleCard title={modules[2].title} desc={modules[2].desc} />
            </div>

            <div className="relative">
              <Card
                interactive
                className={cn(
                  'relative overflow-hidden rounded-3xl border-ase-brand/25 bg-ase-surface p-8',
                  'shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_28px_70px_rgba(0,0,0,0.60)]',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-ase-text">{t('modules.coreTitle')}</div>
                    <div className="mt-1 text-sm text-ase-text2">{t('modules.coreSubtitle')}</div>
                  </div>
                  <span className="h-2.5 w-2.5 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Pill label={t('modules.pills.rbac')} />
                  <Pill label={t('modules.pills.audit')} />
                  <Pill label={t('modules.pills.billing')} />
                  <Pill label={t('modules.pills.catalog')} />
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                    {t('modules.integrityTitle')}
                  </div>
                  <div className="mt-2 text-sm text-ase-text2">
                    {t('modules.integrityBody')}
                  </div>
                </div>
              </Card>
            </div>

            {/* 2-col only in the stacked (pre-lg) layout, where this block
                spans the full page width — once the parent grid splits into
                3 columns at lg, this slot is narrow again, so it drops back
                to 1 column instead of squeezing 6 cards into two cramped
                ones. */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <ModuleCard title={modules[3].title} desc={modules[3].desc} />
              <ModuleCard title={modules[4].title} desc={modules[4].desc} />
              <ModuleCard title={modules[5].title} desc={modules[5].desc} />
              <ModuleCard title={modules[6].title} desc={modules[6].desc} />
              <ModuleCard title={modules[7].title} desc={modules[7].desc} />
              <ModuleCard title={modules[8].title} desc={modules[8].desc} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ModuleCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="rounded-3xl border-white/10 bg-ase-surface p-7" interactive>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-ase-text">{title}</div>
          <div className="mt-2 text-sm leading-relaxed text-ase-text2">{desc}</div>
        </div>
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/35" />
      </div>
    </Card>
  )
}

function Pill({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ase-bg2/40 px-4 py-3 text-center text-xs font-semibold text-ase-text2">
      {label}
    </div>
  )
}

