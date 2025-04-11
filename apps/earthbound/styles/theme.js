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
      dominant: '#FFF6E9',
      complimentary: '#000000',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      accent: '#205C66',
      'accent-dark': '#4a770c',
      'accent-medium': '#FFC8E9',
      'accent-light': '#f9d7c5',
      'accent-alt': '#AF8F2E',
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
      background: '#FFF6E9',
      'background-dark': '#1c1c1c',
      foreground: '#3E6149',
      'foreground-dark': '#dadada',
      card: '#ebf1f6',
      error: '#9f1f42',
      line: '#a3a3a3',
    },
    fontFamily: {
      sans: ['var(--font-raleway)'],
    },
  },
  plugins: [],
};

module.exports = tdfTheme;
