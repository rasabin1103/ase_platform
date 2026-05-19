import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { listOrganizations } from '../api/organizations.api'
import { listPlans } from '../api/plans.api'
import { createSubscription, deleteSubscription, listSubscriptions, updateSubscription } from '../api/subscriptions.api'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { cn } from '../components/ui/cn'
import { useI18n } from '../i18n'
import type { Plan } from '../types/plan.types'
import type { Subscription, SubscriptionProvider, SubscriptionStatus } from '../types/subscription.types'
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const providers: SubscriptionProvider[] = ['manual', 'stripe']
const statuses: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'canceled', 'expired']

export function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const na = t('subscriptionsPage.common.na') as string

  const [editing, setEditing] = useState<Subscription | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Subscription | null>(null)
  const [createFocus, setCreateFocus] = useState(false)

  const createSchema = useMemo(
    () =>
      z.object({
        organization_uuid: z.string().uuid(t('subscriptionsPage.create.selectOrg') as string),
        plan_id: z.number().int().min(1, t('subscriptionsPage.create.selectPlan') as string),
        provider: z.enum(['manual', 'stripe']),
        provider_subscription_id: z.string().optional().or(z.literal('')),
        status: z.enum(['trialing', 'active', 'past_due', 'canceled', 'expired']),
        starts_at: z.string().min(1, t('subscriptionsPage.create.fields.startsAt') as string),
        ends_at: z.string().optional().or(z.literal('')),
        trial_ends_at: z.string().optional().or(z.literal('')),
      }),
    [t],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        organization_uuid: z.string().uuid().optional().or(z.literal('')),
        plan_id: z.number().int().min(1).optional(),
        provider: z.enum(['manual', 'stripe']).optional(),
        provider_subscription_id: z.string().optional().or(z.literal('')),
        status: z.enum(['trialing', 'active', 'past_due', 'canceled', 'expired']).optional(),
        starts_at: z.string().optional().or(z.literal('')),
        ends_at: z.string().optional().or(z.literal('')),
        trial_ends_at: z.string().optional().or(z.literal('')),
      }),
    [t],
  )

  type CreateValues = z.infer<typeof createSchema>
  type EditValues = z.infer<typeof editSchema>

  const orgsQuery = useQuery({ queryKey: ['organizations', 'for-select'], queryFn: listOrganizations })
  const plansQuery = useQuery({ queryKey: ['plans', 'for-select'], queryFn: () => listPlans({ limit: 200, offset: 0 }) })
  const subsQuery = useQuery({ queryKey: ['subscriptions', { limit: 50, offset: 0 }], queryFn: () => listSubscriptions({ limit: 50, offset: 0 }) })

  const orgItems = orgsQuery.data?.items ?? []
  const planItems = plansQuery.data?.items ?? []
  const subItems = subsQuery.data?.items ?? []

  const planById = useMemo(() => {
    const m = new Map<number, Plan>()
    for (const p of planItems) m.set(p.id, p)
    return m
  }, [planItems])

  const orgByUuid = useMemo(() => {
    const m = new Map<string, { name: string; slug?: string | null }>()
    for (const o of orgItems) m.set(o.uuid, { name: o.name, slug: (o as any).slug })
    return m
  }, [orgItems])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      organization_uuid: orgItems[0]?.uuid ?? '',
      plan_id: planItems[0]?.id ?? 0,
      provider: 'manual',
      provider_subscription_id: '',
      status: 'active',
      starts_at: '',
      ends_at: '',
      trial_ends_at: '',
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      organization_uuid: '',
      plan_id: 0,
      provider: 'manual',
      provider_subscription_id: '',
      status: 'active',
      starts_at: '',
      ends_at: '',
      trial_ends_at: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: async () => {
      createForm.reset({
        organization_uuid: orgItems[0]?.uuid ?? '',
        plan_id: planItems[0]?.id ?? 0,
        provider: 'manual',
        provider_subscription_id: '',
        status: 'active',
        starts_at: '',
        ends_at: '',
        trial_ends_at: '',
      })
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ subscription_id, payload }: { subscription_id: number; payload: any }) => updateSubscription(subscription_id, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (subscription_id: number) => deleteSubscription(subscription_id),
    onSuccess: async () => {
      setConfirmDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })

  const editTitle = useMemo(
    () => (editing ? `${t('subscriptionsPage.edit.title')} — #${editing.id}` : (t('subscriptionsPage.edit.title') as string)),
    [editing, t],
  )

  const activeCount = useMemo(() => subItems.filter((s) => s.status === 'active').length, [subItems])

  const mrr = useMemo(() => {
    let sum = 0
    for (const s of subItems) {
      if (s.status !== 'active') continue
      const p = planById.get(s.plan_id)
      if (!p?.price) continue
      const n = Number(p.price)
      if (Number.isNaN(n)) continue
      if (p.billing_cycle === 'monthly') sum += n
      else if (p.billing_cycle === 'yearly') sum += n / 12
    }
    return sum
  }, [subItems, planById])

  const renewalsNext30 = useMemo(() => {
    const now = Date.now()
    const max = now + 1000 * 60 * 60 * 24 * 30
    return subItems.filter((s) => {
      if (s.status !== 'active') return false
      if (!s.ends_at) return false
      const tms = new Date(s.ends_at).getTime()
      return !Number.isNaN(tms) && tms >= now && tms <= max
    }).length
  }, [subItems])

  const byStatus = useMemo(() => {
    const order: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'canceled', 'expired']
    const counts = new Map<SubscriptionStatus, number>()
    for (const s of order) counts.set(s, 0)
    for (const s of subItems) counts.set(s.status, (counts.get(s.status) ?? 0) + 1)
    return order.map((k) => ({
      name: t(`subscriptionsPage.status.${k}`) as string,
      value: counts.get(k) ?? 0,
      color:
        k === 'active'
          ? 'rgba(34,197,94,0.65)'
          : k === 'trialing'
            ? 'rgba(56,189,248,0.70)'
            : k === 'past_due'
              ? 'rgba(245,158,11,0.70)'
              : 'rgba(248,250,252,0.25)',
    }))
  }, [subItems, t])

  const byPlan = useMemo(() => {
    const counts = new Map<number, number>()
    for (const s of subItems) counts.set(s.plan_id, (counts.get(s.plan_id) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([planId, count]) => ({ name: planById.get(planId)?.name ?? `#${planId}`, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [subItems, planById])

  const revenueTrend = useMemo(() => {
    const base = Math.max(0, Math.round(mrr))
    return Array.from({ length: 12 }).map((_, i) => ({ m: i + 1, v: Math.max(0, base + (i % 3) * 12 + i * 4) }))
  }, [mrr])

  const selectedOrgUuid = createForm.watch('organization_uuid')
  const selectedPlanId = createForm.watch('plan_id')
  const selectedPlan = planById.get(selectedPlanId)
  const selectedOrg = orgByUuid.get(selectedOrgUuid)

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(34,197,94,0.18),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(34,211,238,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="success" className="mb-5 border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
              {t('subscriptionsPage.premium.badge')}
            </Badge>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">{t('subscriptionsPage.title')}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('subscriptionsPage.subtitle')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
                {t('subscriptionsPage.premium.context')}
              </span>
              <Button
                size="sm"
                onClick={() => document.getElementById('subs-create-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                leftIcon={<span className="text-xs">+</span>}
              >
                {t('subscriptionsPage.premium.create')}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(520px,46%)] lg:grid-cols-1">
            <StatCard label={t('subscriptionsPage.stats.total.label') as string} value={String(subsQuery.data?.total ?? subItems.length)} icon="◈" horizontal />
            <StatCard label={t('subscriptionsPage.stats.active.label') as string} value={String(activeCount)} icon="✓" horizontal />
            <StatCard label={t('subscriptionsPage.stats.mrr.label') as string} value={new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(mrr)} icon="⬡" horizontal />
            <StatCard label={t('subscriptionsPage.stats.renewals.label') as string} value={String(renewalsNext30)} icon="○" horizontal />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md lg:col-span-2" interactive>
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_52%)]" />

          <div className="relative z-[1] flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ase-text">{t('subscriptionsPage.list.title')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('subscriptionsPage.list.subtitle')}</div>
            </div>
            <div className="text-xs text-ase-muted">
              {subsQuery.isFetching
                ? (t('subscriptionsPage.list.meta.updating') as string)
                : String(t('subscriptionsPage.list.meta.total')).replace('{{count}}', String(subsQuery.data?.total ?? subItems.length))}
            </div>
          </div>

          <div className="mt-4">
            {subsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-11/12" />
                <Skeleton className="h-10 w-10/12" />
              </div>
            ) : subsQuery.isError ? (
              <EmptyState title={t('subscriptionsPage.errors.loadTitle') as string} description={t('subscriptionsPage.errors.loadSubtitle') as string} />
            ) : subItems.length === 0 ? (
              <EmptyState
                title={t('subscriptionsPage.empty.title') as string}
                description={t('subscriptionsPage.empty.subtitle') as string}
                actionLabel={t('subscriptionsPage.empty.cta') as string}
                onAction={() => {
                  const el = document.getElementById('subs-create-panel')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setCreateFocus(true)
                  setTimeout(() => setCreateFocus(false), 600)
                }}
              />
            ) : (
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[26%]">{t('subscriptionsPage.list.columns.organization')}</TH>
                    <TH className="w-[22%]">{t('subscriptionsPage.list.columns.plan')}</TH>
                    <TH className="w-[12%]">{t('subscriptionsPage.list.columns.provider')}</TH>
                    <TH className="w-[14%]">{t('subscriptionsPage.list.columns.status')}</TH>
                    <TH className="hidden w-[14%] xl:table-cell">{t('subscriptionsPage.list.columns.start')}</TH>
                    <TH className="hidden w-[14%] xl:table-cell">{t('subscriptionsPage.list.columns.end')}</TH>
                    <TH className="hidden w-[14%] 2xl:table-cell">{t('subscriptionsPage.list.columns.amount')}</TH>
                    <TH className="w-[20%] text-right">{t('subscriptionsPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {subItems.map((s) => {
                    const plan = planById.get(s.plan_id)
                    return (
                      <TR key={s.id} className="hover:bg-white/[0.035]">
                        <TD className="font-medium text-ase-text">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-xs font-extrabold text-ase-text">
                              {orgAvatar(s.organization_id)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-ase-text">
                                {t('subscriptionsPage.list.columns.organization')}
                              </div>
                              <div className="truncate text-xs text-ase-text2">{t(`subscriptionsPage.provider.${s.provider}`)}</div>
                            </div>
                          </div>
                        </TD>
                        <TD className="text-ase-text2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-ase-text" title={plan?.name ?? `#${s.plan_id}`}>
                              {plan?.name ?? `#${s.plan_id}`}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {plan ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-semibold text-ase-text2">
                                  {billingCycleLabel(t, plan.billing_cycle)}
                                </span>
                              ) : null}
                              {plan?.price ? (
                                <span className="text-xs text-ase-muted">{fmtMoney(plan.price, plan.currency) ?? ''}</span>
                              ) : (
                                <span className="text-xs text-ase-muted">{t('plansPage.price.custom')}</span>
                              )}
                            </div>
                          </div>
                        </TD>
                        <TD className="text-ase-text2">{providerBadge(t, s.provider)}</TD>
                        <TD>{statusBadge(t, s.status)}</TD>
                        <TD className="hidden text-ase-muted xl:table-cell">
                          <span className="block truncate" title={fmtDate(s.starts_at)}>
                            {fmtDate(s.starts_at)}
                          </span>
                        </TD>
                        <TD className="hidden text-ase-muted xl:table-cell">
                          <span className="block truncate" title={fmtDate(s.ends_at)}>
                            {fmtDate(s.ends_at)}
                          </span>
                        </TD>
                        <TD className="hidden text-ase-text2 2xl:table-cell">
                          {plan?.price ? fmtMoney(plan.price, plan.currency) : <span className="text-ase-muted">{na}</span>}
                        </TD>
                        <TD className="text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<span className="text-xs">◉</span>}
                              onClick={() => {
                                setEditing(s)
                                editForm.reset({
                                  organization_uuid: '',
                                  plan_id: s.plan_id,
                                  provider: s.provider,
                                  provider_subscription_id: s.provider_subscription_id ?? '',
                                  status: s.status,
                                  starts_at: '',
                                  ends_at: '',
                                  trial_ends_at: '',
                                })
                              }}
                            >
                              {t('subscriptionsPage.actions.edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-ase-error/30 text-ase-text2 hover:text-ase-text"
                              onClick={() => setConfirmDelete(s)}
                            >
                              {t('subscriptionsPage.actions.cancel')}
                            </Button>
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

        <div id="subs-create-panel" className={cn(createFocus && 'ring-2 ring-ase-primary/40 rounded-[2rem]')}>
          <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md" interactive>
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.10),transparent_52%)]" />

            <div className="relative z-[1] text-sm font-semibold text-ase-text">{t('subscriptionsPage.create.title')}</div>
            <div className="relative z-[1] mt-1 text-sm text-ase-text2">{t('subscriptionsPage.create.subtitle')}</div>

            <div className="relative z-[1] mt-3 space-y-2">
              {orgsQuery.isLoading || plansQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : orgsQuery.isError || plansQuery.isError ? (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('subscriptionsPage.create.depsError')}</div>
              ) : null}
            </div>

            <form
              className="relative z-[1] mt-4 space-y-4"
              onSubmit={createForm.handleSubmit((values) =>
                createMutation.mutate({
                  organization_uuid: values.organization_uuid,
                  plan_id: values.plan_id,
                  provider: values.provider,
                  provider_subscription_id: values.provider_subscription_id ? values.provider_subscription_id : null,
                  status: values.status,
                  starts_at: toIsoFromDatetimeLocal(values.starts_at) ?? values.starts_at,
                  ends_at: toIsoFromDatetimeLocal(values.ends_at || '') ?? null,
                  trial_ends_at: toIsoFromDatetimeLocal(values.trial_ends_at || '') ?? null,
                }),
              )}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.organization')}</label>
                <Select {...createForm.register('organization_uuid')} disabled={orgsQuery.isLoading || orgItems.length === 0}>
                  <option value="" disabled>
                    {t('subscriptionsPage.create.selectOrg')}
                  </option>
                  {orgItems.map((o) => (
                    <option key={o.uuid} value={o.uuid}>
                      {o.name} ({(o as any).slug})
                    </option>
                  ))}
                </Select>
                {createForm.formState.errors.organization_uuid && (
                  <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.organization_uuid.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.plan')}</label>
                <Select {...createForm.register('plan_id', { setValueAs: (v) => Number(v) })} disabled={plansQuery.isLoading || planItems.length === 0}>
                  <option value="0" disabled>
                    {t('subscriptionsPage.create.selectPlan')}
                  </option>
                  {planItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </Select>
                {createForm.formState.errors.plan_id && <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.plan_id.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.provider')}</label>
                  <Select {...createForm.register('provider')}>
                    {providers.map((p) => (
                      <option key={p} value={p}>
                        {t(`subscriptionsPage.provider.${p}`)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.status')}</label>
                  <Select {...createForm.register('status')}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(`subscriptionsPage.status.${s}`)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.providerSubscriptionId')}</label>
                <Input placeholder={t('subscriptionsPage.create.placeholders.providerSubscriptionId') as string} {...createForm.register('provider_subscription_id')} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.startsAt')}</label>
                <Input type="datetime-local" {...createForm.register('starts_at')} />
                {createForm.formState.errors.starts_at && <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.starts_at.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.trialEndsAt')}</label>
                  <Input type="datetime-local" {...createForm.register('trial_ends_at')} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.endsAt')}</label>
                  <Input type="datetime-local" {...createForm.register('ends_at')} />
                </div>
              </div>

              <Card className="rounded-2xl border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm" interactive>
                <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('subscriptionsPage.summary.title')}</div>
                <div className="mt-3 grid gap-2 text-sm text-ase-text2">
                  <Row label={t('subscriptionsPage.summary.organization') as string} value={selectedOrg?.name ?? na} title={selectedOrg?.name ?? ''} />
                  <Row label={t('subscriptionsPage.summary.plan') as string} value={selectedPlan?.name ?? na} title={selectedPlan?.name ?? ''} />
                  <Row label={t('subscriptionsPage.summary.cycle') as string} value={selectedPlan ? billingCycleLabel(t, selectedPlan.billing_cycle) : na} />
                  <Row label={t('subscriptionsPage.summary.amount') as string} value={selectedPlan?.price ? (fmtMoney(selectedPlan.price, selectedPlan.currency) as string) : na} />
                </div>
              </Card>

              {createMutation.isError ? (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('subscriptionsPage.create.error')}</div>
              ) : null}

              <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
                {createMutation.isPending ? t('subscriptionsPage.create.creating') : t('subscriptionsPage.create.button')}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <section className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-ase-text">{t('subscriptionsPage.insights.title')}</div>
            <div className="mt-1 text-sm text-ase-text2">{t('subscriptionsPage.list.subtitle')}</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <InsightCard className="lg:col-span-4" title={t('subscriptionsPage.insights.byStatus') as string}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<SoftTooltip />} />
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                    {byStatus.map((e) => (
                      <Cell key={e.name} fill={(e as any).color} stroke="rgba(255,255,255,0.08)" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>

          <InsightCard className="lg:col-span-4" title={t('subscriptionsPage.insights.byPlan') as string}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPlan} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} hide />
                  <YAxis stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<SoftTooltip />} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="rgba(56,189,248,0.55)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>

          <InsightCard className="lg:col-span-4" title={t('subscriptionsPage.insights.revenue') as string}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="subrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(34,211,238,0.45)" />
                      <stop offset="100%" stopColor="rgba(34,211,238,0.0)" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.35)" tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<SoftTooltip />} />
                  <Area type="monotone" dataKey="v" stroke="rgba(34,211,238,0.9)" strokeWidth={2} fill="url(#subrev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </InsightCard>
        </div>
      </section>

      <Modal
        open={!!editing}
        title={editTitle}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('subscriptionsPage.edit.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  subscription_id: editing.id,
                  payload: {
                    organization_uuid: values.organization_uuid ? values.organization_uuid : null,
                    plan_id: values.plan_id ?? null,
                    provider: values.provider ?? null,
                    provider_subscription_id: values.provider_subscription_id ? values.provider_subscription_id : null,
                    status: values.status ?? null,
                    starts_at: values.starts_at ? toIsoFromDatetimeLocal(values.starts_at) : null,
                    ends_at: values.ends_at ? toIsoFromDatetimeLocal(values.ends_at) : null,
                    trial_ends_at: values.trial_ends_at ? toIsoFromDatetimeLocal(values.trial_ends_at) : null,
                  },
                })
              })}
            >
              {updateMutation.isPending ? t('subscriptionsPage.edit.saving') : t('subscriptionsPage.edit.save')}
            </Button>
          </div>
        }
      >
        <div className="mb-4 text-sm text-ase-text2">{t('subscriptionsPage.edit.subtitle')}</div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.plan')}</label>
            <Select {...editForm.register('plan_id', { setValueAs: (v) => Number(v) })}>
              {planItems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.provider')}</label>
              <Select {...editForm.register('provider')}>
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {t(`subscriptionsPage.provider.${p}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.status')}</label>
              <Select {...editForm.register('status')}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {t(`subscriptionsPage.status.${s}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.providerSubscriptionId')}</label>
            <Input {...editForm.register('provider_subscription_id')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.startsAt')}</label>
            <Input type="datetime-local" {...editForm.register('starts_at')} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.trialEndsAt')}</label>
              <Input type="datetime-local" {...editForm.register('trial_ends_at')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('subscriptionsPage.create.fields.endsAt')}</label>
              <Input type="datetime-local" {...editForm.register('ends_at')} />
            </div>
          </div>
          {updateMutation.isError ? (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('subscriptionsPage.edit.error')}</div>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title={t('subscriptionsPage.delete.title') as string}
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('subscriptionsPage.delete.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return
                deleteMutation.mutate(confirmDelete.id)
              }}
            >
              {deleteMutation.isPending ? t('subscriptionsPage.delete.deleting') : t('subscriptionsPage.delete.delete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-ase-text">
            {String(t('subscriptionsPage.delete.body')).replace('{{id}}', String(confirmDelete?.id ?? ''))}
          </div>
          <div className="text-sm text-ase-text2">{t('subscriptionsPage.delete.note')}</div>
          {deleteMutation.isError ? (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('subscriptionsPage.delete.error')}</div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

function Row({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ase-muted">{label}</span>
      <span className="truncate font-semibold text-ase-text" title={title}>
        {value}
      </span>
    </div>
  )
}

function toIsoFromDatetimeLocal(v: string) {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function providerBadge(t: (k: string) => unknown, p: SubscriptionProvider) {
  const label = t(`subscriptionsPage.provider.${p}`) as string
  return <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2">{label}</span>
}

function statusBadge(t: (k: string) => unknown, s: SubscriptionStatus) {
  const label = t(`subscriptionsPage.status.${s}`) as string
  const variant = s === 'active' ? 'success' : s === 'trialing' ? 'info' : s === 'past_due' ? 'warning' : 'error'
  return <Badge variant={variant}>{label}</Badge>
}

function billingCycleLabel(t: (k: string) => unknown, cycle: string) {
  if (cycle === 'monthly') return t('plansPage.badges.monthly') as string
  if (cycle === 'yearly') return t('plansPage.badges.yearly') as string
  if (cycle === 'one_time') return t('plansPage.badges.oneTime') as string
  return cycle
}

function orgAvatar(id: number) {
  const n = Math.abs(id) % 26
  const a = String.fromCharCode(65 + (n % 26))
  const b = String.fromCharCode(65 + ((n + 9) % 26))
  return `${a}${b}`
}

function fmtMoney(price: string | null, currency: string) {
  if (!price) return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} ${currency}`
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

function InsightCard({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <Card
      interactive
      className={cn(
        'relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-5 backdrop-blur-md',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_14px_55px_rgba(0,0,0,0.55)]',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 hover:opacity-100">
        <div className="absolute -inset-16 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.12),transparent_55%)]" />
      </div>
      <div className="relative z-[1] text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</div>
      <div className="relative z-[1] mt-4">{children}</div>
    </Card>
  )
}

function SoftTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const name = payload[0]?.name ?? label
  const value = payload[0]?.value
  return (
    <div className="rounded-xl border border-white/[0.12] bg-ase-bg2/90 px-3 py-2 text-xs text-ase-text2 shadow-[0_18px_50px_rgba(0,0,0,0.65)] backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{String(name)}</div>
      <div className="mt-1 text-sm font-extrabold text-ase-text">{String(value)}</div>
    </div>
  )
}

function StatCard({ label, value, icon, horizontal }: { label: string; value: string; icon: string; horizontal?: boolean }) {
  return (
    <Card className="relative overflow-hidden rounded-[1.5rem] border-white/[0.08] bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm" interactive>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300/80 to-cyan-300/60" />
      <div className={cn('flex items-start justify-between gap-3', horizontal && 'items-center')}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-sm text-emerald-100">
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

