import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Eye, MessageCircle, Share2, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react'
import { deleteAdminBlogComment, listAdminBlogComments, type BlogCommentAdmin, type BlogPostAdmin } from '../../api/blogAdmin.api'
import { useI18n } from '../../i18n'
import { Modal } from '../ui/Modal'
import { Skeleton } from '../ui/Skeleton'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="text-ase-muted">{icon}</div>
      <div>
        <div className="text-lg font-semibold text-ase-text">{value}</div>
        <div className="text-xs text-ase-muted">{label}</div>
      </div>
    </div>
  )
}

function CommentModerationRow({ comment, postId }: { comment: BlogCommentAdmin; postId: number }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteAdminBlogComment(postId, comment.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-blog-comments', postId] }),
  })

  return (
    <div className="border-t border-white/[0.06] py-3 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ase-text">{comment.authorName}</span>
            <span className="text-xs text-ase-muted">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ase-text2">{comment.content}</p>
        </div>
        <button
          type="button"
          disabled={deleteMut.isPending}
          onClick={() => {
            if (window.confirm(t('adminBlog.stats.confirmDeleteComment') as string)) deleteMut.mutate()
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-ase-error/30 px-2 py-1 text-xs font-medium text-rose-300 transition hover:bg-ase-error/10"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          {t('adminBlog.stats.deleteComment')}
        </button>
      </div>

      {comment.replies.length > 0 ? (
        <div className="ml-6 mt-2 space-y-2 border-l border-white/10 pl-4">
          {comment.replies.map((reply) => (
            <CommentModerationRow key={reply.id} comment={reply} postId={postId} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function BlogStatsModal({ post, onClose }: { post: BlogPostAdmin | null; onClose: () => void }) {
  const { t } = useI18n()

  const commentsQuery = useQuery({
    queryKey: ['admin-blog-comments', post?.id],
    queryFn: () => listAdminBlogComments(post!.id),
    enabled: Boolean(post),
  })

  const viewsAnonymous = post ? Math.max(0, post.viewsTotal - post.viewsAuthenticated) : 0
  const networkEntries = post ? Object.entries(post.sharesByNetwork) : []

  return (
    <Modal open={Boolean(post)} onClose={onClose} title={post ? `${t('adminBlog.stats.title')} — ${post.title}` : ''}>
      {post ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={<Eye className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.views')} value={post.viewsTotal} />
            <StatTile icon={<Eye className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.viewsAuthenticated')} value={post.viewsAuthenticated} />
            <StatTile icon={<Eye className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.viewsAnonymous')} value={viewsAnonymous} />
            <StatTile icon={<ThumbsUp className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.likes')} value={post.likesCount} />
            <StatTile icon={<ThumbsDown className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.dislikes')} value={post.dislikesCount} />
            <StatTile icon={<MessageCircle className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.comments')} value={post.commentsCount} />
            <StatTile icon={<Share2 className="h-5 w-5" strokeWidth={1.75} />} label={t('adminBlog.stats.shares')} value={post.sharesTotal} />
          </div>

          {networkEntries.length > 0 ? (
            <div>
              <h3 className="text-xs font-semibold uppercase text-ase-muted">{t('adminBlog.stats.sharesByNetwork')}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {networkEntries.map(([network, count]) => (
                  <span key={network} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-ase-text2">
                    {network}: <span className="font-semibold text-ase-text">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-ase-text">{t('adminBlog.stats.moderation')}</h3>
            <div className="mt-3">
              {commentsQuery.isLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : commentsQuery.isError ? (
                <p className="text-sm text-rose-300">{t('adminBlog.stats.loadError')}</p>
              ) : (commentsQuery.data?.comments.length ?? 0) === 0 ? (
                <p className="text-sm text-ase-muted">{t('adminBlog.stats.moderationEmpty')}</p>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2">
                  {commentsQuery.data?.comments.map((comment) => (
                    <CommentModerationRow key={comment.id} comment={comment} postId={post.id} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
