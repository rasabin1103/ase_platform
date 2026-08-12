import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MailWarning } from 'lucide-react'
import { resendVerificationEmail } from '../../api/auth.api'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

/** Persistent notice for signed-in users who haven't confirmed their email
 * yet — purchases are blocked server-side until they do. */
export function UnverifiedEmailBanner() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const [sent, setSent] = useState(false)

  const mutation = useMutation({
    mutationFn: resendVerificationEmail,
    onSuccess: () => setSent(true),
  })

  if (!currentUser || currentUser.email_verified_at) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/25 bg-cyan-300/10 px-6 py-2 text-sm text-cyan-100">
      <div className="flex items-center gap-2">
        <MailWarning className="h-4 w-4" strokeWidth={1.75} />
        <span>{t('emailVerification.bannerText')}</span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={mutation.isPending || sent}
        onClick={() => mutation.mutate()}
      >
        {sent ? t('emailVerification.sent') : t('emailVerification.resend')}
      </Button>
    </div>
  )
}
