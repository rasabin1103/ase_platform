import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { createService, deleteService, listServicesManage, updateService } from '../../api/services.api'
import type { Service, ServiceCategory, ServiceKind, ServicePriceType } from '../../types/service.types'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { Table, TBody, TD, THead, TH, TR } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { cn } from '../../components/ui/cn'
import { PremiumMetricCard } from '../../components/admin/premium/PremiumAdminUi'
import { PricingEngineSection, type DimensionSelection } from '../../components/admin/premium/PricingEngineSection'
import { useI18n } from '../../i18n'

const CATEGORIES: ServiceCategory[] = [
  'platform_engineering',
  'qa_automation',
  'training',
  'digital_products',
  'consulting',
  'ai_automation',
  'frameworks',
]

const KINDS: ServiceKind[] = ['service', 'product', 'framework', 'course', 'book']

const PRICE_TYPES: ServicePriceType[] = ['free', 'fixed', 'subscription', 'custom']

type FormState = {
  code: string
  name: string
  slug: string
  short_description: string
  description: string
  category: ServiceCategory
  service_type: ServiceKind
  price_type: ServicePriceType
  price: string
  is_featured: boolean
  is_active: boolean
  display_order: string
  icon: string
  hero_title: string
  hero_subtitle: string
  dimension_selections: DimensionSelection[]
  estimated_hours: string
}

const EMPTY_FORM: FormState = {
  code: '',
  name: '',
  slug: '',
  short_description: '',
  description: '',
  category: 'platform_engineering',
  service_type: 'service',
  price_type: 'custom',
  price: '',
  is_featured: false,
  is_active: true,
  display_order: '',
  icon: '',
  hero_title: '',
  hero_subtitle: '',
  dimension_selections: [],
  estimated_hours: '',
}

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formToPayload(values: FormState, extra: { features: string[] }) {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    slug: values.slug.trim(),
    short_description: values.short_description.trim() || null,
    description: values.description.trim() || null,
    category: values.category,
    service_type: values.service_type,
    price_type: values.price_type,
    price: values.price.trim() ? Number(values.price) : null,
    is_featured: values.is_featured,
    is_active: values.is_active,
    display_order: values.display_order ? Number(values.display_order) : 0,
    icon: values.icon.trim() || null,
    hero_title: values.hero_title.trim() || null,
    hero_subtitle: values.hero_subtitle.trim() || null,
    features: extra.features.length > 0 ? extra.features.map((text, i) => ({ text, display_order: i })) : undefined,
    dimension_selections: values.dimension_selections,
    estimated_hours: values.estimated_hours.trim() ? Number(values.estimated_hours) : null,
  }
}

