import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SystemArchitectureVisual } from './SystemArchitectureVisual'
import { useI18n } from '../../i18n'

export function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="relative overflow-hidden">
      {/* Same glow/depth language as the admin application map — a soft
       * brand-color radial glow behind the hero, so the very first screen
       * a visitor sees already carries the "premium" finish. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle_at_20%_10%,rgba(56,189,248,0.14),transparent_45%),radial-gradient(circle_at_85%_25%,rgba(232,179,104,0.10),transparent_40%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 pb-24 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 sm:gap-14 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)] lg:items-center lg:gap-x-10 lg:gap-y-10 xl:gap-x-14">
          <div className="min-w-0 lg:max-w-[56ch]">
            <Badge variant="info" className="w-fit animate-fade-in-up">
              {t('hero.badge')}
            </Badge>
            <h1
              className="mt-8 animate-fade-in-up text-display-lg font-semibold text-ase-text sm:text-display-xl lg:text-display-2xl"
              style={{ animationDelay: '80ms' }}
            >
              {t('hero.title')}
            </h1>
            <p
              className="mt-8 max-w-[44ch] animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              {t('hero.subtitle')}
            </p>

            <div className="mt-10 flex animate-fade-in-up flex-col gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
              <Link to="/pricing">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('hero.primaryCta')}
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t('hero.secondaryCta')}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  {t('cta.clientLogin')}
                </Button>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TrustPill label={t('hero.trust.governance.label')} value={t('hero.trust.governance.value')} delayMs={300} />
              <TrustPill label={t('hero.trust.quality.label')} value={t('hero.trust.quality.value')} delayMs={360} />
              <TrustPill label={t('hero.trust.speed.label')} value={t('hero.trust.speed.value')} delayMs={420} />
            </div>
          </div>

          <div className="relative flex min-h-0 w-full min-w-0 justify-center lg:justify-end lg:self-stretch lg:items-center">
            <div className="w-full max-w-md min-w-0 sm:max-w-xl lg:max-w-full">
              <SystemArchitectureVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TrustPill({ label, value, delayMs }: { label: ReactNode; value: ReactNode; delayMs?: number }) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 transition duration-300 ease-out hover:-translate-y-1 hover:border-ase-brand/40 hover:shadow-glow-cyan"
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-3 text-sm leading-relaxed text-ase-text2">{value}</div>
    </div>
  )
}

