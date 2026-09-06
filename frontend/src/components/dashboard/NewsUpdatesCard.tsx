import { Megaphone } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listMyNotifications, markNotificationRead } from '../../api/notifications.api'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

/** "What's new" — the same notifications feed the header bell reads from
 * (see NotificationBell.tsx), surfaced as a standing dashboard section
 * instead of something the user has to remember to click open. Covers both
 * platform-wide announcements (see AdminAnnouncementsPage) and any other
 * notification type already wired into app/modules/notifications. Renders
 * nothing while there's genuinely nothing to show, same as the other
 * dashboard strips. */
export function NewsUpdatesCard() {
  const { t } = useI18n()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications-list', 'dashboard'],
    queryFn: () => listMyNotifications({ limit: 3 }),
    staleTime: 30_000,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
      await qc.invalidateQueries({ queryKey: ['notifications-list'] })
    },
  })

  const items = query.data?.items ?? []

  if (!query.isLoading && items.length === 0) return null

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Megaphone className="h-4 w-4 text-ase-brand" strokeWidth={1.75} />
        <Eyebrow>{t('independentDashboard.news.badge')}</Eyebrow>
      </div>
      {query.isLoading ? (
        <div className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn('flex items-start gap-2.5 rounded-xl px-2.5 py-2', !n.is_read && 'bg-white/[0.03]')}
              onClick={() => {
                if (!n.is_read) markReadMutation.mutate(n.id)
              }}
            >
              <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', !n.is_read ? 'bg-ase-brand' : 'bg-ase-muted/50')} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ase-text">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-ase-text2 line-clamp-2">{n.body}</p> : null}
                <p className="mt-1 text-[11px] text-ase-muted">{new Date(n.created_at).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
