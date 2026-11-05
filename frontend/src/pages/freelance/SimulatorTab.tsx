import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { runFlSimulation, type FlSimInput } from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { ErrorNote, Field, Stat } from './shared'
import { num, useFt } from './useFt'

export function SimulatorTab() {
  const { ft, eur } = useFt()
  const [form, setForm] = useState<FlSimInput>({ mode: 'percent', percent: 10, dayExtra: 0, hourExtra: 0 })
  const run = useMutation({ mutationFn: () => runFlSimulation(form) })
  const t = run.data?.totals

  return (
    <div className="space-y-4">
      <p className="text-sm text-ase-muted">{ft('simulator.intro')}</p>
      <form className="grid gap-3 sm:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run.mutate() }}>
        <Field label={ft('simulator.mode')}>
          <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as FlSimInput['mode'] })}>
            <option value="percent">{ft('simulator.percent')}</option>
            <option value="amount">{ft('simulator.amount')}</option>
          </Select>
        </Field>
        {form.mode === 'percent' ? (
          <Field label={ft('simulator.percentValue')}><Input type="number" step="0.01" value={form.percent} onChange={(e) => setForm({ ...form, percent: num(e.target.value) })} /></Field>
        ) : (
          <>
            <Field label={ft('simulator.dayExtra')}><Input type="number" step="0.01" value={form.dayExtra} onChange={(e) => setForm({ ...form, dayExtra: num(e.target.value) })} /></Field>
            <Field label={ft('simulator.hourExtra')}><Input type="number" step="0.01" value={form.hourExtra} onChange={(e) => setForm({ ...form, hourExtra: num(e.target.value) })} /></Field>
          </>
        )}
        <div className="flex items-end"><Button type="submit" disabled={run.isPending}>{ft('simulator.run')}</Button></div>
      </form>
      {run.isError ? <ErrorNote error={run.error} /> : null}
      {t ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label={ft('simulator.current')} value={eur(t.current)} />
            <Stat label={ft('simulator.simulated')} value={eur(t.simulated)} />
            <Stat label={ft('simulator.net')} value={eur(t.net)} />
            <Stat label={ft('simulator.simNet')} value={eur(t.simNet)} />
            <Stat strong label={ft('simulator.difference')} value={eur(t.simNet - t.net)} />
          </div>
          <div className="overflow-x-auto rounded-xl border border-ase-border bg-ase-surface">
            <table className="min-w-full text-left text-sm text-ase-text2">
              <thead className="text-xs uppercase text-ase-muted">
                <tr>
                  <th className="p-3">{ft('common.month')}</th>
                  {['current', 'simulated', 'net', 'simNet'].map((k) => <th key={k} className="p-3 text-right">{ft(`simulator.${k}`)}</th>)}
                </tr>
              </thead>
              <tbody>
                {run.data!.rows.map((r) => (
                  <tr key={r.key} className="border-t border-ase-border">
                    <td className="p-3">{r.key}</td>
                    <td className="p-3 text-right">{eur(r.current)}</td>
                    <td className="p-3 text-right">{eur(r.simulated)}</td>
                    <td className="p-3 text-right">{eur(r.net)}</td>
                    <td className="p-3 text-right">{eur(r.simNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
