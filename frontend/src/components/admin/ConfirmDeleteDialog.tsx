import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

type Props = {
  open: boolean
  onClose: () => void
  itemName?: string | null
  onConfirm: () => void
  isPending?: boolean
  isError?: boolean
  title?: string
  body?: string
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  itemName,
  onConfirm,
  isPending,
  isError,
  title,
  body,
}: Props) {
  const { t } = useI18n()

  return (
    <Modal open={open} onClose={onClose} title={title ?? t('adminConfirm.delete.title')}>
      <p className="text-sm leading-relaxed text-ase-text2">{body ?? t('adminConfirm.delete.body')}</p>
      {itemName ? (
        <p className="mt-3 rounded-xl border border-ase-error/20 bg-ase-error/5 px-4 py-3 text-sm font-medium text-ase-text">
          <span className="text-ase-muted">{t('adminConfirm.delete.itemLabel')}: </span>
          {itemName}
        </p>
      ) : null}
      {isError ? <p className="mt-3 text-sm text-ase-error">{t('adminConfirm.delete.error')}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          {t('adminConfirm.delete.cancel')}
        </Button>
        <Button variant="danger" disabled={isPending} onClick={onConfirm}>
          {isPending ? t('adminConfirm.delete.deleting') : t('adminConfirm.delete.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
