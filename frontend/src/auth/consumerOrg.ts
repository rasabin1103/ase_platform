import type { MeResponse } from '../types/auth.types'
import type { Organization } from '../types/organization.types'

/** Prefer personal workspace when user is in consumer / independent mode. */
export function pickConsumerOrganizationUuid(orgs: Organization[], me: MeResponse | null): string | null {
  if (!orgs.length) return null
  const consumer = Boolean(me?.consumer_mode ?? me?.is_independent_user)
  if (consumer) {
    const personal = orgs.find((o) => o.type === 'individual')
    if (personal) return personal.uuid
  }
  const platform = orgs.find((o) => o.slug === 'ase-platform' || o.type === 'enterprise')
  if (platform && (me?.primary_role === 'super_admin' || me?.is_superuser)) return platform.uuid
  return orgs[0]?.uuid ?? null
}

export function isConsumerExperience(me: MeResponse | null, primaryRole: string | null): boolean {
  return Boolean(me?.consumer_mode ?? me?.is_independent_user) || primaryRole === 'independent_user'
}
