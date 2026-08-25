import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  addCatalogItemImage,
  addCatalogItemImageUrl,
  createAdminCatalogItem,
  deleteAdminCatalogItem,
  getCatalogItemTestStats,
  listAdminCatalog,
  listAdminCatalogTags,
  setCatalogItemCoverImage,
  updateAdminCatalogItem,
  uploadCatalogItemImage,
  type CatalogItemAdmin,
} from '../../api/catalogAdmin.api'
import type { PendingGalleryImage } from '../../components/admin/premium/CatalogGalleryPicker'
import type { CatalogItemType } from '../../types/catalog.types'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { TagFilterBar } from '../../components/ui/TagFilterBar'
import { Skeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { AuthenticatedImage } from '../../components/ui/AuthenticatedImage'
import { MiniMetric, PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { cn } from '../../components/ui/cn'
import { AdminCatalogItemModal } from './AdminCatalogItemModal'
import { AdminCatalogCategoriesPanel } from './AdminCatalogCategoriesPage'
import { AdminPricingEnginePanel } from './AdminPricingEnginePage'

type TabKey = 'all' | CatalogItemType
type ViewMode = 'cards' | 'table'

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'adminCatalog.tabAll' },
  { key: 'product', labelKey: 'adminCatalog.tabProduct' },
  { key: 'course', labelKey: 'adminCatalog.tabCourse' },
  { key: 'book', labelKey: 'adminCatalog.tabBook' },
  { key: 'resource', labelKey: 'adminCatalog.tabResource' },
]

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
  } catch {
    return iso
  }
}

// GitHub Actions run status/conclusion values, straight off TestRunStatus/
// TestRunConclusion — same vocabulary as testExecution.locale.ts's
// `status.*`/`conclusion.*` keys, reused here via cross-namespace lookup
// instead of duplicating the copy.
const STATUS_TONE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  queued: 'info',
  in_progress: 'info',
  completed: 'success',
  failed_to_dispatch: 'error',
}

const CONCLUSION_TONE: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  success: 'success',
  failure: 'error',
  cancelled: 'warning',
  timed_out: 'error',
  action_required: 'warning',
  unknown: 'default',
}

