import { lazy } from 'react'

// Every page below is React.lazy()'d so the initial bundle only ships the
// app shell (layouts, auth guards, router) plus whichever page the user
// actually requested — the route tree used to load as a single ~1.5MB
// bundle regardless of which page was visited. Each import() call becomes
// its own chunk, fetched on first navigation to that route and cached by
// the browser after that. Kept in its own module (rather than inline in
// router.tsx) because this file's only exports are components — mixing
// them with router.tsx's non-component `router` export breaks Fast Refresh.

// --- Public ---
export const HomePage = lazy(() => import('../pages/public/HomePage').then((m) => ({ default: m.HomePage })))
export const AboutPage = lazy(() => import('../pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
export const ContactPage = lazy(() => import('../pages/public/ContactPage').then((m) => ({ default: m.ContactPage })))
export const ServicesPage = lazy(() => import('../pages/public/ServicesPage').then((m) => ({ default: m.ServicesPage })))
export const PlatformPage = lazy(() => import('../pages/public/PlatformPage').then((m) => ({ default: m.PlatformPage })))
export const StoryPage = lazy(() => import('../pages/public/StoryPage').then((m) => ({ default: m.StoryPage })))
export const PricingPage = lazy(() => import('../pages/public/PricingPage').then((m) => ({ default: m.PricingPage })))
export const PublicRedeemCodePage = lazy(() =>
  import('../pages/public/RedeemCodePage').then((m) => ({ default: m.RedeemCodePage })),
)
export const BlogListPage = lazy(() => import('../pages/public/BlogListPage').then((m) => ({ default: m.BlogListPage })))
export const BlogPostPage = lazy(() => import('../pages/public/BlogPostPage').then((m) => ({ default: m.BlogPostPage })))
export const PrivacyPolicyPage = lazy(() =>
  import('../pages/public/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })),
)
export const TermsPage = lazy(() => import('../pages/public/TermsPage').then((m) => ({ default: m.TermsPage })))

// --- Auth (login/register/password) ---
export const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
export const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })))
export const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
export const ResetPasswordPage = lazy(() =>
  import('../pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
export const VerifyEmailPage = lazy(() => import('../pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })))

// --- Independent / consumer ---
export const CatalogListPage = lazy(() =>
  import('../pages/independent/CatalogListPage').then((m) => ({ default: m.CatalogListPage })),
)
export const CatalogDetailPage = lazy(() =>
  import('../pages/independent/CatalogDetailPage').then((m) => ({ default: m.CatalogDetailPage })),
)
export const IndependentDashboardPage = lazy(() =>
  import('../pages/independent/IndependentDashboardPage').then((m) => ({ default: m.IndependentDashboardPage })),
)
export const ProfilePage = lazy(() => import('../pages/independent/ProfilePage').then((m) => ({ default: m.ProfilePage })))
export const RedeemCodePage = lazy(() =>
  import('../pages/independent/RedeemCodePage').then((m) => ({ default: m.RedeemCodePage })),
)

// --- Organization ---
export const OrganizationDashboardPage = lazy(() =>
  import('../pages/organization/OrganizationDashboardPage').then((m) => ({ default: m.OrganizationDashboardPage })),
)
export const OrganizationCatalogPage = lazy(() =>
  import('../pages/organization/OrganizationCatalogPage').then((m) => ({ default: m.OrganizationCatalogPage })),
)
export const OrganizationGrantPage = lazy(() =>
  import('../pages/organization/OrganizationGrantPage').then((m) => ({ default: m.OrganizationGrantPage })),
)
export const OrganizationMembersPage = lazy(() =>
  import('../pages/organization/OrganizationMembersPage').then((m) => ({ default: m.OrganizationMembersPage })),
)

// --- Admin ---
export const AdminCatalogPage = lazy(() =>
  import('../pages/admin/AdminCatalogPage').then((m) => ({ default: m.AdminCatalogPage })),
)
export const AdminBlogPage = lazy(() => import('../pages/admin/AdminBlogPage').then((m) => ({ default: m.AdminBlogPage })))
export const AdminBlogEditorPage = lazy(() =>
  import('../pages/admin/AdminBlogEditorPage').then((m) => ({ default: m.AdminBlogEditorPage })),
)
export const AdminCatalogCategoriesPage = lazy(() =>
  import('../pages/admin/AdminCatalogCategoriesPage').then((m) => ({ default: m.AdminCatalogCategoriesPage })),
)
export const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
export const AdminPurchasesPage = lazy(() =>
  import('../pages/admin/AdminPurchasesPage').then((m) => ({ default: m.AdminPurchasesPage })),
)
export const AdminAuditLogPage = lazy(() =>
  import('../pages/admin/AdminAuditLogPage').then((m) => ({ default: m.AdminAuditLogPage })),
)
export const AdminBookRedemptionsPage = lazy(() =>
  import('../pages/admin/AdminBookRedemptionsPage').then((m) => ({ default: m.AdminBookRedemptionsPage })),
)
export const AdminAnnouncementsPage = lazy(() =>
  import('../pages/admin/AdminAnnouncementsPage').then((m) => ({ default: m.AdminAnnouncementsPage })),
)
export const AdminSystemStatusPage = lazy(() =>
  import('../pages/admin/AdminSystemStatusPage').then((m) => ({ default: m.AdminSystemStatusPage })),
)
export const AdminErrorLogsPage = lazy(() =>
  import('../pages/admin/AdminErrorLogsPage').then((m) => ({ default: m.AdminErrorLogsPage })),
)
export const AdminDataResetPage = lazy(() =>
  import('../pages/admin/AdminDataResetPage').then((m) => ({ default: m.AdminDataResetPage })),
)
export const ServicesAdminPage = lazy(() =>
  import('../pages/admin/ServicesAdminPage').then((m) => ({ default: m.ServicesAdminPage })),
)
export const AdminSuggestionsPage = lazy(() =>
  import('../pages/admin/AdminSuggestionsPage').then((m) => ({ default: m.AdminSuggestionsPage })),
)

// --- Other top-level private pages ---
export const OrganizationsPage = lazy(() =>
  import('../pages/OrganizationsPage').then((m) => ({ default: m.OrganizationsPage })),
)
export const PlansPage = lazy(() => import('../pages/PlansPage').then((m) => ({ default: m.PlansPage })))
export const RequestsPage = lazy(() => import('../pages/RequestsPage').then((m) => ({ default: m.RequestsPage })))
export const OnboardingPage = lazy(() => import('../pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })))
export const SelectOrganizationPage = lazy(() =>
  import('../pages/SelectOrganizationPage').then((m) => ({ default: m.SelectOrganizationPage })),
)
export const UsersPage = lazy(() => import('../pages/UsersPage').then((m) => ({ default: m.UsersPage })))
export const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
