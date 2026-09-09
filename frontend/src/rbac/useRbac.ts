import { useMemo } from 'react'

import { isConsumerExperience } from '../auth/consumerOrg'

import { useAuth } from '../hooks/useAuth'

import {

  ACTION_PERMISSIONS,

  filterNavGroups,

  hasAnyPermission,

  INDEPENDENT_NAV_GROUPS,

  ORGANIZATION_NAV_GROUPS,

  resolvePrimaryRole,

  SUPER_ADMIN_NAV_GROUPS,

  type PlatformRole,

} from './config'



// Composes useAuth()'s raw user/permissions with config.ts's pure
// role/permission logic into the actual UI-facing surface: which nav
// groups to render, and whether the current user can do a given action.
// isSuperuser always short-circuits both `can` and `hasPermission` — a
// super_admin is never blocked by a missing permission code.
export function useRbac() {

  const { currentUser } = useAuth()



  const roleCodes = currentUser?.role_codes ?? []

  const permissions = useMemo(() => currentUser?.permissions ?? [], [currentUser])

  const isSuperuser = Boolean(currentUser?.is_superuser)

  const primaryRole =

    (currentUser?.primary_role as PlatformRole | null | undefined) ??

    resolvePrimaryRole(roleCodes)



  const isConsumerMode = isConsumerExperience(currentUser, primaryRole)



  // Which nav-group set to filter is picked by workspace kind, not by
  // primaryRole alone — isConsumerMode can be true even when primaryRole
  // hasn't resolved to 'independent_user' yet (see isConsumerExperience),
  // so it's checked as its own branch ahead of the plain role check.
  const navGroups = useMemo(() => {

    if (isSuperuser || primaryRole === 'super_admin') {

      return filterNavGroups(SUPER_ADMIN_NAV_GROUPS, { primaryRole: 'super_admin', permissions, isSuperuser })

    }

    if (isConsumerMode || primaryRole === 'independent_user') {

      return filterNavGroups(INDEPENDENT_NAV_GROUPS, {

        primaryRole: 'independent_user',

        permissions,

        isSuperuser,

      })

    }

    if (primaryRole === 'org_owner' || primaryRole === 'org_admin') {

      return filterNavGroups(ORGANIZATION_NAV_GROUPS, {

        primaryRole,

        permissions,

        isSuperuser,

      })

    }

    return []

  }, [isConsumerMode, primaryRole, permissions, isSuperuser])



  const can = (action: keyof typeof ACTION_PERMISSIONS) =>

    isSuperuser || hasAnyPermission(permissions, [...ACTION_PERMISSIONS[action]])



  return {

    roleCodes,

    permissions,

    primaryRole,

    isSuperuser,

    isIndependentUser: Boolean(currentUser?.is_independent_user),

    isConsumerMode,

    isOrgWorkspace: primaryRole === 'org_owner' || primaryRole === 'org_admin',

    navGroups,

    can,

    hasPermission: (code: string) => isSuperuser || permissions.includes(code),

  }

}


