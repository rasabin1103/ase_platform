import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SystemArchitectureVisual } from './SystemArchitectureVisual'
import { useI18n } from '../../i18n'

export function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="relative overflow-hidden">
      {/* Local hero wash — reinforces focal column without competing with global canvas */}
      <div className="pointer-events-none absolute inset-0 lg:left-[-8%]" aria-hidden>
        <div className="absolute left-[12%] top-[-20%] h-[min(520px,50vh)] w-[min(560px,90vw)] rounded-full bg-gradient-to-br from-ase-primary/6 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-8 pb-28 pt-20 sm:pb-32 sm:pt-24 lg:pb-36 lg:pt-28">
        <div className="grid min-w-0 grid-cols-1 items-center gap-14 sm:gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-x-12 xl:gap-x-16">
          <div className="min-w-0 lg:max-w-[min(36rem,100%)]">
            <Badge variant="info" className="w-fit tracking-wide">
              {t('hero.badge')}
            </Badge>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ase-text text-balance sm:text-5xl lg:text-[3.35rem] lg:leading-[1.06]">
              {t('hero.title')}
            </h1>
            <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-ase-text2 sm:text-lg sm:leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="w-full min-w-[11rem] sm:w-auto">
                  {t('cta.talkToUs')}
                </Button>
              </Link>
              <Link to="/platform" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full min-w-[11rem] sm:w-auto">
                  {t('nav.platform')}
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full min-w-[10rem] sm:w-auto">
                  {t('cta.clientLogin')}
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <TrustPill label={t('hero.trust.governance.label')} value={t('hero.trust.governance.value')} />
              <TrustPill label={t('hero.trust.quality.label')} value={t('hero.trust.quality.value')} />
              <TrustPill label={t('hero.trust.speed.label')} value={t('hero.trust.speed.value')} />
            </div>
          </div>

          <div className="relative flex min-h-0 w-full min-w-0 justify-center lg:justify-end lg:self-stretch lg:items-center">
            <div className="relative w-full max-w-md min-w-0 sm:max-w-lg lg:max-w-none">
              <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent opacity-80 blur-xl sm:-inset-6" aria-hidden />
              <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-1 shadow-ase-lg ring-1 ring-white/[0.04] backdrop-blur-sm sm:p-1.5">
                <SystemArchitectureVisual />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const safeText = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''

function TrustPill({ label, value }: { label: unknown; value: unknown }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 shadow-soft backdrop-blur-sm transition duration-200 ease-out hover:border-white/[0.12] hover:bg-white/[0.04] sm:px-6 sm:py-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ase-muted">{safeText(label)}</div>
      <div className="mt-2.5 text-sm leading-relaxed text-ase-text2">{safeText(value)}</div>
    </div>
  )
}
