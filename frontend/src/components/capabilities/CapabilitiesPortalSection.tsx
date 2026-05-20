import { useMemo } from 'react'
import { useI18n, tStringArray } from '../../i18n'
import { CAPABILITY_ICONS } from './capabilityIcons'
import { EmptyCapabilityState } from './EmptyCapabilityState'
import { RequestCapabilityCard, resolveCapabilityCta } from './RequestCapabilityCard'
import type { CapabilityId, CapabilityStatus } from './types'
import { useUserCapabilities } from './useUserCapabilities'

type Props = {
  onRequestCreator?: () => void
  showEmptyWhenNoActive?: boolean
  /** Dashboard: only highlight creator + catalog access */
  variant?: 'full' | 'compact'
}

function itemKey(id: CapabilityId, field: string) {
  return `capabilities.items.${id}.${field}` as const
}

export function CapabilitiesPortalSection({
  onRequestCreator,
  showEmptyWhenNoActive,
  variant = 'full',
}: Props) {
  const { t } = useI18n()
  const { capabilities, canCreate, showCreatorRequestCta } = useUserCapabilities()

  const labelsFor = (id: CapabilityId, status: CapabilityStatus) => {
    const item = {
      request: t(itemKey(id, 'ctaRequest')) as string,
      active: t(itemKey(id, 'ctaActive')) as string,
      pending: t(itemKey(id, 'ctaPending')) as string,
      restricted: t(itemKey(id, 'ctaRestricted')) as string,
    }
    return resolveCapabilityCta(status, item)
  }

  const statusLabel = (status: CapabilityStatus) =>
    t(`capabilities.status.${status}`) as string

  const visibleIds = useMemo<CapabilityId[] | null>(() => {
    if (variant === 'compact') return ['content_creator', 'catalog_access']
    return null
  }, [variant])

  const filteredCapabilities = useMemo(() => {
    if (!visibleIds) return capabilities
    return capabilities.filter((c) => visibleIds.includes(c.id))
  }, [capabilities, visibleIds])

  const grouped = useMemo(() => {
    const active = filteredCapabilities.filter((c) => c.status === 'active')
    const available = filteredCapabilities.filter((c) => c.status === 'available')
    const other = filteredCapabilities.filter(
      (c) => !['active', 'available'].includes(c.status) && c.id !== 'catalog_access',
    )
    return { active, available, other }
  }, [filteredCapabilities])

  const renderCard = (id: CapabilityId, status: CapabilityStatus) => {
    const cta = labelsFor(id, status)
    const isCreator = id === 'content_creator'

    return (
      <RequestCapabilityCard
        key={id}
        icon={CAPABILITY_ICONS[id]}
        accent={isCreator ? 'violet' : 'cyan'}
        title={t(itemKey(id, 'title')) as string}
        description={t(itemKey(id, 'description')) as string}
        benefits={tStringArray(t, itemKey(id, 'benefits'))}
        status={status}
        statusLabel={statusLabel(status)}
        tooltip={t(itemKey(id, 'tooltip')) as string}
        ctaLabel={cta.label}
        ctaDisabled={cta.disabled}
        ctaVariant={cta.variant}
        onCta={
          isCreator && showCreatorRequestCta && onRequestCreator
            ? onRequestCreator
            : id === 'private_demos' || id === 'catalog_access'
              ? undefined
              : undefined
        }
        ctaHref={
          id === 'private_demos' || id === 'catalog_access'
            ? '/catalog/products'
            : id === 'publish_products' && status === 'active'
              ? '/products'
              : id === 'publish_courses' && status === 'active'
                ? '/courses'
                : undefined
        }
      />
    )
  }

  const hasActiveCreator = canCreate || grouped.active.length > 1

  return (
    <section className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
          {t('capabilities.portal.badge')}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ase-text sm:text-3xl">
          {t('capabilities.portal.title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ase-text2 sm:text-base">
          {t('capabilities.portal.subtitle')}
        </p>
        <p className="mt-2 text-sm text-ase-muted">{t('capabilities.portal.heroLine')}</p>
      </div>

      {showEmptyWhenNoActive && !hasActiveCreator && !showCreatorRequestCta ? (
        <EmptyCapabilityState
          title={t('capabilities.empty.title') as string}
          description={t('capabilities.empty.description') as string}
          actionLabel={onRequestCreator ? (t('capabilities.empty.cta') as string) : undefined}
          onAction={onRequestCreator}
        />
      ) : null}

      {grouped.active.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">
            {t('capabilities.portal.activeSection')}
          </h3>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {grouped.active.map((c) => renderCard(c.id, c.status))}
          </div>
        </div>
      ) : null}

      {(grouped.available.length > 0 || showCreatorRequestCta) ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">
            {t('capabilities.portal.availableSection')}
          </h3>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {grouped.available.map((c) => renderCard(c.id, c.status))}
          </div>
        </div>
      ) : null}

      {grouped.other.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ase-muted">
            {t('capabilities.portal.lockedSection')}
          </h3>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {grouped.other.map((c) => renderCard(c.id, c.status))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
