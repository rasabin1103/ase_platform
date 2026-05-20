import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ase: {
          bg: '#020617',
          bg2: '#0F172A',
          surface: '#111827',
          surfaceSoft: '#1E293B',
          primary: '#38BDF8',
          primaryStrong: '#0EA5E9',
          accent: '#22D3EE',
          text: '#F8FAFC',
          text2: '#CBD5E1',
          muted: '#64748B',
          border: '#334155',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
      boxShadow: {
        /** Default card / panel depth */
        soft: '0 1px 0 rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.35)',
        /** Primary actions — subtle lift, minimal chroma glow */
        ase: '0 1px 0 rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.04)',
        'ase-lg': '0 1px 0 rgba(255,255,255,0.07), 0 16px 48px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      transitionDuration: {
        ase: '180ms',
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
      },
      animation: {
        'cap-glow': 'capGlow 4.5s ease-in-out infinite',
        'cap-float': 'capFloat 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