function AdminCatalogItemsPanel() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('all')
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<CatalogItemAdmin | null>(null)
  const [deleting, setDeleting] = useState<CatalogItemAdmin | null>(null)
  const [statsItem, setStatsItem] = useState<CatalogItemAdmin | null>(null)

  const typeFilter = tab === 'all' ? undefined : tab
  const query = useQuery({
    queryKey: ['admin-catalog', typeFilter, search, tagFilter],
    queryFn: () =>
      listAdminCatalog({
        limit: 200,
        type: typeFilter,
        search: search.trim() || undefined,
        tags: tagFilter.length ? tagFilter : undefined,
      }),
  })
  const tagsQuery = useQuery({ queryKey: ['admin-catalog-tags'], queryFn: listAdminCatalogTags })

  const items = query.data?.items ?? []
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-catalog'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
  }

  const saveWithImage = async (
    values: Parameters<typeof createAdminCatalogItem>[0],
    imageFile: File | null,
    existingId?: number,
    pendingGallery: PendingGalleryImage[] = [],
    pendingCoverKey: string | null = null,
  ) => {
    if (existingId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { type: _t, slug: _s, ...rest } = values
      await updateAdminCatalogItem(existingId, rest)
      if (imageFile) await uploadCatalogItemImage(existingId, imageFile)
      return
    }
    const created = await createAdminCatalogItem(values)
    try {
      if (imageFile) await uploadCatalogItemImage(created.id, imageFile)

      // Upload any staged gallery images now that the item has an id, then
      // set whichever one the admin picked (if any) as the cover.
      let coverServerId: number | null = null
      for (const staged of pendingGallery) {
        const uploaded =
          staged.kind === 'file' && staged.file
            ? await addCatalogItemImage(created.id, staged.file)
            : staged.kind === 'url' && staged.url
              ? await addCatalogItemImageUrl(created.id, staged.url)
              : null
        if (uploaded && staged.key === pendingCoverKey) coverServerId = uploaded.id
      }
      if (coverServerId != null) await setCatalogItemCoverImage(created.id, coverServerId)
    } catch (err) {
      // The item row was already created above (uploads need its id), but a
      // failure anywhere in the image/gallery step — e.g. an oversized
      // secondary image — must not leave a half-configured item behind for
      // the admin to find later. Roll it back so "creation failed" actually
      // means nothing was created, then surface the original error.
      await deleteAdminCatalogItem(created.id).catch(() => {})
      throw err
    }
  }

  const createMut = useMutation({
    mutationFn: ({
      values,
      file,
      gallery,
      coverKey,
    }: {
      values: Parameters<typeof createAdminCatalogItem>[0]
      file: File | null
      gallery: PendingGalleryImage[]
      coverKey: string | null
    }) => saveWithImage(values, file, undefined, gallery, coverKey),
    onSuccess: invalidate,
  })
  const updateMut = useMutation({
    mutationFn: ({
      id,
      values,
      file,
    }: {
      id: number
      values: Parameters<typeof createAdminCatalogItem>[0]
      file: File | null
    }) => saveWithImage(values, file, id),
    onSuccess: invalidate,
  })
  const deleteMut = useMutation({
    mutationFn: deleteAdminCatalogItem,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })

  const defaultType = useMemo<CatalogItemType>(() => (tab === 'all' ? 'product' : tab), [tab])
  const publishedCount = items.filter((i) => i.status === 'published').length

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-ase-muted">
          <span>
            {t('adminCatalog.tabAll')}: <span className="font-semibold text-ase-text">{query.data?.total ?? items.length}</span>
          </span>
          <span>
            {t('adminCatalog.colStatus')}: <span className="font-semibold text-ase-text">{publishedCount}</span>
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<span>+</span>}>
          {t('adminCatalog.create')}
        </Button>
      </div>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  tab === item.key
                    ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-ase-muted hover:text-ase-text',
                )}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              className="h-11 min-w-[200px] rounded-xl border-white/10 bg-ase-bg2/50"
              placeholder={t('adminCatalog.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex rounded-xl border border-white/10 bg-ase-bg2/50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  'rounded-lg px-3 text-sm font-semibold',
                  viewMode === 'cards' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2',
                )}
              >
                {t('adminCatalog.premium.viewCards')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'rounded-lg px-3 text-sm font-semibold',
                  viewMode === 'table' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2',
                )}
              >
                {t('adminCatalog.premium.viewTable')}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <TagFilterBar
        tags={tagsQuery.data ?? []}
        selected={tagFilter}
        onToggle={(tg) =>
          setTagFilter((prev) => (prev.includes(tg) ? prev.filter((x) => x !== tg) : [...prev, tg]))
        }
        onClear={() => setTagFilter([])}
        label={t('adminCatalog.filters.tagsLabel')}
        clearLabel={t('adminCatalog.filters.clearTags')}
      />

      {query.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('catalog.loadError')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('catalog.empty')} description={t('adminCatalog.subtitle')} />
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <CatalogPremiumCard
              key={item.id}
              item={item}
              t={t}
              onEdit={() => setEditing(item)}
              onDelete={() => setDeleting(item)}
              onStats={() => setStatsItem(item)}
            />
          ))}
        </div>
      ) : (
        <Card className="divide-y divide-white/10 overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-0">
          <div className="grid grid-cols-[72px_1fr_90px_100px_100px_140px] gap-2 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase text-ase-muted">
            <span />
            <span>{t('adminCatalog.colTitle')}</span>
            <span>{t('adminCatalog.colType')}</span>
            <span>{t('adminCatalog.colStatus')}</span>
            <span>{t('adminCatalog.colPrice')}</span>
            <span>{t('adminCatalog.colActions')}</span>
          </div>
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[72px_1fr_90px_100px_100px_140px] items-center gap-2 px-4 py-3 text-sm"
            >
              <AuthenticatedImage src={item.image_url} className="h-14 w-14 rounded-xl" />
              <span className="font-medium text-ase-text">{item.title}</span>
              <span>{item.type}</span>
              <span>{item.status}</span>
              <span>
                {item.price} {item.currency}
              </span>
              <span className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                  {t('adminCatalog.edit')}
                </Button>
                {item.test_repo_url ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatsItem(item)}
                    leftIcon={<Activity className="h-4 w-4" strokeWidth={1.75} />}
                  >
                    {t('adminCatalog.testStats.button')}
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setDeleting(item)}>
                  {t('adminCatalog.delete')}
                </Button>
              </span>
            </div>
          ))}
        </Card>
      )}

      <AdminCatalogItemModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultType={defaultType}
        isSubmitting={createMut.isPending}
        onSubmit={async (values, file, gallery, coverKey) => {
          await createMut.mutateAsync({ values, file, gallery, coverKey })
        }}
      />

      <AdminCatalogItemModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        initial={editing}
        isSubmitting={updateMut.isPending}
        onSubmit={async (values, file) => {
          if (!editing) return
          await updateMut.mutateAsync({ id: editing.id, values, file })
        }}
      />

      <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={t('adminCatalog.delete')}>
        <p className="text-sm text-ase-text2">{t('adminCatalog.confirmDelete')}</p>
        <p className="mt-2 font-medium text-ase-text">{deleting?.title}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            {t('adminCatalog.cancel')}
          </Button>
          <Button variant="danger" disabled={deleteMut.isPending} onClick={() => deleting && deleteMut.mutate(deleting.id)}>
            {t('adminCatalog.delete')}
          </Button>
        </div>
      </Modal>

      <CatalogTestStatsModal item={statsItem} onClose={() => setStatsItem(null)} />
    </div>
  )
}

