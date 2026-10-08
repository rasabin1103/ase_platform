import { Badge } from '../components/ui/Badge'
import type { User } from '../types/user.types'

export type CreateValues = {
  email: string
  plain_password: string
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  status: 'active' | 'suspended' | 'deleted'
}

export type EditValues = {
  email?: string | ''
  plain_password?: string | ''
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  status?: 'active' | 'suspended' | 'deleted'
}

export type UsersViewMode = 'cards' | 'table'

export function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function displayName(u: User) {
  return u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

export function renderStatusBadge(t: (k: string) => string, status: string | null) {
  if (!status) return <span className="text-ase-muted">{t('usersPage.common.na') as string}</span>
  const key =
    status === 'active' || status === 'suspended' || status === 'deleted'
      ? (`usersPage.status.${status}` as const)
      : ('usersPage.status.unknown' as const)
  const variant =
    status === 'active' ? 'success' : status === 'suspended' ? 'warning' : status === 'deleted' ? 'error' : 'default'
  return <Badge variant={variant}>{t(key) as string}</Badge>
}

export function initials(u: User) {
  const name = u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ')
  const source = (name || u.email || '').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const two = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return two.toUpperCase()
}

export function twoFactorStatusLabel(t: (k: string) => string, user: User): string {
  if (user.two_factor_enabled) return t('usersPage.twoFactor.enabled') as string
  if (user.two_factor_deadline_at) {
    const date = new Date(user.two_factor_deadline_at).toLocaleDateString()
    return String(t('usersPage.twoFactor.deadline')).replace('{{date}}', date)
  }
  return t('usersPage.twoFactor.disabled') as string
}

export function friendlyCreateUserError(t: (k: string) => string, error: unknown): string {
  const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail
  if (detail === 'Email already exists') {
    return t('usersPage.create.duplicateEmail')
  }
  return t('usersPage.create.error')
}
