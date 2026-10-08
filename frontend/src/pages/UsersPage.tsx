import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Download, LogIn } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { getMemberCatalogStats, type MemberCatalogStat } from '../api/orgCatalog.api'
import { activateUser, createUser, deleteUser, impersonateUser, listUsers, updateUser } from '../api/users.api'
import { UserStatsModal } from '../components/admin/UserStatsModal'
import { AdminEyebrow, AdminHeroHalo } from '../components/admin/premium/PremiumHero'
import { ADMIN_HERO_SECTION, ADMIN_HERO_SUBTITLE, ADMIN_HERO_TITLE } from '../components/admin/premium/adminHeroStyles'
import { MemberCatalogStatsModal } from '../components/organization/MemberCatalogStatsModal'
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
import { Can } from '../rbac/Can'
import { useRbac } from '../rbac/useRbac'
import type { User, UserStatus, UserUpdateRequest } from '../types/user.types'
import { downloadCsv } from '../utils/csv'
import { passwordSchema } from '../utils/passwordPolicy'
import { CreateUserForm, IdentityOrb, MiniUserMetric, PremiumUserMetric, UserIdentity, UserPremiumCard, UsersInsightsPanel } from './UsersPage.parts'
import { displayName, fmtDate, renderStatusBadge, twoFactorStatusLabel, type CreateValues, type EditValues, type UsersViewMode } from './UsersPage.utils'


