/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Barlow', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#00B894',
          dark: '#00836a',
          light: '#e8faf5',
        },
        accent: '#E17055',
        accent2: '#0984E3',
      },
    },
  },
  plugins: [],
}
