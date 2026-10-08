import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { createOrganization } from '../api/onboarding.api'
import { deleteOrganization, listOrganizations, updateOrganization } from '../api/organizations.api'
import { getActiveOrganizationUuid, setActiveOrganizationUuid } from '../auth/auth.store'
import { AdminEyebrow, AdminHeroHalo } from '../components/admin/premium/PremiumHero'
import { ADMIN_HERO_SECTION, ADMIN_HERO_SUBTITLE, ADMIN_HERO_TITLE } from '../components/admin/premium/adminHeroStyles'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, TH, THead, TR } from '../components/ui/Table'
import { cn } from '../components/ui/cn'
import { useAuth } from '../hooks/useAuth'
import { useI18n } from '../i18n'
import type { Organization, OrganizationType } from '../types/organization.types'
import { OrganizationPremiumCard, PlatformInsightsPanel, StatCard, SuperMetricCard } from './OrganizationsPage.parts'
import { renderCreateOrganizationForm, renderDetailsDrawer, renderOrganizationBadges, renderStatusBadge } from './OrganizationsPage.render'
import { type FormValues, type SuperAdminViewMode, isManagedOrganization, relationshipKey, relationshipLabel, slugify } from './OrganizationsPage.utils'


export function OrganizationsPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const na = t('organizationsPage.common.na') as string
  const [activeUuid, setActiveUuid] = useState<string | null>(() => getActiveOrganizationUuid())
  const [detailsOrg, setDetailsOrg] = useState<Organization | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [superSearch, setSuperSearch] = useState('')
  const [superStatus, setSuperStatus] = useState('')
  const [superType, setSuperType] = useState('')
  const [superRelationship, setSuperRelationship] = useState('')
  const [superView, setSuperView] = useState<SuperAdminViewMode>('cards')
  const isSuperAdmin = Boolean(currentUser?.is_superuser)

  const orgTypes = useMemo<Array<{ value: OrganizationType; label: string }>>(
    () => [
      { value: 'individual', label: t('organizationsPage.types.individual') as string },
      { value: 'business', label: t('organizationsPage.types.business') as string },
      { value: 'enterprise', label: t('organizationsPage.types.enterprise') as string },
      { value: 'academy', label: t('organizationsPage.types.academy') as string },
    ],
    [t],
  )

  const schema = useMemo(
    () =>
      z.object({
        organization_name: z.string().min(2, t('organizationsPage.errors.nameRequired') as string),
        organization_slug: z
          .string()
          .min(2, t('organizationsPage.errors.slugRequired') as string)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('organizationsPage.errors.slugInvalid') as string),
        organization_type: z.enum(['individual', 'business', 'enterprise', 'academy']),
      }),
    [t],
  )

  const orgsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: listOrganizations,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      organization_name: '',
      organization_slug: '',
      organization_type: 'business',
    },
  })

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: async () => {
      form.reset({ organization_name: '', organization_slug: '', organization_type: 'business' })
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const orgName = useWatch({ control: form.control, name: 'organization_name' })
  const computedSlug = useMemo(() => slugify(orgName ?? ''), [orgName])

  const items = useMemo(() => orgsQuery.data?.items ?? [], [orgsQuery.data])
  const activeCount = useMemo(() => items.filter((o) => o.status === 'active').length, [items])
  const suspendedCount = useMemo(() => items.filter((o) => o.status === 'suspended').length, [items])
  const managedCount = useMemo(
    () => items.filter((o) => isManagedOrganization(o, currentUser?.uuid ?? null)).length,
    [currentUser?.uuid, items],
  )
  const primaryType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of items) counts.set(o.type ?? 'unknown', (counts.get(o.type ?? 'unknown') ?? 0) + 1)
    let best: string = 'unknown'
    let bestCount = 0
    for (const [k, v] of counts.entries()) {
      if (v > bestCount) {
        best = k
        bestCount = v
      }
    }
    return best
  }, [items])
  const primaryTypeLabel =
    primaryType === 'individual' || primaryType === 'business' || primaryType === 'enterprise' || primaryType === 'academy'
      ? (t(`organizationsPage.types.${primaryType}`) as string)
      : (t('organizationsPage.types.unknown') as string)

  const businessCount = useMemo(() => items.filter((o) => o.type === 'business').length, [items])
  const enterpriseCount = useMemo(() => items.filter((o) => o.type === 'enterprise').length, [items])
  const filteredSuperItems = useMemo(() => {
    const query = superSearch.trim().toLowerCase()
    return items.filter((o) => {
      if (query && !`${o.name} ${o.slug}`.toLowerCase().includes(query)) return false
      if (superStatus && o.status !== superStatus) return false
      if (superType && o.type !== superType) return false
      if (superRelationship && relationshipKey(o, currentUser?.uuid ?? null, isSuperAdmin) !== superRelationship) return false
      return true
    })
  }, [currentUser?.uuid, isSuperAdmin, items, superRelationship, superSearch, superStatus, superType])

  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach((o) => counts.set(o.type || 'unknown', (counts.get(o.type || 'unknown') ?? 0) + 1))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [items])

  const activateOrganization = (uuid: string) => {
    setActiveOrganizationUuid(uuid)
    setActiveUuid(uuid)
  }

  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState<Organization | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  const extractDetail = (err: unknown): string | null => {
    const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
    return typeof detail === 'string' ? detail : null
  }

  // Matches on a substring of the backend's raw English error detail (the
  // own-organization guard in organizations/router.py) to swap in a
  // translated, friendlier message — brittle if that backend string ever
  // changes wording, but there's no error code to match on instead.
  const friendlyOrgError = (err: unknown): string => {
    const detail = extractDetail(err)
    if (detail && detail.toLowerCase().includes('cannot deactivate or delete your own organization')) {
      return t('organizationsPage.errors.ownOrganization') as string
    }
    return t('organizationsPage.errors.statusUpdate') as string
  }

  const statusMutation = useMutation({
    mutationFn: ({ uuid, status: nextStatus }: { uuid: string; status: 'active' | 'suspended' }) =>
      updateOrganization(uuid, { status: nextStatus }),
    onSuccess: () => {
      setStatusError(null)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (err: unknown) => setStatusError(friendlyOrgError(err)),
  })

  const deleteOrgMutation = useMutation({
    mutationFn: (uuid: string) => deleteOrganization(uuid),
    onSuccess: () => {
      setStatusError(null)
      setConfirmDeleteOrg(null)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const toggleOrgStatus = (org: Organization) => {
    statusMutation.mutate({ uuid: org.uuid, status: org.status === 'suspended' ? 'active' : 'suspended' })
  }

  const isOwnOrganization = (org: Organization) => Boolean(currentUser?.uuid) && org.owner_user_uuid === currentUser?.uuid

  if (isSuperAdmin) {
    return (
      <div className="space-y-8 pb-16">
        <section className={ADMIN_HERO_SECTION}>
          <AdminHeroHalo accent="cyan" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center">
            <div>
              <AdminEyebrow accent="cyan" className="mb-4">{t('organizationsPage.superAdmin.badge')}</AdminEyebrow>
              <h1 className={ADMIN_HERO_TITLE}>
                {t('organizationsPage.superAdmin.title')}
              </h1>
              <p className={ADMIN_HERO_SUBTITLE}>
                {t('organizationsPage.superAdmin.subtitle')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
                  {t('organizationsPage.superAdmin.context')}
                </span>
                <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<span className="text-xs">+</span>}>
                  {t('organizationsPage.superAdmin.create.open')}
                </Button>
              </div>
            </div>

            <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-white/10 bg-ase-surface p-5 shadow-soft">
              {items.slice(0, 5).map((org, index) => (
                <div
                  key={org.uuid}
                  className={cn(
                    'absolute h-16 w-16 rounded-2xl border border-white/10 bg-ase-bg2 p-2 text-center text-[10px] font-semibold text-ase-text shadow-soft',
                    org.status === 'suspended' ? 'border-amber-300/30' : 'border-ase-brand/25',
                    ['left-[10%] top-[18%]', 'left-[62%] top-[12%]', 'left-[70%] top-[58%]', 'left-[24%] top-[66%]', 'left-[42%] top-[36%]'][index],
                  )}
                >
                  <div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-ase-brand/10 ring-1 ring-ase-brand/20">
                    {org.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border border-ase-brand/25 bg-ase-bg2 text-sm font-bold text-ase-text shadow-soft">
                ASE
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.total.label') as string} hint={t('organizationsPage.superAdmin.metrics.total.hint') as string} value={items.length} accent="from-ase-brand to-ase-brand" icon="⬡" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.active.label') as string} hint={t('organizationsPage.superAdmin.metrics.active.hint') as string} value={activeCount} accent="from-ase-brand to-ase-brand" icon="◉" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.suspended.label') as string} hint={t('organizationsPage.superAdmin.metrics.suspended.hint') as string} value={suspendedCount} accent="from-ase-brand to-ase-brand" icon="△" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.managed.label') as string} hint={t('organizationsPage.superAdmin.metrics.managed.hint') as string} value={managedCount} accent="from-ase-brand to-ase-brand" icon="◇" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.business.label') as string} hint={t('organizationsPage.superAdmin.metrics.business.hint') as string} value={businessCount} accent="from-ase-brand to-ase-brand" icon="□" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.enterprise.label') as string} hint={t('organizationsPage.superAdmin.metrics.enterprise.hint') as string} value={enterpriseCount} accent="from-ase-brand to-ase-brand" icon="◆" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft">
              <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_190px_auto]">
                <Input
                  value={superSearch}
                  onChange={(e) => setSuperSearch(e.target.value)}
                  placeholder={t('organizationsPage.superAdmin.filters.search') as string}
                  className="h-11 rounded-xl border-white/10 bg-ase-bg2/50"
                />
                <Select value={superStatus} onChange={(e) => setSuperStatus(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  <option value="">{t('organizationsPage.superAdmin.filters.status')}: {t('organizationsPage.superAdmin.filters.all')}</option>
                  <option value="active">{t('organizationsPage.status.active')}</option>
                  <option value="suspended">{t('organizationsPage.status.suspended')}</option>
                </Select>
                <Select value={superType} onChange={(e) => setSuperType(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  <option value="">{t('organizationsPage.superAdmin.filters.type')}: {t('organizationsPage.superAdmin.filters.all')}</option>
                  {orgTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <Select value={superRelationship} onChange={(e) => setSuperRelationship(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                  <option value="">{t('organizationsPage.superAdmin.filters.relationship')}: {t('organizationsPage.superAdmin.filters.all')}</option>
                  <option value="mine">{t('organizationsPage.relationship.myOrganization')}</option>
                  <option value="managed">{t('organizationsPage.relationship.managed')}</option>
                  <option value="platform">{t('organizationsPage.relationship.platformManaged')}</option>
                </Select>
                <div className="flex rounded-xl border border-white/10 bg-ase-bg2/50 p-1">
                  <button
                    type="button"
                    onClick={() => setSuperView('cards')}
                    className={cn('rounded-lg px-3 text-sm font-semibold transition', superView === 'cards' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2 hover:bg-white/[0.05]')}
                  >
                    {t('organizationsPage.superAdmin.view.cards')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuperView('table')}
                    className={cn('rounded-lg px-3 text-sm font-semibold transition', superView === 'table' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2 hover:bg-white/[0.05]')}
                  >
                    {t('organizationsPage.superAdmin.view.table')}
                  </button>
                </div>
              </div>
            </Card>

            {orgsQuery.isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-56 rounded-3xl" />
                <Skeleton className="h-56 rounded-3xl" />
              </div>
            ) : orgsQuery.isError ? (
              <EmptyState title={t('organizationsPage.errors.loadTitle') as string} description={t('organizationsPage.errors.loadSubtitle') as string} />
            ) : filteredSuperItems.length === 0 ? (
              <Card className="rounded-3xl border-white/10 bg-ase-surface/55 p-8 text-sm text-ase-text2">
                {t('organizationsPage.superAdmin.empty')}
              </Card>
            ) : superView === 'cards' ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredSuperItems.map((org) => (
                  <OrganizationPremiumCard
                    key={org.uuid}
                    org={org}
                    activeUuid={activeUuid}
                    currentUserUuid={currentUser?.uuid ?? null}
                    t={t}
                    onDetails={() => setDetailsOrg(org)}
                    onSetActive={() => activateOrganization(org.uuid)}
                    onToggleStatus={() => toggleOrgStatus(org)}
                    onDelete={() => setConfirmDeleteOrg(org)}
                    statusPending={statusMutation.isPending}
                    disableDangerActions={isOwnOrganization(org)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuperItems.map((org) => (
                  <Card key={org.uuid} className="rounded-2xl border-white/10 bg-ase-surface/55 p-4 transition hover:-translate-y-0.5 hover:border-ase-brand/20">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_1fr_1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ase-text">{org.name}</div>
                        <div className="mt-1 truncate text-xs text-ase-muted">{org.slug}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">{renderOrganizationBadges(t, org, { activeUuid, currentUserUuid: currentUser?.uuid ?? null })}</div>
                      <div className="text-sm text-ase-text2">{relationshipLabel(t, org, currentUser?.uuid ?? null, true)}</div>
                      <Button size="sm" variant="secondary" onClick={() => setDetailsOrg(org)}>
                        {t('organizationsPage.superAdmin.actions.viewDetails')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <PlatformInsightsPanel
            t={t}
            items={items}
            typeDistribution={typeDistribution}
            activeCount={activeCount}
            suspendedCount={suspendedCount}
            onCreate={() => setCreateOpen(true)}
          />
        </div>

        {createOpen ? (
          <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/65" onClick={() => setCreateOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-ase-bg2 p-6 shadow-soft sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('organizationsPage.superAdmin.create.open')}</div>
                  <h2 className="mt-2 text-xl font-semibold text-ase-text">{t('organizationsPage.superAdmin.create.title')}</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
                  {t('organizationsPage.actions.close')}
                </Button>
              </div>
              <div className="mt-6">
                {renderCreateOrganizationForm({ t, form, computedSlug, na, orgTypes, createMutation })}
              </div>
            </div>
          </div>
        ) : null}

        {detailsOrg &&
          renderDetailsDrawer({
            org: detailsOrg,
            t,
            activeUuid,
            activateOrganization,
            onClose: () => setDetailsOrg(null),
            onToggleStatus: () => toggleOrgStatus(detailsOrg),
            onDelete: () => {
              setDetailsOrg(null)
              setConfirmDeleteOrg(detailsOrg)
            },
            statusPending: statusMutation.isPending,
            disableDangerActions: isOwnOrganization(detailsOrg),
          })}

        {statusError ? (
          <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border border-ase-error/30 bg-ase-bg2 p-4 text-sm text-ase-error shadow-soft">
            {statusError}
            <button type="button" className="ml-3 text-ase-muted hover:text-ase-text" onClick={() => setStatusError(null)}>
              ×
            </button>
          </div>
        ) : null}

        <Modal
          open={!!confirmDeleteOrg}
          title={t('organizationsPage.delete.title') as string}
          closeLabel={t('organizationsPage.actions.close')}
          onClose={() => setConfirmDeleteOrg(null)}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="danger"
                disabled={deleteOrgMutation.isPending}
                onClick={() => {
                  if (!confirmDeleteOrg) return
                  deleteOrgMutation.mutate(confirmDeleteOrg.uuid)
                }}
              >
                {deleteOrgMutation.isPending ? t('organizationsPage.delete.deleting') : t('organizationsPage.delete.confirm')}
              </Button>
            </div>
          }
        >
          <div className="space-y-2">
            <div className="text-sm text-ase-text">
              {String(t('organizationsPage.delete.body')).replace('{{name}}', String(confirmDeleteOrg?.name ?? ''))}
            </div>
            <div className="text-sm text-ase-text2">{t('organizationsPage.delete.note')}</div>
            {deleteOrgMutation.isError && (
              <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {friendlyOrgError(deleteOrgMutation.error)}
              </div>
            )}
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_70px_rgba(0,0,0,0.55)] sm:p-8">
        <div className="pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('organizationsPage.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('organizationsPage.subtitle')}</p>
            {isSuperAdmin ? (
              <div className="mt-5 rounded-2xl border border-ase-primary/20 bg-ase-primary/10 p-4 text-sm text-ase-text2">
                <Badge variant="info" className="mb-3">
                  {t('organizationsPage.platformView.badge')}
                </Badge>
                <div className="text-sm font-semibold text-ase-text">{t('organizationsPage.platformView.title')}</div>
                <div className="mt-1 leading-relaxed">{t('organizationsPage.platformView.subtitle')}</div>
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-ase-text2">
              <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.explainer.title')}</div>
              <div className="mt-2 leading-relaxed">{t('organizationsPage.explainer.body')}</div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(420px,38%)] lg:grid-cols-1">
            <StatCard label={t('organizationsPage.stats.total.label') as string} value={String(items.length)} icon="⬡" horizontal />
            <StatCard label={t('organizationsPage.stats.active.label') as string} value={String(activeCount)} icon="◉" horizontal />
            {isSuperAdmin ? (
              <>
                <StatCard label={t('organizationsPage.stats.suspended.label') as string} value={String(suspendedCount)} icon="△" horizontal />
                <StatCard label={t('organizationsPage.stats.managed.label') as string} value={String(managedCount)} icon="◇" horizontal />
              </>
            ) : (
              <StatCard label={t('organizationsPage.stats.primaryType.label') as string} value={primaryTypeLabel} icon="◇" horizontal />
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card
          className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/40 p-6 lg:col-span-2"
          interactive
        >
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_52%)]" />

          <div className="relative z-[1] flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ase-text">{t('organizationsPage.list.title')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('organizationsPage.list.subtitle')}</div>
            </div>
            <div className="text-xs text-ase-muted">
              {orgsQuery.isFetching
                ? (t('organizationsPage.list.meta.updating') as string)
                : String(t('organizationsPage.list.meta.total')).replace('{{count}}', String(items.length))}
            </div>
          </div>

          <div className="mt-4">
            {orgsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-11/12" />
                <Skeleton className="h-10 w-10/12" />
              </div>
            ) : orgsQuery.isError ? (
              <EmptyState
                title={t('organizationsPage.errors.loadTitle') as string}
                description={t('organizationsPage.errors.loadSubtitle') as string}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title={t('organizationsPage.empty.title') as string}
                description={t('organizationsPage.empty.subtitle') as string}
                icon={<span className="text-sm">⬡</span>}
                actionLabel={t('organizationsPage.create.button') as string}
                onAction={() => {
                  const el = document.getElementById('org-create-panel')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>{t('organizationsPage.list.columns.name')}</TH>
                    <TH>{t('organizationsPage.list.columns.slug')}</TH>
                    <TH>{t('organizationsPage.list.columns.type')}</TH>
                    <TH>{t('organizationsPage.list.columns.status')}</TH>
                    <TH>{t('organizationsPage.list.columns.relationship')}</TH>
                    <TH className="text-right">{t('organizationsPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((o) => {
                    const isActiveOrg = activeUuid === o.uuid
                    return (
                      <TR key={o.uuid} className="hover:bg-white/[0.035]">
                        <TD className="font-medium text-ase-text">
                          <div className="flex items-center gap-3">
                            <span className={cn('h-2 w-2 rounded-full shadow-[0_0_18px_rgba(56,189,248,0.25)]', isActiveOrg ? 'bg-ase-primary' : 'bg-ase-primary/45')} />
                            <div className="min-w-0">
                              <span className="block truncate">{o.name}</span>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {renderOrganizationBadges(t, o, {
                                  activeUuid,
                                  currentUserUuid: currentUser?.uuid ?? null,
                                })}
                              </div>
                            </div>
                          </div>
                        </TD>
                        <TD className="text-ase-muted">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2">
                            {o.slug ?? na}
                          </span>
                        </TD>
                        <TD className="text-ase-text2">
                          {o.type === 'individual' || o.type === 'business' || o.type === 'enterprise' || o.type === 'academy'
                            ? (t(`organizationsPage.types.${o.type}`) as string)
                            : (t('organizationsPage.types.unknown') as string)}
                        </TD>
                        <TD>
                          {renderStatusBadge(t, o.status ?? null)}
                        </TD>
                        <TD className="text-ase-text2">{relationshipLabel(t, o, currentUser?.uuid ?? null, isSuperAdmin)}</TD>
                        <TD className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setDetailsOrg(o)} leftIcon={<span className="text-xs">◉</span>}>
                              {t('organizationsPage.actions.viewDetails')}
                            </Button>
                            {isActiveOrg ? (
                              <Button size="sm" variant="secondary" disabled leftIcon={<span className="text-xs">✓</span>}>
                                {t('organizationsPage.actions.active')}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => activateOrganization(o.uuid)} leftIcon={<span className="text-xs">⬡</span>}>
                                {t('organizationsPage.actions.setActive')}
                              </Button>
                            )}
                            {isSuperAdmin && o.status !== 'deleted' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isOwnOrganization(o) || statusMutation.isPending}
                                onClick={() => toggleOrgStatus(o)}
                              >
                                {o.status === 'suspended'
                                  ? t('organizationsPage.superAdmin.actions.reactivate')
                                  : t('organizationsPage.superAdmin.actions.suspend')}
                              </Button>
                            ) : null}
                            {isSuperAdmin && o.status !== 'deleted' ? (
                              <Button size="sm" variant="danger" disabled={isOwnOrganization(o)} onClick={() => setConfirmDeleteOrg(o)}>
                                {t('organizationsPage.superAdmin.actions.delete')}
                              </Button>
                            ) : null}
                          </div>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            )}
          </div>
        </Card>

        <div id="org-create-panel">
          <Card
            className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface/40 p-6"
            interactive
          >
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.10),transparent_52%)]" />

          <div className="relative z-[1] text-sm font-semibold text-ase-text">{t('organizationsPage.create.title')}</div>
          <div className="relative z-[1] mt-1 text-sm text-ase-text2">{t('organizationsPage.create.subtitle')}</div>

          <form
            className="mt-4 space-y-4"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <div>
              <label htmlFor="org-modal-create-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.name')}</label>
              <Input
                id="org-modal-create-name"
                placeholder={t('organizationsPage.create.placeholders.name') as string}
                {...form.register('organization_name', {
                  onChange: (e) => {
                    const name = String(e.target.value ?? '')
                    const current = form.getValues('organization_slug')
                    if (!current) form.setValue('organization_slug', slugify(name))
                  },
                })}
              />
              {form.formState.errors.organization_name && (
                <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_name.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="org-modal-create-slug" className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.slug')}</label>
                <button
                  type="button"
                  className={cn(
                    'rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2 transition hover:bg-white/[0.05]',
                    !computedSlug && 'opacity-50',
                  )}
                  disabled={!computedSlug}
                  onClick={() => form.setValue('organization_slug', computedSlug)}
                >
                  {String(t('organizationsPage.create.helper.suggest')).replace('{{slug}}', computedSlug || na)}
                </button>
              </div>
              <Input placeholder={t('organizationsPage.create.placeholders.slug') as string} {...form.register('organization_slug')} />
              {form.formState.errors.organization_slug && (
                <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_slug.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="org-modal-create-type" className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.type')}</label>
              <Select id="org-modal-create-type" {...form.register('organization_type')}>
                {orgTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              {form.formState.errors.organization_type && (
                <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_type.message}</p>
              )}
            </div>

            {createMutation.isError && (
              <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {t('organizationsPage.create.error')}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
              {createMutation.isPending ? t('organizationsPage.create.creating') : t('organizationsPage.create.button')}
            </Button>
          </form>
          </Card>
        </div>
      </div>

      {detailsOrg && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/65" onClick={() => setDetailsOrg(null)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/10 bg-ase-bg2/80 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.actions.viewDetails')}</div>
                <div className="mt-2 truncate text-xl font-extrabold tracking-tight text-ase-text">{detailsOrg.name}</div>
                <div className="mt-1 text-sm text-ase-text2">{detailsOrg.slug}</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setDetailsOrg(null)} leftIcon={<span className="text-xs">×</span>}>
                {t('organizationsPage.actions.close')}
              </Button>
            </div>

            <div className="mt-6 grid gap-3">
              <Card className="rounded-2xl border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.list.columns.type')}</div>
                <div className="mt-1 text-sm font-semibold text-ase-text2">
                  {detailsOrg.type === 'individual' || detailsOrg.type === 'business' || detailsOrg.type === 'enterprise' || detailsOrg.type === 'academy'
                    ? (t(`organizationsPage.types.${detailsOrg.type}`) as string)
                    : (t('organizationsPage.types.unknown') as string)}
                </div>
              </Card>
              <Card className="rounded-2xl border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.list.columns.status')}</div>
                <div className="mt-2">
                  {renderStatusBadge(t, detailsOrg.status ?? null)}
                </div>
              </Card>
              {activeUuid === detailsOrg.uuid ? (
                <Card className="rounded-2xl border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.actions.active')}</div>
                  <div className="mt-1 text-sm font-semibold text-ase-text2">{t('organizationsPage.actions.active')}</div>
                </Card>
              ) : (
                <Button className="w-full" onClick={() => activateOrganization(detailsOrg.uuid)} leftIcon={<span className="text-xs">⬡</span>}>
                  {t('organizationsPage.actions.setActive')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
