/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand blues
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Neutral grays
        neutral: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        // Surface and background
        surface: {
          light: '#FFFFFF',
          DEFAULT: '#F8FAFC',
          dark:  '#111827',
        },
        // Status colors
        success: {
          light: '#F0FDF4',
          DEFAULT: '#16A34A',
          dark: '#15803D',
        },
        warning: {
          light: '#FFFBEB',
          DEFAULT: '#D97706',
          dark: '#B45309',
        },
        danger: {
          light: '#FEF2F2',
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
        },
        info: {
          light: '#EFF6FF',
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1.15' }],
        '6xl':  ['3.75rem',  { lineHeight: '1.1' }],
        '7xl':  ['4.5rem',   { lineHeight: '1.05' }],
      },
      borderRadius: {
        'xs':   '0.25rem',
        'sm':   '0.375rem',
        DEFAULT:'0.5rem',
        'md':   '0.625rem',
        'lg':   '0.75rem',
        'xl':   '1rem',
        '2xl':  '1.25rem',
        '3xl':  '1.5rem',
      },
      boxShadow: {
        'xs':  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm':  '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        DEFAULT:'0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        'md':  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)',
        'lg':  '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)',
        'xl':  '0 25px 50px -12px rgb(0 0 0 / 0.15)',
        'card':'0 1px 4px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 8px 24px -4px rgb(0 0 0 / 0.1), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'none': 'none',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        fast: '100ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
      },
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl':'1536px',
      },
    },
  },
  plugins: [],
}
