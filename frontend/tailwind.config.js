/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          900: 'rgb(var(--c-ink-900) / <alpha-value>)',
          700: 'rgb(var(--c-ink-700) / <alpha-value>)',
          500: 'rgb(var(--c-ink-500) / <alpha-value>)'
        },
        parchment: {
          DEFAULT: 'rgb(var(--c-bg) / <alpha-value>)',
          100: 'rgb(var(--c-surface) / <alpha-value>)',
          200: 'rgb(var(--c-surface-2) / <alpha-value>)'
        },
        brass: {
          DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)',
          light: 'rgb(var(--c-primary-light) / <alpha-value>)',
          dark: 'rgb(var(--c-primary-dark) / <alpha-value>)'
        },
        coral: 'rgb(var(--c-coral) / <alpha-value>)',
        seal: {
          winner: 'rgb(var(--c-winner) / <alpha-value>)',
          finalist: 'rgb(var(--c-finalist) / <alpha-value>)',
          participant: 'rgb(var(--c-participant) / <alpha-value>)',
          completion: 'rgb(var(--c-completion) / <alpha-value>)'
        },
        border: 'rgb(var(--c-border) / <alpha-value>)'
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      borderRadius: {
        card: '16px'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } }
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.18s ease-out',
        shimmer: 'shimmer 1.6s infinite linear'
      }
    }
  },
  plugins: []
};
