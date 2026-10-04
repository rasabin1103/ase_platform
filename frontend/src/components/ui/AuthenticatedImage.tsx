import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../../api/client'
import { isApiMediaPath, resolveMediaUrl, toApiClientPath } from '../../utils/mediaUrls'
import { useI18n } from '../../i18n'
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
  const { t } = useI18n()
  const [zoomOpen, setZoomOpen] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const direct = src && !isApiMediaPath(src) ? resolveMediaUrl(src) : null

  // Protected (API-fetched) images used to start their blob download on
  // mount regardless of scroll position — every thumbnail in a long list
  // or gallery fired its request immediately. This gates that fetch on the
  // element actually entering (near) the viewport, the way native
  // loading="lazy" already does for the plain <img> path below. Once a
  // given instance has been visible, it stays "unlocked" — a later src
  // change (e.g. carousel next/prev reusing the same mounted node) fetches
  // immediately rather than re-checking visibility. Request de-duplication/
  // shared caching across instances is a separate, larger change and isn't
  // done here.
  const [inView, setInView] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const setObservedRef = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      if (node && !inView) {
        const io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              setInView(true)
              io.disconnect()
            }
          },
          { rootMargin: '200px' },
        )
        io.observe(node)
        observerRef.current = io
      }
    },
    [inView],
  )
  useEffect(() => () => observerRef.current?.disconnect(), [])

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
    if (!src || !isApiMediaPath(src) || !inView) {
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
  }, [src, cacheKey, inView])

  const finalSrc = blobUrl ?? direct
  if (!finalSrc || failed) {
    return (
      <div ref={setObservedRef} className={cn('flex items-center justify-center bg-white/[0.04] text-ase-muted', className)}>
        {fallback ?? '◇'}
      </div>
    )
  }
  if (!zoomable) {
    return (
      <img
        ref={setObservedRef}
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn(fit === 'contain' ? 'object-contain' : 'object-cover', className)}
      />
    )
  }

  const zoomLabel = alt ? `${alt} — ${t('a11y.zoomImage')}` : (t('a11y.zoomImage') as string)

  return (
    <>
      {/* A real <button> (not a click handler on the <img>) so keyboard
       * users can reach and activate the zoom — WCAG 2.1.1. The caller's
       * sizing `className` moves to the button itself (not the image)
       * because this needs an actual box for the focus-visible ring to
       * outline: an earlier version used `display: contents` on the
       * button so the image's own classes would size it as if it were the
       * direct layout child, but a `contents` element renders no box of
       * its own, so keyboard focus landed with no visible indicator at
       * all (WCAG 2.4.7). The image just fills whatever box the button
       * ends up with instead. */}
      <button
        ref={setObservedRef}
        type="button"
        onClick={() => setZoomOpen(true)}
        aria-label={zoomLabel}
        className={cn(
          'relative block overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg',
          className,
        )}
      >
        <img
          src={finalSrc}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn('h-full w-full cursor-zoom-in', fit === 'contain' ? 'object-contain' : 'object-cover')}
        />
      </button>
      {zoomOpen ? <ImageLightbox src={finalSrc} alt={alt} onClose={() => setZoomOpen(false)} /> : null}
    </>
  )
}
