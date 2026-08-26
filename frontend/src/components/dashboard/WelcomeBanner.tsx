import { Award } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'
import { AuthenticatedImage } from '../ui/AuthenticatedImage'
import { Badge } from '../ui/Badge'
import { localizedPlanText } from '../public/pricingFromPlans'
import { avatarDisplayPath, isApiMediaPath } from '../../utils/mediaUrls'
import { cn } from '../ui/cn'

// Tier-specific accents — kept separate from Badge's built-in variants since
// none of those map to "silver/gold/platinum" colors.
const LOYALTY_TIER_CLASSES: Record<string, string> = {
  silver: 'border-slate-300/40 bg-slate-300/10 text-slate-200',
  gold: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  platinum: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200',
  infinite: 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200',
}

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
  const { t, language } = useI18n()
  const { isConsumerMode } = useRbac()

  const name = currentUser?.display_name || currentUser?.email || ''
  const initials = (currentUser?.display_name || currentUser?.email || '?').trim().slice(0, 1).toUpperCase()
  const avatarSrc = avatarDisplayPath(currentUser?.has_avatar, currentUser?.avatar_url)
  const cacheKey = `${currentUser?.updated_at ?? ''}-${currentUser?.has_avatar ? '1' : '0'}`
  const size = variant === 'inline' ? 'h-11 w-11' : variant === 'lead' ? 'h-16 w-16' : 'h-20 w-20'
  const fallbackTextSize = variant === 'inline' ? 'text-sm' : variant === 'lead' ? 'text-xl' : 'text-2xl'

  const hasActivePlan =
    Boolean(currentUser?.plan_code) &&
    (currentUser?.subscription_status === 'active' || currentUser?.subscription_status === 'trialing')
  // An independent user with no paid subscription is still on a plan — the
  // free one. Show that by default instead of leaving the badge slot empty
  // (which used to make "you're on the free plan" only discoverable by
  // clicking the separate upsell CTA on the dashboard). Only independent
  // users have plans at all, so admins/org members never get this fallback.
  const planLabel = hasActivePlan
    ? localizedPlanText(language, currentUser?.plan_name, currentUser?.plan_name_en)
    : isConsumerMode
      ? String(t('dashboardWelcome.freePlan'))
      : null
  const planBadge = planLabel ? (
    <Badge variant={hasActivePlan ? 'info' : 'default'} className="shrink-0 uppercase tracking-wide">
      {planLabel}
    </Badge>
  ) : null

  const loyaltyTier = currentUser?.loyalty_tier ?? null
  const loyaltyLabel = loyaltyTier ? String(t(`dashboardWelcome.loyalty.${loyaltyTier}`)) : null
  const loyaltyBadge = loyaltyTier && loyaltyLabel ? (
    <Badge
      className={cn('shrink-0 gap-1 uppercase tracking-wide', LOYALTY_TIER_CLASSES[loyaltyTier] ?? '')}
    >
      <Award className="h-3 w-3" strokeWidth={2} />
      {loyaltyLabel}
    </Badge>
  ) : null

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
        <img src={avatarSrc} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center font-semibold text-ase-text2', fallbackTextSize)}>
          {initials}
        </div>
      )}
    </div>
  )

  // Split the greeting template around the {{name}} placeholder instead of
  // flattening it into one plain string, so the name itself can be styled
  // (italic) separately from the rest of the greeting.
  const [greetingPrefix, greetingSuffix] = String(t('dashboardWelcome.greeting')).split('{{name}}')
  const greeting = (
    <>
      {greetingPrefix}
      <em className="italic text-ase-text">{name}</em>
      {greetingSuffix}
    </>
  )

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3">
        {avatar}
        <span className="max-w-[14rem] truncate text-sm font-semibold text-ase-text">{greeting}</span>
        {planBadge}
        {loyaltyBadge}
      </div>
    )
  }

  if (variant === 'lead') {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {avatar}
        <span className="text-xl font-bold text-ase-text sm:text-2xl">{greeting}</span>
        {planBadge}
        {loyaltyBadge}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3 pb-2 pt-2 text-center">
      {avatar}
      <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-semibold text-ase-text">
        {greeting}
        {planBadge}
        {loyaltyBadge}
      </div>
    </div>
  )
}
