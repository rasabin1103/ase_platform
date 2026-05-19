import { useMemo } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'

export function AuditGovernanceVisual() {
  const { t } = useI18n()
  const indicators = useMemo(() => tStringArray(t, 'platformPage.audit.indicators.items'), [t])
  const rows = useMemo(
    () => t('platformPage.audit.stream.rows') as Array<{ event: string; actor: string; meta: string }>,
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(34,211,238,0.10),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('platformPage.audit.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('platformPage.audit.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.audit.subtitle')}</p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

              <div className="relative z-[1] grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.audit.stream.title')}</div>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    <div className="grid grid-cols-3 gap-2 border-b border-white/[0.08] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                      <span>{t('platformPage.audit.stream.cols.event')}</span>
                      <span>{t('platformPage.audit.stream.cols.actor')}</span>
                      <span className="text-right">{t('platformPage.audit.stream.cols.meta')}</span>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      {rows.map((r, i) => (
                        <div key={`row-${i}`} className="grid grid-cols-3 gap-2 px-4 py-3 text-xs text-ase-text2">
                          <span className="text-ase-text2">{r.event}</span>
                          <span className="text-ase-text2">{r.actor}</span>
                          <span className="text-right text-ase-muted">{r.meta}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.audit.indicators.title')}</div>
                  <div className="mt-4 grid gap-3">
                    {indicators.map((it, i) => (
                      <div key={`ind-${i}`} className="rounded-2xl border border-white/[0.08] bg-ase-bg2/35 px-4 py-3 text-sm text-ase-text2">
                        {it}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

