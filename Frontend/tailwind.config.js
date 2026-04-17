/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-highlight': {
          '0%':   { backgroundColor: 'rgba(12, 102, 228, 0.18)' },
          '60%':  { backgroundColor: 'rgba(12, 102, 228, 0.08)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.2s ease-out',
        'fade-highlight': 'fade-highlight 3s ease-out forwards',
      },
      colors: {
        trello: {
          blue: '#0052CC',
          navy: '#1D2125',
          sidebar: '#1D2125',
          card: '#22272B',
          list: '#101204',
          surface: '#2C333A',
        }
      }
    }
  },
  plugins: []
}
