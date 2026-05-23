import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  createAdminCatalogItem,
  deleteAdminCatalogItem,
  getAdminCatalogItem,
  listAdminCatalog,
  updateAdminCatalogItem,
  uploadCatalogItemImage,
  type CatalogItemAdmin,
} from '../../api/catalogAdmin.api'
import type { CatalogItemType } from '../../types/catalog.types'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { Badge } from '../../components/ui/Badge'
import { CatalogImage } from '../../components/catalog/CatalogImage'
import { ConfirmDeleteDialog } from '../../components/admin/ConfirmDeleteDialog'
import { ConfirmDeactivateDialog } from '../../components/admin/ConfirmDeactivateDialog'
import {
  adminInactiveRowClass,
  adminInactiveSurfaceClass,
  isCatalogItemInactive,
} from '../../components/admin/adminInactiveStyles'
import {
  MiniMetric,
  PremiumHero,
  PremiumMetricCard,
} from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { cn } from '../../components/ui/cn'
import { AdminCatalogItemModal } from './AdminCatalogItemModal'
import { Toast } from '../../components/ui/Toast'

type TabKey = 'all' | CatalogItemType
type ViewMode = 'cards' | 'table'

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'adminCatalog.tabAll' },
  { key: 'product', labelKey: 'adminCatalog.tabProduct' },
  { key: 'course', labelKey: 'adminCatalog.tabCourse' },
  { key: 'book', labelKey: 'adminCatalog.tabBook' },
  { key: 'resource', labelKey: 'adminCatalog.tabResource' },
]