// The outer, nav-facing page: hosts the item-management panel plus the two
// configuration screens ("categories" and "pricing engine") that used to
// live behind a separate "Catalog settings" nav entry — merged here into
// one tab bar under a single menu item, per the same consolidation pattern
// already used for AdminSystemPage. `SectionKey` is deliberately a
// different name from `TabKey` above: that one selects an item *type*
// filter inside the items panel, this one selects which panel is shown at
// all — conflating them would make neither read clearly.
type SectionKey = 'items' | 'categories' | 'pricing'

const SECTIONS: { key: SectionKey; labelKey: string }[] = [
  { key: 'items', labelKey: 'adminCatalog.tabs.items' },
  { key: 'categories', labelKey: 'adminCatalog.tabs.categories' },
  { key: 'pricing', labelKey: 'adminCatalog.tabs.pricing' },
]

const VALID_SECTIONS: SectionKey[] = ['items', 'categories', 'pricing']

export function AdminCatalogPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  // Lets other screens deep-link straight into a tab — e.g. the "Manage
  // categories" shortcut inside the item creation form links to
  // `?section=categories` instead of dropping the admin on the Items tab
  // and making them click again.
  const initialSection = searchParams.get('section') as SectionKey | null
  const [section, setSection] = useState<SectionKey>(
    initialSection && VALID_SECTIONS.includes(initialSection) ? initialSection : 'items',
  )

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="cyan"
        badge={t('adminCatalog.premium.badge')}
        title={t('adminCatalog.title')}
        subtitle={t('adminCatalog.subtitle')}
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs font-semibold transition',
                section === item.key
                  ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-100'
                  : 'border-white/10 bg-white/[0.03] text-ase-muted hover:text-ase-text',
              )}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </Card>

      {section === 'items' && <AdminCatalogItemsPanel />}
      {section === 'categories' && <AdminCatalogCategoriesPanel />}
      {section === 'pricing' && <AdminPricingEnginePanel />}
    </div>
  )
}

