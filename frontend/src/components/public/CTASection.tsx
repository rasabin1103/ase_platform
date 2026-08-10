import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { useI18n } from '../../i18n'

export function CTASection() {
  const { t } = useI18n()
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-28">
        <Card
          className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-10 shadow-soft sm:p-14"
          interactive
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <Eyebrow>{t('finalCta.badge')}</Eyebrow>
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

