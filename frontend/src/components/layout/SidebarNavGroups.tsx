import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n'
import type { NavGroupDef } from '../../rbac/config'
import { cn } from '../ui/cn'

const linkBase =
  'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition duration-200'

const STORAGE_KEY = 'ase_nav_collapsed'

function loadCollapsed(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveCollapsed(value: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...value]))
  } catch {
    // Sin almacenamiento disponible: el estado solo dura la sesión.
  }
}

type Props = { groups: NavGroupDef[]; onNavigate?: () => void }

/** Grupos del menú lateral plegables. El grupo que contiene la página actual
 * se muestra abierto (salvo que lo cierres a mano) y, si está plegado, deja
 * un punto luminoso junto al título para saber dónde estás. El estado de los
 * demás grupos se recuerda entre visitas. */
export function SidebarNavGroups({ groups, onNavigate }: Props) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed)
  const [pinnedClosed, setPinnedClosed] = useState<Set<string>>(new Set())

  const isActivePath = (to: string) => pathname === to || pathname.startsWith(`${to}/`)

  const toggle = (key: string, hasActive: boolean) => {
    const flip = (prev: Set<string>) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    }
    if (hasActive) {
      setPinnedClosed(flip)
    } else {
      setCollapsed((prev) => {
        const next = flip(prev)
        saveCollapsed(next)
        return next
      })
    }
  }

  return (
    <>
      {groups.map((group) => {
        const hasActive = group.items.some((item) => isActivePath(item.to))
        const open = hasActive ? !pinnedClosed.has(group.labelKey) : !collapsed.has(group.labelKey)
        const panelId = `nav-group-${group.labelKey.replace(/[^a-z0-9]+/gi, '-')}`
        return (
          <div key={group.labelKey} className="mb-4">
            <button
              type="button"
              onClick={() => toggle(group.labelKey, hasActive)}
              aria-expanded={open}
              aria-controls={panelId}
              className={cn(
                'group/head mb-1.5 flex w-full items-center gap-2 rounded-xl px-3 py-1.5 text-left outline-none transition',
                'text-[10px] font-semibold uppercase tracking-[0.22em] text-ase-muted hover:bg-white/[0.04] hover:text-ase-text2',
                'focus-visible:ring-2 focus-visible:ring-ase-brand/60',
              )}
            >
              <span className="min-w-0 flex-1 truncate">{t(group.labelKey)}</span>
              {hasActive && !open ? (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,0.9)]"
                  aria-hidden="true"
                />
              ) : null}
              <ChevronDown
                className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none', !open && '-rotate-90')}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
            <div
              id={panelId}
              inert={!open}
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none',
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="space-y-1.5 py-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          linkBase,
                          isActive
                            ? 'border-ase-brand/40 bg-ase-brand/15 text-ase-text shadow-[0_0_28px_rgba(76,125,255,0.18)]'
                            : 'border-transparent text-ase-text2 hover:border-white/10 hover:bg-white/[0.045] hover:text-ase-text',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'grid h-8 w-8 shrink-0 place-items-center rounded-xl border transition',
                              isActive
                                ? 'border-ase-brand/40 bg-ase-brand/20 text-sky-200'
                                : 'border-white/10 bg-white/[0.04] text-ase-text2 group-hover:text-ase-text',
                            )}
                          >
                            <item.icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                          </span>
                          <span className="min-w-0 truncate">{t(item.labelKey)}</span>
                          <span
                            className={cn(
                              'ml-auto h-1.5 w-1.5 rounded-full bg-current transition',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
