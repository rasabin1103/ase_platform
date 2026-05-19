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

  useEffect(() => {
    setFailed(false)
    if (!src || !isApiMediaPath(src)) {
      setBlobUrl(null)
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
