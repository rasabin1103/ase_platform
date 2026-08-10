import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import {
  addCatalogItemImage,
  addCatalogItemImageUrl,
  deleteCatalogItemImage,
  listCatalogItemImages,
  setCatalogItemCoverImage,
} from '../../../api/catalogAdmin.api'
import { AuthenticatedImage } from '../../ui/AuthenticatedImage'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Skeleton } from '../../ui/Skeleton'
import { cn } from '../../ui/cn'
import { useI18n } from '../../../i18n'

type Props = {
  itemId: number
}

export function CatalogGalleryManager({ itemId }: Props) {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [urlDraft, setUrlDraft] = useState('')

  const imagesQuery = useQuery({
    queryKey: ['catalog-item-images', itemId],
    queryFn: () => listCatalogItemImages(itemId),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['catalog-item-images', itemId] })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => Promise.all(files.map((f) => addCatalogItemImage(itemId, f))),
    onSuccess: invalidate,
  })

  const addUrlMutation = useMutation({
    mutationFn: (url: string) => addCatalogItemImageUrl(itemId, url),
    onSuccess: async () => {
      setUrlDraft('')
      await invalidate()
    },
  })

  const coverMutation = useMutation({
    mutationFn: (imageId: number) => setCatalogItemCoverImage(itemId, imageId),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => deleteCatalogItemImage(itemId, imageId),
    onSuccess: invalidate,
  })

  const images = imagesQuery.data ?? []

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div>
        <span className="block text-xs font-medium text-ase-muted">{t('adminCatalog.gallery.title')}</span>
        <p className="mt-1 text-xs text-ase-muted">{t('adminCatalog.gallery.hint')}</p>
      </div>

      {imagesQuery.isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : images.length === 0 ? (
        <p className="text-xs text-ase-muted">{t('adminCatalog.gallery.empty')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className={cn(
                'group relative h-24 w-24 overflow-hidden rounded-xl border-2',
                img.is_cover ? 'border-ase-primary' : 'border-white/10',
              )}
            >
              <AuthenticatedImage src={img.url} alt="" className="h-full w-full" />
              {img.is_cover ? (
                <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ase-primary text-ase-bg">
                  <Star className="h-3 w-3" strokeWidth={2.5} fill="currentColor" />
                </span>
              ) : (
                <button
                  type="button"
                  title={t('adminCatalog.gallery.setCover') as string}
                  disabled={coverMutation.isPending}
                  onClick={() => coverMutation.mutate(img.id)}
                  className="absolute left-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/60 text-ase-text opacity-0 transition group-hover:opacity-100"
                >
                  <Star className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
              <button
                type="button"
                title={t('adminCatalog.gallery.delete') as string}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(img.id)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full border border-white/20 bg-black/60 text-ase-text opacity-0 transition group-hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          id={`gallery-upload-${itemId}`}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) uploadMutation.mutate(files)
            e.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploadMutation.isPending}
          onClick={() => document.getElementById(`gallery-upload-${itemId}`)?.click()}
        >
          {uploadMutation.isPending ? '…' : t('adminCatalog.gallery.addImages')}
        </Button>
        <div className="flex items-center gap-2">
          <Input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder={t('adminCatalog.gallery.urlPlaceholder') as string}
            className="h-9 w-56"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!urlDraft.trim() || addUrlMutation.isPending}
            onClick={() => addUrlMutation.mutate(urlDraft.trim())}
          >
            {t('adminCatalog.gallery.addUrl')}
          </Button>
        </div>
      </div>
    </div>
  )
}
