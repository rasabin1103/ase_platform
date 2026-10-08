import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BellOff, Check, Trash2 } from 'lucide-react'
import {
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
  type DigestFrequency,
  type MuteDuration,
  type NotificationCategoryKey,
  type NotificationPreferencesUpdate,
} from '../api/notifications.api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Switch } from '../components/ui/Switch'
import { cn } from '../components/ui/cn'
import { usePageTitle } from '../hooks/usePageTitle'
import { useI18n } from '../i18n'

const CATEGORY_ORDER: NotificationCategoryKey[] = [
  'catalog',
  'jobs',
  'blog',
  'organization',
  'rewards',
  'announcements',
  'account',
]
const PAGE_SIZE = 20
const MUTE_OPTIONS: MuteDuration[] = ['off', '1h', '8h', '1d', '7d', 'forever']
const DIGEST_OPTIONS: DigestFrequency[] = ['off', 'daily', 'weekly']
// Shared with NotificationBell so both stay in sync after any change here.
const INVALIDATE_KEYS = [['notifications-unread-count'], ['notifications-list'], ['notifications-page']]

function InboxTab() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [category, setCategory] = useState<NotificationCategoryKey | 'all'>('all')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const query = useQuery({
    queryKey: ['notifications-page', category, unreadOnly, limit],
    queryFn: () =>
      listMyNotifications({
        limit,
        category: category === 'all' ? undefined : category,
        unread_only: unreadOnly || undefined,
      }),
  })

  const refresh = () => Promise.all(INVALIDATE_KEYS.map((queryKey) => qc.invalidateQueries({ queryKey })))
  const readMut = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh })
  const readAllMut = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh })
  const deleteMut = useMutation({ mutationFn: deleteNotification, onSuccess: refresh })
  const deleteReadMut = useMutation({ mutationFn: deleteReadNotifications, onSuccess: refresh })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const unread = query.data?.unread_count ?? 0

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...CATEGORY_ORDER] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setCategory(key)
              setLimit(PAGE_SIZE)
            }}
            aria-pressed={category === key}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition',
              category === key
                ? 'border-ase-primary/40 bg-ase-primary/15 text-ase-text'
                : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:text-ase-text',
            )}
          >
            {key === 'all' ? t('notificationsPage.inbox.all') : t(`notificationsPage.categories.${key}.label`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-ase-text2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked)
              setLimit(PAGE_SIZE)
            }}
          />
          {t('notificationsPage.inbox.unreadOnly')}
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Check className="h-3.5 w-3.5" strokeWidth={1.75} />}
            disabled={unread === 0 || readAllMut.isPending}
            onClick={() => readAllMut.mutate()}
          >
            {t('notificationsPage.inbox.markAllRead')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
            disabled={deleteReadMut.isPending}
            onClick={() => deleteReadMut.mutate()}
          >
            {t('notificationsPage.inbox.deleteRead')}
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : query.isError ? (
        <EmptyState title={t('private.common.couldNotLoad') as string} description={t('catalog.loadError') as string} />
      ) : items.length === 0 ? (
        <EmptyState
          title={t('notificationsPage.inbox.empty') as string}
          description={t('notificationsPage.inbox.emptyHint') as string}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Card className={cn('flex items-start gap-3 p-3', !n.is_read && 'border-ase-primary/25 bg-white/[0.04]')}>
                <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', !n.is_read && 'bg-ase-primary')} />
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    if (!n.is_read) readMut.mutate(n.id)
                    if (n.link) navigate(n.link)
                  }}
                >
                  <div className="text-sm font-semibold text-ase-text">{n.title}</div>
                  {n.body ? <div className="mt-0.5 text-sm text-ase-text2">{n.body}</div> : null}
                  <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-ase-muted">
                    <span>{t(`notificationsPage.categories.${n.category}.label`)}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label={t('notificationsPage.inbox.delete') as string}
                  title={t('notificationsPage.inbox.delete') as string}
                  onClick={() => deleteMut.mutate(n.id)}
                  className="rounded-lg p-2 text-ase-muted transition hover:bg-white/[0.06] hover:text-ase-text"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {items.length < total ? (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            {t('notificationsPage.inbox.loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SettingsTab() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: ['notification-preferences'], queryFn: getNotificationPreferences })

  const mutation = useMutation({
    mutationFn: (payload: NotificationPreferencesUpdate) => updateNotificationPreferences(payload),
    onSuccess: (data) => qc.setQueryData(['notification-preferences'], data),
  })

  if (query.isLoading || !query.data) return <Skeleton className="h-64 w-full rounded-2xl" />
  const prefs = query.data
  const byKey = new Map(prefs.categories.map((c) => [c.key, c]))

  const muteStatus = !prefs.is_muted
    ? t('notificationsPage.settings.notMuted')
    : prefs.muted_until && new Date(prefs.muted_until).getFullYear() > 2100
      ? t('notificationsPage.settings.mutedForever')
      : String(t('notificationsPage.settings.mutedUntil')).replace(
          '{date}',
          prefs.muted_until ? new Date(prefs.muted_until).toLocaleString() : '',
        )

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ase-text">
          <BellOff className="h-4 w-4" strokeWidth={1.75} />
          {t('notificationsPage.settings.muteTitle')}
        </div>
        <p className="text-sm text-ase-text2">{t('notificationsPage.settings.muteHint')}</p>
        <p className={cn('text-sm font-medium', prefs.is_muted ? 'text-amber-300' : 'text-ase-muted')}>{muteStatus}</p>
        <div className="max-w-xs">
          <Select
            aria-label={t('notificationsPage.settings.muteTitle') as string}
            value=""
            disabled={mutation.isPending}
            onChange={(e) => {
              if (e.target.value) mutation.mutate({ mute: e.target.value as MuteDuration })
            }}
          >
            <option value="">—</option>
            {MUTE_OPTIONS.filter((o) => (prefs.is_muted ? true : o !== 'off')).map((o) => (
              <option key={o} value={o}>
                {t(`notificationsPage.settings.muteOptions.${o}`)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold text-ase-text">{t('notificationsPage.settings.categoriesTitle')}</div>
        <p className="mt-1 text-sm text-ase-text2">{t('notificationsPage.settings.categoriesHint')}</p>
        <ul className="mt-3 divide-y divide-white/10">
          {CATEGORY_ORDER.map((key) => {
            const c = byKey.get(key)
            if (!c) return null
            return (
              <li key={key} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[220px] flex-1">
                  <div className="text-sm font-semibold text-ase-text">{t(`notificationsPage.categories.${key}.label`)}</div>
                  <div className="text-xs text-ase-muted">{t(`notificationsPage.categories.${key}.description`)}</div>
                </div>
                {c.mandatory ? (
                  <span className="text-xs font-semibold text-ase-muted">{t('notificationsPage.settings.alwaysOn')}</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Switch
                      checked={c.in_app}
                      label={t('notificationsPage.settings.inApp') as string}
                      disabled={mutation.isPending}
                      onCheckedChange={(next) => mutation.mutate({ categories: { [key]: { in_app: next } } })}
                    />
                    <Switch
                      checked={c.email}
                      label={t('notificationsPage.settings.email') as string}
                      disabled={mutation.isPending}
                      onCheckedChange={(next) => mutation.mutate({ categories: { [key]: { email: next } } })}
                    />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card className="space-y-2 p-4">
        <div className="text-sm font-semibold text-ase-text">{t('notificationsPage.settings.digestTitle')}</div>
        <p className="text-sm text-ase-text2">{t('notificationsPage.settings.digestHint')}</p>
        <div className="max-w-xs">
          <Select
            aria-label={t('notificationsPage.settings.digestTitle') as string}
            value={prefs.digest_frequency}
            disabled={mutation.isPending}
            onChange={(e) => mutation.mutate({ digest_frequency: e.target.value as DigestFrequency })}
          >
            {DIGEST_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {t(`notificationsPage.settings.digest.${o}`)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <p role="status" className="min-h-5 text-sm text-ase-muted">
        {mutation.isError
          ? t('notificationsPage.settings.saveError')
          : mutation.isSuccess
            ? t('notificationsPage.settings.saved')
            : ''}
      </p>
    </div>
  )
}

export function NotificationsPage() {
  const { t } = useI18n()
  usePageTitle(t('notificationsPage.title') as string)
  const [tab, setTab] = useState<'inbox' | 'settings'>('inbox')

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ase-text">{t('notificationsPage.title')}</h1>
        <p className="mt-1 text-sm text-ase-text2">{t('notificationsPage.subtitle')}</p>
      </div>
      <div role="tablist" className="flex gap-2 border-b border-white/10">
        {(['inbox', 'settings'] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition',
              tab === key ? 'border-ase-primary text-ase-text' : 'border-transparent text-ase-muted hover:text-ase-text',
            )}
          >
            {t(`notificationsPage.tabs.${key}`)}
          </button>
        ))}
      </div>
      {tab === 'inbox' ? <InboxTab /> : <SettingsTab />}
    </div>
  )
}