function CatalogPremiumCard({
  item,
  t,
  onEdit,
  onDelete,
  onStats,
}: {
  item: CatalogItemAdmin
  t: (k: string) => string
  onEdit: () => void
  onDelete: () => void
  onStats: () => void
}) {
  return (
    <Card className="group overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/20">
      <div className="relative h-40 overflow-hidden border-b border-white/[0.06]">
        <AuthenticatedImage src={item.image_url} className="h-full w-full" />
        <div className="absolute right-3 top-3">
          <Badge variant={item.status === 'published' ? 'success' : 'default'}>{item.status}</Badge>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-ase-text">{item.title}</h3>
          <p className="text-xs text-ase-muted">{item.type} · {item.category}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label={t('adminCatalog.colPrice')} value={`${item.price} ${item.currency}`} />
          <MiniMetric label={t('adminCatalog.fields.author')} value={item.author} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            {t('adminCatalog.edit')}
          </Button>
          {item.test_repo_url ? (
            <Button size="sm" variant="ghost" onClick={onStats} leftIcon={<Activity className="h-4 w-4" strokeWidth={1.75} />}>
              {t('adminCatalog.testStats.button')}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" className="border-ase-error/30" onClick={onDelete}>
            {t('adminCatalog.delete')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function CatalogTestStatsModal({ item, onClose }: { item: CatalogItemAdmin | null; onClose: () => void }) {
  const { t } = useI18n()
  const query = useQuery({
    queryKey: ['admin-catalog-test-stats', item?.id],
    queryFn: () => getCatalogItemTestStats(item!.id),
    enabled: item !== null,
  })
  const stats = query.data

  return (
    <Modal
      open={item !== null}
      onClose={onClose}
      title={item ? `${t('adminCatalog.testStats.title')} · ${item.title}` : t('adminCatalog.testStats.title')}
      footer={<Button onClick={onClose}>{t('adminCatalog.testStats.close')}</Button>}
    >
      <div className="space-y-5">
        <p className="text-sm text-ase-text2">{t('adminCatalog.testStats.hint')}</p>

        {query.isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : query.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('adminCatalog.testStats.loadError')} />
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniMetric label={t('adminCatalog.testStats.totalRuns')} value={String(stats.total_runs)} />
              <MiniMetric label={t('adminCatalog.testStats.uniqueUsers')} value={String(stats.unique_users)} />
              <MiniMetric
                label={t('adminCatalog.testStats.includedRuns')}
                value={stats.included_runs != null ? String(stats.included_runs) : '—'}
              />
              <MiniMetric
                label={t('adminCatalog.testStats.lastRun')}
                value={stats.last_run_at ? fmtDate(stats.last_run_at) : (t('adminCatalog.testStats.never') as string)}
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('adminCatalog.testStats.byStatus')}</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_status).map(([key, count]) => (
                  <Badge key={key} variant={STATUS_TONE[key] ?? 'default'}>
                    {t(`testExecution.status.${key}`)}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('adminCatalog.testStats.byConclusion')}</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.by_conclusion).map(([key, count]) => (
                  <Badge key={key} variant={CONCLUSION_TONE[key] ?? 'default'}>
                    {t(`testExecution.conclusion.${key}`)}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-ase-text">{t('adminCatalog.testStats.recentRuns')}</h3>
              {stats.recent_runs.length === 0 ? (
                <p className="text-sm text-ase-muted">{t('adminCatalog.testStats.empty')}</p>
              ) : (
                <Table className="table-fixed">
                  <THead>
                    <TR>
                      <TH className="w-[34%]">{t('adminCatalog.testStats.columns.user')}</TH>
                      <TH className="w-[22%]">{t('adminCatalog.testStats.columns.status')}</TH>
                      <TH className="w-[22%]">{t('adminCatalog.testStats.columns.conclusion')}</TH>
                      <TH className="w-[22%]">{t('adminCatalog.testStats.columns.created')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {stats.recent_runs.map((r) => (
                      <TR key={r.uuid}>
                        <TD className="truncate text-ase-text2">{r.user_email}</TD>
                        <TD>
                          <Badge variant={STATUS_TONE[r.status] ?? 'default'}>{t(`testExecution.status.${r.status}`)}</Badge>
                        </TD>
                        <TD>
                          {r.conclusion ? (
                            <Badge variant={CONCLUSION_TONE[r.conclusion] ?? 'default'}>
                              {t(`testExecution.conclusion.${r.conclusion}`)}
                            </Badge>
                          ) : (
                            <span className="text-ase-muted">—</span>
                          )}
                        </TD>
                        <TD className="text-ase-muted">{fmtDate(r.created_at)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
