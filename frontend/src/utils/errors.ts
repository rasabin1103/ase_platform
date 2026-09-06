import axios from 'axios'

// Mirrors the storage key I18nProvider uses (see ../i18n/index.ts) — read
// directly rather than through useI18n() because this module is called from
// contexts with no React tree available yet (the QueryClient's global
// onError handlers are set up once, outside any component).
const LANGUAGE_STORAGE_KEY = 'ase_language'

function getLanguage(): 'es' | 'en' {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

const COPY = {
  es: {
    network: 'No se pudo conectar con el servidor. Comprueba tu conexión a internet e inténtalo de nuevo.',
    timeout: 'El servidor está tardando demasiado en responder. Inténtalo de nuevo en unos segundos.',
    server: 'Ha ocurrido un error en el servidor. Ya lo hemos registrado — inténtalo de nuevo en unos minutos.',
    unauthorized: 'Tu sesión no es válida o ha caducado. Inicia sesión de nuevo.',
    forbidden: 'No tienes permiso para realizar esta acción.',
    notFound: 'No se ha encontrado lo que buscabas.',
    tooMany: 'Demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
    generic: 'Algo no ha salido como esperábamos. Inténtalo de nuevo.',
    toastTitle: 'Algo ha fallado',
    modalNetworkTitle: 'Sin conexión con el servidor',
    modalServerTitle: 'Error del servidor',
    modalClose: 'Entendido',
  },
  en: {
    network: 'Could not reach the server. Check your internet connection and try again.',
    timeout: 'The server is taking too long to respond. Please try again in a moment.',
    server: "A server error occurred. We've already logged it — please try again in a few minutes.",
    unauthorized: 'Your session is invalid or has expired. Please sign in again.',
    forbidden: 'You do not have permission to do that.',
    notFound: 'We could not find what you were looking for.',
    tooMany: 'Too many requests in a row. Please wait a moment and try again.',
    generic: "Something didn't go as expected. Please try again.",
    toastTitle: 'Something went wrong',
    modalNetworkTitle: 'Cannot reach the server',
    modalServerTitle: 'Server error',
    modalClose: 'Got it',
  },
} as const

/** FastAPI/Pydantic 422 responses send `detail` as an array of
 * `{ loc, msg, type }` objects rather than a string — see
 * `utils/apiError.ts`'s `parseApiError`, which already handles this shape
 * for inline per-field form errors. This mirrors just the "join into one
 * readable sentence" half of that logic, for contexts (the global toast)
 * that only need a summary message, not a field map. Forms that already
 * call `parseApiError` directly are untouched by this. */
function extractDetailMessage(detail: unknown): string | undefined {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item.msg === 'string' ? item.msg : undefined))
      .filter((msg): msg is string => Boolean(msg))
    if (messages.length > 0) return messages.join(' · ')
  }
  return undefined
}

export type ErrorSeverity = 'toast' | 'modal'

export type ErrorInfo = {
  title: string
  message: string
  severity: ErrorSeverity
  status?: number
}

/** Classifies any error thrown by an axios call (or anything else) into a
 * user-facing title/message plus a severity: `modal` for failures where the
 * request likely never reached our own backend logic at all (network down,
 * timeout, 5xx) — serious enough to interrupt with a blocking dialog — and
 * `toast` for everything else (expected 4xx responses, validation errors,
 * not-found, etc.), which just need a visible-but-non-blocking heads-up. */
export function getErrorInfo(error: unknown): ErrorInfo {
  const lang = getLanguage()
  const copy = COPY[lang]

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const isTimeout = error.code === 'ECONNABORTED'
      return {
        title: copy.modalNetworkTitle,
        message: isTimeout ? copy.timeout : copy.network,
        severity: 'modal',
      }
    }

    const status = error.response.status
    const data = error.response.data as { detail?: unknown } | undefined
    const detail = extractDetailMessage(data?.detail)

    if (status >= 500) {
      return { title: copy.modalServerTitle, message: copy.server, severity: 'modal', status }
    }
    if (status === 401) {
      return { title: copy.toastTitle, message: detail ?? copy.unauthorized, severity: 'toast', status }
    }
    if (status === 403) {
      return { title: copy.toastTitle, message: detail ?? copy.forbidden, severity: 'toast', status }
    }
    if (status === 404) {
      return { title: copy.toastTitle, message: detail ?? copy.notFound, severity: 'toast', status }
    }
    if (status === 429) {
      return { title: copy.toastTitle, message: detail ?? copy.tooMany, severity: 'toast', status }
    }
    return { title: copy.toastTitle, message: detail ?? copy.generic, severity: 'toast', status }
  }

  if (error instanceof Error && error.message) {
    return { title: copy.toastTitle, message: error.message, severity: 'toast' }
  }
  return { title: copy.toastTitle, message: copy.generic, severity: 'toast' }
}

export function getModalCloseLabel(): string {
  return COPY[getLanguage()].modalClose
}
