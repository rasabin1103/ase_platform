import { Check } from 'lucide-react'
import { useRef } from 'react'
import type { ConsultingService } from '../../../i18n/consultingPage.locale'
import { cn } from '../../ui/cn'
import { ACCENTS } from './accents'
import { ExplodedStack } from './ExplodedStack'
import { LAYER_ICONS } from './layerIcons'
import { useConsultingCopy } from './useConsultingCopy'
import { useSceneProgress } from './useSceneProgress'

/**
 * Un servicio = una escena. En escritorio la sección es alta y su contenido
 * queda fijo (sticky) mientras el scroll abre las capas una a una; en móvil o
 * con movimiento reducido es un bloque normal con la pila ya abierta.
 */
export function ServiceScene({ service, index }: { service: ConsultingService; index: number }) {
  const ref = useRef<HTMLElement>(null)
  const n = service.layers.length
  const { active, interactive } = useSceneProgress(ref, n)
  const a = ACCENTS[service.accent]
  const copy = useConsultingCopy()

  return (
    <section
      ref={ref}
      id={service.id}
      aria-labelledby={`${service.id}-title`}
      className={cn('scroll-mt-16', index % 2 === 1 && 'bg-ase-bg2/40')}
      style={interactive ? { height: `${n * 38 + 130}vh` } : undefined}
    >
      <div
        className={cn(
          'flex items-center',
          interactive ? 'sticky top-16 h-[calc(100vh-4rem)]' : 'py-16 sm:py-20',
        )}
      >
        <div
          className={cn(
            'mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16',
          )}
        >
          <div className={cn('min-w-0', index % 2 === 1 && 'lg:order-2')}>
            <p className={cn('text-label font-semibold uppercase', a.num)}>{service.eyebrow}</p>
            <h2
              id={`${service.id}-title`}
              className="mt-4 font-display text-3xl font-semibold leading-tight text-ase-text sm:text-4xl"
            >
              {service.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ase-text2">{service.summary}</p>

            <ol className="mt-7 space-y-2.5">
              {service.layers.map((layer, i) => (
                <li
                  key={layer.title}
                  className={cn(
                    'flex gap-3.5 rounded-2xl border px-4 py-3 transition-colors duration-300',
                    active === i ? a.ring : 'border-white/[0.07] bg-white/[0.02]',
                  )}
                >
                  <span className={cn('font-display text-lg font-semibold tabular-nums', a.num)}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ase-text">{layer.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ase-text2">{layer.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{service.outcomesTitle}</p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {service.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2 text-sm text-ase-text2">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', a.num)} aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            {interactive && active < 0 && (
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-ase-muted/80">{copy.scrollHint}</p>
            )}
          </div>

          <div className={cn('min-w-0', index % 2 === 1 && 'lg:order-1')}>
            <ExplodedStack
              active={active}
              layers={service.layers.map((l, i) => ({
                tag: l.tag,
                title: l.title,
                accent: service.accent,
                icon: LAYER_ICONS[service.id][i],
              }))}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
