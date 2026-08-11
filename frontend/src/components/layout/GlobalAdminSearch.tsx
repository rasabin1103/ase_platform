import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Users as UsersIcon, Boxes } from 'lucide-react'
import { searchAdmin } from '../../api/adminDashboard.api'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useI18n } from '../../i18n'
import { cn } from '../ui/cn'

/** Super-admin-only quick search across users and catalog items, shown in the Header. */
export function GlobalAdminSearch() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(raw.trim()), 250)
    return () => clearTimeout(id)
  }, [raw])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const enabled = debounced.length >= 2
  const query = useQuery({
    queryKey: ['admin-global-search', debounced],
    queryFn: () => searchAdmin(debounced),
    enabled,
  })

  const users = query.data?.users ?? []
  const catalogItems = query.data?.catalog_items ?? []
  const hasResults = users.length > 0 || catalogItems.length > 0

  const goToUser = (uuid: string, email: string) => {
    setOpen(false)
    setRaw('')
    navigate(`/users?q=${encodeURIComponent(email)}`, { state: { focusUserUuid: uuid } })
  }

  const goToCatalogItem = (slug: string) => {
    setOpen(false)
    setRaw('')
    navigate(`/admin/catalog?q=${encodeURIComponent(slug)}`)
  }

  return (
    <div ref={containerRef} className="relative hidden w-64 md:block">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ase-muted" strokeWidth={1.75} />
        <Input
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('adminSearch.placeholder')}
          className="h-9 rounded-full pl-9"
        />
      </div>

      {open && enabled && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-white/10 bg-ase-bg2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          {query.isLoading ? (
            <div className="p-4 text-sm text-ase-muted">{t('adminSearch.searching')}</div>
          ) : !hasResults ? (
            <div className="p-4 text-sm text-ase-muted">{t('adminSearch.noResults')}</div>
          ) : (
            <div className="max-h-96 overflow-y-auto py-2">
              {users.length > 0 && (
                <div className="px-2">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t('adminSearch.groupUsers')}
                  </div>
                  {users.map((u) => (
                    <button
                      key={u.uuid}
                      type="button"
                      onClick={() => goToUser(u.uuid, u.email)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition',
                        'hover:bg-white/[0.06]',
                      )}
                    >
                      <UsersIcon className="h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate text-ase-text">{u.display_name || u.email}</span>
                      <Badge variant={u.status === 'active' ? 'success' : 'default'}>{u.status}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {catalogItems.length > 0 && (
                <div className="mt-1 px-2">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t('adminSearch.groupCatalog')}
                  </div>
                  {catalogItems.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => goToCatalogItem(c.slug)}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-white/[0.06]"
                    >
                      <Boxes className="h-4 w-4 shrink-0 text-ase-muted" strokeWidth={1.75} />
                      <span className="min-w-0 flex-1 truncate text-ase-text">{c.title}</span>
                      <Badge variant="info">{c.type}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
