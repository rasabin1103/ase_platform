import { BadgeCheck, Briefcase, Sparkles } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ButtonLink } from '../ui/Button'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { useI18n } from '../../i18n'

const OFFER_COUNT = 4
const ANALYSIS_COUNT = 6
const LEVEL_VARIANTS = ['success', 'info', 'warning', 'error'] as const

/** Public "what ASE includes" block for the job board: what the offers look
 * like and what the CV-fit analysis returns. Marketing copy only — it never
 * names internal providers, models or endpoints. */
export function ServicesJobsSection() {
  const { t } = useI18n()

  return (
    <section className="relative border-t border-white/[0.06] bg-ase-bg2/30">
      <div className="mx-auto w-full max-w-[min(100%,1440px)] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <div className="max-w-3xl">
          <Eyebrow>{t('servicesPage.jobs.badge')}</Eyebrow>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
            {t('servicesPage.jobs.title')}
          </h2>
          <p className="mt-3 text-base text-ase-text2 sm:text-lg">{t('servicesPage.jobs.subtitle')}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <Card className="rounded-3xl border-white/[0.10] bg-ase-surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ase-text">
              <Briefcase className="h-4 w-4" strokeWidth={1.75} />
              {t('servicesPage.jobs.offersTitle')}
            </div>
            <ul className="mt-4 space-y-3">
              {Array.from({ length: OFFER_COUNT }, (_, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ase-text2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-ase-brand" strokeWidth={1.75} />
                  <span>{t(`servicesPage.jobs.offers.${i}`)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-3xl border-white/[0.10] bg-ase-surface p-6 shadow-soft sm:p-7">
            <div className="flex items-center gap-2 text-sm font-extrabold text-ase-text">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
              {t('servicesPage.jobs.analysisTitle')}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: ANALYSIS_COUNT }, (_, i) => (
                <div key={i}>
                  <div className="text-sm font-semibold text-ase-text">{t(`servicesPage.jobs.analysis.${i}.title`)}</div>
                  <p className="mt-1 text-sm leading-relaxed text-ase-text2">
                    {t(`servicesPage.jobs.analysis.${i}.description`)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="text-xs font-semibold text-ase-text">{t('servicesPage.jobs.levelsTitle')}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVEL_VARIANTS.map((variant, i) => (
                  <Badge key={variant} variant={variant}>
                    {t(`servicesPage.jobs.levels.${i}.range`)} · {t(`servicesPage.jobs.levels.${i}.label`)}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm text-ase-muted">{t('servicesPage.jobs.note')}</p>
          <ButtonLink to="/login" variant="secondary">
            {t('servicesPage.jobs.cta')}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
