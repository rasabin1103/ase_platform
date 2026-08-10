import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { getMemberCatalogStats, type MemberCatalogStat } from '../../api/orgCatalog.api'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../ui/Skeleton'
import { EmptyState } from '../ui/EmptyState'
import { Table, TBody, TD, THead, TH, TR } from '../ui/Table'
import { cn } from '../ui/cn'
import { useI18n } from '../../i18n'

export function MemberCatalogStatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null)

  const statsQuery = useQuery({
    queryKey: ['org-member-catalog-stats'],
    queryFn: getMemberCatalogStats,
    enabled: open,
  })

  const items = statsQuery.data?.items ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('organizationWorkspace.memberStats.modalTitle') as string}
      closeLabel={t('organizationWorkspace.catalog.close') as string}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-ase-text2">{t('organizationWorkspace.memberStats.modalSubtitle')}</p>

        {statsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : statsQuery.isError ? (
          <EmptyState title={t('organizationWorkspace.memberStats.loadError') as string} />
        ) : items.length === 0 ? (
          <EmptyState title={t('organizationWorkspace.memberStats.noItems') as string} />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('organizationWorkspace.memberStats.columnUser')}</TH>
                <TH className="text-center">{t('organizationWorkspace.memberStats.columnSent')}</TH>
                <TH className="text-center">{t('organizationWorkspace.memberStats.columnConsumed')}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((member) => (
                <MemberRow
                  key={member.uuid}
                  member={member}
                  expanded={expandedUuid === member.uuid}
                  onToggle={() => setExpandedUuid((prev) => (prev === member.uuid ? null : member.uuid))}
                />
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </Modal>
  )
}

function MemberRow({
  member,
  expanded,
  onToggle,
}: {
  member: MemberCatalogStat
  expanded: boolean
  onToggle: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <TR className="cursor-pointer" onClick={onToggle}>
        <TD className="font-medium text-ase-text">
          <div className="truncate">{member.displayName || member.email}</div>
          <div className="truncate text-xs text-ase-muted">{member.email}</div>
        </TD>
        <TD className="text-center">
          <Badge variant="info">{member.sentCount}</Badge>
        </TD>
        <TD className="text-center">
          <Badge variant="success">{member.consumedCount}</Badge>
        </TD>
        <TD className="text-right">
          {expanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
        </TD>
      </TR>
      {expanded ? (
        <TR>
          <TD colSpan={4} className="bg-white/[0.02]">
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <ItemChipList label={t('organizationWorkspace.memberStats.sentItemsLabel') as string} items={member.sentItems} />
              <ItemChipList label={t('organizationWorkspace.memberStats.consumedItemsLabel') as string} items={member.consumedItems} />
            </div>
          </TD>
        </TR>
      ) : null}
    </>
  )
}

function ItemChipList({ label, items }: { label: string; items: MemberCatalogStat['sentItems'] }) {
  const { t } = useI18n()
  return (
    <div>
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      {items.length === 0 ? (
        <div className="text-xs text-ase-muted">{t('organizationWorkspace.memberStats.noItems')}</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.slug}
              className={cn(
                'rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs text-ase-text2',
              )}
            >
              {item.title}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
