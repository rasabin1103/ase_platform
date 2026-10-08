/** Estilos compartidos de las cabeceras del admin (ver PremiumHero). */
export const HERO_ACCENTS = {
  cyan: { eyebrow: 'text-sky-300', line: 'bg-sky-400/60', halo: 'bg-ase-brand/25' },
  violet: { eyebrow: 'text-violet-300', line: 'bg-violet-400/60', halo: 'bg-violet-500/20' },
  emerald: { eyebrow: 'text-emerald-300', line: 'bg-emerald-400/60', halo: 'bg-emerald-500/15' },
  amber: { eyebrow: 'text-amber-300', line: 'bg-amber-400/60', halo: 'bg-amber-400/15' },
} as const

/** Clases compartidas de la cabecera de página del admin (también para cabeceras a medida). */
export const ADMIN_HERO_SECTION =
  'relative isolate overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/80 p-6 shadow-soft md:p-8'
export const ADMIN_HERO_TITLE = 'max-w-4xl font-display text-3xl font-semibold leading-tight text-ase-text md:text-4xl'
export const ADMIN_HERO_SUBTITLE = 'mt-3 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base'

