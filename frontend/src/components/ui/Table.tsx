import type { HTMLAttributes, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'
import { cn } from './cn'

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-xl border border-ase-border bg-ase-surface shadow-soft">
      <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
        <table className={cn('min-w-full w-full text-left text-sm text-ase-text2', className)} {...props} />
      </div>
    </div>
  )
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'sticky top-0 z-10 bg-ase-surface/90 backdrop-blur supports-[backdrop-filter]:bg-ase-surface/70',
        className,
      )}
      {...props}
    />
  )
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('[&>tr:last-child>td]:border-b-0', className)} {...props} />
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150 hover:bg-white/[0.03]',
        'data-[selected=true]:bg-ase-primary/10',
        className,
      )}
      {...props}
    />
  )
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'border-b border-ase-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ase-muted',
        className,
      )}
      {...props}
    />
  )
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-ase-border px-4 py-3 text-ase-text2', className)} {...props} />
}

