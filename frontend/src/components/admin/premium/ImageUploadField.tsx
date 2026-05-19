import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui/Button'
import { AuthenticatedImage } from '../../ui/AuthenticatedImage'
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
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localBlob, setLocalBlob] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (localBlob) URL.revokeObjectURL(localBlob)
    }
  }, [localBlob])

  return (
    <div className={cn('space-y-3', className)}>
      <span className="block text-xs font-medium text-ase-muted">{label}</span>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
          {localBlob ? (
            <img src={localBlob} alt="" className="h-full w-full object-cover" />
          ) : previewSrc && isApiMediaPath(previewSrc) ? (
            <AuthenticatedImage
              src={previewSrc}
              cacheKey={previewCacheKey}
              className="h-full w-full"
              fallback={<span className="text-3xl">◇</span>}
            />
          ) : previewSrc ? (
            <img src={previewSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-ase-muted">◇</div>
          )}
        </div>
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