export function UsersPage() {
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const navigate = useNavigate()
  const auth = useAuth()
  const { currentUser } = auth
  const { hasPermission } = useRbac()
  const [editing, setEditing] = useState<User | null>(null)
  const [viewing, setViewing] = useState<User | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null)
  const [confirmImpersonate, setConfirmImpersonate] = useState<User | null>(null)
  const [activateFor, setActivateFor] = useState<User | null>(null)
  const [activateDays, setActivateDays] = useState(30)
  const [statsForUser, setStatsForUser] = useState<User | null>(null)
  const [createOpen, setCreateOpen] = useState<boolean>(false)
  const [verificationSentEmail, setVerificationSentEmail] = useState<string | null>(null)
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
        plain_password: passwordSchema({
          tooShort: t('usersPage.errors.passwordMin') as string,
          tooLong: t('password.tooLong') as string,
          weak: t('password.weak') as string,
        }),
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
        plain_password: z
          .literal('')
          .or(
            passwordSchema({
              tooShort: t('usersPage.errors.passwordMin') as string,
              tooLong: t('password.tooLong') as string,
              weak: t('password.weak') as string,
            }),
          )
          .optional(),
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
    // Backend requires purchases.read_all for this endpoint — checking it
    // here too (not just hiding the "Ver estadísticas" button via <Can>
    // below) means a role that reaches /users via users.read but doesn't
    // also hold purchases.read_all never fires the request in the first
    // place, instead of getting a 403 back for a widget it can't see anyway.
    enabled: !isSuperAdmin && hasPermission('purchases.read_all'),
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
    onSuccess: async (_data, variables) => {
      createForm.reset({
        email: '',
        plain_password: '',
        first_name: '',
        last_name: '',
        display_name: '',
        status: 'active',
      })
      setCreateOpen(false)
      setVerificationSentEmail(variables.email)
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

  const activateMutation = useMutation({
    mutationFn: ({ user_uuid, days }: { user_uuid: string; days: number }) => activateUser(user_uuid, days),
    onSuccess: async () => {
      setActivateFor(null)
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
      <section className={ADMIN_HERO_SECTION}>
        <AdminHeroHalo accent="cyan" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
          <div>
            <AdminEyebrow accent="cyan" className="mb-4">{t('usersPage.premium.badge')}</AdminEyebrow>
            <h1 className={ADMIN_HERO_TITLE}>{t('usersPage.title')}</h1>
            <p className={ADMIN_HERO_SUBTITLE}>{t('usersPage.subtitle')}</p>
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

          <Card className="rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft">
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
          <Card className="rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft">
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
              <Skeleton className="h-56 rounded-3xl" />
              <Skeleton className="h-56 rounded-3xl" />
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
                  onView={() => setViewing(u)}
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
                  onViewStats={isSuperAdmin ? () => setStatsForUser(u) : undefined}
                  onActivate={
                    u.status !== 'active'
                      ? () => {
                          setActivateDays(30)
                          setActivateFor(u)
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border-white/10 bg-ase-surface p-0 shadow-soft">
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
                          {u.status !== 'active' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setActivateDays(30)
                                setActivateFor(u)
                              }}
                            >
                              {t('usersPage.actions.activate')}
                            </Button>
                          ) : null}
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
                          {isSuperAdmin ? (
                            <Button size="sm" variant="ghost" onClick={() => setStatsForUser(u)} title={t('usersPage.actions.viewStats') as string}>
                              <BarChart3 className="h-4 w-4" strokeWidth={1.75} />
                            </Button>
                          ) : null}
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
          <div className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-ase-bg2 p-6 shadow-soft sm:p-8">
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
        open={!!viewing}
        title={viewing ? displayName(viewing) : ''}
        closeLabel={t('usersPage.edit.cancel')}
        onClose={() => setViewing(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              onClick={() => {
                const u = viewing
                if (!u) return
                setViewing(null)
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
          </div>
        }
      >
        {viewing ? (
          <div className="grid grid-cols-2 gap-3">
            <MiniUserMetric label={t('usersPage.create.fields.email') as string} value={viewing.email} />
            <MiniUserMetric label={t('usersPage.premium.cards.identity') as string} value={displayName(viewing)} />
            <MiniUserMetric label={t('usersPage.premium.cards.accessState') as string} value={t(`usersPage.status.${viewing.status}`) as string} />
            <MiniUserMetric label={t('usersPage.premium.cards.joined') as string} value={fmtDate(viewing.created_at)} />
            <MiniUserMetric
              label={t('usersPage.premium.cards.verification') as string}
              value={(viewing.email_verified_at ? t('usersPage.premium.cards.verified') : t('usersPage.premium.cards.pending')) as string}
            />
            <MiniUserMetric label="2FA" value={twoFactorStatusLabel(t, viewing)} />
          </div>
        ) : null}
      </Modal>

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
            <label htmlFor="user-edit-email" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.email')}</label>
            <Input id="user-edit-email" placeholder={t('usersPage.create.placeholders.email') as string} {...editForm.register('email')} />
          </div>
          <div>
            <label htmlFor="user-edit-password" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.temporaryPassword')}</label>
            <Input id="user-edit-password" type="password" placeholder={t('usersPage.edit.optionalPassword') as string} {...editForm.register('plain_password')} />
            {editForm.formState.errors.plain_password && (
              <p className="mt-1 text-sm text-ase-error">{editForm.formState.errors.plain_password.message}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="user-edit-first-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.firstName')}</label>
              <Input id="user-edit-first-name" placeholder={t('usersPage.create.placeholders.firstName') as string} {...editForm.register('first_name')} />
            </div>
            <div>
              <label htmlFor="user-edit-last-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.lastName')}</label>
              <Input id="user-edit-last-name" placeholder={t('usersPage.create.placeholders.lastName') as string} {...editForm.register('last_name')} />
            </div>
          </div>
          <div>
            <label htmlFor="user-edit-display-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.displayName')}</label>
            <Input id="user-edit-display-name" placeholder={t('usersPage.create.placeholders.displayName') as string} {...editForm.register('display_name')} />
          </div>
          <div>
            <label htmlFor="user-edit-status" className="mb-1 block text-xs font-medium text-ase-muted">{t('usersPage.create.fields.status')}</label>
            <Select id="user-edit-status" {...editForm.register('status')}>
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

      <Modal
        open={!!activateFor}
        title={t('usersPage.activateModal.title') as string}
        closeLabel={t('usersPage.delete.cancel')}
        onClose={() => setActivateFor(null)}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="primary"
              disabled={activateMutation.isPending || activateDays < 1}
              onClick={() => {
                if (!activateFor) return
                activateMutation.mutate({ user_uuid: activateFor.uuid, days: activateDays })
              }}
            >
              {activateMutation.isPending ? t('usersPage.activateModal.activating') : t('usersPage.activateModal.confirm')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ase-text">
            {String(t('usersPage.activateModal.body')).replace('{{email}}', activateFor?.email ?? '')}
          </p>
          <div>
            <label htmlFor="activate-2fa-days" className="mb-1 block text-xs font-medium text-ase-muted">
              {t('usersPage.activateModal.daysLabel')}
            </label>
            <Input
              id="activate-2fa-days"
              type="number"
              min={1}
              max={365}
              value={activateDays}
              onChange={(e) => setActivateDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
            />
            <p className="mt-1 text-xs text-ase-muted">{t('usersPage.activateModal.daysHint')}</p>
          </div>
          {activateMutation.isError && (
            <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
              {t('usersPage.activateModal.error')}
            </div>
          )}
        </div>
      </Modal>

      <MemberCatalogStatsModal open={statsOpen} onClose={() => setStatsOpen(false)} />

      <UserStatsModal user={statsForUser} onClose={() => setStatsForUser(null)} />

      {verificationSentEmail ? (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm rounded-2xl border border-emerald-300/25 bg-ase-bg2 p-4 text-sm text-emerald-100 shadow-soft">
          {String(t('usersPage.create.verificationSent')).replace('{{email}}', verificationSentEmail)}
          <button
            type="button"
            className="ml-3 text-ase-muted hover:text-ase-text"
            onClick={() => setVerificationSentEmail(null)}
          >
            ×
          </button>
        </div>
      ) : null}
    </div>
  )
}
