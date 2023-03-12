const tdfTheme = require('./styles/theme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/pages/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: tdfTheme,
};
