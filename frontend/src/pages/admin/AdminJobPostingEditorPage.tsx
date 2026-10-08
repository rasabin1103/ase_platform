import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  clearJobPostingImage,
  createAdminJobPosting,
  getAdminJobPosting,
  updateAdminJobPosting,
  uploadJobPostingImage,
  type JobPostingAdmin,
  type JobPostingAdminPayload,
  type JobContractType,
  type JobPostingStatus,
  type JobSalaryType,
  type JobScheduleType,
  type JobWorkMode,
} from '../../api/jobPostingsAdmin.api'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

type FormValues = JobPostingAdminPayload

const emptyDefaults: FormValues = {
  title: '',
  description: '',
  title_en: '',
  description_en: '',
  link_url: '',
  salary_type: 'gross_yearly',
  salary_amount: 0,
  salary_amount_max: null,
  contract_type: 'permanent',
  work_mode: 'onsite',
  schedule_type: 'full_time',
  category: '',
  status: 'draft',
}

function toFormValues(posting: JobPostingAdmin): FormValues {
  return {
    title: posting.title,
    description: posting.description,
    title_en: posting.title_en ?? '',
    description_en: posting.description_en ?? '',
    link_url: posting.link_url,
    salary_type: posting.salary_type,
    salary_amount: Number(posting.salary_amount),
    salary_amount_max: posting.salary_amount_max != null ? Number(posting.salary_amount_max) : null,
    contract_type: posting.contract_type,
    work_mode: posting.work_mode,
    schedule_type: posting.schedule_type,
    category: posting.category,
    status: posting.status,
  }
}

export function AdminJobPostingEditorPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const postingId = id ? Number(id) : undefined
  const isEditing = postingId !== undefined

  const postingQuery = useQuery({
    queryKey: ['admin-job-posting', postingId],
    queryFn: () => getAdminJobPosting(postingId as number),
    enabled: isEditing,
  })

  if (isEditing && postingQuery.isLoading) {
    return <Skeleton className="h-96 rounded-3xl" />
  }

  if (isEditing && postingQuery.isError) {
    return <EmptyState title={t('private.common.couldNotLoad')} description={t('adminJobPostings.loadError')} />
  }

  return <AdminJobPostingEditorForm key={postingId ?? 'new'} postingId={postingId} initial={postingQuery.data ?? null} />
}

