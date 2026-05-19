import type { PropsWithChildren, ReactNode } from 'react'
import { useRbac } from './useRbac'
import { ACTION_PERMISSIONS } from './config'

type CanProps = PropsWithChildren<{
  action?: keyof typeof ACTION_PERMISSIONS
  permission?: string
  fallback?: ReactNode
}>

export function Can({ action, permission, fallback = null, children }: CanProps) {
  const { can, hasPermission, isSuperuser } = useRbac()

  let allowed = isSuperuser
  if (!allowed && action) allowed = can(action)
  if (!allowed && permission) allowed = hasPermission(permission)

  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}
