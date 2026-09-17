/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef0f7',
          100: '#d5daf0',
          200: '#b0bae0',
          300: '#8a9bd0',
          400: '#637bbf',
          500: '#3d5aab',
          600: '#2c4a8c',
          700: '#1e3575',
          800: '#152660',
          900: '#0d1a45',
        },
        gold: {
          200: '#f5e4a8',
          300: '#efd080',
          400: '#d4a853',
          500: '#b8922a',
          600: '#9a7820',
        },
        parchment: {
          50: '#fdfbf7',
          100: '#f5f0e6',
          200: '#ece4d0',
          300: '#ddd4bc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
