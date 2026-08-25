import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { CatalogGalleryManager } from '../../components/admin/premium/CatalogGalleryManager'
import { CatalogGalleryPicker, type PendingGalleryImage } from '../../components/admin/premium/CatalogGalleryPicker'
import { PricingEngineSection } from '../../components/admin/premium/PricingEngineSection'
import { useForm, useWatch } from 'react-hook-form'
import type { CatalogItemAdmin, CatalogItemAdminPayload, TestInputVariableDef } from '../../api/catalogAdmin.api'
import { getCatalogTranslationStatus } from '../../api/catalogAdmin.api'
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
  title_en: '',
  short_description_en: '',
  long_description_en: '',
  image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
  preview_url: null,
  audiobook_url: null,
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
  repo_path: null,
  dimension_selections: [],
  page_count: null,
  test_repo_url: null,
  test_workflow_file: null,
  test_included_runs: null,
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

function variableKeySlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100)
}

const emptyVariable: TestInputVariableDef = { key: '', label: '', type: 'text', required: false, description: '' }

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
  const [testInputSchema, setTestInputSchema] = useState<TestInputVariableDef[]>([])
  const form = useForm<FormValues>({ defaultValues: defaults(defaultType) })
  const { errors } = form.formState
  const categoriesQuery = useQuery({
    queryKey: ['admin-catalog-categories-active'],
    queryFn: () => listCatalogCategories({ active_only: true }),
    enabled: open,
  })
  // Drives the "translation not configured" banner below — when disabled,
  // every save silently mirrors the Spanish text into the English fields
  // instead of translating (see CatalogAdminService._ensure_english_fields),
  // same pattern as the Plans admin page.
  const translationStatusQuery = useQuery({
    queryKey: ['catalog-translation-status'],
    queryFn: getCatalogTranslationStatus,
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
          title_en: initial.title_en ?? '',
          short_description_en: initial.short_description_en ?? '',
          long_description_en: initial.long_description_en ?? '',
          image_url: initial.image_url,
          preview_url: initial.preview_url,
          audiobook_url: initial.audiobook_url,
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
          repo_path: initial.repo_path,
          dimension_selections: initial.dimension_selections ?? [],
          page_count: initial.page_count ?? null,
          test_repo_url: initial.test_repo_url ?? null,
          test_workflow_file: initial.test_workflow_file ?? null,
          test_included_runs: initial.test_included_runs ?? null,
        })
        setTagsInput((initial.tags ?? []).join(', '))
        setCustomFields(initial.custom_fields ?? {})
        setTestInputSchema(initial.test_input_schema ?? [])
      } else {
        form.reset(defaults(defaultType))
        setTagsInput('')
        setCustomFields({})
        setTestInputSchema([])
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
  const dimensionSelectionsWatch = useWatch({ control: form.control, name: 'dimension_selections' })
  const pageCountWatch = useWatch({ control: form.control, name: 'page_count' })
  const categoryOptions = categoriesQuery.data ?? []
  const selectedCategory = categoryOptions.find((c) => c.name === categoryWatch)
  // Item might carry a category value that isn't (or no longer is) a
  // managed category — keep it selectable so editing never silently
  // changes the stored value.
  const categorySelectValues = categoryWatch && !selectedCategory ? [categoryWatch, ...categoryOptions.map((c) => c.name)] : categoryOptions.map((c) => c.name)

  const updateTestVariable = (index: number, patch: Partial<TestInputVariableDef>) => {
    setTestInputSchema((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  const formId = 'admin-catalog-item-form'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('adminCatalog.formEdit') : t('adminCatalog.formCreate')}
      className="max-w-2xl"
      allowFullscreen
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('adminCatalog.cancel')}
          </Button>
          <Button type="submit" form={formId} disabled={isSubmitting}>
            {t('adminCatalog.save')}
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="space-y-4"
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
          // Only send an "_en" field as an explicit override when the admin
          // actually typed into it this session (dirtyFields) — otherwise
          // send null so the backend auto-translates from the (possibly
          // just-edited) Spanish text instead of permanently locking in
          // whatever text happened to be prefilled from the existing item.
          // Same fix as PlansPage's editForm (task: retraducción bloqueada).
          const dirty = form.formState.dirtyFields
          const englishOverrides = {
            title_en: dirty.title_en && values.title_en ? values.title_en.trim() : null,
            short_description_en:
              dirty.short_description_en && values.short_description_en ? values.short_description_en.trim() : null,
            long_description_en:
              dirty.long_description_en && values.long_description_en ? values.long_description_en.trim() : null,
          }
          try {
            await onSubmit(
              {
                ...values,
                ...englishOverrides,
                tags,
                custom_fields: customFields,
                test_input_schema: testInputSchema.filter((v) => v.key && v.label),
              },
              imageFile,
              pendingGallery,
              pendingCoverKey,
            )
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

        {translationStatusQuery.data?.enabled === false ? (
          <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            <span className="font-semibold">{t('adminCatalog.translationWarning.title')}</span>{' '}
            {t('adminCatalog.translationWarning.body')}
          </div>
        ) : null}

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
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.titleEn')}</span>
            <Input placeholder={t('adminCatalog.placeholders.titleEn') as string} {...form.register('title_en')} />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.translationHint')}</p>
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
              <Link to="/admin/catalog?section=categories" className="text-cyan-300 hover:underline">
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
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.shortDescriptionEn')}</span>
            <Input
              placeholder={t('adminCatalog.placeholders.shortDescriptionEn') as string}
              {...form.register('short_description_en')}
            />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.translationHint')}</p>
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
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.longDescriptionMarkdownHint')}</p>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.longDescriptionEn')}</span>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text"
              rows={4}
              placeholder={t('adminCatalog.placeholders.longDescriptionEn') as string}
              {...form.register('long_description_en')}
            />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.translationHint')}</p>
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
            <Input placeholder="https://…" {...form.register('preview_url')} />
            <FieldError message={errors.preview_url?.message as string | undefined} />
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
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t('adminCatalog.bookRedemptionSection.title')}
                </span>
                <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.bookRedemptionSection.hint')}</p>
                <label className="block">
                  <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoUrl')}</span>
                  <Input placeholder="https://github.com/tu-org/tu-repo" {...form.register('repo_url')} />
                  <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoUrlHint')}</p>
                  <FieldError message={errors.repo_url?.message as string | undefined} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoRedeemCode')}</span>
                  <Input placeholder="ASE-BOOK-2026" {...form.register('repo_redeem_code')} />
                  <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoRedeemCodeHint')}</p>
                  <FieldError message={errors.repo_redeem_code?.message as string | undefined} />
                </label>
              </div>
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  {t('adminCatalog.bookContentSection.title')}
                </span>
                <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.bookContentSection.hint')}</p>
                <label className="block">
                  <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoPath')}</span>
                  <Input placeholder="books/mi-libro" {...form.register('repo_path')} />
                  <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoPathHintBook')}</p>
                  <FieldError message={errors.repo_path?.message as string | undefined} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.audiobookUrl')}</span>
                  <Input placeholder="https://…" {...form.register('audiobook_url')} />
                  <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.audiobookUrlHint')}</p>
                  <FieldError message={errors.audiobook_url?.message as string | undefined} />
                </label>
              </div>
            </>
          ) : null}
          {typeWatch === 'resource' ? (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoPath')}</span>
              <Input placeholder="resources/deploy-checklist" {...form.register('repo_path')} />
              <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoPathHint')}</p>
            </label>
          ) : null}
          {typeWatch === 'product' ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {t('adminCatalog.productContentSection.title')}
              </span>
              <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.productContentSection.hint')}</p>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.repoPath')}</span>
                <Input placeholder="products/mi-producto" {...form.register('repo_path')} />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.repoPathHint')}</p>
                <FieldError message={errors.repo_path?.message as string | undefined} />
              </label>
            </div>
          ) : null}
          {typeWatch === 'product' ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
              <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {t('adminCatalog.testExecutionSection.title')}
              </span>
              <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testExecutionSection.hint')}</p>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.testRepoUrl')}</span>
                <Input placeholder="https://github.com/tu-org/tu-framework" {...form.register('test_repo_url')} />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testRepoUrlHint')}</p>
                <FieldError message={errors.test_repo_url?.message as string | undefined} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.testWorkflowFile')}</span>
                <Input placeholder="run-tests.yml" {...form.register('test_workflow_file')} />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testWorkflowFileHint')}</p>
                <FieldError message={errors.test_workflow_file?.message as string | undefined} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('adminCatalog.fields.testIncludedRuns')}</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="10"
                  {...form.register('test_included_runs', {
                    setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                  })}
                />
                <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testIncludedRunsHint')}</p>
                <FieldError message={errors.test_included_runs?.message as string | undefined} />
              </label>

              <div className="space-y-3 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">
                    {t('adminCatalog.testInputSchemaSection.title')}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setTestInputSchema((prev) => [...prev, { ...emptyVariable }])}
                  >
                    {t('adminCatalog.addTestVariable')}
                  </Button>
                </div>
                <p className="text-[11px] leading-snug text-ase-muted">{t('adminCatalog.testInputSchemaSection.hint')}</p>

                {testInputSchema.length === 0 ? (
                  <p className="text-xs text-ase-muted">{t('adminCatalog.noTestVariables')}</p>
                ) : (
                  <div className="space-y-3">
                    {testInputSchema.map((variable, index) => (
                      <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-ase-muted">
                              {t('adminCatalog.testVariableFields.label')}
                            </span>
                            <Input
                              value={variable.label}
                              onChange={(e) => {
                                const label = e.target.value
                                updateTestVariable(index, {
                                  label,
                                  key: variable.key || variableKeySlug(label),
                                })
                              }}
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-ase-muted">
                              {t('adminCatalog.testVariableFields.key')}
                            </span>
                            <Input
                              value={variable.key}
                              onChange={(e) => updateTestVariable(index, { key: variableKeySlug(e.target.value) })}
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-ase-muted">
                              {t('adminCatalog.testVariableFields.type')}
                            </span>
                            <Select
                              value={variable.type}
                              onChange={(e) =>
                                updateTestVariable(index, { type: e.target.value as TestInputVariableDef['type'] })
                              }
                            >
                              <option value="text">{t('adminCatalog.testVariableTypes.text')}</option>
                              <option value="secret">{t('adminCatalog.testVariableTypes.secret')}</option>
                            </Select>
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] text-ase-muted">
                              {t('adminCatalog.testVariableFields.description')}
                            </span>
                            <Input
                              placeholder={t('adminCatalog.testVariableFields.descriptionPlaceholder') as string}
                              value={variable.description ?? ''}
                              onChange={(e) => updateTestVariable(index, { description: e.target.value })}
                            />
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-[11px] text-ase-muted">
                            <input
                              type="checkbox"
                              checked={variable.required}
                              onChange={(e) => updateTestVariable(index, { required: e.target.checked })}
                            />
                            {t('adminCatalog.testVariableFields.required')}
                          </label>
                          <button
                            type="button"
                            onClick={() => setTestInputSchema((prev) => prev.filter((_, i) => i !== index))}
                            className="inline-flex items-center gap-1 text-[11px] text-ase-error hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('adminCatalog.removeTestVariable')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <PricingEngineSection
            pillarCode={typeWatch}
            dimensionSelections={dimensionSelectionsWatch ?? []}
            onDimensionSelectionsChange={(next) => form.setValue('dimension_selections', next)}
            quantity={typeWatch === 'book' ? (pageCountWatch ?? null) : null}
            onQuantityChange={(n) => form.setValue('page_count', n)}
            onUseRecommended={(price) => form.setValue('price', price)}
          />
        </div>
      </form>
    </Modal>
  )
}
