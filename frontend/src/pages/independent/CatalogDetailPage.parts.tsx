import {
  Ban,
  ChevronDown,
  ChevronUp,
  Files,
  HardDrive,
  History,
  Info,
  LifeBuoy,
  ListChecks,
  RefreshCw,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { MarkdownContent } from '../../components/catalog/MarkdownViewer'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { cn } from '../../components/ui/cn'
import { DESCRIPTION_COLLAPSE_THRESHOLD, formatBytes, formatCatalogDate } from './CatalogDetailPage.utils'

export function BulletList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          {icon}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{title}</h2>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-ase-text2">
        {items.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ase-brand/70" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function CollapsibleDescription({ content, t }: { content: string; t: (key: string) => string }) {
  const [expanded, setExpanded] = useState(false)
  const overflowing = content.length > DESCRIPTION_COLLAPSE_THRESHOLD

  return (
    <div>
      <div className={cn('relative overflow-hidden', !expanded && overflowing && 'max-h-64')}>
        <MarkdownContent content={content} />
        {!expanded && overflowing ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16" />
        ) : null}
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-cyan-300 hover:underline"
        >
          {expanded ? t('catalog.description.showLess') : t('catalog.description.showMore')}
          {expanded ? (
            <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      ) : null}
    </div>
  )
}

// What's actually inside the package before the buyer commits — formats,
// file count, total size. Reuses getResourceDownloadInfo (metadata off the
// GitHub folder listing, no ownership required) so it can show up before
// purchase, not just after. Renders nothing while loading/unavailable
// rather than an error or skeleton: this is supplementary detail, not
// something that should ever compete for attention with the buy button.
export function DownloadPackagePanel({
  info,
  t,
}: {
  info: { fileCount: number; totalSizeBytes: number; formats: string[] } | undefined
  t: (key: string) => string
}) {
  if (!info || info.fileCount === 0) return null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <Files className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
          {t('catalog.downloadInfo.title')}
        </h2>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ase-text2">
        <span className="flex items-center gap-1.5">
          <Files className="h-3.5 w-3.5 text-ase-muted" strokeWidth={1.75} />
          {info.fileCount} {t(info.fileCount === 1 ? 'catalog.downloadInfo.file' : 'catalog.downloadInfo.files')}
        </span>
        <span className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-ase-muted" strokeWidth={1.75} />
          {formatBytes(info.totalSizeBytes)}
        </span>
      </div>
      {info.formats.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {info.formats.map((fmt) => (
            <Badge key={fmt} variant="info" className="uppercase">
              {fmt}
            </Badge>
          ))}
        </div>
      ) : null}
    </Card>
  )
}

// Admin-written setup/usage instructions (resource type only) — shown right
// after the description so a buyer who already owns the item doesn't have
// to reverse-engineer the package themselves (which file to open first,
// prerequisites, setup steps). Plain text with preserved line breaks, same
// convention as the license/refund-policy free-text fields — not Markdown,
// to keep the admin form a single textarea like every other free-text field
// on this item.
export function GettingStartedPanel({ text, t }: { text: string | null | undefined; t: (key: string) => string }) {
  if (!text) return null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <ListChecks className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
          {t('catalog.gettingStarted.title')}
        </h2>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ase-text2">{text}</p>
    </Card>
  )
}

// Resource-only: current version, when it last changed, the buyer's own
// acquisition date, whether a newer version has shipped since, and which
// AI tools/frameworks this resource is known to work with. See
// ConsumerCatalogService._to_read for how hasNewVersion/purchasedAt are
// computed server-side.
export function VersionPanel({
  item,
  t,
  language,
}: {
  item: {
    currentVersion?: string | null
    versionUpdatedAt?: string | null
    purchasedAt?: string | null
    hasNewVersion?: boolean
    compatibility?: string[]
    changelog?: string[]
  }
  t: (key: string) => string
  language: string
}) {
  if (!item.currentVersion) return null
  const compatibility = item.compatibility ?? []
  const changelog = item.changelog ?? []
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <History className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{t('catalog.version.title')}</h2>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="info">
          {t('catalog.version.current')}: {item.currentVersion}
        </Badge>
        {item.hasNewVersion ? (
          <Badge className="items-center gap-1 border-amber-400/30 bg-amber-400/15 text-amber-200">
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t('catalog.version.newVersionAvailable')}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 space-y-1 text-sm text-ase-text2">
        {item.versionUpdatedAt ? (
          <p>
            {t('catalog.version.updatedAt')}: {formatCatalogDate(item.versionUpdatedAt, language)}
          </p>
        ) : null}
        {item.purchasedAt ? (
          <p>
            {t('catalog.version.acquiredAt')}: {formatCatalogDate(item.purchasedAt, language)}
          </p>
        ) : null}
      </div>
      {compatibility.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('catalog.version.compatibility')}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {compatibility.map((tag) => (
              <Badge key={tag} variant="info" className="items-center gap-1">
                <Sparkles className="h-3 w-3" strokeWidth={1.75} />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      {changelog.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
            {t('catalog.version.changelog')}
          </p>
          <ul className="mt-1.5 space-y-1.5 text-sm text-ase-text2">
            {changelog.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ase-brand/70" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  )
}

// Shown before purchase for every catalog type, per the platform's
// "clarity before buying" requirement — scope of use, redistribution,
// whether updates/support come with the purchase, and the refund policy
// (falls back to the platform's standard digital-content clause when the
// admin hasn't set a per-item one).
export function LicensePanel({
  item,
  t,
}: {
  item: {
    licenseScope?: string[]
    licenseRedistribution?: string | null
    licenseUpdatesIncluded?: boolean
    licenseSupportIncluded?: boolean
    licenseRefundPolicy?: string | null
  }
  t: (key: string) => string
}) {
  const scope = item.licenseScope ?? []
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
          <ScrollText className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">{t('catalog.license.title')}</h2>
      </div>
      <div className="mt-3 space-y-2 text-sm text-ase-text2">
        <p>
          <span className="font-medium text-ase-text">{t('catalog.license.scope')}: </span>
          {scope.length > 0
            ? scope.map((s) => t(`catalog.license.scopeOptions.${s}`)).join(' · ')
            : t('catalog.license.scopeUnspecified')}
        </p>
        <p className="flex items-center gap-1.5">
          <Ban className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="font-medium text-ase-text">{t('catalog.license.redistribution')}: </span>
          {item.licenseRedistribution
            ? t(`catalog.license.redistributionOptions.${item.licenseRedistribution}`)
            : t('catalog.license.redistributionUnspecified')}
        </p>
        <p className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {item.licenseUpdatesIncluded ? t('catalog.license.updatesIncluded') : t('catalog.license.updatesNotIncluded')}
        </p>
        <p className="flex items-center gap-1.5">
          <LifeBuoy className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {item.licenseSupportIncluded ? t('catalog.license.supportIncluded') : t('catalog.license.supportNotIncluded')}
          {item.licenseSupportIncluded ? (
            <span
              title={t('catalog.license.supportIncludedInfo') as string}
              className="inline-flex shrink-0 cursor-help"
            >
              <Info className="h-3.5 w-3.5 text-ase-muted" strokeWidth={1.75} />
            </span>
          ) : null}
        </p>
        <p>
          <span className="font-medium text-ase-text">{t('catalog.license.refundPolicy')}: </span>
          {item.licenseRefundPolicy ?? t('catalog.license.refundPolicyDefault')}
        </p>
      </div>
    </Card>
  )
}
