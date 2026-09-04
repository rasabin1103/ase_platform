import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { updateProfile, uploadAvatar, replaceMyLinks } from '../../api/auth.api'
import { createBillingPortalSession } from '../../api/billing.api'
import { clearProfileLinksDraft, getProfileLinksDraft, setProfileLinksDraft } from '../../auth/auth.store'
import type { UserLink } from '../../types/auth.types'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Switch } from '../../components/ui/Switch'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import { InvoiceHistoryCard } from '../../components/billing/InvoiceHistoryCard'
import { TwoFactorPanel } from '../../components/profile/TwoFactorPanel'
import { localizedPlanText } from '../../components/public/pricingFromPlans'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'
import { avatarDisplayPath } from '../../utils/mediaUrls'

type ProfileForm = {
  first_name: string
  last_name: string
  display_name: string
  phone_e164: string
}

export function ProfilePage() {
  const { t, language } = useI18n()
  const { currentUser, applyCurrentUser, loadCurrentUser } = useAuth()
  const { primaryRole, isSuperuser } = useRbac()
  const [creatorModalOpen, setCreatorModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarSaved, setAvatarSaved] = useState(false)
  const [avatarRevision, setAvatarRevision] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)

  const form = useForm<ProfileForm>({
    defaultValues: { first_name: '', last_name: '', display_name: '', phone_e164: '' },
  })

  useEffect(() => {
    if (!currentUser) return
    form.reset({
      first_name: currentUser.first_name ?? '',
      last_name: currentUser.last_name ?? '',
      display_name: currentUser.display_name ?? '',
      phone_e164: currentUser.phone_e164 ?? '',
    })
  }, [currentUser, form])

  const avatarPreviewSrc = useMemo(
    () => avatarDisplayPath(currentUser?.has_avatar, currentUser?.avatar_url),
    [currentUser?.has_avatar, currentUser?.avatar_url],
  )

  const isIndependent = primaryRole === 'independent_user' && !isSuperuser
  const canCreate = Boolean(currentUser?.can_create_content)
  const creatorStatus = currentUser?.creator_status ?? 'none'
  const showCreatorCta =
    isIndependent && !canCreate && creatorStatus !== 'pending' && creatorStatus !== 'approved'

  const avatarCacheKey = useMemo(
    () => `${currentUser?.updated_at ?? ''}-${avatarRevision}-${currentUser?.has_avatar ? '1' : '0'}`,
    [currentUser?.updated_at, currentUser?.has_avatar, avatarRevision],
  )

  const avatarMut = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (me) => {
      applyCurrentUser(me)
      setAvatarRevision((n) => n + 1)
      setAvatarSaved(true)
      setTimeout(() => setAvatarSaved(false), 3000)
    },
  })

  const saveMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: (me) => {
      applyCurrentUser(me)
      setSaveError(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        t('profilePage.saveError')
      setSaveError(typeof msg === 'string' ? msg : t('profilePage.saveError'))
    },
  })

  const [newsletterSaved, setNewsletterSaved] = useState(false)
  const [newsletterError, setNewsletterError] = useState<string | null>(null)
  const newsletterMut = useMutation({
    mutationFn: updateProfile,
    onSuccess: (me) => {
      applyCurrentUser(me)
      setNewsletterError(null)
      setNewsletterSaved(true)
      setTimeout(() => setNewsletterSaved(false), 3000)
    },
    onError: () => setNewsletterError(t('profilePage.newsletter.error') as string),
  })

  // Restored synchronously on mount so a remount (switching browser tabs
  // and coming back, navigating away and returning) never shows an empty
  // list first, even for a split second.
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>(() => getProfileLinksDraft() ?? [])
  const [linksSaved, setLinksSaved] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)
  // Whether `links` has been populated at least once — either from a
  // pending local draft (restored above) or from the server. Gates the
  // effects below so a just-restored draft is never clobbered by the
  // server value, and so we don't start persisting drafts before there's
  // real data to persist.
  const [linksHydrated, setLinksHydrated] = useState(() => getProfileLinksDraft() !== null)

  // `links` starts from currentUser.links but is then locally editable
  // (add/remove/edit rows below) before saving. Hydrate from the server
  // exactly once, and only if there wasn't already a pending draft — a
  // draft means the user has unsaved edits that must win over the server.
  // Done during render (React's supported pattern for this — see
  // react.dev/learn/you-might-not-need-an-effect) rather than in a
  // useEffect, so it doesn't trigger an extra commit.
  if (!linksHydrated && currentUser) {
    setLinksHydrated(true)
    setLinks((currentUser.links ?? []).map((l: UserLink) => ({ label: l.label, url: l.url })))
  }

  // Persist every edit to localStorage so unsaved changes survive a
  // remount of this page instead of silently disappearing — this is the
  // fix for "los enlaces se pierden al cambiar de pestaña".
  useEffect(() => {
    if (!linksHydrated) return
    setProfileLinksDraft(links)
  }, [links, linksHydrated])

  const linksMut = useMutation({
    mutationFn: replaceMyLinks,
    onSuccess: (me) => {
      applyCurrentUser(me)
      setLinks((me.links ?? []).map((l: UserLink) => ({ label: l.label, url: l.url })))
      clearProfileLinksDraft()
      setLinksError(null)
      setLinksSaved(true)
      setTimeout(() => setLinksSaved(false), 3000)
    },
    onError: () => setLinksError(t('orgMembership.profileLinks.saveError') as string),
  })

  const isAdmin = isSuperuser || primaryRole === 'super_admin'
  const name = currentUser?.display_name || currentUser?.email || ''
  const hasPhone = Boolean(currentUser?.phone_e164)
  const phoneVerified = Boolean(currentUser?.phone_verified)

  const planLabel = currentUser?.plan_code
    ? localizedPlanText(language, currentUser.plan_name, currentUser.plan_name_en)
    : null
  const subscriptionStatus = currentUser?.subscription_status ?? null
  const [billingError, setBillingError] = useState<string | null>(null)
  const billingPortalMut = useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: (url) => {
      window.location.href = url
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      const msg =
        typeof detail === 'string' && detail.toLowerCase().includes('subscribe to a plan first')
          ? t('profilePage.billing.noAccount')
          : t('profilePage.billing.error')
      setBillingError(msg as string)
    },
  })

  const onSave = form.handleSubmit((values) =>
    saveMut.mutate({
      first_name: values.first_name || null,
      last_name: values.last_name || null,
      display_name: values.display_name || null,
      phone_e164: values.phone_e164.trim() || null,
    }),
  )

  return (
    <div className="w-full space-y-8 pb-16">
      <PremiumHero
        accent={isAdmin ? 'violet' : 'cyan'}
        badge={isAdmin ? t('adminDashboard.heroBadge') : t('independentDashboard.heroBadge')}
        title={`${t('profilePage.title')}${name ? ` — ${name}` : ''}`}
        subtitle={t('profilePage.subtitle')}
      />

      {showCreatorCta ? (
        <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-4xl">
              <h2 className="text-lg font-semibold text-ase-text sm:text-xl">
                {t('requestsPage.creatorCtaTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ase-text2 sm:text-base">
                {t('requestsPage.creatorCtaDescription')}
              </p>
            </div>
            <Button type="button" className="shrink-0 self-start lg:self-center" onClick={() => setCreatorModalOpen(true)}>
              {t('requestsPage.creatorCtaButton')}
            </Button>
          </div>
        </Card>
      ) : null}

      {isIndependent && canCreate ? (
        <Card className="w-full border-cyan-300/20 bg-cyan-300/5 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-ase-text">{t('requestsPage.createContentSection')}</h2>
          <p className="mt-2 text-sm text-ase-text2">{t('requestsPage.createContentHint')}</p>
        </Card>
      ) : null}

      <div className="w-full space-y-6">
        <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <h2 className="text-lg font-semibold text-ase-text">{t('profilePage.billing.title')}</h2>
          <p className="mt-1 text-sm text-ase-text2">{t('profilePage.billing.subtitle')}</p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-ase-muted">{t('profilePage.billing.currentPlan')}</span>
                {planLabel ? (
                  <Badge variant="info" className="uppercase tracking-wide">
                    {planLabel}
                  </Badge>
                ) : (
                  <Badge variant="default">{t('profilePage.billing.freePlan')}</Badge>
                )}
                {subscriptionStatus ? (
                  <Badge variant={subscriptionStatus === 'past_due' ? 'warning' : 'success'}>
                    {t(`profilePage.billing.status.${subscriptionStatus}`)}
                  </Badge>
                ) : null}
              </div>
            </div>
            {currentUser?.plan_code ? (
              <Button type="button" onClick={() => billingPortalMut.mutate()} disabled={billingPortalMut.isPending}>
                {billingPortalMut.isPending ? t('profilePage.billing.opening') : t('profilePage.billing.manageButton')}
              </Button>
            ) : (
              <Link to="/pricing">
                <Button type="button">{t('profilePage.billing.viewPlans')}</Button>
              </Link>
            )}
          </div>
          {billingError ? <p className="mt-3 text-sm text-ase-error">{billingError}</p> : null}
        </Card>

        {currentUser?.plan_code ? <InvoiceHistoryCard /> : null}

        <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <h2 className="text-lg font-semibold text-ase-text">{t('profilePage.newsletter.title')}</h2>
          <p className="mt-1 text-sm text-ase-text2">{t('profilePage.newsletter.subtitle')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Switch
              checked={Boolean(currentUser?.newsletter_subscribed)}
              onCheckedChange={(next) => newsletterMut.mutate({ newsletter_subscribed: next })}
              disabled={newsletterMut.isPending}
              label={t('profilePage.newsletter.toggleLabel') as string}
            />
            {newsletterSaved ? <span className="text-sm text-emerald-300">{t('profilePage.newsletter.saved')}</span> : null}
          </div>
          {newsletterError ? <p className="mt-2 text-sm text-ase-error">{newsletterError}</p> : null}
        </Card>

        <Card className="w-full space-y-6 rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <ImageUploadField
            label={t('profilePage.photo')}
            hint={t('profilePage.photoHint')}
            uploadLabel={t('profilePage.uploadPhoto')}
            previewSrc={avatarPreviewSrc}
            previewCacheKey={avatarCacheKey}
            onFileSelect={(file) => avatarMut.mutate(file)}
            uploading={avatarMut.isPending}
          />
          {avatarMut.isError ? (
            <p className="text-sm text-ase-error">{t('profilePage.uploadError')}</p>
          ) : null}
          {avatarSaved ? <p className="text-sm text-cyan-300">{t('profilePage.photoSaved')}</p> : null}
        </Card>

        <form className="w-full space-y-6" onSubmit={onSave}>
          <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
            <h2 className="text-lg font-semibold text-ase-text">{t('profilePage.accountSection')}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <Row label={t('profilePage.email')} value={currentUser?.email ?? '—'} />
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('profilePage.firstName')}</span>
                <Input {...form.register('first_name')} className="rounded-xl border-white/10 bg-ase-bg2/50" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ase-muted">{t('profilePage.lastName')}</span>
                <Input {...form.register('last_name')} className="rounded-xl border-white/10 bg-ase-bg2/50" />
              </label>
              <label className="block sm:col-span-2 lg:col-span-1">
                <span className="mb-1 block text-xs text-ase-muted">{t('profilePage.displayName')}</span>
                <Input {...form.register('display_name')} className="rounded-xl border-white/10 bg-ase-bg2/50" />
              </label>
              <div className="sm:col-span-2 lg:col-span-3">
                <Row label={t('profilePage.role')} value={primaryRole ?? '—'} />
                <p className="mt-3 text-sm text-ase-muted">
                  {isAdmin ? t('profilePage.adminNote') : t('profilePage.independentNote')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
            <h2 className="text-lg font-semibold text-ase-text">{t('profilePage.securitySection')}</h2>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ase-muted">{t('profilePage.phone')}</span>
                  {hasPhone ? (
                    <Badge variant={phoneVerified ? 'success' : 'warning'}>
                      {phoneVerified ? t('profilePage.phoneVerified') : t('profilePage.phoneNotVerified')}
                    </Badge>
                  ) : null}
                </div>
                <Input
                  {...form.register('phone_e164')}
                  type="tel"
                  placeholder={t('profilePage.phonePlaceholder')}
                  className="rounded-xl border-white/10 bg-ase-bg2/50"
                />
                <p className="mt-2 text-xs text-ase-muted">{t('profilePage.phoneHint')}</p>
                <Button type="button" variant="secondary" className="mt-3" disabled>
                  {t('profilePage.verifyPhoneSoon')}
                </Button>
              </div>

              <TwoFactorPanel />
            </div>
          </Card>

          {saveError ? <p className="text-sm text-ase-error">{saveError}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saveMut.isPending}>
              {t('profilePage.save')}
            </Button>
            {saved ? <span className="text-sm text-emerald-300">{t('profilePage.saved')}</span> : null}
          </div>
        </form>

        <Card className="w-full rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <h2 className="text-lg font-semibold text-ase-text">{t('orgMembership.profileLinks.title')}</h2>
          <p className="mt-1 text-sm text-ase-text2">{t('orgMembership.profileLinks.subtitle')}</p>

          <div className="mt-4 space-y-3">
            {links.length === 0 ? (
              <p className="text-sm text-ase-muted">{t('orgMembership.profileLinks.empty')}</p>
            ) : (
              links.map((link, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const next = [...links]
                      next[i] = { ...next[i], label: e.target.value }
                      setLinks(next)
                    }}
                    placeholder={t('orgMembership.profileLinks.labelPlaceholder') as string}
                    className="rounded-xl border-white/10 bg-ase-bg2/50 sm:w-48"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const next = [...links]
                      next[i] = { ...next[i], url: e.target.value }
                      setLinks(next)
                    }}
                    placeholder={t('orgMembership.profileLinks.urlPlaceholder') as string}
                    className="rounded-xl border-white/10 bg-ase-bg2/50 sm:flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLinks(links.filter((_, idx) => idx !== i))}
                  >
                    {t('orgMembership.profileLinks.remove')}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLinks([...links, { label: '', url: '' }])}
            >
              {t('orgMembership.profileLinks.addButton')}
            </Button>
            <Button
              type="button"
              disabled={linksMut.isPending}
              onClick={() =>
                linksMut.mutate(
                  links
                    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
                    .filter((l) => l.label && l.url),
                )
              }
            >
              {t('orgMembership.profileLinks.save')}
            </Button>
            {linksSaved ? <span className="text-sm text-emerald-300">{t('orgMembership.profileLinks.saved')}</span> : null}
          </div>
          {linksError ? <p className="mt-2 text-sm text-ase-error">{linksError}</p> : null}
        </Card>
      </div>

      <AccessRequestModal
        open={creatorModalOpen}
        onClose={() => setCreatorModalOpen(false)}
        onSuccess={() => void loadCurrentUser()}
        requestType="creator_access"
        targetType="platform_creator_permission"
        title={t('requestsPage.creatorModalTitle')}
        modalTitle={t('requestsPage.creatorModalTitle')}
        modalDescription={t('requestsPage.creatorCtaDescription')}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
      <span className="text-sm text-ase-muted">{label}</span>
      <span className="text-sm font-medium text-ase-text">{value}</span>
    </div>
  )
}
