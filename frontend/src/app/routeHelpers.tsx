import { Suspense } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { RouteLoadingFallback } from '../components/layout/RouteLoadingFallback'
import { useRbac } from '../rbac/useRbac'
import { useI18n } from '../i18n'
import { Library } from 'lucide-react'
import { AdminTabs } from '../components/admin/premium/AdminTabs'
import { PremiumHero } from '../components/admin/premium/PremiumHero'
import {
  AdminDashboardPage,
  CatalogListPage,
  IndependentDashboardPage,
  MyPurchasesPage,
  OrganizationDashboardPage,
} from './lazyPages'

// Small role/param-dispatch wrappers around the lazy page components — kept
// in their own module (rather than inline in router.tsx) for the same
// reason as lazyPages.tsx: a file mixing component exports with the
// non-component `router` export breaks Fast Refresh.

export function RoleAwareDashboard() {
  const { isConsumerMode, isOrgWorkspace, primaryRole, isSuperuser } = useRbac()
  if (isSuperuser || primaryRole === 'super_admin') return <AdminDashboardPage />
  if (isOrgWorkspace) return <OrganizationDashboardPage />
  if (isConsumerMode) return <IndependentDashboardPage />
  return <Navigate to="/dashboard" replace />
}

export function CatalogProductsPage() {
  return (
    <CatalogListPage
      type="product"
      titleKey="catalog.pages.products.title"
      subtitleKey="catalog.pages.products.subtitle"
      catalogBasePath="/catalog/products"
    />
  )
}

export function CatalogCoursesPage() {
  return (
    <CatalogListPage
      type="course"
      titleKey="catalog.pages.courses.title"
      subtitleKey="catalog.pages.courses.subtitle"
      catalogBasePath="/catalog/courses"
    />
  )
}

export function CatalogBooksPage() {
  return (
    <CatalogListPage
      type="book"
      titleKey="catalog.pages.books.title"
      subtitleKey="catalog.pages.books.subtitle"
      catalogBasePath="/catalog/books"
    />
  )
}

export function CatalogResourcesPage() {
  return (
    <CatalogListPage
      type="resource"
      titleKey="catalog.pages.resources.title"
      subtitleKey="catalog.pages.resources.subtitle"
      catalogBasePath="/catalog/resources"
    />
  )
}

/** Favoritos y Mis compras viven ahora como pestañas de Mi biblioteca; las
 * rutas antiguas redirigen para no romper enlaces guardados. */
export function FavoritesPage() {
  return <Navigate to="/my-library?tab=favorites" replace />
}

export function PurchasesRedirect() {
  return <Navigate to="/my-library?tab=purchases" replace />
}

type LibraryTabKey = 'all' | 'product' | 'course' | 'book' | 'resource' | 'favorites' | 'purchases'

const LIBRARY_TABS: Array<{
  key: LibraryTabKey
  mode: 'purchases' | 'myProducts' | 'myCourses' | 'myBooks' | 'myResources' | 'favorites' | null
  labelKey: string
}> = [
  { key: 'all', mode: 'purchases', labelKey: 'catalog.pages.myLibrary.tabs.all' },
  { key: 'product', mode: 'myProducts', labelKey: 'catalog.groupLabels.product' },
  { key: 'course', mode: 'myCourses', labelKey: 'catalog.groupLabels.course' },
  { key: 'book', mode: 'myBooks', labelKey: 'catalog.groupLabels.book' },
  { key: 'resource', mode: 'myResources', labelKey: 'catalog.groupLabels.resource' },
  { key: 'favorites', mode: 'favorites', labelKey: 'private.nav.favorites' },
  // Registro de transacciones (fecha, importe, factura): su propio componente.
  { key: 'purchases', mode: null, labelKey: 'private.nav.myPurchases' },
]

const LIBRARY_SUBTITLE = {
  es: 'Todo lo que tienes, lo que has guardado y tus compras, en un solo sitio.',
  en: 'Everything you own, what you saved and your purchases, in one place.',
} as const

/** «Mi biblioteca»: contenido propio por tipo, favoritos y compras como
 * pestañas de una sola página. La pestaña activa vive en `?tab=` para que
 * se pueda enlazar y sobreviva al volver atrás desde una ficha. */
export function MyLibraryPage() {
  const { t, language } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = LIBRARY_TABS.find((tb) => tb.key === searchParams.get('tab')) ?? LIBRARY_TABS[0]
  const changeTab = (key: LibraryTabKey) => {
    // Al cambiar de pestaña se limpian los filtros de la anterior.
    setSearchParams(key === 'all' ? {} : { tab: key }, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PremiumHero
        compact
        accent="violet"
        badge={language === 'en' ? 'Your library' : 'Tu biblioteca'}
        title={t('catalog.pages.myLibrary.title') as string}
        subtitle={language === 'en' ? LIBRARY_SUBTITLE.en : LIBRARY_SUBTITLE.es}
        sidePanel={
          <span className="hidden h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-violet-300 lg:grid">
            <Library className="h-6 w-6" strokeWidth={1.6} aria-hidden />
          </span>
        }
      />
      <AdminTabs
        label={t('catalog.pages.myLibrary.title') as string}
        tabs={LIBRARY_TABS.map((tb) => ({ key: tb.key, label: t(tb.labelKey) as string }))}
        active={tab.key}
        onChange={changeTab}
      />
      <Suspense fallback={<RouteLoadingFallback />}>
        {tab.mode ? (
          <CatalogListPage key={tab.key} mode={tab.mode} hideHeader catalogBasePath="/my-library" />
        ) : (
          <MyPurchasesPage hideHeader />
        )}
      </Suspense>
    </div>
  )
}

export function MyProductsPage() {
  return (
    <CatalogListPage
      mode="myProducts"
      titleKey="catalog.pages.myProducts.title"
      subtitleKey="catalog.pages.myProducts.subtitle"
      catalogBasePath="/my-products"
    />
  )
}

export function MyCoursesPage() {
  return (
    <CatalogListPage
      mode="myCourses"
      titleKey="catalog.pages.myCourses.title"
      subtitleKey="catalog.pages.myCourses.subtitle"
      catalogBasePath="/my-courses"
    />
  )
}

export function MyBooksPage() {
  return (
    <CatalogListPage
      mode="myBooks"
      titleKey="catalog.pages.myBooks.title"
      subtitleKey="catalog.pages.myBooks.subtitle"
      catalogBasePath="/my-books"
    />
  )
}

export function MyResourcesPage() {
  return (
    <CatalogListPage
      mode="myResources"
      titleKey="catalog.pages.myResources.title"
      subtitleKey="catalog.pages.myResources.subtitle"
      catalogBasePath="/my-resources"
    />
  )
}
