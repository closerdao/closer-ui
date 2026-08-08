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
      complimentary: '#262626',
      'complimentary-medium': '#262626',
      'complimentary-light': '#333333',
      // Primary brand colour. Used as a fill (bg-accent) on buttons and CTAs.
      accent: '#3EE08F',
      // Text/icons sitting ON an accent fill — mint is far too light for white.
      'accent-foreground': '#07351F',
      // Hover state for accent fills (the template lifts, rather than darkens).
      'accent-dark': '#5BEBA4',
      'accent-medium': '#FFC8E9',
      'accent-light': '#E7FFF5',
      'accent-alt': '#B2E4EC',
      'accent-alt-dark': '#42CC93',
      'accent-alt-medium': '#97FFD4',
      'accent-alt-light': '#D4FFED',
      neutral: '#f0f0ee',
      'neutral-light': '#FDF9FB',

      // 'neutral-dark': '#EDE8EB',
      'neutral-dark': '#F0F0F0',
      // these colors are not suppoerted anymore, please use those above
      disabled: '#9C9C9C', //disabled button text and border
      primary: '#3EE08F',
      secondary: '#1b3bc3',
      background: '#FFFFFF',
      'background-dark': '#1c1c1c',
      foreground: '#000000',
      'foreground-dark': '#dadada',
      card: '#ebf1f6',
      error: '#9f1f42',
      line: '#a3a3a3',
    },
    fontFamily: {
      // The next/font variables are only defined inside the Layout wrapper, so
      // anything rendered outside it needs a real fallback — without one it
      // lands on the browser default (serif), not the app's sans.
      sans: [
        'var(--font-inter)',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ],
      serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
    },
  },
  plugins: [],
};

module.exports = tdfTheme;
