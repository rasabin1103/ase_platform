import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useI18n } from '../../i18n'

export function CTASection() {
  const { t } = useI18n()
  return (
    <section className="relative border-t border-white/[0.05]">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-24 sm:px-8 sm:py-28">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[min(480px,55vh)] w-[min(920px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-ase-primary/10 via-ase-accent/8 to-transparent blur-3xl" />
        <Card
          className="relative overflow-hidden rounded-2xl border-white/[0.08] bg-ase-surface/75 p-8 backdrop-blur-md sm:p-12 lg:p-14"
          interactive
        >
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-[280px] w-[280px] rounded-full bg-ase-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 top-10 h-[160px] w-[160px] rounded-2xl border border-white/[0.06] bg-white/[0.02]" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center md:gap-10">
            <div className="min-w-0 max-w-2xl">
              <Badge variant="info" className="w-fit">
                {t('finalCta.badge')}
              </Badge>
              <div className="font-display mt-4 text-2xl font-semibold tracking-tight text-ase-text text-balance sm:text-3xl">
                {t('finalCta.title')}
              </div>
              <div className="mt-3 text-sm leading-relaxed text-ase-text2 sm:text-[15px]">
                {t('finalCta.subtitle')}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="w-full min-w-[10rem] sm:w-auto">
                  {t('cta.contact')}
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full min-w-[10rem] sm:w-auto">
                  {t('cta.login')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
