import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { buildCatalogItemFormSchema } from '../../lib/admin/catalogItemForm.schema'
import { FieldError, FormFieldLabel } from '../../components/ui/FormFieldLabel'
import { cn } from '../../components/ui/cn'
import type { CatalogItemAdmin, CatalogItemAdminPayload } from '../../api/catalogAdmin.api'
import type {
  CatalogItemLevel,
  CatalogItemStatus,
  CatalogItemType,
  CatalogPurchaseProvider,
  BookPurchaseLinkInput,
  CatalogItemImageInput,
} from '../../types/catalog.types'
import { CatalogItemImagesEditor } from '../../components/admin/catalog/CatalogItemImagesEditor'
import { BookPurchaseLinksEditor } from '../../components/admin/catalog/BookPurchaseLinksEditor'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { useI18n } from '../../i18n'

type FormValues = z.infer<ReturnType<typeof buildCatalogItemFormSchema>>

const TYPES: CatalogItemType[] = ['product', 'course', 'book', 'resource']
const STATUSES: CatalogItemStatus[] = ['published', 'draft', 'coming_soon', 'request_only']
const LEVELS: CatalogItemLevel[] = ['beginner', 'intermediate', 'advanced']
const PURCHASE_PROVIDERS: CatalogPurchaseProvider[] = [
  'internal',
  'amazon',
  'external',
  'request_only',
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

function linesToText(lines: string[] | undefined) {
  return (lines ?? []).join('\n')
}

function textToLines(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

const defaults = (type: CatalogItemType): FormValues => ({
  title: '',
  slug: '',
  type,
  category: 'General',
  short_description: '',
  long_description: '',
  image_url: '',
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
  cover_image_url: null,
  thumbnail_url: null,
  amazon_url: null,
  external_purchase_url: null,
  purchase_provider: 'internal',
  pdf_url: null,
  preview_pdf_url: null,
  preview_pages: null,
  sample_download_url: null,
  rich_content_markdown: null,
  book_format: null,
  audience: [],
  benefits_text: '',
  requirements_text: '',
  included_items_text: '',
  audience_text: '',
})

function adminToForm(initial: CatalogItemAdmin): FormValues {
  return {
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
    cover_image_url: initial.cover_image_url ?? null,
    thumbnail_url: initial.thumbnail_url ?? null,
    amazon_url: initial.amazon_url ?? null,
    external_purchase_url: initial.external_purchase_url ?? null,
    purchase_provider: initial.purchase_provider ?? 'internal',
    pdf_url: initial.pdf_url ?? null,
    preview_pdf_url: initial.preview_pdf_url ?? null,
    preview_pages: initial.preview_pages ?? null,
    sample_download_url: initial.sample_download_url ?? null,
    rich_content_markdown: initial.rich_content_markdown ?? null,
    book_format: initial.book_format ?? null,
    audience: initial.audience ?? [],
    benefits_text: linesToText(initial.benefits),
    requirements_text: linesToText(initial.requirements),
    included_items_text: linesToText(initial.included_items),
    audience_text: linesToText(initial.audience),
  }
}

type Props = {
  open: boolean
  onClose: () => void
  initial?: CatalogItemAdmin | null
  defaultType?: CatalogItemType
  onSubmit: (values: CatalogItemAdminPayload, imageFile: File | null) => Promise<void>
  isSubmitting?: boolean
}

const textareaClass =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text'

function inputErrorClass(hasError: boolean) {
  return cn(hasError && 'border-ase-error/50 ring-1 ring-ase-error/30')
}

type AdminFieldProps = {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}

function AdminField({ label, required, error, className, children }: AdminFieldProps) {
  return (
    <label className={cn('block', className)}>
      <FormFieldLabel label={label} required={required} />
      {children}
      <FieldError message={error} />
    </label>
  )
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
  const [images, setImages] = useState<CatalogItemImageInput[]>([])
  const [purchaseLinks, setPurchaseLinks] = useState<BookPurchaseLinkInput[]>([])
  const schema = useMemo(() => buildCatalogItemFormSchema(t), [t])
  const form = useForm<FormValues>({
    defaultValues: defaults(defaultType),
    resolver: zodResolver(schema) as Resolver<FormValues>,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const itemType = form.watch('type')
  const { errors } = form.formState

  useEffect(() => {
    if (!open) return
    if (initial) {
      form.reset(adminToForm(initial))
      setImages(
        (initial.images ?? []).map((img) => ({
          id: img.id,
          image_url: img.imageUrl,
          alt_text: img.altText ?? '',
          title: img.title ?? '',
          sort_order: img.sortOrder,
          is_primary: img.isPrimary,
        })),
      )
      setPurchaseLinks(
        (initial.purchase_links ?? []).map((link) => ({
          id: link.id,
          platform: link.platform,
          label: link.label,
          url: link.url,
          currency: link.currency ?? 'EUR',
          price: link.price != null ? Number(link.price) : null,
          country: link.country ?? null,
          is_primary: link.isPrimary,
          is_active: link.isActive,
          sort_order: link.sortOrder,
        })),
      )
    } else {
      form.reset(defaults(defaultType))
      setImages([])
      setPurchaseLinks([])
    }
    setImageFile(null)
  }, [open, initial, defaultType, form])

  const titleWatch = form.watch('title')

  const buildPayload = (values: FormValues): CatalogItemAdminPayload => {
    const {
      benefits_text,
      requirements_text,
      included_items_text,
      audience_text,
      ...rest
    } = values
    return {
      ...rest,
      benefits: textToLines(benefits_text ?? ''),
      requirements: textToLines(requirements_text ?? ''),
      included_items: textToLines(included_items_text ?? ''),
      audience: textToLines(audience_text ?? ''),
      preview_pages: values.preview_pages ?? null,
      images,
      ...(itemType === 'book' ? { purchase_links: purchaseLinks } : {}),
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('adminCatalog.formEdit') : t('adminCatalog.formCreate')}
      size="wide"
    >
      <form
        className="w-full space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          if (!isEdit && !imageFile && !values.image_url?.trim()) {
            form.setError('image_url', {
              type: 'manual',
              message: String(t('adminFormValidation.catalogImage')),
            })
            return
          }
          await onSubmit(buildPayload(values), imageFile)
        })}
      >
        <div>
          <ImageUploadField
            label={
              !isEdit
                ? `${t('adminCatalog.fields.photo')} *`
                : (t('adminCatalog.fields.photo') as string)
            }
            hint={t('adminCatalog.uploadPhotoHint')}
            uploadLabel={t('adminCatalog.uploadPhoto')}
            previewSrc={initial?.image_url}
            previewCacheKey={initial?.updated_at}
            onFileSelect={(file) => {
              setImageFile(file)
              if (file) form.clearErrors('image_url')
            }}
          />
          <FieldError message={errors.image_url?.message} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          <AdminField
            label={t('adminCatalog.fields.title') as string}
            required
            error={errors.title?.message}
            className="sm:col-span-2"
          >
            <Input className={inputErrorClass(Boolean(errors.title))} {...form.register('title')} />
          </AdminField>
          <AdminField label={t('adminCatalog.fields.slug') as string} required error={errors.slug?.message}>
            <div className="flex gap-2">
              <Input
                className={cn('min-w-0 flex-1', inputErrorClass(Boolean(errors.slug)))}
                {...form.register('slug')}
                disabled={isEdit}
              />
              {!isEdit ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.setValue('slug', slugify(titleWatch || ''), { shouldValidate: true })}
                >
                  →
                </Button>
              ) : null}
            </div>
          </AdminField>
          <AdminField label={t('adminCatalog.fields.type') as string}>
            <Select {...form.register('type')} disabled={isEdit}>
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </Select>
          </AdminField>
          <AdminField
            label={t('adminCatalog.fields.category') as string}
            required
            error={errors.category?.message}
          >
            <Input className={inputErrorClass(Boolean(errors.category))} {...form.register('category')} />
          </AdminField>
          <AdminField label={t('adminCatalog.fields.author') as string} required error={errors.author?.message}>
            <Input className={inputErrorClass(Boolean(errors.author))} {...form.register('author')} />
          </AdminField>
          <AdminField
            label={t('adminCatalog.fields.shortDescription') as string}
            required
            error={errors.short_description?.message}
            className="sm:col-span-2"
          >
            <Input
              className={inputErrorClass(Boolean(errors.short_description))}
              {...form.register('short_description')}
            />
          </AdminField>
          <AdminField
            label={t('adminCatalog.fields.longDescription') as string}
            required
            error={errors.long_description?.message}
            className="sm:col-span-2"
          >
            <textarea
              className={cn(textareaClass, inputErrorClass(Boolean(errors.long_description)))}
              rows={4}
              {...form.register('long_description')}
            />
          </AdminField>
          <AdminField
            label={t('adminCatalog.fields.imageUrl') as string}
            error={errors.image_url?.message}
            className="sm:col-span-2"
          >
            <Input
              className={inputErrorClass(Boolean(errors.image_url))}
              {...form.register('image_url')}
              placeholder="https://… or upload above"
            />
          </AdminField>
          <AdminField label={t('adminCatalog.fields.previewUrl') as string} className="sm:col-span-2">
            <Input {...form.register('preview_url')} />
          </AdminField>
          <AdminField label={t('adminCatalog.fields.price') as string}>
            <Input
              type="number"
              step="0.01"
              className={inputErrorClass(Boolean(errors.price))}
              {...form.register('price')}
            />
          </AdminField>
          <AdminField
            label={t('adminCatalog.fields.currency') as string}
            required
            error={errors.currency?.message}
          >
            <Input className={inputErrorClass(Boolean(errors.currency))} {...form.register('currency')} />
          </AdminField>
          <AdminField label={t('adminCatalog.fields.status') as string}>
            <Select {...form.register('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`adminCatalog.status.${s}`)}
                </option>
              ))}
            </Select>
          </AdminField>
          <AdminField label={t('adminCatalog.fields.level') as string}>
            <Select {...form.register('level')}>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>
                  {t(`catalog.levels.${lv}`)}
                </option>
              ))}
            </Select>
          </AdminField>
          <AdminField
            label={
              (itemType === 'book' ? t('catalog.bookPages') : t('adminCatalog.fields.duration')) as string
            }
            className="sm:col-span-2"
          >
            <Input {...form.register('duration')} placeholder={itemType === 'book' ? '320' : ''} />
          </AdminField>
        </div>

        {itemType === 'book' ? (
          <div className="space-y-5 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.04] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/90">
              {t('adminCatalog.bookDetailsSection')}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.bookFormat')}</span>
                <Input {...form.register('book_format')} placeholder="Paperback, eBook" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.purchaseProvider')}</span>
                <Select {...form.register('purchase_provider')}>
                  {PURCHASE_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {t(`adminCatalog.purchaseProvider.${p}`)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.coverImageUrl')}</span>
                <Input {...form.register('cover_image_url')} placeholder="https://…" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.amazonUrl')}</span>
                <Input {...form.register('amazon_url')} placeholder="https://amazon.com/…" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.externalPurchaseUrl')}</span>
                <Input {...form.register('external_purchase_url')} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.previewPdfUrl')}</span>
                <Input {...form.register('preview_pdf_url')} placeholder="https://…/preview.pdf" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.pdfUrl')}</span>
                <Input {...form.register('pdf_url')} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.sampleDownloadUrl')}</span>
                <Input {...form.register('sample_download_url')} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.previewPages')}</span>
                <Input type="number" min={0} {...form.register('preview_pages', { valueAsNumber: true })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.richContentMarkdown')}</span>
                <textarea
                  className={textareaClass}
                  rows={10}
                  placeholder={'## Benefits\n\n- Point one\n\n> Highlight quote'}
                  {...form.register('rich_content_markdown')}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.benefitsLines')}</span>
                <textarea className={textareaClass} rows={4} {...form.register('benefits_text')} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.includedLines')}</span>
                <textarea className={textareaClass} rows={4} {...form.register('included_items_text')} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.audienceLines')}</span>
                <textarea className={textareaClass} rows={3} {...form.register('audience_text')} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.requirementsLines')}</span>
                <textarea className={textareaClass} rows={3} {...form.register('requirements_text')} />
              </label>
            </div>
            <BookPurchaseLinksEditor value={purchaseLinks} onChange={setPurchaseLinks} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.benefitsLines')}</span>
              <textarea className={textareaClass} rows={3} {...form.register('benefits_text')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.requirementsLines')}</span>
              <textarea className={textareaClass} rows={3} {...form.register('requirements_text')} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.includedLines')}</span>
              <textarea className={textareaClass} rows={3} {...form.register('included_items_text')} />
            </label>
          </div>
        )}

        <CatalogItemImagesEditor value={images} onChange={setImages} />

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