export function AdminCatalogPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)

  const editDetailQuery = useQuery({
    queryKey: ['admin-catalog-item', editingId],
    queryFn: () => getAdminCatalogItem(editingId!),
    enabled: editingId != null,
  })
  const editing = editDetailQuery.data ?? null
  const [deleting, setDeleting] = useState<CatalogItemAdmin | null>(null)
  const [statusTarget, setStatusTarget] = useState<CatalogItemAdmin | null>(null)

  const typeFilter = tab === 'all' ? undefined : tab
  const query = useQuery({
    queryKey: ['admin-catalog', typeFilter, search],
    queryFn: () =>
      listAdminCatalog({
        limit: 200,
        type: typeFilter,
        search: search.trim() || undefined,
      }),
  })

  const items = query.data?.items ?? []
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-catalog'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
  }

  const saveWithImage = async (
    values: Parameters<typeof createAdminCatalogItem>[0],
    imageFile: File | null,
    existing?: CatalogItemAdmin,
  ) => {
    if (existing) {
      const { type: _t, slug: _s, image_url, ...rest } = values
      const isMediaPath = image_url?.includes('/media/catalog/') || image_url?.startsWith('/api/')
      const payload: Parameters<typeof updateAdminCatalogItem>[1] = { ...rest }
      if (!(existing.has_stored_image || isMediaPath) || imageFile) {
        payload.image_url = image_url
      }
      await updateAdminCatalogItem(existing.id, payload)
      if (imageFile) await uploadCatalogItemImage(existing.id, imageFile)
      return
    }
    const created = await createAdminCatalogItem(values)
    if (imageFile) await uploadCatalogItemImage(created.id, imageFile)
  }

  const createMut = useMutation({
    mutationFn: ({ values, file }: { values: Parameters<typeof createAdminCatalogItem>[0]; file: File | null }) =>
      saveWithImage(values, file),
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      setToast({ message: String(t('adminCatalog.toast.saved')), variant: 'success' })
    },
    onError: () => setToast({ message: String(t('adminCatalog.toast.error')), variant: 'error' }),
  })
  const updateMut = useMutation({
    mutationFn: ({
      item,
      values,
      file,
    }: {
      item: CatalogItemAdmin
      values: Parameters<typeof createAdminCatalogItem>[0]
      file: File | null
    }) => saveWithImage(values, file, item),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      setToast({ message: String(t('adminCatalog.toast.saved')), variant: 'success' })
    },
    onError: () => setToast({ message: String(t('adminCatalog.toast.error')), variant: 'error' }),
  })
  const deleteMut = useMutation({
    mutationFn: deleteAdminCatalogItem,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })
  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'published' | 'draft' }) =>
      updateAdminCatalogItem(id, { status }),
    onSuccess: () => {
      invalidate()
      setStatusTarget(null)
    },
  })

  const defaultType = useMemo<CatalogItemType>(() => (tab === 'all' ? 'product' : tab), [tab])
  const publishedCount = items.filter((i) => i.status === 'published').length

  return (
    <div className="space-y-8 pb-16">
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      ) : null}
      <PremiumHero
        accent="cyan"
        badge={t('adminCatalog.premium.badge')}
        title={t('adminCatalog.title')}
        subtitle={t('adminCatalog.subtitle')}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<span>+</span>}>
            {t('adminCatalog.create')}
          </Button>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              <PremiumMetricCard label={t('adminCatalog.tabAll')} value={query.data?.total ?? items.length} icon="◇" accent="from-cyan-300 to-blue-500" />
              <PremiumMetricCard label={t('adminCatalog.colStatus')} value={publishedCount} icon="✓" accent="from-emerald-300 to-teal-500" />
            </div>
          </Card>
        }
      />

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
              onEdit={() => setEditingId(item.id)}
              onDelete={() => setDeleting(item)}
              onToggleStatus={() => setStatusTarget(item)}
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
              className={cn(
                'grid grid-cols-[72px_1fr_90px_100px_100px_180px] items-center gap-2 px-4 py-3 text-sm',
                adminInactiveRowClass(isCatalogItemInactive(item.status)),
              )}
            >
              <CatalogImage
                src={item.image_url}
                type={item.type}
                variant="card"
                alt={item.title}
                cacheKey={item.updated_at}
                className="h-14 w-14 rounded-xl"
              />
              <span className="font-medium text-ase-text">{item.title}</span>
              <span>{item.type}</span>
              <span>{item.status}</span>
              <span>
                {item.price} {item.currency}
              </span>
              <span className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open(`/catalog/${item.type}/${item.slug}?preview=true`, '_blank', 'noopener,noreferrer')
                  }
                >
                  {t('adminCatalog.viewAsUser')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatusTarget(item)}>
                  {item.status === 'published' ? t('adminCatalog.deactivate') : t('adminCatalog.activate')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingId(item.id)}>
                  {t('adminCatalog.edit')}
                </Button>
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
        onSubmit={async (values, file) => {
          await createMut.mutateAsync({ values, file })
        }}
      />

      <AdminCatalogItemModal
        open={Boolean(editingId)}
        onClose={() => setEditingId(null)}
        initial={editing}
        isSubmitting={updateMut.isPending}
        onSubmit={async (values, file) => {
          if (!editing) return
          await updateMut.mutateAsync({ item: editing, values, file })
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        itemName={deleting?.title}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        isPending={deleteMut.isPending}
        isError={deleteMut.isError}
        body={t('adminCatalog.confirmDelete')}
      />

      <ConfirmDeactivateDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        itemName={statusTarget?.title}
        activating={statusTarget?.status !== 'published'}
        isPending={statusMut.isPending}
        onConfirm={() => {
          if (!statusTarget) return
          const next = statusTarget.status === 'published' ? 'draft' : 'published'
          statusMut.mutate({ id: statusTarget.id, status: next })
        }}
      />
    </div>
  )
}

function CatalogPremiumCard({
  item,
  t,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: CatalogItemAdmin
  t: (k: string) => string
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const inactive = isCatalogItemInactive(item.status)
  return (
    <Card
      className={adminInactiveSurfaceClass(
        inactive,
        'group overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/20',
      )}
    >
      <div className="relative h-40 overflow-hidden border-b border-white/[0.06]">
        <CatalogImage
          src={item.image_url}
          type={item.type}
          variant="card"
          alt={item.title}
          cacheKey={item.updated_at}
          className="h-full min-h-[10rem]"
        />
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const url = `/catalog/${item.type}/${item.slug}?preview=true`
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
          >
            {t('adminCatalog.viewAsUser')}
          </Button>
          <Button size="sm" variant="outline" onClick={onToggleStatus}>
            {item.status === 'published' ? t('adminCatalog.deactivate') : t('adminCatalog.activate')}
          </Button>
          <Button size="sm" variant="secondary" onClick={onEdit}>
            {t('adminCatalog.edit')}
          </Button>
          <Button size="sm" variant="outline" className="border-ase-error/30" onClick={onDelete}>
            {t('adminCatalog.delete')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
