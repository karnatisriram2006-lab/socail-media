/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#F5F2EF',
          100: '#E8E2DA',
          200: '#D5D0CA',
          300: '#B8A99E',
          400: '#927C6E',
          500: '#6D5040',
          600: '#5A4235',
          700: '#4A352A',
          800: '#342218',
          900: '#20120B',
          950: '#120709',
        },
        brand: '#6D5040',
        accent: '#927C6E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft':     '0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)',
        'soft-lg':  '0 10px 40px -10px rgba(0,0,0,0.1)',
        'soft-xl':  '0 20px 60px -15px rgba(0,0,0,0.12)',
        'glow':     '0 0 20px rgba(109,80,64,0.15)',
        'glow-lg':  '0 0 40px rgba(109,80,64,0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'fade-in-up':    'fadeInUp 0.5s ease-out forwards',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'slide-down':    'slideDown 0.3s ease-out forwards',
        'slide-left':    'slideLeft 0.3s ease-out forwards',
        'scale-in':      'scaleIn 0.2s ease-out forwards',
        'pulse-soft':    'pulseSoft 3s ease-in-out infinite',
        'shimmer':       'shimmer 2s linear infinite',
        'float':         'float 6s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 0.5s ease-out',
        'marquee':       'marquee 30s linear infinite',
        'pulse-slow':    'pulseSoft 4s ease-in-out infinite',
        'spin-slow':     'spin 8s linear infinite',
        'spin-slower':   'spin 12s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%':   { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-warm':  'linear-gradient(135deg, #6D5040, #927C6E)',
        'gradient-deep':  'linear-gradient(135deg, #120709, #342218)',
        'gradient-light': 'linear-gradient(135deg, #D5D0CA, #FFFFFF)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
};