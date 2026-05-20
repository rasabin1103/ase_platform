/** MVP navigation and RBAC (super_admin + independent_user only). */



export type PlatformRole = 'super_admin' | 'independent_user'



export type NavItemDef = {

  to: string

  labelKey: string

  icon: string

  anyPermission?: string[]

}



export type NavGroupDef = {

  labelKey: string

  items: NavItemDef[]

}



export const INDEPENDENT_NAV_GROUPS: NavGroupDef[] = [

  {

    labelKey: 'private.nav.groups.command',

    items: [{ to: '/dashboard', labelKey: 'private.nav.dashboard', icon: '◈' }],

  },

  {

    labelKey: 'private.nav.groups.catalogs',

    items: [

      { to: '/catalog/products', labelKey: 'private.nav.catalogProducts', icon: '◇' },

      { to: '/catalog/courses', labelKey: 'private.nav.catalogCourses', icon: '✦' },

      { to: '/catalog/books', labelKey: 'private.nav.catalogBooks', icon: '📖' },

      { to: '/catalog/resources', labelKey: 'private.nav.catalogResources', icon: '⬇' },

    ],

  },

  {

    labelKey: 'private.nav.groups.library',

    items: [

      { to: '/favorites', labelKey: 'private.nav.favorites', icon: '♥' },

      { to: '/my-purchases', labelKey: 'private.nav.myPurchases', icon: '🛒' },

      { to: '/my-courses', labelKey: 'private.nav.myCourses', icon: '✓' },

      { to: '/my-books', labelKey: 'private.nav.myBooks', icon: '📚' },

      { to: '/my-resources', labelKey: 'private.nav.myResources', icon: '📦' },

    ],

  },

  {

    labelKey: 'private.nav.groups.account',

    items: [

      { to: '/requests', labelKey: 'private.nav.requests', icon: '◐', anyPermission: ['requests.create', 'requests.read_own'] },

      { to: '/profile', labelKey: 'private.nav.profile', icon: '◎', anyPermission: ['profile.update_self'] },

    ],

  },

]



export const SUPER_ADMIN_NAV_GROUPS: NavGroupDef[] = [

  {

    labelKey: 'private.nav.groups.command',

    items: [{ to: '/dashboard', labelKey: 'private.nav.dashboard', icon: '◈' }],

  },

  {

    labelKey: 'private.nav.groups.admin',

    items: [

      { to: '/admin/catalog', labelKey: 'private.nav.catalogManage', icon: '◇', anyPermission: ['catalog.manage'] },

      { to: '/admin/pricing-plans', labelKey: 'private.nav.pricingPlansManage', icon: '€', anyPermission: ['catalog.manage'] },

      { to: '/users', labelKey: 'private.nav.users', icon: '◉', anyPermission: ['users.read'] },

      { to: '/admin/purchases', labelKey: 'private.nav.purchasesAdmin', icon: '🛒', anyPermission: ['purchases.read_all'] },

      { to: '/requests', labelKey: 'private.nav.requestsReview', icon: '◐', anyPermission: ['requests.read'] },

    ],

  },

  {

    labelKey: 'private.nav.groups.account',

    items: [

      { to: '/profile', labelKey: 'private.nav.profile', icon: '◎', anyPermission: ['profile.update_self'] },

    ],

  },

]



export const NAV_GROUPS = SUPER_ADMIN_NAV_GROUPS



export const ROLE_NAV_ROUTES: Record<PlatformRole, string[]> = {

  super_admin: ['/dashboard', '/admin/catalog', '/admin/pricing-plans', '/users', '/admin/purchases', '/requests', '/profile'],

  independent_user: [

    '/dashboard',

    '/catalog/products',

    '/catalog/courses',

    '/catalog/books',

    '/catalog/resources',

    '/favorites',

    '/my-purchases',

    '/my-courses',

    '/my-books',

    '/my-resources',

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

  const priority: PlatformRole[] = ['super_admin', 'independent_user']

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


