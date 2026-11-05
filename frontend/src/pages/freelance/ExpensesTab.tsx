import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  deleteFlExpense, deleteFlRecurring, listFlExpenses, listFlRecurring, saveFlExpense, saveFlRecurring,
  type FlExpenseInput,
} from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { FilterBar, Kpi, Pill } from './kit'
import { ErrorNote, Field } from './shared'
import { num, todayIso, useFt } from './useFt'

const blank = (): FlExpenseInput => ({
  supplier: '', description: '', reference: '', date: todayIso(), base: 0, vat: 21, deductible: 100, vatDeductible: 100, paid: true,
})

type Editing = { id?: number; data: FlExpenseInput; recurring?: { day: number; startDate: string; active: boolean } }

export function ExpensesTab() {
  const { ft, eur } = useFt()
  const qc = useQueryClient()
  const expenses = useQuery({ queryKey: ['fl-expenses'], queryFn: listFlExpenses })
  const rules = useQuery({ queryKey: ['fl-recurring'], queryFn: listFlRecurring })
  const [editing, setEditing] = useState<Editing | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'paid' | 'pending'>('all')
  const [year, setYear] = useState(0)
  const years = useMemo(() => [...new Set((expenses.data ?? []).map((e) => e.date.slice(0, 4)))].sort().reverse(), [expenses.data])
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (expenses.data ?? []).filter((e) => {
      if (year && e.date.slice(0, 4) !== String(year)) return false
      if (status === 'paid' && !e.paid) return false
      if (status === 'pending' && e.paid) return false
      return !needle || `${e.supplier} ${e.description}`.toLowerCase().includes(needle)
    })
  }, [expenses.data, search, status, year])
  const spent = rows.reduce((s, e) => s + e.totalCents, 0)
  const pendingPay = rows.filter((e) => !e.paid).reduce((s, e) => s + e.totalCents, 0)
  const refresh = () => {
    for (const k of ['fl-expenses', 'fl-recurring', 'fl-summary']) void qc.invalidateQueries({ queryKey: [k] })
  }
  const save = useMutation({
    mutationFn: () =>
      editing!.recurring
        ? saveFlRecurring({ expense: editing!.data, ...editing!.recurring }, editing!.id)
        : saveFlExpense(editing!.data, editing!.id),
    onSuccess: () => { setEditing(null); refresh() },
  })
  const del = useMutation({ mutationFn: (id: number) => deleteFlExpense(id), onSuccess: refresh })
  const delRule = useMutation({ mutationFn: (id: number) => deleteFlRecurring(id), onSuccess: refresh })
  const set = (patch: Partial<FlExpenseInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e))

  if (expenses.isLoading) return <Skeleton className="h-40 rounded-2xl" />
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setEditing({ data: blank() })}>{ft('expenses.new')}</Button>
        <Button variant="secondary" onClick={() => setEditing({ data: blank(), recurring: { day: new Date().getDate(), startDate: todayIso(), active: true } })}>
          {ft('expenses.newRecurring')}
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={ft('expenses.count')} value={String(rows.length)} />
        <Kpi label={ft('expenses.totalYear')} value={eur(spent)} />
        <Kpi tone={pendingPay ? 'warn' : 'neutral'} label={ft('expenses.pendingToPay')} value={eur(pendingPay)} />
      </div>
      <FilterBar>
        <div className="min-w-[14rem] flex-1">
          <Field label={ft('common.search')}><Input type="search" placeholder={ft('expenses.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
        </div>
        <Field label={ft('invoices.status')}>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">{ft('expenses.allStatus')}</option>
            <option value="paid">{ft('expenses.paid')}</option>
            <option value="pending">{ft('invoices.pending')}</option>
          </Select>
        </Field>
        <Field label={ft('common.year')}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            <option value={0}>{ft('expenses.allStatus')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </Field>
      </FilterBar>
      {expenses.isError ? <ErrorNote error={expenses.error} /> : null}
      {expenses.data?.length === 0 ? <EmptyState title={ft('common.empty')} /> : null}
      {expenses.data?.length && rows.length === 0 ? <EmptyState title={ft('expenses.noResults')} /> : null}
      <ul className="space-y-2">
        {rows.map((e) => (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ase-border bg-ase-surface p-4 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-ase-text">{e.supplier}</div>
              <div className="text-ase-muted">{e.date} · {e.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-ase-text">{eur(e.totalCents)}</span>
              <Pill tone={e.paid ? 'good' : 'warn'}>{e.paid ? ft('expenses.paid') : ft('invoices.pending')}</Pill>
              <Button size="sm" variant="secondary" onClick={() => setEditing({ id: e.id, data: { ...e } })}>{ft('common.edit')}</Button>
              <Button size="sm" variant="danger" onClick={() => window.confirm(ft('common.confirmDelete')) && del.mutate(e.id)}>{ft('common.delete')}</Button>
            </div>
          </li>
        ))}
      </ul>
      <section aria-labelledby="fl-rec">
        <h2 id="fl-rec" className="mb-2 text-sm font-semibold text-ase-text">{ft('expenses.recurring')}</h2>
        <ul className="space-y-2">
          {rules.data?.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ase-border bg-ase-surface p-4 text-sm">
              <div>
                <div className="font-medium text-ase-text">{r.template.supplier} · {r.template.description}</div>
                <div className="text-ase-muted">{ft('expenses.day')} {r.day} · {ft('expenses.nextDate')} {r.nextDate}</div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={r.active ? 'good' : 'neutral'}>{r.active ? ft('expenses.active') : ft('common.no')}</Pill>
                <Button size="sm" variant="secondary" onClick={() => setEditing({
                  id: r.id, data: { ...blank(), ...r.template } as FlExpenseInput, recurring: { day: r.day, startDate: r.nextDate, active: r.active },
                })}>{ft('common.edit')}</Button>
                <Button size="sm" variant="danger" onClick={() => window.confirm(ft('common.confirmDelete')) && delRule.mutate(r.id)}>{ft('common.delete')}</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.recurring ? ft('expenses.newRecurring') : ft('expenses.new')}>
        {editing ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <Field label={ft('expenses.supplier')}><Input required value={editing.data.supplier} onChange={(e) => set({ supplier: e.target.value })} /></Field>
            <Field label={ft('common.description')}><Input required value={editing.data.description} onChange={(e) => set({ description: e.target.value })} /></Field>
            <Field label={ft('expenses.reference')}><Input value={editing.data.reference} onChange={(e) => set({ reference: e.target.value })} /></Field>
            {editing.recurring ? (
              <div className="grid grid-cols-2 gap-3">
                <Field label={ft('expenses.startDate')}><Input type="date" required value={editing.recurring.startDate} onChange={(e) => setEditing({ ...editing, recurring: { ...editing.recurring!, startDate: e.target.value } })} /></Field>
                <Field label={ft('expenses.day')}><Input type="number" min={1} max={31} value={editing.recurring.day} onChange={(e) => setEditing({ ...editing, recurring: { ...editing.recurring!, day: num(e.target.value) } })} /></Field>
              </div>
            ) : (
              <Field label={ft('common.date')}><Input type="date" required value={editing.data.date} onChange={(e) => set({ date: e.target.value })} /></Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label={ft('common.base')}><Input type="number" min={0} step="0.01" value={editing.data.base} onChange={(e) => set({ base: num(e.target.value) })} /></Field>
              <Field label={ft('expenses.vat')}><Input type="number" min={0} max={100} step="0.01" value={editing.data.vat} onChange={(e) => set({ vat: num(e.target.value) })} /></Field>
              <Field label={ft('expenses.deductible')}><Input type="number" min={0} max={100} step="0.01" value={editing.data.deductible} onChange={(e) => set({ deductible: num(e.target.value) })} /></Field>
              <Field label={ft('expenses.vatDeductible')}><Input type="number" min={0} max={100} step="0.01" value={editing.data.vatDeductible} onChange={(e) => set({ vatDeductible: num(e.target.value) })} /></Field>
            </div>
            {editing.recurring ? (
              <Switch checked={editing.recurring.active} label={ft('expenses.active')} onCheckedChange={(v) => setEditing({ ...editing, recurring: { ...editing.recurring!, active: v } })} />
            ) : (
              <Switch checked={editing.data.paid} label={ft('expenses.paid')} onCheckedChange={(v) => set({ paid: v })} />
            )}
            {save.isError ? <ErrorNote error={save.error} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>{ft('common.cancel')}</Button>
              <Button type="submit" disabled={save.isPending}>{ft('common.save')}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
