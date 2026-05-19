import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../api/products.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/Badge'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import type { Product, ProductStatus } from '../types/product.types'
import { useI18n } from '../i18n'
import { CreatorContentBanner } from '../components/creator/CreatorContentBanner'
import { Can } from '../rbac/Can'
import { useRbac } from '../rbac/useRbac'
import { cn } from '../components/ui/cn'
import { Switch } from '../components/ui/Switch'
import { Textarea } from '../components/ui/Textarea'

type CreateValues = {
  code: string
  name: string
  description?: string | ''
  status: ProductStatus
}

type EditValues = {
  code?: string | ''
  name?: string | ''
  description?: string | ''
  status?: ProductStatus
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ProductsPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const na = t('productsPage.common.na') as string
  const [editing, setEditing] = useState<Product | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [createFocus, setCreateFocus] = useState<boolean>(false)

  const createSchema = useMemo(
    () =>
      z.object({
        code: z.string().min(1).max(100),
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional().or(z.literal('')),
        status: z.enum(['active', 'inactive']),
      }),
    [],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        code: z.string().min(1).max(100).optional().or(z.literal('')),
        name: z.string().min(1).max(200).optional().or(z.literal('')),
        description: z.string().max(2000).optional().or(z.literal('')),
        status: z.enum(['active', 'inactive']).optional(),
      }),
    [],
  )

  const productsQuery = useQuery({
    queryKey: ['products', { limit: 50, offset: 0 }],
    queryFn: () => listProducts({ limit: 50, offset: 0 }),
  })

  const items = productsQuery.data?.items ?? []
  const activeCount = useMemo(() => items.filter((p) => p.status === 'active').length, [items])
  const categoriesCount = useMemo(() => Array.from(new Set(items.map((p) => categoryFromCode(p.code)))).length, [items])
  const featured = useMemo(() => items.find((p) => p.status === 'active') ?? items[0] ?? null, [items])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'active',
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'active',
    },
  })

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async () => {
      createForm.reset({ code: '', name: '', description: '', status: 'active' })
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ product_id, payload }: { product_id: number; payload: any }) =>
      updateProduct(product_id, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (product_id: number) => deleteProduct(product_id),
    onSuccess: async () => {
      setConfirmDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const editTitle = useMemo(
    () => (editing ? `${t('productsPage.edit.title')} — ${editing.code}` : (t('productsPage.edit.title') as string)),
    [editing, t],
  )

  const { can } = useRbac()
  const showCreatePanel = can('createProduct') || can('createProductDraft')

  return (
    <div className="space-y-8 pb-16">
      <CreatorContentBanner />
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(16,185,129,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="success" className="mb-5 border-emerald-300/30 bg-emerald-300/10 text-emerald-100">
              {t('productsPage.premium.badge')}
            </Badge>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">{t('productsPage.title')}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('productsPage.subtitle')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
                {t('productsPage.premium.context')}
              </span>
              <Can action="createProduct">
                <Button
                  size="sm"
                  onClick={() => document.getElementById('products-create-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  leftIcon={<span className="text-xs">+</span>}
                >
                  {t('productsPage.premium.create')}
                </Button>
              </Can>
              <Can action="createProductDraft">
                <Button
                  size="sm"
                  onClick={() => document.getElementById('products-create-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  leftIcon={<span className="text-xs">+</span>}
                >
                  {t('creatorApplication.contentCreator.createDraft')}
                </Button>
              </Can>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[min(520px,46%)] lg:grid-cols-1">
            <StatCard label={t('productsPage.stats.total.label') as string} value={String(productsQuery.data?.total ?? items.length)} icon="◇" horizontal />
            <StatCard label={t('productsPage.stats.active.label') as string} value={String(activeCount)} icon="✓" horizontal />
            <StatCard label={t('productsPage.stats.categories.label') as string} value={String(categoriesCount)} icon="○" horizontal />
            <StatCard label={t('productsPage.stats.featured.label') as string} value={featured?.name ?? na} icon="★" horizontal />
          </div>
        </div>
      </section>

      <section className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-ase-text">{t('productsPage.preview.title')}</div>
            <div className="mt-1 text-sm text-ase-text2">{t('productsPage.preview.subtitle')}</div>
          </div>
        </div>
        <EcosystemPreview items={items} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md lg:col-span-2" interactive>
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_52%)]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-ase-text">{t('productsPage.list.title')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('productsPage.list.subtitle')}</div>
            </div>
            <div className="text-xs text-ase-muted">
              {productsQuery.isFetching
                ? (t('productsPage.list.meta.updating') as string)
                : String(t('productsPage.list.meta.total')).replace('{{count}}', String(productsQuery.data?.total ?? items.length))}
            </div>
          </div>

          <div className="mt-4">
            {productsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-11/12" />
                <Skeleton className="h-10 w-10/12" />
              </div>
            ) : productsQuery.isError ? (
              <EmptyState title={t('productsPage.errors.loadTitle') as string} description={t('productsPage.errors.loadSubtitle') as string} />
            ) : items.length === 0 ? (
              <EmptyState
                title={t('productsPage.empty.title') as string}
                description={t('productsPage.empty.subtitle') as string}
                icon={<span className="text-sm">◇</span>}
                actionLabel={t('productsPage.empty.cta') as string}
                onAction={() => {
                  const el = document.getElementById('products-create-panel')
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setCreateFocus(true)
                  setTimeout(() => setCreateFocus(false), 600)
                }}
              />
            ) : (
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[34%]">{t('productsPage.list.columns.product')}</TH>
                    <TH className="w-[34%]">{t('productsPage.list.columns.description')}</TH>
                    <TH className="w-[14%]">{t('productsPage.list.columns.status')}</TH>
                    <TH className="hidden w-[18%] xl:table-cell">{t('productsPage.list.columns.createdAt')}</TH>
                    <TH className="w-[22%] text-right">{t('productsPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((p) => (
                    <TR key={p.id} className="hover:bg-white/[0.035]">
                      <TD className="font-medium text-ase-text">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-xs font-extrabold text-ase-text">
                            {productGlyph(p.code)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-ase-text" title={p.name}>
                              {p.name}
                            </div>
                            <div className="mt-1 text-xs text-ase-muted">{categoryLabel(t, categoryFromCode(p.code))}</div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-ase-text2">
                        <div className="line-clamp-2 text-sm text-ase-text2" title={p.description ?? ''}>
                          {p.description || na}
                        </div>
                      </TD>
                      <TD>
                        {p.status === 'active' ? (
                          <Badge variant="success">{t('productsPage.badges.active')}</Badge>
                        ) : (
                          <Badge variant="warning">{t('productsPage.badges.inactive')}</Badge>
                        )}
                      </TD>
                      <TD className="hidden text-ase-muted xl:table-cell">
                        <span className="block truncate" title={fmtDate(p.created_at)}>
                          {fmtDate(p.created_at)}
                        </span>
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
                                description: p.description ?? '',
                                status: (p.status as any) ?? 'active',
                              })
                            }}
                          >
                            {t('productsPage.actions.edit')}
                          </Button>
                          <Button size="sm" variant="outline" className="border-ase-error/30 text-ase-text2 hover:text-ase-text" onClick={() => setConfirmDelete(p)}>
                            {t('productsPage.actions.delete')}
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

        {showCreatePanel ? (
        <div id="products-create-panel" className={cn(createFocus && 'ring-2 ring-ase-primary/40 rounded-[2rem]')}>
          <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md" interactive>
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.10),transparent_52%)]" />
            <div className="relative z-[1] text-sm font-semibold text-ase-text">{t('productsPage.create.title')}</div>
            <div className="relative z-[1] mt-1 text-sm text-ase-text2">{t('productsPage.create.subtitle')}</div>

            <form
              className="relative z-[1] mt-4 space-y-4"
              onSubmit={createForm.handleSubmit((values) =>
                createMutation.mutate({
                  code: values.code,
                  name: values.name,
                  description: values.description ? values.description : null,
                  status: values.status,
                }),
              )}
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.code')}</label>
                <Input placeholder={t('productsPage.create.placeholders.code') as string} {...createForm.register('code')} />
                {createForm.formState.errors.code && (
                  <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.name')}</label>
                <Input placeholder={t('productsPage.create.placeholders.name') as string} {...createForm.register('name')} />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-ase-error">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.description')}</label>
                <Textarea placeholder={t('productsPage.create.placeholders.description') as string} {...createForm.register('description')} />
              </div>

              <div>
                <div className="mb-1 text-xs font-medium text-ase-muted">{t('productsPage.create.fields.status')}</div>
                <Switch
                  checked={createForm.watch('status') === 'active'}
                  onCheckedChange={(v) => createForm.setValue('status', v ? 'active' : 'inactive')}
                />
              </div>

              {createMutation.isError && (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                  {t('productsPage.create.error')}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
                {createMutation.isPending ? t('productsPage.create.creating') : t('productsPage.create.button')}
              </Button>
            </form>
          </Card>
        </div>) : null}
      </div>

      <Modal
        open={!!editing}
        title={editTitle}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('productsPage.edit.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  product_id: editing.id,
                  payload: {
                    code: values.code ? values.code : null,
                    name: values.name ? values.name : null,
                    description: values.description ? values.description : null,
                    status: values.status ?? null,
                  },
                })
              })}
            >
              {updateMutation.isPending ? t('productsPage.edit.saving') : t('productsPage.edit.save')}
            </Button>
          </div>
        }
      >
        <div className="mb-4 text-sm text-ase-text2">{t('productsPage.edit.subtitle')}</div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.code')}</label>
              <Input {...editForm.register('code')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.name')}</label>
              <Input {...editForm.register('name')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('productsPage.create.fields.description')}</label>
            <Textarea {...editForm.register('description')} />
          </div>

          <div>
            <div className="mb-1 text-xs font-medium text-ase-muted">{t('productsPage.create.fields.status')}</div>
            <Switch
              checked={(editForm.watch('status') ?? 'active') === 'active'}
              onCheckedChange={(v) => editForm.setValue('status', v ? 'active' : 'inactive')}
            />
          </div>

          {updateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('productsPage.edit.error')}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title={t('productsPage.delete.title') as string}
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('productsPage.delete.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return
                deleteMutation.mutate(confirmDelete.id)
              }}
            >
              {deleteMutation.isPending ? t('productsPage.delete.deleting') : t('productsPage.delete.delete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-ase-text">
            {String(t('productsPage.delete.body')).replace('{{code}}', String(confirmDelete?.code ?? ''))}
          </div>
          <div className="text-sm text-ase-text2">{t('productsPage.delete.note')}</div>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('productsPage.delete.error')}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function categoryFromCode(code: string) {
  const c = (code ?? '').toLowerCase()
  if (c.includes('billing')) return 'billing'
  if (c.includes('audit')) return 'audit'
  if (c.includes('rbac')) return 'rbac'
  if (c.includes('qa')) return 'qa'
  if (c.includes('train')) return 'training'
  if (c.includes('ai')) return 'ai'
  if (c.includes('report')) return 'reporting'
  return 'platform'
}

function categoryLabel(t: (k: string) => unknown, id: string) {
  const key =
    id === 'platform' ||
    id === 'qa' ||
    id === 'training' ||
    id === 'reporting' ||
    id === 'ai' ||
    id === 'rbac' ||
    id === 'billing' ||
    id === 'audit'
      ? (`productsPage.categories.${id}` as const)
      : ('productsPage.categories.platform' as const)
  return t(key) as string
}

function productGlyph(code: string) {
  const cat = categoryFromCode(code)
  switch (cat) {
    case 'billing':
      return '◈'
    case 'audit':
      return '○'
    case 'rbac':
      return '▣'
    case 'qa':
      return '◇'
    case 'training':
      return '◉'
    case 'ai':
      return '✦'
    case 'reporting':
      return '⬡'
    default:
      return '◆'
  }
}

function EcosystemPreview({ items }: { items: Product[] }) {
  const { t } = useI18n()
  const nodes = useMemo(() => {
    const active = items.filter((p) => p.status === 'active')
    const pick = (arr: Product[], n: number) => arr.slice(0, n)
    const base = active.length ? active : items
    const selected = pick(base, 7)
    return selected.map((p, idx) => ({ ...p, idx }))
  }, [items])

  return (
    <Card className="mt-4 relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/40 p-6 backdrop-blur-md" interactive>
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_20%_15%,rgba(56,189,248,0.10),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_70%_80%,rgba(34,211,238,0.10),transparent_55%)]" />

      <div className="relative z-[1] grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('productsPage.preview.hub')}</div>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-ase-text">
                ◆
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ase-text">{t('productsPage.preview.hubTitle')}</div>
                <div className="mt-1 text-xs text-ase-text2">{t('productsPage.preview.hubMeta')}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-ase-text2">
              {t('productsPage.preview.subtitle')}
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(56,189,248,0.35)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0.15)" />
              </linearGradient>
            </defs>
            <path d="M8,52 C22,18 46,18 60,52 C72,82 86,82 96,52" fill="none" stroke="url(#line)" strokeWidth="1.2" />
            <path d="M8,52 C26,58 40,74 60,70 C76,66 86,56 96,52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          </svg>

          <div className="grid gap-3 sm:grid-cols-2">
            {nodes.map((p) => (
              <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm transition hover:border-white/15 hover:bg-white/[0.05]">
                <div className="pointer-events-none absolute -inset-20 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.10),transparent_55%)]" />
                <div className="relative z-[1] flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-ase-text">
                    {productGlyph(p.code)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ase-text" title={p.name}>
                      {p.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="truncate rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] font-semibold text-ase-text2" title={p.code}>
                        {p.code}
                      </span>
                      {p.status === 'active' ? <Badge variant="success">{t('productsPage.badges.active')}</Badge> : <Badge variant="warning">{t('productsPage.badges.inactive')}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
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

