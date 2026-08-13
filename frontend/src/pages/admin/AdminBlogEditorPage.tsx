import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  clearBlogCoverImage,
  createAdminBlogPost,
  getAdminBlogPost,
  updateAdminBlogPost,
  uploadBlogCoverImage,
  type BlogPostAdmin,
  type BlogPostAdminPayload,
  type BlogPostStatus,
} from '../../api/blogAdmin.api'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { RichTextEditor } from '../../components/admin/premium/RichTextEditor'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Textarea } from '../../components/ui/Textarea'
import { useI18n } from '../../i18n'
import { parseApiError } from '../../utils/apiError'

type FormValues = Omit<BlogPostAdminPayload, 'tags' | 'content_html'>

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

const emptyDefaults: FormValues = {
  title: '',
  slug: '',
  excerpt: '',
  cover_image_url: null,
  author_name: 'Arce Sabin Engineering',
  status: 'draft',
  meta_title: null,
  meta_description: null,
}

function toFormValues(post: BlogPostAdmin): FormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover_image_url: post.cover_image_url,
    author_name: post.author_name,
    status: post.status,
    meta_title: post.meta_title,
    meta_description: post.meta_description,
  }
}

/** Route shell: resolves the post (if editing) before the form ever mounts,
 * so the form's initial state is always correct on first render — no
 * effect-based sync from query data into local state needed. The inner
 * form is keyed by post id, so switching between two existing posts (were
 * that ever linked directly) remounts it with fresh state too. */
export function AdminBlogEditorPage() {
  const { t } = useI18n()
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : undefined
  const isEditing = postId !== undefined

  const postQuery = useQuery({
    queryKey: ['admin-blog-post', postId],
    queryFn: () => getAdminBlogPost(postId as number),
    enabled: isEditing,
  })

  if (isEditing && postQuery.isLoading) {
    return <Skeleton className="h-96 rounded-[2rem]" />
  }

  if (isEditing && postQuery.isError) {
    return <EmptyState title={t('private.common.couldNotLoad')} description={t('adminBlog.loadError')} />
  }

  return <AdminBlogEditorForm key={postId ?? 'new'} postId={postId} initial={postQuery.data ?? null} />
}

