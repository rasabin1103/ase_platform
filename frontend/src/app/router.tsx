import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { WorkspaceContextGate } from '../auth/WorkspaceContextGate'
import { PostLoginGate } from '../auth/PostLoginGate'
import { ConsumerRouteGuard } from '../auth/ConsumerRouteGuard'
import { AppLayout } from '../components/layout/AppLayout'
import { DocumentFrame } from '../components/layout/DocumentFrame'
import { PublicLayout } from '../components/public/PublicLayout'
import { AuthPublicLayout } from '../components/public/AuthPublicLayout'
import {
  CatalogDetailPage,
  CatalogListPage,
  IndependentDashboardPage,
  IndependentPlansPage,
  ProfilePage,
} from '../pages/independent'
import { AdminCatalogPage } from '../pages/admin/AdminCatalogPage'
import { AdminPricingPlansPage } from '../pages/admin/AdminPricingPlansPage'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminPurchasesPage } from '../pages/admin/AdminPurchasesPage'
import { useRbac } from '../rbac/useRbac'
import { LoginPage } from '../pages/LoginPage'
import { RequestsPage } from '../pages/RequestsPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { RegisterPage } from '../pages/RegisterPage'
import { SelectOrganizationPage } from '../pages/SelectOrganizationPage'
import { UsersPage } from '../pages/UsersPage'
import { HomePage } from '../pages/public/HomePage'
import { AboutPage } from '../pages/public/AboutPage'
import { ContactPage } from '../pages/public/ContactPage'
import { ServicesPage } from '../pages/public/ServicesPage'
import { PlatformPage } from '../pages/public/PlatformPage'
import { StoryPage } from '../pages/public/StoryPage'
import { PricingPage } from '../pages/public/PricingPage'

export const router = createBrowserRouter([
  {
    element: <DocumentFrame />,
    children: [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/platform', element: <PlatformPage /> },
      { path: '/story', element: <StoryPage /> },
      { path: '/pricing', element: <PricingPage /> },
    ],
  },
  {
    element: <AuthPublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/app', element: <PostLoginGate /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/select-organization', element: <SelectOrganizationPage /> },
      {
        element: <WorkspaceContextGate />,
        children: [
          {
            element: <ConsumerRouteGuard />,
            children: [
              { path: '/dashboard', element: <RoleAwareDashboard /> },
              { path: '/catalog/products', element: <CatalogProductsPage /> },
              { path: '/catalog/courses', element: <CatalogCoursesPage /> },
              { path: '/catalog/books', element: <CatalogBooksPage /> },
              { path: '/catalog/resources', element: <CatalogResourcesPage /> },
              { path: '/catalog/:type/:slug', element: <CatalogDetailPage /> },
              { path: '/favorites', element: <FavoritesPage /> },
              { path: '/my-purchases', element: <MyPurchasesPage /> },
              { path: '/my-courses', element: <MyCoursesPage /> },
              { path: '/my-books', element: <MyBooksPage /> },
              { path: '/my-resources', element: <MyResourcesPage /> },
              { path: '/plans', element: <IndependentPlansPage /> },
            ],
          },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/admin/catalog', element: <AdminCatalogPage /> },
          { path: '/admin/pricing-plans', element: <AdminPricingPlansPage /> },
          { path: '/admin/purchases', element: <AdminPurchasesPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/requests', element: <RequestsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

function RoleAwareDashboard() {
  const { isConsumerMode, primaryRole, isSuperuser } = useRbac()
  if (isSuperuser || primaryRole === 'super_admin') return <AdminDashboardPage />
  if (isConsumerMode || primaryRole === 'independent_user') return <IndependentDashboardPage />
  // Avoid infinite <Navigate to="/dashboard" /> when role metadata is missing; send to onboarding.
  return <Navigate to="/onboarding" replace />
}

function CatalogProductsPage() {
  return (
    <CatalogListPage
      type="product"
      titleKey="catalog.pages.products.title"
      subtitleKey="catalog.pages.products.subtitle"
      catalogBasePath="/catalog/products"
    />
  )
}

function CatalogCoursesPage() {
  return (
    <CatalogListPage
      type="course"
      titleKey="catalog.pages.courses.title"
      subtitleKey="catalog.pages.courses.subtitle"
      catalogBasePath="/catalog/courses"
    />
  )
}

function CatalogBooksPage() {
  return (
    <CatalogListPage
      type="book"
      titleKey="catalog.pages.books.title"
      subtitleKey="catalog.pages.books.subtitle"
      catalogBasePath="/catalog/books"
    />
  )
}

function CatalogResourcesPage() {
  return (
    <CatalogListPage
      type="resource"
      titleKey="catalog.pages.resources.title"
      subtitleKey="catalog.pages.resources.subtitle"
      catalogBasePath="/catalog/resources"
    />
  )
}

function FavoritesPage() {
  return (
    <CatalogListPage
      mode="favorites"
      titleKey="catalog.pages.favorites.title"
      subtitleKey="catalog.pages.favorites.subtitle"
      catalogBasePath="/favorites"
    />
  )
}

function MyPurchasesPage() {
  return (
    <CatalogListPage
      mode="purchases"
      titleKey="catalog.pages.purchases.title"
      subtitleKey="catalog.pages.purchases.subtitle"
      catalogBasePath="/my-purchases"
    />
  )
}

function MyCoursesPage() {
  return (
    <CatalogListPage
      mode="myCourses"
      titleKey="catalog.pages.myCourses.title"
      subtitleKey="catalog.pages.myCourses.subtitle"
      catalogBasePath="/my-courses"
    />
  )
}

function MyBooksPage() {
  return (
    <CatalogListPage
      mode="myBooks"
      titleKey="catalog.pages.myBooks.title"
      subtitleKey="catalog.pages.myBooks.subtitle"
      catalogBasePath="/my-books"
    />
  )
}

function MyResourcesPage() {
  return (
    <CatalogListPage
      mode="myResources"
      titleKey="catalog.pages.myResources.title"
      subtitleKey="catalog.pages.myResources.subtitle"
      catalogBasePath="/my-resources"
    />
  )
}
