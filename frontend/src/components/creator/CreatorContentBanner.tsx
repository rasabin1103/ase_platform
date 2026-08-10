import { useState } from 'react'
import { useI18n, tStringArray } from '../../i18n'
import { useRbac } from '../../rbac/useRbac'
import { RequestCapabilityCard, resolveCapabilityCta } from '../capabilities'
import { CAPABILITY_ICONS } from '../capabilities/capabilityIcons'
import { useUserCapabilities } from '../capabilities/useUserCapabilities'
import { CreatorApplicationModal } from './CreatorApplicationModal'

export function CreatorContentBanner() {
  const { t } = useI18n()
  const { primaryRole, hasPermission, isConsumerMode } = useRbac()
  const { getStatus, showCreatorRequestCta } = useUserCapabilities()
  const [open, setOpen] = useState(false)

  if (!isConsumerMode && primaryRole !== 'independent_user' && !hasPermission('creator.request')) {
    return null
  }

  const status = getStatus('content_creator')
  const cta = resolveCapabilityCta(status, {
    request: t('creatorApplication.requestAuthorization') as string,
    active: t('capabilities.items.content_creator.ctaActive') as string,
    pending: t('capabilities.items.content_creator.ctaPending') as string,
    restricted: t('capabilities.items.content_creator.ctaRestricted') as string,
  })

  return (
    <>
      <RequestCapabilityCard
        className="mb-8"
        icon={CAPABILITY_ICONS.content_creator}
        accent="violet"
        title={t('capabilities.items.content_creator.title') as string}
        description={t('creatorApplication.requiresApproval') as string}
        benefits={tStringArray(t, 'capabilities.items.content_creator.benefits').slice(0, 3)}
        status={status}
        statusLabel={t(`capabilities.status.${status}`) as string}
        tooltip={t('capabilities.items.content_creator.tooltip') as string}
        ctaLabel={cta.label}
        ctaDisabled={cta.disabled || !showCreatorRequestCta}
        ctaVariant={cta.variant}
        onCta={showCreatorRequestCta ? () => setOpen(true) : undefined}
      />
      <CreatorApplicationModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
