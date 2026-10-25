import { AlertTriangle } from 'lucide-react'
import { cgErrorInfo } from './contractGuard.utils'
import { useCgT } from './useCgT'

/** Error de la pasarela con el mensaje traducido por `code` cuando existe y,
 * si no, el del servicio. Los `details` (campos inválidos) se listan debajo. */
export function CgErrorNote({ error, fallbackKey = 'errors.generic' }: { error: unknown; fallbackKey?: string }) {
  const { tt, has } = useCgT()
  const info = cgErrorInfo(error, tt(fallbackKey))
  const message = info.code && has(`errors.${info.code}`) ? tt(`errors.${info.code}`) : info.message
  return (
    <div role="alert" className="flex gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0">
        <div>{message}</div>
        {info.details.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-xs text-rose-200/85">
            {info.details.map((d, i) => (
              <li key={i}>
                {d.location ? <span className="font-mono">{d.location}</span> : null}
                {d.location && d.message ? ': ' : ''}
                {d.message}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
