import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Gamepad2 } from 'lucide-react'
import { getPublicBlogPost, listPublicBlogPosts } from '../../api/publicBlog.api'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { ButtonLink } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { ImageLightbox } from '../../components/ui/ImageLightbox'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'
import { usePageTitle } from '../../hooks/usePageTitle'
import { resolveMediaUrl } from '../../utils/mediaUrls'
import { BlogComments } from '../../components/catalog/BlogComments'
import { BlogReactions } from '../../components/catalog/BlogReactions'
import { BlogShareBar } from '../../components/catalog/BlogShareBar'
import { JsonLd, SITE_URL } from '../../components/seo/JsonLd'

/** Tipografía del cuerpo del artículo (HTML saneado del editor). */
const ARTICLE_CLASSES = [
  'text-[1.075rem] leading-8 text-ase-text2',
  '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
  '[&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:scroll-mt-32 [&_h2]:font-display [&_h2]:text-[1.75rem] [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-ase-text',
  '[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-ase-text',
  '[&_p]:mb-6 [&_p]:leading-8 [&_p]:[overflow-wrap:anywhere]',
  '[&_strong]:font-semibold [&_strong]:text-ase-text',
  '[&_a]:font-medium [&_a]:text-sky-300 [&_a]:underline [&_a]:decoration-sky-300/40 [&_a]:underline-offset-4 [&_a]:transition hover:[&_a]:decoration-sky-300 [&_a]:[overflow-wrap:anywhere]',
  '[&_ul]:mb-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6',
  '[&_li]:pl-1 [&_li]:leading-7 [&_li::marker]:text-ase-brand',
  '[&_ul_ul]:mt-2 [&_ul_ul]:mb-0 [&_ol_ol]:mt-2 [&_ol_ol]:mb-0',
  '[&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-ase-brand [&_blockquote]:bg-ase-brand/[0.07] [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:leading-relaxed [&_blockquote]:text-ase-text [&_blockquote_p]:mb-0',
  '[&_code]:rounded-md [&_code]:bg-white/[0.08] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-sky-100',
  '[&_pre]:my-8 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-white/[0.08] [&_pre]:bg-black/40 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-relaxed [&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_hr]:my-12 [&_hr]:border-white/10',
  '[&_table]:my-8 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-white/15 [&_th]:py-2 [&_th]:text-left [&_th]:text-ase-text [&_td]:border-b [&_td]:border-white/[0.06] [&_td]:py-2',
  '[&_img]:mx-auto [&_img]:my-8 [&_img]:max-h-[32rem] [&_img]:w-auto [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-2xl [&_img]:border [&_img]:border-white/[0.08] [&_img]:transition hover:[&_img]:brightness-95',
].join(' ')

type Heading = { id: string; text: string }

function slugify(text: string, i: number) {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return `${base || 'seccion'}-${i + 1}`
}

/** Extrae los h2 del HTML (puro, sin tocar el DOM de la página). */
function extractHeadings(html: string): Heading[] {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll('h2')).map((h, i) => ({
    id: slugify(h.textContent ?? '', i),
    text: (h.textContent ?? '').trim(),
  }))
}

