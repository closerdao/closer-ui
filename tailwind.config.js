const theme = require('./theme');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: true,
  theme: Object.assign(
    {},
    {
      extend: {
        colors: {
          primary: '#e4427d',
          secondary: '#1b3bc3',
          background: '#F8FAFC',
          foreground: '#1c1c1c',
          card: '#e7e6e6',
          error: '#9f1f42',
          line: '#a3a3a3',
        },
      },
    },
    theme,
  ),
  variants: {
    extend: {
      display: ['group-hover'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
