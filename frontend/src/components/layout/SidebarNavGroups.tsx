import { NavLink } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { NavGroupDef } from '../../rbac/config'
import { cn } from '../ui/cn'

const linkBase =
  'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition duration-200'

type Props = { groups: NavGroupDef[] }

export function SidebarNavGroups({ groups }: Props) {
  const { t } = useI18n()
  return (
    <>
      {groups.map((group) => (
        <div key={group.labelKey} className="mb-5">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-ase-muted">
            {t(group.labelKey)}
          </div>
          <div className="space-y-1.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    linkBase,
                    isActive
                      ? 'border-cyan-300/20 bg-cyan-300/10 text-ase-text shadow-[0_0_28px_rgba(34,211,238,0.10)]'
                      : 'border-transparent text-ase-text2 hover:border-white/10 hover:bg-white/[0.045] hover:text-ase-text',
                  )
                }
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-xs text-ase-text">
                  {item.icon}
                </span>
                <span className="min-w-0 truncate">{t(item.labelKey)}</span>
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-current opacity-0 transition group-[.active]:opacity-100" />
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
