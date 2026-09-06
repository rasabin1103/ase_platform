import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { WorkspaceContextGate } from '../auth/WorkspaceContextGate'
import { PostLoginGate } from '../auth/PostLoginGate'
import { ConsumerRouteGuard } from '../auth/ConsumerRouteGuard'
import { RequirePermission } from '../rbac/RequirePermission'
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
  AdminBookingPage,
  AdminBlogEditorPage,
  AdminBlogPage,
  AdminBookRedemptionsPage,
  AdminCatalogPage,
  AdminPurchasesPage,
  AdminSuggestionsPage,
  AdminSystemPage,
  BlogListPage,
  BlogPostPage,
  CatalogDetailPage,
  ContactPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  MyPurchasesPage,
  NewsletterUnsubscribePage,
  NotFoundPage,
  OnboardingPage,
  OrganizationCatalogPage,
  OrganizationGrantPage,
  OrganizationMembersPage,
  OrganizationsPage,
  PlansPage,
  PlatformPage,
  PreferencesSurveyPage,
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
  TestExecutionPage,
  BookingPage,
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
  MyLibraryPage,
  MyProductsPage,
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
      { path: '/newsletter/unsubscribe', element: <NewsletterUnsubscribePage /> },
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
              { path: '/preferencias', element: <PreferencesSurveyPage /> },
              { path: '/my-library', element: <MyLibraryPage /> },
              { path: '/my-products', element: <MyProductsPage /> },
              { path: '/my-courses', element: <MyCoursesPage /> },
              { path: '/my-books', element: <MyBooksPage /> },
              { path: '/my-resources', element: <MyResourcesPage /> },
              { path: '/redeem-code', element: <RedeemCodePage /> },
              { path: '/test-execution', element: <TestExecutionPage /> },
              { path: '/booking', element: <BookingPage /> },
            ],
          },
          // Self-service — every authenticated role manages its own
          // profile, so this stays ungated beyond being logged in.
          { path: '/profile', element: <ProfilePage /> },

          // Every group below mirrors the `anyPermission` already declared
          // for this route's nav entry in rbac/config.ts (SUPER_ADMIN_NAV_GROUPS /
          // ORGANIZATION_NAV_GROUPS), each verified against the real
          // `require_permission(...)` dependency on that page's backend
          // endpoint. A role that would never see the link in its own
          // sidebar is now also blocked from reaching the page by typing
          // the URL directly — see RequirePermission's docstring for the
          // /users incident this closes.
          {
            element: <RequirePermission anyOf={['catalog.manage']} />,
            children: [
              { path: '/admin/catalog', element: <AdminCatalogPage /> },
              { path: '/admin/blog', element: <AdminBlogPage /> },
              { path: '/admin/blog/new', element: <AdminBlogEditorPage /> },
              { path: '/admin/blog/:id/edit', element: <AdminBlogEditorPage /> },
              { path: '/admin/book-redemptions', element: <AdminBookRedemptionsPage /> },
              { path: '/admin/booking', element: <AdminBookingPage /> },
            ],
          },
          {
            element: <RequirePermission anyOf={['users.read']} />,
            children: [
              { path: '/users', element: <UsersPage /> },
              { path: '/organization/members', element: <OrganizationMembersPage /> },
            ],
          },
          {
            element: <RequirePermission anyOf={['purchases.read_all']} />,
            children: [{ path: '/admin/purchases', element: <AdminPurchasesPage /> }],
          },
          {
            element: <RequirePermission anyOf={['organizations.read']} />,
            children: [{ path: '/admin/organizations', element: <OrganizationsPage /> }],
          },
          {
            element: <RequirePermission anyOf={['products.manage']} />,
            children: [{ path: '/admin/services', element: <ServicesAdminPage /> }],
          },
          {
            element: <RequirePermission anyOf={['billing.manage']} />,
            children: [{ path: '/admin/plans', element: <PlansPage /> }],
          },
          {
            element: <RequirePermission anyOf={['suggestions.manage']} />,
            children: [{ path: '/admin/suggestions', element: <AdminSuggestionsPage /> }],
          },
          {
            element: <RequirePermission anyOf={['audit.read']} />,
            children: [{ path: '/admin/audit-log', element: <AdminAuditLogPage /> }],
          },
          {
            element: <RequirePermission anyOf={['platform.read']} />,
            children: [
              { path: '/admin/announcements', element: <AdminAnnouncementsPage /> },
              { path: '/admin/system', element: <AdminSystemPage /> },
            ],
          },
          {
            element: <RequirePermission anyOf={['products.assign', 'catalog.read']} />,
            children: [{ path: '/organization/catalog', element: <OrganizationCatalogPage /> }],
          },
          {
            element: <RequirePermission anyOf={['products.assign']} />,
            children: [{ path: '/organization/grant', element: <OrganizationGrantPage /> }],
          },
          {
            element: <RequirePermission anyOf={['requests.read', 'requests.create', 'requests.read_own']} />,
            children: [{ path: '/requests', element: <RequestsPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
