import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { isApiMediaPath, resolveMediaUrl, toApiClientPath } from '../../utils/mediaUrls'
import { cn } from './cn'

type Props = {
  src: string | null | undefined
  alt?: string
  className?: string
  fallback?: React.ReactNode
  cacheKey?: string | number
}

export function AuthenticatedImage({ src, alt = '', className, fallback, cacheKey }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const direct = src && !isApiMediaPath(src) ? resolveMediaUrl(src) : null

  // Reset transient fetch state whenever the image identity changes, during
  // render (React's blessed pattern for resetting state from a changed
  // prop) rather than as a synchronous setState at the top of the effect
  // below — the effect's job is just to perform the fetch.
  const identityKey = `${src ?? ''}::${cacheKey ?? ''}`
  const [prevIdentityKey, setPrevIdentityKey] = useState(identityKey)
  if (identityKey !== prevIdentityKey) {
    setPrevIdentityKey(identityKey)
    setFailed(false)
    setBlobUrl(null)
  }

  useEffect(() => {
    if (!src || !isApiMediaPath(src)) {
      return
    }
    let revoked: string | null = null
    let cancelled = false
    const clientPath = toApiClientPath(src)
    const url = cacheKey != null && cacheKey !== '' ? `${clientPath}?v=${encodeURIComponent(String(cacheKey))}` : clientPath
    void apiClient
      .get(url, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return
        revoked = URL.createObjectURL(res.data)
        setBlobUrl(revoked)
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) {
          setBlobUrl(null)
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [src, cacheKey])

  const finalSrc = blobUrl ?? direct
  if (!finalSrc || failed) {
    return (
      <div className={cn('flex items-center justify-center bg-white/[0.04] text-ase-muted', className)}>
        {fallback ?? '◇'}
      </div>
    )
  }
  return <img src={finalSrc} alt={alt} className={cn('object-cover', className)} />
}
