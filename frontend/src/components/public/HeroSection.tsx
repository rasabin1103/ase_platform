import { Link } from 'react-router-dom'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { SystemArchitectureVisual } from './SystemArchitectureVisual'
import { useI18n } from '../../i18n'

export function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-[1600px] px-5 sm:px-8 pb-24 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
        <div className="grid min-w-0 grid-cols-1 items-center gap-12 sm:gap-14 lg:grid-cols-[minmax(0,52%)_minmax(0,48%)] lg:items-center lg:gap-x-10 lg:gap-y-10 xl:gap-x-14">
          <div className="min-w-0 lg:max-w-[56ch]">
            <Badge variant="info" className="w-fit">
              {t('hero.badge')}
            </Badge>
            <h1 className="mt-8 text-5xl font-extrabold leading-[1.02] tracking-tight text-ase-text sm:text-6xl lg:text-7xl">
              {t('hero.title')}
            </h1>
            <p className="mt-8 max-w-[44ch] text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('cta.talkToUs')}
                </Button>
              </Link>
              <Link to="/platform">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t('nav.platform')}
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                  {t('cta.clientLogin')}
                </Button>
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TrustPill label={t('hero.trust.governance.label')} value={t('hero.trust.governance.value')} />
              <TrustPill label={t('hero.trust.quality.label')} value={t('hero.trust.quality.value')} />
              <TrustPill label={t('hero.trust.speed.label')} value={t('hero.trust.speed.value')} />
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

function TrustPill({ label, value }: { label: any; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-3 text-sm leading-relaxed text-ase-text2">{value}</div>
    </div>
  )
}

