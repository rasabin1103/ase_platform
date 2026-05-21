import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

type Props = {
  open: boolean
  onClose: () => void
  itemName?: string | null
  onConfirm: () => void
  isPending?: boolean
  /** When true, dialog copy describes activation instead of deactivation */
  activating?: boolean
}

export function ConfirmDeactivateDialog({
  open,
  onClose,
  itemName,
  onConfirm,
  isPending,
  activating = false,
}: Props) {
  const { t } = useI18n()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activating ? t('adminConfirm.deactivate.activateTitle') : t('adminConfirm.deactivate.title')}
    >
      <p className="text-sm leading-relaxed text-ase-text2">
        {activating ? t('adminConfirm.deactivate.activateBody') : t('adminConfirm.deactivate.body')}
      </p>
      {itemName ? (
        <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-400/5 px-4 py-3 text-sm font-medium text-ase-text">
          {itemName}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          {t('adminConfirm.deactivate.cancel')}
        </Button>
        <Button variant="primary" disabled={isPending} onClick={onConfirm}>
          {isPending
            ? t('adminConfirm.deactivate.activating')
            : activating
              ? t('adminConfirm.deactivate.activateConfirm')
              : t('adminConfirm.deactivate.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
