const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');
const prettier = require('eslint-config-prettier');
const turbo = require('eslint-config-turbo/flat').default;
const globals = require('globals');
const unusedImports = require('eslint-plugin-unused-imports');

module.exports = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...turbo,
  prettier,
  {
    plugins: { 'unused-imports': unusedImports },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        NodeJS: true,
      },
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
      'object-curly-spacing': ['error', 'always'],
      'no-undef': 'error',
      'react/display-name': 'off', // https://reactjs.org/docs/react-component.html#displayname
      'no-html-link-for-pages': 'off',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      // shortcut: react-hooks 7 React Compiler rules (~320 hits) are off; enable when adopting the compiler.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/globals': 'off',
    },
  },
];
