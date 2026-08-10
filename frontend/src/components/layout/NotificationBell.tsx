import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getUnreadNotificationCount,
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications.api'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

export function NotificationBell() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 45000,
  })

  const listQuery = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => listMyNotifications({ limit: 15 }),
    enabled: open,
  })

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    await qc.invalidateQueries({ queryKey: ['notifications-list'] })
  }

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  })

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const unread = unreadQuery.data ?? 0
  const items = listQuery.data?.items ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications.bellLabel') as string}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-ase-text2 transition hover:text-ase-text"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/10 bg-ase-bg2 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('notifications.title')}</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="text-xs font-semibold text-ase-primary hover:underline"
              >
                {t('notifications.markAllRead')}
              </button>
            ) : null}
          </div>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="px-2 py-4 text-center text-xs text-ase-muted">…</div>
            ) : items.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-ase-muted">{t('notifications.empty')}</div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id)
                    setOpen(false)
                    if (n.link) navigate(n.link)
                  }}
                  className={cn(
                    'block w-full rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.04]',
                    !n.is_read && 'bg-white/[0.03]',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', !n.is_read && 'bg-ase-primary')} />
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-medium text-ase-text">{n.title}</div>
                      {n.body ? <div className="mt-0.5 line-clamp-2 text-xs text-ase-muted">{n.body}</div> : null}
                      <div className="mt-1 text-[11px] text-ase-muted">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
