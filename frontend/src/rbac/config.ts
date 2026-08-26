/** MVP navigation and RBAC (super_admin + independent_user only). */

import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  Boxes,
  Building2,
  CalendarClock,
  CircleCheckBig,
  CircleUser,
  ClipboardCheck,
  Clock,
  CreditCard,
  Download,
  Gift,
  GraduationCap,
  Heart,
  History,
  KeyRound,
  LayoutDashboard,
  Library,
  Megaphone,
  MessageSquare,
  Package,
  PackageCheck,
  Receipt,
  Activity,
  Newspaper,
  ShoppingBag,
  Users,
  Wrench,
} from 'lucide-react'

export type PlatformRole = 'super_admin' | 'org_owner' | 'org_admin' | 'independent_user'

export type NavItemDef = {
  to: string
  labelKey: string
  icon: LucideIcon
  anyPermission?: string[]
}

export type NavGroupDef = {
  labelKey: string
  items: NavItemDef[]
}

export const INDEPENDENT_NAV_GROUPS: NavGroupDef[] = [
  {
    labelKey: 'private.nav.groups.command',
    items: [{ to: '/dashboard', labelKey: 'private.nav.dashboard', icon: LayoutDashboard }],
  },
  {
    labelKey: 'private.nav.groups.catalogs',
    items: [
      { to: '/catalog/products', labelKey: 'private.nav.catalogProducts', icon: Package },
      { to: '/catalog/courses', labelKey: 'private.nav.catalogCourses', icon: GraduationCap },
      { to: '/catalog/books', labelKey: 'private.nav.catalogBooks', icon: BookOpen },
      { to: '/catalog/resources', labelKey: 'private.nav.catalogResources', icon: Download },
    ],
  },
  {
    labelKey: 'private.nav.groups.library',
    items: [
      { to: '/favorites', labelKey: 'private.nav.favorites', icon: Heart },
      { to: '/my-purchases', labelKey: 'private.nav.myPurchases', icon: ShoppingBag },
      { to: '/my-products', labelKey: 'private.nav.myProducts', icon: Package },
      { to: '/my-courses', labelKey: 'private.nav.myCourses', icon: CircleCheckBig },
      { to: '/my-books', labelKey: 'private.nav.myBooks', icon: Library },
      { to: '/my-resources', labelKey: 'private.nav.myResources', icon: PackageCheck },
      { to: '/test-execution', labelKey: 'private.nav.testExecution', icon: Activity },
      { to: '/booking', labelKey: 'private.nav.booking', icon: CalendarClock },
      { to: '/redeem-code', labelKey: 'private.nav.redeemCode', icon: KeyRound },
    ],
  },
  {
    labelKey: 'private.nav.groups.account',
    items: [
      { to: '/onboarding', labelKey: 'private.nav.joinOrganization', icon: Building2 },
      { to: '/requests', labelKey: 'private.nav.requests', icon: Clock, anyPermission: ['requests.create', 'requests.read_own'] },
      { to: '/profile', labelKey: 'private.nav.profile', icon: CircleUser, anyPermission: ['profile.update_self'] },
    ],
  },
]

export const SUPER_ADMIN_NAV_GROUPS: NavGroupDef[] = [
  {
    labelKey: 'private.nav.groups.command',
    items: [{ to: '/dashboard', labelKey: 'private.nav.dashboard', icon: LayoutDashboard }],
  },
  {
    labelKey: 'private.nav.groups.admin',
    items: [
      { to: '/admin/catalog', labelKey: 'private.nav.catalogManage', icon: Boxes, anyPermission: ['catalog.manage'] },
      { to: '/admin/blog', labelKey: 'private.nav.blogManage', icon: Newspaper, anyPermission: ['catalog.manage'] },
      { to: '/users', labelKey: 'private.nav.users', icon: Users, anyPermission: ['users.read'] },
      { to: '/admin/purchases', labelKey: 'private.nav.purchasesAdmin', icon: Receipt, anyPermission: ['purchases.read_all'] },
      { to: '/requests', labelKey: 'private.nav.requestsReview', icon: ClipboardCheck, anyPermission: ['requests.read'] },
      { to: '/admin/organizations', labelKey: 'private.nav.organizations', icon: Building2, anyPermission: ['organizations.read'] },
      { to: '/admin/services', labelKey: 'private.nav.services', icon: Wrench, anyPermission: ['products.manage'] },
      { to: '/admin/plans', labelKey: 'private.nav.plans', icon: CreditCard, anyPermission: ['billing.manage'] },
      { to: '/admin/suggestions', labelKey: 'private.nav.suggestions', icon: MessageSquare, anyPermission: ['suggestions.manage'] },
      { to: '/admin/audit-log', labelKey: 'private.nav.auditLog', icon: History, anyPermission: ['audit.read'] },
      { to: '/admin/book-redemptions', labelKey: 'private.nav.bookRedemptions', icon: Gift, anyPermission: ['catalog.manage'] },
      { to: '/admin/announcements', labelKey: 'private.nav.announcements', icon: Megaphone, anyPermission: ['platform.read'] },
      { to: '/admin/system', labelKey: 'private.nav.system', icon: Activity, anyPermission: ['platform.read'] },
      { to: '/admin/booking', labelKey: 'private.nav.bookingAdmin', icon: CalendarClock, anyPermission: ['catalog.manage'] },
    ],
  },
  {
    labelKey: 'private.nav.groups.account',
    items: [
      { to: '/profile', labelKey: 'private.nav.profile', icon: CircleUser, anyPermission: ['profile.update_self'] },
    ],
  },
]

