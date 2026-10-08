import { cn } from '../../ui/cn'

/**
 * Pestañas de sección del admin (Sistema, Catálogo…). Accesibles como
 * tablist y con el mismo estilo en todas las páginas.
 */
export function AdminTabs<K extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: { key: K; label: string }[]
  active: K
  onChange: (key: K) => void
  label: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-ase-surface/70 p-1.5"
    >
      {tabs.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={active === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
            active === item.key
              ? 'bg-ase-brand/20 text-ase-text ring-1 ring-ase-brand/40'
              : 'text-ase-muted hover:bg-white/[0.04] hover:text-ase-text',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
