import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  downloadFlBackup, getFlCashSettings, getFlProfile, saveFlCashSettings, saveFlProfile,
  type FlCashSettings, type FlProfile,
} from '../../api/freelance.api'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { ErrorNote, Field } from './shared'
import { num, useFt } from './useFt'

const emptyProfile: FlProfile = { name: '', taxid: '', address: '', email: '', iban: '', invoiceColor: '#176b52', logo: null }
const emptyCash: FlCashSettings = { openingBalance: 0, withdrawals: 0, vatPaid: 0, extraIrpfUsed: 0 }

function SettingsForms({ initialProfile, initialCash }: { initialProfile: FlProfile; initialCash: FlCashSettings }) {
  const { ft } = useFt()
  const qc = useQueryClient()
  const [profile, setProfile] = useState<FlProfile>(initialProfile)
  const [cash, setCash] = useState<FlCashSettings>(initialCash)
  const [logoError, setLogoError] = useState(false)

  const saveP = useMutation({ mutationFn: () => saveFlProfile(profile), onSuccess: () => void qc.invalidateQueries({ queryKey: ['fl-profile'] }) })
  const saveC = useMutation({
    mutationFn: () => saveFlCashSettings(cash),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['fl-cash-settings'] }); void qc.invalidateQueries({ queryKey: ['fl-summary'] }) },
  })
  const backup = useMutation({ mutationFn: downloadFlBackup })

  const onLogo = (file: File | undefined) => {
    setLogoError(false)
    if (!file) return
    if (file.size > 500 * 1024) { setLogoError(true); return }
    const reader = new FileReader()
    reader.onload = () => setProfile((p) => ({ ...p, logo: String(reader.result) }))
    reader.readAsDataURL(file)
  }
  const sp = (patch: Partial<FlProfile>) => setProfile((p) => ({ ...p, ...patch }))

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveP.mutate() }}>
        <h2 className="text-sm font-semibold text-ase-text">{ft('settings.profile')}</h2>
        <Field label={ft('common.name')}><Input required value={profile.name} onChange={(e) => sp({ name: e.target.value })} /></Field>
        <Field label={ft('common.taxid')}><Input required value={profile.taxid} onChange={(e) => sp({ taxid: e.target.value })} /></Field>
        <Field label={ft('common.address')}><Input required value={profile.address} onChange={(e) => sp({ address: e.target.value })} /></Field>
        <Field label={ft('common.email')}><Input type="email" value={profile.email} onChange={(e) => sp({ email: e.target.value })} /></Field>
        <Field label={ft('settings.iban')}><Input value={profile.iban} onChange={(e) => sp({ iban: e.target.value })} /></Field>
        <Field label={ft('settings.color')}><Input type="color" className="w-20 p-1" value={profile.invoiceColor} onChange={(e) => sp({ invoiceColor: e.target.value })} /></Field>
        <Field label={ft('settings.logo')}>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onLogo(e.target.files?.[0])} className="text-sm text-ase-text2" />
        </Field>
        {logoError ? <p role="alert" className="text-sm text-rose-300">{ft('settings.logo')}</p> : null}
        {profile.logo ? (
          <div className="flex items-center gap-3">
            <img src={profile.logo} alt="" className="h-12 max-w-[10rem] object-contain" />
            <Button size="sm" variant="ghost" onClick={() => sp({ logo: null })}>{ft('settings.removeLogo')}</Button>
          </div>
        ) : null}
        {saveP.isError ? <ErrorNote error={saveP.error} /> : null}
        <Button type="submit" disabled={saveP.isPending}>{saveP.isSuccess ? ft('settings.saved') : ft('common.save')}</Button>
      </form>
      <div className="space-y-8">
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); saveC.mutate() }}>
          <h2 className="text-sm font-semibold text-ase-text">{ft('settings.cash')}</h2>
          {(['openingBalance', 'withdrawals', 'vatPaid', 'extraIrpfUsed'] as const).map((k) => (
            <Field key={k} label={ft(`settings.${k === 'openingBalance' ? 'opening' : k}`)}>
              <Input type="number" min={0} step="0.01" value={cash[k]} onChange={(e) => setCash({ ...cash, [k]: num(e.target.value) })} />
            </Field>
          ))}
          {saveC.isError ? <ErrorNote error={saveC.error} /> : null}
          <Button type="submit" disabled={saveC.isPending}>{saveC.isSuccess ? ft('settings.saved') : ft('common.save')}</Button>
        </form>
        <Button variant="outline" onClick={() => backup.mutate()} disabled={backup.isPending}>{ft('settings.backup')}</Button>
      </div>
    </div>
  )
}

export function SettingsTab() {
  const profileQ = useQuery({ queryKey: ['fl-profile'], queryFn: getFlProfile, staleTime: 0 })
  const cashQ = useQuery({ queryKey: ['fl-cash-settings'], queryFn: getFlCashSettings, staleTime: 0 })
  if (profileQ.isLoading || cashQ.isLoading) return <Skeleton className="h-48 rounded-2xl" />
  if (profileQ.isError || cashQ.isError) return <ErrorNote error={profileQ.error ?? cashQ.error} />
  return <SettingsForms initialProfile={profileQ.data ?? emptyProfile} initialCash={cashQ.data ?? emptyCash} />
}
