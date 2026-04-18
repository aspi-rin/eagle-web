/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Disable preflight to avoid conflicts with Naive UI's base styles
  corePlugins: {
    preflight: false,
  },
};
