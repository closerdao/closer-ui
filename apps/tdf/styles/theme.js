const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

const tdfTheme = {
  extend: {
    ...closerTheme.extend,
    colors: {
      ...closerTheme.extend.colors,
      dominant: '#ffffff',
      complimentary: '#000000',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      accent: '#FE4FB7',
      'accent-dark': '#E748A7',
      'accent-medium': '#FFC8E9',
      'accent-light': '#FFEDF8',
      'accent-alt': '#52FFB8',
      'accent-alt-dark': '#42CC93',
      'accent-alt-medium': '#97FFD4',
      'accent-alt-light': '#D4FFED',
      // these colors are not suppoerted anymore, please use those above
      primary: '#e4427d',
      secondary: '#1b3bc3',
      background: '#fff',
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
};

module.exports = tdfTheme;
