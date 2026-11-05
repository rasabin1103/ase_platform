import type { ConsultingAccent } from '../../../i18n/consultingPage.locale'

/** Colores en bruto (r,g,b) para degradados, bordes y brillos de las capas. */
export const ACCENT_RGB: Record<ConsultingAccent, { base: string; light: string }> = {
  sky: { base: '56,189,248', light: '186,230,253' },
  emerald: { base: '52,211,153', light: '167,243,208' },
  amber: { base: '251,191,36', light: '253,230,138' },
  violet: { base: '167,139,250', light: '221,214,254' },
}

export const ACCENTS: Record<
  ConsultingAccent,
  { plane: string; active: string; tag: string; dot: string; ring: string; num: string }
> = {
  sky: {
    plane: 'border-sky-300/25 bg-gradient-to-br from-sky-400/20 to-sky-500/5',
    active: 'border-sky-300/80 from-sky-400/45 to-sky-500/15 shadow-[0_0_50px_-8px_rgba(56,189,248,0.7)]',
    tag: 'text-sky-200',
    dot: 'bg-sky-300',
    ring: 'border-sky-300/50 bg-sky-400/10',
    num: 'text-sky-300',
  },
  emerald: {
    plane: 'border-emerald-300/25 bg-gradient-to-br from-emerald-400/20 to-emerald-500/5',
    active:
      'border-emerald-300/80 from-emerald-400/45 to-emerald-500/15 shadow-[0_0_50px_-8px_rgba(52,211,153,0.7)]',
    tag: 'text-emerald-200',
    dot: 'bg-emerald-300',
    ring: 'border-emerald-300/50 bg-emerald-400/10',
    num: 'text-emerald-300',
  },
  amber: {
    plane: 'border-amber-300/25 bg-gradient-to-br from-amber-400/20 to-amber-500/5',
    active: 'border-amber-300/80 from-amber-400/45 to-amber-500/15 shadow-[0_0_50px_-8px_rgba(251,191,36,0.7)]',
    tag: 'text-amber-200',
    dot: 'bg-amber-300',
    ring: 'border-amber-300/50 bg-amber-400/10',
    num: 'text-amber-300',
  },
  violet: {
    plane: 'border-violet-300/25 bg-gradient-to-br from-violet-400/20 to-violet-500/5',
    active:
      'border-violet-300/80 from-violet-400/45 to-violet-500/15 shadow-[0_0_50px_-8px_rgba(167,139,250,0.7)]',
    tag: 'text-violet-200',
    dot: 'bg-violet-300',
    ring: 'border-violet-300/50 bg-violet-400/10',
    num: 'text-violet-300',
  },
}
