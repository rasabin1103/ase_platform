import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Eye, MessageCircle, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import { deleteAdminBlogPost, listAdminBlogPosts, listAdminBlogTags, type BlogPostAdmin } from '../../api/blogAdmin.api'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { PremiumHero, PremiumMetricCard } from '../../components/admin/premium/PremiumAdminUi'
import { BlogStatsModal } from '../../components/admin/BlogStatsModal'
import { useI18n } from '../../i18n'

export function AdminBlogPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [deleting, setDeleting] = useState<BlogPostAdmin | null>(null)
  const [viewingStats, setViewingStats] = useState<BlogPostAdmin | null>(null)

  const query = useQuery({
    queryKey: ['admin-blog', search, tagFilter],
    queryFn: () =>
      listAdminBlogPosts({
        limit: 200,
        search: search.trim() || undefined,
        tags: tagFilter.length ? tagFilter : undefined,
      }),
  })
  const tagsQuery = useQuery({ queryKey: ['admin-blog-tags'], queryFn: listAdminBlogTags })

  const deleteMut = useMutation({
    mutationFn: deleteAdminBlogPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-blog'] })
      setDeleting(null)
    },
  })

  const items = query.data?.items ?? []
  const publishedCount = items.filter((i) => i.status === 'published').length

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminBlog.premium.badge')}
        title={t('adminBlog.title')}
        subtitle={t('adminBlog.subtitle')}
        actions={
          <Link to="/admin/blog/new">
            <Button size="sm" leftIcon={<span>+</span>}>
              {t('adminBlog.create')}
            </Button>
          </Link>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              <PremiumMetricCard label={t('adminBlog.colStatus')} value={query.data?.total ?? items.length} icon="◇" accent="from-cyan-300 to-blue-500" />
              <PremiumMetricCard label={t('adminBlog.published')} value={publishedCount} icon="✓" accent="from-emerald-300 to-teal-500" />
            </div>
          </Card>
        }
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 backdrop-blur">
        <Input
          className="h-11 min-w-[200px] rounded-xl border-white/10 bg-ase-bg2/50"
          placeholder={t('adminBlog.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <TagFilterBar
        tags={tagsQuery.data ?? []}
        selected={tagFilter}
        onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
        onClear={() => setTagFilter([])}
        label={t('adminBlog.filters.tagsLabel')}
        clearLabel={t('adminBlog.filters.clearTags')}
      />

      {query.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('adminBlog.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('adminBlog.empty')} description={t('adminBlog.subtitle')} />
      ) : (
        <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0">
          <div className="grid grid-cols-[1fr_190px_110px_120px_220px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
            <span>{t('adminBlog.colTitle')}</span>
            <span>{t('adminBlog.stats.title')}</span>
            <span>{t('adminBlog.colStatus')}</span>
            <span>{t('adminBlog.colUpdated')}</span>
            <span>{t('adminBlog.colActions')}</span>
          </div>
          {items.map((post) => (
            <div key={post.id} className="grid grid-cols-[1fr_190px_110px_120px_220px] items-center gap-2 px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-ase-text">{post.title}</div>
                <div className="text-xs text-ase-muted">/{post.slug}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-ase-muted">
                <span className="inline-flex items-center gap-1" title={t('adminBlog.stats.views') as string}>
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {post.viewsTotal}
                </span>
                <span className="inline-flex items-center gap-1" title={t('adminBlog.stats.likes') as string}>
                  <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {post.likesCount}
                </span>
                <span className="inline-flex items-center gap-1" title={t('adminBlog.stats.dislikes') as string}>
                  <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {post.dislikesCount}
                </span>
                <span className="inline-flex items-center gap-1" title={t('adminBlog.stats.comments') as string}>
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {post.commentsCount}
                </span>
                <span className="inline-flex items-center gap-1" title={t('adminBlog.stats.shares') as string}>
                  <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {post.sharesTotal}
                </span>
              </div>
              <Badge variant={post.status === 'published' ? 'success' : 'default'}>{t(`adminBlog.status.${post.status}`)}</Badge>
              <span className="text-xs text-ase-muted">{new Date(post.updated_at).toLocaleDateString()}</span>
              <span className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" leftIcon={<BarChart3 className="h-3.5 w-3.5" strokeWidth={1.75} />} onClick={() => setViewingStats(post)}>
                  {t('adminBlog.stats.button')}
                </Button>
                <Link to={`/admin/blog/${post.id}/edit`}>
                  <Button size="sm" variant="secondary">
                    {t('adminBlog.edit')}
                  </Button>
                </Link>
                <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setDeleting(post)}>
                  {t('adminBlog.delete')}
                </Button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={t('adminBlog.delete')}>
        <p className="text-sm text-ase-text2">{t('adminBlog.confirmDelete')}</p>
        <p className="mt-2 font-medium text-ase-text">{deleting?.title}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            {t('adminBlog.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteMut.isPending} onClick={() => deleting && deleteMut.mutate(deleting.id)}>
            {t('adminBlog.delete')}
          </Button>
        </div>
      </Modal>

      <BlogStatsModal post={viewingStats} onClose={() => setViewingStats(null)} />
    </div>
  )
}
