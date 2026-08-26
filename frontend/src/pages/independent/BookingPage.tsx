import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Clock3 } from 'lucide-react'
import { bookSlot, cancelMyBooking, listAvailableSlots, listMyBookings, type ConsultingSlot } from '../../api/booking.api'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'

function formatSlot(iso: string, language: string): string {
  const d = new Date(iso)
  return d.toLocaleString(language === 'en' ? 'en-GB' : 'es-ES', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  })
}

function statusTone(status: string): 'success' | 'warning' | 'default' {
  if (status === 'booked') return 'success'
  if (status === 'cancelled') return 'default'
  return 'warning'
}

export function BookingPage() {
  const { t, language } = useI18n()
  const queryClient = useQueryClient()
  const [notesBySlot, setNotesBySlot] = useState<Record<string, string>>({})

  const availableQuery = useQuery({ queryKey: ['booking-available-slots'], queryFn: listAvailableSlots, staleTime: 30_000 })
  const myBookingsQuery = useQuery({ queryKey: ['booking-my-bookings'], queryFn: listMyBookings, staleTime: 30_000 })

  const bookMutation = useMutation({
    mutationFn: ({ uuid, notes }: { uuid: string; notes?: string }) => bookSlot(uuid, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-available-slots'] })
      queryClient.invalidateQueries({ queryKey: ['booking-my-bookings'] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (uuid: string) => cancelMyBooking(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-available-slots'] })
      queryClient.invalidateQueries({ queryKey: ['booking-my-bookings'] })
    },
  })

  const availableSlots: ConsultingSlot[] = availableQuery.data ?? []
  const myBookings: ConsultingSlot[] = myBookingsQuery.data ?? []

  return (
    <div className="space-y-8">
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 -top-10 h-64 opacity-70"
          style={{ background: 'radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_46%)' }}
        />
        <PremiumHero
          accent="cyan"
          badge={t('bookingPage.heroBadge') as string}
          title={t('bookingPage.title') as string}
          subtitle={t('bookingPage.subtitle') as string}
        />
      </div>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-ase-text">{t('bookingPage.available.title') as string}</h2>
        <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('bookingPage.available.hint') as string}</p>

        {availableQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : availableQuery.isError ? (
          <EmptyState title={t('bookingPage.available.loadError') as string} description="" />
        ) : availableSlots.length === 0 ? (
          <EmptyState title={t('bookingPage.available.empty') as string} description="" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {availableSlots.map((slot, idx) => (
              <div
                key={slot.uuid}
                className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-1 hover:border-ase-brand/30 hover:shadow-glow-cyan"
                style={{ animationDelay: `${Math.min(idx, 10) * 60}ms` }}
              >
                <div className="flex items-center gap-2 text-ase-text">
                  <CalendarClock className="h-4 w-4 text-ase-brand" />
                  <span className="font-medium">{formatSlot(slot.starts_at, language)}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-ase-muted">
                  <Clock3 className="h-3.5 w-3.5" />
                  {slot.duration_minutes} min
                </div>
                <textarea
                  value={notesBySlot[slot.uuid] ?? ''}
                  onChange={(e) => setNotesBySlot((prev) => ({ ...prev, [slot.uuid]: e.target.value }))}
                  placeholder={t('bookingPage.available.notesPlaceholder') as string}
                  rows={2}
                  className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ase-text placeholder:text-ase-muted focus:border-ase-brand/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => bookMutation.mutate({ uuid: slot.uuid, notes: notesBySlot[slot.uuid] })}
                  disabled={bookMutation.isPending}
                  className="mt-3 w-full rounded-xl bg-ase-brand px-4 py-2 text-sm font-semibold text-ase-bg transition hover:brightness-110 disabled:opacity-50"
                >
                  {bookMutation.isPending ? (t('bookingPage.available.booking') as string) : (t('bookingPage.available.book') as string)}
                </button>
              </div>
            ))}
          </div>
        )}
        {bookMutation.isError ? <p className="mt-3 text-sm text-red-400">{t('bookingPage.available.bookError') as string}</p> : null}
      </Card>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-ase-text">{t('bookingPage.mine.title') as string}</h2>
        {myBookingsQuery.isLoading ? (
          <Skeleton className="h-16 w-full rounded-2xl" />
        ) : myBookingsQuery.isError ? (
          <EmptyState title={t('bookingPage.mine.loadError') as string} description="" />
        ) : myBookings.length === 0 ? (
          <EmptyState title={t('bookingPage.mine.empty') as string} description="" />
        ) : (
          <div className="space-y-3">
            {myBookings.map((booking) => (
              <div key={booking.uuid} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <div className="font-medium text-ase-text">{formatSlot(booking.starts_at, language)}</div>
                  {booking.notes ? <div className="mt-1 text-xs text-ase-muted">{booking.notes}</div> : null}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusTone(booking.status)}>
                    {(t(`bookingPage.mine.status.${booking.status}`) as string) || booking.status}
                  </Badge>
                  {booking.status === 'booked' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(t('bookingPage.mine.cancelConfirm') as string)) {
                          cancelMutation.mutate(booking.uuid)
                        }
                      }}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ase-text2 transition hover:border-red-400/40 hover:text-red-300"
                    >
                      {t('bookingPage.mine.cancel') as string}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
        {cancelMutation.isError ? <p className="mt-3 text-sm text-red-400">{t('bookingPage.mine.cancelError') as string}</p> : null}
      </Card>
    </div>
  )
}
