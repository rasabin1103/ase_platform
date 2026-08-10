import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useI18n } from '../../i18n'
import { CAPABILITY_ICONS } from './capabilityIcons'
import { FeatureStatusBadge } from './FeatureStatusBadge'
import type { CapabilityId, CapabilityStatus } from './types'
import { useUserCapabilities } from './useUserCapabilities'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'

type Props = {
  onRequestCreator?: () => void
  className?: string
}

function itemKey(id: CapabilityId, field: string) {
  return `capabilities.items.${id}.${field}` as const
}

const STRIP_IDS: CapabilityId[] = ['catalog_access', 'private_demos', 'content_creator']

export function CapabilitiesCompactStrip({ onRequestCreator, className }: Props) {
  const { t } = useI18n()
  const { capabilities, showCreatorRequestCta } = useUserCapabilities()

  const items = useMemo(
    () => STRIP_IDS.map((id) => capabilities.find((c) => c.id === id)).filter(Boolean) as {
      id: CapabilityId
      status: CapabilityStatus
    }[],
    [capabilities],
  )

  return (
    <Card
      className={cn(
        'rounded-[1.75rem] border-white/[0.08] bg-ase-surface/55 p-4 sm:p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/75">
            {t('capabilities.strip.label')}
          </p>
          <p className="mt-1 text-sm text-ase-text2">{t('capabilities.strip.hint')}</p>
        </div>
        <Link
          to="/requests"
          className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          {t('capabilities.portal.viewAllRequests')} →
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map(({ id, status }) => {
          const Icon = CAPABILITY_ICONS[id]
          const title = t(itemKey(id, 'title')) as string
          const isCreator = id === 'content_creator'
          const href =
            id === 'catalog_access' || id === 'private_demos'
              ? '/catalog/products'
              : isCreator && status === 'active'
                ? '/products'
                : undefined

          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                <Icon className="h-4 w-4 text-cyan-100/90" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ase-text">{title}</span>
                <FeatureStatusBadge
                  status={status}
                  label={t(`capabilities.status.${status}`) as string}
                  className="mt-1 scale-90 origin-left"
                />
              </span>
            </>
          )

          const pillClass = cn(
            'flex min-w-[min(100%,220px)] flex-1 items-center gap-3 rounded-2xl border border-white/[0.08]',
            'bg-white/[0.03] px-3 py-2.5 transition hover:border-cyan-300/20 hover:bg-white/[0.05]',
          )

          if (href) {
            return (
              <Link key={id} to={href} className={pillClass}>
                {inner}
              </Link>
            )
          }

          if (isCreator && showCreatorRequestCta && onRequestCreator) {
            return (
              <button key={id} type="button" className={cn(pillClass, 'text-left')} onClick={onRequestCreator}>
                {inner}
              </button>
            )
          }

          return (
            <div key={id} className={pillClass}>
              {inner}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
