/* eslint-disable @typescript-eslint/no-var-requires */
const buildAppTheme = require('./styles/theme');
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/pages/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/components/**/*.{js,ts,jsx,tsx}',
    // Shared class strings (constants/formStyles.ts) live outside components,
    // and a class Tailwind never reads is a class it never generates.
    '../../packages/closer/constants/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/utils/**/*.{js,ts,jsx,tsx}',
  ],
  // Called per evaluation so a re-synced colour is picked up without a restart.
  theme: buildAppTheme(),
  plugins: [require('@tailwindcss/line-clamp')],
  safelist: [
    {
      pattern: /bg-(failure|pending|success)/,
    }
  ]
};
