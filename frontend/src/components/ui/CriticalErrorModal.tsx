import { AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getModalCloseLabel } from '../../utils/errors'
import { registerModalListener, type ErrorNotification } from './errorNotifications'
import { Button } from './Button'
import { Modal } from './Modal'

/** Blocking dialog for failures severe enough that the request likely never
 * reached our own backend logic at all — network down, timeout, or a 5xx —
 * as opposed to an expected 4xx response (those go to ToastViewport
 * instead, see utils/errors.ts's severity split). Mounted once at the app
 * root and fed by reportError(), same wiring as ToastViewport.
 *
 * Only ever shows one dialog at a time — a flaky connection can fail a
 * dozen in-flight requests within the same second, and stacking a dozen
 * identical modals would be worse than showing none. Later ones are simply
 * dropped while one is already open. */
export function CriticalErrorModal() {
  const [current, setCurrent] = useState<ErrorNotification | null>(null)

  useEffect(() => {
    registerModalListener((n) => {
      setCurrent((prev) => prev ?? n)
    })
    return () => registerModalListener(null)
  }, [])

  return (
    <Modal
      open={current !== null}
      onClose={() => setCurrent(null)}
      allowFullscreen={false}
      closeLabel={getModalCloseLabel()}
      title={
        current ? (
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-ase-error" strokeWidth={1.75} />
            {current.title}
          </span>
        ) : null
      }
      footer={
        <div className="flex justify-end">
          <Button onClick={() => setCurrent(null)}>{getModalCloseLabel()}</Button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-ase-text2">{current?.message}</p>
    </Modal>
  )
}
