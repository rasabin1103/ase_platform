import { getErrorInfo } from '../../utils/errors'

export type ErrorNotification = {
  id: string
  title: string
  message: string
  status?: number
}

type Listener = (n: ErrorNotification) => void

// Module-level (not React context) on purpose: the QueryClient that needs to
// report errors is created once, outside the component tree (see
// app/providers.tsx), so it has no way to reach a context provider. The
// ToastViewport / CriticalErrorModal components below register themselves
// here on mount instead — same pattern already used for the auth token
// store (auth/auth.store.ts) to bridge non-React code into React state.
let toastListener: Listener | null = null
let modalListener: Listener | null = null

export function registerToastListener(fn: Listener | null): void {
  toastListener = fn
}

export function registerModalListener(fn: Listener | null): void {
  modalListener = fn
}

let nextId = 0

/** Call from any onError handler (or a QueryCache/MutationCache global
 * handler) to surface a failure to the user. Safe to call before the
 * toast/modal components have mounted — it just becomes a no-op until they
 * do, since something has to render *somewhere* to show anything.
 *
 * Opt out of the global surfacing for a specific query/mutation that
 * already handles its own error UI and would look redundant with a toast on
 * top, by passing `{ meta: { suppressGlobalError: true } }` in its
 * useQuery/useMutation options — see QueryCache/MutationCache wiring in
 * app/providers.tsx. */
export function reportError(error: unknown): void {
  const info = getErrorInfo(error)
  const notification: ErrorNotification = {
    id: String(nextId++),
    title: info.title,
    message: info.message,
    status: info.status,
  }
  if (info.severity === 'modal') {
    modalListener?.(notification)
  } else {
    toastListener?.(notification)
  }
}
