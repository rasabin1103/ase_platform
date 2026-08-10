import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Plus, Search, X } from 'lucide-react'
import { listConsumerCatalog } from '../../api/consumerCatalog.api'
import { associateOrgCatalogItem, listOrgCatalogItems, removeOrgCatalogItem } from '../../api/orgCatalog.api'
import { Card } from '../../components/ui/Card'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { Modal } from '../../components/ui/Modal'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { ImageCarousel } from '../../components/catalog/ImageCarousel'
import { RatingWidget } from '../../components/catalog/RatingWidget'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import type { CatalogItem, CatalogItemType } from '../../types/catalog.types'

// Unified card shape for this management view: unlike the consumer-facing
// catalog (where each type gets its own silhouette), here every card in the
// grid must read as the same size regardless of type, since org owners scan
// products/courses/books/resources side by side to associate them.
const ORG_CATALOG_IMAGE_ASPECT = 'aspect-[4/3]'

function typeLabelKey(type: CatalogItemType): string {
  const map: Record<CatalogItemType, string> = {
    product: 'catalog.typeProduct',
    course: 'catalog.typeCourse',
    book: 'catalog.typeBook',
    resource: 'catalog.typeResource',
  }
  return map[type]
}

export function OrganizationCatalogPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [topRated, setTopRated] = useState(false)
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null)

  const associatedQuery = useQuery({
    queryKey: ['org-catalog-items'],
    queryFn: () => listOrgCatalogItems({ limit: 100 }),
  })

  const fullCatalogQuery = useQuery({
    queryKey: ['consumer-catalog', 'org-browse', search, topRated],
    queryFn: () => listConsumerCatalog({ limit: 60, search: search || undefined, sort: topRated ? 'top_rated' : undefined }),
  })

  const associatedSlugs = useMemo(
    () => new Set((associatedQuery.data?.items ?? []).map((i) => i.slug)),
    [associatedQuery.data],
  )

  const associateMutation = useMutation({
    mutationFn: associateOrgCatalogItem,
    onMutate: (slug: string) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['org-catalog-items'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: removeOrgCatalogItem,
    onMutate: (slug: string) => setPendingSlug(slug),
    onSettled: () => {
      setPendingSlug(null)
      qc.invalidateQueries({ queryKey: ['org-catalog-items'] })
    },
  })

  const associatedItems = associatedQuery.data?.items ?? []
  const browseItems = fullCatalogQuery.data?.items ?? []

  const toggle = (item: CatalogItem, isAssociated: boolean) => {
    if (isAssociated) removeMutation.mutate(item.slug)
    else associateMutation.mutate(item.slug)
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
        <Eyebrow>{t('organizationWorkspace.catalog.title')}</Eyebrow>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          {t('organizationWorkspace.catalog.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ase-text2 sm:text-base">{t('organizationWorkspace.catalog.subtitle')}</p>
      </section>

      <section>
        {associatedQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : associatedItems.length === 0 ? (
          <EmptyState
            title={t('organizationWorkspace.catalog.emptyTitle')}
            description={t('organizationWorkspace.catalog.emptyBody')}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {associatedItems.map((item: CatalogItem) => (
              <MiniCatalogCard
                key={item.slug}
                item={item}
                associated
                pending={pendingSlug === item.slug && removeMutation.isPending}
                onToggle={() => toggle(item, true)}
                onViewDetail={() => setDetailItem(item)}
                associateLabel={t('organizationWorkspace.catalog.associateAction') as string}
                removeLabel={t('organizationWorkspace.catalog.removeAction') as string}
                associatedLabel={t('organizationWorkspace.catalog.associatedBadge') as string}
                detailLabel={t('organizationWorkspace.catalog.detailAction') as string}
                typeLabel={t(typeLabelKey(item.type)) as string}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ase-muted">
          {t('organizationWorkspace.catalog.browseTitle')}
        </h2>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('organizationWorkspace.catalog.searchPlaceholder') as string}
              className="h-10 w-full rounded-xl border border-white/10 bg-ase-surface pl-9 pr-3 text-sm text-ase-text placeholder:text-ase-muted outline-none transition focus-visible:border-ase-brand/60 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setTopRated((v) => !v)}
            className={cn(
              'h-10 rounded-xl border px-3 text-sm font-semibold transition',
              topRated
                ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-brand'
                : 'border-white/10 bg-ase-surface text-ase-text2 hover:border-white/20',
            )}
          >
            {t('catalog.rating.sortTopRated')}
          </button>
        </div>

        {fullCatalogQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : browseItems.length === 0 ? (
          <EmptyState title={t('catalog.empty') as string} description={t('catalog.emptyHint') as string} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {browseItems.map((item) => {
              const isAssociated = associatedSlugs.has(item.slug)
              return (
                <MiniCatalogCard
                  key={item.slug}
                  item={item}
                  associated={isAssociated}
                  pending={pendingSlug === item.slug && (associateMutation.isPending || removeMutation.isPending)}
                  onToggle={() => toggle(item, isAssociated)}
                  onViewDetail={() => setDetailItem(item)}
                  associateLabel={t('organizationWorkspace.catalog.associateAction') as string}
                  removeLabel={t('organizationWorkspace.catalog.removeAction') as string}
                  associatedLabel={t('organizationWorkspace.catalog.associatedBadge') as string}
                  detailLabel={t('organizationWorkspace.catalog.detailAction') as string}
                  typeLabel={t(typeLabelKey(item.type)) as string}
                />
              )
            })}
          </div>
        )}
      </section>

      <CatalogItemDetailModal
        item={detailItem}
        associated={detailItem ? associatedSlugs.has(detailItem.slug) : false}
        pending={
          detailItem != null &&
          pendingSlug === detailItem.slug &&
          (associateMutation.isPending || removeMutation.isPending)
        }
        onClose={() => setDetailItem(null)}
        onToggle={() => {
          if (!detailItem) return
          toggle(detailItem, associatedSlugs.has(detailItem.slug))
        }}
      />
    </div>
  )
}

function MiniCatalogCard({
  item,
  associated,
  pending,
  onToggle,
  onViewDetail,
  associateLabel,
  removeLabel,
  associatedLabel,
  detailLabel,
  typeLabel,
}: {
  item: CatalogItem
  associated: boolean
  pending?: boolean
  onToggle: () => void
  onViewDetail: () => void
  associateLabel: string
  removeLabel: string
  associatedLabel: string
  detailLabel: string
  typeLabel: string
}) {
  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <button
        type="button"
        onClick={onViewDetail}
        className={cn('relative block w-full overflow-hidden bg-ase-bg2 text-left', ORG_CATALOG_IMAGE_ASPECT)}
      >
        <AuthenticatedImage src={item.imageUrl} alt="" className="h-full w-full" />
        <span className="absolute left-3 top-3 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs font-semibold text-ase-text">
          {typeLabel}
        </span>
        {associated ? (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-200">
            <Check className="h-3 w-3" strokeWidth={2.5} />
            {associatedLabel}
          </span>
        ) : null}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-bold text-ase-text line-clamp-2">{item.title}</h3>
        <p className="text-xs text-ase-muted line-clamp-2">{item.shortDescription}</p>
        <RatingWidget item={item} compact />
        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" className="min-w-0 flex-1" onClick={onViewDetail}>
            {detailLabel}
          </Button>
          <Button
            size="sm"
            variant={associated ? 'ghost' : 'primary'}
            className="min-w-0 flex-1"
            disabled={pending}
            leftIcon={associated ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={onToggle}
          >
            {associated ? removeLabel : associateLabel}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CatalogItemDetailModal({
  item,
  associated,
  pending,
  onClose,
  onToggle,
}: {
  item: CatalogItem | null
  associated: boolean
  pending?: boolean
  onClose: () => void
  onToggle: () => void
}) {
  const { t } = useI18n()
  if (!item) return null

  const priceLabel =
    Number(item.price) > 0 ? `${item.price} ${item.currency}` : (t('organizationWorkspace.catalog.freeLabel') as string)

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={t('organizationWorkspace.catalog.detailTitle') as string}
      closeLabel={t('organizationWorkspace.catalog.close') as string}
      className="max-w-2xl"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant={associated ? 'ghost' : 'primary'}
            disabled={pending}
            className="max-w-full"
            leftIcon={associated ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={onToggle}
          >
            {associated
              ? (t('organizationWorkspace.catalog.removeAction') as string)
              : (t('organizationWorkspace.catalog.associateAction') as string)}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <ImageCarousel
          images={item.images ?? []}
          fallbackUrl={item.imageUrl}
          aspectClassName={ORG_CATALOG_IMAGE_ASPECT}
        />
        <div>
          <h3 className="text-lg font-bold text-ase-text">{item.title}</h3>
          <p className="mt-1 text-sm text-ase-text2">{item.longDescription || item.shortDescription}</p>
        </div>
        <RatingWidget item={item} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <DetailField label={t('organizationWorkspace.catalog.levelLabel') as string} value={item.level} />
          {item.duration ? <DetailField label={t('organizationWorkspace.catalog.durationLabel') as string} value={item.duration} /> : null}
          <DetailField label={t('organizationWorkspace.catalog.authorLabel') as string} value={item.author} />
          <DetailField label={t('organizationWorkspace.catalog.priceLabel') as string} value={priceLabel} />
        </div>
        {item.benefits && item.benefits.length > 0 ? (
          <DetailList label={t('organizationWorkspace.catalog.benefitsLabel') as string} items={item.benefits} />
        ) : null}
        {item.includedItems && item.includedItems.length > 0 ? (
          <DetailList label={t('organizationWorkspace.catalog.includedLabel') as string} items={item.includedItems} />
        ) : null}
        {item.requirements && item.requirements.length > 0 ? (
          <DetailList label={t('organizationWorkspace.catalog.requirementsLabel') as string} items={item.requirements} />
        ) : null}
      </div>
    </Modal>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize text-ase-text">{value}</div>
    </div>
  )
}

function DetailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <ul className="space-y-1.5">
        {items.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-ase-text2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ase-brand" strokeWidth={2.5} />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
