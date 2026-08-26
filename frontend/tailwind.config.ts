import type { Config } from 'tailwindcss'

const brand = {
  DEFAULT: '#38BDF8',
  strong: '#0EA5E9',
} as const

// Secondary accent — reserved for the single "premium/featured" moment
// (recommended plan, standout CTA). Everything else stays on brand cyan
// on purpose: one deliberate second color, not a rainbow of accents.
const gold = {
  DEFAULT: '#E8B368',
  strong: '#D89A3E',
} as const

const neutrals = {
  ink: '#020617',
  slate: '#0F172A',
  graphite: '#111827',
  ash: '#1E293B',
  // WCAG AA requires >=4.5:1 for normal text; the previous #64748B only
  // cleared ~3.1-4.2:1 against our dark surfaces. #94A3B8 (slate-400) keeps
  // the same muted-gray intent while clearing >=5.7:1 on every ase-bg*/ase-surface* tone.
  fog: '#94A3B8',
  mist: '#CBD5E1',
  chalk: '#F8FAFC',
  line: '#334155',
} as const

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['"Public Sans Variable"', 'Public Sans', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-xl': ['3.75rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-xl': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        'heading-md': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65' }],
        'body-md': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55' }],
        label: ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.14em' }],
        caption: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'data-lg': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        'data-md': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0' }],
        'data-sm': ['0.75rem', { lineHeight: '1.35', letterSpacing: '0.04em' }],
      },
      spacing: {
        'ase-2xs': '0.125rem',
        'ase-xs': '0.25rem',
        'ase-sm': '0.5rem',
        'ase-md': '0.75rem',
        'ase-lg': '1rem',
        'ase-xl': '1.5rem',
        'ase-2xl': '2rem',
        'ase-3xl': '3rem',
        'ase-4xl': '4rem',
        'ase-5xl': '5rem',
        'ase-section': '6rem',
      },
      borderRadius: {
        'ase-sm': '0.5rem',
        'ase-md': '0.75rem',
        'ase-lg': '1rem',
        'ase-xl': '1.25rem',
        'ase-2xl': '1.5rem',
        'ase-pill': '9999px',
      },
      colors: {
        ase: {
          brand,
          // Legacy aliases — prefer `brand` for new work
          primary: brand.DEFAULT,
          primaryStrong: brand.strong,
          accent: brand.DEFAULT,
          gold,
          // Neutrals
          bg: neutrals.ink,
          bg2: neutrals.slate,
          surface: neutrals.graphite,
          surfaceSoft: neutrals.ash,
          text: neutrals.chalk,
          text2: neutrals.mist,
          muted: neutrals.fog,
          border: neutrals.line,
          ink: neutrals.ink,
          slate: neutrals.slate,
          graphite: neutrals.graphite,
          ash: neutrals.ash,
          fog: neutrals.fog,
          mist: neutrals.mist,
          chalk: neutrals.chalk,
          line: neutrals.line,
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      boxShadow: {
        soft: '0 1px 0 rgba(255,255,255,0.04), 0 12px 32px rgba(0,0,0,0.45)',
        brand: '0 0 18px rgba(56, 189, 248, 0.28)',
        'brand-sm': '0 0 12px rgba(56, 189, 248, 0.18)',
        // Shared "premium" glow shadows — same visual language as the
        // admin dashboard's application map (ApplicationMapTree.tsx),
        // reused on public-facing pages (Home, Plans, Blog) so the first
        // customer touchpoints share that finish instead of it being an
        // admin-only flourish.
        'glow-cyan': '0 0 40px rgba(56, 189, 248, 0.22)',
        'glow-gold': '0 0 40px rgba(232, 179, 104, 0.22)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        capGlow: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
        capFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'cap-glow': 'capGlow 4.5s ease-in-out infinite',
        'cap-float': 'capFloat 6s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
        'glow-pulse': 'glowPulse 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
