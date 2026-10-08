import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { listPublicBlogPosts, listPublicBlogTags, type BlogPostCard } from '../../api/publicBlog.api'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { cn } from '../../components/ui/cn'
import { PageHero } from '../../components/public/home/PageHero'
import { useI18n } from '../../i18n'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'
import { usePageTitle } from '../../hooks/usePageTitle'
import { resolveMediaUrl } from '../../utils/mediaUrls'

export function BlogListPage() {
  const { t, language } = useI18n()
  const c = (language === 'en' ? pagesV2En : pagesV2Es).blog
  usePageTitle(t('blogPage.title') as string, t('blogPage.subtitle') as string)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string[]>([])

  const query = useQuery({
    queryKey: ['public-blog', search, tagFilter],
    queryFn: () =>
      listPublicBlogPosts({
        limit: 30,
        search: search.trim() || undefined,
        tags: tagFilter.length ? tagFilter : undefined,
      }),
  })
  const tagsQuery = useQuery({ queryKey: ['public-blog-tags'], queryFn: listPublicBlogTags })

  const items = query.data?.items ?? []
  const filtering = Boolean(search.trim() || tagFilter.length)
  // Sin filtros, el artículo más reciente va destacado arriba.
  const [featured, ...rest] = filtering ? [undefined, ...items] : items
  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PageHero
        eyebrow={c.eyebrow}
        titleBefore={c.titleBefore}
        titleHighlight={c.titleHighlight}
        titleAfter={c.titleAfter}
        subtitle={t('blogPage.subtitle')}
        align="left"
        compact
      >
        <label className="relative block w-full max-w-md">
          <span className="sr-only">{t('blogPage.searchPlaceholder')}</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('blogPage.searchPlaceholder') as string}
            className="w-full rounded-xl border border-white/10 bg-ase-surface py-3 pl-10 pr-4 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
          />
        </label>
      </PageHero>

      <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8">
        <TagFilterBar
          tags={tagsQuery.data ?? []}
          selected={tagFilter}
          onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
          onClear={() => setTagFilter([])}
          label={t('blogPage.tags.filterLabel')}
          clearLabel={t('blogPage.tags.clear')}
        />

        <div className="mt-8">
          {query.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-80 w-full rounded-3xl" />
              ))}
            </div>
          ) : query.isError ? (
            <EmptyState title={t('private.common.couldNotLoad')} description={t('blogPage.loadError')} />
          ) : items.length === 0 ? (
            <EmptyState title={t('blogPage.empty')} description={t('blogPage.emptyHint')} />
          ) : (
            <div className="space-y-6">
              {featured && (
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group grid animate-fade-in-up overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/80 transition hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand lg:grid-cols-[1.2fr_1fr]"
                >
                  <Cover post={featured} className="h-60 lg:h-full lg:min-h-[320px]" />
                  <div className="flex flex-col justify-center p-7 sm:p-10">
                    <span className="w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                      {c.featured}
                    </span>
                    <h2 className="mt-5 font-display text-2xl font-semibold leading-tight text-ase-text sm:text-3xl">
                      {featured.title}
                    </h2>
                    <p className="mt-4 line-clamp-4 text-base leading-relaxed text-ase-text2">{featured.excerpt}</p>
                    <Meta post={featured} date={fmt(featured.published_at)} />
                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300">
                      {c.read}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, index) =>
                    post ? (
                      <Link
                        key={post.slug}
                        to={`/blog/${post.slug}`}
                        style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                        className="group flex h-full animate-fade-in-up flex-col overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/60 transition duration-300 hover:-translate-y-1 hover:border-ase-brand/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand"
                      >
                        <Cover post={post} className="h-44" />
                        <div className="flex flex-1 flex-col p-6">
                          {post.tags[0] && (
                            <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
                              {post.tags[0]}
                            </span>
                          )}
                          <h2 className="mt-2 line-clamp-2 font-display text-lg font-semibold text-ase-text">
                            {post.title}
                          </h2>
                          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ase-text2">{post.excerpt}</p>
                          <div className="mt-auto">
                            <Meta post={post} date={fmt(post.published_at)} />
                          </div>
                        </div>
                      </Link>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Cover({ post, className }: { post: BlogPostCard; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-white/[0.03]', className)}>
      {post.cover_image_url ? (
        <img
          src={resolveMediaUrl(post.cover_image_url) ?? undefined}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div aria-hidden className="absolute inset-0">
          <div className="absolute left-1/4 top-1/3 h-40 w-40 rounded-full bg-ase-brand/30 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-violet-500/25 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>
      )}
    </div>
  )
}

function Meta({ post, date }: { post: BlogPostCard; date: string | null }) {
  return (
    <p className="mt-5 flex flex-wrap items-center gap-x-2 text-xs text-ase-muted">
      {date && <span>{date}</span>}
      {post.author_name && <span>· {post.author_name}</span>}
    </p>
  )
}
