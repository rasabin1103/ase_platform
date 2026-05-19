import { useMemo } from 'react'

import { isConsumerExperience } from '../auth/consumerOrg'

import { useAuth } from '../hooks/useAuth'

import {

  ACTION_PERMISSIONS,

  filterNavGroups,

  hasAnyPermission,

  INDEPENDENT_NAV_GROUPS,

  resolvePrimaryRole,

  SUPER_ADMIN_NAV_GROUPS,

  type PlatformRole,

} from './config'



export function useRbac() {

  const { currentUser } = useAuth()



  const roleCodes = currentUser?.role_codes ?? []

  const permissions = currentUser?.permissions ?? []

  const isSuperuser = Boolean(currentUser?.is_superuser)

  const primaryRole =

    (currentUser?.primary_role as PlatformRole | null | undefined) ??

    resolvePrimaryRole(roleCodes)



  const isConsumerMode = isConsumerExperience(currentUser, primaryRole)



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

    navGroups,

    can,

    hasPermission: (code: string) => isSuperuser || permissions.includes(code),

  }

}


