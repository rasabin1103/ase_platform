import { useState } from 'react'
import { Cookie } from 'lucide-react'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

const STORAGE_KEY = 'ase_cookie_notice_dismissed'

/** Lightweight, non-blocking informational notice — the platform has no
 * third-party analytics or advertising cookies, only strictly-necessary
 * local storage (auth token + language preference), so this is informational
 * rather than a consent gate. Dismissal is remembered in local storage. */
export function CookieNotice() {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  if (dismissed) return null

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore — worst case the notice reappears next visit */
    }
    setDismissed(true)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 text-sm text-ase-text2">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} />
          <p className="leading-relaxed">
            {t('legal.cookieNotice.text')}{' '}
            {/* Plain anchor, not react-router's Link: this component is mounted in
                main.tsx as a sibling of <RouterProvider>, outside the router's
                context tree, so router-aware navigation components would crash here. */}
            <a
              href="/privacy-policy"
              className="font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
            >
              {t('legal.cookieNotice.learnMore')}
            </a>
          </p>
        </div>
        <Button size="sm" variant="secondary" className="w-full shrink-0 sm:w-auto" onClick={dismiss}>
          {t('legal.cookieNotice.accept')}
        </Button>
      </div>
    </div>
  )
}
