import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { downloadFlPdf, getFlTimesheet, saveFlTimesheet } from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { ErrorNote, Field, Stat } from './shared'
import { useFt } from './useFt'

type Mark = 'work' | 'vacation' | 'holiday'

export function CalendarTab() {
  const { ft } = useFt()
  const qc = useQueryClient()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const q = useQuery({ queryKey: ['fl-timesheet', month], queryFn: () => getFlTimesheet(month) })
  const save = useMutation({
    mutationFn: (v: { vacations: string[]; holidays: string[] }) => saveFlTimesheet(month, v),
    onSuccess: (data) => qc.setQueryData(['fl-timesheet', month], data),
  })
  const pdf = useMutation({ mutationFn: () => downloadFlPdf(`/timesheets/${month}/pdf`, `timesheet-${month}.pdf`) })

  const year = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7))
  const days = new Date(year, m, 0).getDate()
  const offset = (new Date(year, m - 1, 1).getDay() + 6) % 7
  const dow = ft('calendar.dow').split(',')
  const vac = new Set(q.data?.vacations ?? [])
  const hol = new Set(q.data?.holidays ?? [])
  const markOf = (iso: string): Mark => (hol.has(iso) ? 'holiday' : vac.has(iso) ? 'vacation' : 'work')

  const cycle = (iso: string) => {
    const next: Record<Mark, Mark> = { work: 'vacation', vacation: 'holiday', holiday: 'work' }
    const to = next[markOf(iso)]
    const v = new Set(vac)
    const h = new Set(hol)
    v.delete(iso)
    h.delete(iso)
    if (to === 'vacation') v.add(iso)
    if (to === 'holiday') h.add(iso)
    save.mutate({ vacations: [...v], holidays: [...h] })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label={ft('common.month')}><Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
        <Button variant="outline" onClick={() => pdf.mutate()} disabled={pdf.isPending}>{ft('calendar.pdf')}</Button>
      </div>
      {q.isLoading ? <Skeleton className="h-64 rounded-2xl" /> : null}
      {q.isError || save.isError ? <ErrorNote error={q.error ?? save.error} /> : null}
      {q.data ? (
        <>
          <p className="text-sm text-ase-muted">{ft('calendar.hint')}</p>
          <div className="grid max-w-xl grid-cols-7 gap-1 text-center text-sm">
            {dow.map((d) => <div key={d} className="py-1 text-xs text-ase-muted">{d}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
            {Array.from({ length: days }, (_, i) => {
              const iso = `${month}-${String(i + 1).padStart(2, '0')}`
              const weekend = (offset + i) % 7 > 4
              const mark = markOf(iso)
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={weekend || save.isPending}
                  onClick={() => cycle(iso)}
                  aria-label={`${iso}: ${mark}`}
                  className={cn(
                    'h-11 rounded-md border border-ase-border text-ase-text2 outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60',
                    weekend && 'cursor-default opacity-40',
                    mark === 'vacation' && 'border-sky-400/40 bg-sky-500/20 text-sky-100',
                    mark === 'holiday' && 'border-amber-400/40 bg-amber-500/20 text-amber-100',
                  )}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label={ft('calendar.weekdays')} value={String(q.data.weekdays)} />
            <Stat label={ft('calendar.vacations')} value={String(q.data.vacations.length)} />
            <Stat label={ft('calendar.holidays')} value={String(q.data.holidays.length)} />
            <Stat strong label={ft('calendar.available')} value={String(q.data.available)} />
          </div>
          <p className="text-xs text-ase-muted">{ft('calendar.disclaimer')}</p>
        </>
      ) : null}
    </div>
  )
}