export function ServicesAdminPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM)
  const [createFeatures, setCreateFeatures] = useState<string[]>([])
  const [featureDraft, setFeatureDraft] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  const [editing, setEditing] = useState<Service | null>(null)
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null)

  const servicesQuery = useQuery({
    queryKey: ['services-manage'],
    queryFn: () => listServicesManage({ limit: 200, offset: 0 }),
  })

  const items = useMemo(() => servicesQuery.data?.items ?? [], [servicesQuery.data])

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((s) => {
      if (categoryFilter && s.category !== categoryFilter) return false
      if (statusFilter === 'active' && !s.is_active) return false
      if (statusFilter === 'inactive' && s.is_active) return false
      if (q && !`${s.name} ${s.code} ${s.slug}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [categoryFilter, items, search, statusFilter])

  const activeCount = useMemo(() => items.filter((s) => s.is_active).length, [items])
  const featuredCount = useMemo(() => items.filter((s) => s.is_featured).length, [items])
  const categoriesUsed = useMemo(() => new Set(items.map((s) => s.category)).size, [items])

  const createMutation = useMutation({
    mutationFn: () => createService(formToPayload(createForm, { features: createFeatures })),
    onSuccess: async () => {
      setCreateForm(EMPTY_FORM)
      setCreateFeatures([])
      setFeatureDraft('')
      setSlugTouched(false)
      await queryClient.invalidateQueries({ queryKey: ['services-manage'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ uuid, payload }: { uuid: string; payload: ReturnType<typeof formToPayload> }) =>
      updateService(uuid, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['services-manage'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteService(uuid),
    onSuccess: async () => {
      setConfirmDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['services-manage'] })
    },
  })

  function openEdit(service: Service) {
    setEditing(service)
    setEditForm({
      code: service.code,
      name: service.name,
      slug: service.slug,
      short_description: service.short_description ?? '',
      description: service.description ?? '',
      category: service.category,
      service_type: service.service_type,
      price_type: service.price_type,
      price: service.price != null ? String(service.price) : '',
      is_featured: service.is_featured,
      is_active: service.is_active,
      display_order: String(service.display_order ?? 0),
      icon: service.icon ?? '',
      hero_title: service.hero_title ?? '',
      hero_subtitle: service.hero_subtitle ?? '',
      dimension_selections: service.dimension_selections ?? [],
      estimated_hours: service.estimated_hours != null ? String(service.estimated_hours) : '',
    })
  }

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(167,139,250,0.13),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8">
        <div className="relative z-[1]">
          <Badge variant="info" className="mb-5">
            {t('servicesAdmin.badge')}
          </Badge>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">
            {t('servicesAdmin.title')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">
            {t('servicesAdmin.subtitle')}
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PremiumMetricCard
          label={t('servicesAdmin.stats.total') as string}
          value={servicesQuery.data?.total ?? items.length}
          icon="⚙"
          accent="from-ase-brand to-ase-brand"
        />
        <PremiumMetricCard
          label={t('servicesAdmin.stats.active') as string}
          value={activeCount}
          icon="✓"
          accent="from-ase-brand to-ase-brand"
        />
        <PremiumMetricCard
          label={t('servicesAdmin.stats.featured') as string}
          value={featuredCount}
          icon="★"
          accent="from-ase-brand to-ase-brand"
        />
        <PremiumMetricCard
          label={t('servicesAdmin.stats.categories') as string}
          value={categoriesUsed}
          icon="◆"
          accent="from-ase-brand to-ase-brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md lg:col-span-2" interactive>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="svc-filter-search" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.filters.search')}</label>
              <Input id="svc-filter-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('servicesAdmin.filters.searchPlaceholder') as string} />
            </div>
            <div>
              <label htmlFor="svc-filter-category" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.filters.category')}</label>
              <Select id="svc-filter-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">{t('servicesAdmin.filters.all')}</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`servicesAdmin.categories.${c}`) as string}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="svc-filter-status" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.filters.status')}</label>
              <Select id="svc-filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">{t('servicesAdmin.filters.all')}</option>
                <option value="active">{t('servicesAdmin.badges.active')}</option>
                <option value="inactive">{t('servicesAdmin.badges.inactive')}</option>
              </Select>
            </div>
          </div>

          <div className="mt-5">
            {servicesQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-11/12" />
                <Skeleton className="h-10 w-10/12" />
              </div>
            ) : servicesQuery.isError ? (
              <EmptyState title={t('servicesAdmin.errors.loadTitle') as string} description={t('servicesAdmin.errors.loadSubtitle') as string} />
            ) : filteredItems.length === 0 ? (
              <EmptyState title={t('servicesAdmin.empty.title') as string} description={t('servicesAdmin.empty.subtitle') as string} />
            ) : (
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[36%]">{t('servicesAdmin.list.columns.service')}</TH>
                    <TH className="w-[16%]">{t('servicesAdmin.list.columns.category')}</TH>
                    <TH className="w-[14%]">{t('servicesAdmin.list.columns.type')}</TH>
                    <TH className="w-[12%]">{t('servicesAdmin.list.columns.status')}</TH>
                    <TH className="w-[22%] text-right">{t('servicesAdmin.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredItems.map((s) => (
                    <TR key={s.uuid}>
                      <TD>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-ase-text" title={s.name}>
                              {s.name}
                            </span>
                            {s.is_featured ? <Badge variant="info">{t('servicesAdmin.badges.featured')}</Badge> : null}
                          </div>
                          <div className="mt-1 truncate text-xs text-ase-muted">{s.code}</div>
                        </div>
                      </TD>
                      <TD className="text-ase-text2">{t(`servicesAdmin.categories.${s.category}`) as string}</TD>
                      <TD className="text-ase-text2">{t(`servicesAdmin.kinds.${s.service_type}`) as string}</TD>
                      <TD>
                        {s.is_active ? (
                          <Badge variant="success">{t('servicesAdmin.badges.active')}</Badge>
                        ) : (
                          <Badge variant="warning">{t('servicesAdmin.badges.inactive')}</Badge>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>
                            {t('servicesAdmin.actions.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-ase-error/30 text-ase-text2 hover:text-ase-text"
                            onClick={() => setConfirmDelete(s)}
                          >
                            {t('servicesAdmin.actions.deactivate')}
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

        <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md" interactive>
          <div className="text-sm font-semibold text-ase-text">{t('servicesAdmin.create.title')}</div>
          <div className="mt-1 text-sm text-ase-text2">{t('servicesAdmin.create.subtitle')}</div>

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
            }}
          >
            <div>
              <label htmlFor="svc-create-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.name')}</label>
              <Input
                id="svc-create-name"
                value={createForm.name}
                onChange={(e) => {
                  const name = e.target.value
                  setCreateForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }))
                }}
                placeholder={t('servicesAdmin.placeholders.name') as string}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="svc-create-code" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.code')}</label>
                <Input
                  id="svc-create-code"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder={t('servicesAdmin.placeholders.code') as string}
                />
              </div>
              <div>
                <label htmlFor="svc-create-slug" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.slug')}</label>
                <Input
                  id="svc-create-slug"
                  value={createForm.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setCreateForm((f) => ({ ...f, slug: e.target.value }))
                  }}
                  placeholder={t('servicesAdmin.placeholders.slug') as string}
                />
              </div>
            </div>
            <div>
              <label htmlFor="svc-create-short-description" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.shortDescription')}</label>
              <Input
                id="svc-create-short-description"
                value={createForm.short_description}
                onChange={(e) => setCreateForm((f) => ({ ...f, short_description: e.target.value }))}
                placeholder={t('servicesAdmin.placeholders.shortDescription') as string}
              />
            </div>
            <div>
              <label htmlFor="svc-create-description" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.description')}</label>
              <Textarea
                id="svc-create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={t('servicesAdmin.placeholders.description') as string}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="svc-create-category" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.category')}</label>
                <Select id="svc-create-category" value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`servicesAdmin.categories.${c}`) as string}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="svc-create-type" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.type')}</label>
                <Select id="svc-create-type" value={createForm.service_type} onChange={(e) => setCreateForm((f) => ({ ...f, service_type: e.target.value as ServiceKind }))}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`servicesAdmin.kinds.${k}`) as string}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="svc-create-price-type" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.priceType')}</label>
                <Select id="svc-create-price-type" value={createForm.price_type} onChange={(e) => setCreateForm((f) => ({ ...f, price_type: e.target.value as ServicePriceType }))}>
                  {PRICE_TYPES.map((p) => (
                    <option key={p} value={p}>
                      {t(`servicesAdmin.priceTypes.${p}`) as string}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="svc-create-display-order" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.displayOrder')}</label>
                <Input
                  id="svc-create-display-order"
                  inputMode="numeric"
                  value={createForm.display_order}
                  onChange={(e) => setCreateForm((f) => ({ ...f, display_order: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label htmlFor="svc-create-price" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.price')}</label>
              <Input
                id="svc-create-price"
                type="number"
                min={0}
                step="0.01"
                value={createForm.price}
                onChange={(e) => setCreateForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <PricingEngineSection
              pillarCode="service"
              dimensionSelections={createForm.dimension_selections}
              onDimensionSelectionsChange={(next) => setCreateForm((f) => ({ ...f, dimension_selections: next }))}
              quantity={createForm.estimated_hours.trim() ? Number(createForm.estimated_hours) : null}
              onQuantityChange={(n) => setCreateForm((f) => ({ ...f, estimated_hours: n != null ? String(n) : '' }))}
              onUseRecommended={(price) => setCreateForm((f) => ({ ...f, price: String(price) }))}
            />
            <div>
              <label htmlFor="svc-create-icon" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.icon')}</label>
              <Input
                id="svc-create-icon"
                value={createForm.icon}
                onChange={(e) => setCreateForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder={t('servicesAdmin.placeholders.icon') as string}
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.features')}</div>
              <div className="flex gap-2">
                <Input
                  value={featureDraft}
                  onChange={(e) => setFeatureDraft(e.target.value)}
                  placeholder={t('servicesAdmin.placeholders.featureInput') as string}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const v = featureDraft.trim()
                    if (!v) return
                    setCreateFeatures((prev) => [...prev, v])
                    setFeatureDraft('')
                  }}
                >
                  {t('servicesAdmin.actions.addFeature')}
                </Button>
              </div>
              {createFeatures.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {createFeatures.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ase-text2">
                      <span className="truncate">{f}</span>
                      <button
                        type="button"
                        className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-1 text-[11px] font-semibold text-ase-text2 hover:bg-white/[0.05]"
                        onClick={() => setCreateFeatures((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        {t('servicesAdmin.actions.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.isActive')}</div>
                <Switch checked={createForm.is_active} onCheckedChange={(v) => setCreateForm((f) => ({ ...f, is_active: v }))} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.isFeatured')}</div>
                <Switch checked={createForm.is_featured} onCheckedChange={(v) => setCreateForm((f) => ({ ...f, is_featured: v }))} />
              </div>
            </div>

            {createMutation.isError && (
              <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                {t('servicesAdmin.create.error')}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={createMutation.isPending || !createForm.name || !createForm.code || !createForm.slug}>
              {createMutation.isPending ? t('servicesAdmin.create.creating') : t('servicesAdmin.create.button')}
            </Button>
          </form>
        </Card>
      </div>

      <Modal
        open={!!editing}
        title={editing ? `${t('servicesAdmin.edit.title')} — ${editing.name}` : (t('servicesAdmin.edit.title') as string)}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={() => {
                if (!editing) return
                updateMutation.mutate({ uuid: editing.uuid, payload: formToPayload(editForm, { features: [] }) })
              }}
            >
              {updateMutation.isPending ? t('servicesAdmin.edit.saving') : t('servicesAdmin.edit.save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-edit-code" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.code')}</label>
              <Input id="svc-edit-code" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="svc-edit-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.name')}</label>
              <Input id="svc-edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="svc-edit-slug" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.slug')}</label>
            <Input id="svc-edit-slug" value={editForm.slug} onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="svc-edit-short-description" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.shortDescription')}</label>
            <Input id="svc-edit-short-description" value={editForm.short_description} onChange={(e) => setEditForm((f) => ({ ...f, short_description: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="svc-edit-description" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.description')}</label>
            <Textarea id="svc-edit-description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-edit-category" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.category')}</label>
              <Select id="svc-edit-category" value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value as ServiceCategory }))}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`servicesAdmin.categories.${c}`) as string}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="svc-edit-type" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.type')}</label>
              <Select id="svc-edit-type" value={editForm.service_type} onChange={(e) => setEditForm((f) => ({ ...f, service_type: e.target.value as ServiceKind }))}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`servicesAdmin.kinds.${k}`) as string}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="svc-edit-price-type" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.priceType')}</label>
              <Select id="svc-edit-price-type" value={editForm.price_type} onChange={(e) => setEditForm((f) => ({ ...f, price_type: e.target.value as ServicePriceType }))}>
                {PRICE_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {t(`servicesAdmin.priceTypes.${p}`) as string}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="svc-edit-display-order" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.displayOrder')}</label>
              <Input id="svc-edit-display-order" value={editForm.display_order} onChange={(e) => setEditForm((f) => ({ ...f, display_order: e.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="svc-edit-price" className="mb-1 block text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.price')}</label>
            <Input
              id="svc-edit-price"
              type="number"
              min={0}
              step="0.01"
              value={editForm.price}
              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
            />
          </div>
          <PricingEngineSection
            pillarCode="service"
            dimensionSelections={editForm.dimension_selections}
            onDimensionSelectionsChange={(next) => setEditForm((f) => ({ ...f, dimension_selections: next }))}
            quantity={editForm.estimated_hours.trim() ? Number(editForm.estimated_hours) : null}
            onQuantityChange={(n) => setEditForm((f) => ({ ...f, estimated_hours: n != null ? String(n) : '' }))}
            onUseRecommended={(price) => setEditForm((f) => ({ ...f, price: String(price) }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.isActive')}</div>
              <Switch checked={editForm.is_active} onCheckedChange={(v) => setEditForm((f) => ({ ...f, is_active: v }))} />
            </div>
            <div>
              <div className="mb-1 text-xs font-medium text-ase-muted">{t('servicesAdmin.fields.isFeatured')}</div>
              <Switch checked={editForm.is_featured} onCheckedChange={(v) => setEditForm((f) => ({ ...f, is_featured: v }))} />
            </div>
          </div>
          {updateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('servicesAdmin.edit.error')}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title={t('servicesAdmin.delete.title') as string}
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return
                deleteMutation.mutate(confirmDelete.uuid)
              }}
            >
              {deleteMutation.isPending ? t('servicesAdmin.delete.deleting') : t('servicesAdmin.delete.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className={cn('text-sm text-ase-text')}>
            {String(t('servicesAdmin.delete.body')).replace('{{name}}', confirmDelete?.name ?? '')}
          </div>
          <div className="text-sm text-ase-text2">{t('servicesAdmin.delete.note')}</div>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('servicesAdmin.delete.error')}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
