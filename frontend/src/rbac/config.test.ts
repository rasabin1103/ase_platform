import { describe, expect, it } from 'vitest'
import type { LucideIcon } from 'lucide-react'
import {
  filterNavGroups,
  hasAnyPermission,
  resolvePrimaryRole,
  type NavGroupDef,
} from './config'

// This file governs which nav items and admin actions every user in the
// app can see — a bug here silently shows/hides the wrong thing for every
// role at once, so it's worth covering directly rather than only through
// whichever page happens to render the sidebar.

// Nav items require a real LucideIcon component reference; these fixtures
// never render one, so a plain stub cast once here is simpler than
// satisfying ForwardRefExoticComponent's shape on every item below.
const StubIcon = (() => null) as unknown as LucideIcon

describe('resolvePrimaryRole', () => {
  it('picks super_admin over any other role the user also has', () => {
    expect(resolvePrimaryRole(['independent_user', 'super_admin'])).toBe('super_admin')
  })

  it('follows the documented priority order: super_admin > org_owner > org_admin > independent_user', () => {
    expect(resolvePrimaryRole(['org_admin', 'org_owner'])).toBe('org_owner')
    expect(resolvePrimaryRole(['independent_user', 'org_admin'])).toBe('org_admin')
  })

  it('returns null when none of the known role codes are present', () => {
    expect(resolvePrimaryRole(['some_other_role'])).toBeNull()
    expect(resolvePrimaryRole([])).toBeNull()
  })
})

describe('hasAnyPermission', () => {
  it('returns true when at least one required permission is present', () => {
    expect(hasAnyPermission(['catalog.read', 'users.read'], ['catalog.manage', 'users.read'])).toBe(true)
  })

  it('returns false when none of the required permissions are present', () => {
    expect(hasAnyPermission(['catalog.read'], ['catalog.manage'])).toBe(false)
  })

  it('returns false for an empty permission list', () => {
    expect(hasAnyPermission([], ['catalog.manage'])).toBe(false)
  })
})

describe('filterNavGroups', () => {
  const groups: NavGroupDef[] = [
    {
      labelKey: 'group.one',
      items: [
        { to: '/free-for-all', labelKey: 'nav.a', icon: StubIcon },
        { to: '/needs-permission', labelKey: 'nav.b', icon: StubIcon, anyPermission: ['catalog.manage'] },
      ],
    },
    {
      labelKey: 'group.two',
      items: [{ to: '/not-in-role-routes', labelKey: 'nav.c', icon: StubIcon }],
    },
  ]

  it('a superuser sees every item regardless of role or permissions', () => {
    const result = filterNavGroups(groups, { primaryRole: null, permissions: [], isSuperuser: true })
    const allPaths = result.flatMap((g) => g.items.map((i) => i.to))
    expect(allPaths).toEqual(['/free-for-all', '/needs-permission', '/not-in-role-routes'])
  })

  it('drops items outside the role\'s allowed route list, and items whose permission is missing', () => {
    const result = filterNavGroups(groups, {
      primaryRole: 'independent_user',
      permissions: [],
      isSuperuser: false,
    })
    const allPaths = result.flatMap((g) => g.items.map((i) => i.to))
    // '/free-for-all' isn't in independent_user's ROLE_NAV_ROUTES, and
    // '/needs-permission' requires a permission this user doesn't have —
    // both should be filtered out, leaving nothing (both groups drop out
    // entirely once empty).
    expect(allPaths).toEqual([])
  })

  it('keeps a permission-gated item once the required permission is granted', () => {
    // primaryRole: null skips the ROLE_NAV_ROUTES allowlist entirely (see
    // filterNavGroups: that check only applies `if (primaryRole && ...)`),
    // which isolates the permission check specifically instead of also
    // depending on these fixture paths being real routes in config.ts.
    const withoutPermission = filterNavGroups(groups, {
      primaryRole: null,
      permissions: [],
      isSuperuser: false,
    })
    expect(withoutPermission.flatMap((g) => g.items.map((i) => i.to))).toEqual([
      '/free-for-all',
      '/not-in-role-routes',
    ])

    const withPermission = filterNavGroups(groups, {
      primaryRole: null,
      permissions: ['catalog.manage'],
      isSuperuser: false,
    })
    expect(withPermission.flatMap((g) => g.items.map((i) => i.to))).toEqual([
      '/free-for-all',
      '/needs-permission',
      '/not-in-role-routes',
    ])
  })

  it('drops a group entirely once all of its items are filtered out', () => {
    const groupsWithOneFullyGated: NavGroupDef[] = [
      { labelKey: 'group.open', items: [{ to: '/open', labelKey: 'nav.open', icon: StubIcon }] },
      {
        labelKey: 'group.gated',
        items: [{ to: '/gated', labelKey: 'nav.gated', icon: StubIcon, anyPermission: ['catalog.manage'] }],
      },
    ]
    // primaryRole: null skips the route allowlist, isolating the
    // permission gate — 'group.gated' has nothing left once its one item
    // is filtered, so the whole group should disappear rather than come
    // back as an empty items: [] entry.
    const result = filterNavGroups(groupsWithOneFullyGated, {
      primaryRole: null,
      permissions: [],
      isSuperuser: false,
    })
    expect(result).toEqual([{ labelKey: 'group.open', items: groupsWithOneFullyGated[0].items }])
  })
})
