/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
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
