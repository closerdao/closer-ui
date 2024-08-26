/* eslint-disable @typescript-eslint/no-var-requires */
const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

const tdfTheme = {
  
  extend: {
    ...closerTheme.extend, 
    colors: {
      ...closerTheme.extend.colors,
      'accent-core': '#FE4FB7',
      'accent-light': '#FFC8E9',
      dominant: '#ffffff',
      complimentary: '#000000',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      accent: '#FE4FB7',
      'accent-dark': '#E748A7',
      'accent-medium': '#FFC8E9',
      'accent-light': '#FFEDF8',
      'accent-alt': '#42CC93',
      'accent-alt-dark': '#42CC93',
      'accent-alt-medium': '#97FFD4',
      'accent-alt-light': '#D4FFED',
      // system colors belong to closer
      // TODO: decide with Daneel about brand color system
      neutral: '#F8F3F5', //disabled button bg
      'neutral-light': '#FDF9FB',
      'neutral-dark': '#F0F0F0',
      // these colors are not suppoerted anymore, please use those above
      'disabled': '#9C9C9C', //disabled button text and border
      primary: '#FE4FB7',
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
