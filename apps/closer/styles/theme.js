/* eslint-disable @typescript-eslint/no-var-requires */
const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

const tdfTheme = {
  extend: {
    ...closerTheme.extend,
    colors: {
      ...closerTheme.extend.colors,
      'accent-core': '#E86B28',
      'accent-light': '#F2DBB9',
      dominant: '#FFFFFF',
      complimentary: '#000000',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      accent: '#5290DB',
      'accent-dark': '#4a770c',
      'accent-medium': '#FFC8E9',
      'accent-light': '#E7FFF5',
      'accent-alt': '#79FAC1',
      'accent-alt-dark': '#42CC93',
      'accent-alt-medium': '#97FFD4',
      'accent-alt-light': '#D4FFED',
      // system colors belong to closer
      // TODO: decide with Daneel about brand color system
      neutral: '#f0f0ee', //disabled button bg
      'neutral-light': '#FDF9FB',

      // 'neutral-dark': '#EDE8EB' ,
      'neutral-dark': '#F0F0F0',
      // these colors are not suppoerted anymore, please use those above
      disabled: '#9C9C9C', //disabled button text and border
      primary: '#6fb600',
      secondary: '#1b3bc3',
      background: '#FFFFFF',
      'background-dark': '#1c1c1c',
      foreground: '#222222',
      'foreground-dark': '#dadada',
      card: '#ebf1f6',
      error: '#9f1f42',
      line: '#a3a3a3',
    },
    fontFamily: {
      sans: ['var(--font-inter)'],
    },
  },
  plugins: [],
};

module.exports = tdfTheme;
