import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicBlogPost } from '../../api/publicBlog.api'
import { Badge } from '../../components/ui/Badge'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { EmptyState } from '../../components/ui/EmptyState'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { ImageLightbox } from '../../components/ui/ImageLightbox'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'
import { resolveMediaUrl } from '../../utils/mediaUrls'
import { BlogComments } from '../../components/catalog/BlogComments'
import { BlogReactions } from '../../components/catalog/BlogReactions'
import { BlogShareBar } from '../../components/catalog/BlogShareBar'

export function BlogPostPage() {
  const { t } = useI18n()
  const { slug } = useParams<{ slug: string }>()
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

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
      <div className="mx-auto w-full max-w-[min(100%,1440px)] px-5 py-14 sm:px-8 lg:px-12">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (query.isError || !post) {
    return (
      <div className="mx-auto w-full max-w-[min(100%,1440px)] px-5 py-14 sm:px-8 lg:px-12">
        <EmptyState title={t('blogPage.notFoundTitle')} description={t('blogPage.notFoundBody')} />
        <Link to="/blog" className="mt-6 inline-block text-sm text-ase-text2 hover:text-ase-text">
          {t('blogPage.backToList')}
        </Link>
      </div>
    )
  }

  return (
    // Same outer width as the site header (max 1440px) so the article page
    // doesn't look narrower than the rest of the site — the running text
    // itself stays inside a comfortable inner reading column further down,
    // while the breadcrumb/title/cover image use the full width.
    <div className="mx-auto w-full max-w-[min(100%,1440px)] px-5 py-14 sm:px-8 lg:px-12">
      <Breadcrumbs
        items={[
          { label: t('blogPage.breadcrumbHome') as string, to: '/' },
          { label: t('blogPage.badge') as string, to: '/blog' },
          { label: post.title },
        ]}
      />

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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-white/[0.06] py-3">
        <BlogReactions
          slug={post.slug}
          likesCount={post.likesCount}
          dislikesCount={post.dislikesCount}
          myReaction={post.myReaction}
        />
        <BlogShareBar title={post.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
      </div>

      {post.cover_image_url && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <img
            src={resolveMediaUrl(post.cover_image_url) ?? undefined}
            alt=""
            onClick={() => setLightboxSrc(resolveMediaUrl(post.cover_image_url))}
            className="max-h-[30rem] w-full cursor-zoom-in object-cover transition hover:brightness-95"
          />
        </div>
      )}

      <div
        className={[
          // Comfortable article reading measure — larger, more relaxed body
          // text than the default so long posts stay readable regardless of
          // what mix of elements the TipTap editor produced. Spans the same
          // full width as the rest of the page (title, image) rather than a
          // separately narrowed column.
          'mt-8 max-w-none text-[1.0625rem] leading-8 text-ase-text2',
          '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
          '[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-ase-text',
          '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-ase-text',
          '[&_p]:mb-5 [&_p]:leading-8 [&_p]:[overflow-wrap:anywhere]',
          '[&_strong]:font-semibold [&_strong]:text-ase-text',
          '[&_a]:font-medium [&_a]:text-cyan-300 [&_a]:underline [&_a]:decoration-cyan-300/40 [&_a]:underline-offset-2 [&_a]:transition hover:[&_a]:decoration-cyan-300 [&_a]:[overflow-wrap:anywhere]',
          '[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6',
          '[&_ul_ul]:mt-1.5 [&_ul_ul]:mb-0 [&_ol_ol]:mt-1.5 [&_ol_ol]:mb-0',
          '[&_li]:leading-7',
          '[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-300/40 [&_blockquote]:py-1 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-ase-text2/90',
          '[&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-ase-text',
          '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:bg-black/30 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre_code]:bg-transparent [&_pre_code]:p-0',
          '[&_img]:mx-auto [&_img]:my-6 [&_img]:max-h-[32rem] [&_img]:w-auto [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-xl [&_img]:border [&_img]:border-white/[0.08] [&_img]:transition hover:[&_img]:brightness-95',
        ].join(' ')}
        // Rendering server-sanitized HTML only (see app/core/html_sanitize.py
        // on the backend — every write is stripped to a narrow tag/attribute
        // allowlist before storage). Never render unsanitized user input here.
        dangerouslySetInnerHTML={{ __html: post.content_html }}
        // Event delegation: the article body comes from raw HTML, so
        // individual <img> tags can't get their own onClick — catch clicks
        // at the container and open the lightbox only when the click
        // actually landed on an image.
        onClick={(e) => {
          const target = e.target as HTMLElement
          if (target.tagName === 'IMG') {
            const img = target as HTMLImageElement
            setLightboxSrc(img.currentSrc || img.src)
          }
        }}
      />

      <div className="mt-12 max-w-3xl border-t border-white/[0.06] pt-8">
        <BlogComments slug={post.slug} />
      </div>

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
