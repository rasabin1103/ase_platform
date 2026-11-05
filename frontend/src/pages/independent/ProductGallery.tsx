import { ArrowRight, FlaskConical, LayoutGrid, List } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RunnableFramework } from '../../api/testExecution.api'
import { Badge } from '../../components/ui/Badge'
import { useI18n } from '../../i18n'

import { type GalleryView } from './galleryView'

const isTool = (f: RunnableFramework) => Boolean(f.viewer && f.viewer !== 'workflow')

function quotaTone(remaining: number, total: number) {
  const pct = total > 0 ? remaining / total : 0
  if (remaining <= 0) return { bar: 'bg-rose-400', text: 'text-rose-300' }
  if (pct > 0.5) return { bar: 'bg-emerald-400', text: 'text-emerald-300' }
  if (pct > 0.2) return { bar: 'bg-amber-400', text: 'text-amber-300' }
  return { bar: 'bg-rose-400', text: 'text-rose-300' }
}

/** Contador de usos: barra + «restantes / incluidas». Las herramientas
 * interactivas no consumen ejecuciones, así que muestran su insignia. */
function Usage({ f, compact }: { f: RunnableFramework; compact?: boolean }) {
  const { t } = useI18n()
  if (isTool(f)) return <Badge variant="info">{t('testExecution.frameworks.toolBadge')}</Badge>
  const tone = quotaTone(f.remainingRuns, f.includedRuns)
  const pct = f.includedRuns > 0 ? Math.min(100, Math.max(0, (f.remainingRuns / f.includedRuns) * 100)) : 0
  return (
    <div className={compact ? 'w-40' : 'w-full'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-2xl font-semibold tabular-nums ${tone.text}`}>
          {f.remainingRuns}
          <span className="text-sm font-normal text-ase-muted"> / {f.includedRuns}</span>
        </span>
        {f.remainingRuns <= 0 ? <Badge variant="error">{t('testExecution.workspace.exhausted')}</Badge> : null}
      </div>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`${f.remainingRuns}/${f.includedRuns} ${t('testExecution.workspace.runsLeft') as string}`}
      >
        <div className={`h-full rounded-full transition-all duration-700 ${tone.bar}`} style={{ width: `${pct}%` }} />
      </div>
      {!compact ? <p className="mt-1.5 text-xs text-ase-muted">{t('testExecution.workspace.runsLeft')}</p> : null}
    </div>
  )
}

function ProductIcon() {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/25">
      <FlaskConical className="h-6 w-6" strokeWidth={1.5} aria-hidden />
    </span>
  )
}

const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/60'

/** Selector de vista: tarjetas o lista. */
export function ViewToggle({ view, onChange }: { view: GalleryView; onChange: (v: GalleryView) => void }) {
  const { t } = useI18n()
  const items: { key: GalleryView; label: string; Icon: typeof LayoutGrid }[] = [
    { key: 'grid', label: t('testExecution.workspace.viewGrid') as string, Icon: LayoutGrid },
    { key: 'list', label: t('testExecution.workspace.viewList') as string, Icon: List },
  ]
  return (
    <div role="group" aria-label="View" className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {items.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          aria-pressed={view === key}
          aria-label={label}
          title={label}
          onClick={() => onChange(key)}
          className={`grid h-8 w-9 place-items-center rounded-lg transition ${FOCUS} ${
            view === key ? 'bg-white/10 text-ase-text' : 'text-ase-muted hover:text-ase-text'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>
      ))}
    </div>
  )
}

/** Productos disponibles para probar, en tarjetas o en lista; al pulsar uno se
 * abre su pantalla (/test-execution/:slug). */
export function ProductGallery({ frameworks, view }: { frameworks: RunnableFramework[]; view: GalleryView }) {
  const { t } = useI18n()

  if (view === 'list') {
    return (
      <ul className="space-y-2.5">
        {frameworks.map((f) => (
          <li key={f.slug}>
            <Link
              to={`/test-execution/${f.slug}`}
              className={`group flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition hover:border-cyan-300/40 hover:bg-white/[0.05] ${FOCUS}`}
            >
              <ProductIcon />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-ase-text">{f.title}</span>
                <span className="block truncate font-mono text-xs text-ase-muted">{f.slug}</span>
              </span>
              <Usage f={f} compact />
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300">
                {t('testExecution.workspace.open')}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {frameworks.map((f) => (
        <li key={f.slug}>
          <Link
            to={`/test-execution/${f.slug}`}
            className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/[0.08] via-ase-surface to-violet-500/[0.06] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40 ${FOCUS}`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl transition group-hover:bg-cyan-400/20"
            />
            <div className="relative flex items-start justify-between gap-3">
              <ProductIcon />
              <ArrowRight
                className="h-5 w-5 text-ase-muted transition group-hover:translate-x-0.5 group-hover:text-cyan-300"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
            <div className="relative mt-4 min-w-0">
              <h3 className="text-lg font-semibold leading-snug text-ase-text">{f.title}</h3>
              <p className="mt-0.5 truncate font-mono text-xs text-ase-muted">{f.slug}</p>
            </div>
            <div className="relative mt-5 border-t border-white/[0.07] pt-4">
              <Usage f={f} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
