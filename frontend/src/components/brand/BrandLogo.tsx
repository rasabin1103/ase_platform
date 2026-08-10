import { cn } from '../ui/cn'

import aseLogo from '../../assets/ase-logo.png'

export type BrandLogoVariant = 'icon' | 'horizontal' | 'monochrome' | 'dark'
export type BrandLogoSize = 'sm' | 'md' | 'lg' | 'xl'

export type BrandLogoProps = {
  variant: BrandLogoVariant
  size: BrandLogoSize
  showText?: boolean
  /** Optional secondary line under the brand name (e.g. "Enterprise dashboard"). */
  subtitle?: string
  className?: string
}

const heightBySize: Record<BrandLogoSize, string> = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-16',
}

export function BrandLogo({ variant, size, showText, subtitle, className }: BrandLogoProps) {
  const h = heightBySize[size]

  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <img
        src={aseLogo}
        alt="Arce Sabin Engineering"
        className={cn(h, 'w-auto select-none object-contain', variant === 'monochrome' && 'grayscale')}
        draggable={false}
        decoding="async"
        loading="eager"
      />
      {showText ? (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-ase-text">Arce Sabin Engineering</div>
          {subtitle ? <div className="mt-0.5 truncate text-xs text-ase-muted">{subtitle}</div> : null}
        </div>
      ) : null}
    </div>
  )
}
