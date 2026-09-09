import { describe, expect, it } from 'vitest'
import { isConsumerExperience } from './consumerOrg'
import type { MeResponse } from '../types/auth.types'

function makeUser(overrides: Partial<MeResponse> = {}): MeResponse {
  return {
    uuid: 'u1',
    email: 'test@example.com',
    first_name: null,
    last_name: null,
    display_name: null,
    status: 'active',
    email_verified_at: null,
    last_login_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('isConsumerExperience', () => {
  it('is false when there is no user and no resolved role', () => {
    expect(isConsumerExperience(null, null)).toBe(false)
  })

  it('is true when the backend flags consumer_mode', () => {
    expect(isConsumerExperience(makeUser({ consumer_mode: true }), null)).toBe(true)
  })

  it('falls back to is_independent_user only when consumer_mode is entirely absent (nullish, not just falsy)', () => {
    // isConsumerExperience uses `??`, not `||` — an explicit consumer_mode:
    // false is a real value and wins over is_independent_user, it does not
    // fall through. Only an actually-absent (undefined) consumer_mode
    // falls back to is_independent_user.
    expect(isConsumerExperience(makeUser({ is_independent_user: true }), null)).toBe(true)
    expect(isConsumerExperience(makeUser({ is_independent_user: true, consumer_mode: false }), null)).toBe(false)
  })

  it('is true when the resolved primary role is independent_user, even if the user flags are absent', () => {
    expect(isConsumerExperience(makeUser(), 'independent_user')).toBe(true)
  })

  it('is false for an org member with no consumer flags set', () => {
    expect(isConsumerExperience(makeUser({ consumer_mode: false, is_independent_user: false }), 'org_admin')).toBe(
      false,
    )
  })
})
