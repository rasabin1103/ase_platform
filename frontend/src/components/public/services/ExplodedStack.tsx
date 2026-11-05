import type { LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { ConsultingAccent } from '../../../i18n/consultingPage.locale'
import { cn } from '../../ui/cn'
import { ACCENT_RGB } from './accents'

export interface StackLayerView {
  tag: string
  title: string
  accent: ConsultingAccent
  icon: LucideIcon
}

/**
 * Todo se mide en cqw (ancho del contenedor) para que el conjunto escale.
 * Lienzo 5:4 → alto = 80cqw. La pila ocupa la columna izquierda (68cqw, centro
 * en x = 34cqw) y las anotaciones salen a la derecha con una línea guía.
 */
const CENTER_X = 34
const CENTER_Y = 40
const PLANE = 34
const THICKNESS = 0.9
const TILT_X = 72
const TILT_Z = -34
const SIN_TILT = Math.sin((TILT_X * Math.PI) / 180)

const CORNERS = [
  'left-2.5 top-2.5 border-l-2 border-t-2 rounded-tl-md',
  'right-2.5 top-2.5 border-r-2 border-t-2 rounded-tr-md',
  'bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl-md',
  'bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br-md',
]

/**
 * Vista explosionada tipo plano técnico: losas de cristal con un icono por
 * capa y, a la derecha, una anotación (etiqueta + título) unida por una línea
 * guía. La apertura depende de la variable CSS `--p` heredada (0 = juntas,
 * 1 = explosionadas). Es decorativa (aria-hidden): el texto accesible va en la
 * lista de al lado.
 */
export function ExplodedStack({
  layers,
  active,
  eased,
  className,
  style,
}: {
  layers: StackLayerView[]
  active: number
  /** Transición suave de la apertura (hero); en escenas de scroll va a pelo. */
  eased?: boolean
  className?: string
  style?: CSSProperties
}) {
  const n = layers.length
  const gap = n >= 5 ? 15 : 18
  const glow = ACCENT_RGB[layers[Math.max(active, 0)]?.accent ?? layers[0].accent].base
  const ease = eased ? 'transition-[transform,top,border-color,box-shadow,background,opacity] duration-[1100ms] ease-out' : ''

  return (
    <div
      aria-hidden
      className={cn('relative mx-auto aspect-[5/4] w-full max-w-[720px]', className)}
      style={{ containerType: 'inline-size', ...style }}
    >
      <div
        className="absolute rounded-full opacity-80 blur-3xl transition-colors duration-500"
        style={{
          left: `${CENTER_X}cqw`,
          top: `${CENTER_Y}cqw`,
          width: '56cqw',
          height: '30cqw',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(closest-side, rgba(${glow},0.26), transparent)`,
        }}
      />
      <div
        className="absolute border-l border-dashed border-white/20"
        style={{
          left: `${CENTER_X}cqw`,
          top: `${CENTER_Y}cqw`,
          transform: 'translateY(-50%)',
          height: `calc(var(--p, 1) * ${((n - 1) * gap * SIN_TILT).toFixed(2)}cqw)`,
        }}
      />

      <div className="absolute inset-y-0 left-0" style={{ width: `${CENTER_X * 2}cqw` }}>
        <div
          className={cn('absolute inset-0', eased && 'transition-transform duration-[1100ms] ease-out')}
          style={{
            transformStyle: 'preserve-3d',
            transform: `rotateX(${TILT_X}deg) rotateZ(${TILT_Z}deg) translateZ(calc(var(--p, 1) * ${(-(n - 1) * gap) / 2}cqw))`,
          }}
        >
          {layers.map((layer, i) => {
            const c = ACCENT_RGB[layer.accent]
            const on = i === active
            const Icon = layer.icon
            return (
              <div
                key={layer.title}
                className={cn(
                  'absolute rounded-[1.4rem] border transition-[border-color,box-shadow,background] duration-300',
                  eased && ease,
                )}
                style={{
                  left: `calc(50% - ${PLANE / 2}cqw)`,
                  top: `calc(50% - ${PLANE / 2}cqw)`,
                  width: `${PLANE}cqw`,
                  height: `${PLANE}cqw`,
                  transformStyle: 'preserve-3d',
                  transform: `translateZ(calc(${(i * THICKNESS).toFixed(2)}cqw + var(--p, 1) * ${(i * gap).toFixed(2)}cqw))`,
                  transitionDelay: eased ? `${i * 70}ms` : undefined,
                  borderColor: `rgba(${on ? c.light : c.base},${on ? 0.9 : 0.3})`,
                  background: on
                    ? `linear-gradient(145deg, rgba(${c.base},0.5), rgba(${c.base},0.14) 60%, rgba(${c.base},0.3))`
                    : `linear-gradient(145deg, rgba(${c.base},0.26), rgba(${c.base},0.05) 60%, rgba(${c.base},0.14))`,
                  boxShadow: on
                    ? `0 0 60px -6px rgba(${c.base},0.75), inset 0 1px 0 rgba(255,255,255,0.4)`
                    : `inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 40px rgba(${c.base},0.08)`,
                }}
              >
                <span
                  className="absolute inset-0 rounded-[1.4rem]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '8% 8%',
                    WebkitMaskImage: 'radial-gradient(closest-side, #000 40%, transparent)',
                    maskImage: 'radial-gradient(closest-side, #000 40%, transparent)',
                  }}
                />
                {CORNERS.map((pos) => (
                  <i
                    key={pos}
                    className={cn('absolute h-[7%] w-[7%]', pos)}
                    style={{ borderColor: `rgba(${c.light},0.7)` }}
                  />
                ))}
                <span
                  className="absolute left-1/2 top-1/2 grid place-items-center rounded-2xl border"
                  style={{
                    width: '9cqw',
                    height: '9cqw',
                    transform: `translate(-50%, -50%) translateZ(2px) rotateZ(${-TILT_Z}deg) rotateX(${-TILT_X}deg)`,
                    borderColor: `rgba(${c.light},${on ? 0.85 : 0.45})`,
                    background: `rgba(${c.base},${on ? 0.45 : 0.2})`,
                    boxShadow: `0 0 28px rgba(${c.base},${on ? 0.7 : 0.35})`,
                    color: `rgb(${on ? '255,255,255' : c.light})`,
                  }}
                >
                  <Icon style={{ width: '4.8cqw', height: '4.8cqw' }} strokeWidth={1.6} />
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {layers.map((layer, i) => {
        const c = ACCENT_RGB[layer.accent]
        const on = i === active
        const y = `calc(${CENTER_Y - SIN_TILT * i * THICKNESS}cqw - var(--p, 1) * ${(SIN_TILT * (i * gap - ((n - 1) * gap) / 2)).toFixed(2)}cqw)`
        return (
          <div
            key={layer.title}
            className={cn('absolute left-0 right-0', eased && 'transition-[top] duration-[1100ms] ease-out')}
            style={{ top: y, transitionDelay: eased ? `${i * 70}ms` : undefined }}
          >
            <span
              className="absolute h-px"
              style={{
                left: `${CENTER_X + 5.5}cqw`,
                width: `${65 - CENTER_X - 5.5}cqw`,
                background: `linear-gradient(90deg, rgba(${c.light},${on ? 0.9 : 0.4}), rgba(${c.light},${on ? 0.6 : 0.15}))`,
              }}
            />
            <span
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: '65cqw',
                background: `rgb(${c.light})`,
                boxShadow: `0 0 10px rgba(${c.base},0.9)`,
              }}
            />
            <div
              className="absolute -translate-y-1/2 pl-[1.2cqw] transition-opacity duration-300"
              style={{ left: '66cqw', width: '33cqw', opacity: active < 0 || on ? 1 : 0.55 }}
            >
              <span
                className="block font-semibold uppercase tracking-[0.18em]"
                style={{ fontSize: 'clamp(9px, 1.9cqw, 11px)', color: `rgb(${c.light})` }}
              >
                {layer.tag}
              </span>
              <span
                className={cn('mt-0.5 block font-display font-semibold leading-tight', on ? 'text-white' : 'text-ase-text')}
                style={{ fontSize: 'clamp(11px, 2.9cqw, 16px)' }}
              >
                {layer.title}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
