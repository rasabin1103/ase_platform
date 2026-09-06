import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useRbac } from '../rbac/useRbac'
import { useI18n } from '../i18n'
import {
  AdminDashboardPage,
  CatalogListPage,
  IndependentDashboardPage,
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

export function FavoritesPage() {
  return (
    <CatalogListPage
      mode="favorites"
      titleKey="catalog.pages.favorites.title"
      subtitleKey="catalog.pages.favorites.subtitle"
      catalogBasePath="/favorites"
    />
  )
}

type LibraryTabKey = 'all' | 'product' | 'course' | 'book' | 'resource'

const LIBRARY_TABS: Array<{
  key: LibraryTabKey
  mode: 'purchases' | 'myProducts' | 'myCourses' | 'myBooks' | 'myResources'
  labelKey: string
}> = [
  { key: 'all', mode: 'purchases', labelKey: 'catalog.pages.myLibrary.tabs.all' },
  { key: 'product', mode: 'myProducts', labelKey: 'catalog.groupLabels.product' },
  { key: 'course', mode: 'myCourses', labelKey: 'catalog.groupLabels.course' },
  { key: 'book', mode: 'myBooks', labelKey: 'catalog.groupLabels.book' },
  { key: 'resource', mode: 'myResources', labelKey: 'catalog.groupLabels.resource' },
]

/** Consolidates what used to be four separate sidebar entries (Mis
 * productos / Mis cursos / Mis libros / Mis recursos) into one "Mi
 * biblioteca" page with an internal tab bar — same underlying data
 * (CatalogListPage with purchased_only modes), just switched locally
 * instead of via four different routes. "Mis compras" (MyPurchasesPage,
 * in pages/independent, lazy-loaded via lazyPages.tsx) stays a separate
 * page on purpose — that one's about the transaction record (date, price
 * paid, invoice...), this one's about the content you own. */
export function MyLibraryPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<LibraryTabKey>('all')
  const tab = LIBRARY_TABS.find((tb) => tb.key === activeTab) ?? LIBRARY_TABS[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ase-text">{t('catalog.pages.myLibrary.title')}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t('catalog.pages.myLibrary.subtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {LIBRARY_TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setActiveTab(tb.key)}
            className={
              activeTab === tb.key
                ? 'rounded-xl border border-ase-brand/40 bg-ase-brand/15 px-3.5 py-2 text-sm font-semibold text-ase-brand transition'
                : 'rounded-xl border border-white/10 bg-ase-surface px-3.5 py-2 text-sm font-semibold text-ase-text2 transition hover:border-white/20'
            }
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>
      <CatalogListPage key={tab.key} mode={tab.mode} hideHeader catalogBasePath="/my-library" />
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