export const ORGANIZATION_NAV_GROUPS: NavGroupDef[] = [
  {
    labelKey: 'private.nav.groups.command',
    items: [{ to: '/dashboard', labelKey: 'private.nav.dashboard', icon: LayoutDashboard }],
  },
  {
    labelKey: 'private.nav.groups.organization',
    items: [
      { to: '/organization/catalog', labelKey: 'private.nav.orgCatalog', icon: Boxes, anyPermission: ['products.assign', 'catalog.read'] },
      { to: '/organization/grant', labelKey: 'private.nav.orgGrant', icon: Gift, anyPermission: ['products.assign'] },
      { to: '/organization/members', labelKey: 'private.nav.orgMembers', icon: Users, anyPermission: ['users.read'] },
      { to: '/users', labelKey: 'private.nav.users', icon: Users, anyPermission: ['users.read'] },
    ],
  },
  {
    labelKey: 'private.nav.groups.account',
    items: [
      { to: '/requests', labelKey: 'private.nav.requests', icon: Clock, anyPermission: ['requests.read', 'requests.create'] },
      { to: '/profile', labelKey: 'private.nav.profile', icon: CircleUser, anyPermission: ['profile.update_self'] },
    ],
  },
]

export const NAV_GROUPS = SUPER_ADMIN_NAV_GROUPS

export const ROLE_NAV_ROUTES: Record<PlatformRole, string[]> = {
  super_admin: [
    '/dashboard',
    '/admin/catalog',
    '/admin/blog',
    '/users',
    '/admin/purchases',
    '/requests',
    '/admin/organizations',
    '/admin/services',
    '/admin/plans',
    '/admin/suggestions',
    '/admin/audit-log',
    '/admin/book-redemptions',
    '/admin/announcements',
    '/admin/system',
    '/admin/booking',
    '/profile',
  ],
  org_owner: ['/dashboard', '/organization/catalog', '/organization/grant', '/organization/members', '/users', '/requests', '/profile'],
  org_admin: ['/dashboard', '/organization/catalog', '/organization/grant', '/organization/members', '/users', '/requests', '/profile'],
  independent_user: [
    '/dashboard',
    '/onboarding',
    '/catalog/products',
    '/catalog/courses',
    '/catalog/books',
    '/catalog/resources',
    '/favorites',
    '/my-purchases',
    '/my-products',
    '/my-courses',
    '/my-books',
    '/my-resources',
    '/test-execution',
    '/booking',
    '/redeem-code',
    '/requests',
    '/profile',
  ],
}

export const ACTION_PERMISSIONS = {
  manageCatalog: ['catalog.manage'],
  requestAccess: ['requests.create'],
  approveRequest: ['requests.approve'],
  createUser: ['users.create'],
  createProduct: ['catalog.manage'],
  createProductDraft: ['catalog.manage'],
} as const

export function resolvePrimaryRole(roleCodes: string[]): PlatformRole | null {
  const priority: PlatformRole[] = ['super_admin', 'org_owner', 'org_admin', 'independent_user']
  const set = new Set(roleCodes)
  for (const code of priority) {
    if (set.has(code)) return code
  }
  return null
}

export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  const set = new Set(permissions)
  return required.some((p) => set.has(p))
}

export function filterNavGroups(
  groups: NavGroupDef[],
  opts: { primaryRole: PlatformRole | null; permissions: string[]; isSuperuser: boolean },
): NavGroupDef[] {
  const { primaryRole, permissions, isSuperuser } = opts
  const allowedRoutes = primaryRole ? new Set(ROLE_NAV_ROUTES[primaryRole]) : new Set<string>()

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isSuperuser) return true
        if (primaryRole && !allowedRoutes.has(item.to)) return false
        if (!item.anyPermission?.length) return true
        return hasAnyPermission(permissions, item.anyPermission)
      }),
    }))
    .filter((g) => g.items.length > 0)
}
