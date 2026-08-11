import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { avatarDisplayPath, isApiMediaPath } from '../../utils/mediaUrls'
import { cn } from '../ui/cn'

type WelcomeBannerProps = {
  /** `stacked` = avatar centered above the name (standalone use).
   * `inline` = compact avatar beside the name, meant to sit inside a header row.
   * `lead` = larger avatar leading the greeting, meant to be the first, most
   * prominent element of a header — photo up front, name right after it. */
  variant?: 'stacked' | 'inline' | 'lead'
}

/** Avatar + name greeting shown inside each role dashboard's header, right
 * after login (Independent, Admin, Organization). The avatar always reflects
 * the currently stored account photo — see `avatarDisplayPath`/`AuthenticatedImage`,
 * the same mechanism ProfilePage uses, so it stays in sync across logins. */
export function WelcomeBanner({ variant = 'stacked' }: WelcomeBannerProps) {
  const { currentUser } = useAuth()
  const { t } = useI18n()

  const name = currentUser?.display_name || currentUser?.email || ''
  const initials = (currentUser?.display_name || currentUser?.email || '?').trim().slice(0, 1).toUpperCase()
  const avatarSrc = avatarDisplayPath(currentUser?.has_avatar, currentUser?.avatar_url)
  const cacheKey = `${currentUser?.updated_at ?? ''}-${currentUser?.has_avatar ? '1' : '0'}`
  const size = variant === 'inline' ? 'h-11 w-11' : variant === 'lead' ? 'h-16 w-16' : 'h-20 w-20'
  const fallbackTextSize = variant === 'inline' ? 'text-sm' : variant === 'lead' ? 'text-xl' : 'text-2xl'

  const avatar = (
    <div className={cn('shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.3)]', size)}>
      {avatarSrc && isApiMediaPath(avatarSrc) ? (
        <AuthenticatedImage
          src={avatarSrc}
          cacheKey={cacheKey}
          className="h-full w-full"
          fallback={<span className={cn('font-semibold text-ase-text2', fallbackTextSize)}>{initials}</span>}
        />
      ) : avatarSrc ? (
        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center font-semibold text-ase-text2', fallbackTextSize)}>
          {initials}
        </div>
      )}
    </div>
  )

  const greeting = String(t('dashboardWelcome.greeting')).replace('{{name}}', name)

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        {avatar}
        <span className="max-w-[14rem] truncate text-sm font-semibold text-ase-text">{greeting}</span>
      </div>
    )
  }

  if (variant === 'lead') {
    return (
      <div className="flex items-center gap-4">
        {avatar}
        <span className="max-w-md truncate text-xl font-bold text-ase-text sm:text-2xl">{greeting}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
      {avatar}
      <div className="text-lg font-semibold text-ase-text">{greeting}</div>
    </div>
  )
}
