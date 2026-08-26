import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
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
  // Reset the form fields whenever the modal transitions to open, without an
  // effect: this "adjust state while rendering" pattern is what React
  // recommends for resetting state based on a changing prop — it runs as
  // part of this render (no extra commit), unlike setState inside useEffect.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setMessage('')
      setError(null)
    }
  }

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
      <label htmlFor="access-request-message" className="mb-2 block text-xs font-medium text-ase-muted">{t('requestsPage.modalMessageLabel')}</label>
      <Textarea
        id="access-request-message"
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
