import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonClassName, type Size, type Variant } from './buttonStyles'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

/** Texto plano: se trunca con elipsis. Contenido mixto (icono + texto) se
 * alinea en fila; sin esto, el SVG (display:block por el preflight) se
 * colocaba encima del texto. */
function childSpanClass(children: ReactNode) {
  return typeof children === 'string' || typeof children === 'number'
    ? 'min-w-0 truncate'
    : 'inline-flex min-w-0 items-center gap-2 truncate'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  type = 'button',
  children,
  ...props
}: Props) {
  return (
    <button type={type} className={buttonClassName(variant, size, className)} {...props}>
      {leftIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{leftIcon}</span> : null}
      <span className={childSpanClass(children)}>{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{rightIcon}</span> : null}
    </button>
  )
}

type ButtonLinkProps = LinkProps & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

/** A navigation link styled exactly like Button, rendered as a single
 * <a> (via react-router's Link) — not a <button> nested inside an <a>,
 * nor an <a> nested inside a <button>. Use this anywhere a "Button" was
 * previously wrapped in a <Link>/<a> purely for navigation+styling; it
 * fixes the HTML content-model violation (and the duplicate/ambiguous
 * focus stop that came with it) flagged in the frontend accessibility
 * audit for PublicHeader and ContactPage. */
export function ButtonLink({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClassName(variant, size, className)} {...props}>
      {leftIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{leftIcon}</span> : null}
      <span className={childSpanClass(children)}>{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{rightIcon}</span> : null}
    </Link>
  )
}

type ButtonAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant
  size?: Size
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

/** Same idea as ButtonLink, for a plain external/`mailto:`/`tel:` <a> href
 * rather than a react-router route — e.g. ContactPage's "Email us
 * directly" action, previously a <Button> nested inside an <a>. */
export function ButtonAnchor({
  className,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonAnchorProps) {
  return (
    <a className={buttonClassName(variant, size, className)} {...props}>
      {leftIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{leftIcon}</span> : null}
      <span className={childSpanClass(children)}>{children}</span>
      {rightIcon ? <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{rightIcon}</span> : null}
    </a>
  )
}

