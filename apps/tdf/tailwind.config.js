/* eslint-disable @typescript-eslint/no-var-requires */
const tdfTheme = require('./styles/theme');
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/pages/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: tdfTheme,
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('react-widgets-tailwind'),
  ],
};
