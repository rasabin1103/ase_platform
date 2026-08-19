import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

/**
 * Native Web Share API (navigator.share) when available — mainly mobile
 * browsers and some desktop browsers. Falls back to copying the URL to the
 * clipboard everywhere else, so the button always does *something* useful
 * instead of silently failing on unsupported browsers.
 */
export function ShareButton({ title, text, url }: { title: string; text?: string; url: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  const handleShare = async () => {
    setError(false)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url })
        return
      } catch {
        // AbortError (user cancelled) or unsupported — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError(true)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        leftIcon={copied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Share2 className="h-4 w-4" strokeWidth={1.75} />}
        onClick={handleShare}
      >
        {copied ? t('catalog.share.copied') : t('catalog.share.button')}
      </Button>
      {error ? <span className="text-[11px] text-rose-300">{t('catalog.share.error')}</span> : null}
    </div>
  )
}
