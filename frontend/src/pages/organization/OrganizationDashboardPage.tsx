import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Boxes, Gift, Users } from 'lucide-react'
import { listOrgCatalogItems } from '../../api/orgCatalog.api'
import { listOrganizations, updateOrganization } from '../../api/organizations.api'
import { Card } from '../../components/ui/Card'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { Switch } from '../../components/ui/Switch'
import { OrganizationAnalyticsCharts } from '../../components/organization/OrganizationAnalyticsCharts'
import { WelcomeBanner } from '../../components/dashboard/WelcomeBanner'
import { useI18n } from '../../i18n'
import { Can } from '../../rbac/Can'

export function OrganizationDashboardPage() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const orgsQuery = useQuery({ queryKey: ['organizations'], queryFn: listOrganizations })
  const catalogQuery = useQuery({
    queryKey: ['org-catalog-items', 'count'],
    queryFn: () => listOrgCatalogItems({ limit: 1 }),
  })

  const myOrg = orgsQuery.data?.items?.[0]
  const associatedCount = catalogQuery.data?.total ?? 0

  const [newsletterSaved, setNewsletterSaved] = useState(false)
  const [newsletterError, setNewsletterError] = useState<string | null>(null)
  const newsletterMut = useMutation({
    mutationFn: (next: boolean) => updateOrganization(myOrg!.uuid, { newsletter_subscribed: next }),
    onSuccess: () => {
      setNewsletterError(null)
      setNewsletterSaved(true)
      setTimeout(() => setNewsletterSaved(false), 3000)
      void queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: () => setNewsletterError(t('organizationWorkspace.dashboard.newsletter.error') as string),
  })

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
        <div className="relative z-[1] max-w-3xl">
          <div className="mb-5">
            <WelcomeBanner variant="lead" />
          </div>
          <Eyebrow>{t('organizationWorkspace.dashboard.heroBadge')}</Eyebrow>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {myOrg?.name ?? t('organizationWorkspace.dashboard.title')}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-ase-text2">{t('organizationWorkspace.dashboard.subtitle')}</p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/organization/catalog">
          <Card interactive className="flex h-full flex-col gap-4 p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ase-brand/25 bg-ase-brand/10 text-ase-brand">
              <Boxes className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ase-text">{t('organizationWorkspace.dashboard.catalogCard.title')}</h2>
              <p className="mt-1.5 text-sm text-ase-text2">{t('organizationWorkspace.dashboard.catalogCard.body')}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                {associatedCount} {associatedCount === 1 ? 'item' : 'items'}
              </span>
              <Button size="sm" variant="outline">
                {t('organizationWorkspace.dashboard.catalogCard.cta')}
              </Button>
            </div>
          </Card>
        </Link>

        <Link to="/organization/grant">
          <Card interactive className="flex h-full flex-col gap-4 p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <Gift className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ase-text">{t('organizationWorkspace.dashboard.grantCard.title')}</h2>
              <p className="mt-1.5 text-sm text-ase-text2">{t('organizationWorkspace.dashboard.grantCard.body')}</p>
            </div>
            <div className="mt-auto flex items-center justify-end">
              <Button size="sm" variant="outline">
                {t('organizationWorkspace.dashboard.grantCard.cta')}
              </Button>
            </div>
          </Card>
        </Link>

        <Link to="/organization/members">
          <Card interactive className="flex h-full flex-col gap-4 p-6">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-400/10 text-violet-300">
              <Users className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-ase-text">{t('orgMembership.admin.heroTitle')}</h2>
              <p className="mt-1.5 text-sm text-ase-text2">{t('orgMembership.admin.heroSubtitle')}</p>
            </div>
            <div className="mt-auto flex items-center justify-end">
              <Button size="sm" variant="outline">
                {t('orgMembership.admin.membersNavLabel')}
              </Button>
            </div>
          </Card>
        </Link>
      </div>

      <Can permission="organizations.update">
        {myOrg ? (
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-ase-text">{t('organizationWorkspace.dashboard.newsletter.title')}</h2>
            <p className="mt-1.5 text-sm text-ase-text2">{t('organizationWorkspace.dashboard.newsletter.subtitle')}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Switch
                checked={Boolean(myOrg.newsletter_subscribed)}
                onCheckedChange={(next) => newsletterMut.mutate(next)}
                disabled={newsletterMut.isPending}
                label={t('organizationWorkspace.dashboard.newsletter.toggleLabel') as string}
              />
              {newsletterSaved ? (
                <span className="text-sm text-emerald-300">{t('organizationWorkspace.dashboard.newsletter.saved')}</span>
              ) : null}
            </div>
            {newsletterError ? <p className="mt-2 text-sm text-ase-error">{newsletterError}</p> : null}
          </Card>
        ) : null}
      </Can>

      <OrganizationAnalyticsCharts />
    </div>
  )
}
