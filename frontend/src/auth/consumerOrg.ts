import type { MeResponse } from '../types/auth.types'

export function isConsumerExperience(me: MeResponse | null, primaryRole: string | null): boolean {
  return Boolean(me?.consumer_mode ?? me?.is_independent_user) || primaryRole === 'independent_user'
}
