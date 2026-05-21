import { Link } from 'react-router-dom'
import { PricingSection } from '../../components/public/PricingSection'
import { Badge } from '../../components/ui/Badge'
import { useI18n } from '../../i18n'

export function IndependentPlansPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-ase-surface/60 via-ase-bg2/80 to-ase-bg/90 p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative z-[1] max-w-3xl">
          <Badge variant="info" className="border-white/10 bg-white/[0.04]">
            {t('independentPlans.badge')}
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('independentPlans.title')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ase-text2">{t('independentPlans.subtitle')}</p>
          <p className="mt-4 text-sm text-ase-muted">
            <Link to="/dashboard" className="font-semibold text-cyan-300 hover:text-cyan-200">
              ← {t('independentPlans.backDashboard')}
            </Link>
          </p>
        </div>
      </section>

      <PricingSection compact />
    </div>
  )
}
