import { Link } from 'react-router-dom'
import { tStringArray, useI18n } from '../../i18n'
import { Eyebrow } from '../ui/Eyebrow'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'

export function ServicesHeroPremium() {
  const { t } = useI18n()
  const phases = tStringArray(t, 'servicesPage.visuals.phases')

  return (
    <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="min-w-0 lg:col-span-6">
            <Eyebrow>{t('servicesPage.hero.badge')}</Eyebrow>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-ase-text sm:text-5xl lg:text-6xl">
              {t('servicesPage.hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg lg:text-xl">{t('servicesPage.hero.subtitle')}</p>

            <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/contact" className="w-full sm:w-auto sm:flex-1">
                <Button size="lg" className="w-full">
                  {t('servicesPage.hero.primaryCta')}
                </Button>
              </Link>
              <Link to="/platform" className="w-full sm:w-auto sm:flex-1">
                <Button size="lg" variant="secondary" className="w-full">
                  {t('servicesPage.hero.secondaryCta')}
                </Button>
              </Link>
            </div>

            {/* grid-cols-1: each stat's value is a full sentence (see
                servicesPage.locale.ts), not a short number like the counters
                on AboutPage/PlatformPage — squeezing that into a 1/3-width
                mobile column wraps it into a wall of 6-7 lines. Stacks on
                mobile, 3-across from sm: up where there's room. */}
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  {t('servicesPage.hero.stats.delivery.label')}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-ase-text2">{t('servicesPage.hero.stats.delivery.value')}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  {t('servicesPage.hero.stats.model.label')}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-ase-text2">{t('servicesPage.hero.stats.model.value')}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  {t('servicesPage.hero.stats.stack.label')}
                </div>
                <div className="mt-2 text-sm leading-relaxed text-ase-text2">{t('servicesPage.hero.stats.stack.value')}</div>
              </div>
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div
              className={cn(
                'relative overflow-hidden rounded-[2rem] border border-white/[0.1] bg-ase-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.55)]',
                'sm:p-8',
              )}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="relative z-[1] flex flex-wrap gap-2">
                <span className="rounded-full border border-ase-primary/30 bg-ase-primary/10 px-3 py-1 text-xs font-semibold text-ase-primary">
                  {t('servicesPage.visuals.pillMultiTenant')}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ase-text2">
                  {t('servicesPage.visuals.pillCiCd')}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ase-text2">
                  {t('servicesPage.visuals.pillObservability')}
                </span>
              </div>
              <div className="relative z-[1] mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t('servicesPage.visuals.architectureTitle')}
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-ase-primary to-ase-accent" />
                  </div>
                  <div className="mt-3 text-xs text-ase-text2">{t('servicesPage.visuals.architectureBody')}</div>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t('servicesPage.visuals.qualityTitle')}
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="h-6 flex-1 rounded-md bg-ase-bg2/80 ring-1 ring-white/10" />
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-ase-text2">{t('servicesPage.visuals.qualityBody')}</div>
                </div>
                <div className="sm:col-span-2 rounded-2xl border border-ase-accent/20 bg-ase-accent/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-ase-text">{t('servicesPage.visuals.deliveryMapTitle')}</div>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-ase-accent shadow-[0_0_16px_rgba(34,211,238,0.35)]" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[10px] font-semibold uppercase tracking-wide text-ase-muted sm:grid-cols-4">
                    {phases.map((label, i) => (
                      <span key={`phase-${i}`} className="rounded-lg bg-white/[0.04] py-2">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
