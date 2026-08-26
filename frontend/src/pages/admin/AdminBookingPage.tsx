import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { adminCreateSlots, adminDeleteSlot, adminListSlots, type ConsultingSlotAdmin } from '../../api/booking.api'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useI18n } from '../../i18n'

function statusTone(status: string): 'success' | 'warning' | 'default' {
  if (status === 'booked') return 'success'
  if (status === 'cancelled') return 'default'
  return 'warning'
}

export function AdminBookingPage() {
  const { t, language } = useI18n()
  const queryClient = useQueryClient()
  const [times, setTimes] = useState<string[]>([''])
  const [duration, setDuration] = useState(30)

  const listQuery = useQuery({ queryKey: ['admin-booking-slots'], queryFn: adminListSlots, staleTime: 15_000 })

  const createMutation = useMutation({
    mutationFn: () => {
      const isoList = times.filter(Boolean).map((v) => new Date(v).toISOString())
      return adminCreateSlots(isoList, duration)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] })
      setTimes([''])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => adminDeleteSlot(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-booking-slots'] }),
  })

  const slots: ConsultingSlotAdmin[] = listQuery.data ?? []

  return (
    <div className="space-y-8">
      <PremiumHero
        accent="cyan"
        badge={t('adminBookingPage.heroBadge') as string}
        title={t('adminBookingPage.title') as string}
        subtitle={t('adminBookingPage.subtitle') as string}
      />

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-ase-text">{t('adminBookingPage.create.title') as string}</h2>
        <p className="mb-4 max-w-2xl text-sm text-ase-text2">{t('adminBookingPage.create.hint') as string}</p>

        <div className="space-y-2">
          {times.map((v, idx) => (
            <input
              key={idx}
              type="datetime-local"
              value={v}
              onChange={(e) =>
                setTimes((prev) => prev.map((p, i) => (i === idx ? e.target.value : p)))
              }
              className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ase-text focus:border-ase-brand/40 focus:outline-none"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTimes((prev) => [...prev, ''])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-ase-text2 transition hover:border-ase-brand/40 hover:text-ase-text"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('adminBookingPage.create.addTime') as string}
        </button>

        <div className="mt-4 flex items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-ase-muted" htmlFor="booking-duration">
              {t('adminBookingPage.create.duration') as string}
            </label>
            <input
              id="booking-duration"
              type="number"
              min={15}
              max={240}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-ase-text focus:border-ase-brand/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || times.every((v) => !v)}
            className="rounded-xl bg-ase-brand px-4 py-2 text-sm font-semibold text-ase-bg transition hover:brightness-110 disabled:opacity-50"
          >
            {createMutation.isPending ? (t('adminBookingPage.create.submitting') as string) : (t('adminBookingPage.create.submit') as string)}
          </button>
        </div>
        {createMutation.isError ? <p className="mt-3 text-sm text-red-400">{t('adminBookingPage.create.error') as string}</p> : null}
      </Card>

      <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-ase-text">{t('adminBookingPage.list.title') as string}</h2>
        {listQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-2xl" />
        ) : listQuery.isError ? (
          <EmptyState title={t('adminBookingPage.list.loadError') as string} description="" />
        ) : slots.length === 0 ? (
          <EmptyState title={t('adminBookingPage.list.empty') as string} description="" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs font-semibold uppercase tracking-wide text-ase-muted">
                  <th className="pb-3 pr-4">{t('adminBookingPage.list.columns.date') as string}</th>
                  <th className="pb-3 pr-4">{t('adminBookingPage.list.columns.duration') as string}</th>
                  <th className="pb-3 pr-4">{t('adminBookingPage.list.columns.status') as string}</th>
                  <th className="pb-3 pr-4">{t('adminBookingPage.list.columns.bookedBy') as string}</th>
                  <th className="pb-3 pr-4">{t('adminBookingPage.list.columns.notes') as string}</th>
                  <th className="pb-3">{t('adminBookingPage.list.columns.actions') as string}</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.uuid} className="border-b border-white/[0.05] text-ase-text2">
                    <td className="py-3 pr-4 tabular-nums">
                      {new Date(slot.starts_at).toLocaleString(language === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'UTC' })}
                    </td>
                    <td className="py-3 pr-4">{slot.duration_minutes} min</td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusTone(slot.status)}>
                        {(t(`adminBookingPage.list.status.${slot.status}`) as string) || slot.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {slot.booked_by_name || slot.booked_by_email ? `${slot.booked_by_name ?? ''} ${slot.booked_by_email ? `(${slot.booked_by_email})` : ''}`.trim() : '—'}
                    </td>
                    <td className="max-w-[220px] truncate py-3 pr-4" title={slot.notes ?? ''}>{slot.notes ?? '—'}</td>
                    <td className="py-3">
                      {slot.status === 'open' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('adminBookingPage.list.deleteConfirm') as string)) {
                              deleteMutation.mutate(slot.uuid)
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-ase-text2 transition hover:border-red-400/40 hover:text-red-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('adminBookingPage.list.delete') as string}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {deleteMutation.isError ? <p className="mt-3 text-sm text-red-400">{t('adminBookingPage.list.deleteError') as string}</p> : null}
      </Card>
    </div>
  )
}
