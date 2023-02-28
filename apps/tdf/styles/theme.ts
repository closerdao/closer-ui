import { theme as closerTheme } from 'closer';
import defaultTheme from 'tailwindcss/defaultTheme';

const tdfTheme = {
  extend: {
    ...closerTheme.extend,
    colors: {
      ...closerTheme.extend.colors,
      primary: '#e4427d',
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
};

export default tdfTheme;
