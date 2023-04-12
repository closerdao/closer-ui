/* eslint-disable @typescript-eslint/no-var-requires */
const closerTheme = require('closer/theme');
const defaultTheme = require('tailwindcss/defaultTheme');

const tdfTheme = {
  extend: {
    ...closerTheme.extend,
    colors: {
      ...closerTheme.extend.colors,
      primary: '#FE4FB7',
      'primary-light': '#FFC8E9',
      secondary: '#52FFB8',
      neutral: '#F0F0F0',
      light: '#9C9C9C',
      complimentary: '#333333',
      divider: '#D1D1D1',
      'secondary-light': '#D4FFED',
      background: '#ffffff',
      'background-dark': '#1c1c1c',
      foreground: '#1c1c1c',
      'foreground-dark': '#dadada',
      card: '#ebf1f6',
      error: '#9f1f42',
      line: '#a3a3a3',
    },
    fontFamily: {
      sans: ['Barlow', ...defaultTheme.fontFamily.sans],
      marketing: ['Barlow', ...defaultTheme.fontFamily.sans],
    },
    boxShadow: {
      xl: '0 2px 8px 0 rgb(0 0 0 / 0.12)',
    },
  },
  plugins: [],
};

module.exports = tdfTheme;
