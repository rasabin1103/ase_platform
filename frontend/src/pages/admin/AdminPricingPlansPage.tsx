import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { listAdminCatalog } from '../../api/catalogAdmin.api'
import {
  createCatalogPricingPlan,
  deletePricingPlan,
  listAllPricingPlans,
  patchPricingPlanStatus,
  updatePricingPlan,
  type PricingPlanPayload,
  type PricingPlanType,
  type PricingPlanWithCatalog,
} from '../../api/pricingAdmin.api'
import { CatalogPricingPlanModal } from '../../components/catalog/CatalogPricingPlanModal'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { ConfirmDeleteDialog } from '../../components/admin/ConfirmDeleteDialog'
import { ConfirmDeactivateDialog } from '../../components/admin/ConfirmDeactivateDialog'
import { adminInactiveSurfaceClass, isPricingPlanInactive } from '../../components/admin/adminInactiveStyles'
import { PremiumHero, PremiumMetricCard } from '../../components/admin/premium/PremiumAdminUi'
import { useI18n } from '../../i18n'
import { cn } from '../../components/ui/cn'

const PLAN_TYPES: (PricingPlanType | '')[] = ['', 'free', 'one_time', 'subscription', 'lifetime', 'request_quote']

function formatMoney(price: string | number, currency: string, onRequest: string, planType: PricingPlanType) {
  if (planType === 'request_quote') return onRequest
  const n = Number(price)
  if (!n) return onRequest
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function planTypeBadgeVariant(planType: PricingPlanType) {
  if (planType === 'free') return 'success' as const
  if (planType === 'request_quote') return 'warning' as const
  return 'info' as const
}

export function AdminPricingPlansPage() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [catalogFilter, setCatalogFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<PricingPlanType | ''>('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [createCatalogId, setCreateCatalogId] = useState<number | undefined>()
  const [editing, setEditing] = useState<PricingPlanWithCatalog | null>(null)
  const [deleting, setDeleting] = useState<PricingPlanWithCatalog | null>(null)
  const [statusTarget, setStatusTarget] = useState<PricingPlanWithCatalog | null>(null)

  const catalogQuery = useQuery({
    queryKey: ['admin-catalog', 'pricing-plans-page'],
    queryFn: () => listAdminCatalog({ limit: 200 }),
  })

  const catalogItems = catalogQuery.data?.items ?? []

  const plansQuery = useQuery({
    queryKey: ['admin-pricing-plans', search, catalogFilter, typeFilter, activeFilter],
    queryFn: () =>
      listAllPricingPlans({
        limit: 200,
        search: search.trim() || undefined,
        catalog_item_id: catalogFilter ? Number(catalogFilter) : undefined,
        plan_type: typeFilter || undefined,
        is_active: activeFilter === '' ? undefined : activeFilter === 'true',
      }),
  })

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['admin-pricing-plans'] })
    void qc.invalidateQueries({ queryKey: ['consumer-catalog'] })
  }

  const createMut = useMutation({
    mutationFn: ({ catalogItemId, payload }: { catalogItemId: number; payload: PricingPlanPayload }) =>
      createCatalogPricingPlan(catalogItemId, payload),
    onSuccess: () => {
      invalidate()
      setPlanModalOpen(false)
      setCreateCatalogId(undefined)
    },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PricingPlanPayload }) => updatePricingPlan(id, payload),
    onSuccess: () => {
      invalidate()
      setPlanModalOpen(false)
      setEditing(null)
    },
  })
  const statusMut = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => patchPricingPlanStatus(id, is_active),
    onSuccess: () => {
      invalidate()
      setStatusTarget(null)
    },
  })
  const deleteMut = useMutation({
    mutationFn: deletePricingPlan,
    onSuccess: () => {
      invalidate()
      setDeleting(null)
    },
  })

  const plans = plansQuery.data?.items ?? []
  const activeCount = useMemo(() => plans.filter((p) => p.is_active).length, [plans])

  const openCreate = () => {
    setEditing(null)
    setCreateCatalogId(undefined)
    setPlanModalOpen(true)
  }

  const openEdit = (plan: PricingPlanWithCatalog) => {
    setEditing(plan)
    setCreateCatalogId(undefined)
    setPlanModalOpen(true)
  }

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('adminPricingPlans.badge')}
        title={t('adminPricingPlans.title')}
        subtitle={t('adminPricingPlans.subtitle')}
        actions={
          <Button size="sm" onClick={openCreate} leftIcon={<span>+</span>}>
            {t('adminPricingPlans.create')}
          </Button>
        }
        sidePanel={
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-3">
              <PremiumMetricCard
                label={t('adminPricingPlans.title')}
                value={plansQuery.data?.total ?? plans.length}
                icon="€"
                accent="from-violet-300 to-fuchsia-500"
              />
              <PremiumMetricCard
                label={t('catalogPricing.badge.active')}
                value={activeCount}
                icon="✓"
                accent="from-emerald-300 to-teal-500"
              />
            </div>
          </Card>
        }
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 backdrop-blur">
        <div className="grid gap-4 lg:grid-cols-4">
          <Input
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50 lg:col-span-2"
            placeholder={t('adminPricingPlans.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
            value={catalogFilter}
            onChange={(e) => setCatalogFilter(e.target.value)}
          >
            <option value="">{t('adminPricingPlans.filterItemAll')}</option>
            {catalogItems.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.title} ({item.type})
              </option>
            ))}
          </Select>
          <Select
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PricingPlanType | '')}
          >
            <option value="">{t('adminPricingPlans.filterTypeAll')}</option>
            {PLAN_TYPES.filter(Boolean).map((pt) => (
              <option key={pt} value={pt}>
                {t(`catalogPricing.planType.${pt}`)}
              </option>
            ))}
          </Select>
          <Select
            className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}
          >
            <option value="">{t('adminPricingPlans.filterStatusAll')}</option>
            <option value="true">{t('adminPricingPlans.filterActive')}</option>
            <option value="false">{t('adminPricingPlans.filterInactive')}</option>
          </Select>
        </div>
        <p className="mt-3 text-xs text-ase-muted">
          {t('adminPricingPlans.total').replace('{count}', String(plansQuery.data?.total ?? plans.length))}
        </p>
      </Card>

      {plansQuery.isLoading ? (
        <Skeleton className="h-56 rounded-[2rem]" />
      ) : plansQuery.isError ? (
        <EmptyState title={t('private.common.couldNotLoad')} description={t('catalogPricing.loadError')} />
      ) : plans.length === 0 ? (
        <EmptyState title={t('catalogPricing.empty')} description={t('adminPricingPlans.subtitle')} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={adminInactiveSurfaceClass(
                isPricingPlanInactive(plan.is_active),
                cn(
                  'rounded-2xl border p-5 transition',
                  plan.is_active ? 'border-violet-300/25 bg-ase-surface/70' : 'border-white/10',
                ),
              )}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300/80">
                {plan.catalog_item_title}
              </p>
              <p className="text-[11px] text-ase-muted">
                {plan.catalog_item_type} · {plan.catalog_item_slug}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-ase-text">{plan.name}</h3>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant={planTypeBadgeVariant(plan.plan_type)}>
                  {t(`catalogPricing.planType.${plan.plan_type}`)}
                </Badge>
                {plan.billing_interval !== 'none' ? (
                  <Badge variant="info">{t(`catalogPricing.interval.${plan.billing_interval}`)}</Badge>
                ) : null}
                <Badge variant={plan.is_active ? 'success' : 'default'}>
                  {plan.is_active ? t('catalogPricing.badge.active') : t('catalogPricing.badge.inactive')}
                </Badge>
                {plan.is_default ? (
                  <Badge variant="warning">{t('catalogPricing.badge.default')}</Badge>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-bold text-ase-text">
                {formatMoney(
                  plan.price,
                  plan.currency,
                  t('catalogPricing.public.priceOnRequest'),
                  plan.plan_type,
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(plan)}>
                  {t('catalogPricing.edit')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatusTarget(plan)}>
                  {plan.is_active ? t('catalogPricing.deactivate') : t('catalogPricing.activate')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-ase-error/30"
                  onClick={() => setDeleting(plan)}
                >
                  {t('catalogPricing.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CatalogPricingPlanModal
        open={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false)
          setEditing(null)
          setCreateCatalogId(undefined)
        }}
        initial={editing}
        catalogItems={editing ? undefined : catalogItems}
        catalogItemId={editing?.catalog_item_id ?? createCatalogId}
        onCatalogItemIdChange={setCreateCatalogId}
        isSubmitting={createMut.isPending || updateMut.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, payload })
            return
          }
          if (!createCatalogId) return
          await createMut.mutateAsync({ catalogItemId: createCatalogId, payload })
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        itemName={deleting?.name}
        onConfirm={() => deleting && deleteMut.mutate(deleting.id)}
        isPending={deleteMut.isPending}
        isError={deleteMut.isError}
        body={t('catalogPricing.confirmDelete')}
      />

      <ConfirmDeactivateDialog
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        itemName={statusTarget?.name}
        activating={!statusTarget?.is_active}
        isPending={statusMut.isPending}
        onConfirm={() => {
          if (!statusTarget) return
          statusMut.mutate({ id: statusTarget.id, is_active: !statusTarget.is_active })
        }}
      />
    </div>
  )
}