function AdminJobPostingEditorForm({ postingId, initial }: { postingId?: number; initial: JobPostingAdmin | null }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = postingId !== undefined

  const form = useForm<FormValues>({ defaultValues: initial ? toFormValues(initial) : emptyDefaults })
  const { errors } = form.formState
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [hasStoredImage, setHasStoredImage] = useState(initial?.has_stored_image ?? false)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-job-postings'] })
    if (postingId) void queryClient.invalidateQueries({ queryKey: ['admin-job-posting', postingId] })
  }

  const createMut = useMutation({
    mutationFn: async (payload: JobPostingAdminPayload) => {
      const created = await createAdminJobPosting(payload)
      if (imageFile) await uploadJobPostingImage(created.id, imageFile)
      return created
    },
    onSuccess: () => {
      invalidate()
      navigate('/admin/job-postings')
    },
  })

  const updateMut = useMutation({
    mutationFn: async (payload: Partial<JobPostingAdminPayload>) => {
      const updated = await updateAdminJobPosting(postingId as number, payload)
      if (imageFile) {
        await uploadJobPostingImage(postingId as number, imageFile)
        setHasStoredImage(true)
      }
      return updated
    },
    onSuccess: () => {
      invalidate()
      setImageFile(null)
      navigate('/admin/job-postings')
    },
  })

  const removeImageMut = useMutation({
    mutationFn: () => clearJobPostingImage(postingId as number),
    onSuccess: () => {
      invalidate()
      setHasStoredImage(false)
    },
  })

  const saving = createMut.isPending || updateMut.isPending

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/job-postings" className="text-xs text-ase-muted hover:text-ase-text">
            {t('adminJobPostings.backToList')}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ase-text">
            {isEditing ? t('adminJobPostings.editTitle') : t('adminJobPostings.newTitle')}
          </h1>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setServerError(null)
          // Only send an "_en" field as an explicit override when the admin
          // actually typed into it this session (dirtyFields) — otherwise
          // send null so the backend auto-translates from the (possibly
          // just-edited) Spanish text instead of permanently locking in
          // whatever text happened to be prefilled from the existing
          // posting. Same fix as the catalog admin editor.
          const dirty = form.formState.dirtyFields
          const englishOverrides = {
            title_en: dirty.title_en && values.title_en ? values.title_en.trim() : null,
            description_en: dirty.description_en && values.description_en ? values.description_en.trim() : null,
          }
          const payload: JobPostingAdminPayload = {
            ...values,
            ...englishOverrides,
            salary_amount: Number(values.salary_amount),
            salary_amount_max:
              values.salary_amount_max === null || values.salary_amount_max === undefined || Number.isNaN(Number(values.salary_amount_max))
                ? null
                : Number(values.salary_amount_max),
          }
          if (payload.salary_amount_max != null && payload.salary_amount_max < payload.salary_amount) {
            setServerError(t('adminJobPostings.validation.salaryRange') as string)
            return
          }
          try {
            if (isEditing) {
              await updateMut.mutateAsync(payload)
            } else {
              await createMut.mutateAsync(payload)
            }
          } catch (err) {
            setServerError(parseApiError(err, t('adminJobPostings.saveError') as string).message)
          }
        })}
      >
        <Card className="space-y-4 rounded-3xl border-white/10 bg-ase-surface/60 p-6">
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.title')}</span>
            <Input {...form.register('title', { required: t('adminJobPostings.validation.required') as string })} />
            {errors.title && <p className="mt-1 text-xs text-ase-error">{errors.title.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.description')}</span>
            <Textarea {...form.register('description', { required: t('adminJobPostings.validation.required') as string })} rows={6} />
            {errors.description && <p className="mt-1 text-xs text-ase-error">{errors.description.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.titleEn')}</span>
            <Input placeholder={t('adminJobPostings.placeholders.titleEn') as string} {...form.register('title_en')} />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.descriptionEn')}</span>
            <Textarea
              placeholder={t('adminJobPostings.placeholders.descriptionEn') as string}
              {...form.register('description_en')}
              rows={6}
            />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminJobPostings.translationHint')}</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.linkUrl')}</span>
            <Input
              placeholder={t('adminJobPostings.fields.linkUrlPlaceholder') as string}
              {...form.register('link_url', { required: t('adminJobPostings.validation.required') as string })}
            />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminJobPostings.fields.linkUrlHint')}</p>
            {errors.link_url && <p className="mt-1 text-xs text-ase-error">{errors.link_url.message}</p>}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.category')}</span>
              <Input {...form.register('category', { required: t('adminJobPostings.validation.required') as string })} />
              <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminJobPostings.fields.categoryHint')}</p>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.status')}</span>
              <Select {...form.register('status')}>
                {(['draft', 'published'] as JobPostingStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {t(`adminJobPostings.status.${s}`)}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.contractType')}</span>
              <Select {...form.register('contract_type')}>
                {(['permanent', 'temporary', 'freelance', 'internship'] as JobContractType[]).map((v) => (
                  <option key={v} value={v}>
                    {t(`adminJobPostings.contractType.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.workMode')}</span>
              <Select {...form.register('work_mode')}>
                {(['remote', 'hybrid', 'onsite'] as JobWorkMode[]).map((v) => (
                  <option key={v} value={v}>
                    {t(`adminJobPostings.workMode.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.scheduleType')}</span>
              <Select {...form.register('schedule_type')}>
                {(['full_time', 'part_time'] as JobScheduleType[]).map((v) => (
                  <option key={v} value={v}>
                    {t(`adminJobPostings.scheduleType.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.salaryType')}</span>
              <Select {...form.register('salary_type')}>
                {(['gross_yearly', 'hourly'] as JobSalaryType[]).map((v) => (
                  <option key={v} value={v}>
                    {t(`adminJobPostings.salaryType.${v}`)}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.salaryAmount')}</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register('salary_amount', { required: t('adminJobPostings.validation.required') as string, valueAsNumber: true })}
              />
              {errors.salary_amount && <p className="mt-1 text-xs text-ase-error">{errors.salary_amount.message}</p>}
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminJobPostings.fields.salaryAmountMax')}</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...form.register('salary_amount_max', {
                  setValueAs: (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
                })}
              />
            </label>
          </div>
        </Card>

        <Card className="space-y-4 rounded-3xl border-white/10 bg-ase-surface/60 p-6">
          <ImageUploadField
            label={t('adminJobPostings.fields.image') as string}
            previewSrc={hasStoredImage ? `/api/v1/admin/job-postings/${postingId}/image` : undefined}
            previewCacheKey={initial?.updated_at}
            onFileSelect={setImageFile}
            uploading={updateMut.isPending && Boolean(imageFile)}
            uploadLabel={t('adminJobPostings.fields.uploadImage') as string}
            fit="contain"
          />
          {isEditing && hasStoredImage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-ase-error/30"
              disabled={removeImageMut.isPending}
              onClick={() => removeImageMut.mutate()}
            >
              {t('adminJobPostings.fields.removeImage')}
            </Button>
          ) : null}
        </Card>

        {serverError && (
          <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{serverError}</div>
        )}

        <div className="flex justify-end gap-3">
          <ButtonLink to="/admin/job-postings" variant="secondary">
            {t('adminJobPostings.cancel')}
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            {saving ? t('adminJobPostings.saving') : t('adminJobPostings.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
