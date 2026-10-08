import type { Organization, OrganizationType } from '../types/organization.types'

export type FormValues = {
  organization_name: string
  organization_slug: string
  organization_type: OrganizationType
}

export type SuperAdminViewMode = 'cards' | 'table'

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function organizationTypeLabel(t: (k: string) => string, type: string | null | undefined) {
  if (type === 'individual' || type === 'business' || type === 'enterprise' || type === 'academy') {
    return t(`organizationsPage.types.${type}`) as string
  }
  return t('organizationsPage.types.unknown') as string
}

// These four helpers describe the viewer's relationship to one
// organization, from broadest to narrowest:
//  - isMyOrganization: the viewer owns it OR has ANY membership at all
//    (including a plain, non-admin member, or a pending invite).
//  - isManagedOrganization: the narrower subset of that — owner, or holds
//    org_owner/org_admin — i.e. can actually administer it, not just
//    belong to it.
// relationshipLabel/relationshipKey both derive from these two checks, but
// aren't identical: the label further splits "mine" into
// managed/invited/member for display, while the key only distinguishes
// managed/mine/platform/none (used for the super-admin filter dropdown,
// which doesn't need the member-vs-invited distinction).
export function isManagedOrganization(org: Organization, currentUserUuid: string | null) {
  if (!currentUserUuid) return false
  return (
    org.owner_user_uuid === currentUserUuid ||
    Boolean(org.current_user_role_codes?.some((role) => role === 'org_owner' || role === 'org_admin'))
  )
}

export function isMyOrganization(org: Organization, currentUserUuid: string | null) {
  if (!currentUserUuid) return false
  return org.owner_user_uuid === currentUserUuid || Boolean(org.current_user_membership_status)
}

export function relationshipLabel(
  t: (k: string) => string,
  org: Organization,
  currentUserUuid: string | null,
  isSuperAdmin: boolean,
) {
  if (isMyOrganization(org, currentUserUuid)) {
    if (isManagedOrganization(org, currentUserUuid)) return t('organizationsPage.relationship.managed') as string
    if (org.current_user_membership_status === 'invited') return t('organizationsPage.relationship.invited') as string
    return t('organizationsPage.relationship.member') as string
  }
  // Not "mine" at all — a super admin sees every organization on the
  // platform regardless of membership, so that's labeled distinctly from
  // "none" (which is what a non-superuser would see here, though in
  // practice a non-superuser's list is already scoped to orgs they belong
  // to, so this branch is mostly a super-admin-only code path).
  return isSuperAdmin
    ? (t('organizationsPage.relationship.platformManaged') as string)
    : (t('organizationsPage.relationship.none') as string)
}

export function relationshipKey(org: Organization, currentUserUuid: string | null, isSuperAdmin: boolean) {
  if (isManagedOrganization(org, currentUserUuid)) return 'managed'
  if (isMyOrganization(org, currentUserUuid)) return 'mine'
  return isSuperAdmin ? 'platform' : 'none'
}
