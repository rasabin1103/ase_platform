import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import { Download, LogIn } from 'lucide-react'
import { z } from 'zod'
import { createUser, deleteUser, impersonateUser, listUsers, updateUser } from '../api/users.api'
import type { UserUpdateRequest } from '../types/user.types'
import { downloadCsv } from '../utils/csv'
import { getMemberCatalogStats, type MemberCatalogStat } from '../api/orgCatalog.api'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Table, TBody, TD, THead, TH, TR } from '../components/ui/Table'
import { Modal } from '../components/ui/Modal'
import { MemberCatalogStatsModal } from '../components/organization/MemberCatalogStatsModal'
import type { User, UserStatus } from '../types/user.types'
import { useI18n } from '../i18n'
import { cn } from '../components/ui/cn'
import { useAuth } from '../hooks/useAuth'
import { Can } from '../rbac/Can'

type CreateValues = {
  email: string
  plain_password: string
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  status: 'active' | 'suspended' | 'deleted'
}

type EditValues = {
  email?: string | ''
  plain_password?: string | ''
  first_name?: string | ''
  last_name?: string | ''
  display_name?: string | ''
  status?: 'active' | 'suspended' | 'deleted'
}

type UsersViewMode = 'cards' | 'table'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function displayName(u: User) {
  return u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const navigate = useNavigate()
  const auth = useAuth()
  const { currentUser } = auth
  const [editing, setEditing] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [confirmImpersonate, setConfirmImpersonate] = useState<User | null>(null)
  const [createOpen, setCreateOpen] = useState<boolean>(false)
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<UsersViewMode>('cards')
  const [statsOpen, setStatsOpen] = useState(false)
  const isSuperAdmin = Boolean(currentUser?.is_superuser)

  const statusOptions = useMemo<Array<{ value: UserStatus; label: string }>>(
    () => [
      { value: 'active', label: t('usersPage.status.active') as string },
      { value: 'suspended', label: t('usersPage.status.suspended') as string },
      { value: 'deleted', label: t('usersPage.status.deleted') as string },
    ],
    [t],
  )

  const createSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(),
        plain_password: z.string().min(8, t('usersPage.errors.passwordMin') as string),
        first_name: z.string().max(100).optional().or(z.literal('')),
        last_name: z.string().max(100).optional().or(z.literal('')),
        display_name: z.string().max(150).optional().or(z.literal('')),
        status: z.enum(['active', 'suspended', 'deleted']),
      }),
    [t],
  )

  const editSchema = useMemo(
    () =>
      z.object({
        email: z.string().email().optional().or(z.literal('')),
        plain_password: z.string().min(8, t('usersPage.errors.passwordMin') as string).optional().or(z.literal('')),
        first_name: z.string().max(100).optional().or(z.literal('')),
        last_name: z.string().max(100).optional().or(z.literal('')),
        display_name: z.string().max(150).optional().or(z.literal('')),
        status: z.enum(['active', 'suspended', 'deleted']).optional(),
      }),
    [t],
  )

  const usersQuery = useQuery({
    queryKey: ['users', { limit: 50, offset: 0 }],
    queryFn: () => listUsers({ limit: 50, offset: 0 }),
  })

  const items = useMemo(() => usersQuery.data?.items ?? [], [usersQuery.data])
  const activeCount = useMemo(() => items.filter((u) => u.status === 'active').length, [items])
  const suspendedCount = useMemo(() => items.filter((u) => u.status === 'suspended').length, [items])
  const invitedCount = useMemo(() => items.filter((u) => !u.email_verified_at).length, [items])

  const catalogStatsQuery = useQuery({
    queryKey: ['org-member-catalog-stats'],
    queryFn: getMemberCatalogStats,
    enabled: !isSuperAdmin,
  })
  const catalogStatsByUuid = useMemo(() => {
    const map = new Map<string, MemberCatalogStat>()
    for (const s of catalogStatsQuery.data?.items ?? []) map.set(s.uuid, s)
    return map
  }, [catalogStatsQuery.data])

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: '',
      plain_password: '',
      first_name: '',
      last_name: '',
      display_name: '',
      status: 'active',
    },
  })

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      email: '',
      plain_password: '',
      first_name: '',
      last_name: '',
      display_name: '',
      status: 'active',
    },
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      createForm.reset({
        email: '',
        plain_password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        status: 'active',
      })
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ user_uuid, payload }: { user_uuid: string; payload: UserUpdateRequest }) =>
      updateUser(user_uuid, payload),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (user_uuid: string) => deleteUser(user_uuid),
    onSuccess: async () => {
      setConfirmDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const impersonateMutation = useMutation({
    mutationFn: (user_uuid: string) => impersonateUser(user_uuid),
    onSuccess: async (data) => {
      setConfirmImpersonate(null)
      await auth.startImpersonation(data.access_token)
      navigate('/dashboard')
    },
  })

  const editTitle = useMemo(
    () => (editing ? `${t('usersPage.edit.title')} — ${editing.email}` : (t('usersPage.edit.title') as string)),
    [editing, t],
  )

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((u) => {
      if (statusFilter && u.status !== statusFilter) return false
      if (!query) return true
      return `${displayName(u)} ${u.email}`.toLowerCase().includes(query)
    })
  }, [items, search, statusFilter])

  const handleExport = () => {
    downloadCsv(
      'users',
      filteredItems.map((u) => ({
        uuid: u.uuid,
        email: u.email,
        display_name: displayName(u),
        status: u.status ?? '',
        email_verified: u.email_verified_at ? 'yes' : 'no',
        created_at: u.created_at,
      })),
    )
  }

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-ase-surface p-6 shadow-soft md:p-8">
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <Badge variant="info" className="mb-5">
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
              {!isSuperAdmin ? (
                <Can permission="purchases.read_all">
                  <Button size="sm" variant="secondary" onClick={() => setStatsOpen(true)}>
                    {t('organizationWorkspace.memberStats.buttonLabel')}
                  </Button>
                </Can>
              ) : null}
              <Can action="createUser">
                <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<span className="text-xs">+</span>}>
                  {t('usersPage.premium.actions.create')}
                </Button>
              </Can>
            </div>
          </div>

          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.heroMetric')}</div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <IdentityOrb label={t('usersPage.status.active') as string} value={activeCount} tone="success" />
              <IdentityOrb label={t('usersPage.premium.cards.verification') as string} value={invitedCount} tone="info" />
              <IdentityOrb label={t('usersPage.status.suspended') as string} value={suspendedCount} tone="warning" />
            </div>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PremiumUserMetric label={t('usersPage.stats.total.label') as string} hint={t('usersPage.stats.total.hint') as string} value={usersQuery.data?.total ?? items.length} icon="◉" accent="from-ase-brand to-ase-brand" />
        <PremiumUserMetric label={t('usersPage.stats.active.label') as string} hint={t('usersPage.stats.active.hint') as string} value={activeCount} icon="✓" accent="from-emerald-300 to-teal-500" />
        <PremiumUserMetric label={t('usersPage.stats.invited.label') as string} hint={t('usersPage.stats.invited.hint') as string} value={invitedCount} icon="✦" accent="from-ase-brand to-ase-brand" />
        <PremiumUserMetric label={t('usersPage.stats.suspended.label') as string} hint={t('usersPage.stats.suspended.hint') as string} value={suspendedCount} icon="○" accent="from-amber-300 to-orange-500" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto]">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('usersPage.premium.filters.search') as string} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border-white/10 bg-ase-bg2/50">
                <option value="">{t('usersPage.premium.filters.allStatuses')}</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
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
            <div className="mt-3 flex justify-end">
              <Button size="sm" variant="secondary" onClick={handleExport} disabled={filteredItems.length === 0}>
                <Download className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
                {t('private.common.exportCsv')}
              </Button>
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
                  catalogStat={catalogStatsByUuid.get(u.uuid)}
                  onEdit={() => {
                    setEditing(u)
                    editForm.reset({
                      email: u.email,
                      plain_password: '',
                      first_name: u.first_name ?? '',
                      last_name: u.last_name ?? '',
                      display_name: u.display_name ?? '',
                      status: (u.status as 'active' | 'suspended' | 'deleted') ?? 'active',
                    })
                  }}
                  onDelete={() => setConfirmDelete(u)}
                  onImpersonate={isSuperAdmin && u.uuid !== currentUser?.uuid ? () => setConfirmImpersonate(u) : undefined}
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-0 shadow-soft">
              <Table className="table-fixed">
                <THead>
                  <TR>
                    <TH className="w-[38%]">{t('usersPage.list.columns.user')}</TH>
                    <TH className="w-[14%]">{t('usersPage.list.columns.status')}</TH>
                    {!isSuperAdmin ? (
                      <>
                        <TH className="hidden w-[12%] text-center lg:table-cell">{t('organizationWorkspace.memberStats.columnSent')}</TH>
                        <TH className="hidden w-[12%] text-center lg:table-cell">{t('organizationWorkspace.memberStats.columnConsumed')}</TH>
                      </>
                    ) : null}
                    <TH className="hidden w-[14%] xl:table-cell">{t('usersPage.list.columns.createdAt')}</TH>
                    <TH className="w-[22%] text-right">{t('usersPage.list.columns.actions')}</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredItems.map((u) => {
                    const stat = catalogStatsByUuid.get(u.uuid)
                    return (
                    <TR key={u.uuid}>
                      <TD className="font-medium text-ase-text">
                        <UserIdentity user={u} />
                      </TD>
                      <TD>{renderStatusBadge(t, u.status ?? null)}</TD>
                      {!isSuperAdmin ? (
                        <>
                          <TD className="hidden text-center lg:table-cell">
                            <Badge variant="info">{stat?.sentCount ?? 0}</Badge>
                          </TD>
                          <TD className="hidden text-center lg:table-cell">
                            <Badge variant="success">{stat?.consumedCount ?? 0}</Badge>
                          </TD>
                        </>
                      ) : null}
                      <TD className="hidden text-ase-muted xl:table-cell">{fmtDate(u.created_at)}</TD>
                      <TD className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(u)
                              editForm.reset({
                                email: u.email,
                                plain_password: '',
                                first_name: u.first_name ?? '',
                                last_name: u.last_name ?? '',
                                display_name: u.display_name ?? '',
                                status: (u.status as 'active' | 'suspended' | 'deleted') ?? 'active',
                              })
                            }}
                          >
                            {t('usersPage.actions.edit')}
                          </Button>
                          <Button size="sm" variant="outline" className="border-ase-error/30" onClick={() => setConfirmDelete(u)}>{t('usersPage.actions.delete')}</Button>
                          {isSuperAdmin && u.uuid !== currentUser?.uuid ? (
                            <Button size="sm" variant="ghost" onClick={() => setConfirmImpersonate(u)} title={t('impersonation.action') as string}>
                              <LogIn className="h-4 w-4" strokeWidth={1.75} />
                            </Button>
                          ) : null}
                        </div>
                      </TD>
                    </TR>
                  )})}
                </TBody>
              </Table>
            </Card>
          )}
        </div>

        <UsersInsightsPanel t={t} items={items} activeCount={activeCount} invitedCount={invitedCount} suspendedCount={suspendedCount} onCreate={() => setCreateOpen(true)} />
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/65" onClick={() => setCreateOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/[0.08] bg-ase-bg2 p-6 shadow-soft sm:p-8">
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
              <CreateUserForm t={t} form={createForm} statusOptions={statusOptions} createMutation={createMutation} />
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
            <Button
              variant="primary"
              disabled={updateMutation.isPending}
              onClick={editForm.handleSubmit((values) => {
                if (!editing) return
                updateMutation.mutate({
                  user_uuid: editing.uuid,
                  payload: {
                    email: values.email ? values.email : null,
                    plain_password: values.plain_password ? values.plain_password : null,
                    first_name: values.first_name ? values.first_name : null,
                    last_name: values.last_name ? values.last_name : null,
                    display_name: values.display_name ? values.display_name : null,
                    status: values.status ?? null,
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
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.email')}</label>
            <Input placeholder={t('usersPage.create.placeholders.email') as string} {...editForm.register('email')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.temporaryPassword')}</label>
            <Input type="password" placeholder={t('usersPage.edit.optionalPassword') as string} {...editForm.register('plain_password')} />
            {editForm.formState.errors.plain_password && (
              <p className="mt-1 text-sm text-ase-error">{editForm.formState.errors.plain_password.message}</p>
            )}
          </div>
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
            <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.status')}</label>
            <Select {...editForm.register('status')}>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
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
          <div className="text-sm text-ase-text2">{t('usersPage.delete.note')}</div>
          {deleteMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('usersPage.delete.error')}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={!!confirmImpersonate}
        title={t('impersonation.confirmTitle') as string}
        closeLabel={t('impersonation.cancel')}
        onClose={() => setConfirmImpersonate(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              disabled={impersonateMutation.isPending}
              onClick={() => {
                if (!confirmImpersonate) return
                impersonateMutation.mutate(confirmImpersonate.uuid)
              }}
            >
              {impersonateMutation.isPending ? t('usersPage.edit.saving') : t('impersonation.confirmAction')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="text-sm text-ase-text">
            {String(t('impersonation.confirmBody')).replace('{{email}}', String(confirmImpersonate?.email ?? ''))}
          </div>
          {impersonateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('impersonation.error')}
            </div>
          )}
        </div>
      </Modal>

      <MemberCatalogStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  )
}

function renderStatusBadge(t: (k: string) => string, status: string | null) {
  if (!status) return <span className="text-ase-muted">{t('usersPage.common.na') as string}</span>
  const key =
    status === 'active' || status === 'suspended' || status === 'deleted'
      ? (`usersPage.status.${status}` as const)
      : ('usersPage.status.unknown' as const)
  const variant = status === 'active' ? 'success' : status === 'suspended' ? 'warning' : status === 'deleted' ? 'error' : 'default'
  return <Badge variant={variant}>{t(key) as string}</Badge>
}

function initials(u: User) {
  const name = u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ')
  const source = (name || u.email || '').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  const two = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return two.toUpperCase()
}

function UserIdentity({ user }: { user: User }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-xs font-extrabold text-ase-text ring-1 ring-ase-brand/20">
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
  const toneClass = tone === 'success' ? 'border-emerald-300/20' : tone === 'warning' ? 'border-amber-300/20' : 'border-white/10'
  return (
    <div className={cn('rounded-3xl border bg-ase-bg2/60 p-4 text-center shadow-soft', toneClass)}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
    </div>
  )
}

function PremiumUserMetric({ label, hint, value, icon }: { label: string; hint: string; value: number; icon: string; accent: string }) {
  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft" interactive>
      <div className="absolute inset-x-0 top-0 h-1 bg-ase-brand/80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{value.toLocaleString()}</div>
          <div className="mt-2 text-xs text-ase-text2">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">{icon}</div>
      </div>
    </Card>
  )
}

function UserPremiumCard({
  user,
  t,
  catalogStat,
  onEdit,
  onDelete,
  onImpersonate,
}: {
  user: User
  t: (k: string) => string
  catalogStat?: MemberCatalogStat
  onEdit: () => void
  onDelete: () => void
  onImpersonate?: () => void
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-ase-brand/20">
      <div className="relative flex items-start justify-between gap-4">
        <UserIdentity user={user} />
        {renderStatusBadge(t, user.status ?? null)}
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MiniUserMetric label={t('usersPage.premium.cards.identity') as string} value={displayName(user)} />
        <MiniUserMetric label={t('usersPage.premium.cards.accessState') as string} value={t(`usersPage.status.${user.status}`) as string} />
        <MiniUserMetric label={t('usersPage.premium.cards.joined') as string} value={fmtDate(user.created_at)} />
        <MiniUserMetric
          label={t('usersPage.premium.cards.verification') as string}
          value={(user.email_verified_at ? t('usersPage.premium.cards.verified') : t('usersPage.premium.cards.pending')) as string}
        />
        {catalogStat ? (
          <>
            <MiniUserMetric
              label={t('organizationWorkspace.memberStats.columnSent') as string}
              value={String(catalogStat.sentCount)}
            />
            <MiniUserMetric
              label={t('organizationWorkspace.memberStats.columnConsumed') as string}
              value={String(catalogStat.consumedCount)}
            />
          </>
        ) : null}
      </div>
      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          {t('usersPage.premium.actions.viewProfile')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {t('usersPage.actions.edit')}
        </Button>
        <Button size="sm" variant="outline" className="border-ase-error/30" onClick={onDelete}>
          {t('usersPage.actions.delete')}
        </Button>
        {onImpersonate ? (
          <Button size="sm" variant="ghost" onClick={onImpersonate}>
            <LogIn className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('impersonation.action')}
          </Button>
        ) : null}
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
  invitedCount,
  suspendedCount,
  onCreate,
}: {
  t: (k: string) => string
  items: User[]
  activeCount: number
  invitedCount: number
  suspendedCount: number
  onCreate: () => void
}) {
  const recent = [...items].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 3)
  const attention = items.filter((u) => u.status === 'suspended' || !u.email_verified_at)
  const total = Math.max(1, items.length)
  return (
    <aside className="space-y-6">
      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ase-text">{t('usersPage.premium.insights.title')}</h2>
          <Button size="sm" onClick={onCreate}>{t('usersPage.premium.actions.create')}</Button>
        </div>
        <div className="mt-6 space-y-6">
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{t('usersPage.premium.insights.lifecycle')}</div>
            <div className="mt-3 space-y-3">
              <InsightBar label={t('usersPage.status.active') as string} value={activeCount} total={total} />
              <InsightBar label={t('usersPage.premium.cards.verification') as string} value={invitedCount} total={total} />
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
        <div className="h-full rounded-full bg-ase-brand/80" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

function CreateUserForm({
  t,
  form,
  statusOptions,
  createMutation,
}: {
  t: (k: string) => string
  form: UseFormReturn<CreateValues>
  statusOptions: Array<{ value: UserStatus; label: string }>
  createMutation: {
    mutate: (payload: Parameters<typeof createUser>[0]) => void
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
          plain_password: values.plain_password,
          first_name: values.first_name || null,
          last_name: values.last_name || null,
          display_name: values.display_name || null,
          status: values.status,
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
        <Input type="password" placeholder={t('usersPage.create.placeholders.temporaryPassword') as string} {...form.register('plain_password')} />
        {form.formState.errors.plain_password && <p className="mt-1 text-sm text-ase-error">{form.formState.errors.plain_password.message}</p>}
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
        <label className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.status')}</label>
        <Select {...form.register('status')}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>
      {createMutation.isError && <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">{t('usersPage.create.error')}</div>}
      <Button type="submit" className="w-full" disabled={createMutation.isPending} leftIcon={<span className="text-xs">+</span>}>
        {createMutation.isPending ? t('usersPage.create.creating') : t('usersPage.create.button')}
      </Button>
    </form>
  )
}

