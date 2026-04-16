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
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
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
