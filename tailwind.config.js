module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Satoshi', 'Helvetica', 'Sans-Serif'],
        'sans': ['Satoshi', 'Helvetica', 'Sans-Serif']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
