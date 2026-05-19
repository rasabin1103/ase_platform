import { cn } from '../ui/cn'

import logoIcon from '../../assets/brand/logo-icon.svg'
import logoHorizontal from '../../assets/brand/logo-horizontal.svg'
import logoMonochrome from '../../assets/brand/logo-monochrome.svg'
import logoDark from '../../assets/brand/logo-dark.svg'

export type BrandLogoVariant = 'icon' | 'horizontal' | 'monochrome' | 'dark'
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'

export type BrandLogoProps = {
  variant: BrandLogoVariant
  size: BrandLogoSize
  showText?: boolean
  className?: string
}

const heightBySize: Record<BrandLogoSize, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
}

function srcByVariant(variant: BrandLogoVariant): string {
  switch (variant) {
    case 'icon':
      return logoIcon
    case 'monochrome':
      return logoMonochrome
    case 'dark':
      return logoDark
    case 'horizontal':
    default:
      return logoHorizontal
  }
}

function altByVariant(variant: BrandLogoVariant): string {
  switch (variant) {
    case 'icon':
      return 'ASE'
    case 'monochrome':
      return 'Arce Sabin Engineering (monochrome)'
    case 'dark':
      return 'Arce Sabin Engineering'
    case 'horizontal':
    default:
      return 'Arce Sabin Engineering'
  }
}

export function BrandLogo({ variant, size, showText, className }: BrandLogoProps) {
  const h = heightBySize[size]
  const isIcon = variant === 'icon'

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={srcByVariant(variant)}
        alt={altByVariant(variant)}
        className={cn(
          h,
          'w-auto select-none object-contain',
          // Subtle premium glow (kept very light)
          'drop-shadow-[0_0_18px_rgba(56,189,248,0.12)]',
          isIcon && 'rounded-xl',
        )}
        draggable={false}
        decoding="async"
        loading="eager"
      />
      {showText ? (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ase-text">Arce Sabin Engineering</div>
          <div className="mt-0.5 text-xs text-ase-muted">Enterprise dashboard</div>
        </div>
      ) : null}
    </div>
  )
}

