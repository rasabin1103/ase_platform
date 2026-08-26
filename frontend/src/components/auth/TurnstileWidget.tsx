import { useEffect, useRef } from 'react'

/** Minimal shape of the global `window.turnstile` API injected by
 * Cloudflare's script — see https://developers.cloudflare.com/turnstile/. */
type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
const SCRIPT_ID = 'cf-turnstile-script'

function loadTurnstileScript(): void {
  if (document.getElementById(SCRIPT_ID)) return
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = SCRIPT_SRC
  script.async = true
  script.defer = true
  document.head.appendChild(script)
}

type TurnstileWidgetProps = {
  onVerify: (token: string | null) => void
  onExpire?: () => void
  onError?: () => void
}

/** Cloudflare Turnstile (captcha) widget — renders nothing when
 * VITE_TURNSTILE_SITE_KEY isn't configured, so forms using this component
 * keep working unchanged in local dev without a Cloudflare account (same
 * "opt-in via env var" pattern as Sentry/DeepL elsewhere in this repo). */
export function TurnstileWidget({ onVerify, onExpire, onError }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return

    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerify(token),
        'expired-callback': () => {
          onExpire?.()
          onVerify(null)
        },
        'error-callback': () => {
          onError?.()
          onVerify(null)
        },
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      loadTurnstileScript()
      const intervalId = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(intervalId)
          renderWidget()
        }
      }, 100)
      return () => {
        cancelled = true
        window.clearInterval(intervalId)
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
        }
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) return null

  return <div ref={containerRef} />
}
