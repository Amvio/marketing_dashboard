/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
      colors: {
        'primary-blue': '#3b54a5',
        'secondary-blue': '#2d4085',
        'tertiary-blue': '#1f2d5f',
      },
  },
  plugins: [],
};
