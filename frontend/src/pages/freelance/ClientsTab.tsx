import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deleteFlClient, listFlClients, saveFlClient, type FlClient, type FlClientInput } from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Select } from '../../components/ui/Select'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorNote, Field } from './shared'
import { num, useFt } from './useFt'

const blank: FlClientInput = {
  name: '', taxid: '', address: '', email: '', startDate: null, paymentRule: 'nextMonth', paymentDays: 60, extraIrpf: 0,
}

export function ClientsTab() {
  const { ft } = useFt()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['fl-clients'], queryFn: listFlClients })
  const [editing, setEditing] = useState<{ id?: number; data: FlClientInput } | null>(null)
  const save = useMutation({
    mutationFn: () => saveFlClient(editing!.data, editing!.id),
    onSuccess: () => { setEditing(null); void qc.invalidateQueries({ queryKey: ['fl-clients'] }) },
  })
  const del = useMutation({
    mutationFn: (id: number) => deleteFlClient(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['fl-clients'] }),
  })
  const set = (patch: Partial<FlClientInput>) => setEditing((e) => (e ? { ...e, data: { ...e.data, ...patch } } : e))
  const toEdit = (c: FlClient) => setEditing({ id: c.id, data: { ...c } })

  if (q.isLoading) return <Skeleton className="h-32 rounded-2xl" />
  return (
    <div className="space-y-4">
      <Button onClick={() => setEditing({ data: blank })}>{ft('clients.new')}</Button>
      {q.isError ? <ErrorNote error={q.error} /> : null}
      {del.isError ? <ErrorNote error={del.error} /> : null}
      {q.data?.length === 0 ? <EmptyState title={ft('common.empty')} /> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {q.data?.map((c) => (
          <li key={c.id} className="rounded-xl border border-ase-border bg-ase-surface p-4 text-sm">
            <div className="font-medium text-ase-text">{c.name}</div>
            <div className="text-ase-muted">{c.taxid} · {c.email}</div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => toEdit(c)}>{ft('common.edit')}</Button>
              <Button size="sm" variant="danger" onClick={() => window.confirm(ft('common.confirmDelete')) && del.mutate(c.id)}>
                {ft('common.delete')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={ft('clients.new')}>
        {editing ? (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <Field label={ft('common.name')}><Input required value={editing.data.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label={ft('common.taxid')}><Input required value={editing.data.taxid} onChange={(e) => set({ taxid: e.target.value })} /></Field>
            <Field label={ft('common.address')}><Input required value={editing.data.address} onChange={(e) => set({ address: e.target.value })} /></Field>
            <Field label={ft('common.email')}><Input type="email" value={editing.data.email} onChange={(e) => set({ email: e.target.value })} /></Field>
            <Field label={ft('clients.paymentRule')}>
              <Select value={editing.data.paymentRule} onChange={(e) => set({ paymentRule: e.target.value as FlClient['paymentRule'] })}>
                <option value="nextMonth">{ft('clients.nextMonth')}</option>
                <option value="days">{ft('clients.days')}</option>
              </Select>
            </Field>
            {editing.data.paymentRule === 'days' ? (
              <Field label={ft('clients.paymentDays')}>
                <Input type="number" min={0} max={365} value={editing.data.paymentDays} onChange={(e) => set({ paymentDays: num(e.target.value) })} />
              </Field>
            ) : null}
            <Field label={ft('clients.extraIrpf')} hint={ft('clients.extraIrpfHint')}>
              <Input type="number" min={0} max={100} step="0.01" value={editing.data.extraIrpf} onChange={(e) => set({ extraIrpf: num(e.target.value) })} />
            </Field>
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
