import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: (code: string) => Promise<void>
  isPending?: boolean
  devCode?: string | null
}

export function PhoneVerifyModal({ open, onClose, onConfirm, isPending, devCode }: Props) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    try {
      await onConfirm(code.trim())
      setCode('')
      onClose()
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : t('profilePage.verifyCodeError'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('profilePage.phoneVerifyTitle')}>
      <p className="text-sm text-ase-text2">{t('profilePage.phoneVerifyBody')}</p>
      {devCode ? (
        <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {t('profilePage.devSmsCode')}: <strong>{devCode}</strong>
        </p>
      ) : null}
      <Input
        className="mt-4 rounded-xl border-white/10 bg-ase-bg2/50 text-center text-lg tracking-widest"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      />
      {error ? <p className="mt-2 text-sm text-ase-error">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {t('profilePage.cancelVerify')}
        </Button>
        <Button disabled={isPending || code.length !== 6} onClick={() => void submit()}>
          {t('profilePage.confirmVerify')}
        </Button>
      </div>
    </Modal>
  )
}
