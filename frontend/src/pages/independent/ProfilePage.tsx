import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { updateProfile, uploadAvatar } from '../../api/auth.api'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import { CapabilitiesPortalSection } from '../../components/capabilities'
import { CAPABILITY_ICONS } from '../../components/capabilities/capabilityIcons'
import { useAuth } from '../../auth/AuthProvider'
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
  const { t } = useI18n()
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

  const isAdmin = isSuperuser || primaryRole === 'super_admin'
  const name = currentUser?.display_name || currentUser?.email || ''
  const hasPhone = Boolean(currentUser?.phone_e164)
  const phoneVerified = Boolean(currentUser?.phone_verified)

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

      {isIndependent ? (
        <CapabilitiesPortalSection onRequestCreator={() => setCreatorModalOpen(true)} />
      ) : null}

      <div className="w-full space-y-6">
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

              <div className="lg:border-l lg:border-white/10 lg:pl-6">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ase-text">{t('profilePage.twoFactor')}</span>
                  <Badge variant={currentUser?.two_factor_enabled ? 'success' : 'default'}>
                    {currentUser?.two_factor_enabled
                      ? t('profilePage.twoFactorEnabled')
                      : t('profilePage.twoFactorDisabled')}
                  </Badge>
                </div>
                <p className="text-xs text-ase-muted">
                  {hasPhone && phoneVerified
                    ? t('profilePage.twoFactorSoon')
                    : t('profilePage.twoFactorRequiresPhone')}
                </p>
                <Button type="button" variant="outline" className="mt-3" disabled>
                  {t('profilePage.twoFactorSoon')}
                </Button>
              </div>
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
        icon={CAPABILITY_ICONS.content_creator}
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
