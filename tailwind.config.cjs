const plugin = require('tailwindcss/plugin');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        calculatorBtn: 'rgb(18, 129, 185)',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      // children
      addVariant('ch', '& > *');
    }),
  ],
};
