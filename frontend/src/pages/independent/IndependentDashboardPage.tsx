import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, GraduationCap, Clock, CircleUser } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { CatalogPremiumStrip } from '../../components/catalog/CatalogPremiumStrip'
import { RecommendedForYouStrip } from '../../components/catalog/RecommendedForYouStrip'
import { IndependentProgressPanel } from '../../components/private/dashboard/IndependentProgressPanel'
import { CategoryBarCharts } from '../../components/private/dashboard/CategoryBarCharts'
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

const QUICK_LINKS = [
  { to: '/favorites', labelKey: 'independentDashboard.cards.favorites', Icon: Heart },
  { to: '/my-purchases', labelKey: 'independentDashboard.cards.purchases', Icon: ShoppingBag },
  { to: '/my-courses', labelKey: 'independentDashboard.cards.myCourses', Icon: GraduationCap },
  { to: '/requests', labelKey: 'independentDashboard.cards.requests', Icon: Clock },
  { to: '/profile', labelKey: 'independentDashboard.cards.profile', Icon: CircleUser },
] as const

export function IndependentDashboardPage() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const canCreate = Boolean(currentUser?.can_create_content)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative z-[1] max-w-3xl">
          <div className="mb-5">
            <WelcomeBanner variant="lead" />
          </div>
          <Eyebrow>{t('independentDashboard.heroBadge')}</Eyebrow>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('independentDashboard.title')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ase-text2">{t('independentDashboard.subtitle')}</p>
        </div>
      </section>

      {canCreate ? (
        <Card className="border-cyan-300/20 bg-cyan-300/5 p-6">
          <h2 className="text-lg font-semibold text-ase-text">{t('requestsPage.createContentSection')}</h2>
          <p className="mt-2 text-sm text-ase-text2">{t('requestsPage.createContentHint')}</p>
        </Card>
      ) : null}

      <IndependentProgressPanel />

      <CategoryBarCharts />

      <RecommendedForYouStrip />

      <CatalogPremiumStrip
        type="product"
        titleKey="catalog.pages.products.title"
        subtitleKey="catalog.premium.productsTeaser"
        catalogPath="/catalog/products"
        limit={2}
      />

      <CatalogPremiumStrip
        type="course"
        titleKey="catalog.pages.courses.title"
        subtitleKey="catalog.premium.coursesTeaser"
        catalogPath="/catalog/courses"
        limit={2}
      />

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ase-muted">
          {t('independentDashboard.explore')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {QUICK_LINKS.map(({ to, labelKey, Icon }) => (
            <Link key={to} to={to}>
              <Card interactive className="flex h-full items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-ase-text">{t(labelKey)}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
