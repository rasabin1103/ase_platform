import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, LayoutGrid, List as ListIcon } from 'lucide-react'
import {
  catalogShowcaseItemPath,
  listCatalogShowcaseCategories,
  listCatalogShowcaseItems,
  listCatalogShowcaseTags,
} from '../../api/catalogShowcase.api'
import type { CatalogShowcaseItem, CatalogShowcaseSort } from '../../api/catalogShowcase.api'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { CatalogShowcasePreviewModal } from '../../components/catalog/CatalogShowcasePreviewModal'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { cn } from '../../components/ui/cn'
import { RatingSummary } from '../../components/catalog/RatingSummary'
import { catalogImageAspectClass } from '../../components/catalog/catalogCardShape'
import { useI18n } from '../../i18n'
import { localizedCatalogText } from '../../utils/localizedCatalogText'

type ViewMode = 'grid' | 'list'

const SORT_OPTIONS: CatalogShowcaseSort[] = ['newest', 'top_rated', 'price_asc', 'price_desc']

function formatPrice(price: string, currency: string, freeLabel: string) {
  const n = Number(price)
  if (!n) return freeLabel
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

export function CatalogShowcasePage() {
  const { t, language } = useI18n()
  const [view, setView] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [sort, setSort] = useState<CatalogShowcaseSort>('newest')
  // Single shared modal for the whole grid/list rather than one per card —
  // cards just report which item to preview, the page owns the fetch.
  const [previewItem, setPreviewItem] = useState<CatalogShowcaseItem | null>(null)

  const queryKey = useMemo(
    () => ['catalog-showcase', search, category, tagFilter, sort],
    [search, category, tagFilter, sort],
  )

  const query = useQuery({
    queryKey,
    queryFn: () =>
      listCatalogShowcaseItems({
        limit: 48,
        search: search.trim() || undefined,
        category,
        tags: tagFilter.length ? tagFilter : undefined,
        sort,
      }),
  })

  const categoriesQuery = useQuery({
    queryKey: ['catalog-showcase-categories'],
    queryFn: listCatalogShowcaseCategories,
  })
  const tagsQuery = useQuery({ queryKey: ['catalog-showcase-tags'], queryFn: listCatalogShowcaseTags })

  const items = query.data?.items ?? []
  const hasActiveFilters = Boolean(search.trim() || category || tagFilter.length)

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 sm:px-8">
      <div>
        <h1 className="text-2xl font-bold text-ase-text sm:text-3xl">{t('publicCatalogShowcase.title')}</h1>
        <p className="mt-1 text-sm text-ase-muted">{t('publicCatalogShowcase.subtitle')}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('publicCatalogShowcase.searchPlaceholder')}
          className="w-full max-w-md rounded-xl border border-white/10 bg-ase-surface px-4 py-2.5 text-sm text-ase-text outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
        />

        <select
          value={category ?? ''}
          onChange={(e) => setCategory(e.target.value || undefined)}
          className="rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm text-ase-text2 outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
        >
          <option value="">{t('publicCatalogShowcase.filters.allCategories')}</option>
          {(categoriesQuery.data ?? []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as CatalogShowcaseSort)}
          className="rounded-xl border border-white/10 bg-ase-surface px-3 py-2.5 text-sm text-ase-text2 outline-none transition focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
          aria-label={t('publicCatalogShowcase.sort.label')}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {t(`publicCatalogShowcase.sort.${s}`)}
            </option>
          ))}
        </select>

        <div className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setView('grid')}
            aria-pressed={view === 'grid'}
            aria-label={t('publicCatalogShowcase.view.grid')}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-lg transition',
              view === 'grid' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
            )}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            aria-label={t('publicCatalogShowcase.view.list')}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-lg transition',
              view === 'list' ? 'bg-white/[0.08] text-ase-text' : 'text-ase-text2 hover:text-ase-text',
            )}
          >
            <ListIcon className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <TagFilterBar
          tags={tagsQuery.data ?? []}
          selected={tagFilter}
          onToggle={(tg) => setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))}
          onClear={() => setTagFilter([])}
          label={t('publicCatalogShowcase.filters.tags')}
          clearLabel={t('publicCatalogShowcase.filters.clearTags')}
        />
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : query.isError ? (
          <EmptyState title={t('publicCatalogShowcase.loadError')} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t('publicCatalogShowcase.empty')}
            description={hasActiveFilters ? t('publicCatalogShowcase.emptyHint') : undefined}
          />
        ) : view === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <ShowcaseCard key={item.slug} item={item} language={language} t={t} onPreview={() => setPreviewItem(item)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ShowcaseListRow
                key={item.slug}
                item={item}
                language={language}
                t={t}
                onPreview={() => setPreviewItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {previewItem ? (
        <CatalogShowcasePreviewModal
          open
          onClose={() => setPreviewItem(null)}
          itemType={previewItem.type}
          slug={previewItem.slug}
          title={localizedCatalogText(language, previewItem.title, previewItem.titleEn)}
        />
      ) : null}
    </div>
  )
}

