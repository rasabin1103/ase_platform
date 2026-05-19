import { useEffect, useState } from 'react'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { useForm } from 'react-hook-form'
import type { CatalogItemAdmin, CatalogItemAdminPayload } from '../../api/catalogAdmin.api'
import type { CatalogItemLevel, CatalogItemStatus, CatalogItemType } from '../../types/catalog.types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { useI18n } from '../../i18n'

type FormValues = CatalogItemAdminPayload

const TYPES: CatalogItemType[] = ['product', 'course', 'book', 'resource']
const STATUSES: CatalogItemStatus[] = ['published', 'draft', 'coming_soon', 'request_only']
const LEVELS: CatalogItemLevel[] = ['beginner', 'intermediate', 'advanced']

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

const defaults = (type: CatalogItemType): FormValues => ({
  title: '',
  slug: '',
  type,
  category: 'General',
  short_description: '',
  long_description: '',
  image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  preview_url: null,
  price: 0,
  currency: 'EUR',
  status: 'draft',
  level: 'intermediate',
  duration: null,
  author: 'ASE',
  benefits: [],
  requirements: [],
  included_items: [],
})

type Props = {
  open: boolean
  onClose: () => void
  initial?: CatalogItemAdmin | null
  defaultType?: CatalogItemType
  onSubmit: (values: FormValues, imageFile: File | null) => Promise<void>
  isSubmitting?: boolean
}

export function AdminCatalogItemModal({
  open,
  onClose,
  initial,
  defaultType = 'product',
  onSubmit,
  isSubmitting,
}: Props) {
  const { t } = useI18n()
  const isEdit = Boolean(initial)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const form = useForm<FormValues>({ defaultValues: defaults(defaultType) })

  useEffect(() => {
    if (!open) return
    if (initial) {
      form.reset({
        title: initial.title,
        slug: initial.slug,
        type: initial.type,
        category: initial.category,
        short_description: initial.short_description,
        long_description: initial.long_description,
        image_url: initial.image_url,
        preview_url: initial.preview_url,
        price: Number(initial.price),
        currency: initial.currency,
        status: initial.status,
        level: initial.level,
        duration: initial.duration,
        author: initial.author,
        benefits: initial.benefits ?? [],
        requirements: initial.requirements ?? [],
        included_items: initial.included_items ?? [],
      })
    } else {
      form.reset(defaults(defaultType))
    }
    setImageFile(null)
  }, [open, initial, defaultType, form])

  const titleWatch = form.watch('title')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('adminCatalog.formEdit') : t('adminCatalog.formCreate')}
      className="max-w-2xl"
    >
      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values, imageFile)
          onClose()
        })}
      >
        <ImageUploadField
          label={t('adminCatalog.fields.photo')}
          hint={t('adminCatalog.uploadPhotoHint')}
          uploadLabel={t('adminCatalog.uploadPhoto')}
          previewSrc={initial?.image_url}
          onFileSelect={setImageFile}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.title')}</span>
            <Input {...form.register('title', { required: true })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.slug')}</span>
            <div className="flex gap-2">
              <Input {...form.register('slug', { required: true })} disabled={isEdit} />
              {!isEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.setValue('slug', slugify(titleWatch || ''))}
                >
                  →
                </Button>
              ) : null}
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.type')}</span>
            <Select {...form.register('type')} disabled={isEdit}>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.category')}</span>
            <Input {...form.register('category', { required: true })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.author')}</span>
            <Input {...form.register('author', { required: true })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.shortDescription')}</span>
            <Input {...form.register('short_description', { required: true })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.longDescription')}</span>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text"
              rows={4}
              {...form.register('long_description', { required: true })}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.imageUrl')}</span>
            <Input {...form.register('image_url', { required: true })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.previewUrl')}</span>
            <Input {...form.register('preview_url')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.price')}</span>
            <Input type="number" step="0.01" {...form.register('price', { valueAsNumber: true })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.currency')}</span>
            <Input {...form.register('currency', { required: true })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.status')}</span>
            <Select {...form.register('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`adminCatalog.status.${s}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.level')}</span>
            <Select {...form.register('level')}>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`catalog.levels.${lv}`)}
                </option>
              ))}
            </Select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.duration')}</span>
            <Input {...form.register('duration')} />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('adminCatalog.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {t('adminCatalog.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
