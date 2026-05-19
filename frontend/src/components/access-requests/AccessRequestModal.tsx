import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  createMyAccessRequest,
  type AccessRequestType,
  type AccessTargetType,
} from '../../api/access_requests.api'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Textarea } from '../ui/Textarea'
import { useI18n } from '../../i18n'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  requestType: AccessRequestType
  targetType: AccessTargetType
  targetId?: string | null
  title: string
  modalTitle: string
  modalDescription?: string
}

export function AccessRequestModal({
  open,
  onClose,
  onSuccess,
  requestType,
  targetType,
  targetId,
  title,
  modalTitle,
  modalDescription,
}: Props) {
  const { t } = useI18n()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMessage('')
    setError(null)
  }, [open])

  const mutation = useMutation({
    mutationFn: () =>
      createMyAccessRequest({
        request_type: requestType,
        target_type: targetType,
        target_id: targetId ?? undefined,
        title,
        message: message.trim() || undefined,
      }),
    onSuccess: () => {
      onSuccess?.()
      onClose()
    },
    onError: () => setError(t('requestsPage.submitError')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={modalTitle}
      closeLabel={t('requestsPage.modalClose')}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t('requestsPage.modalClose')}
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {t('requestsPage.modalSubmit')}
          </Button>
        </div>
      }
    >
      {modalDescription ? <p className="mb-4 text-sm text-ase-text2">{modalDescription}</p> : null}
      <label className="mb-2 block text-xs font-medium text-ase-muted">{t('requestsPage.modalMessageLabel')}</label>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder={t('requestsPage.modalMessagePlaceholder')}
        className="rounded-xl border-white/10 bg-ase-bg2/50"
      />
      {error ? <p className="mt-3 text-sm text-ase-error">{error}</p> : null}
    </Modal>
  )
}