function AdminBlogEditorForm({ postId, initial }: { postId?: number; initial: BlogPostAdmin | null }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = postId !== undefined

  const form = useForm<FormValues>({ defaultValues: initial ? toFormValues(initial) : emptyDefaults })
  const { errors } = form.formState
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const [tagsInput, setTagsInput] = useState(initial ? initial.tags.join(', ') : '')
  const [contentHtml, setContentHtml] = useState(initial ? initial.content_html : '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [hasStoredImage, setHasStoredImage] = useState(initial?.has_stored_image ?? false)

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-blog-tags'] })
    if (postId) void queryClient.invalidateQueries({ queryKey: ['admin-blog-post', postId] })
  }

  const createMut = useMutation({
    mutationFn: async (payload: BlogPostAdminPayload) => {
      const created = await createAdminBlogPost(payload)
      if (imageFile) await uploadBlogCoverImage(created.id, imageFile)
      return created
    },
    onSuccess: (created) => {
      invalidate()
      navigate(`/admin/blog/${created.id}/edit`, { replace: true })
    },
  })

  const updateMut = useMutation({
    mutationFn: async (payload: Partial<BlogPostAdminPayload>) => {
      const updated = await updateAdminBlogPost(postId as number, payload)
      if (imageFile) {
        await uploadBlogCoverImage(postId as number, imageFile)
        setHasStoredImage(true)
      }
      return updated
    },
    onSuccess: () => {
      invalidate()
      setImageFile(null)
    },
  })

  const removeCoverMut = useMutation({
    mutationFn: () => clearBlogCoverImage(postId as number),
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
          <Link to="/admin/blog" className="text-xs text-ase-muted hover:text-ase-text">
            {t('adminBlog.backToList')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ase-text">
            {isEditing ? t('adminBlog.editTitle') : t('adminBlog.newTitle')}
          </h1>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(async (values) => {
          setServerError(null)
          const tags = Array.from(new Set(tagsInput.split(',').map((tg) => tg.trim()).filter(Boolean)))
          if (!contentHtml.trim() || contentHtml === '<p></p>') {
            setServerError(t('adminBlog.validation.contentRequired') as string)
            return
          }
          try {
            if (isEditing) {
              await updateMut.mutateAsync({ ...values, tags, content_html: contentHtml })
            } else {
              await createMut.mutateAsync({ ...values, tags, content_html: contentHtml })
            }
          } catch (err) {
            const parsed = parseApiError(err, t('adminBlog.saveError') as string)
            const isSlugConflict = /slug/i.test(parsed.message) && /exist/i.test(parsed.message)
            setServerError(isSlugConflict ? (t('adminBlog.slugConflict') as string) : parsed.message)
          }
        })}
      >
        <Card className="space-y-4 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 backdrop-blur">
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.title')}</span>
            <Input
              {...form.register('title', {
                required: t('adminBlog.validation.required') as string,
                onChange: (e) => {
                  if (!slugTouched) form.setValue('slug', slugify(e.target.value))
                },
              })}
            />
            {errors.title && <p className="mt-1 text-xs text-ase-error">{errors.title.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.slug')}</span>
            <Input
              {...form.register('slug', { required: t('adminBlog.validation.required') as string })}
              onFocus={() => setSlugTouched(true)}
              onChange={(e) => {
                setSlugTouched(true)
                form.setValue('slug', slugify(e.target.value))
              }}
            />
            {errors.slug && <p className="mt-1 text-xs text-ase-error">{errors.slug.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.excerpt')}</span>
            <Textarea
              {...form.register('excerpt', { required: t('adminBlog.validation.required') as string })}
              maxLength={500}
            />
            {errors.excerpt && <p className="mt-1 text-xs text-ase-error">{errors.excerpt.message}</p>}
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.author')}</span>
              <Input {...form.register('author_name')} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.status')}</span>
              <Select {...form.register('status')}>
                {(['draft', 'published'] as BlogPostStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {t(`adminBlog.status.${s}`)}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.tags')}</span>
            <Input
              placeholder={t('adminCatalog.placeholders.tags') as string}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </label>
        </Card>

        <Card className="space-y-4 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 backdrop-blur">
          <ImageUploadField
            label={t('adminBlog.fields.coverImage') as string}
            previewSrc={hasStoredImage ? `/api/v1/admin/blog/${postId}/image` : initial?.cover_image_url}
            previewCacheKey={initial?.updated_at}
            onFileSelect={setImageFile}
            uploading={updateMut.isPending && Boolean(imageFile)}
            uploadLabel={t('adminBlog.fields.uploadCover') as string}
          />
          {isEditing && hasStoredImage ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-ase-error/30"
              disabled={removeCoverMut.isPending}
              onClick={() => removeCoverMut.mutate()}
            >
              {t('adminBlog.fields.removeCover')}
            </Button>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.coverImageUrl')}</span>
            <Input placeholder="https://…" {...form.register('cover_image_url')} />
            <p className="mt-1 text-[11px] leading-snug text-ase-muted">{t('adminBlog.coverImageHint')}</p>
          </label>
        </Card>

        <Card className="space-y-3 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 backdrop-blur">
          <span className="block text-xs text-ase-muted">{t('adminBlog.fields.content')}</span>
          <RichTextEditor
            initialContent={contentHtml}
            onChange={setContentHtml}
            placeholder={t('adminBlog.fields.contentPlaceholder') as string}
          />
        </Card>

        <Card className="space-y-4 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 backdrop-blur">
          <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('adminBlog.seoSection')}</span>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.metaTitle')}</span>
            <Input {...form.register('meta_title')} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-ase-muted">{t('adminBlog.fields.metaDescription')}</span>
            <Textarea {...form.register('meta_description')} maxLength={300} />
          </label>
        </Card>

        {serverError && (
          <div className="rounded-xl border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{serverError}</div>
        )}

        <div className="flex justify-end gap-3">
          <Link to="/admin/blog">
            <Button type="button" variant="secondary">
              {t('adminBlog.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? t('adminBlog.saving') : t('adminBlog.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
