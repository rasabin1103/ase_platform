import { useRef, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

export type PendingGalleryImage = {
  key: string
  kind: 'file' | 'url'
  file?: File
  url?: string
  previewUrl: string
}

type Props = {
  images: PendingGalleryImage[]
  coverKey: string | null
  onChange: (images: PendingGalleryImage[]) => void
  onCoverChange: (key: string | null) => void
  className?: string
}

function makeKey() {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Local (not-yet-uploaded) equivalent of CatalogGalleryManager, used while
 * creating a new catalog item — there is no item id yet to attach images to,
 * so files/URLs are staged here and uploaded by the caller right after the
 * item is created (see AdminCatalogPage.saveWithImage).
 */
export function CatalogGalleryPicker({ images, coverKey, onChange, onCoverChange, className }: Props) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [urlDraft, setUrlDraft] = useState('')

  const addFiles = (files: File[]) => {
    if (files.length === 0) return
    const added: PendingGalleryImage[] = files.map((file) => ({
      key: makeKey(),
      kind: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    const next = [...images, ...added]
    onChange(next)
    if (!coverKey && next.length > 0) onCoverChange(next[0].key)
  }

  const addUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    const entry: PendingGalleryImage = { key: makeKey(), kind: 'url', url: trimmed, previewUrl: trimmed }
    const next = [...images, entry]
    onChange(next)
    if (!coverKey) onCoverChange(entry.key)
    setUrlDraft('')
  }

  const removeImage = (key: string) => {
    const target = images.find((img) => img.key === key)
    if (target?.kind === 'file') URL.revokeObjectURL(target.previewUrl)
    const next = images.filter((img) => img.key !== key)
    onChange(next)
    if (coverKey === key) onCoverChange(next[0]?.key ?? null)
  }

  return (
    <div className={cn('space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4', className)}>
      <div>
        <span className="block text-xs font-medium text-ase-muted">{t('adminCatalog.gallery.title')}</span>
        <p className="mt-1 text-xs text-ase-muted">{t('adminCatalog.gallery.createHint')}</p>
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-ase-muted">{t('adminCatalog.gallery.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => {
            const isCover = img.key === coverKey
            return (
              <div
                key={img.key}
                className={cn(
                  'group relative h-24 w-24 overflow-hidden rounded-xl border-2',
                  isCover ? 'border-ase-primary' : 'border-white/10',
                )}
              >
                <img src={img.previewUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                {isCover ? (
                  <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ase-primary text-ase-bg">
                    <Star className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
                  </span>
                ) : (
                  <button
                    type="button"
                    title={t('adminCatalog.gallery.setCover') as string}
                    onClick={() => onCoverChange(img.key)}
                    className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/60 text-ase-text opacity-0 transition group-hover:opacity-100"
                  >
                    <Star className="h-3 w-3" strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  title={t('adminCatalog.gallery.delete') as string}
                  onClick={() => removeImage(img.key)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/60 text-ase-text opacity-0 transition group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            addFiles(files)
            e.target.value = ''
          }}
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          {t('adminCatalog.gallery.addImages')}
        </Button>
        <div className="flex items-center gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder={t('adminCatalog.gallery.urlPlaceholder') as string}
            className="h-9 w-56"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUrl(urlDraft)
              }
            }}
          />
          <Button type="button" variant="ghost" size="sm" disabled={!urlDraft.trim()} onClick={() => addUrl(urlDraft)}>
            {t('adminCatalog.gallery.addUrl')}
          </Button>
        </div>
      </div>
    </div>
  )
}
