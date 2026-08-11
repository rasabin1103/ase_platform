import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderGit2, BookOpen } from 'lucide-react'
import { listMyRedeemedBooks, type RedeemedBook } from '../../api/bookRedemption.api'
import { RedeemCodeForm } from '../../components/catalog/RedeemCodeForm'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { resolveMediaUrl } from '../../utils/mediaUrls'
import { useI18n } from '../../i18n'

function RedeemedBookRow({ book }: { book: RedeemedBook }) {
  const { t } = useI18n()
  const src = resolveMediaUrl(book.image_url)
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ase-text2">
            <BookOpen className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ase-text">{book.title}</div>
        <div className="mt-0.5 text-xs text-ase-text2">
          {t('redeemCode.redeemedOn')} {new Date(book.redeemed_at).toLocaleDateString()}
        </div>
      </div>
      <a href={book.repo_url} target="_blank" rel="noreferrer">
        <Button size="sm" variant="secondary">
          <FolderGit2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          {t('redeemCode.openRepo')}
        </Button>
      </a>
    </Card>
  )
}

export function RedeemCodePage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const redeemedQuery = useQuery({ queryKey: ['book-redemption', 'me'], queryFn: listMyRedeemedBooks })
  const items = redeemedQuery.data ?? []

  return (
    <div className="space-y-8 pb-16">
      <PremiumHero
        accent="violet"
        badge={t('redeemCode.heroBadge')}
        title={t('redeemCode.title')}
        subtitle={t('redeemCode.subtitle')}
      />

      <RedeemCodeForm onRedeemed={() => queryClient.invalidateQueries({ queryKey: ['book-redemption', 'me'] })} />

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ase-muted">
          {t('redeemCode.myRepos')}
        </h2>
        {redeemedQuery.isLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : redeemedQuery.isError ? (
          <EmptyState title={t('private.common.couldNotLoad')} description={t('redeemCode.loadError')} />
        ) : items.length === 0 ? (
          <EmptyState title={t('redeemCode.empty')} description={t('redeemCode.emptyHint')} />
        ) : (
          <div className="space-y-3">
            {items.map((book) => (
              <RedeemedBookRow key={book.catalog_item_id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
