import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cn } from '../../components/ui/cn'
import { tStringArray, useI18n } from '../../i18n'
import { SystemFlowDiagram } from '../../components/public/platform/SystemFlowDiagram'
import { TenantArchitectureVisual } from '../../components/public/platform/TenantArchitectureVisual'
import { RbacEngineVisual } from '../../components/public/platform/RbacEngineVisual'
import { BillingEntitlementsVisual } from '../../components/public/platform/BillingEntitlementsVisual'
import { AuditGovernanceVisual } from '../../components/public/platform/AuditGovernanceVisual'
import { AutomationWorkflowVisual } from '../../components/public/platform/AutomationWorkflowVisual'
import { AdminDashboardPreview } from '../../components/public/platform/AdminDashboardPreview'

export function PlatformPage() {
  const { t } = useI18n()

  const previewPills = useMemo(() => tStringArray(t, 'platformPage.hero.preview.pills'), [t])

  const previewNodes = useMemo(
    () =>
      (['org', 'rbac', 'catalog', 'subs', 'audit'] as const).map((id) => ({
        id,
        title: t(`platformPage.diagram.nodes.${id}.title`) as string,
      })),
    [t],
  )

  return (
    <div className="min-h-screen bg-ase-bg">
      {/* HERO */}
      <section className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
        <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
            <div className="lg:col-span-6">
              <Eyebrow>{t('platformPage.hero.badge')}</Eyebrow>
              <h1 className="mt-6 text-heading-xl font-semibold leading-[1.05] text-ase-text sm:text-display-lg lg:text-display-xl">
                {t('platformPage.hero.title')}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg lg:text-xl">
                {t('platformPage.hero.subtitle')}
              </p>

              <div className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
                <Link to="/services" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" className="w-full">
                    {t('platformPage.hero.ctas.services')}
                  </Button>
                </Link>
                <Link to="/contact" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" variant="secondary" className="w-full">
                    {t('platformPage.hero.ctas.contact')}
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto sm:flex-1">
                  <Button size="lg" variant="ghost" className="w-full">
                    {t('platformPage.hero.ctas.login')}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-white/10 pt-8">
                <HeroMetric k="tenancy" />
                <HeroMetric k="governance" />
                <HeroMetric k="posture" />
              </div>
            </div>

            {/* Right: premium preview */}
            <div className="relative lg:col-span-6">
              <Card
                interactive
                className={cn(
                  'relative overflow-hidden rounded-[2rem] border border-ase-brand/20 bg-ase-surface p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_120px_rgba(0,0,0,0.55)]',
                  'sm:p-8',
                )}
              >
                <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
                <div className="relative z-[1] flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">
                      {t('platformPage.hero.preview.badge')}
                    </div>
                    <div className="mt-2 text-lg font-extrabold text-ase-text">{t('platformPage.hero.preview.title')}</div>
                    <div className="mt-1 text-sm text-ase-text2">{t('platformPage.hero.preview.subtitle')}</div>
                  </div>
                  <span className="mt-1 h-2.5 w-2.5 animate-pulse rounded-full bg-ase-accent shadow-[0_0_18px_rgba(34,211,238,0.35)]" />
                </div>

                <div className="relative z-[1] mt-6 flex flex-wrap gap-2">
                  {previewPills.map((p, i) => (
                    <span
                      key={`pill-${i}`}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-ase-text2"
                    >
                      {p}
                    </span>
                  ))}
                </div>

                <div className="relative z-[1] mt-8 grid gap-3 sm:grid-cols-2">
                  <PreviewNode title={t('platformPage.diagram.nodes.user.title') as string} />
                  {previewNodes.map((n) => (
                    <PreviewNode key={n.id} title={n.title} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <SystemFlowDiagram />
      <TenantArchitectureVisual />
      <RbacEngineVisual />
      <BillingEntitlementsVisual />
      <AuditGovernanceVisual />
      <AutomationWorkflowVisual />
      <AdminDashboardPreview />

      {/* Final CTA */}
      <section className="relative border-t border-white/[0.06] py-16 sm:py-24">
        <div className="relative mx-auto w-full max-w-[min(100%,1200px)] px-5 sm:px-8 lg:px-12">
          <div className="mx-auto overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface px-6 py-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] sm:px-10">
            <div className="mx-auto w-fit">
              <Eyebrow>{t('platformPage.cta.badge')}</Eyebrow>
            </div>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('platformPage.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg">
              {t('platformPage.cta.subtitle')}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/services" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:min-w-[220px]">
                  {t('platformPage.cta.primary')}
                </Button>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full sm:min-w-[220px]">
                  {t('platformPage.cta.secondary')}
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="ghost" className="w-full sm:min-w-[220px]">
                  {t('platformPage.cta.tertiary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroMetric({ k }: { k: 'tenancy' | 'governance' | 'posture' }) {
  const { t } = useI18n()
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{t(`platformPage.hero.metrics.${k}.label`)}</div>
      <div className="mt-2 text-lg font-extrabold text-ase-text">{t(`platformPage.hero.metrics.${k}.value`)}</div>
    </div>
  )
}

function PreviewNode({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-ase-text2">
      {title}
    </div>
  )
}

