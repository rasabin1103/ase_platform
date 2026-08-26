import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Check, Gift, Search, UserRound } from 'lucide-react'
import { listConsumerCatalog } from '../../api/consumerCatalog.api'
import { grantOrgProduct, searchGrantTargets, type GrantTarget } from '../../api/orgCatalog.api'
import { Card } from '../../components/ui/Card'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { useI18n } from '../../i18n'
import type { CatalogItem } from '../../types/catalog.types'

export function OrganizationGrantPage() {
  const { t } = useI18n()
  const [userSearch, setUserSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<GrantTarget | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<CatalogItem | null>(null)

  const usersQuery = useQuery({
    queryKey: ['org-grant-targets', userSearch],
    queryFn: () => searchGrantTargets(userSearch || undefined),
  })

  const productsQuery = useQuery({
    queryKey: ['consumer-catalog', 'org-grant', productSearch],
    queryFn: () => listConsumerCatalog({ limit: 20, search: productSearch || undefined }),
  })

  const grantMutation = useMutation({
    mutationFn: grantOrgProduct,
  })

  const canSubmit = Boolean(selectedUser && selectedProduct) && !grantMutation.isPending

  const handleSubmit = () => {
    if (!selectedUser || !selectedProduct) return
    grantMutation.mutate({ catalogItemSlug: selectedProduct.slug, userUuid: selectedUser.uuid })
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-8">
        <Eyebrow>{t('organizationWorkspace.grant.title')}</Eyebrow>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ase-text sm:text-3xl">
          {t('organizationWorkspace.grant.title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ase-text2 sm:text-base">{t('organizationWorkspace.grant.subtitle')}</p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
            {t('organizationWorkspace.grant.userLabel')}
          </h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
            <input
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value)
                setSelectedUser(null)
              }}
              placeholder={t('organizationWorkspace.grant.userSearchPlaceholder') as string}
              className="h-10 w-full rounded-xl border border-white/10 bg-ase-bg2 pl-9 pr-3 text-sm text-ase-text placeholder:text-ase-muted outline-none transition focus-visible:border-ase-brand/60 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
            />
          </div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {usersQuery.isLoading ? (
              <Skeleton className="h-12 w-full rounded-xl" />
            ) : (usersQuery.data?.items.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-sm text-ase-muted">{t('organizationWorkspace.grant.userEmpty')}</p>
            ) : (
              usersQuery.data?.items.map((u) => (
                <button
                  key={u.uuid}
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                    selectedUser?.uuid === u.uuid
                      ? 'border-cyan-300/40 bg-cyan-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-ase-bg2 text-ase-text2">
                    <UserRound className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ase-text">{u.displayName || u.email}</span>
                    <span className="block truncate text-xs text-ase-muted">{u.email}</span>
                  </span>
                  {selectedUser?.uuid === u.uuid ? (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.5} />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ase-text2">
            {t('organizationWorkspace.grant.productLabel')}
          </h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
            <input
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value)
                setSelectedProduct(null)
              }}
              placeholder={t('organizationWorkspace.grant.productSearchPlaceholder') as string}
              className="h-10 w-full rounded-xl border border-white/10 bg-ase-bg2 pl-9 pr-3 text-sm text-ase-text placeholder:text-ase-muted outline-none transition focus-visible:border-ase-brand/60 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
            />
          </div>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {productsQuery.isLoading ? (
              <Skeleton className="h-12 w-full rounded-xl" />
            ) : (
              productsQuery.data?.items.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition',
                    selectedProduct?.slug === p.slug
                      ? 'border-cyan-300/40 bg-cyan-300/10'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
                  )}
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-ase-bg2">
                    <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ase-text">{p.title}</span>
                    <span className="block truncate text-xs text-ase-muted">{p.category}</span>
                  </span>
                  {selectedProduct?.slug === p.slug ? (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-cyan-300" strokeWidth={2.5} />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-ase-text2">
            {!selectedUser ? (
              <span>{t('organizationWorkspace.grant.pickUserFirst')}</span>
            ) : !selectedProduct ? (
              <span>{t('organizationWorkspace.grant.pickProductFirst')}</span>
            ) : (
              <span className="text-ase-text">
                <strong>{selectedProduct.title}</strong> → {selectedUser.displayName || selectedUser.email}
              </span>
            )}
          </div>
          <Button
            leftIcon={<Gift className="h-4 w-4" strokeWidth={1.75} />}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {grantMutation.isPending ? t('organizationWorkspace.grant.submitting') : t('organizationWorkspace.grant.submit')}
          </Button>
        </div>

        {grantMutation.isSuccess ? (
          <div
            className={cn(
              'mt-4 rounded-xl border px-4 py-3 text-sm',
              grantMutation.data.alreadyOwned
                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
            )}
          >
            {grantMutation.data.alreadyOwned
              ? t('organizationWorkspace.grant.successAlreadyOwned')
              : t('organizationWorkspace.grant.successGranted')}
          </div>
        ) : null}

        {grantMutation.isError ? (
          <div className="mt-4 rounded-xl border border-ase-error/30 bg-ase-error/10 px-4 py-3 text-sm text-ase-error">
            {t('organizationWorkspace.grant.error')}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
