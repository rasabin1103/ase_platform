import { useEffect, useState } from 'react'
import { apiClient } from '../../api/client'
import { isApiMediaPath, resolveMediaUrl, toApiClientPath } from '../../utils/mediaUrls'
import { cn } from './cn'
import { ImageLightbox } from './ImageLightbox'

type Props = {
  src: string | null | undefined
  alt?: string
  className?: string
  fallback?: React.ReactNode
  cacheKey?: string | number
  /** 'cover' (default) crops to fill the box — right for avatars/thumbnails
   * where losing the edges is fine. 'contain' always shows the whole image,
   * letterboxed inside the box instead of cropped — use this anywhere the
   * uploaded image itself is the product (catalog item photos), so nothing
   * an admin uploads ever gets silently cut off. */
  fit?: 'cover' | 'contain'
  /** When true, clicking the image opens a full-screen zoom overlay using
   * this component's own already-resolved src (the fetched blob URL, if
   * it came from an authenticated path) — self-contained, the caller never
   * needs to know that URL itself. */
  zoomable?: boolean
}

export function AuthenticatedImage({
  src,
  alt = '',
  className,
  fallback,
  cacheKey,
  fit = 'cover',
  zoomable = false,
}: Props) {
  const [zoomOpen, setZoomOpen] = useState(false)
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
  return (
    <>
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onClick={zoomable ? () => setZoomOpen(true) : undefined}
        className={cn(
          fit === 'contain' ? 'object-contain' : 'object-cover',
          zoomable && 'cursor-zoom-in',
          className,
        )}
      />
      {zoomable && zoomOpen ? <ImageLightbox src={finalSrc} alt={alt} onClose={() => setZoomOpen(false)} /> : null}
    </>
  )
}
