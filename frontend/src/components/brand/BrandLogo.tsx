import { cn } from '../ui/cn'

import logoSource from '../../assets/brand/logo-source.png'

export type BrandLogoVariant = 'icon' | 'horizontal' | 'monochrome' | 'dark'
export type BrandLogoSize =
  | 'sm'
  | 'md'
  | 'nav'
  | 'sidebar'
  | 'publicNav'
  | 'lg'
  | 'xl'
  | '2xl'

/** Preset layout + sizing for common surfaces (override any field explicitly). */
export type BrandLogoPlacement = 'app-sidebar' | 'public-nav' | 'app-header' | 'footer'

export type BrandLogoProps = {
  placement?: BrandLogoPlacement
  variant?: BrandLogoVariant
  size?: BrandLogoSize
  /** Stronger glow and lift on dark backgrounds (e.g. public header). */
  emphasis?: 'default' | 'strong'
  showText?: boolean
  className?: string
}

const placementPresets: Record<
  BrandLogoPlacement,
  Required<Pick<BrandLogoProps, 'variant' | 'size' | 'emphasis' | 'showText'>>
> = {
  'app-sidebar': { variant: 'horizontal', size: 'sidebar', emphasis: 'strong', showText: false },
  'public-nav': { variant: 'horizontal', size: 'publicNav', emphasis: 'strong', showText: false },
  'app-header': { variant: 'horizontal', size: 'nav', emphasis: 'default', showText: true },
  footer: { variant: 'monochrome', size: 'lg', emphasis: 'strong', showText: false },
}

/** Source artboard (matches logo-source.png). */
const SOURCE_WIDTH = 1024
const SOURCE_HEIGHT = 320
/** Left crop for icon variant (matches legacy logo-icon.svg). */
const ICON_CROP_WIDTH = 340

const heightBySize: Record<BrandLogoSize, string> = {
  sm: 'h-7',
  md: 'h-9',
  nav: 'h-11 sm:h-12',
  /** Full wordmark in app sidebar (w-72). */
  sidebar: 'h-11 w-auto max-w-[12.75rem]',
  /** Main public site navigation — larger than menu text. */
  publicNav:
    'h-[3.75rem] w-auto max-w-[min(100%,18.5rem)] sm:h-[4.35rem] sm:max-w-[21rem] lg:h-[4.65rem] lg:max-w-[22.5rem]',
  lg: 'h-12 sm:h-14',
  xl: 'h-14 sm:h-16',
  '2xl': 'h-16 sm:h-[4.5rem]',
}

const emphasisGlow: Record<'default' | 'strong', string> = {
  default: 'drop-shadow-[0_0_18px_rgba(56,189,248,0.12)]',
  strong:
    'drop-shadow-[0_2px_28px_rgba(56,189,248,0.35)] drop-shadow-[0_0_48px_rgba(34,211,238,0.18)] brightness-[1.12] contrast-[1.08] saturate-[1.06]',
}

const variantImageClass: Record<BrandLogoVariant, string> = {
  icon: '',
  horizontal: '',
  monochrome: 'grayscale contrast-[1.05] brightness-[0.97]',
  dark: 'brightness-110 contrast-105',
}

function altByVariant(variant: BrandLogoVariant): string {
  switch (variant) {
    case 'icon':
      return 'ASE'
    case 'monochrome':
      return 'Arce Sabin Engineering (monochrome)'
    case 'dark':
    case 'horizontal':
    default:
      return 'Arce Sabin Engineering'
  }
}

function BrandLogoImage({
  variant,
  size,
  emphasis = 'default',
  className,
}: {
  variant: BrandLogoVariant
  size: BrandLogoSize
  emphasis?: 'default' | 'strong'
  className?: string
}) {
  const h = heightBySize[size]
  const filter = variantImageClass[variant]
  const glow = emphasisGlow[emphasis]

  if (variant === 'icon') {
    const iconWidthScale = SOURCE_WIDTH / ICON_CROP_WIDTH
    return (
      <div
        className={cn(
          h,
          'relative shrink-0 overflow-hidden rounded-xl',
          'aspect-[340/320]',
          className,
        )}
        style={{ aspectRatio: `${ICON_CROP_WIDTH} / ${SOURCE_HEIGHT}` }}
      >
        <img
          src={logoSource}
          alt={altByVariant(variant)}
          width={SOURCE_WIDTH}
          height={SOURCE_HEIGHT}
          className={cn(
            'absolute left-0 top-0 h-full max-w-none object-cover object-left',
            filter,
            glow,
          )}
          style={{ width: `${iconWidthScale * 100}%` }}
          draggable={false}
          decoding="async"
          loading="eager"
        />
      </div>
    )
  }

  return (
    <img
      src={logoSource}
      alt={altByVariant(variant)}
      width={SOURCE_WIDTH}
      height={SOURCE_HEIGHT}
      className={cn(h, 'w-auto shrink-0 select-none object-contain object-left', filter, glow, className)}
      draggable={false}
      decoding="async"
      loading="eager"
    />
  )
}

export function BrandLogo({
  placement,
  variant: variantProp,
  size: sizeProp,
  emphasis: emphasisProp,
  showText: showTextProp,
  className,
}: BrandLogoProps) {
  const preset = placement ? placementPresets[placement] : null
  const variant = variantProp ?? preset?.variant ?? 'horizontal'
  const size = sizeProp ?? preset?.size ?? 'md'
  const emphasis = emphasisProp ?? preset?.emphasis ?? 'default'
  const showText = showTextProp ?? preset?.showText ?? false

  return (
    <div className={cn('inline-flex min-w-0 items-center gap-3', className)}>
      <BrandLogoImage variant={variant} size={size} emphasis={emphasis} />
      {showText ? (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-ase-text">Arce Sabin Engineering</div>
          <div className="mt-0.5 truncate text-xs text-ase-muted">Enterprise dashboard</div>
        </div>
      ) : null}
    </div>
  )
}
