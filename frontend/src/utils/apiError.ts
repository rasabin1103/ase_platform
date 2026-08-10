import { isAxiosError } from 'axios'

export type ApiFieldErrors = Record<string, string>

export type ParsedApiError = {
  /** General/banner message to show at the top of the form. */
  message: string
  /** Field-name -> message map, for fields the backend identified explicitly. */
  fieldErrors: ApiFieldErrors
}

/**
 * FastAPI/Pydantic error shapes we may see:
 * - 422 validation: { detail: [{ loc: ['body', 'field'], msg: string, type: string }, ...] }
 * - 4xx/5xx from HTTPException: { detail: string }
 * - network/unknown errors: no response at all
 */
export function parseApiError(error: unknown, fallbackMessage: string): ParsedApiError {
  if (!isAxiosError(error)) {
    return { message: fallbackMessage, fieldErrors: {} }
  }

  const detail = error.response?.data?.detail

  if (Array.isArray(detail)) {
    const fieldErrors: ApiFieldErrors = {}
    const messages: string[] = []
    for (const item of detail) {
      const loc: unknown[] = Array.isArray(item?.loc) ? item.loc : []
      const field = loc.filter((part) => part !== 'body').pop()
      const msg = typeof item?.msg === 'string' ? item.msg : fallbackMessage
      if (typeof field === 'string') {
        fieldErrors[field] = msg
      }
      messages.push(msg)
    }
    return {
      message: messages.length > 0 ? messages.join(' · ') : fallbackMessage,
      fieldErrors,
    }
  }

  if (typeof detail === 'string' && detail.trim()) {
    return { message: detail, fieldErrors: {} }
  }

  if (error.message) {
    return { message: error.message, fieldErrors: {} }
  }

  return { message: fallbackMessage, fieldErrors: {} }
}
