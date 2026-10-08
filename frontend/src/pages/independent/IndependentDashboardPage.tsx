import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Briefcase,
  CalendarClock,
  Heart,
  KeyRound,
  Library,
  ShoppingBag,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { PremiumHero } from '../../components/admin/premium/PremiumHero'
import { ButtonLink } from '../../components/ui/Button'
import { RecommendedForYouStrip } from '../../components/catalog/RecommendedForYouStrip'
import { ContinueLearningStrip } from '../../components/catalog/ContinueLearningStrip'
import { IndependentProgressPanel } from '../../components/private/dashboard/IndependentProgressPanel'
import { CategoryBarCharts } from '../../components/private/dashboard/CategoryBarCharts'
import { GettingStartedChecklist } from '../../components/private/dashboard/GettingStartedChecklist'
import { NewsUpdatesCard } from '../../components/dashboard/NewsUpdatesCard'
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner'
import { localizedPlanText } from '../../components/public/pricingFromPlans'
import { useI18n } from '../../i18n'
import { useAuth } from '../../hooks/useAuth'

const COPY = {
  es: {
    explore: 'Explorar el catálogo',
    library: 'Mi biblioteca',
    quick: 'Accesos rápidos',
    planTitle: 'Tu plan',
    freePlan: 'Plan gratuito',
    renews: 'Próxima renovación',
    ends: 'Acceso hasta',
    managePlan: 'Gestionar plan',
    links: {
      library: ['Mi biblioteca', 'Todo lo que tienes, por tipo'],
      favorites: ['Favoritos', 'Lo que has guardado para después'],
      purchases: ['Mis compras', 'Facturas y detalle de pago'],
      tests: ['Probar mis productos', 'Lanza ejecuciones de tus frameworks'],
      booking: ['Reservar sesión', 'Consultoría QA uno a uno'],
      redeem: ['Canjear código', 'Activa el repositorio de tu libro'],
      jobs: ['Ofertas laborales', 'Empleo QA ordenado según tu CV'],
    },
  },
  en: {
    explore: 'Explore the catalog',
    library: 'My library',
    quick: 'Quick access',
    planTitle: 'Your plan',
    freePlan: 'Free plan',
    renews: 'Next renewal',
    ends: 'Access until',
    managePlan: 'Manage plan',
    links: {
      library: ['My library', 'Everything you own, by type'],
      favorites: ['Favorites', 'What you saved for later'],
      purchases: ['My purchases', 'Invoices and payment details'],
      tests: ['Run my products', 'Trigger runs of your frameworks'],
      booking: ['Book a session', 'One-to-one QA consulting'],
      redeem: ['Redeem code', "Unlock your book's repository"],
      jobs: ['Job postings', 'QA jobs ranked against your CV'],
    },
  },
} as const

const QUICK_LINKS = [
  { key: 'library', to: '/my-library', Icon: Library, tone: 'text-violet-300 bg-violet-400/10 ring-violet-400/25' },
  { key: 'favorites', to: '/my-library?tab=favorites', Icon: Heart, tone: 'text-rose-300 bg-rose-400/10 ring-rose-400/25' },
  { key: 'purchases', to: '/my-library?tab=purchases', Icon: ShoppingBag, tone: 'text-sky-300 bg-ase-brand/15 ring-ase-brand/30' },
  { key: 'tests', to: '/test-execution', Icon: Activity, tone: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/25' },
  { key: 'booking', to: '/booking', Icon: CalendarClock, tone: 'text-amber-300 bg-amber-400/10 ring-amber-400/25' },
  { key: 'redeem', to: '/redeem-code', Icon: KeyRound, tone: 'text-sky-300 bg-ase-brand/15 ring-ase-brand/30' },
  { key: 'jobs', to: '/job-postings', Icon: Briefcase, tone: 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/25' },
] as const

function formatDate(iso: string | null | undefined, language: string) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'es-ES', { dateStyle: 'long' }).format(new Date(iso))
  } catch {
    return null
  }
}

export function IndependentDashboardPage() {
  const { t, language } = useI18n()
  const c = language === 'en' ? COPY.en : COPY.es
  const { currentUser } = useAuth()
  const canCreate = Boolean(currentUser?.can_create_content)
  const hasPlan = Boolean(currentUser?.plan_code)
  const planName = hasPlan
    ? localizedPlanText(language, currentUser?.plan_name, currentUser?.plan_name_en)
    : c.freePlan
  const renewal = formatDate(currentUser?.plan_ends_at ?? currentUser?.plan_current_period_end, language)

  return (
    <div className="space-y-8 pb-12">
      <PremiumHero
        accent="cyan"
        leading={<WelcomeBanner variant="lead" />}
        badge={t('independentDashboard.heroBadge') as string}
        title={t('independentDashboard.title') as string}
        subtitle={t('independentDashboard.subtitle') as string}
        actions={
          <>
            <ButtonLink to="/catalog/products" leftIcon={<Sparkles className="h-4 w-4" aria-hidden />}>
              {c.explore}
            </ButtonLink>
            <ButtonLink to="/my-library" variant="secondary" leftIcon={<Library className="h-4 w-4" aria-hidden />}>
              {c.library}
            </ButtonLink>
          </>
        }
        sidePanel={
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-label font-semibold uppercase text-ase-muted">{c.planTitle}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-ase-text">{planName}</p>
            {hasPlan ? (
              <>
                {renewal ? (
                  <p className="mt-1 text-sm text-ase-text2">
                    {currentUser?.plan_ends_at ? c.ends : c.renews}: {renewal}
                  </p>
                ) : null}
                <Link
                  to="/profile"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
                >
                  {c.managePlan}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-ase-text2">{t('independentDashboard.upsell.body')}</p>
                <ButtonLink to="/pricing" size="sm" className="mt-4">
                  {t('independentDashboard.upsell.cta')}
                </ButtonLink>
              </>
            )}
          </div>
        }
      />

      {canCreate ? (
        <section className="flex items-start gap-4 rounded-3xl border border-violet-400/25 bg-violet-400/[0.06] p-5 sm:p-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-400/15 text-violet-200 ring-1 ring-violet-400/30">
            <Wand2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ase-text">{t('requestsPage.createContentSection')}</h2>
            <p className="mt-1 text-sm text-ase-text2">{t('requestsPage.createContentHint')}</p>
          </div>
        </section>
      ) : null}

      <ContinueLearningStrip />

      <GettingStartedChecklist />

      <section aria-labelledby="independent-quick-links">
        <h2 id="independent-quick-links" className="mb-4 flex items-center gap-2.5 text-label font-semibold uppercase text-ase-muted">
          <span className="h-px w-6 bg-white/20" />
          {c.quick}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {QUICK_LINKS.map(({ key, to, Icon, tone }) => {
            const [label, hint] = c.links[key]
            return (
              <li key={key}>
                <Link
                  to={to}
                  className="group flex h-full flex-col rounded-3xl border border-white/10 bg-ase-surface/80 p-5 transition hover:-translate-y-0.5 hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl ring-1 ${tone}`}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-ase-muted transition group-hover:translate-x-0.5 group-hover:text-ase-text"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-4 font-semibold text-ase-text">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ase-muted">{hint}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <IndependentProgressPanel />

      <RecommendedForYouStrip />

      <NewsUpdatesCard />

      <CategoryBarCharts />
    </div>
  )
}
