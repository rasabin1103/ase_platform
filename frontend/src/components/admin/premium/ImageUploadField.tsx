import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui/Button'
import { AuthenticatedImage } from '../../ui/AuthenticatedImage'
import { ImageLightbox } from '../../ui/ImageLightbox'
import { isApiMediaPath } from '../../../utils/mediaUrls'
import { cn } from '../../ui/cn'

type Props = {
  label: string
  hint?: string
  previewSrc?: string | null
  previewCacheKey?: string | number
  onFileSelect: (file: File) => void
  uploading?: boolean
  uploadLabel: string
  className?: string
  /** 'cover' (default) crops the preview to fill the box — right for a
   * circular/square avatar. 'contain' always shows the whole uploaded image
   * letterboxed inside the box instead of cropping it — use for catalog
   * item photos, where cropping would silently hide part of what was
   * uploaded. */
  fit?: 'cover' | 'contain'
  /** When true, clicking the preview opens a full-screen zoom overlay —
   * lets an admin double-check exactly what was uploaded before saving. */
  zoomable?: boolean
}

export function ImageUploadField({
  label,
  hint,
  previewSrc,
  previewCacheKey,
  onFileSelect,
  uploading,
  uploadLabel,
  className,
  fit = 'cover',
  zoomable = false,
}: Props) {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  const inputRef = useRef<HTMLInputElement>(null)
  const [localBlob, setLocalBlob] = useState<string | null>(null)
  // Only used for the two plain-<img> branches below (local blob, or a
  // direct non-API preview URL) — the AuthenticatedImage branch manages its
  // own zoom internally since it's the only one that knows its fetched blob
  // URL (see AuthenticatedImage's `zoomable` prop).
  const [zoomSrc, setZoomSrc] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localBlob) URL.revokeObjectURL(localBlob)
    }
  }, [localBlob])

  return (
    <div className={cn('space-y-3', className)}>
      <span className="block text-xs font-medium text-ase-muted">{label}</span>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div
          className={cn(
            'shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.3)]',
            fit === 'contain' ? 'h-40 w-56' : 'h-32 w-32',
          )}
        >
          {localBlob ? (
            <img
              src={localBlob}
              alt=""
              onClick={zoomable ? () => setZoomSrc(localBlob) : undefined}
              className={cn('h-full w-full', fitClass, zoomable && 'cursor-zoom-in')}
            />
          ) : previewSrc && isApiMediaPath(previewSrc) ? (
            <AuthenticatedImage
              src={previewSrc}
              cacheKey={previewCacheKey}
              className="h-full w-full"
              fit={fit}
              zoomable={zoomable}
              fallback={<span className="text-3xl">◇</span>}
            />
          ) : previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              onClick={zoomable ? () => setZoomSrc(previewSrc) : undefined}
              className={cn('h-full w-full', fitClass, zoomable && 'cursor-zoom-in')}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-ase-muted">◇</div>
          )}
        </div>
        {zoomable ? <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} /> : null}
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setLocalBlob((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return URL.createObjectURL(file)
              })
              onFileSelect(file)
              e.target.value = ''
            }}
          />
          <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? '…' : uploadLabel}
          </Button>
          {hint ? <p className="max-w-xs text-xs text-ase-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  )
}