type CardProps = {
  item: CatalogShowcaseItem
  language: 'en' | 'es'
  t: <T = string>(key: string) => T
  onPreview: () => void
}

function ShowcaseCard({ item, language, t, onPreview }: CardProps) {
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const description = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)
  const detailPath = catalogShowcaseItemPath(item)

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0" interactive>
      <Link to={detailPath} className="flex flex-col">
        <div className={cn('relative overflow-hidden bg-ase-bg2', catalogImageAspectClass(item.type))}>
          <AuthenticatedImage
            src={item.imageUrl}
            alt=""
            fit="contain"
            className="h-full w-full transition duration-500 ease-out group-hover:scale-[1.08]"
          />
          <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text">
            {t(`publicCatalogShowcase.type.${item.type}`)}
          </span>
        </div>
        <div className="flex flex-col gap-2.5 p-4 pb-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
            <h3 className="mt-1 text-base font-bold text-ase-text line-clamp-2">{title}</h3>
            <p className="mt-1.5 line-clamp-2 text-sm text-ase-muted">{description}</p>
            <RatingSummary average={item.averageRating} count={item.reviewCount} className="mt-1.5" />
          </div>
          <p className="text-lg font-bold text-ase-text">
            {formatPrice(item.price, item.currency, t('publicCatalogShowcase.free'))}
          </p>
        </div>
      </Link>
      <div className="mt-auto flex flex-wrap items-center gap-2 p-4 pt-3">
        <ButtonLink to={detailPath} size="sm" variant="primary" className="min-w-0 flex-1">
          {t('publicCatalogShowcase.viewDetails')}
        </ButtonLink>
        {item.hasPreview ? (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
            onClick={onPreview}
          >
            {t('publicCatalogShowcase.preview')}
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

function ShowcaseListRow({ item, language, t, onPreview }: CardProps) {
  const title = localizedCatalogText(language, item.title, item.titleEn)
  const description = localizedCatalogText(language, item.shortDescription, item.shortDescriptionEn)
  const detailPath = catalogShowcaseItemPath(item)

  return (
    <Card className="overflow-hidden p-0" interactive>
      <div className="flex w-full items-center gap-4">
        <Link to={detailPath} className="h-24 w-24 shrink-0 overflow-hidden bg-ase-bg2 sm:h-28 sm:w-28">
          <AuthenticatedImage src={item.imageUrl} alt="" fit="contain" className="h-full w-full" />
        </Link>
        <Link to={detailPath} className="flex min-w-0 flex-1 flex-col gap-1 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-semibold text-ase-text2">
              {t(`publicCatalogShowcase.type.${item.type}`)}
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">{item.category}</p>
          </div>
          <h3 className="truncate text-base font-bold text-ase-text">{title}</h3>
          <p className="line-clamp-1 text-sm text-ase-muted">{description}</p>
          <RatingSummary average={item.averageRating} count={item.reviewCount} className="mt-0.5" />
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2 py-3 pr-4">
          <p className="text-base font-bold text-ase-text">
            {formatPrice(item.price, item.currency, t('publicCatalogShowcase.free'))}
          </p>
          <div className="flex items-center gap-2">
            {item.hasPreview ? (
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
                onClick={onPreview}
              >
                {t('publicCatalogShowcase.preview')}
              </Button>
            ) : null}
            <ButtonLink to={detailPath} size="sm" variant="primary">
              {t('publicCatalogShowcase.viewDetails')}
            </ButtonLink>
          </div>
        </div>
      </div>
    </Card>
  )
}
