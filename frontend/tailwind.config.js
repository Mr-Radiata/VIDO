/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0B10',
          900: '#0F1014',
          800: '#15171E',
          700: '#1A1C23',
          600: '#22252E',
          500: '#2B2E38',
        },
        gold: {
          200: '#FCECAE',
          300: '#F5D77A',
          400: '#F4C430',
          500: '#FFD700',
          600: '#D9A916',
          700: '#B8860B',
        },
        neon: {
          cyan: '#3FE0E0',
          blue: '#5B8CFF',
          purple: '#A855F7',
          violet: '#7C3AED',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 18px rgba(255, 215, 0, 0.45), 0 0 40px rgba(255, 215, 0, 0.12)',
        'gold-lg': '0 0 30px rgba(255, 215, 0, 0.55), 0 0 70px rgba(255, 215, 0, 0.18)',
        cyan: '0 0 18px rgba(63, 224, 224, 0.45), 0 0 40px rgba(63, 224, 224, 0.12)',
        purple: '0 0 18px rgba(168, 85, 247, 0.45), 0 0 40px rgba(168, 85, 247, 0.14)',
        card: '0 8px 30px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'vido-radial': 'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.15), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,215,0,0.10), transparent 35%), radial-gradient(circle at 50% 100%, rgba(63,224,224,0.08), transparent 40%)',
        'gold-purple': 'linear-gradient(90deg, #FFD700 0%, #F4C430 35%, #A855F7 100%)',
        'gold-cyan': 'linear-gradient(90deg, #FFD700 0%, #3FE0E0 100%)',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.55 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
