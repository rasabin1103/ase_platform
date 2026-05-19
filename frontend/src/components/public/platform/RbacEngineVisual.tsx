import { useMemo, useState } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type RoleId = 'super_admin' | 'org_owner' | 'org_admin' | 'member' | 'viewer'

const ROLES: RoleId[] = ['super_admin', 'org_owner', 'org_admin', 'member', 'viewer']

type GroupId = 'identity' | 'governance' | 'commerce' | 'operations'
const GROUPS: GroupId[] = ['identity', 'governance', 'commerce', 'operations']

export function RbacEngineVisual() {
  const { t } = useI18n()
  const [active, setActive] = useState<RoleId | null>(null)

  const roles = useMemo(
    () =>
      ROLES.map((id) => ({
        id,
        title: t(`platformPage.rbac.roles.${id}.title`) as string,
        description: t(`platformPage.rbac.roles.${id}.description`) as string,
      })),
    [t],
  )

  const groups = useMemo(
    () =>
      GROUPS.map((id) => ({
        id,
        title: t(`platformPage.rbac.capabilityGroups.${id}.title`) as string,
        items: tStringArray(t, `platformPage.rbac.capabilityGroups.${id}.items`),
      })),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(56,189,248,0.10),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('platformPage.rbac.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">{t('platformPage.rbac.title')}</h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.rbac.subtitle')}</p>
            <p className="mt-6 text-sm text-ase-muted">{t('platformPage.rbac.hint')}</p>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/8 blur-3xl" />

              <div className="relative z-[1] grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <div className="space-y-3">
                    {roles.map((r, idx) => {
                      const isOn = active === null || active === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={cn(
                            'w-full rounded-2xl border bg-white/[0.04] p-4 text-left backdrop-blur-sm transition',
                            active === r.id ? 'border-ase-primary/30 ring-1 ring-ase-primary/20' : 'border-white/[0.08] hover:border-white/15',
                            isOn ? 'opacity-100' : 'opacity-[0.35]',
                          )}
                          onMouseEnter={() => setActive(r.id)}
                          onMouseLeave={() => setActive(null)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{r.title}</div>
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                idx === 0 ? 'bg-ase-primary/90 shadow-[0_0_12px_rgba(56,189,248,0.18)]' : 'bg-white/30',
                              )}
                            />
                          </div>
                          <p className="mt-2 text-[12px] leading-relaxed text-ase-text2">{r.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {groups.map((g, gi) => {
                      const isOn = active === null || (active !== null && (gi <= 1 ? active !== 'viewer' : active === 'super_admin' || active === 'org_owner'))
                      return (
                        <div
                          key={g.id}
                          className={cn(
                            'rounded-2xl border border-white/[0.08] bg-ase-bg2/35 p-5 backdrop-blur-sm transition',
                            isOn ? 'opacity-100' : 'opacity-[0.35]',
                          )}
                        >
                          <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{g.title}</div>
                          <ul className="mt-3 space-y-2">
                            {g.items.map((it, i) => (
                              <li key={`${g.id}-${i}`} className="flex gap-2 text-xs text-ase-text2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ase-accent/80" />
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
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

