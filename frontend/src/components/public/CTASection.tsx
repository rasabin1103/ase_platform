import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { useI18n } from '../../i18n'

export function CTASection() {
  const { t } = useI18n()
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-28">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-ase-primary/18 via-ase-accent/14 to-transparent blur-3xl" />
        <Card
          className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/70 p-10 backdrop-blur sm:p-14"
          interactive
        >
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-[320px] w-[320px] rounded-full bg-ase-primary/14 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 top-12 h-[180px] w-[180px] rounded-3xl border border-white/10 bg-white/[0.03] blur-[1px]" />
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <Badge variant="info" className="w-fit">
                {t('finalCta.badge')}
              </Badge>
              <div className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
                {t('finalCta.title')}
              </div>
              <div className="mt-2 max-w-2xl text-sm text-ase-text2">
                {t('finalCta.subtitle')}
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto">
                  {t('cta.contact')}
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
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

