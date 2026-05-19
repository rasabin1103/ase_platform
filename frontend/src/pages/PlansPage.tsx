import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createPlan, deletePlan, listPlans, updatePlan } from '../api/plans.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import type { BillingCycle, Plan, PlanFeatureCreateRequest } from '../types/plan.types'
import { useI18n } from '../i18n'
import { cn } from '../components/ui/cn'
import { Switch } from '../components/ui/Switch'
import { Textarea } from '../components/ui/Textarea'

type CreateValues = {
  code: string
  name: string
  short_description?: string | ''
  description?: string | ''
  billing_cycle: BillingCycle
  price?: string | ''
  currency: string
  display_order?: string | ''
  is_recommended: boolean
  is_active: boolean
  cta_label?: string | ''
  features?: Array<{ text: string }>
}

type EditValues = {
  code?: string | ''
  name?: string | ''
  short_description?: string | ''
  description?: string | ''
  billing_cycle?: BillingCycle
  price?: string | ''
  currency?: string | ''
  display_order?: string | ''
  is_recommended?: boolean
  is_active?: boolean
  cta_label?: string | ''
}

function fmtMoney(price: string | null, currency: string) {
  if (!price) return null
  const n = Number(price)
  if (Number.isNaN(n)) return `${price} ${currency}`
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n)
}

