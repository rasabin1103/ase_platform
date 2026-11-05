import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {
  createFlInvoice, deleteFlInvoice, downloadFlPdf, listFlClients, listFlInvoices, setFlInvoicePayment,
  type FlInvoiceInput, type FlLineInput,
} from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { FilterBar, Kpi, Pill } from './kit'
import { ErrorNote, Field } from './shared'
import { num, todayIso, useFt } from './useFt'

const blankLine = (): FlLineInput => ({ description: '', unit: 'días', quantity: 1, rate: 0 })

export function InvoicesTab() {
  const { ft, eur } = useFt()
  const qc = useQueryClient()
  const invoices = useQuery({ queryKey: ['fl-invoices'], queryFn: listFlInvoices })
  const clients = useQuery({ queryKey: ['fl-clients'], queryFn: listFlClients })
  const [form, setForm] = useState<FlInvoiceInput | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')
  const [clientId, setClientId] = useState(0)
  const [year, setYear] = useState(0)
  const today = todayIso()
  const isOverdue = (i: { paid: boolean; due: string | null }) => !i.paid && !!i.due && i.due < today
  const years = useMemo(() => [...new Set((invoices.data ?? []).map((i) => i.date.slice(0, 4)))].sort().reverse(), [invoices.data])
  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (invoices.data ?? []).filter((i) => {
      if (clientId && i.clientId !== clientId) return false
      if (year && i.date.slice(0, 4) !== String(year)) return false
      if (status === 'paid' && !i.paid) return false
      if (status === 'pending' && i.paid) return false
      if (status === 'overdue' && !isOverdue(i)) return false
      return !needle || `${i.number} ${i.clientSnapshot.name} ${i.description}`.toLowerCase().includes(needle)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices.data, search, status, clientId, year, today])
  const totals = useMemo(() => ({
    invoiced: rows.reduce((s, i) => s + i.totalCents, 0),
    collected: rows.filter((i) => i.paid).reduce((s, i) => s + i.totalCents, 0),
    pending: rows.filter((i) => !i.paid).reduce((s, i) => s + i.totalCents, 0),
    overdue: rows.filter(isOverdue).reduce((s, i) => s + i.totalCents, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [rows, today])
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['fl-invoices'] })
    void qc.invalidateQueries({ queryKey: ['fl-summary'] })
  }
  const create = useMutation({ mutationFn: () => createFlInvoice(form!), onSuccess: () => { setForm(null); refresh() } })
  const pay = useMutation({ mutationFn: (v: { id: number; paid: boolean }) => setFlInvoicePayment(v.id, v.paid), onSuccess: refresh })
  const del = useMutation({ mutationFn: (id: number) => deleteFlInvoice(id), onSuccess: refresh })
  const pdf = useMutation({ mutationFn: (v: { id: number; number: string }) => downloadFlPdf(`/invoices/${v.id}/pdf`, `factura-${v.number}.pdf`) })

  const open = () => {
    const first = clients.data?.[0]
    if (!first) return
    setForm({ clientId: first.id, date: todayIso(), description: '', vat: 21, irpf: 15, serviceMonth: todayIso().slice(0, 7), lines: [blankLine()] })
  }
  const setLine = (i: number, patch: Partial<FlLineInput>) =>
    setForm((f) => (f ? { ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : f))

  if (invoices.isLoading) return <Skeleton className="h-40 rounded-2xl" />
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={open} disabled={!clients.data?.length}>{ft('invoices.new')}</Button>
        {clients.data?.length === 0 ? <span className="text-sm text-ase-muted">{ft('invoices.needClient')}</span> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={ft('invoices.totalInvoiced')} value={eur(totals.invoiced)} />
        <Kpi tone="good" label={ft('invoices.collected')} value={eur(totals.collected)} />
        <Kpi label={ft('invoices.toCollect')} value={eur(totals.pending)} />
        <Kpi tone={totals.overdue ? 'bad' : 'neutral'} label={ft('invoices.overdueTotal')} value={eur(totals.overdue)} />
      </div>
      <FilterBar>
        <div className="min-w-[14rem] flex-1">
          <Field label={ft('common.search')}><Input type="search" placeholder={ft('invoices.search')} value={search} onChange={(e) => setSearch(e.target.value)} /></Field>
        </div>
        <Field label={ft('invoices.status')}>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">{ft('invoices.allStatus')}</option>
            <option value="pending">{ft('invoices.pending')}</option>
            <option value="paid">{ft('invoices.paid')}</option>
            <option value="overdue">{ft('invoices.overdue')}</option>
          </Select>
        </Field>
        <Field label={ft('invoices.client')}>
          <Select value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
            <option value={0}>{ft('invoices.allClients')}</option>
            {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label={ft('common.year')}>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            <option value={0}>{ft('invoices.allStatus')}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </Field>
      </FilterBar>
      {invoices.isError ? <ErrorNote error={invoices.error} /> : null}
      {pay.isError ? <ErrorNote error={pay.error} /> : null}
      {invoices.data?.length === 0 ? <EmptyState title={ft('common.empty')} /> : null}
      {invoices.data?.length ? rows.length === 0 ? <EmptyState title={ft('invoices.noResults')} /> : null : null}
      <ul className="space-y-2">
        {rows.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ase-border bg-ase-surface p-4 text-sm">
            <div className="min-w-0">
              <div className="font-medium text-ase-text">{i.number} · {i.clientSnapshot.name}</div>
              <div className="text-ase-muted">{i.date} · {ft('invoices.due')} {i.due ?? '—'} · {i.description}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ase-text">{eur(i.totalCents)}</span>
              <Pill tone={i.paid ? 'good' : isOverdue(i) ? 'bad' : 'warn'}>{i.paid ? ft('invoices.paid') : isOverdue(i) ? ft('invoices.overdue') : ft('invoices.pending')}</Pill>
              <Button size="sm" variant="secondary" onClick={() => pay.mutate({ id: i.id, paid: !i.paid })}>
                {i.paid ? ft('invoices.markPending') : ft('invoices.markPaid')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => pdf.mutate({ id: i.id, number: i.number })}>{ft('common.pdf')}</Button>
              <Button size="sm" variant="danger" onClick={() => window.confirm(ft('common.confirmDelete')) && del.mutate(i.id)}>{ft('common.delete')}</Button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={!!form} onClose={() => setForm(null)} title={ft('invoices.new')} className="max-w-2xl">
        {form ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={ft('invoices.client')}>
                <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: Number(e.target.value) })}>
                  {clients.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label={ft('common.date')}><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label={ft('invoices.serviceMonth')}><Input type="month" value={form.serviceMonth ?? ''} onChange={(e) => setForm({ ...form, serviceMonth: e.target.value || null })} /></Field>
              <Field label={ft('common.description')}><Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label={ft('invoices.vat')}><Input type="number" min={0} max={100} step="0.01" value={form.vat} onChange={(e) => setForm({ ...form, vat: num(e.target.value) })} /></Field>
              <Field label={ft('invoices.irpf')}><Input type="number" min={0} max={100} step="0.01" value={form.irpf} onChange={(e) => setForm({ ...form, irpf: num(e.target.value) })} /></Field>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ase-text">{ft('invoices.lines')}</legend>
              {form.lines.map((l, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_7rem]">
                  <Input aria-label={ft('common.description')} required placeholder={ft('common.description')} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                  <Select aria-label={ft('invoices.unit')} value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value as FlLineInput['unit'] })}>
                    <option value="días">{ft('invoices.days')}</option>
                    <option value="horas">{ft('invoices.hours')}</option>
                  </Select>
                  <Input aria-label={ft('invoices.quantity')} type="number" min={0.01} step="0.01" value={l.quantity} onChange={(e) => setLine(i, { quantity: num(e.target.value) })} />
                  <Input aria-label={ft('invoices.rate')} type="number" min={0} step="0.01" value={l.rate} onChange={(e) => setLine(i, { rate: num(e.target.value) })} />
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, lines: [...form.lines, blankLine()] })} disabled={form.lines.length >= 100}>{ft('invoices.addLine')}</Button>
                {form.lines.length > 1 ? (
                  <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, lines: form.lines.slice(0, -1) })}>{ft('common.delete')}</Button>
                ) : null}
              </div>
            </fieldset>
            {create.isError ? <ErrorNote error={create.error} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setForm(null)}>{ft('common.cancel')}</Button>
              <Button type="submit" disabled={create.isPending}>{ft('common.save')}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
