import { useMutation } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  confirmPhoneVerification,
  sendEmailVerification,
  sendPhoneVerification,
  updateProfile,
  uploadAvatar,
} from '../../api/auth.api'
import { ImageUploadField } from '../../components/admin/premium/ImageUploadField'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { PhoneVerifyModal } from '../../components/profile/PhoneVerifyModal'
import { SecurityContactField } from '../../components/profile/SecurityContactField'
import { TwoFactorSecuritySection } from '../../components/profile/TwoFactorSecuritySection'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AccessRequestModal } from '../../components/access-requests/AccessRequestModal'
import { CapabilitiesCompactStrip } from '../../components/capabilities/CapabilitiesCompactStrip'
import { CAPABILITY_ICONS } from '../../components/capabilities/capabilityIcons'
import { useAuth } from '../../auth/AuthProvider'
import { useI18n } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'
import { avatarDisplayPath } from '../../utils/mediaUrls'

type ProfileForm = {
  first_name: string
  last_name: string
  display_name: string
  email: string
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
  const [emailVerifyFeedback, setEmailVerifyFeedback] = useState<'idle' | 'success' | 'error'>('idle')
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  const [phoneDevCode, setPhoneDevCode] = useState<string | null>(null)

  const form = useForm<ProfileForm>({
    defaultValues: { first_name: '', last_name: '', display_name: '', email: '', phone_e164: '' },
  })

  useEffect(() => {
    if (!currentUser) return
    form.reset({
      first_name: currentUser.first_name ?? '',
      last_name: currentUser.last_name ?? '',
      display_name: currentUser.display_name ?? '',
      email: currentUser.email ?? '',
      phone_e164: currentUser.phone_e164 ?? '',
    })
  }, [currentUser, form])

  const watched = form.watch()
  const savedEmail = currentUser?.email ?? ''
  const savedPhone = currentUser?.phone_e164 ?? ''
  const emailDirty = watched.email.trim().toLowerCase() !== savedEmail.toLowerCase()
  const phoneDirty = watched.phone_e164.trim() !== (savedPhone ?? '')
  const emailVerified =
    currentUser?.email_verified === true || Boolean(currentUser?.email_verified_at)
  const phoneVerified = currentUser?.phone_verified === true

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

  const emailVerifyMut = useMutation({
    mutationFn: sendEmailVerification,
    onMutate: () => setEmailVerifyFeedback('idle'),
    onSuccess: () => setEmailVerifyFeedback('success'),
    onError: () => setEmailVerifyFeedback('error'),
  })

  const phoneSendMut = useMutation({
    mutationFn: sendPhoneVerification,
    onSuccess: (res) => {
      setPhoneDevCode(res.dev_code ?? null)
      setPhoneModalOpen(true)
    },
  })

  const phoneConfirmMut = useMutation({
    mutationFn: confirmPhoneVerification,
    onSuccess: (me) => {
      applyCurrentUser(me)
      setPhoneModalOpen(false)
      setPhoneDevCode(null)
    },
  })

  const isAdmin = isSuperuser || primaryRole === 'super_admin'
  const name = currentUser?.display_name || currentUser?.email || ''

  const onSave = form.handleSubmit((values) =>
    saveMut.mutate({
      first_name: values.first_name || null,
      last_name: values.last_name || null,
      display_name: values.display_name || null,
      email: values.email.trim() || undefined,
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
        <CapabilitiesCompactStrip onRequestCreator={() => setCreatorModalOpen(true)} />
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
            <div className="mt-4 grid gap-8 lg:grid-cols-2">
              <div>
                <SecurityContactField
                  label={t('profilePage.email')}
                  hint={t('profilePage.emailHint')}
                  value={watched.email}
                  onChange={(v) => {
                    form.setValue('email', v)
                    setEmailVerifyFeedback('idle')
                  }}
                  inputType="email"
                  verified={emailVerified && !emailDirty}
                  verifyLabel={t('profilePage.verify')}
                  verifiedLabel={t('profilePage.verified')}
                  onVerify={() => emailVerifyMut.mutate()}
                  verifyPending={emailVerifyMut.isPending}
                  verifyDisabled={emailDirty || saveMut.isPending}
                />
                {emailVerifyMut.isPending ? (
                  <p className="mt-2 text-xs text-ase-muted">{t('profilePage.emailVerifySending')}</p>
                ) : null}
                {emailVerifyFeedback === 'success' ? (
                  <p className="mt-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                    {t('profilePage.emailVerifySent')}
                  </p>
                ) : null}
                {emailVerifyFeedback === 'error' ? (
                  <p className="mt-2 rounded-xl border border-ase-error/25 bg-ase-error/10 px-3 py-2 text-sm text-ase-error">
                    {t('profilePage.emailVerifySendError')}
                  </p>
                ) : null}
              </div>
              {emailDirty ? (
                <p className="-mt-4 text-xs text-amber-200/90 lg:col-span-2">{t('profilePage.saveBeforeVerify')}</p>
              ) : null}

              <SecurityContactField
                label={t('profilePage.phone')}
                hint={t('profilePage.phoneHint')}
                value={watched.phone_e164}
                onChange={(v) => form.setValue('phone_e164', v)}
                inputType="tel"
                placeholder={t('profilePage.phonePlaceholder')}
                verified={phoneVerified && !phoneDirty}
                verifyLabel={t('profilePage.verify')}
                verifiedLabel={t('profilePage.verified')}
                onVerify={() => phoneSendMut.mutate()}
                verifyPending={phoneSendMut.isPending}
                verifyDisabled={phoneDirty || saveMut.isPending || !watched.phone_e164.trim()}
              />
              {phoneDirty ? (
                <p className="-mt-4 text-xs text-amber-200/90 lg:col-span-2">{t('profilePage.saveBeforeVerify')}</p>
              ) : null}

              <div className="mb-3">
                <Link
                  to="/profile/security"
                  className="text-sm font-medium text-cyan-300 hover:underline"
                >
                  {t('securityOnboarding.goToSecurity')} →
                </Link>
              </div>
              <TwoFactorSecuritySection twoFactorEnabled={currentUser?.two_factor_enabled === true} />
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

      <PhoneVerifyModal
        open={phoneModalOpen}
        onClose={() => {
          setPhoneModalOpen(false)
          setPhoneDevCode(null)
        }}
        devCode={phoneDevCode}
        isPending={phoneConfirmMut.isPending}
        onConfirm={async (code) => {
          await phoneConfirmMut.mutateAsync(code)
        }}
      />

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
