import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { WorkspaceContextGate } from '../auth/WorkspaceContextGate'
import { PostLoginGate } from '../auth/PostLoginGate'
import { ConsumerRouteGuard } from '../auth/ConsumerRouteGuard'
import { AppLayout } from '../components/layout/AppLayout'
import { PublicLayout } from '../components/public/PublicLayout'
import { AuthPublicLayout } from '../components/public/AuthPublicLayout'
// Every leaf page is React.lazy()'d in lazyPages.tsx so the initial bundle
// only ships the app shell (layouts, guards, router) plus whichever page
// the user actually requested — the route tree used to load as a single
// ~1.5MB bundle regardless of which page was visited. Kept in its own
// module since a file mixing component exports with the non-component
// `router` export below breaks Fast Refresh.
import {
  AboutPage,
  AdminAnnouncementsPage,
  AdminAuditLogPage,
  AdminBlogEditorPage,
  AdminBlogPage,
  AdminBookRedemptionsPage,
  AdminCatalogCategoriesPage,
  AdminCatalogPage,
  AdminDataResetPage,
  AdminErrorLogsPage,
  AdminPurchasesPage,
  AdminSuggestionsPage,
  AdminSystemStatusPage,
  BlogListPage,
  BlogPostPage,
  CatalogDetailPage,
  ContactPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  NotFoundPage,
  OnboardingPage,
  OrganizationCatalogPage,
  OrganizationGrantPage,
  OrganizationMembersPage,
  OrganizationsPage,
  PlansPage,
  PlatformPage,
  PricingPage,
  PrivacyPolicyPage,
  ProfilePage,
  PublicRedeemCodePage,
  RedeemCodePage,
  RegisterPage,
  RequestsPage,
  ResetPasswordPage,
  SelectOrganizationPage,
  ServicesAdminPage,
  ServicesPage,
  StoryPage,
  TermsPage,
  UsersPage,
  VerifyEmailPage,
} from './lazyPages'
// Small role/param-dispatch wrappers around lazy pages — see routeHelpers.tsx
// for why these live in their own module too.
import {
  CatalogBooksPage,
  CatalogCoursesPage,
  CatalogProductsPage,
  CatalogResourcesPage,
  FavoritesPage,
  MyBooksPage,
  MyCoursesPage,
  MyPurchasesPage,
  MyResourcesPage,
  RoleAwareDashboard,
} from './routeHelpers'

export const router = createBrowserRouter([
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
      { path: '/redeem', element: <PublicRedeemCodePage /> },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
      { path: '/terms-of-service', element: <TermsPage /> },
    ],
  },
  {
    element: <AuthPublicLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
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
              { path: '/redeem-code', element: <RedeemCodePage /> },
            ],
          },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/admin/catalog', element: <AdminCatalogPage /> },
          { path: '/admin/blog', element: <AdminBlogPage /> },
          { path: '/admin/blog/new', element: <AdminBlogEditorPage /> },
          { path: '/admin/blog/:id/edit', element: <AdminBlogEditorPage /> },
          { path: '/admin/catalog-categories', element: <AdminCatalogCategoriesPage /> },
          { path: '/admin/purchases', element: <AdminPurchasesPage /> },
          { path: '/admin/organizations', element: <OrganizationsPage /> },
          { path: '/admin/services', element: <ServicesAdminPage /> },
          { path: '/admin/plans', element: <PlansPage /> },
          { path: '/admin/suggestions', element: <AdminSuggestionsPage /> },
          { path: '/admin/audit-log', element: <AdminAuditLogPage /> },
          { path: '/admin/book-redemptions', element: <AdminBookRedemptionsPage /> },
          { path: '/admin/announcements', element: <AdminAnnouncementsPage /> },
          { path: '/admin/system-status', element: <AdminSystemStatusPage /> },
          { path: '/admin/error-logs', element: <AdminErrorLogsPage /> },
          { path: '/admin/data-reset', element: <AdminDataResetPage /> },
          { path: '/organization/catalog', element: <OrganizationCatalogPage /> },
          { path: '/organization/grant', element: <OrganizationGrantPage /> },
          { path: '/organization/members', element: <OrganizationMembersPage /> },
          { path: '/users', element: <UsersPage /> },
          { path: '/requests', element: <RequestsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
