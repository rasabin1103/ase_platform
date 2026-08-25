import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'

const CARD_IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'] as const

export function ServicesInsideSection() {
  const { t } = useI18n()

  return (
    <section className="relative border-t border-white/[0.06]">
      <div className="mx-auto w-full max-w-[min(100%,1440px)] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <h2 className="max-w-3xl text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          {t('servicesPage.inside.title')}
        </h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CARD_IDS.map((id) => (
            <Card
              key={id}
              interactive
              className="relative overflow-hidden rounded-3xl border-white/[0.10] bg-ase-surface p-6 shadow-soft sm:p-7"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">
                  {t(`servicesPage.inside.cards.${id}.icon`)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold tracking-tight text-ase-text">
                    {t(`servicesPage.inside.cards.${id}.title`)}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ase-text2">
                    {t(`servicesPage.inside.cards.${id}.description`)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
