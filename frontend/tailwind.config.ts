import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
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
        soft: '0 1px 0 rgba(255,255,255,0.04), 0 12px 32px rgba(0,0,0,0.45)',
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

