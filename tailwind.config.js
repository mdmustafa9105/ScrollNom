/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          coral: '#FF5743',
          'coral-dark': '#E64A38',
          gold: '#F2994A',
          'gold-light': '#FFB74D',
          teal: '#1A5B4C',
          'teal-light': '#277D69',
          cream: '#FFFBF2',
          'cream-card': '#F4EFE6',
          'cream-dark': '#EFEADF',
          charcoal: '#1E232A',
          'charcoal-muted': '#4A5568',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fredoka', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 10px 30px -10px rgba(0, 0, 0, 0.08)',
        'floating': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        'coral': '0 8px 25px -5px rgba(255, 87, 67, 0.4)',
        'teal': '0 8px 25px -5px rgba(26, 91, 76, 0.3)',
      },
      keyframes: {
        'scroll-unroll': {
          '0%': { transform: 'scaleX(0.2) scaleY(0.8)', opacity: '0' },
          '50%': { transform: 'scaleX(1.05) scaleY(1.02)', opacity: '0.8' },
          '100%': { transform: 'scaleX(1) scaleY(1)', opacity: '1' }
        },
        'mascot-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'heart-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
          '100%': { transform: 'scale(1)' }
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' }
        }
      },
      animation: {
        'unroll': 'scroll-unroll 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'bounce-mascot': 'mascot-bounce 2s ease-in-out infinite',
        'heart-pop': 'heart-pop 0.35s ease-out forwards',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulse-glow 1.5s infinite',
      }
    },
  },
  plugins: [],
}
