import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateAdminDashboard } from '../api/adminDashboard.invalidate'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  patchAdminUserStatus,
  updateAdminUser,
  type AdminUser,
} from '../api/adminUsers.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { Toast } from '../components/ui/Toast'
import { useI18n } from '../i18n'
import { cn } from '../components/ui/cn'
import { useAuth } from '../auth/AuthProvider'
import { Can } from '../rbac/Can'

type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted' | string

const PLATFORM_ROLES = ['super_admin', 'independent_user'] as const

type CreateValues = {
  email: string
  password: string
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  status: 'active' | 'inactive' | 'suspended'
  role: (typeof PLATFORM_ROLES)[number]
  can_create_content: boolean
}

type EditValues = {
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  phone_e164?: string | ''
  status?: 'active' | 'inactive' | 'suspended'
  role?: (typeof PLATFORM_ROLES)[number]
  can_create_content?: boolean
  creator_status?: 'none' | 'pending' | 'approved' | 'rejected'
}

type UsersViewMode = 'cards' | 'table'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function displayName(u: AdminUser) {
  return u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)
  const [createOpen, setCreateOpen] = useState<boolean>(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [viewMode, setViewMode] = useState<UsersViewMode>('cards')
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null)
  const isSuperAdmin = Boolean(currentUser?.is_superuser || currentUser?.primary_role === 'super_admin')

  const statusOptions = useMemo<Array<{ value: UserStatus; label: string }>>(
    () => [
      { value: 'active', label: t('usersPage.status.active') as string },
      { value: 'inactive', label: (t('usersPage.status.inactive') as string) || 'Inactive' },
      { value: 'suspended', label: t('usersPage.status.suspended') as string },
    ],
    [t],
  )

  const roleOptions = useMemo(
    () =>
      PLATFORM_ROLES.map((r) => ({
        value: r,
        label: r === 'super_admin' ? 'Super Admin' : 'Independent User',
      })),
    [],
  )

  const createSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        password: z.string().min(8, t('usersPage.errors.passwordMin') as string),
        first_name: z.string().max(100).optional().or(z.literal('')),
        last_name: z.string().max(100).optional().or(z.literal('')),
        display_name: z.string().max(150).optional().or(z.literal('')),
        status: z.enum(['active', 'inactive', 'suspended']),
        role: z.enum(['super_admin', 'independent_user']),
        can_create_content: z.boolean(),
      }),
    [t],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        first_name: z.string().max(100).optional().or(z.literal('')),
        last_name: z.string().max(100).optional().or(z.literal('')),
        display_name: z.string().max(150).optional().or(z.literal('')),
        phone_e164: z.string().max(20).optional().or(z.literal('')),
        status: z.enum(['active', 'inactive', 'suspended']).optional(),
        role: z.enum(['super_admin', 'independent_user']).optional(),
        can_create_content: z.boolean().optional(),
        creator_status: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
      }),
    [t],
  )

  const usersQuery = useQuery({
    queryKey: ['admin-users', { limit: 50, offset: 0, statusFilter, roleFilter, search }],
    queryFn: () =>
      listAdminUsers({
        limit: 50,
        offset: 0,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        search: search.trim() || undefined,
      }),
    enabled: isSuperAdmin,
  })

  const items = usersQuery.data?.items ?? []
  const activeCount = useMemo(() => items.filter((u) => u.status === 'active').length, [items])
  const suspendedCount = useMemo(() => items.filter((u) => u.status === 'suspended').length, [items])
  const inactiveCount = useMemo(() => items.filter((u) => u.status === 'inactive').length, [items])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      display_name: '',
      status: 'active',
      role: 'independent_user',
      can_create_content: false,
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      display_name: '',
      phone_e164: '',
      status: 'active',
      role: 'independent_user',
      can_create_content: false,
      creator_status: 'none',
    },
  })

  const createMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      createForm.reset({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        status: 'active',
        role: 'independent_user',
        can_create_content: false,
      })
      setCreateOpen(false)
      setToast({ message: t('usersPage.toast.created') as string, variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      await invalidateAdminDashboard(queryClient)
    },
    onError: () => setToast({ message: t('usersPage.create.error') as string, variant: 'error' }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ user_uuid, payload }: { user_uuid: string; payload: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(user_uuid, payload),
    onSuccess: async () => {
      setEditing(null)
      setToast({ message: t('usersPage.toast.saved') as string, variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      await invalidateAdminDashboard(queryClient)
    },
    onError: () => setToast({ message: t('usersPage.edit.error') as string, variant: 'error' }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ user_uuid, status }: { user_uuid: string; status: UserStatus }) =>
      patchAdminUserStatus(user_uuid, status),
    onSuccess: async () => {
      setToast({ message: t('usersPage.toast.statusUpdated') as string, variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      await invalidateAdminDashboard(queryClient)
    },
    onError: () => setToast({ message: t('usersPage.edit.error') as string, variant: 'error' }),
  })

  const deleteMutation = useMutation({
    mutationFn: (user_uuid: string) => deleteAdminUser(user_uuid),
    onSuccess: async () => {
      setConfirmDelete(null)
      setToast({ message: t('usersPage.toast.deleted') as string, variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      await invalidateAdminDashboard(queryClient)
    },
    onError: () => setToast({ message: t('usersPage.delete.error') as string, variant: 'error' }),
  })

  const editTitle = useMemo(
    () => (editing ? `${t('usersPage.edit.title')} — ${editing.email}` : (t('usersPage.edit.title') as string)),
    [editing, t],
  )

  const filteredItems = items

  if (!isSuperAdmin) {
    return (
      <EmptyState
        title={t('usersPage.errors.superAdminOnlyTitle') as string}
        description={t('usersPage.errors.superAdminOnlySubtitle') as string}
      />
    )
  }

  return (
    <div className="space-y-8 pb-16">
      {toast ? <Toast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} /> : null}
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <Badge variant="info" className="mb-5 border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
              {t('usersPage.premium.badge')}
            </Badge>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">{t('usersPage.title')}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{t('usersPage.subtitle')}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-ase-text2">
                {t('usersPage.premium.context')}
              </span>
              {!isSuperAdmin ? (
                <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
                  {t('usersPage.premium.scopedView')}
                </span>
              ) : null}
              <Can action="createUser">
                <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<span className="text-xs">+</span>}>
                  {t('usersPage.premium.actions.create')}
                </Button>
              </Can>
            </div>
          </div>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-bg2/45 p-5 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.heroMetric')}</div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <IdentityOrb label={t('usersPage.status.active') as string} value={activeCount} tone="success" />
              <IdentityOrb label={(t('usersPage.status.inactive') as string) || 'Inactive'} value={inactiveCount} tone="info" />
              <IdentityOrb label={t('usersPage.status.suspended') as string} value={suspendedCount} tone="warning" />
            </div>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PremiumUserMetric label={t('usersPage.stats.total.label') as string} hint={t('usersPage.stats.total.hint') as string} value={usersQuery.data?.total ?? items.length} icon="◉" accent="from-cyan-300 to-blue-500" />
        <PremiumUserMetric label={t('usersPage.stats.active.label') as string} hint={t('usersPage.stats.active.hint') as string} value={activeCount} icon="✓" accent="from-emerald-300 to-teal-500" />
        <PremiumUserMetric label={(t('usersPage.status.inactive') as string) || 'Inactive'} hint={t('usersPage.stats.inactive.hint') as string} value={inactiveCount} icon="✦" accent="from-violet-300 to-fuchsia-500" />
        <PremiumUserMetric label={t('usersPage.stats.suspended.label') as string} hint={t('usersPage.stats.suspended.hint') as string} value={suspendedCount} icon="○" accent="from-amber-300 to-orange-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_auto]">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('usersPage.premium.filters.search') as string} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                <option value="">{t('usersPage.premium.filters.allStatuses')}</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                <option value="">{t('usersPage.premium.filters.allRoles') as string}</option>
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              <div className="flex rounded-xl border border-white/10 bg-ase-bg2/50 p-1">
                <button type="button" onClick={() => setViewMode('cards')} className={cn('rounded-lg px-3 text-sm font-semibold transition', viewMode === 'cards' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2 hover:bg-white/[0.05]')}>
                  {t('usersPage.premium.view.cards')}
                </button>
                <button type="button" onClick={() => setViewMode('table')} className={cn('rounded-lg px-3 text-sm font-semibold transition', viewMode === 'table' ? 'bg-ase-primary text-ase-text' : 'text-ase-text2 hover:bg-white/[0.05]')}>
                  {t('usersPage.premium.view.table')}
                </button>
              </div>
            </div>
          </Card>

          {usersQuery.isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-56 rounded-[2rem]" />
              <Skeleton className="h-56 rounded-[2rem]" />
            </div>
          ) : usersQuery.isError ? (
            <EmptyState title={t('usersPage.errors.loadTitle') as string} description={t('usersPage.errors.loadSubtitle') as string} />
          ) : filteredItems.length === 0 ? (
            <EmptyState title={t('usersPage.empty.title') as string} description={t('usersPage.empty.subtitle') as string} actionLabel={t('usersPage.empty.cta') as string} onAction={() => setCreateOpen(true)} />
          ) : viewMode === 'cards' ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredItems.map((u) => (
                <UserPremiumCard
                  key={u.uuid}
                  user={u}
                  t={t}
                  onEdit={() => {
                    setEditing(u)
                    editForm.reset({
                      first_name: u.first_name ?? '',
                      last_name: u.last_name ?? '',
                      display_name: u.display_name ?? '',
                      phone_e164: u.phone_e164 ?? '',
                      status: (u.status as CreateValues['status']) ?? 'active',
                      role: (u.primary_role as EditValues['role']) ?? 'independent_user',
                      can_create_content: u.can_create_content,
                      creator_status: (u.creator_status as EditValues['creator_status']) ?? 'none',
                    })
                  }}
                  onToggleStatus={() => {
                    const next = u.status === 'active' ? 'inactive' : 'active'
                    statusMutation.mutate({ user_uuid: u.uuid, status: next })
                  }}
                  onDelete={() => setConfirmDelete(u)}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/55 p-0 shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur">
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[30%]">{t('usersPage.list.columns.user')}</TH>
                    <TH className="w-[12%]">{t('usersPage.list.columns.role') as string}</TH>
                    <TH className="w-[10%]">{t('usersPage.list.columns.status')}</TH>
                    <TH className="hidden w-[10%] lg:table-cell">{t('usersPage.list.columns.creatorEnabled') as string}</TH>
                    <TH className="hidden w-[12%] xl:table-cell">{t('usersPage.list.columns.createdAt')}</TH>
                    <TH className="w-[26%] text-right">{t('usersPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredItems.map((u) => (
                    <TR key={u.uuid}>
                      <TD className="font-medium text-ase-text">
                        <UserIdentity user={u} />
                      </TD>
                      <TD className="text-ase-text2 text-sm">{u.primary_role ?? '—'}</TD>
                      <TD>{renderStatusBadge(t, u.status ?? null)}</TD>
                      <TD className="hidden text-ase-text2 text-sm lg:table-cell">
                        {u.can_create_content ? (t('usersPage.premium.cards.yes') as string) : (t('usersPage.premium.cards.no') as string)}
                      </TD>
                      <TD className="hidden text-ase-muted xl:table-cell">{fmtDate(u.created_at)}</TD>
                      <TD className="text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(u)
                              editForm.reset({
                                first_name: u.first_name ?? '',
                                last_name: u.last_name ?? '',
                                display_name: u.display_name ?? '',
                                phone_e164: u.phone_e164 ?? '',
                                status: (u.status as CreateValues['status']) ?? 'active',
                                role: (u.primary_role as EditValues['role']) ?? 'independent_user',
                                can_create_content: u.can_create_content,
                                creator_status: (u.creator_status as EditValues['creator_status']) ?? 'none',
                              })
                            }}
                          >
                            {t('usersPage.actions.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const next = u.status === 'active' ? 'inactive' : 'active'
                              statusMutation.mutate({ user_uuid: u.uuid, status: next })
                            }}
                          >
                            {u.status === 'active' ? (t('usersPage.actions.deactivate') as string) : (t('usersPage.actions.activate') as string)}
                          </Button>
                          <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setConfirmDelete(u)}>{t('usersPage.actions.delete')}</Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </div>

        <UsersInsightsPanel t={t} items={items} activeCount={activeCount} inactiveCount={inactiveCount} suspendedCount={suspendedCount} onCreate={() => setCreateOpen(true)} />
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/[0.08] bg-ase-bg2/90 p-6 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.actions.create')}</div>
                <h2 className="mt-2 text-xl font-semibold text-ase-text">{t('usersPage.create.title')}</h2>
                <p className="mt-1 text-sm text-ase-text2">{t('usersPage.create.subtitle')}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
                {t('usersPage.edit.cancel')}
              </Button>
            </div>
            <div className="mt-6">
              <CreateUserForm
                t={t}
                form={createForm}
                statusOptions={statusOptions}
                roleOptions={roleOptions}
                createMutation={createMutation}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        open={!!editing}
        title={editTitle}
        closeLabel={t('usersPage.edit.cancel')}
        onClose={() => setEditing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t('usersPage.edit.cancel')}
            </Button>
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  user_uuid: editing.uuid,
                  payload: {
                    first_name: values.first_name || null,
                    last_name: values.last_name || null,
                    display_name: values.display_name || null,
                    phone_e164: values.phone_e164 || null,
                    status: values.status ?? null,
                    role: values.role ?? null,
                    can_create_content: values.can_create_content,
                    creator_status: values.creator_status ?? null,
                  },
                })
              })}
            >
              {updateMutation.isPending ? t('usersPage.edit.saving') : t('usersPage.edit.save')}
            </Button>
          </div>
        }
      >
        <div className="mb-4 text-sm text-ase-text2">{t('usersPage.edit.subtitle')}</div>
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text2">{editing?.email}</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.firstName')}</label>
              <Input placeholder={t('usersPage.create.placeholders.firstName') as string} {...editForm.register('first_name')} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.lastName')}</label>
              <Input placeholder={t('usersPage.create.placeholders.lastName') as string} {...editForm.register('last_name')} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.displayName')}</label>
            <Input placeholder={t('usersPage.create.placeholders.displayName') as string} {...editForm.register('display_name')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.phone') as string}</label>
            <Input placeholder="+34…" {...editForm.register('phone_e164')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.role') as string}</label>
            <Select {...editForm.register('role')}>
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.status')}</label>
            <Select {...editForm.register('status')}>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-ase-text2">
            <input type="checkbox" className="rounded border-white/20" {...editForm.register('can_create_content')} />
            {t('usersPage.create.fields.canCreateContent') as string}
          </label>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.creatorStatus') as string}</label>
            <Select {...editForm.register('creator_status')}>
              {(['none', 'pending', 'approved', 'rejected'] as const).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          {updateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('usersPage.edit.error')}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        title={t('usersPage.delete.title') as string}
        closeLabel={t('usersPage.delete.cancel')}
        onClose={() => setConfirmDelete(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              {t('usersPage.delete.cancel')}
            </Button>
            <Button
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!confirmDelete) return
                deleteMutation.mutate(confirmDelete.uuid)
              }}
            >
              {deleteMutation.isPending ? t('usersPage.delete.deleting') : t('usersPage.delete.delete')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-ase-text">
            {String(t('usersPage.delete.body')).replace('{{email}}', String(confirmDelete?.email ?? ''))}
          </div>
          <div className="text-sm font-medium text-ase-error">
            {(t('usersPage.delete.hardWarning') as string) ||
              'This will permanently remove the user from the database. This cannot be undone.'}
          </div>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('usersPage.delete.error')}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function renderStatusBadge(t: (k: string) => string, status: string | null) {
  if (!status) return <span className="text-ase-muted">{t('usersPage.common.na') as string}</span>
  const known = ['active', 'inactive', 'suspended', 'deleted'] as const
  const key = known.includes(status as (typeof known)[number])
    ? (`usersPage.status.${status}` as const)
    : ('usersPage.status.unknown' as const)
  const variant =
    status === 'active' ? 'success' : status === 'inactive' ? 'default' : status === 'suspended' ? 'warning' : status === 'deleted' ? 'error' : 'default'
  return <Badge variant={variant}>{t(key) as string}</Badge>
}

function initials(u: AdminUser) {
  const name = u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ')
  const source = (name || u.email || '').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const two = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return two.toUpperCase()
}

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-violet-400/10 text-xs font-extrabold text-ase-text">
        {initials(user)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-ase-text">{displayName(user)}</div>
        <div className="truncate text-xs text-ase-text2">{user.email}</div>
      </div>
    </div>
  )
}

function IdentityOrb({ label, value, tone }: { label: string; value: number; tone: 'success' | 'info' | 'warning' }) {
  const toneClass =
    tone === 'success'
      ? 'from-emerald-300/20 to-teal-400/10 text-emerald-100'
      : tone === 'warning'
        ? 'from-amber-300/20 to-orange-400/10 text-amber-100'
        : 'from-cyan-300/20 to-violet-400/10 text-cyan-100'
  return (
    <div className={cn('rounded-3xl border border-white/10 bg-gradient-to-br p-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]', toneClass)}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
    </div>
  )
}

function PremiumUserMetric({ label, hint, value, icon, accent }: { label: string; hint: string; value: number; icon: string; accent: string }) {
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
    </Card>
  )
}

