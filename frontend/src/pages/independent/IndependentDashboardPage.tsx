import { Link } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { CatalogPremiumStrip } from '../../components/catalog/CatalogPremiumStrip'
import { Badge } from '../../components/ui/Badge'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

const QUICK_LINKS = [
  { to: '/favorites', labelKey: 'independentDashboard.cards.favorites', icon: '♥' },
  { to: '/my-purchases', labelKey: 'independentDashboard.cards.purchases', icon: '🛒' },
  { to: '/my-courses', labelKey: 'independentDashboard.cards.myCourses', icon: '✓' },
  { to: '/requests', labelKey: 'independentDashboard.cards.requests', icon: '◐' },
  { to: '/profile', labelKey: 'independentDashboard.cards.profile', icon: '◎' },
] as const

export function IndependentDashboardPage() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const name = currentUser?.display_name || currentUser?.email || ''
  const canCreate = Boolean(currentUser?.can_create_content)

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-ase-surface/60 via-ase-bg2/80 to-ase-bg/90 p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(56,189,248,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-[1] max-w-3xl">
          <Badge variant="info" className="border-white/10 bg-white/[0.04]">
            {t('independentDashboard.heroBadge')}
          </Badge>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('independentDashboard.title')}
            {name ? `, ${name}` : ''}
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
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card interactive className="flex h-full items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-base">
                  {link.icon}
                </span>
                <span className="text-sm font-semibold text-ase-text">{t(link.labelKey)}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
