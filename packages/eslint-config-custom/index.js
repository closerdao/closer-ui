module.exports = {
  parser: '@typescript-eslint/parser',
  env: {
    es6: true,
    jest: true,
  },
  extends: [
    'next',
    'next/core-web-vitals',
    'turbo',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  plugins: ['unused-imports', '@typescript-eslint'],
  rules: {
    'unused-imports/no-unused-imports': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@next/next/no-img-element': 'off',
    'react-hooks/exhaustive-deps': 'off',
    quotes: ['error', 'single'],
    'object-curly-spacing': ['error', 'always'],
    'no-undef': 'error',
    'react/display-name': 'off', // https://reactjs.org/docs/react-component.html#displayname
    'no-html-link-for-pages': 'off',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': 'warn',
  },
  globals: {
    NodeJS: true,
  },
};