function readingMinutes(html: string) {
  const words = html
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function BlogPostPage() {
  const { t, language } = useI18n()
  const c = (language === 'en' ? pagesV2En : pagesV2Es).blog
  const { slug } = useParams<{ slug: string }>()
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const articleRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const query = useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: () => getPublicBlogPost(slug as string),
    enabled: Boolean(slug),
    retry: false,
  })
  const moreQuery = useQuery({
    queryKey: ['public-blog', 'more'],
    queryFn: () => listPublicBlogPosts({ limit: 4 }),
    staleTime: 5 * 60_000,
  })

  const post = query.data
  usePageTitle(
    (post?.meta_title || post?.title || t('blogPage.title')) as string,
    (post?.meta_description || post?.excerpt) as string | undefined,
  )

  const headings = useMemo(() => (post ? extractHeadings(post.content_html) : []), [post])
  const minutes = useMemo(() => (post ? readingMinutes(post.content_html) : 0), [post])
  const more = (moreQuery.data?.items ?? []).filter((p) => p.slug !== slug).slice(0, 3)

  // Tras pintar el HTML: ids en los h2 (para el índice) e imágenes accesibles por teclado.
  useEffect(() => {
    const container = articleRef.current
    if (!container) return
    container.querySelectorAll('h2').forEach((h, i) => {
      if (headings[i]) h.id = headings[i].id
    })
    container.querySelectorAll('img').forEach((el) => {
      el.setAttribute('tabindex', '0')
      el.setAttribute('role', 'button')
      if (!el.getAttribute('aria-label')) {
        el.setAttribute('aria-label', (t('a11y.zoomImage') as string) || 'Open full-screen view')
      }
    })
    if (typeof IntersectionObserver === 'undefined' || headings.length === 0) return
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    container.querySelectorAll('h2').forEach((h) => io.observe(h))
    return () => io.disconnect()
  }, [post?.content_html, headings, t])

  // Barra de progreso de lectura: se actualiza el ancho directamente (sin re-render).
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      const bar = progressRef.current
      if (!el || !bar) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const p = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)))
      bar.style.transform = `scaleX(${p})`
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [post?.content_html])

  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="mt-6 h-5 w-full rounded-lg" />
        <Skeleton className="mt-10 h-80 w-full rounded-3xl" />
      </div>
    )
  }

  if (query.isError || !post) {
    return (
      <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8">
        <EmptyState title={t('blogPage.notFoundTitle')} description={t('blogPage.notFoundBody')} />
        <Link to="/blog" className="mt-6 inline-flex items-center gap-1.5 text-sm text-ase-text2 hover:text-ase-text">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('blogPage.backToList')}
        </Link>
      </div>
    )
  }

  const postJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.cover_image_url ? [resolveMediaUrl(post.cover_image_url)] : undefined,
    datePublished: post.published_at || undefined,
    author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Arce Sabin Engineering',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  }

  const author = post.author_name || c.authorFallback
  const isFounder = /roberto/i.test(post.author_name ?? '')
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null
  const initials = author
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const avatar = (size: string) =>
    isFounder ? (
      <span
        className={cn('relative shrink-0 overflow-hidden rounded-full bg-ase-brand/30 ring-2 ring-ase-brand/40', size)}
      >
        <img src="/images/founder-roberto.webp" alt="" className="h-full w-full object-cover object-[50%_10%]" />
      </span>
    ) : (
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-full ase-gradient-brand text-sm font-semibold text-white',
          size,
        )}
      >
        {initials}
      </span>
    )

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <JsonLd data={postJsonLd} />

      {/* Progreso de lectura */}
      <div aria-hidden className="fixed inset-x-0 top-16 z-30 h-0.5 bg-transparent">
        <div ref={progressRef} className="h-full origin-left scale-x-0 ase-gradient-brand" />
      </div>

      {/* Cabecera del artículo */}
      <header className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-12rem] h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-ase-brand/20 blur-[130px]" />
        </div>
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-12 text-center sm:px-8 sm:pt-16">
          <div className="flex justify-center">
            <Breadcrumbs
              items={[
                { label: t('blogPage.breadcrumbHome') as string, to: '/' },
                { label: t('blogPage.badge') as string, to: '/blog' },
                { label: post.title },
              ]}
            />
          </div>
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {post.tags.map((tg) => (
                <span
                  key={tg}
                  className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-200"
                >
                  {tg}
                </span>
              ))}
            </div>
          )}
          <h1 className="mt-6 animate-fade-in-up font-display text-[2.3rem] font-semibold leading-[1.1] tracking-tight text-ase-text sm:text-display-lg">
            {post.title}
          </h1>
          {post.excerpt && (
            <p
              className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-lg leading-relaxed text-ase-text2"
              style={{ animationDelay: '80ms' }}
            >
              {post.excerpt}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-ase-muted">
            <span className="inline-flex items-center gap-2.5">
              {avatar('h-9 w-9')}
              <span className="font-semibold text-ase-text">{author}</span>
            </span>
            {date && <span>{date}</span>}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {minutes} {c.minRead}
            </span>
          </div>
        </div>
      </header>

      {post.cover_image_url && (
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <button
            type="button"
            onClick={() => setLightboxSrc(resolveMediaUrl(post.cover_image_url))}
            aria-label={t('a11y.zoomImage') as string}
            className="block w-full overflow-hidden rounded-3xl border border-white/10 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ase-bg"
          >
            <img
              src={resolveMediaUrl(post.cover_image_url) ?? undefined}
              alt=""
              className="max-h-[34rem] w-full cursor-zoom-in object-cover transition duration-500 hover:scale-[1.01]"
            />
          </button>
        </div>
      )}

      {/* Cuerpo + índice */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article className="mx-auto w-full max-w-[44rem]">
          <div
            ref={articleRef}
            className={ARTICLE_CLASSES}
            // HTML saneado en el servidor (app/core/html_sanitize.py): nunca se pinta entrada sin sanear.
            dangerouslySetInnerHTML={{ __html: post.content_html }}
            onClick={(e) => {
              const target = e.target as HTMLElement
              if (target.tagName === 'IMG') {
                const img = target as HTMLImageElement
                setLightboxSrc(img.currentSrc || img.src)
              }
            }}
            onKeyDown={(e) => {
              const target = e.target as HTMLElement
              if (target.tagName === 'IMG' && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                const img = target as HTMLImageElement
                setLightboxSrc(img.currentSrc || img.src)
              }
            }}
          />

          {/* Reacciones y compartir */}
          <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <p className="text-sm font-semibold text-ase-text">{c.discuss}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <BlogReactions
                slug={post.slug}
                likesCount={post.likesCount}
                dislikesCount={post.dislikesCount}
                myReaction={post.myReaction}
              />
              <BlogShareBar title={post.title} url={typeof window !== 'undefined' ? window.location.href : ''} />
            </div>
          </div>

          {/* Autor */}
          <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-white/10 bg-ase-surface/80 p-6 sm:flex-row sm:items-center">
            {avatar('h-16 w-16')}
            <div>
              <p className="font-display text-lg font-semibold text-ase-text">{author}</p>
              <p className="mt-1 text-sm leading-relaxed text-ase-text2">{isFounder ? c.authorBio : c.teamBio}</p>
            </div>
          </div>

          {/* CTA Academy */}
          <div className="relative mt-6 overflow-hidden rounded-3xl p-px">
            <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-70" />
            <div className="relative flex flex-col gap-5 rounded-[calc(1.5rem-1px)] bg-ase-bg p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div>
                <p className="font-display text-xl font-semibold text-ase-text">{c.ctaTitle}</p>
                <p className="mt-1.5 max-w-md text-sm text-ase-text2">{c.ctaText}</p>
              </div>
              <ButtonLink to="/academy" className="shrink-0" leftIcon={<Gamepad2 className="h-4 w-4" aria-hidden />}>
                {c.ctaButton}
              </ButtonLink>
            </div>
          </div>

          <div className="mt-14 border-t border-white/[0.06] pt-10">
            <BlogComments slug={post.slug} />
          </div>
        </article>

        {/* Índice lateral */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-6">
            {headings.length > 1 && (
              <nav aria-label={c.toc}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{c.toc}</p>
                <ol className="mt-4 space-y-1 border-l border-white/10">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a
                        href={`#${h.id}`}
                        className={cn(
                          '-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-snug transition',
                          activeId === h.id
                            ? 'border-ase-brand font-semibold text-ase-text'
                            : 'border-transparent text-ase-muted hover:text-ase-text',
                        )}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-ase-muted transition hover:text-ase-text"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {c.back}
            </Link>
          </div>
        </aside>
      </div>

      {/* Sigue leyendo */}
      {more.length > 0 && (
        <section className="mt-20 border-t border-white/5 bg-ase-bg2/40 py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-semibold text-ase-text sm:text-3xl">{c.more}</h2>
              <Link
                to="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                {c.back}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/60 transition hover:-translate-y-1 hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                >
                  <div className="relative h-36 overflow-hidden bg-white/[0.03]">
                    {p.cover_image_url ? (
                      <img
                        src={resolveMediaUrl(p.cover_image_url) ?? undefined}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="absolute left-1/3 top-1/4 h-32 w-32 rounded-full bg-ase-brand/30 blur-3xl"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <p className="line-clamp-2 font-display text-lg font-semibold text-ase-text">{p.title}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-ase-text2">{p.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  )
}
