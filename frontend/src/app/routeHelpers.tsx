import { Navigate } from 'react-router-dom'
import { useRbac } from '../rbac/useRbac'
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

export function MyPurchasesPage() {
  return (
    <CatalogListPage
      mode="purchases"
      titleKey="catalog.pages.purchases.title"
      subtitleKey="catalog.pages.purchases.subtitle"
      catalogBasePath="/my-purchases"
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
