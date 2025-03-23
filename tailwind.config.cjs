import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        calculatorBtn: 'transparent',
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // children
      addVariant('ch', '& > *');
      addVariant('direct-first-child', '& > :first-child');
    }),
  ],
};
