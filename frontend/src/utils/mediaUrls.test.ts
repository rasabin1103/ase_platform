import { describe, expect, it } from 'vitest'
import { avatarDisplayPath, isApiMediaPath, resolveMediaUrl, toApiClientPath } from './mediaUrls'

describe('toApiClientPath', () => {
  it('strips the /api/v1 prefix (apiClient baseURL already includes it)', () => {
    expect(toApiClientPath('/api/v1/catalog')).toBe('/catalog')
  })

  it('handles the bare /api/v1 root as a single slash', () => {
    expect(toApiClientPath('/api/v1')).toBe('/')
  })

  it('leaves an already-relative path untouched', () => {
    expect(toApiClientPath('/catalog')).toBe('/catalog')
  })

  it('adds a leading slash to a path missing one', () => {
    expect(toApiClientPath('catalog')).toBe('/catalog')
  })
})

describe('resolveMediaUrl', () => {
  it('returns null for a null/undefined/empty path', () => {
    expect(resolveMediaUrl(null)).toBeNull()
    expect(resolveMediaUrl(undefined)).toBeNull()
    expect(resolveMediaUrl('')).toBeNull()
  })

  it('passes through absolute http(s) URLs unchanged', () => {
    expect(resolveMediaUrl('https://example.com/img.png')).toBe('https://example.com/img.png')
    expect(resolveMediaUrl('http://example.com/img.png')).toBe('http://example.com/img.png')
  })

  it('passes through data: URLs unchanged', () => {
    expect(resolveMediaUrl('data:image/png;base64,abc123')).toBe('data:image/png;base64,abc123')
  })

  it('prefixes an /api/v1 path with the API base URL', () => {
    const result = resolveMediaUrl('/api/v1/catalog/1/image')
    expect(result).not.toBeNull()
    expect(result!.endsWith('/catalog/1/image')).toBe(true)
  })

  it('prefixes any other relative path with the API base URL', () => {
    const result = resolveMediaUrl('/media/foo.png')
    expect(result).not.toBeNull()
    expect(result!.endsWith('/media/foo.png')).toBe(true)
  })
})

describe('isApiMediaPath', () => {
  it('returns false for null/undefined/empty', () => {
    expect(isApiMediaPath(null)).toBe(false)
    expect(isApiMediaPath(undefined)).toBe(false)
    expect(isApiMediaPath('')).toBe(false)
  })

  it('recognizes /api/v1/, /auth/ and /media/ paths', () => {
    expect(isApiMediaPath('/api/v1/catalog/1/image')).toBe(true)
    expect(isApiMediaPath('/auth/me/avatar')).toBe(true)
    expect(isApiMediaPath('/media/foo.png')).toBe(true)
  })

  it('returns false for an external URL', () => {
    expect(isApiMediaPath('https://example.com/img.png')).toBe(false)
  })
})

describe('avatarDisplayPath', () => {
  it('returns the stored-avatar endpoint when hasAvatar is true and no explicit URL given', () => {
    expect(avatarDisplayPath(true, null)).toBe('/auth/me/avatar')
  })

  it('returns the explicit avatarUrl when hasAvatar is true and a URL is given', () => {
    expect(avatarDisplayPath(true, 'https://example.com/me.png')).toBe('https://example.com/me.png')
  })

  it('returns an external avatarUrl when hasAvatar is false and the URL is not an API media path', () => {
    expect(avatarDisplayPath(false, 'https://example.com/me.png')).toBe('https://example.com/me.png')
  })

  it('returns null when hasAvatar is false and the URL is a stale API media path', () => {
    expect(avatarDisplayPath(false, '/auth/me/avatar')).toBeNull()
  })

  it('returns null when there is no avatar at all', () => {
    expect(avatarDisplayPath(false, null)).toBeNull()
    expect(avatarDisplayPath(undefined, undefined)).toBeNull()
  })
})
