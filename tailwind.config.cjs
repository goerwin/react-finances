const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        calculatorBtn: 'transparent',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      // children
      addVariant('ch', '& > *');
      addVariant('direct-first-child', '& > :first-child');
    }),
  ],
};
