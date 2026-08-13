import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getPublicBlogPost } from '../../api/publicBlog.api'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'

export function BlogPostPage() {
  const { t } = useI18n()
  const { slug } = useParams<{ slug: string }>()

  const query = useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: () => getPublicBlogPost(slug as string),
    enabled: Boolean(slug),
    retry: false,
  })

  const post = query.data
  usePageTitle(
    (post?.meta_title || post?.title || t('blogPage.title')) as string,
    (post?.meta_description || post?.excerpt) as string | undefined,
  )

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-14">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (query.isError || !post) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-14">
        <EmptyState title={t('blogPage.notFoundTitle')} description={t('blogPage.notFoundBody')} />
        <Link to="/blog" className="mt-6 inline-block text-sm text-ase-text2 hover:text-ase-text">
          {t('blogPage.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-14">
      <Link to="/blog" className="text-sm text-ase-text2 hover:text-ase-text">
        {t('blogPage.backToList')}
      </Link>

      <Eyebrow className="mt-6">{t('blogPage.badge')}</Eyebrow>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{post.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ase-muted">
        {post.published_at && <span>{new Date(post.published_at).toLocaleDateString()}</span>}
        {post.author_name && <span>· {post.author_name}</span>}
      </div>
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tg) => (
            <Badge key={tg} variant="default">
              {tg}
            </Badge>
          ))}
        </div>
      )}

      {post.cover_image_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <img src={post.cover_image_url} alt="" className="w-full object-cover" />
        </div>
      )}

      <div
        className={[
          'mt-8 max-w-none text-ase-text2',
          '[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ase-text',
          '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ase-text',
          '[&_p]:mb-4 [&_p]:leading-relaxed',
          '[&_a]:text-cyan-300 [&_a]:underline [&_a]:decoration-cyan-300/40',
          '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6',
          '[&_li]:mb-1',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-cyan-300/40 [&_blockquote]:pl-4 [&_blockquote]:italic',
          '[&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs',
          '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-black/30 [&_pre]:p-3',
          '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl',
        ].join(' ')}
        // Rendering server-sanitized HTML only (see app/core/html_sanitize.py
        // on the backend — every write is stripped to a narrow tag/attribute
        // allowlist before storage). Never render unsanitized user input here.
        dangerouslySetInnerHTML={{ __html: post.content_html }}
      />
    </div>
  )
}
