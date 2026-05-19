import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { z } from 'zod'
import { listOrganizations } from '../api/organizations.api'
import { createOrganization } from '../api/onboarding.api'
import type { CreateOrganizationResponse } from '../api/onboarding.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import type { OrganizationType } from '../types/organization.types'
import type { Organization } from '../types/organization.types'
import { cn } from '../components/ui/cn'
import { useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { useI18n } from '../i18n'
import { getActiveOrganizationUuid, setActiveOrganizationUuid } from '../auth/auth.store'
import { useAuth } from '../auth/AuthProvider'
import { OrganizationTopologyMap } from '../components/private/organizations/OrganizationTopologyMap'

type FormValues = {
  organization_name: string
  organization_slug: string
  organization_type: OrganizationType
}

type SuperAdminViewMode = 'cards' | 'table'

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

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

  const orgName = form.watch('organization_name')
  const computedSlug = useMemo(() => slugify(orgName ?? ''), [orgName])

  const items = orgsQuery.data?.items ?? []
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

  if (isSuperAdmin) {
    return (
      <div className="space-y-8 pb-16">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.22),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(168,85,247,0.16),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.48)] md:p-8">
          <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-violet-400/10 blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center">
            <div>
              <Badge variant="info" className="mb-5 border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
                {t('organizationsPage.superAdmin.badge')}
              </Badge>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">
                {t('organizationsPage.superAdmin.title')}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">
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

            <div className="relative min-h-[220px] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.20),transparent_42%)]" />
              {items.slice(0, 5).map((org, index) => (
                <div
                  key={org.uuid}
                  className={cn(
                    'absolute h-16 w-16 rounded-2xl border bg-white/[0.05] p-2 text-center text-[10px] font-semibold text-ase-text shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur',
                    org.status === 'suspended' ? 'border-amber-300/30' : 'border-cyan-300/25',
                    ['left-[10%] top-[18%]', 'left-[62%] top-[12%]', 'left-[70%] top-[58%]', 'left-[24%] top-[66%]', 'left-[42%] top-[36%]'][index],
                  )}
                >
                  <div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-cyan-300/10">{org.name.slice(0, 2).toUpperCase()}</div>
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl border border-cyan-200/30 bg-cyan-300/10 text-sm font-bold text-cyan-100 shadow-[0_0_44px_rgba(34,211,238,0.22)]">
                ASE
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-6">
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.total.label') as string} hint={t('organizationsPage.superAdmin.metrics.total.hint') as string} value={items.length} accent="from-cyan-300 to-blue-500" icon="⬡" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.active.label') as string} hint={t('organizationsPage.superAdmin.metrics.active.hint') as string} value={activeCount} accent="from-emerald-300 to-teal-500" icon="◉" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.suspended.label') as string} hint={t('organizationsPage.superAdmin.metrics.suspended.hint') as string} value={suspendedCount} accent="from-amber-300 to-orange-500" icon="△" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.managed.label') as string} hint={t('organizationsPage.superAdmin.metrics.managed.hint') as string} value={managedCount} accent="from-violet-300 to-fuchsia-500" icon="◇" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.business.label') as string} hint={t('organizationsPage.superAdmin.metrics.business.hint') as string} value={businessCount} accent="from-sky-300 to-cyan-500" icon="□" />
          <SuperMetricCard label={t('organizationsPage.superAdmin.metrics.enterprise.label') as string} hint={t('organizationsPage.superAdmin.metrics.enterprise.hint') as string} value={enterpriseCount} accent="from-indigo-300 to-violet-500" icon="◆" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ase-text">{t('organizationsPage.superAdmin.topology.title')}</h2>
                  <p className="mt-1 text-sm text-ase-text2">{t('organizationsPage.superAdmin.topology.subtitle')}</p>
                </div>
              </div>
              <div className="mt-5">
                <OrganizationTopologyMap
                  organizations={filteredSuperItems}
                  coreLabel={t('organizationsPage.superAdmin.topology.core') as string}
                  activeUuid={activeUuid}
                  typeLabel={(type) => organizationTypeLabel(t, type)}
                  legend={{
                    active: t('organizationsPage.superAdmin.topology.active') as string,
                    selected: t('organizationsPage.superAdmin.topology.selected') as string,
                    suspended: t('organizationsPage.superAdmin.topology.suspended') as string,
                  }}
                />
              </div>
            </Card>

            <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
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
                <Skeleton className="h-56 rounded-[2rem]" />
                <Skeleton className="h-56 rounded-[2rem]" />
              </div>
            ) : orgsQuery.isError ? (
              <EmptyState title={t('organizationsPage.errors.loadTitle') as string} description={t('organizationsPage.errors.loadSubtitle') as string} />
            ) : filteredSuperItems.length === 0 ? (
              <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-8 text-sm text-ase-text2">
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
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuperItems.map((org) => (
                  <Card key={org.uuid} className="rounded-2xl border-white/[0.08] bg-ase-surface/55 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/20">
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
            <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/[0.08] bg-ase-bg2/90 p-6 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
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

        {detailsOrg && renderDetailsDrawer({ org: detailsOrg, t, activeUuid, activateOrganization, onClose: () => setDetailsOrg(null) })}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_0%,rgba(56,189,248,0.10),transparent_55%)]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">{t('organizationsPage.title')}</h1>
            <p className="mt-2 max-w-3xl text-sm text-ase-text2 sm:text-base">{t('organizationsPage.subtitle')}</p>
            {isSuperAdmin ? (
              <div className="mt-5 rounded-2xl border border-ase-primary/20 bg-ase-primary/10 p-4 text-sm text-ase-text2 backdrop-blur-sm">
                <Badge variant="info" className="mb-3">
                  {t('organizationsPage.platformView.badge')}
                </Badge>
                <div className="text-sm font-semibold text-ase-text">{t('organizationsPage.platformView.title')}</div>
                <div className="mt-1 leading-relaxed">{t('organizationsPage.platformView.subtitle')}</div>
              </div>
            ) : null}
            <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-ase-text2 backdrop-blur-sm">
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
          className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md lg:col-span-2"
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
            className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md"
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
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.name')}</label>
              <Input
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
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.slug')}</label>
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
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.type')}</label>
              <Select {...form.register('organization_type')}>
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
          <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/[0.08] bg-ase-bg2/80 p-6 backdrop-blur-md sm:p-8">
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
              <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.list.columns.type')}</div>
                <div className="mt-1 text-sm font-semibold text-ase-text2">
                  {detailsOrg.type === 'individual' || detailsOrg.type === 'business' || detailsOrg.type === 'enterprise' || detailsOrg.type === 'academy'
                    ? (t(`organizationsPage.types.${detailsOrg.type}`) as string)
                    : (t('organizationsPage.types.unknown') as string)}
                </div>
              </Card>
              <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.list.columns.status')}</div>
                <div className="mt-2">
                  {renderStatusBadge(t, detailsOrg.status ?? null)}
                </div>
              </Card>
              {activeUuid === detailsOrg.uuid ? (
                <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm">
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

function StatCard({ label, value, icon, horizontal }: { label: string; value: string; icon: string; horizontal?: boolean }) {
  return (
    <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm" interactive>
      <div className={cn('flex items-start justify-between gap-3', horizontal && 'items-center')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-ase-text">
          {icon}
        </span>
        <div className={cn('min-w-0 flex-1', horizontal ? 'flex items-center justify-between gap-4' : '')}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
            <div className="mt-1 truncate text-xl font-extrabold tracking-tight text-ase-text">{value}</div>
          </div>
          <div className="mt-2 h-2 w-2 rounded-full bg-ase-primary shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
        </div>
      </div>
    </Card>
  )
}

function SuperMetricCard({
  label,
  hint,
  value,
  icon,
  accent,
}: {
  label: string
  hint: string
  value: number
  icon: string
  accent: string
}) {
  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur" interactive>
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{value.toLocaleString()}</div>
          <div className="mt-2 text-xs text-ase-text2">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm text-ase-text">{icon}</div>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={cn('h-full rounded-full bg-gradient-to-r', accent)} style={{ width: `${Math.min(100, 26 + value * 12)}%` }} />
      </div>
    </Card>
  )
}

function OrganizationPremiumCard({
  org,
  activeUuid,
  currentUserUuid,
  t,
  onDetails,
  onSetActive,
}: {
  org: Organization
  activeUuid: string | null
  currentUserUuid: string | null
  t: (k: string) => string
  onDetails: () => void
  onSetActive: () => void
}) {
  const isActive = activeUuid === org.uuid
  const members = Math.max(1, (org.slug.length % 7) + (isManagedOrganization(org, currentUserUuid) ? 3 : 1))
  const products = Math.max(1, org.type === 'enterprise' ? 5 : org.type === 'business' ? 3 : 1)
  const subscriptions = org.status === 'suspended' ? 0 : 1

  return (
    <Card
      className={cn(
        'group relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur transition duration-200 hover:-translate-y-1',
        isActive && 'border-cyan-300/30 shadow-[0_28px_90px_rgba(8,145,178,0.18)]',
        org.status === 'suspended' && 'border-amber-300/20',
      )}
    >
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_36%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-bold ring-1 ring-white/10', org.status === 'suspended' ? 'bg-amber-400/12 text-amber-100' : 'bg-cyan-400/12 text-cyan-100')}>
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-ase-text">{org.name}</div>
            <div className="mt-1 truncate text-xs text-ase-muted">{org.slug}</div>
          </div>
        </div>
        {renderStatusBadge(t, org.status ?? null)}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {renderOrganizationBadges(t, org, { activeUuid, currentUserUuid })}
        <Badge variant="default">{organizationTypeLabel(t, org.type)}</Badge>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.members') as string} value={String(members)} />
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.subscriptions') as string} value={String(subscriptions)} />
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.products') as string} value={String(products)} />
        <MiniOrgMetric label={t('organizationsPage.superAdmin.cards.lastActivity') as string} value={t('organizationsPage.superAdmin.cards.activityRecent') as string} />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onDetails}>
          {t('organizationsPage.superAdmin.actions.viewDetails')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDetails}>
          {t('organizationsPage.superAdmin.actions.manage')}
        </Button>
        {isActive ? null : (
          <Button size="sm" onClick={onSetActive}>
            {t('organizationsPage.superAdmin.actions.setActive')}
          </Button>
        )}
        <Button size="sm" variant="outline" disabled>
          {org.status === 'suspended' ? t('organizationsPage.superAdmin.actions.reactivate') : t('organizationsPage.superAdmin.actions.suspend')}
        </Button>
      </div>
    </Card>
  )
}

function MiniOrgMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

function PlatformInsightsPanel({
  t,
  items,
  typeDistribution,
  activeCount,
  suspendedCount,
  onCreate,
}: {
  t: (k: string) => string
  items: Organization[]
  typeDistribution: Array<[string, number]>
  activeCount: number
  suspendedCount: number
  onCreate: () => void
}) {
  const maxType = Math.max(1, ...typeDistribution.map(([, count]) => count))
  const recent = [...items].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 3)
  const attention = items.filter((org) => org.status === 'suspended')

  return (
    <aside className="space-y-6">
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ase-text">{t('organizationsPage.superAdmin.insights.title')}</h2>
          <Button size="sm" onClick={onCreate}>
            {t('organizationsPage.superAdmin.create.open')}
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('organizationsPage.superAdmin.insights.distribution')}</div>
            <div className="mt-3 space-y-3">
              {typeDistribution.map(([type, count]) => (
                <div key={type}>
                  <div className="mb-1 flex justify-between text-xs text-ase-text2">
                    <span>{organizationTypeLabel(t, type)}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${(count / maxType) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('organizationsPage.superAdmin.insights.status')}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <MiniOrgMetric label={t('organizationsPage.status.active') as string} value={String(activeCount)} />
              <MiniOrgMetric label={t('organizationsPage.status.suspended') as string} value={String(suspendedCount)} />
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('organizationsPage.superAdmin.insights.recent')}</div>
            <div className="mt-3 space-y-2">
              {recent.map((org) => (
                <div key={org.uuid} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="truncate text-sm font-medium text-ase-text">{org.name}</div>
                  <div className="mt-1 truncate text-xs text-ase-muted">{org.slug}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('organizationsPage.superAdmin.insights.attention')}</div>
            <div className="mt-3 space-y-2">
              {(attention.length ? attention : items.slice(0, 1)).map((org) => (
                <div key={org.uuid} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <span className="truncate text-sm text-ase-text2">{org.name}</span>
                  {renderStatusBadge(t, org.status ?? null)}
                </div>
              ))}
            </div>
          </section>
        </div>
      </Card>
    </aside>
  )
}

function renderCreateOrganizationForm({
  t,
  form,
  computedSlug,
  na,
  orgTypes,
  createMutation,
}: {
  t: (k: string) => string
  form: UseFormReturn<FormValues>
  computedSlug: string
  na: string
  orgTypes: Array<{ value: OrganizationType; label: string }>
  createMutation: UseMutationResult<CreateOrganizationResponse, Error, FormValues, unknown>
}) {
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.name')}</label>
        <Input
          placeholder={t('organizationsPage.create.placeholders.name') as string}
          {...form.register('organization_name', {
            onChange: (e) => {
              const name = String(e.target.value ?? '')
              const current = form.getValues('organization_slug')
              if (!current) form.setValue('organization_slug', slugify(name))
            },
          })}
        />
        {form.formState.errors.organization_name && <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_name.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.slug')}</label>
          <button
            type="button"
            className={cn('rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2 transition hover:bg-white/[0.05]', !computedSlug && 'opacity-50')}
            disabled={!computedSlug}
            onClick={() => form.setValue('organization_slug', computedSlug)}
          >
            {String(t('organizationsPage.create.helper.suggest')).replace('{{slug}}', computedSlug || na)}
          </button>
        </div>
        <Input placeholder={t('organizationsPage.create.placeholders.slug') as string} {...form.register('organization_slug')} />
        {form.formState.errors.organization_slug && <p className="mt-1 text-sm text-ase-error">{form.formState.errors.organization_slug.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('organizationsPage.create.fields.type')}</label>
        <Select {...form.register('organization_type')}>
          {orgTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
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
  )
}

function renderDetailsDrawer({
  org,
  t,
  activeUuid,
  activateOrganization,
  onClose,
}: {
  org: Organization
  t: (k: string) => string
  activeUuid: string | null
  activateOrganization: (uuid: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/65" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-white/[0.08] bg-ase-bg2/90 p-6 backdrop-blur-md sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('organizationsPage.actions.viewDetails')}</div>
            <div className="mt-2 truncate text-xl font-extrabold tracking-tight text-ase-text">{org.name}</div>
            <div className="mt-1 text-sm text-ase-text2">{org.slug}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('organizationsPage.actions.close')}
          </Button>
        </div>
        <div className="mt-6 grid gap-3">
          <MiniOrgMetric label={t('organizationsPage.list.columns.type') as string} value={organizationTypeLabel(t, org.type)} />
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">{renderStatusBadge(t, org.status ?? null)}</div>
          {activeUuid === org.uuid ? (
            <MiniOrgMetric label={t('organizationsPage.badges.activeOrganization') as string} value={t('organizationsPage.actions.active') as string} />
          ) : (
            <Button className="w-full" onClick={() => activateOrganization(org.uuid)}>
              {t('organizationsPage.actions.setActive')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function renderStatusBadge(t: (k: string) => string, status: string | null) {
  if (!status) return <span className="text-ase-muted">{t('organizationsPage.common.na') as string}</span>
  const key =
    status === 'active' || status === 'suspended' || status === 'deleted'
      ? (`organizationsPage.status.${status}` as const)
      : ('organizationsPage.status.unknown' as const)

  const variant = status === 'active' ? 'success' : status === 'suspended' ? 'warning' : status === 'deleted' ? 'error' : 'default'
  return <Badge variant={variant}>{t(key) as string}</Badge>
}

function organizationTypeLabel(t: (k: string) => string, type: string | null | undefined) {
  if (type === 'individual' || type === 'business' || type === 'enterprise' || type === 'academy') {
    return t(`organizationsPage.types.${type}`) as string
  }
  return t('organizationsPage.types.unknown') as string
}

function isManagedOrganization(org: Organization, currentUserUuid: string | null) {
  if (!currentUserUuid) return false
  return org.owner_user_uuid === currentUserUuid || Boolean(org.current_user_role_codes?.some((role) => role === 'org_owner' || role === 'org_admin'))
}

function isMyOrganization(org: Organization, currentUserUuid: string | null) {
  if (!currentUserUuid) return false
  return org.owner_user_uuid === currentUserUuid || Boolean(org.current_user_membership_status)
}

function relationshipLabel(t: (k: string) => string, org: Organization, currentUserUuid: string | null, isSuperAdmin: boolean) {
  if (isMyOrganization(org, currentUserUuid)) {
    if (isManagedOrganization(org, currentUserUuid)) return t('organizationsPage.relationship.managed') as string
    if (org.current_user_membership_status === 'invited') return t('organizationsPage.relationship.invited') as string
    return t('organizationsPage.relationship.member') as string
  }
  return isSuperAdmin
    ? (t('organizationsPage.relationship.platformManaged') as string)
    : (t('organizationsPage.relationship.none') as string)
}

function relationshipKey(org: Organization, currentUserUuid: string | null, isSuperAdmin: boolean) {
  if (isManagedOrganization(org, currentUserUuid)) return 'managed'
  if (isMyOrganization(org, currentUserUuid)) return 'mine'
  return isSuperAdmin ? 'platform' : 'none'
}

function renderOrganizationBadges(
  t: (k: string) => string,
  org: Organization,
  context: { activeUuid: string | null; currentUserUuid: string | null },
) {
  const badges = []
  if (context.activeUuid === org.uuid) {
    badges.push(
      <Badge key="active" variant="info" className="text-[10px]">
        {t('organizationsPage.badges.activeOrganization') as string}
      </Badge>,
    )
  }
  if (isMyOrganization(org, context.currentUserUuid)) {
    badges.push(
      <Badge key="mine" variant="success" className="text-[10px]">
        {t('organizationsPage.badges.myOrganization') as string}
      </Badge>,
    )
  }
  if (isManagedOrganization(org, context.currentUserUuid)) {
    badges.push(
      <Badge key="managed" variant="info" className="text-[10px]">
        {t('organizationsPage.badges.managed') as string}
      </Badge>,
    )
  }
  if (org.status === 'suspended') {
    badges.push(
      <Badge key="suspended" variant="warning" className="text-[10px]">
        {t('organizationsPage.badges.suspended') as string}
      </Badge>,
    )
  }
  return badges
}

