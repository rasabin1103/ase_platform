import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  createBlogComment,
  deleteBlogComment,
  listBlogComments,
  type BlogComment as BlogCommentType,
} from '../../api/publicBlog.api'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function CommentRow({
  comment,
  slug,
  onReply,
  replyOpen,
  isReply = false,
}: {
  comment: BlogCommentType
  slug: string
  onReply: (id: number | null) => void
  replyOpen: number | null
  isReply?: boolean
}) {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const deleteMut = useMutation({
    mutationFn: () => deleteBlogComment(slug, comment.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['blog-comments', slug] }),
  })

  return (
    <div className={isReply ? 'ml-8 mt-3' : 'border-t border-white/[0.06] pt-4 first:border-t-0 first:pt-0'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ase-text">{comment.authorName}</span>
            <span className="text-xs text-ase-muted">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ase-text2">{comment.content}</p>
          <div className="mt-2 flex items-center gap-3">
            {!isReply ? (
              <button
                type="button"
                className="text-xs font-medium text-ase-muted hover:text-ase-text"
                onClick={() => onReply(replyOpen === comment.id ? null : comment.id)}
              >
                {t('blogPage.comments.reply')}
              </button>
            ) : null}
            {comment.canDelete ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-300 hover:text-rose-200"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                {t('blogPage.comments.delete')}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!isReply && replyOpen === comment.id ? (
        <div className="ml-8 mt-3">
          <CommentForm slug={slug} parentId={comment.id} onDone={() => onReply(null)} />
        </div>
      ) : null}

      {comment.replies.length > 0
        ? comment.replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} slug={slug} onReply={onReply} replyOpen={replyOpen} isReply />
          ))
        : null}
    </div>
  )
}

function CommentForm({ slug, parentId, onDone }: { slug: string; parentId?: number; onDone?: () => void }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const createMut = useMutation({
    mutationFn: () => createBlogComment(slug, { content, parentId: parentId ?? null }),
    onSuccess: () => {
      setContent('')
      void queryClient.invalidateQueries({ queryKey: ['blog-comments', slug] })
      onDone?.()
    },
  })

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (!content.trim()) return
        createMut.mutate()
      }}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={2000}
        rows={parentId ? 2 : 3}
        placeholder={t(parentId ? 'blogPage.comments.replyPlaceholder' : 'blogPage.comments.placeholder') as string}
        className="w-full resize-none rounded-xl border border-white/10 bg-ase-surface px-3 py-2 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={createMut.isPending || !content.trim()}>
          {createMut.isPending ? t('blogPage.comments.sending') : t('blogPage.comments.send')}
        </Button>
        {parentId ? (
          <Button type="button" size="sm" variant="secondary" onClick={onDone}>
            {t('blogPage.comments.cancel')}
          </Button>
        ) : null}
      </div>
      {createMut.isError ? <p className="text-xs text-rose-300">{t('blogPage.comments.error')}</p> : null}
    </form>
  )
}

export function BlogComments({ slug }: { slug: string }) {
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()
  const [replyOpen, setReplyOpen] = useState<number | null>(null)

  const query = useQuery({
    queryKey: ['blog-comments', slug],
    queryFn: () => listBlogComments(slug),
  })

  return (
    <section className="mt-4">
      <h2 className="text-xl font-bold text-ase-text">
        {t('blogPage.comments.title')} {query.data ? `(${query.data.total})` : null}
      </h2>

      <div className="mt-4">
        {isAuthenticated ? (
          <CommentForm slug={slug} />
        ) : (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-ase-text2">
            {t('blogPage.comments.loginToComment')}{' '}
            <Link to="/login" className="font-medium text-cyan-300 hover:underline">
              {t('blogPage.comments.loginLink')}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {query.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : query.isError ? (
          <p className="text-sm text-rose-300">{t('blogPage.comments.loadError')}</p>
        ) : (query.data?.comments.length ?? 0) === 0 ? (
          <p className="text-sm text-ase-muted">{t('blogPage.comments.empty')}</p>
        ) : (
          query.data?.comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} slug={slug} onReply={setReplyOpen} replyOpen={replyOpen} />
          ))
        )}
      </div>
    </section>
  )
}