export function PlansPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const na = t('plansPage.common.na') as string
  const [editing, setEditing] = useState<Plan | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null)
  const [createFocus, setCreateFocus] = useState<boolean>(false)
  const [featureDraft, setFeatureDraft] = useState<string>('')

  const billingCycles = useMemo<Array<{ value: BillingCycle; label: string }>>(
    () => [
      { value: 'monthly', label: t('plansPage.badges.monthly') as string },
      { value: 'yearly', label: t('plansPage.badges.yearly') as string },
      { value: 'one_time', label: t('plansPage.badges.oneTime') as string },
    ],
    [t],
  )

  const createSchema = useMemo(
    () =>
      z.object({
        code: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        short_description: z.string().max(240).optional().or(z.literal('')),
        description: z.string().max(4000).optional().or(z.literal('')),
        billing_cycle: z.enum(['monthly', 'yearly', 'one_time']),
        price: z
          .string()
          .optional()
          .or(z.literal(''))
          .refine((v) => !v || !Number.isNaN(Number(v)), t('plansPage.errors.priceInvalid') as string),
        currency: z.string().length(3, t('plansPage.errors.currencyIso') as string),
        display_order: z
          .string()
          .optional()
          .or(z.literal(''))
          .refine((v) => !v || !Number.isNaN(Number(v)), 'display_order must be a number'),
        is_recommended: z.boolean(),
        is_active: z.boolean(),
        cta_label: z.string().max(80).optional().or(z.literal('')),
      }),
    [t],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        code: z.string().min(1).max(100).optional().or(z.literal('')),
        name: z.string().min(1).max(200).optional().or(z.literal('')),
        short_description: z.string().max(240).optional().or(z.literal('')),
        description: z.string().max(4000).optional().or(z.literal('')),
        billing_cycle: z.enum(['monthly', 'yearly', 'one_time']).optional(),
        price: z
          .string()
          .optional()
          .or(z.literal(''))
          .refine((v) => !v || !Number.isNaN(Number(v)), t('plansPage.errors.priceInvalid') as string),
        currency: z.string().length(3).optional().or(z.literal('')),
        display_order: z
          .string()
          .optional()
          .or(z.literal(''))
          .refine((v) => !v || !Number.isNaN(Number(v)), 'display_order must be a number'),
        is_recommended: z.boolean().optional(),
        is_active: z.boolean().optional(),
        cta_label: z.string().max(80).optional().or(z.literal('')),
      }),
    [t],
  )

  const plansQuery = useQuery({
    queryKey: ['plans', { limit: 50, offset: 0 }],
    queryFn: () => listPlans({ limit: 50, offset: 0 }),
  })

  const items = plansQuery.data?.items ?? []
  const activeCount = useMemo(() => items.filter((p) => p.is_active).length, [items])
  const recommendedPlan = useMemo(() => items.find((p) => p.is_recommended) ?? null, [items])
  const cycles = useMemo(() => Array.from(new Set(items.map((p) => p.billing_cycle))).length, [items])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      name: '',
      short_description: '',
      description: '',
      billing_cycle: 'monthly',
      price: '',
      currency: 'EUR',
      display_order: '',
      is_recommended: false,
      is_active: true,
      cta_label: '',
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: '',
      name: '',
      short_description: '',
      description: '',
      billing_cycle: 'monthly',
      price: '',
      currency: 'EUR',
      display_order: '',
      is_recommended: false,
      is_active: true,
      cta_label: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: async () => {
      createForm.reset({
        code: '',
        name: '',
        short_description: '',
        description: '',
        billing_cycle: 'monthly',
        price: '',
        currency: 'EUR',
        display_order: '',
        is_recommended: false,
        is_active: true,
        cta_label: '',
      })
      setFeatureDraft('')
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ plan_id, payload }: { plan_id: number; payload: any }) => updatePlan(plan_id, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (plan_id: number) => deletePlan(plan_id),
    onSuccess: async () => {
      setConfirmDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })

  const editTitle = useMemo(
    () => (editing ? `${t('plansPage.edit.title')} — ${editing.code}` : (t('plansPage.edit.title') as string)),
    [editing, t],
  )

  const previewPlans = useMemo(() => {
    const sorted = [...items].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
    return sorted.slice(0, 4)
  }, [items])

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(245,158,11,0.18),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(34,211,238,0.13),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="warning" className="mb-5 border-amber-300/30 bg-amber-300/10 text-amber-100">
              {t('plansPage.premium.badge')}
            </Badge>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">{t('plansPage.title')}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('plansPage.subtitle')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
                {t('plansPage.premium.context')}
              </span>
              <Button
                size="sm"
                onClick={() => document.getElementById('plans-create-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                leftIcon={<span className="text-xs">+</span>}
              >
                {t('plansPage.premium.create')}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(520px,46%)] lg:grid-cols-1">
            <StatCard label={t('plansPage.stats.total.label') as string} value={String(plansQuery.data?.total ?? items.length)} icon="◈" horizontal />
            <StatCard label={t('plansPage.stats.active.label') as string} value={String(activeCount)} icon="✓" horizontal />
            <StatCard
              label={t('plansPage.stats.recommended.label') as string}
              value={recommendedPlan?.name ?? na}
              icon="★"
              horizontal
            />
            <StatCard label={t('plansPage.stats.billingCycles.label') as string} value={String(cycles)} icon="○" horizontal />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-ase-text">{t('plansPage.preview.title')}</div>
            <div className="mt-1 text-sm text-ase-text2">{t('plansPage.preview.subtitle')}</div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {previewPlans.length === 0 ? (
            <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-8 text-center backdrop-blur-md" interactive>
              <div className="text-sm font-semibold text-ase-text">{t('plansPage.empty.title')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('plansPage.empty.subtitle')}</div>
            </Card>
          ) : (
            previewPlans.map((p) => <PricingCard key={p.id} plan={p} />)
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md lg:col-span-2" interactive>
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_52%)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ase-text">{t('plansPage.list.title')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('plansPage.list.subtitle')}</div>
            </div>
            <div className="text-xs text-ase-muted">
              {plansQuery.isFetching
                ? (t('plansPage.list.meta.updating') as string)
                : String(t('plansPage.list.meta.total')).replace('{{count}}', String(plansQuery.data?.total ?? items.length))}
            </div>
          </div>

          <div className="mt-4">
            {plansQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-11/12" />
                <Skeleton className="h-10 w-10/12" />
              </div>
            ) : plansQuery.isError ? (
              <EmptyState title={t('plansPage.errors.loadTitle') as string} description={t('plansPage.errors.loadSubtitle') as string} />
            ) : items.length === 0 ? (
              <EmptyState
                title={t('plansPage.empty.title') as string}
                description={t('plansPage.empty.subtitle') as string}
                icon={<span className="text-sm">◈</span>}
                actionLabel={t('plansPage.empty.cta') as string}
                onAction={() => {
                  const el = document.getElementById('plans-create-panel')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setCreateFocus(true)
                  setTimeout(() => setCreateFocus(false), 600)
                }}
              />
            ) : (
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[44%]">{t('plansPage.list.columns.plan')}</TH>
                    <TH className="w-[14%]">{t('plansPage.list.columns.billing')}</TH>
                    <TH className="w-[16%]">{t('plansPage.list.columns.price')}</TH>
                    <TH className="w-[14%]">{t('plansPage.list.columns.status')}</TH>
                    <TH className="hidden w-[12%] xl:table-cell">{t('plansPage.list.columns.recommended')}</TH>
                    <TH className="w-[22%] text-right">{t('plansPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((p) => (
                    <TR key={p.id}>
                      <TD className="font-medium text-ase-text">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-ase-text" title={p.name}>
                              {p.name}
                            </div>
                            {p.is_recommended ? (
                              <span className="shrink-0 rounded-full border border-ase-primary/30 bg-ase-primary/10 px-2 py-0.5 text-[11px] font-semibold text-ase-primary">
                                {t('plansPage.badges.recommended')}
                              </span>
                            ) : null}
                          </div>
                          {p.short_description || p.description ? (
                            <div className="mt-1 line-clamp-1 text-xs text-ase-text2" title={p.short_description ?? p.description ?? ''}>
                              {p.short_description ?? p.description}
                            </div>
                          ) : null}
                        </div>
                      </TD>
                      <TD className="text-ase-text2">{billingBadge(t, p.billing_cycle)}</TD>
                      <TD className="text-ase-text2">
                        {fmtMoney(p.price, p.currency) ?? (
                          <span className="text-ase-muted">{t('plansPage.price.custom')}</span>
                        )}
                      </TD>
                      <TD>{p.is_active ? <Badge variant="success">{t('plansPage.badges.active')}</Badge> : <Badge variant="warning">{t('plansPage.badges.inactive')}</Badge>}</TD>
                      <TD className="hidden xl:table-cell">
                        {p.is_recommended ? <Badge variant="info">{t('plansPage.badges.recommended')}</Badge> : <span className="text-ase-muted">{na}</span>}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<span className="text-xs">✎</span>}
                            onClick={() => {
                              setEditing(p)
                              editForm.reset({
                                code: p.code,
                                name: p.name,
                                short_description: p.short_description ?? '',
                                description: p.description ?? '',
                                billing_cycle: p.billing_cycle as any,
                                price: p.price ?? '',
                                currency: p.currency,
                                display_order: typeof p.display_order === 'number' ? String(p.display_order) : '',
                                is_recommended: Boolean(p.is_recommended),
                                is_active: p.is_active,
                                cta_label: p.cta_label ?? '',
                              })
                            }}
                          >
                            {t('plansPage.actions.edit')}
                          </Button>
                          <Button size="sm" variant="outline" className="border-ase-error/30 text-ase-text2 hover:text-ase-text" onClick={() => setConfirmDelete(p)}>
                            {t('plansPage.actions.delete')}
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </Card>

        <div id="plans-create-panel" className={cn(createFocus && 'ring-2 ring-ase-primary/40 rounded-[2rem]')}>
          <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md" interactive>
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.10),transparent_52%)]" />
            <div className="relative z-[1] text-sm font-semibold text-ase-text">{t('plansPage.create.title')}</div>
            <div className="relative z-[1] mt-1 text-sm text-ase-text2">{t('plansPage.create.subtitle')}</div>

            <form
              className="relative z-[1] mt-4 space-y-4"
              onSubmit={createForm.handleSubmit((values) =>
                createMutation.mutate({
                  code: values.code,
                  name: values.name,
                  billing_cycle: values.billing_cycle,
                  price: values.price ? Number(values.price) : null,
                  currency: values.currency.toUpperCase(),
                  is_active: values.is_active,
                  is_recommended: values.is_recommended,
                  short_description: values.short_description ? values.short_description : null,
                  description: values.description ? values.description : null,
                  display_order: values.display_order ? Number(values.display_order) : undefined,
                  cta_label: values.cta_label ? values.cta_label : null,
                  features: values.features ? (values.features as unknown as PlanFeatureCreateRequest[]) : undefined,
                }),
              )}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.code')}</label>
                <Input placeholder={t('plansPage.create.placeholders.code') as string} {...createForm.register('code')} />
                {createForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.name')}</label>
                <Input placeholder={t('plansPage.create.placeholders.name') as string} {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.shortDescription')}</label>
                <Input placeholder={t('plansPage.create.placeholders.shortDescription') as string} {...createForm.register('short_description')} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.description')}</label>
                <Textarea placeholder={t('plansPage.create.placeholders.description') as string} {...createForm.register('description')} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.billingCycle')}</label>
                <Select {...createForm.register('billing_cycle')}>
                  {billingCycles.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.price')}</label>
                  <Input inputMode="decimal" placeholder={t('plansPage.create.placeholders.price') as string} {...createForm.register('price')} />
                  {createForm.formState.errors.price && (
                    <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.price.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.currency')}</label>
                  <Input placeholder={t('plansPage.create.placeholders.currency') as string} {...createForm.register('currency')} />
                  {createForm.formState.errors.currency && (
                    <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.currency.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.displayOrder')}</label>
                  <Input inputMode="numeric" placeholder="0" {...createForm.register('display_order')} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.ctaLabel')}</label>
                  <Input placeholder={t('plansPage.create.placeholders.ctaLabel') as string} {...createForm.register('cta_label')} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-ase-muted">{t('plansPage.create.fields.isActive')}</div>
                  <Switch checked={Boolean(createForm.watch('is_active'))} onCheckedChange={(v) => createForm.setValue('is_active', v)} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-ase-muted">{t('plansPage.create.fields.isRecommended')}</div>
                  <Switch checked={Boolean(createForm.watch('is_recommended'))} onCheckedChange={(v) => createForm.setValue('is_recommended', v)} />
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-ase-muted">{t('plansPage.create.fields.features')}</div>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('plansPage.create.placeholders.featureInput') as string}
                    value={featureDraft}
                    onChange={(e) => setFeatureDraft(String(e.target.value ?? ''))}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const v = featureDraft.trim()
                      if (!v) return
                      const prev = (createForm.getValues('features') as any) ?? []
                      createForm.setValue('features' as any, [...prev, { text: v }])
                      setFeatureDraft('')
                    }}
                  >
                    {t('plansPage.create.helpers.addFeature')}
                  </Button>
                </div>
                <div className="mt-3 space-y-2">
                  {(((createForm.getValues('features') as any) ?? []) as Array<{ text: string }>).map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ase-text2">
                      <span className="truncate">{f.text}</span>
                      <button
                        type="button"
                        className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] font-semibold text-ase-text2 hover:bg-white/[0.05]"
                        onClick={() => {
                          const prev = (((createForm.getValues('features') as any) ?? []) as Array<{ text: string }>).slice()
                          prev.splice(idx, 1)
                          createForm.setValue('features' as any, prev)
                        }}
                      >
                        {t('plansPage.create.helpers.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {createMutation.isError && (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                  {t('plansPage.create.error')}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
                {createMutation.isPending ? t('plansPage.create.creating') : t('plansPage.create.button')}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Modal
        open={!!editing}
        title={editTitle}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('plansPage.edit.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  plan_id: editing.id,
                  payload: {
                    code: values.code ? values.code : null,
                    name: values.name ? values.name : null,
                    short_description: values.short_description ? values.short_description : null,
                    description: values.description ? values.description : null,
                    billing_cycle: values.billing_cycle ?? null,
                    price: values.price ? Number(values.price) : null,
                    currency: values.currency ? values.currency.toUpperCase() : null,
                    display_order: values.display_order ? Number(values.display_order) : null,
                    is_recommended: typeof values.is_recommended === 'boolean' ? values.is_recommended : null,
                    is_active: typeof values.is_active === 'boolean' ? values.is_active : null,
                    cta_label: values.cta_label ? values.cta_label : null,
                  },
                })
              })}
            >
              {updateMutation.isPending ? t('plansPage.edit.saving') : t('plansPage.edit.save')}
            </Button>
          </div>
        }
      >
        <div className="mb-4 text-sm text-ase-text2">{t('plansPage.edit.subtitle')}</div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.code')}</label>
              <Input {...editForm.register('code')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.name')}</label>
              <Input {...editForm.register('name')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.shortDescription')}</label>
            <Input {...editForm.register('short_description')} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.description')}</label>
            <Textarea {...editForm.register('description')} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.billingCycle')}</label>
            <Select {...editForm.register('billing_cycle')}>
              {billingCycles.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.price')}</label>
              <Input {...editForm.register('price')} />
              {editForm.formState.errors.price && (
                <p className="mt-1 text-sm text-ase-error">{editForm.formState.errors.price.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.currency')}</label>
              <Input {...editForm.register('currency')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.displayOrder')}</label>
              <Input {...editForm.register('display_order')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('plansPage.create.fields.ctaLabel')}</label>
              <Input {...editForm.register('cta_label')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-medium text-ase-muted">{t('plansPage.create.fields.isActive')}</div>
              <Switch
                checked={Boolean(editForm.watch('is_active'))}
                onCheckedChange={(v) => editForm.setValue('is_active', v)}
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-ase-muted">{t('plansPage.create.fields.isRecommended')}</div>
              <Switch
                checked={Boolean(editForm.watch('is_recommended'))}
                onCheckedChange={(v) => editForm.setValue('is_recommended', v)}
              />
            </div>
          </div>

          {updateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('plansPage.edit.error')}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title={t('plansPage.delete.title') as string}
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('plansPage.delete.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return
                deleteMutation.mutate(confirmDelete.id)
              }}
            >
              {deleteMutation.isPending ? t('plansPage.delete.deleting') : t('plansPage.delete.delete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-ase-text">
            {String(t('plansPage.delete.body')).replace('{{code}}', String(confirmDelete?.code ?? ''))}
          </div>
          <div className="text-sm text-ase-text2">{t('plansPage.delete.note')}</div>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('plansPage.delete.error')}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function billingBadge(t: (k: string) => unknown, cycle: BillingCycle) {
  const label =
    cycle === 'monthly'
      ? (t('plansPage.badges.monthly') as string)
      : cycle === 'yearly'
        ? (t('plansPage.badges.yearly') as string)
        : (t('plansPage.badges.oneTime') as string)
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-ase-text2">
      {label}
    </span>
  )
}

function PricingCard({ plan }: { plan: Plan }) {
  const { t } = useI18n()
  const price = fmtMoney(plan.price, plan.currency)
  return (
    <Card
      interactive
      className={cn(
        'relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md',
        plan.is_recommended && 'border-ase-primary/25 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_18px_70px_rgba(0,0,0,0.55)]',
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold tracking-tight text-ase-text" title={plan.name}>
            {plan.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {billingBadge(t, plan.billing_cycle)}
            {plan.is_recommended ? <Badge variant="info">{t('plansPage.badges.recommended')}</Badge> : null}
            {plan.is_active ? <Badge variant="success">{t('plansPage.badges.active')}</Badge> : <Badge variant="warning">{t('plansPage.badges.inactive')}</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold tracking-tight text-ase-text">{price ?? (t('plansPage.price.custom') as string)}</div>
          <div className="mt-1 text-xs text-ase-muted">{plan.currency}</div>
        </div>
      </div>
      {plan.short_description || plan.description ? (
        <div className="mt-4 line-clamp-2 text-sm text-ase-text2" title={plan.short_description ?? plan.description ?? ''}>
          {plan.short_description ?? plan.description}
        </div>
      ) : null}
      {(plan.features?.length ?? 0) > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-ase-text2">
          {(plan.features ?? []).slice(0, 4).map((f) => (
            <li key={f.id} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ase-accent/80" />
              <span className="line-clamp-1" title={f.text}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5">
        <Button className="w-full" variant={plan.is_recommended ? 'primary' : 'secondary'}>
          {plan.cta_label || (plan.is_recommended ? (t('plansPage.badges.recommended') as string) : plan.name)}
        </Button>
      </div>
    </Card>
  )
}

function StatCard({ label, value, icon, horizontal }: { label: string; value: string; icon: string; horizontal?: boolean }) {
  return (
    <Card className="relative overflow-hidden rounded-[1.5rem] border-white/[0.08] bg-white/[0.045] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm" interactive>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-300/80 to-cyan-300/60" />
      <div className={cn('flex items-start justify-between gap-3', horizontal && 'items-center')}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-sm text-amber-100">
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

