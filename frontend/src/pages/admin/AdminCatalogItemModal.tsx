import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { CatalogGalleryManager } from '../../components/admin/premium/CatalogGalleryManager'
import { CatalogGalleryPicker, type PendingGalleryImage } from '../../components/admin/premium/CatalogGalleryPicker'
import { useForm, useWatch } from 'react-hook-form'
import type { CatalogItemAdmin, CatalogItemAdminPayload } from '../../api/catalogAdmin.api'
import { listCatalogCategories } from '../../api/catalogCategories.api'
import type { CatalogItemLevel, CatalogItemStatus, CatalogItemType } from '../../types/catalog.types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Switch } from '../../components/ui/Switch'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

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
  tags: [],
  repo_url: null,
  repo_redeem_code: null,
})

type Props = {
  open: boolean
  onClose: () => void
  initial?: CatalogItemAdmin | null
  defaultType?: CatalogItemType
  onSubmit: (
    values: FormValues,
    imageFile: File | null,
    pendingGallery: PendingGalleryImage[],
    pendingCoverKey: string | null,
  ) => Promise<void>
  isSubmitting?: boolean
}

function RequiredMark() {
  return <span className="text-ase-error"> *</span>
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-ase-error">{message}</p>
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
  const [pendingGallery, setPendingGallery] = useState<PendingGalleryImage[]>([])
  const [pendingCoverKey, setPendingCoverKey] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [customFields, setCustomFields] = useState<Record<string, unknown>>({})
  const form = useForm<FormValues>({ defaultValues: defaults(defaultType) })
  const { errors } = form.formState
  const categoriesQuery = useQuery({
    queryKey: ['admin-catalog-categories-active'],
    queryFn: () => listCatalogCategories({ active_only: true }),
    enabled: open,
  })

  const requiredMsg = t('adminCatalog.validation.required') as string
  const inputErrClass = (hasError: boolean) =>
    hasError ? 'border-ase-error focus-visible:border-ase-error focus-visible:ring-ase-error/30' : ''

  // Reset all local/form state whenever the modal (re)opens or the item being
  // edited changes, without an effect: this "adjust state while rendering"
  // pattern runs as part of this render (no extra commit), unlike setState
  // inside useEffect.
  const resetKey = `${open}:${initial?.id ?? 'new'}:${defaultType}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    if (open) {
      setServerError(null)
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
          tags: initial.tags ?? [],
          repo_url: initial.repo_url,
          repo_redeem_code: initial.repo_redeem_code,
        })
        setTagsInput((initial.tags ?? []).join(', '))
        setCustomFields(initial.custom_fields ?? {})
      } else {
        form.reset(defaults(defaultType))
        setTagsInput('')
        setCustomFields({})
      }
      setImageFile(null)
      setPendingGallery((prev) => {
        prev.forEach((img) => {
          if (img.kind === 'file') URL.revokeObjectURL(img.previewUrl)
        })
        return []
      })
      setPendingCoverKey(null)
    }
  }

  const titleWatch = useWatch({ control: form.control, name: 'title' })
  const typeWatch = useWatch({ control: form.control, name: 'type' })
  const categoryWatch = useWatch({ control: form.control, name: 'category' })
  const categoryOptions = categoriesQuery.data ?? []
  const selectedCategory = categoryOptions.find((c) => c.name === categoryWatch)
  // Item might carry a category value that isn't (or no longer is) a
  // managed category — keep it selectable so editing never silently
  // changes the stored value.
  const categorySelectValues = categoryWatch && !selectedCategory ? [categoryWatch, ...categoryOptions.map((c) => c.name)] : categoryOptions.map((c) => c.name)

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
          setServerError(null)
          const tags = Array.from(
            new Set(
              tagsInput
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            ),
          )
          try {
            await onSubmit({ ...values, tags, custom_fields: customFields }, imageFile, pendingGallery, pendingCoverKey)
            onClose()
          } catch (err) {
            const parsed = parseApiError(err, t('adminCatalog.saveError') as string)
            const isSlugConflict = /slug/i.test(parsed.message) && /exist/i.test(parsed.message)
            if (isSlugConflict) {
              form.setError('slug', { type: 'server', message: t('adminCatalog.slugExists') as string })
            }
            const isCodeConflict = /redeem code/i.test(parsed.message) && /use/i.test(parsed.message)
            if (isCodeConflict) {
              form.setError('repo_redeem_code', {
                type: 'server',
                message: t('adminCatalog.repoRedeemCodeExists') as string,
              })
            }
            for (const [field, message] of Object.entries(parsed.fieldErrors)) {
              form.setError(field as keyof FormValues, { type: 'server', message })
            }
            setServerError(parsed.message)
          }
        })}
      >
        {serverError ? (
          <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
            {serverError}
          </div>
        ) : null}
        <p className="text-xs text-ase-muted">{t('adminCatalog.requiredMark')}</p>

        <ImageUploadField
          label={t('adminCatalog.fields.photo')}
          hint={t('adminCatalog.uploadPhotoHint')}
          uploadLabel={t('adminCatalog.uploadPhoto')}
          previewSrc={initial?.image_url}
          onFileSelect={setImageFile}
        />
        {isEdit && initial ? (
          <CatalogGalleryManager itemId={initial.id} />
        ) : (
          <CatalogGalleryPicker
            images={pendingGallery}
            coverKey={pendingCoverKey}
            onChange={setPendingGallery}
            onCoverChange={setPendingCoverKey}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.title')}
              <RequiredMark />
            </span>
            <Input
              className={cn(inputErrClass(Boolean(errors.title)))}
              {...form.register('title', { required: requiredMsg })}
            />
            <FieldError message={errors.title?.message as string | undefined} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.slug')}
              <RequiredMark />
            </span>
            <div className="flex gap-2">
              <Input
                className={cn(inputErrClass(Boolean(errors.slug)))}
                {...form.register('slug', { required: requiredMsg })}
                disabled={isEdit}
              />
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
            <FieldError message={errors.slug?.message as string | undefined} />
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
            <span className="mb-1 flex items-center justify-between text-xs text-ase-muted">
              <span>
                {t('adminCatalog.fields.category')}
                <RequiredMark />
              </span>
              <Link to="/admin/catalog-categories" className="text-cyan-300 hover:underline">
                {t('adminCatalog.manageCategories')}
              </Link>
            </span>
            {categorySelectValues.length > 0 ? (
              <Select
                className={cn(inputErrClass(Boolean(errors.category)))}
                {...form.register('category', { required: requiredMsg })}
              >
                {categorySelectValues.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                className={cn(inputErrClass(Boolean(errors.category)))}
                {...form.register('category', { required: requiredMsg })}
              />
            )}
            <FieldError message={errors.category?.message as string | undefined} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.author')}
              <RequiredMark />
            </span>
            <Input
              className={cn(inputErrClass(Boolean(errors.author)))}
              {...form.register('author', { required: requiredMsg })}
            />
            <FieldError message={errors.author?.message as string | undefined} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.shortDescription')}
              <RequiredMark />
            </span>
            <Input
              className={cn(inputErrClass(Boolean(errors.short_description)))}
              {...form.register('short_description', { required: requiredMsg })}
            />
            <FieldError message={errors.short_description?.message as string | undefined} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.longDescription')}
              <RequiredMark />
            </span>
            <textarea
              className={cn(
                'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text',
                inputErrClass(Boolean(errors.long_description)),
              )}
              rows={4}
              {...form.register('long_description', { required: requiredMsg })}
            />
            <FieldError message={errors.long_description?.message as string | undefined} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.imageUrl')}
              <RequiredMark />
            </span>
            <Input
              className={cn(inputErrClass(Boolean(errors.image_url)))}
              {...form.register('image_url', { required: requiredMsg })}
            />
            <FieldError message={errors.image_url?.message as string | undefined} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.previewUrl')}</span>
            <Input {...form.register('preview_url')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.price')}
              <RequiredMark />
            </span>
            <Input
              type="number"
              step="0.01"
              className={cn(inputErrClass(Boolean(errors.price)))}
              {...form.register('price', {
                required: requiredMsg,
                valueAsNumber: true,
                min: { value: 0, message: t('adminCatalog.validation.priceMin') as string },
              })}
            />
            <FieldError message={errors.price?.message as string | undefined} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">
              {t('adminCatalog.fields.currency')}
              <RequiredMark />
            </span>
            <Input
              className={cn(inputErrClass(Boolean(errors.currency)))}
              {...form.register('currency', { required: requiredMsg })}
            />
            <FieldError message={errors.currency?.message as string | undefined} />
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
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.statusNotifyHint')}</p>
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
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.tags')}</span>
            <Input
              placeholder={t('adminCatalog.placeholders.tags') as string}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.tagsHint')}</p>
          </label>
          {selectedCategory && selectedCategory.fields.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {t('adminCatalog.customFields.title')} · {selectedCategory.name}
              </span>
              {selectedCategory.fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs text-ase-muted">
                    {f.label}
                    {f.required ? <RequiredMark /> : null}
                  </span>
                  {f.type === 'textarea' ? (
                    <textarea
                      className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text"
                      rows={3}
                      value={String(customFields[f.key] ?? '')}
                      onChange={(e) => setCustomFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    />
                  ) : f.type === 'boolean' ? (
                    <Switch
                      checked={Boolean(customFields[f.key])}
                      onCheckedChange={(v) => setCustomFields((prev) => ({ ...prev, [f.key]: v }))}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={String(customFields[f.key] ?? '')}
                      onChange={(e) => setCustomFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    >
                      <option value="">—</option>
                      {(f.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      type={f.type === 'number' ? 'number' : f.type === 'url' ? 'url' : 'text'}
                      value={String(customFields[f.key] ?? '')}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          ) : null}
          {typeWatch === 'book' ? (
            <>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoUrl')}</span>
                <Input placeholder="https://github.com/tu-org/tu-repo" {...form.register('repo_url')} />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoUrlHint')}</p>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoRedeemCode')}</span>
                <Input placeholder="ASE-BOOK-2026" {...form.register('repo_redeem_code')} />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoRedeemCodeHint')}</p>
                <FieldError message={errors.repo_redeem_code?.message as string | undefined} />
              </label>
            </>
          ) : null}
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
