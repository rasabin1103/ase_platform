import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  addFlEntry, deleteFlEntry, deleteFlPlan, getFlWealth, saveFlPlan, type FlEntry, type FlPlan, type FlPlanInput,
} from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { Switch } from '../../components/ui/Switch'
import { ErrorNote, Field, Stat } from './shared'
import { num, todayIso, useFt } from './useFt'

const blankPlan = (): FlPlanInput => ({
  category: 'saving', name: '', startMonth: todayIso().slice(0, 7), horizon: 12, annualRate: 0, initial: 0, monthly: 0, target: 0, active: true,
})
type EntryForm = { planId: number; action: FlEntry['action']; date: string; amount: number; fromBusiness: boolean; note: string }

export function WealthTab() {
  const { ft, eur } = useFt()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['fl-wealth'], queryFn: getFlWealth })
  const [plan, setPlan] = useState<{ id?: number; data: FlPlanInput } | null>(null)
  const [entry, setEntry] = useState<EntryForm | null>(null)
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['fl-wealth'] })
    void qc.invalidateQueries({ queryKey: ['fl-summary'] })
  }
  const savePlan = useMutation({ mutationFn: () => saveFlPlan(plan!.data, plan!.id), onSuccess: () => { setPlan(null); refresh() } })
  const delPlan = useMutation({ mutationFn: (id: number) => deleteFlPlan(id), onSuccess: refresh })
  const addEntry = useMutation({
    mutationFn: () => { const { planId, ...b } = entry!; return addFlEntry(planId, b) },
    onSuccess: () => { setEntry(null); refresh() },
  })
  const delEntry = useMutation({ mutationFn: (id: number) => deleteFlEntry(id), onSuccess: refresh })
  const sp = (patch: Partial<FlPlanInput>) => setPlan((p) => (p ? { ...p, data: { ...p.data, ...patch } } : p))
  const toInput = (p: FlPlan): FlPlanInput => ({
    category: p.category, name: p.name, startMonth: p.startMonth, horizon: p.horizon, annualRate: p.annualRate,
    initial: p.initialCents / 100, monthly: p.monthlyCents / 100, target: p.targetCents / 100, active: p.active,
  })

  if (q.isLoading) return <Skeleton className="h-40 rounded-2xl" />
  return (
    <div className="space-y-4">
      <Button onClick={() => setPlan({ data: blankPlan() })}>{ft('wealth.newPlan')}</Button>
      {q.isError ? <ErrorNote error={q.error} /> : null}
      {delPlan.isError ? <ErrorNote error={delPlan.error} /> : null}
      {delEntry.isError ? <ErrorNote error={delEntry.error} /> : null}
      {q.data?.plans.length === 0 ? <EmptyState title={ft('common.empty')} /> : null}
      {q.data?.plans.map((p) => {
        const last = p.projection[p.projection.length - 1]
        const entries = q.data.entries.filter((e) => e.planId === p.id)
        return (
          <section key={p.id} className="space-y-3 rounded-xl border border-ase-border bg-ase-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-ase-text">{p.name} · {ft(`wealth.${p.category}`)}</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEntry({ planId: p.id, action: 'contribution', date: todayIso(), amount: 0, fromBusiness: false, note: '' })}>{ft('wealth.newEntry')}</Button>
                <Button size="sm" variant="secondary" onClick={() => setPlan({ id: p.id, data: toInput(p) })}>{ft('common.edit')}</Button>
                <Button size="sm" variant="danger" onClick={() => window.confirm(ft('common.confirmDelete')) && delPlan.mutate(p.id)}>{ft('common.delete')}</Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label={ft('wealth.balance')} value={eur(p.actual.balance)} />
              <Stat label={ft('wealth.contributed')} value={eur(p.actual.contributed)} />
              <Stat label={ft('wealth.projected')} value={eur(last?.value)} hint={p.targetCents ? `${ft('wealth.target')}: ${eur(p.targetCents)}` : undefined} />
            </div>
            {entries.length ? (
              <ul className="space-y-1 text-sm text-ase-text2">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span>{e.date} · {ft(`wealth.${e.action}`)}{e.note ? ` · ${e.note}` : ''}</span>
                    <span className="flex items-center gap-2">
                      {eur(e.amountCents)}
                      <Button size="sm" variant="ghost" onClick={() => window.confirm(ft('common.confirmDelete')) && delEntry.mutate(e.id)}>{ft('common.delete')}</Button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        )
      })}
      <Modal open={!!plan} onClose={() => setPlan(null)} title={ft('wealth.newPlan')}>
        {plan ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); savePlan.mutate() }}>
            <Field label={ft('common.name')}><Input required maxLength={100} value={plan.data.name} onChange={(e) => sp({ name: e.target.value })} /></Field>
            <Field label={ft('wealth.category')}>
              <Select value={plan.data.category} onChange={(e) => sp({ category: e.target.value as FlPlanInput['category'] })}>
                <option value="saving">{ft('wealth.saving')}</option>
                <option value="investment">{ft('wealth.investment')}</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ft('wealth.startMonth')}><Input type="month" required value={plan.data.startMonth} onChange={(e) => sp({ startMonth: e.target.value })} /></Field>
              <Field label={ft('wealth.horizon')}><Input type="number" min={1} max={600} value={plan.data.horizon} onChange={(e) => sp({ horizon: num(e.target.value) })} /></Field>
              <Field label={ft('wealth.annualRate')}><Input type="number" step="0.01" value={plan.data.annualRate} onChange={(e) => sp({ annualRate: num(e.target.value) })} /></Field>
              <Field label={ft('wealth.initial')}><Input type="number" min={0} step="0.01" value={plan.data.initial} onChange={(e) => sp({ initial: num(e.target.value) })} /></Field>
              <Field label={ft('wealth.monthly')}><Input type="number" min={0} step="0.01" value={plan.data.monthly} onChange={(e) => sp({ monthly: num(e.target.value) })} /></Field>
              <Field label={ft('wealth.target')}><Input type="number" min={0} step="0.01" value={plan.data.target} onChange={(e) => sp({ target: num(e.target.value) })} /></Field>
            </div>
            <Switch checked={plan.data.active} label={ft('expenses.active')} onCheckedChange={(v) => sp({ active: v })} />
            {savePlan.isError ? <ErrorNote error={savePlan.error} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPlan(null)}>{ft('common.cancel')}</Button>
              <Button type="submit" disabled={savePlan.isPending}>{ft('common.save')}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
      <Modal open={!!entry} onClose={() => setEntry(null)} title={ft('wealth.newEntry')}>
        {entry ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); addEntry.mutate() }}>
            <Field label={ft('wealth.entries')}>
              <Select value={entry.action} onChange={(e) => setEntry({ ...entry, action: e.target.value as FlEntry['action'], fromBusiness: false })}>
                <option value="contribution">{ft('wealth.contribution')}</option>
                <option value="withdrawal">{ft('wealth.withdrawal')}</option>
                <option value="valuation">{ft('wealth.valuation')}</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={ft('common.date')}><Input type="date" required value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></Field>
              <Field label={ft('wealth.amount')}><Input type="number" min={0} step="0.01" value={entry.amount} onChange={(e) => setEntry({ ...entry, amount: num(e.target.value) })} /></Field>
            </div>
            {entry.action !== 'valuation' ? (
              <Switch checked={entry.fromBusiness} label={ft('wealth.fromBusiness')} onCheckedChange={(v) => setEntry({ ...entry, fromBusiness: v })} />
            ) : null}
            <Field label={ft('wealth.note')}><Input maxLength={500} value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} /></Field>
            {addEntry.isError ? <ErrorNote error={addEntry.error} /> : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEntry(null)}>{ft('common.cancel')}</Button>
              <Button type="submit" disabled={addEntry.isPending}>{ft('common.save')}</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