function UserPremiumCard({
  user,
  t,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: AdminUser
  t: (k: string) => string
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:border-cyan-300/20">
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_36%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <UserIdentity user={user} />
        {renderStatusBadge(t, user.status ?? null)}
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MiniUserMetric label={t('usersPage.premium.cards.identity') as string} value={displayName(user)} />
        <MiniUserMetric label={t('usersPage.list.columns.role') as string} value={user.primary_role ?? '—'} />
        <MiniUserMetric label={t('usersPage.premium.cards.accessState') as string} value={t(`usersPage.status.${user.status}`) as string} />
        <MiniUserMetric label={t('usersPage.premium.cards.joined') as string} value={fmtDate(user.created_at)} />
        <MiniUserMetric
          label={t('usersPage.create.fields.canCreateContent') as string}
          value={user.can_create_content ? (t('usersPage.premium.cards.yes') as string) : (t('usersPage.premium.cards.no') as string)}
        />
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          {t('usersPage.premium.actions.viewProfile')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleStatus}>
          {user.status === 'active' ? (t('usersPage.actions.deactivate') as string) : (t('usersPage.actions.activate') as string)}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {t('usersPage.actions.edit')}
        </Button>
        <Button size="sm" variant="outline" className="border-ase-error/30" onClick={onDelete}>
          {t('usersPage.actions.delete')}
        </Button>
      </div>
    </Card>
  )
}

function MiniUserMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

function UsersInsightsPanel({
  t,
  items,
  activeCount,
  inactiveCount,
  suspendedCount,
  onCreate,
}: {
  t: (k: string) => string
  items: AdminUser[]
  activeCount: number
  inactiveCount: number
  suspendedCount: number
  onCreate: () => void
}) {
  const recent = [...items].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 3)
  const attention = items.filter((u) => u.status === 'suspended' || u.status === 'inactive')
  const total = Math.max(1, items.length)
  return (
    <aside className="space-y-6">
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ase-text">{t('usersPage.premium.insights.title')}</h2>
          <Button size="sm" onClick={onCreate}>{t('usersPage.premium.actions.create')}</Button>
        </div>
        <div className="mt-6 space-y-6">
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.insights.lifecycle')}</div>
            <div className="mt-3 space-y-3">
              <InsightBar label={t('usersPage.status.active') as string} value={activeCount} total={total} />
              <InsightBar label={(t('usersPage.status.inactive') as string) || 'Inactive'} value={inactiveCount} total={total} />
              <InsightBar label={t('usersPage.status.suspended') as string} value={suspendedCount} total={total} />
            </div>
          </section>
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.insights.recent')}</div>
            <div className="mt-3 space-y-2">
              {recent.map((u) => (
                <div key={u.uuid} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <div className="truncate text-sm font-medium text-ase-text">{displayName(u)}</div>
                  <div className="mt-1 truncate text-xs text-ase-muted">{u.email}</div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.insights.attention')}</div>
            <div className="mt-3 space-y-2">
              {(attention.length ? attention.slice(0, 4) : items.slice(0, 1)).map((u) => (
                <div key={u.uuid} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                  <span className="truncate text-sm text-ase-text2">{displayName(u)}</span>
                  {renderStatusBadge(t, u.status ?? null)}
                </div>
              ))}
            </div>
          </section>
        </div>
      </Card>
    </aside>
  )
}

function InsightBar({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ase-text2">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

function CreateUserForm({
  t,
  form,
  statusOptions,
  roleOptions,
  createMutation,
}: {
  t: (k: string) => string
  form: UseFormReturn<CreateValues>
  statusOptions: Array<{ value: UserStatus; label: string }>
  roleOptions: Array<{ value: string; label: string }>
  createMutation: {
    mutate: (payload: Parameters<typeof createAdminUser>[0]) => void
    isError: boolean
    isPending: boolean
  }
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        createMutation.mutate({
          email: values.email,
          password: values.password,
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          display_name: values.display_name || null,
          status: values.status,
          role: values.role,
          can_create_content: values.can_create_content,
        })
      })}
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.email')}</label>
        <Input placeholder={t('usersPage.create.placeholders.email') as string} {...form.register('email')} />
        {form.formState.errors.email && <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.temporaryPassword')}</label>
        <Input type="password" placeholder={t('usersPage.create.placeholders.temporaryPassword') as string} {...form.register('password')} />
        {form.formState.errors.password && <p className="mt-1 text-sm text-ase-error">{form.formState.errors.password.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.firstName')}</label>
          <Input placeholder={t('usersPage.create.placeholders.firstName') as string} {...form.register('first_name')} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.lastName')}</label>
          <Input placeholder={t('usersPage.create.placeholders.lastName') as string} {...form.register('last_name')} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.displayName')}</label>
        <Input placeholder={t('usersPage.create.placeholders.displayName') as string} {...form.register('display_name')} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.role') as string}</label>
        <Select {...form.register('role')}>
          {roleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.status')}</label>
        <Select {...form.register('status')}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm text-ase-text2">
        <input type="checkbox" className="rounded border-white/20" {...form.register('can_create_content')} />
        {t('usersPage.create.fields.canCreateContent') as string}
      </label>
      {createMutation.isError && <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('usersPage.create.error')}</div>}
      <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
        {createMutation.isPending ? t('usersPage.create.creating') : t('usersPage.create.button')}
      </Button>
    </form>
  )
}

