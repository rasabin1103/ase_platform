import { BarChart3, LogIn } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { type MemberCatalogStat } from '../api/orgCatalog.api'
import { createUser } from '../api/users.api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { cn } from '../components/ui/cn'
import type { User, UserStatus } from '../types/user.types'
import {
  displayName,
  fmtDate,
  friendlyCreateUserError,
  initials,
  renderStatusBadge,
  twoFactorStatusLabel,
  type CreateValues,
} from './UsersPage.utils'

export function UserIdentity({ user }: { user: User }) {
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

export function IdentityOrb({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'info' | 'warning'
}) {
  const toneClass =
    tone === 'success' ? 'border-emerald-300/20' : tone === 'warning' ? 'border-amber-300/20' : 'border-white/10'
  return (
    <div className={cn('rounded-3xl border bg-ase-bg2/60 p-4 text-center shadow-soft', toneClass)}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
    </div>
  )
}

export function PremiumUserMetric({
  label,
  hint,
  value,
  icon,
}: {
  label: string
  hint: string
  value: number
  icon: string
  accent: string
}) {
  return (
    <Card
      className="relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft"
      interactive
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-ase-brand/80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{value.toLocaleString()}</div>
          <div className="mt-2 text-xs text-ase-text2">{hint}</div>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function UserPremiumCard({
  user,
  t,
  catalogStat,
  onView,
  onEdit,
  onDelete,
  onImpersonate,
  onViewStats,
  onActivate,
}: {
  user: User
  t: (k: string) => string
  catalogStat?: MemberCatalogStat
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onImpersonate?: () => void
  onViewStats?: () => void
  onActivate?: () => void
}) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-ase-brand/20">
      <div className="relative flex items-start justify-between gap-4">
        <UserIdentity user={user} />
        {renderStatusBadge(t, user.status ?? null)}
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <MiniUserMetric label={t('usersPage.premium.cards.identity') as string} value={displayName(user)} />
        <MiniUserMetric
          label={t('usersPage.premium.cards.accessState') as string}
          value={t(`usersPage.status.${user.status}`) as string}
        />
        <MiniUserMetric label={t('usersPage.premium.cards.joined') as string} value={fmtDate(user.created_at)} />
        <MiniUserMetric
          label={t('usersPage.premium.cards.verification') as string}
          value={
            (user.email_verified_at
              ? t('usersPage.premium.cards.verified')
              : t('usersPage.premium.cards.pending')) as string
          }
        />
        <MiniUserMetric label="2FA" value={twoFactorStatusLabel(t, user)} />
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
        {onActivate ? (
          <Button size="sm" onClick={onActivate}>
            {t('usersPage.actions.activate')}
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={onView}>
          {t('usersPage.premium.actions.viewProfile')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          {t('usersPage.actions.edit')}
        </Button>
        <Button size="sm" variant="outline" className="border-ase-error/30" onClick={onDelete}>
          {t('usersPage.actions.delete')}
        </Button>
        {onViewStats ? (
          <Button size="sm" variant="ghost" onClick={onViewStats}>
            <BarChart3 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
            {t('usersPage.actions.viewStats')}
          </Button>
        ) : null}
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

export function MiniUserMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

export function UsersInsightsPanel({
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
      <Card className="rounded-3xl border-white/10 bg-ase-surface p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ase-text">{t('usersPage.premium.insights.title')}</h2>
          <Button size="sm" onClick={onCreate}>
            {t('usersPage.premium.actions.create')}
          </Button>
        </div>
        <div className="mt-6 space-y-6">
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('usersPage.premium.insights.lifecycle')}
            </div>
            <div className="mt-3 space-y-3">
              <InsightBar label={t('usersPage.status.active') as string} value={activeCount} total={total} />
              <InsightBar
                label={t('usersPage.premium.cards.verification') as string}
                value={invitedCount}
                total={total}
              />
              <InsightBar label={t('usersPage.status.suspended') as string} value={suspendedCount} total={total} />
            </div>
          </section>
          <section>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('usersPage.premium.insights.recent')}
            </div>
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
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">
              {t('usersPage.premium.insights.attention')}
            </div>
            <div className="mt-3 space-y-2">
              {(attention.length ? attention.slice(0, 4) : items.slice(0, 1)).map((u) => (
                <div
                  key={u.uuid}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3"
                >
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

export function InsightBar({ label, value, total }: { label: string; value: number; total: number }) {
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

export function CreateUserForm({
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
    error: unknown
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
        <label htmlFor="user-create-email" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('usersPage.create.fields.email')}
        </label>
        <Input
          id="user-create-email"
          placeholder={t('usersPage.create.placeholders.email') as string}
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div>
        <label htmlFor="user-create-password" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('usersPage.create.fields.temporaryPassword')}
        </label>
        <Input
          id="user-create-password"
          type="password"
          placeholder={t('usersPage.create.placeholders.temporaryPassword') as string}
          {...form.register('plain_password')}
        />
        {form.formState.errors.plain_password && (
          <p className="mt-1 text-sm text-ase-error">{form.formState.errors.plain_password.message}</p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="user-create-first-name" className="mb-1 block text-xs font-medium text-ase-muted">
            {t('usersPage.create.fields.firstName')}
          </label>
          <Input
            id="user-create-first-name"
            placeholder={t('usersPage.create.placeholders.firstName') as string}
            {...form.register('first_name')}
          />
        </div>
        <div>
          <label htmlFor="user-create-last-name" className="mb-1 block text-xs font-medium text-ase-muted">
            {t('usersPage.create.fields.lastName')}
          </label>
          <Input
            id="user-create-last-name"
            placeholder={t('usersPage.create.placeholders.lastName') as string}
            {...form.register('last_name')}
          />
        </div>
      </div>
      <div>
        <label htmlFor="user-create-display-name" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('usersPage.create.fields.displayName')}
        </label>
        <Input
          id="user-create-display-name"
          placeholder={t('usersPage.create.placeholders.displayName') as string}
          {...form.register('display_name')}
        />
      </div>
      <div>
        <label htmlFor="user-create-status" className="mb-1 block text-xs font-medium text-ase-muted">
          {t('usersPage.create.fields.status')}
        </label>
        <Select id="user-create-status" {...form.register('status')}>
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>
      {createMutation.isError && (
        <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
          {friendlyCreateUserError(t, createMutation.error)}
        </div>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={createMutation.isPending}
        leftIcon={<span className="text-xs">+</span>}
      >
        {createMutation.isPending ? t('usersPage.create.creating') : t('usersPage.create.button')}
      </Button>
    </form>
  )
}
