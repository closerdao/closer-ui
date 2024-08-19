/* eslint-disable @typescript-eslint/no-var-requires */
const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

const tdfTheme = {
  extend: {
    ...closerTheme.extend,
    colors: {
      ...closerTheme.extend.colors,
      'accent-core': '#6B52F4',
      'accent-light': '#D3C8FF',
      dominant: '#ffffff',
      complimentary: '#000000',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      accent: '#6B52F4',
      'accent-dark': '#368e2f',
      'accent-medium': '#368e2f',
      'accent-light': '#D3C8FF',
      'accent-alt': '#52FFB8',
      'accent-alt-dark': '#42CC93',
      'accent-alt-medium': '#97FFD4',
      'accent-alt-light': '#D4FFED',
      // system colors belong to closer
      // TODO: decide with Daneel about brand color system
      neutral: '#F8F3F5', //disabled button bg
      'neutral-light': '#FDF9FB',

      // 'neutral-dark': '#EDE8EB' ,
      'neutral-dark': '#F0F0F0',
      // these colors are not suppoerted anymore, please use those above
      disabled: '#9C9C9C', //disabled button text and border
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
