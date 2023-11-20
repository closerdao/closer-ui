/* eslint-disable @typescript-eslint/no-var-requires */
const theme = require('./theme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: true,
  theme,
  variants: {
    extend: {
      display: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')],
  safelist: [
    {
      pattern: /bg-(failure|pending|success)/,
    }
  ]
};
