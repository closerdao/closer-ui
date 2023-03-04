const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/pages/**/*.{js,ts,jsx,tsx}',
    '../../packages/closer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      ...closerTheme.extend,
      colors: {
        ...closerTheme.extend.colors,
        primary: '#e4427d',//FE4FB7
        secondary: '#1b3bc3',
        background: '#F8FAFC',
        'background-dark': '#1c1c1c',
        foreground: '#1c1c1c',
        'foreground-dark': '#dadada',
        card: '#ebf1f6',
        error: '#9f1f42',
        line: '#a3a3a3',
      },
      fontFamily: {
        sans: ['Barlow', ...defaultTheme.fontFamily.sans],
      },
    },
    plugins: [],
  },
};
