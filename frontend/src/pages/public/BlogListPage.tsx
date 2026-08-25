import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { listPublicBlogPosts, listPublicBlogTags } from '../../api/publicBlog.api'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'
import { resolveMediaUrl } from '../../utils/mediaUrls'

export function BlogListPage() {
  const { t } = useI18n()
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

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <Breadcrumbs
        items={[
          { label: t('blogPage.breadcrumbHome') as string, to: '/' },
          { label: t('blogPage.badge') as string },
        ]}
      />
      <Eyebrow className="mt-6">{t('blogPage.badge')}</Eyebrow>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('blogPage.title')}</h1>
      <p className="mt-4 max-w-3xl text-base text-ase-text2">{t('blogPage.subtitle')}</p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('blogPage.searchPlaceholder') as string}
          className="w-full max-w-md rounded-xl border border-white/10 bg-ase-surface px-4 py-2.5 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
        />
      </div>

      <div className="mt-4">
        <TagFilterBar
          tags={tagsQuery.data ?? []}
          selected={tagFilter}
          onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
          onClear={() => setTagFilter([])}
          label={t('blogPage.tags.filterLabel')}
          clearLabel={t('blogPage.tags.clear')}
        />
      </div>

      <div className="mt-8">
        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('blogPage.loadError')} />
        ) : items.length === 0 ? (
          <EmptyState title={t('blogPage.empty')} description={t('blogPage.emptyHint')} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="group h-full overflow-hidden rounded-2xl border-white/[0.08] bg-ase-surface/60 p-0 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/20" interactive>
                  <div className="h-40 overflow-hidden border-b border-white/[0.06] bg-white/[0.03]">
                    {post.cover_image_url ? (
                      <img
                        src={resolveMediaUrl(post.cover_image_url) ?? undefined}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl text-ase-muted">◇</div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <h2 className="text-lg font-semibold text-ase-text">{post.title}</h2>
                    <p className="line-clamp-3 text-sm text-ase-text2">{post.excerpt}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ase-muted">
                      {post.published_at && <span>{new Date(post.published_at).toLocaleDateString()}</span>}
                      {post.author_name && <span>· {post.author_name}</span>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
